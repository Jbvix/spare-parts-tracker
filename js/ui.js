/**
 * SPARES-CHAIN v6.2 — UI (Criação de Painéis e Elementos)
 */

// ===== CRIAÇÃO DE PAINÉIS =====
function createScannerPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('qrCode')}</span>
            <span class="panel-title">SCANNER QR CODE</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            Arraste peça para escanear QR code. OBRIGATÓRIO em cada transferência.
        </p>
        <div id="scanner" class="drop-zone" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div class="scanner-frame">
                <div class="scanner-line"></div>
                <div class="qr-placeholder">${icon('smartphone','xl')}</div>
            </div>
            <p>Arraste uma peça aqui</p>
        </div>
    `;
    return panel;
}

function createAlmoxPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('package')}</span>
            <span class="panel-title">ALMOXARIFADO</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            ${state.currentUser.role === 'ALMOX' ? 'Recebe de fornecedores e entrega para transportadora.' : 'Peças disponíveis no almoxarifado (apenas visualização).'}
        </p>
        <div id="almoxarifado" class="drop-zone" ${state.currentUser.role === 'ALMOX' ? 'ondrop="drop(event)" ondragover="allowDrop(event)"' : ''}>
            <p>${icon('factory')} ESTOQUE ALMOXARIFADO</p>
            <div id="sparesList"></div>
            ${state.currentUser.role === 'ALMOX' ? '<button class="action-btn" onclick="addSpare()">' + icon('plus') + ' Receber Peça</button>' : ''}
        </div>
    `;
    return panel;
}

function createTransportadoraCollectPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel transportadora';
    panel.innerHTML = `
        <div class="panel-header transportadora">
            <span class="panel-icon">${icon('truck')}</span>
            <span class="panel-title transportadora">COLETA (Almoxarifado)</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            Transportadora coleta peças do almoxarifado. <strong>ESCANEAR ao coletar!</strong>
        </p>
        <div id="transportCollect" class="drop-zone transportadora" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('package')} ZONA DE COLETA</p>
            <p style="font-size: 12px; color: #ffa502;">Arraste peça escaneada para coletar</p>
        </div>
    `;
    return panel;
}

function createTransportadoraDeliverPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel transportadora';
    panel.innerHTML = `
        <div class="panel-header transportadora">
            <span class="panel-icon">${icon('ship')}</span>
            <span class="panel-title transportadora">ENTREGA (Bordo)</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            Transportadora entrega peças a bordo. <strong>ESCANEAR ao entregar!</strong>
        </p>
        <div id="transportDeliver" class="drop-zone transportadora" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('upload')} ZONA DE ENTREGA</p>
            <div id="transportInTransit" style="margin-top: 15px;"></div>
        </div>
    `;
    return panel;
}

function createEquipmentPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('cog')}</span>
            <span class="panel-title">MOTORES & EQUIPAMENTOS</span>
        </div>
        <div class="equipment-slot" data-equip="MCP_BB" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div class="equipment-label">${icon('ship')} MCP BOMBORDO (BB)</div>
            <div id="equipMCPBB"></div>
        </div>
        <div class="equipment-slot" data-equip="MCP_BE" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div class="equipment-label">${icon('ship')} MCP BOMBORDO (BE)</div>
            <div id="equipMCPBE"></div>
        </div>
        <div class="equipment-slot" data-equip="GERADOR" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div class="equipment-label">${icon('zap')} GERADOR PRINCIPAL</div>
            <div id="equipGERADOR"></div>
        </div>
    `;
    return panel;
}

function createShelfPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('archive')}</span>
            <span class="panel-title">PRATELEIRAS BORDO</span>
        </div>
        <div class="shelf-grid">
            ${['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].map(shelf => `
                <div class="shelf-slot" data-shelf="${shelf}" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <div>${shelf}</div>
                    <div id="shelf${shelf}"></div>
                </div>
            `).join('')}
        </div>
    `;
    return panel;
}

function createQuarantinePanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header" style="border-bottom-color: #ffa502;">
            <span class="panel-icon">${icon('trash')}</span>
            <span class="panel-title" style="color: #ffa502;">QUARENTENA/RESÍDUOS</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            ${state.currentUser.role === 'CHEFE_MAQ' ? 
                'Peças REMOVIDAS aguardam logística reversa. Arraste apenas peças REMOVIDAS.' : 
                state.currentUser.role === 'TRANSPORTADORA' ?
                'Colete resíduos para descarte. Gera documento de descarte automático.' :
                'Peças removidas aguardando coleta pela transportadora.'}
        </p>
        <div id="quarantine" class="drop-zone" style="border-color: #ffa502; background: rgba(255, 165, 2, 0.1);" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('alertTriangle')} ZONA DE QUARENTENA</p>
            <p style="font-size: 12px; color: #ffa502;">Apenas peças REMOVIDAS</p>
            <div id="quarantineList" style="margin-top: 15px;"></div>
        </div>
        ${state.currentUser.role === 'TRANSPORTADORA' ? '<button class="action-btn" style="background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);" onclick="showDisposalTransport()">' + icon('truck') + ' Logística Reversa</button>' : ''}
    `;
    return panel;
}

// ===== INSTRUÇÕES POR PAPEL =====
function showRoleInstructions() {
    if (!state.currentUser) return;

    const instructionsDiv = document.getElementById('roleInstructions');
    let instructions = '';

    switch (state.currentUser.role) {
        case 'ALMOX':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Fluxo ALMOXARIFE:</h3>
                <ol style="line-height: 2;">
                    <li><strong>Receber peça:</strong> Clique "${icon('plus')} Receber Peça" → QR gerado automaticamente</li>
                    <li><strong>Escanear:</strong> Arraste peça → Scanner QR (validar autenticidade)</li>
                    <li><strong>Entregar para transportadora:</strong> Transportadora coleta do almoxarifado</li>
                </ol>
                <p style="margin-top: 15px; color: #00ff88;"><strong>${icon('checkCircle')} RESPONSABILIDADE:</strong> Garantir que peça genuína sai do almoxarifado com QR escaneado.</p>
            `;
            break;
        case 'TRANSPORTADORA':
            instructions = `
                <h3 style="color: #ffa502; margin-bottom: 10px;">${icon('fileText')} Fluxo TRANSPORTADORA:</h3>
                <ol style="line-height: 2;">
                    <li><strong>Coletar no almoxarifado:</strong> Escanear peça → Arrastar para "ZONA DE COLETA"</li>
                    <li><strong>Transporte:</strong> Peça fica "EM TRÂNSITO" (rastreável)</li>
                    <li><strong>Entregar no bordo:</strong> Escanear novamente → Registrar entrega</li>
                </ol>
                <p style="margin-top: 15px; color: #ffa502;"><strong>${icon('alertTriangle')} CRÍTICO:</strong> SEMPRE escanear em COLETA e ENTREGA. Falha = não-conformidade registrada!</p>
            `;
            break;
        case 'CHEFE_MAQ':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Fluxo CHEFE DE MÁQUINAS:</h3>
                <ol style="line-height: 2;">
                    <li><strong>Receber da transportadora:</strong> Escanear peça ao receber</li>
                    <li><strong>Armazenar:</strong> Arrastar para prateleira (A1-B3)</li>
                    <li><strong>Retirar:</strong> Escanear ao retirar da prateleira</li>
                    <li><strong>Instalar:</strong> Escanear → Arrastar para motor + informar horas</li>
                </ol>
                <p style="margin-top: 15px; color: #00ff88;"><strong>${icon('checkCircle')} BOA PRÁTICA:</strong> Escanear em CADA movimentação mantém conformidade 100%!</p>
            `;
            break;
        case 'AUDITOR':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Responsabilidades AUDITOR:</h3>
                <ol style="line-height: 2;">
                    <li><strong>Monitorar conformidade:</strong> Painel mostra operações sem escaneamento</li>
                    <li><strong>Identificar responsáveis:</strong> Cada não-conformidade registra operador</li>
                    <li><strong>Análise de tendências:</strong> Quem/onde ocorrem mais falhas?</li>
                    <li><strong>Relatórios:</strong> Clique "Ver Detalhes" para análise completa</li>
                </ol>
                <p style="margin-top: 15px; color: #ff4757;"><strong>${icon('alertTriangle')} ALERTA:</strong> Não-conformidades quebram cadeia de custódia e invalidam garantias!</p>
            `;
            break;
    }

    instructionsDiv.innerHTML = instructions;
}

