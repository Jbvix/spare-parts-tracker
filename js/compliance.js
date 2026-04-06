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

    content.innerHTML = `
        <h3 style="color: #00d4ff; margin-bottom: 20px;">${icon(spare.icon)} ${escapeHtml(spare.name)} (${escapeHtml(spare.code)})</h3>
        <div style="margin-bottom: 20px;">
            <strong>Total de Escaneamentos:</strong> ${spare.scanCount}<br>
            <strong>Não-conformidades:</strong> ${spare.nonCompliantOps.length}
        </div>
        <div class="history-timeline">
            ${spare.history.map((event) => `
                <div class="history-item">
                    <strong>${escapeHtml(event.type)}</strong><br>
                    <small>${new Date(event.timestamp).toLocaleString('pt-BR')}</small><br>
                    ${Object.entries(event.data).map(([key, value]) =>
                        `${escapeHtml(key)}: ${formatHistoryValue(value)}`
                    ).join('<br>')}
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('historyModal').classList.add('active');
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
            hash: generateHash(code, disposalDoc, Date.now())
        };

        state.disposalRecords.push(disposalRecord);
        processedItems.push(disposalRecord);

        addSpareEvent(code, 'DESCARTADO_FINAL', {
            disposalDoc,
            transportCompany,
            operator: transportOperator,
            collectionDate
        });

        item.remove();
    });

    state.quarantineItems = [];

    addLog(
        `${icon('truck')} LOGÍSTICA REVERSA: ${processedItems.length} item(ns) coletado(s) | ` +
        `Doc: ${disposalDoc} | ${transportOperator} (${transportCompany})`,
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
        <div style="background: rgba(0, 0, 0, 0.8); border: 3px solid #00d4ff; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
            <h2 style="color: #00d4ff; text-align: center; margin-bottom: 20px;">${icon('fileText')} DOCUMENTO DE DESCARTE</h2>
            <div style="text-align: center; font-size: 32px; font-weight: bold; color: #ffa502; margin: 20px 0; padding: 15px; background: rgba(255, 165, 2, 0.1); border-radius: 8px;">
                ${docNumber}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
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
            <div style="background: rgba(0, 0, 0, 0.3); border-left: 4px solid #ff4757; border-radius: 5px; padding: 15px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <strong>#${index + 1} - ${escapeHtml(item.name)}</strong><br>
                        <small style="color: #aaa;">${escapeHtml(item.code)}</small>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #00d4ff;">Trabalhou: ${item.hoursWorked.toFixed(1)}h</strong>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 13px;">
                    <strong>Equipamento:</strong> ${escapeHtml(item.equipment)} |
                    <strong>Motivo:</strong> ${escapeHtml(item.reason)}<br>
                    <strong>Removido por:</strong> ${escapeHtml(item.removedBy)}<br>
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
function closeWelcomeModal() {
    document.getElementById('welcomeModal').classList.remove('active');
    localStorage.setItem('welcomeShown', 'true');
}

function checkFirstVisit() {
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (!welcomeShown) {
        document.getElementById('welcomeModal').classList.add('active');
    }
}
