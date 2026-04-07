/**
 * SPARES-CHAIN v6.3 — Compliance (Modais de Conformidade, Histórico, Descarte)
 */

// ===== CONFORMIDADE =====
function showComplianceDetails() {
    const content = document.getElementById('complianceContent');

    if (state.nonComplianceList.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #00ff88;">
                <div style="font-size: 64px; margin-bottom: 20px;">${icon('checkCircle','4xl')}</div>
                <h3>100% Conformidade</h3>
                <p>Nenhuma não-conformidade detectada!</p>
            </div>
        `;
    } else {
        content.innerHTML = `
            <h3 style="color: #ff4757; margin-bottom: 20px;">${icon('alertTriangle')} Não-Conformidades Detectadas: ${state.nonComplianceList.length}</h3>
            ${state.nonComplianceList.map((nc, index) => `
                <div style="background: rgba(255, 71, 87, 0.1); border: 2px solid #ff4757; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <strong>#${index + 1} - ${escapeHtml(nc.operation)}</strong><br>
                    Peça: ${escapeHtml(nc.spare)}<br>
                    Operador: ${escapeHtml(nc.operator)}<br>
                    Data/Hora: ${new Date(nc.timestamp).toLocaleString('pt-BR')}<br>
                    Motivo: ${escapeHtml(nc.reason)}
                </div>
            `).join('')}
        `;
    }

    document.getElementById('complianceModal').classList.add('active');
}

function showComplianceAnalysis() {
    showComplianceDetails();
}

function closeComplianceModal() {
    document.getElementById('complianceModal').classList.remove('active');
}

function getSpareProcessEvents(spare) {
    return [
        ...(Array.isArray(spare?.history) ? spare.history : []),
        ...(Array.isArray(spare?.transportEvents) ? spare.transportEvents : [])
    ].sort((left, right) => {
        const leftBlock = Number(left?.blockchain?.blockNumber || 0);
        const rightBlock = Number(right?.blockchain?.blockNumber || 0);

        if (leftBlock && rightBlock && leftBlock !== rightBlock) {
            return leftBlock - rightBlock;
        }

        return new Date(left?.timestamp || 0).getTime() - new Date(right?.timestamp || 0).getTime();
    });
}

function validateSpareBlockchain(spare) {
    const events = getSpareProcessEvents(spare);
    let issues = 0;
    let previousHash = 'GENESIS';
    let previousBlock = 0;

    events.forEach((event, index) => {
        const blockchain = event?.blockchain;
        if (!blockchain?.hash) {
            issues += 1;
            return;
        }

        const expectedPreviousHash = index === 0 ? 'GENESIS' : previousHash;
        if (blockchain.previousHash !== expectedPreviousHash) {
            issues += 1;
        }

        const blockNumber = Number(blockchain.blockNumber || 0);
        if (blockNumber !== previousBlock + 1) {
            issues += 1;
        }

        previousHash = blockchain.hash;
        previousBlock = blockNumber;
    });

    return {
        issues,
        totalEvents: events.length
    };
}

function validateSpareMerkle(spare) {
    const events = getSpareProcessEvents(spare);
    if (!events.length) {
        return {
            issues: 0,
            leafCount: 0,
            root: ''
        };
    }

    const leafHashes = events.map((event, index) => event?.merkle?.leafHash || buildEventMerkleLeafHash(spare.code, event, index));
    const tree = buildMerkleTree(leafHashes);
    let issues = 0;

    events.forEach((event, index) => {
        const merkle = event?.merkle;
        if (!merkle?.leafHash || merkle.leafHash !== leafHashes[index]) {
            issues += 1;
        }

        if (!verifyMerkleProof(leafHashes[index], merkle?.proof || [], tree.root)) {
            issues += 1;
        }
    });

    if ((spare?.merkle?.root || '') !== tree.root) {
        issues += 1;
    }

    if (Number(spare?.merkle?.leafCount || 0) !== tree.leafCount) {
        issues += 1;
    }

    return {
        issues,
        leafCount: tree.leafCount,
        root: tree.root
    };
}

function buildProcessMerkleSummary(spares) {
    const leaves = (spares || [])
        .filter((spare) => spare?.merkle?.root)
        .sort((left, right) => String(left.code || '').localeCompare(String(right.code || '')))
        .map((spare) => generateDeterministicHash('PROCESS_MERKLE_LEAF', spare.code, spare.currentState, spare.merkle.root));

    return buildMerkleTree(leaves);
}

function evaluateCustodyIssues(spare) {
    const types = new Set(getSpareProcessEvents(spare).map((event) => event.type));
    let issues = 0;

    if (!types.has('RECEBIDO')) issues += 1;

    if (
        ['EM_TRANSITO', 'ENTREGUE_BORDO', 'ARMAZENADO', 'INSTALADO', 'NAO_CONFORME', 'QUARENTENA', 'DESCARTADO_FINAL'].includes(spare.currentState)
        && !types.has('COLETADO')
    ) {
        issues += 1;
    }

    if (
        ['ENTREGUE_BORDO', 'ARMAZENADO', 'INSTALADO', 'NAO_CONFORME', 'QUARENTENA', 'DESCARTADO_FINAL'].includes(spare.currentState)
        && !types.has('ENTREGUE_BORDO')
    ) {
        issues += 1;
    }

    if (['ARMAZENADO', 'INSTALADO'].includes(spare.currentState) && Number(spare.scanCount || 0) === 0) {
        issues += 1;
    }

    return issues;
}

function buildFinalProcessReport() {
    hydrateState();

    const spares = Object.values(state.sparesData);
    const totalSpares = spares.length;

    const byState = {
        RECEBIDO: 0,
        AGUARDANDO_COLETA: 0,
        EM_TRANSITO: 0,
        ENTREGUE_BORDO: 0,
        ARMAZENADO: 0,
        INSTALADO: 0,
        QUARENTENA: 0,
        NAO_CONFORME: 0,
        DESCARTADO_FINAL: 0
    };

    let totalHistoryEvents = 0;
    let totalTransportEvents = 0;
    let eventsWithBlockchain = 0;
    let piecesWithProcessId = 0;
    let scannedPieces = 0;
    let piecesWithChainIssues = 0;
    let piecesWithMerkleRoot = 0;
    let piecesWithMerkleIssues = 0;
    let custodyIssuePieces = 0;
    let blockchainIssueCount = 0;
    let merkleIssueCount = 0;
    let custodyIssueCount = 0;
    let totalScans = 0;
    let totalOperations = 0;
    const actors = new Set();
    const timestamps = [];

    spares.forEach((spare) => {
        const stateName = spare.currentState || 'RECEBIDO';
        byState[stateName] = (byState[stateName] || 0) + 1;

        if (spare.blockchainProcessId) piecesWithProcessId += 1;
        if (spare.merkle?.root) piecesWithMerkleRoot += 1;
        if (Number(spare.scanCount || 0) > 0) scannedPieces += 1;

        totalScans += Number(spare.scanCount || 0);
        totalHistoryEvents += Array.isArray(spare.history) ? spare.history.length : 0;
        totalTransportEvents += Array.isArray(spare.transportEvents) ? spare.transportEvents.length : 0;
        totalOperations += Array.isArray(spare.history) ? spare.history.length : 0;

        getSpareProcessEvents(spare).forEach((event) => {
            if (event?.blockchain?.hash) eventsWithBlockchain += 1;
            if (event?.timestamp) timestamps.push(event.timestamp);

            const operator =
                event?.data?.operator ||
                event?.operator ||
                event?.data?.receivedBy ||
                event?.data?.addedBy;

            if (operator) actors.add(operator);
        });

        const blockchainCheck = validateSpareBlockchain(spare);
        blockchainIssueCount += blockchainCheck.issues;
        if (blockchainCheck.issues > 0) piecesWithChainIssues += 1;

        const merkleCheck = validateSpareMerkle(spare);
        merkleIssueCount += merkleCheck.issues;
        if (merkleCheck.issues > 0) piecesWithMerkleIssues += 1;

        const custodyIssues = evaluateCustodyIssues(spare);
        custodyIssueCount += custodyIssues;
        if (custodyIssues > 0) custodyIssuePieces += 1;
    });

    if (totalOperations === 0) totalOperations = totalSpares;

    const totalEvents = totalHistoryEvents + totalTransportEvents;
    const complianceRate = totalOperations > 0
        ? Math.min(100, (totalScans / totalOperations) * 100)
        : 100;
    const blockchainCoverage = totalEvents > 0
        ? (eventsWithBlockchain / totalEvents) * 100
        : 100;
    const processCoverage = totalSpares > 0
        ? (piecesWithProcessId / totalSpares) * 100
        : 100;
    const merkleCoverage = totalSpares > 0
        ? (piecesWithMerkleRoot / totalSpares) * 100
        : 100;
    const integrityRate = totalSpares > 0
        ? Math.max(0, 100 - ((piecesWithChainIssues / totalSpares) * 100))
        : 100;
    const merkleIntegrityRate = totalSpares > 0
        ? Math.max(0, 100 - ((piecesWithMerkleIssues / totalSpares) * 100))
        : 100;
    const custodyRate = totalSpares > 0
        ? Math.max(0, 100 - ((custodyIssuePieces / totalSpares) * 100))
        : 100;
    const processMerkle = buildProcessMerkleSummary(spares);

    const score = totalSpares === 0
        ? 100
        : ((complianceRate * 0.28) + (blockchainCoverage * 0.22) + (integrityRate * 0.15) + (merkleCoverage * 0.15) + (merkleIntegrityRate * 0.1) + (custodyRate * 0.1));

    let verdict = 'EXCELENTE';
    let verdictClass = 'excellent';
    let verdictBadge = 'good';

    if (score < 70) {
        verdict = 'CRITICO';
        verdictClass = 'critical';
        verdictBadge = 'bad';
    } else if (score < 85) {
        verdict = 'ATENCAO';
        verdictClass = 'attention';
        verdictBadge = 'warn';
    } else if (score < 95) {
        verdict = 'BOM';
        verdictClass = 'good';
        verdictBadge = 'info';
    }

    const firstTimestamp = timestamps.length
        ? new Date([...timestamps].sort()[0]).toLocaleString('pt-BR')
        : '-';
    const lastTimestamp = timestamps.length
        ? new Date([...timestamps].sort().slice(-1)[0]).toLocaleString('pt-BR')
        : '-';

    const recommendations = [];
    if (totalSpares === 0) {
        recommendations.push('Nenhuma peça foi processada ainda. Inicie o fluxo para gerar uma avaliação operacional completa.');
    }
    if (state.nonComplianceList.length > 0) {
        recommendations.push(`Tratar ${state.nonComplianceList.length} não-conformidade(s) pendente(s), com revisão de operador, motivo e etapa crítica do processo.`);
    }
    if (piecesWithChainIssues > 0) {
        recommendations.push(`Reconciliar ${piecesWithChainIssues} peça(s) com inconsistência na cadeia blockchain antes do encerramento formal da operação.`);
    }
    if (piecesWithMerkleIssues > 0) {
        recommendations.push(`Revalidar ${piecesWithMerkleIssues} peça(s) com falha de prova Merkle ou root divergente no histórico consolidado.`);
    }
    if (custodyIssuePieces > 0) {
        recommendations.push(`Revisar ${custodyIssuePieces} peça(s) com lacunas de cadeia de custódia ou transição incompleta entre atores.`);
    }
    if (byState.EM_TRANSITO > 0 || byState.ENTREGUE_BORDO > 0) {
        recommendations.push('Existem peças ainda em trânsito ou aguardando recebimento a bordo. Concluir essas etapas antes de homologar o processo.');
    }
    if (!recommendations.length) {
        recommendations.push('Processo sem desvios relevantes. Manter o padrão atual de escaneamento, transferência de responsáveis e registro blockchain.');
    }

    const executiveSummary = totalSpares === 0
        ? 'Sem peças registradas para avaliação. O módulo está pronto, mas ainda não há execução operacional para consolidar.'
        : verdict === 'EXCELENTE'
            ? 'O processo apresenta rastreabilidade forte, boa cobertura blockchain e cadeia de custódia consistente do recebimento ao destino final.'
            : verdict === 'BOM'
                ? 'O processo está consistente, mas ainda existem pontos de melhoria para elevar a robustez documental e operacional.'
                : verdict === 'ATENCAO'
                    ? 'O processo mantém rastreio parcial, porém exige correção antes de ser considerado plenamente confiável para auditoria.'
                    : 'O processo possui desvios relevantes de conformidade, custódia ou integridade blockchain e requer ação corretiva imediata.';

    return {
        generatedAt: new Date().toLocaleString('pt-BR'),
        periodStart: firstTimestamp,
        periodEnd: lastTimestamp,
        totalSpares,
        totalHistoryEvents,
        totalTransportEvents,
        totalEvents,
        totalScans,
        totalOperations,
        uniqueActors: Array.from(actors).sort(),
        stateBreakdown: byState,
        nonComplianceCount: state.nonComplianceList.length,
        piecesWithProcessId,
        piecesWithMerkleRoot,
        scannedPieces,
        blockchainCoverage,
        processCoverage,
        merkleCoverage,
        complianceRate,
        integrityRate,
        merkleIntegrityRate,
        custodyRate,
        piecesWithChainIssues,
        blockchainIssueCount,
        piecesWithMerkleIssues,
        merkleIssueCount,
        custodyIssuePieces,
        custodyIssueCount,
        processMerkleRoot: processMerkle.root,
        processMerkleLeafCount: processMerkle.leafCount,
        score,
        verdict,
        verdictClass,
        verdictBadge,
        executiveSummary,
        recommendations
    };
}

function buildFinalProcessReportText(report) {
    return [
        'SPARES-CHAIN - RELATORIO FINAL DE AVALIACAO DO PROCESSO',
        `Gerado em: ${report.generatedAt}`,
        `Periodo analisado: ${report.periodStart} ate ${report.periodEnd}`,
        '',
        `Parecer final: ${report.verdict}`,
        `Score final: ${report.score.toFixed(1)} / 100`,
        `Resumo executivo: ${report.executiveSummary}`,
        '',
        'Indicadores principais',
        `- Total de pecas: ${report.totalSpares}`,
        `- Total de eventos de historico: ${report.totalHistoryEvents}`,
        `- Total de eventos logisticos: ${report.totalTransportEvents}`,
        `- Total de scans: ${report.totalScans}`,
        `- Nao-conformidades: ${report.nonComplianceCount}`,
        `- Cobertura blockchain: ${report.blockchainCoverage.toFixed(1)}%`,
        `- Cobertura de processo: ${report.processCoverage.toFixed(1)}%`,
        `- Cobertura Merkle: ${report.merkleCoverage.toFixed(1)}%`,
        `- Taxa de conformidade: ${report.complianceRate.toFixed(1)}%`,
        `- Integridade da cadeia blockchain: ${report.integrityRate.toFixed(1)}%`,
        `- Integridade Merkle: ${report.merkleIntegrityRate.toFixed(1)}%`,
        `- Cadeia de custodia: ${report.custodyRate.toFixed(1)}%`,
        `- Merkle Root do processo: ${report.processMerkleRoot || '-'}`,
        '',
        'Estado final das pecas',
        `- Recebido: ${report.stateBreakdown.RECEBIDO}`,
        `- Aguardando coleta: ${report.stateBreakdown.AGUARDANDO_COLETA}`,
        `- Em transito: ${report.stateBreakdown.EM_TRANSITO}`,
        `- Entregue a bordo: ${report.stateBreakdown.ENTREGUE_BORDO}`,
        `- Armazenado: ${report.stateBreakdown.ARMAZENADO}`,
        `- Instalado: ${report.stateBreakdown.INSTALADO}`,
        `- Quarentena: ${report.stateBreakdown.QUARENTENA}`,
        `- Nao conforme: ${report.stateBreakdown.NAO_CONFORME}`,
        `- Descartado final: ${report.stateBreakdown.DESCARTADO_FINAL}`,
        '',
        `Atores identificados: ${report.uniqueActors.join(', ') || '-'}`,
        '',
        'Recomendacoes',
        ...report.recommendations.map((item, index) => `${index + 1}. ${item}`)
    ].join('\n');
}

function exportFinalProcessReport() {
    const report = buildFinalProcessReport();
    const content = buildFinalProcessReportText(report);
    const href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    anchor.setAttribute('download', `relatorio_final_processo_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

function showFinalProcessReport() {
    const report = buildFinalProcessReport();
    const content = document.getElementById('finalReportContent');
    if (!content) return;

    content.innerHTML = `
        <div class="report-shell">
            <div class="report-headline">
                <div>
                    <span class="report-badge ${report.verdictBadge}">Parecer ${escapeHtml(report.verdict)}</span>
                    <h3>Avaliação executiva do processo</h3>
                    <p>${escapeHtml(report.executiveSummary)}</p>
                    <p><strong>Janela analisada:</strong> ${escapeHtml(report.periodStart)} até ${escapeHtml(report.periodEnd)}<br>
                    <strong>Relatório gerado em:</strong> ${escapeHtml(report.generatedAt)}</p>
                </div>
                <div class="report-score ${report.verdictClass}">
                    <strong>${escapeHtml(report.score.toFixed(1))}</strong>
                    <small>score final</small>
                </div>
            </div>

            <div class="report-grid">
                <div class="report-card">
                    <h4>Conformidade</h4>
                    <strong>${escapeHtml(report.complianceRate.toFixed(1))}%</strong>
                    <p>${escapeHtml(report.nonComplianceCount)} não-conformidade(s) registrada(s).</p>
                </div>
                <div class="report-card">
                    <h4>Blockchain</h4>
                    <strong>${escapeHtml(report.blockchainCoverage.toFixed(1))}%</strong>
                    <p>${escapeHtml(report.totalEvents)} evento(s) avaliados com evidência encadeada.</p>
                </div>
                <div class="report-card">
                    <h4>Merkle</h4>
                    <strong>${escapeHtml(report.merkleCoverage.toFixed(1))}%</strong>
                    <p>${escapeHtml(report.piecesWithMerkleRoot)} peça(s) com Merkle Root calculada.</p>
                </div>
                <div class="report-card">
                    <h4>Cadeia de Custódia</h4>
                    <strong>${escapeHtml(report.custodyRate.toFixed(1))}%</strong>
                    <p>${escapeHtml(report.custodyIssuePieces)} peça(s) com lacunas de transição entre etapas.</p>
                </div>
                <div class="report-card">
                    <h4>Rastreabilidade</h4>
                    <strong>${escapeHtml(report.processCoverage.toFixed(1))}%</strong>
                    <p>${escapeHtml(report.piecesWithProcessId)} de ${escapeHtml(report.totalSpares)} peça(s) com Process ID registrado.</p>
                </div>
            </div>

            <div class="report-section">
                <h4 class="report-section-title">Resumo do fluxo</h4>
                <div class="report-grid">
                    <div class="report-card">
                        <h4>Peças processadas</h4>
                        <strong>${escapeHtml(report.totalSpares)}</strong>
                        <p>${escapeHtml(report.totalHistoryEvents)} evento(s) internos e ${escapeHtml(report.totalTransportEvents)} evento(s) logísticos.</p>
                    </div>
                    <div class="report-card">
                        <h4>Scans executados</h4>
                        <strong>${escapeHtml(report.totalScans)}</strong>
                        <p>${escapeHtml(report.scannedPieces)} peça(s) tiveram ao menos um escaneamento validado.</p>
                    </div>
                    <div class="report-card">
                        <h4>Integridade blockchain</h4>
                        <strong>${escapeHtml(report.integrityRate.toFixed(1))}%</strong>
                        <p>${escapeHtml(report.piecesWithChainIssues)} peça(s) com inconsistência de hash/bloco encadeado.</p>
                    </div>
                    <div class="report-card">
                        <h4>Integridade Merkle</h4>
                        <strong>${escapeHtml(report.merkleIntegrityRate.toFixed(1))}%</strong>
                        <p>${escapeHtml(report.piecesWithMerkleIssues)} peça(s) com root ou prova Merkle divergente.</p>
                    </div>
                    <div class="report-card">
                        <h4>Atores envolvidos</h4>
                        <strong>${escapeHtml(report.uniqueActors.length)}</strong>
                        <p>${escapeHtml(report.uniqueActors.join(', ') || 'Nenhum ator identificado ainda.')}</p>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h4 class="report-section-title">Selo Merkle do processo</h4>
                <ul class="report-list">
                    <li><strong>Merkle Root consolidada:</strong> <code>${escapeHtml(report.processMerkleRoot || '-')}</code></li>
                    <li><strong>Folhas do processo:</strong> ${escapeHtml(report.processMerkleLeafCount)}</li>
                    <li><strong>Leitura técnica:</strong> a root acima consolida as roots individuais das peças avaliadas no relatório final.</li>
                </ul>
            </div>

            <div class="report-section">
                <h4 class="report-section-title">Destino final das peças</h4>
                <div class="report-grid">
                    <div class="report-card"><h4>Armazenado</h4><strong>${escapeHtml(report.stateBreakdown.ARMAZENADO)}</strong><p>Peças disponíveis em prateleira de bordo.</p></div>
                    <div class="report-card"><h4>Instalado</h4><strong>${escapeHtml(report.stateBreakdown.INSTALADO)}</strong><p>Peças atualmente em operação nos equipamentos.</p></div>
                    <div class="report-card"><h4>Quarentena</h4><strong>${escapeHtml(report.stateBreakdown.QUARENTENA)}</strong><p>Peças removidas aguardando definição ou reversa.</p></div>
                    <div class="report-card"><h4>Não Conforme</h4><strong>${escapeHtml(report.stateBreakdown.NAO_CONFORME)}</strong><p>Peças segregadas por desvio ou não-conformidade.</p></div>
                    <div class="report-card"><h4>Descartado Final</h4><strong>${escapeHtml(report.stateBreakdown.DESCARTADO_FINAL)}</strong><p>Peças encerradas com documento e trilha blockchain.</p></div>
                    <div class="report-card"><h4>Em aberto</h4><strong>${escapeHtml(report.stateBreakdown.RECEBIDO + report.stateBreakdown.AGUARDANDO_COLETA + report.stateBreakdown.EM_TRANSITO + report.stateBreakdown.ENTREGUE_BORDO)}</strong><p>Peças que ainda não fecharam o ciclo operacional.</p></div>
                </div>
            </div>

            <div class="report-section">
                <h4 class="report-section-title">Recomendações finais</h4>
                <ul class="report-list">
                    ${report.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            </div>

            <div class="report-actions">
                <button class="action-btn" onclick="exportFinalProcessReport()">${icon('download')} Exportar Relatório</button>
            </div>
        </div>
    `;

    document.getElementById('finalReportModal').classList.add('active');
}

function closeFinalReportModal() {
    document.getElementById('finalReportModal').classList.remove('active');
}

// ===== HISTÓRICO =====
function showHistory(code) {
    const spare = state.sparesData[code];
    if (!spare) return;

    const content = document.getElementById('historyContent');
    const formatHistoryValue = value => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return escapeHtml(JSON.stringify(value));
        return escapeHtml(String(value));
    };
    const renderBlockchainInfo = blockchain => {
        if (!blockchain) return '';
        return `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,212,255,0.2); font-size: 12px; color: #8fdcff;">
                <strong>Processo:</strong> ${escapeHtml(blockchain.processId)}<br>
                <strong>Bloco:</strong> ${escapeHtml(blockchain.blockId)} |
                <strong>Tx:</strong> ${escapeHtml(blockchain.txId)}<br>
                <strong>PrevHash:</strong> <code>${escapeHtml(blockchain.previousHash)}</code><br>
                <strong>Hash:</strong> <code>${escapeHtml(blockchain.hash)}</code>
            </div>
        `;
    };
    const renderMerkleInfo = merkle => {
        if (!merkle?.leafHash) return '';

        return `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,255,136,0.18); font-size: 12px; color: #baffde;">
                <strong>Merkle Leaf:</strong> <code>${escapeHtml(merkle.leafHash)}</code><br>
                <strong>Merkle Root:</strong> <code>${escapeHtml(merkle.root || spare?.merkle?.root || '-')}</code><br>
                <strong>Folha:</strong> ${escapeHtml(Number(merkle.leafIndex || 0) + 1)} / ${escapeHtml(merkle.leafCount || 0)} |
                <strong>Proof Depth:</strong> ${escapeHtml(merkle.proofDepth || 0)} |
                <strong>Verificado:</strong> ${merkle.verified ? 'SIM' : 'NAO'}
                ${(merkle.proof || []).length ? `
                    <details style="margin-top: 8px;">
                        <summary style="cursor: pointer; color: #8ff0b5;">Prova de Inclusão</summary>
                        <div style="margin-top: 6px;">
                            ${(merkle.proof || []).map((step, index) => `
                                <div>${index + 1}. ${escapeHtml(step.position?.toUpperCase() || '-')} <code>${escapeHtml(step.hash)}</code></div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    };

    content.innerHTML = `
        <button class="action-btn" style="float:right;margin-bottom:10px;" onclick="exportHistory('${code}')">${icon('download')} Exportar Histórico</button>
        <h3 style="color: #00d4ff; margin-bottom: 20px;">${renderIcon(spare.icon)} ${escapeHtml(spare.name)} (${escapeHtml(spare.code)})</h3>
        <div style="margin-bottom: 20px;">
            <strong>Total de Escaneamentos:</strong> ${escapeHtml(spare.scanCount || 0)}<br>
            <strong>Não-conformidades:</strong> ${escapeHtml(spare.nonCompliantOps?.length || 0)}<br>
            <strong>Processo Blockchain:</strong> <code>${escapeHtml(spare.blockchainProcessId || '-')}</code><br>
            <strong>Merkle Root da peça:</strong> <code>${escapeHtml(spare.merkle?.root || '-')}</code><br>
            <strong>Folhas Merkle:</strong> ${escapeHtml(spare.merkle?.leafCount || 0)}
        </div>
        <div class="history-timeline">
            ${(spare.history || []).map((event) => `
                <div class="history-item">
                    <strong>${escapeHtml(event.type)}</strong><br>
                    <small>${new Date(event.timestamp).toLocaleString('pt-BR')}</small><br>
                    ${Object.entries(event.data || {}).map(([key, value]) =>
                        `${escapeHtml(key)}: ${formatHistoryValue(value)}`
                    ).join('<br>')}
                    ${renderBlockchainInfo(event.blockchain)}
                    ${renderMerkleInfo(event.merkle)}
                </div>
            `).join('')}
            ${(spare.transportEvents && spare.transportEvents.length > 0) ? `
                <h4 style='margin-top:20px;color:#ffa502;'>${icon('truck')} RASTREAMENTO LOGÍSTICO</h4>
                ${spare.transportEvents.map(ev => `
                    <div class='history-item'>
                        <strong>${escapeHtml(ev.type)}</strong><br>
                        <small>${ev.timestamp ? new Date(ev.timestamp).toLocaleString('pt-BR') : (ev.datetime ? new Date(ev.datetime).toLocaleString('pt-BR') : '')}</small><br>
                        Operador: ${escapeHtml(ev.operator || ev.data?.operator || '-')}, Empresa: ${escapeHtml(ev.company || ev.data?.company || '-')}
                        ${(ev.name || ev.data?.name) ? `<br>Nome: ${escapeHtml(ev.name || ev.data?.name)}` : ''}
                        ${(ev.doc || ev.data?.doc) ? `<br>Documento: ${escapeHtml(ev.doc || ev.data?.doc)}` : ''}
                        ${(ev.vehicle || ev.data?.vehicle) ? `<br>Veículo: ${escapeHtml(ev.vehicle || ev.data?.vehicle)}` : ''}
                        ${(ev.contact || ev.data?.contact) ? `<br>Contato: ${escapeHtml(ev.contact || ev.data?.contact)}` : ''}
                        ${renderBlockchainInfo(ev.blockchain)}
                        ${renderMerkleInfo(ev.merkle)}
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `;

    document.getElementById('historyModal').classList.add('active');
}

function exportHistory(code) {
    const spare = state.sparesData[code];
    if (!spare) return;

    const exportObj = {
        code: spare.code,
        name: spare.name,
        icon: spare.icon,
        blockchainProcessId: spare.blockchainProcessId,
        merkle: spare.merkle,
        scanCount: spare.scanCount,
        nonCompliantOps: spare.nonCompliantOps,
        history: spare.history,
        transportEvents: spare.transportEvents || []
    };

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, 2))}`;
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `historico_${spare.code}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}

// ===== DESCARTES =====
function showDisposalRecords() {
    const content = document.getElementById('disposalContent');

    if (state.disposalRecords.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #aaa;">
                <div style="font-size: 64px; margin-bottom: 20px;">${icon('package','4xl')}</div>
                <h3>Nenhum Descarte Registrado</h3>
                <p>Todas as peças removidas retornaram ao estoque ou ainda estão instaladas.</p>
            </div>
        `;
    } else {
        const totalHoursWorked = state.disposalRecords.reduce((sum, d) => sum + d.hoursWorked, 0);
        const avgHours = (totalHoursWorked / state.disposalRecords.length).toFixed(1);

        content.innerHTML = `
            <div style="background: rgba(255, 71, 87, 0.1); border: 2px solid #ff4757; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #ff4757; margin-bottom: 10px;">${icon('barChart')} Estatísticas</h3>
                <strong>Total Descartado:</strong> ${state.disposalRecords.length} peça(s)<br>
                <strong>Horas Trabalhadas Total:</strong> ${totalHoursWorked.toFixed(1)}h<br>
                <strong>Média por Peça:</strong> ${avgHours}h
            </div>

            <h3 style="margin-bottom: 15px; color: #ff4757;">Histórico de Descartes</h3>
            ${state.disposalRecords.map((disposal, index) => `
                <div style="background: rgba(255, 71, 87, 0.05); border-left: 4px solid #ff4757; border-radius: 5px; padding: 15px; margin-bottom: 15px;">
                    <strong>#${index + 1} - ${escapeHtml(disposal.name)} (${escapeHtml(disposal.code)})</strong><br>
                    <small style="color: #aaa;">${new Date(disposal.disposalDate).toLocaleString('pt-BR')}</small><br><br>

                    <strong>Equipamento:</strong> ${escapeHtml(disposal.equipment)}<br>
                    <strong>Horas Instalação:</strong> ${disposal.installHours.toFixed(1)}h<br>
                    <strong>Horas Remoção:</strong> ${disposal.removalHours.toFixed(1)}h<br>
                    <strong>Horas Trabalhadas:</strong> <span style="color: #00d4ff;">${disposal.hoursWorked.toFixed(1)}h</span><br>
                    <strong>Motivo:</strong> ${escapeHtml(disposal.reason)}<br>
                    <strong>Operador:</strong> ${escapeHtml(disposal.transportOperator || disposal.removedBy || 'N/A')}<br>
                    <strong>Processo:</strong> <code>${escapeHtml(disposal.blockchain?.processId || '-')}</code><br>
                    <strong>Bloco:</strong> ${escapeHtml(disposal.blockchain?.blockId || '-')} |
                    <strong>Tx:</strong> ${escapeHtml(disposal.blockchain?.txId || '-')}<br>
                    <strong>Hash:</strong> <code>${disposal.hash}</code>
                </div>
            `).reverse().join('')}
        `;
    }

    document.getElementById('disposalModal').classList.add('active');
}

function closeDisposalModal() {
    document.getElementById('disposalModal').classList.remove('active');
}

// ===== LOGÍSTICA REVERSA =====
function showDisposalTransport() {
    if (state.currentUser.role !== 'TRANSPORTADORA') {
        alert('ACESSO NEGADO\n\nApenas TRANSPORTADORA pode processar logística reversa.');
        return;
    }

    const itemsInQuarantine = document.querySelectorAll('#quarantineList .spare-item');

    if (itemsInQuarantine.length === 0) {
        alert('NENHUM ITEM\n\nNão há peças na quarentena para coleta.');
        return;
    }

    const itemsList = Array.from(itemsInQuarantine).map((item, index) =>
        `${index + 1}. ${item.dataset.name} (${item.dataset.code})`
    ).join('\n');

    const proceed = confirm(
        `LOGÍSTICA REVERSA\n\n` +
        `Itens na quarentena:\n${itemsList}\n\n` +
        `Total: ${itemsInQuarantine.length} item(ns)\n\n` +
        `Confirma COLETA para DESCARTE definitivo?\n` +
        `(Documento de descarte será gerado)`
    );

    if (!proceed) return;

    const disposalDoc = generateDisposalDoc();
    const transportCompany = state.currentUser.location || 'Transportadora';
    const transportOperator = state.currentUser.name;
    const collectionDate = new Date().toISOString();

    const processedItems = [];
    itemsInQuarantine.forEach(item => {
        const code = item.dataset.code;
        const name = item.dataset.name;
        const spare = state.sparesData[code];

        const removalEvent = spare ? spare.history.find(h => h.type === 'REMOVIDO') : null;
        const discardEvent = addSpareEvent(code, 'DESCARTADO_FINAL', {
            disposalDoc,
            transportCompany,
            operator: transportOperator,
            collectionDate
        });

        const disposalRecord = {
            code, name,
            disposalDoc,
            equipment: removalEvent ? removalEvent.data.equipment : 'N/A',
            installHours: removalEvent ? removalEvent.data.installHours : 0,
            removalHours: removalEvent ? removalEvent.data.removalHours : 0,
            hoursWorked: removalEvent ? removalEvent.data.hoursWorked : 0,
            reason: removalEvent ? removalEvent.data.reason : 'Não especificado',
            removedBy: removalEvent ? removalEvent.data.operator : 'N/A',
            transportCompany,
            transportOperator,
            collectionDate,
            disposalDate: collectionDate,
            hash: discardEvent.blockchain.hash,
            blockchain: discardEvent.blockchain
        };

        state.disposalRecords.push(disposalRecord);
        processedItems.push(disposalRecord);

        item.remove();
    });

    state.quarantineItems = [];

    addLog(
        `${icon('truck')} LOGÍSTICA REVERSA: ${processedItems.length} item(ns) coletado(s) | ` +
        `Doc: ${escapeHtml(disposalDoc)} | ${escapeHtml(transportOperator)} (${escapeHtml(transportCompany)})${formatBlockchainTag(processedItems[0]?.blockchain)}`,
        'danger'
    );

    saveAll();
    updateDashboard();
    showDisposalDocument(disposalDoc, processedItems);
}

function showDisposalDocument(docNumber, items) {
    const content = document.getElementById('disposalContent');
    const totalHours = items.reduce((sum, item) => sum + item.hoursWorked, 0);

    content.innerHTML = `
        <div class="responsive-document-card" style="background: rgba(0, 0, 0, 0.8); border: 3px solid #00d4ff; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
            <h2 style="color: #00d4ff; text-align: center; margin-bottom: 20px;">${icon('fileText')} DOCUMENTO DE DESCARTE</h2>
            <div style="text-align: center; font-size: 32px; font-weight: bold; color: #ffa502; margin: 20px 0; padding: 15px; background: rgba(255, 165, 2, 0.1); border-radius: 8px;">
                ${docNumber}
            </div>

            <div class="responsive-meta-grid">
                <div>
                    <strong>${icon('calendar')} Data/Hora:</strong><br>
                    ${new Date(items[0].collectionDate).toLocaleString('pt-BR')}
                </div>
                <div>
                    <strong>${icon('truck')} Transportadora:</strong><br>
                    ${escapeHtml(items[0].transportCompany)}
                </div>
                <div>
                    <strong>${icon('user')} Operador:</strong><br>
                    ${escapeHtml(items[0].transportOperator)}
                </div>
                <div>
                    <strong>${icon('package')} Total Itens:</strong><br>
                    ${items.length} peça(s)
                </div>
            </div>
        </div>

        <h3 style="color: #ff4757; margin: 20px 0;">ITENS DESCARTADOS</h3>

        <div style="background: rgba(255, 71, 87, 0.05); border: 2px solid #ff4757; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <strong>${icon('history')} Horas Totais Trabalhadas:</strong> ${totalHours.toFixed(1)}h
        </div>

        ${items.map((item, index) => `
            <div class="responsive-document-card" style="background: rgba(0, 0, 0, 0.3); border-left: 4px solid #ff4757; border-radius: 5px; padding: 15px; margin-bottom: 10px;">
                <div class="responsive-item-row">
                    <div>
                        <strong>#${index + 1} - ${escapeHtml(item.name)}</strong><br>
                        <small style="color: #aaa;">${escapeHtml(item.code)}</small>
                    </div>
                    <div class="responsive-item-value-right">
                        <strong style="color: #00d4ff;">Trabalhou: ${item.hoursWorked.toFixed(1)}h</strong>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 13px;">
                    <strong>Equipamento:</strong> ${escapeHtml(item.equipment)} |
                    <strong>Motivo:</strong> ${escapeHtml(item.reason)}<br>
                    <strong>Removido por:</strong> ${escapeHtml(item.removedBy)}<br>
                    <strong>Processo:</strong> <code>${escapeHtml(item.blockchain?.processId || '-')}</code><br>
                    <strong>Bloco:</strong> ${escapeHtml(item.blockchain?.blockId || '-')} |
                    <strong>Tx:</strong> ${escapeHtml(item.blockchain?.txId || '-')}<br>
                    <strong>Hash:</strong> <code>${item.hash}</code>
                </div>
            </div>
        `).join('')}

        <div style="margin-top: 30px; padding: 20px; background: rgba(0, 212, 255, 0.1); border: 2px solid #00d4ff; border-radius: 8px; text-align: center;">
            <strong style="color: #00d4ff;">${icon('checkCircle')} DOCUMENTO REGISTRADO NA BLOCKCHAIN</strong><br>
            <small>Este documento é imutável e auditável permanentemente</small>
        </div>
    `;

    document.getElementById('disposalModal').classList.add('active');
}

// ===== BOAS-VINDAS =====
let welcomeSlideIndex = 0;

function getWelcomeSlides() {
    return Array.from(document.querySelectorAll('.welcome-slide'));
}

function updateWelcomeCarousel() {
    const slides = getWelcomeSlides();
    if (!slides.length) return;

    const safeIndex = Math.min(Math.max(welcomeSlideIndex, 0), slides.length - 1);
    welcomeSlideIndex = safeIndex;

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === safeIndex);
    });

    slides.forEach((_, index) => {
        const dot = document.getElementById(`welcomeDot${index}`);
        if (dot) dot.classList.toggle('active', index === safeIndex);
    });

    const counter = document.getElementById('welcomeStepLabel');
    if (counter) {
        counter.textContent = `Card ${safeIndex + 1} de ${slides.length}`;
    }

    const prevBtn = document.getElementById('welcomePrevBtn');
    if (prevBtn) prevBtn.disabled = safeIndex === 0;

    const nextBtn = document.getElementById('welcomeNextBtn');
    if (nextBtn) nextBtn.classList.toggle('hidden', safeIndex === slides.length - 1);
}

function initializeWelcomeCarousel() {
    welcomeSlideIndex = 0;
    updateWelcomeCarousel();
}

function goToWelcomeSlide(index) {
    welcomeSlideIndex = index;
    updateWelcomeCarousel();
}

function nextWelcomeSlide() {
    const slides = getWelcomeSlides();
    if (!slides.length) return;

    if (welcomeSlideIndex < slides.length - 1) {
        welcomeSlideIndex += 1;
        updateWelcomeCarousel();
    }
}

function previousWelcomeSlide() {
    if (welcomeSlideIndex > 0) {
        welcomeSlideIndex -= 1;
        updateWelcomeCarousel();
    }
}

function closeWelcomeModal() {
    document.getElementById('welcomeModal').classList.remove('active');
    localStorage.setItem('welcomeShown', 'true');
    welcomeSlideIndex = 0;
}

function checkFirstVisit() {
    const modal = document.getElementById('welcomeModal');
    if (!modal) return;

    modal.classList.add('active');
    initializeWelcomeCarousel();
}