// ===== CRIAÇÃO DE ELEMENTOS DE PEÇAS =====
function createSpareElement(name, code, spareIcon) {
    const spareDiv = document.createElement('div');
    spareDiv.className = 'spare-item';
    spareDiv.draggable = true;
    spareDiv.id = code;
    spareDiv.dataset.name = name;
    spareDiv.dataset.code = code;
    spareDiv.dataset.state = 'RECEBIDO';
    spareDiv.dataset.scanCount = '0';

    spareDiv.innerHTML = `
        <span class="spare-icon">${icon(spareIcon)}</span>
        <div class="spare-info">
            <div class="spare-name">${escapeHtml(name)}</div>
            <div class="spare-code">${escapeHtml(code)}</div>
            <div class="spare-status">Estado: RECEBIDO | Scans: 0</div>
        </div>
    `;

    spareDiv.addEventListener('dragstart', drag);
    spareDiv.addEventListener('contextmenu', showContextMenu);

    const sparesList = document.getElementById('sparesList');
    if (sparesList) sparesList.appendChild(spareDiv);

    if (!state.sparesData[code]) {
        state.sparesData[code] = {
            code, name, icon: spareIcon,
            history: [],
            currentState: 'RECEBIDO',
            scanCount: 0,
            nonCompliantOps: []
        };
        saveAll();
    }
}

function recreateSpareElement(spare) {
    const spareDiv = document.createElement('div');
    spareDiv.className = 'spare-item';
    spareDiv.draggable = true;
    spareDiv.id = spare.code;
    spareDiv.dataset.name = spare.name;
    spareDiv.dataset.code = spare.code;
    spareDiv.dataset.state = spare.currentState || 'RECEBIDO';
    spareDiv.dataset.scanCount = spare.scanCount || '0';

    if (spare.currentState === 'INSTALADO') spareDiv.classList.add('installed');
    else if (spare.currentState === 'EM_TRANSITO') spareDiv.classList.add('in-transit');
    else if (spare.currentState === 'REMOVIDO') spareDiv.classList.add('removed');

    if (spare.nonCompliantOps && spare.nonCompliantOps.length > 0) {
        spareDiv.classList.add('non-compliant');
    }

    spareDiv.innerHTML = `
        <span class="spare-icon">${icon(spare.icon)}</span>
        <div class="spare-info">
            <div class="spare-name">${escapeHtml(spare.name)}</div>
            <div class="spare-code">${escapeHtml(spare.code)}</div>
            <div class="spare-status">Estado: ${escapeHtml(spare.currentState || 'RECEBIDO')} | Scans: ${spare.scanCount || 0}</div>
        </div>
        ${spare.nonCompliantOps && spare.nonCompliantOps.length > 0 ? '<div class="spare-warning">!</div>' : ''}
    `;

    spareDiv.addEventListener('dragstart', drag);
    spareDiv.addEventListener('contextmenu', showContextMenu);

    const sparesList = document.getElementById('sparesList');
    if (sparesList) sparesList.appendChild(spareDiv);
}

