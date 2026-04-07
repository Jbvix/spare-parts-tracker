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

    content.innerHTML = `
        <button class="action-btn" style="float:right;margin-bottom:10px;" onclick="exportHistory('${code}')">${icon('download')} Exportar Histórico</button>
        <h3 style="color: #00d4ff; margin-bottom: 20px;">${renderIcon(spare.icon)} ${escapeHtml(spare.name)} (${escapeHtml(spare.code)})</h3>
        <div style="margin-bottom: 20px;">
            <strong>Total de Escaneamentos:</strong> ${escapeHtml(spare.scanCount || 0)}<br>
            <strong>Não-conformidades:</strong> ${escapeHtml(spare.nonCompliantOps?.length || 0)}<br>
            <strong>Processo Blockchain:</strong> <code>${escapeHtml(spare.blockchainProcessId || '-')}</code>
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