function restoreInstalledPart(equipName, installedData) {
    const code = installedData.code;
    const element = document.getElementById(code);

    if (!element) {
        console.warn(`Peça ${code} instalada em ${equipName} não encontrada no DOM`);
        return;
    }

    const equipContentId = equipName === 'MCP_BB' ? 'equipMCPBB' :
                           equipName === 'MCP_BE' ? 'equipMCPBE' : 'equipGERADOR';
    const targetDiv = document.getElementById(equipContentId);
    if (targetDiv) targetDiv.appendChild(element);

    const equipSlot = document.querySelector(`[data-equip="${equipName}"]`);
    if (equipSlot) equipSlot.classList.add('filled');

    element.dataset.state = 'INSTALADO';
    element.dataset.equip = equipName;
    element.dataset.hours = installedData.hours;
    element.classList.add('installed');
    updateSpareStatus(element);
}

function updateSpareStatus(element) {
    const statusDiv = element.querySelector('.spare-status');
    if (statusDiv) {
        const scanCount = element.dataset.scanCount || 0;
        statusDiv.textContent = `Estado: ${element.dataset.state} | Scans: ${scanCount}`;
    }
}

// ===== ADICIONAR PEÇA =====
function addSpare() {
    if (state.currentUser && state.currentUser.role !== 'ALMOX') {
        alert('ACESSO NEGADO\n\nApenas ALMOXARIFE pode receber peças de fornecedores.');
        return;
    }

    const spareName = prompt('Nome da peça:');
    if (!spareName) return;

    const spareCode = `SP-2025-${String(state.spareCounter).padStart(3, '0')}`;
    state.spareCounter++;
    localStorage.setItem('spareCounter', state.spareCounter);

    createSpareElement(spareName, spareCode, 'wrench');

    const operator = state.currentUser ? state.currentUser.name : 'Sistema';
    addLog(`${icon('package')} RECEBIDO no ALMOXARIFADO: ${escapeHtml(spareName)} (${escapeHtml(spareCode)}) | Recebedor: ${escapeHtml(operator)}`, 'success');

    addSpareEvent(spareCode, 'RECEBIDO', {
        operator,
        location: 'ALMOXARIFADO'
    });

    updateDashboard();
}

// ===== DASHBOARD =====
function updateDashboard() {
    let totalParts = 0;
    let inTransit = 0;
    let installed = 0;
    let inQuarantine = 0;
    let totalScans = 0;
    let totalOps = 0;

    const allSpares = document.querySelectorAll('.spare-item');
    totalParts = allSpares.length;

    allSpares.forEach(spare => {
        const st = spare.dataset.state;
        const scanCount = parseInt(spare.dataset.scanCount || 0);
        if (st === 'EM_TRANSITO') inTransit++;
        if (st === 'INSTALADO') installed++;
        if (st === 'QUARENTENA') inQuarantine++;
        totalScans += scanCount;
    });

    for (let code in state.sparesData) {
        totalOps += state.sparesData[code].history.length;
    }
    if (totalOps === 0) totalOps = totalParts;

    document.getElementById('kpiTotalParts').textContent = totalParts;
    document.getElementById('kpiTotalScans').textContent = totalScans;
    document.getElementById('kpiInTransit').textContent = inTransit;
    document.getElementById('kpiInstalled').textContent = installed;
    document.getElementById('kpiQuarantine').textContent = inQuarantine;
    document.getElementById('kpiDisposed').textContent = state.disposalRecords.length;
    document.getElementById('kpiNonCompliant').textContent = state.nonComplianceList.length;

    const compliance = totalOps > 0 ? Math.min(100, ((totalScans / totalOps) * 100)).toFixed(0) : 100;
    document.getElementById('kpiCompliance').textContent = compliance + '%';

    updateComplianceGrid();

    console.log('[DASH] Dashboard atualizado:', {
        totalParts, totalScans, inTransit, installed, inQuarantine,
        disposed: state.disposalRecords.length, totalOps,
        compliance: compliance + '%',
        nonCompliance: state.nonComplianceList.length
    });
}

function updateComplianceGrid() {
    const grid = document.getElementById('complianceGrid');

    if (state.nonComplianceList.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #00ff88; padding: 20px;">' + icon('checkCircle') + ' Sem não-conformidades</div>';
        return;
    }

    const recent = state.nonComplianceList.slice(-3);
    grid.innerHTML = recent.map(nc => `
        <div class="compliance-item critical">
            <strong>${nc.operation}</strong><br>
            <small>${nc.spare} | ${nc.operator}</small><br>
            <small style="color: #ff4757;">${nc.reason}</small>
        </div>
    `).join('');
}

// ===== INICIALIZAÇÃO DE PEÇAS =====
function initializeSpares() {
    const savedSpares = localStorage.getItem('sparesData');
    if (savedSpares) {
        try {
            state.sparesData = JSON.parse(savedSpares);
            for (let code in state.sparesData) {
                recreateSpareElement(state.sparesData[code]);
            }
            addLog(`${icon('refresh')} ${Object.keys(state.sparesData).length} peça(s) carregada(s) do sistema`, 'success');
        } catch (e) { console.error('Erro ao carregar peças:', e); }
    }

    const savedEquipment = localStorage.getItem('equipmentState');
    if (savedEquipment) {
        try {
            state.equipmentState = JSON.parse(savedEquipment);
            for (let equipName in state.equipmentState) {
                restoreInstalledPart(equipName, state.equipmentState[equipName]);
            }
            addLog(`${icon('wrench')} ${Object.keys(state.equipmentState).length} equipamento(s) com peças instaladas`, 'success');
        } catch (e) { console.error('Erro ao carregar equipamentos:', e); }
    }

    const savedDisposals = localStorage.getItem('disposalRecords');
    if (savedDisposals) {
        try {
            state.disposalRecords = JSON.parse(savedDisposals);
            addLog(`${icon('trash')} ${state.disposalRecords.length} descarte(s) registrado(s)`, 'warning');
        } catch (e) { console.error('Erro ao carregar descartes:', e); }
    }

    const savedQuarantine = localStorage.getItem('quarantineItems');
    if (savedQuarantine) {
        try {
            state.quarantineItems = JSON.parse(savedQuarantine);
            state.quarantineItems.forEach(item => {
                const element = document.getElementById(item.code);
                if (element) {
                    const targetDiv = document.getElementById('quarantineList');
                    if (targetDiv) {
                        targetDiv.appendChild(element);
                        element.dataset.state = 'QUARENTENA';
                        element.classList.add('removed');
                        updateSpareStatus(element);
                    }
                }
            });
            addLog(`${icon('alertTriangle')} ${state.quarantineItems.length} item(ns) em quarentena`, 'warning');
        } catch (e) { console.error('Erro ao carregar quarentena:', e); }
    }

    const savedNonCompliance = localStorage.getItem('nonComplianceList');
    if (savedNonCompliance) {
        try {
            state.nonComplianceList = JSON.parse(savedNonCompliance);
            if (state.nonComplianceList.length > 0) {
                addLog(`${icon('alertTriangle')} ${state.nonComplianceList.length} não-conformidade(s) registrada(s)`, 'danger');
            }
        } catch (e) { console.error('Erro ao carregar não-conformidades:', e); }
    }

    if (Object.keys(state.sparesData).length === 0) {
        const exampleSpares = [
            { name: 'Filtro de Óleo', code: 'FO-2025-001', icon: 'droplet' },
            { name: 'Filtro de Ar', code: 'FA-2025-002', icon: 'wind' },
            { name: 'Rolamento SKF', code: 'RL-2025-003', icon: 'cog' }
        ];
        exampleSpares.forEach(spare => createSpareElement(spare.name, spare.code, spare.icon));
    }

    updateDashboard();
}
