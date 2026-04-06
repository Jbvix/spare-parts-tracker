/**
 * SPARES-CHAIN v6.3 — UI (Criação de Painéis e Elementos)
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
window.createScannerPanel = createScannerPanel;

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
        <div id="registerTransporterModal" class="modal" style="display:none; z-index:9999;">
            <div class="modal-content" style="max-width:400px;">
                <div class="modal-header">
                    <h2 class="modal-title">Registrar Transportador</h2>
                    <button class="modal-close" onclick="closeRegisterTransporterModal()">✕</button>
                </div>
                <form id="transporterForm" onsubmit="submitTransporterForm(event)">
                    <label>Nome do Transportador:<input type="text" id="transpName" required></label><br>
                    <label>Documento:<input type="text" id="transpDoc" required></label><br>
                    <label>Empresa:<input type="text" id="transpCompany" required></label><br>
                    <label>Veículo:<input type="text" id="transpVehicle" required></label><br>
                    <label>Contato:<input type="text" id="transpContact" required></label><br>
                    <input type="hidden" id="transpPartCode">
                    <button type="submit" class="action-btn" style="margin-top:10px;">Registrar Saída</button>
                </form>
            </div>
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

function createBordoPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('ship')}</span>
            <span class="panel-title">RECEBIMENTO A BORDO</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            Peças entregues pela transportadora aguardando conferência, armazenamento ou instalação.
        </p>
        <div id="bordo" class="drop-zone">
            <p>${icon('package')} ESTOQUE DE BORDO</p>
            <div id="bordoList" style="margin-top: 15px;"></div>
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
        <div class="panel-header" style="margin-top:20px;">
            <span class="panel-icon">${icon('alertTriangle')}</span>
            <span class="panel-title" style="color:#ff4757;">NÃO CONFORME</span>
        </div>
        <div class="shelf-slot" data-shelf="NAO_CONFORME" style="border:2px solid #ff4757; background:rgba(255,71,87,0.08); min-height:60px;" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div>NAO CONFORME</div>
            <div id="shelfNAO_CONFORME"></div>
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
                'Peças removidas ficam em quarentena aguardando logística reversa.' : 
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

// ===== PAINEL DE PEÇAS EM TRÂNSITO (VISÍVEL PARA CHEFE DE MÁQUINAS) =====
function createInTransitPanel() {
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header" style="border-bottom-color: #ffa502;">
            <span class="panel-icon">${icon('truck')}</span>
            <span class="panel-title" style="color: #ffa502;">PEÇAS EM TRÂNSITO</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            Peças coletadas pela transportadora e a caminho do bordo. Aguarde entrega.
        </p>
        <div id="inTransitForBordo" style="min-height: 40px;"></div>
    `;
    return panel;
}

// Garante que o painel de trânsito do Chefe de Máquinas existe sempre que necessário
function ensureInTransitForBordoPanel() {
    let panel = document.getElementById('inTransitForBordo');
    if (!panel) {
        // Cria dinamicamente se não existir
        const panelsGrid = document.getElementById('panelsGrid');
        if (panelsGrid) {
            const transitPanel = document.createElement('div');
            transitPanel.className = 'panel';
            transitPanel.innerHTML = `
                <div class="panel-header" style="border-bottom-color: #ffa502;">
                    <span class="panel-icon">${icon('truck')}</span>
                    <span class="panel-title" style="color: #ffa502;">PEÇAS EM TRÂNSITO</span>
                </div>
                <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
                    Peças coletadas pela transportadora e a caminho do bordo. Aguarde entrega.
                </p>
                <div id="inTransitForBordo" style="min-height: 40px;"></div>
            `;
            panelsGrid.insertBefore(transitPanel, panelsGrid.firstChild.nextSibling); // após scanner
            panel = transitPanel.querySelector('#inTransitForBordo');
        }
    }
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
    if (spare.lastScan) spareDiv.dataset.lastScan = spare.lastScan;
    if (spare.transportadora) spareDiv.dataset.transportadora = spare.transportadora;
    if (spare.shelf) spareDiv.dataset.shelf = spare.shelf;

    if (spare.currentState === 'INSTALADO') spareDiv.classList.add('installed');
    else if (spare.currentState === 'EM_TRANSITO') spareDiv.classList.add('in-transit');
    else if (spare.currentState === 'REMOVIDO' || spare.currentState === 'QUARENTENA') spareDiv.classList.add('removed');

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
        ${(state.currentUser.role === 'ALMOX' && (spare.currentState === 'RECEBIDO' || spare.currentState === 'ESCANEADO')) ? `<button class='action-btn' style='margin-top:6px;' onclick='openRegisterTransporterModal(\"${spare.code}\")'>${icon('truck')} Registrar Saída/Transportador</button>` : ''}
        ${(state.currentUser.role === 'TRANSPORTADORA' && spare.currentState === 'EM_TRANSITO') ? `<button class='action-btn' style='margin-top:6px;' onclick='openArrivalModal(\"${spare.code}\")'>${icon('clock')} Registrar Chegada no Destino</button><button class='action-btn' style='margin-top:6px;' onclick='openDeliveryModal(\"${spare.code}\")'>${icon('upload')} Registrar Entrega a Bordo</button>` : ''}
    `;
        <!-- Modal Chegada no Destino -->
        <div id="arrivalModal" class="modal" style="display:none; z-index:9999;">
            <div class="modal-content" style="max-width:400px;">
                <div class="modal-header">
                    <h2 class="modal-title">Registrar Chegada no Destino</h2>
                    <button class="modal-close" onclick="closeArrivalModal()">✕</button>
                </div>
                <form id="arrivalForm" onsubmit="submitArrivalForm(event)">
                    <label>Data/Hora de Chegada:<input type="datetime-local" id="arrivalDatetime" required></label><br>
                    <input type="hidden" id="arrivalPartCode">
                    <button type="submit" class="action-btn" style="margin-top:10px;">Registrar Chegada</button>
                </form>
            </div>
        </div>
        <!-- Modal Entrega a Bordo -->
        <div id="registerTransporterModal" class="modal" style="display:none; z-index:9999;"></div>
        <div id="arrivalModal" class="modal" style="display:none; z-index:9999;"></div>
        <div id="deliveryModal" class="modal" style="display:none; z-index:9999;"></div>
    } else if (stateName === 'ARMAZENADO' && spareDiv.dataset.shelf) {
        target = document.getElementById(`shelf${spareDiv.dataset.shelf}`);
        const shelfSlot = target ? target.closest('.shelf-slot') : null;
        if (shelfSlot) shelfSlot.classList.add('occupied');
    } else if (stateName === 'INSTALADO') {
        target = ensureSpareStagingArea();
    } else if (stateName === 'QUARENTENA') {
        target = document.getElementById('quarantineList');
    } else if (stateName === 'DESCARTADO_FINAL') {
        return;
    }
    if (target) target.appendChild(spareDiv);
}

function ensureSpareStagingArea() {
    let staging = document.getElementById('spareStaging');
    if (staging) return staging;

    staging = document.createElement('div');
    staging.id = 'spareStaging';
    staging.className = 'hidden';

    const mainInterface = document.getElementById('mainInterface');
    if (mainInterface) {
        mainInterface.appendChild(staging);
    }

    return staging;
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
    if (!spareName || !spareName.trim() || spareName.length < 3) {
        alert('Nome da peça inválido.');
        return;
    }

    const spareCode = `SP-${new Date().getFullYear()}-${String(state.spareCounter).padStart(3, '0')}`;
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
    ensureSparesData();
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
        if (state.sparesData[code] && state.sparesData[code].history) {
            totalOps += state.sparesData[code].history.length;
        }
    }
    if (totalOps === 0) totalOps = totalParts;
    document.getElementById('kpiTotalParts').textContent = totalParts;
    document.getElementById('kpiTotalScans').textContent = totalScans;
    document.getElementById('kpiInTransit').textContent = inTransit;
    document.getElementById('kpiInstalled').textContent = installed;
    document.getElementById('kpiQuarantine').textContent = inQuarantine;
    document.getElementById('kpiDisposed').textContent = state.disposalRecords ? state.disposalRecords.length : 0;
    document.getElementById('kpiNonCompliant').textContent = state.nonComplianceList ? state.nonComplianceList.length : 0;
    const compliance = totalOps > 0 ? Math.min(100, ((totalScans / totalOps) * 100)).toFixed(0) : 100;
    document.getElementById('kpiCompliance').textContent = compliance + '%';
    if (typeof updateComplianceGrid === 'function') updateComplianceGrid();
    console.log('[DASH] Dashboard atualizado:', {
        totalParts, totalScans, inTransit, installed, inQuarantine,
        disposed: state.disposalRecords ? state.disposalRecords.length : 0, totalOps,
        compliance: compliance + '%',
        nonCompliance: state.nonComplianceList ? state.nonComplianceList.length : 0
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
            <strong>${escapeHtml(nc.operation)}</strong><br>
            <small>${escapeHtml(nc.spare)} | ${escapeHtml(nc.operator)}</small><br>
            <small style="color: #ff4757;">${escapeHtml(nc.reason)}</small>
        </div>
    `).join('');
}

// ===== INICIALIZAÇÃO DE PEÇAS =====
function initializeSpares() {
    ensureSparesData();
    const savedSpares = localStorage.getItem('sparesData');
    if (savedSpares) {
        try {
            state.sparesData = JSON.parse(savedSpares);
            if (!state.sparesData || typeof state.sparesData !== 'object') state.sparesData = {};
            for (let code in state.sparesData) {
                recreateSpareElement(state.sparesData[code]);
            }
            addLog(`${icon('refresh')} ${Object.keys(state.sparesData).length} peça(s) carregada(s) do sistema`, 'success');
        } catch (e) { console.error('Erro ao carregar peças:', e); state.sparesData = {}; }
    }
    updateDashboard();
}

// [CORREÇÃO] Garante que state.sparesData sempre existe antes de updateDashboard
function ensureSparesData() {
    if (!state.sparesData || typeof state.sparesData !== 'object') {
        state.sparesData = {};
    }
}

// Patch seguro para updateDashboard
const originalUpdateDashboard = updateDashboard;
window.updateDashboard = function() {
    ensureSparesData();
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
        if (state.sparesData[code] && state.sparesData[code].history) {
            totalOps += state.sparesData[code].history.length;
        }
    }
    if (totalOps === 0) totalOps = totalParts;
    document.getElementById('kpiTotalParts').textContent = totalParts;
    document.getElementById('kpiTotalScans').textContent = totalScans;
    document.getElementById('kpiInTransit').textContent = inTransit;
    document.getElementById('kpiInstalled').textContent = installed;
    document.getElementById('kpiQuarantine').textContent = inQuarantine;
    document.getElementById('kpiDisposed').textContent = state.disposalRecords ? state.disposalRecords.length : 0;
    document.getElementById('kpiNonCompliant').textContent = state.nonComplianceList ? state.nonComplianceList.length : 0;
    const compliance = totalOps > 0 ? Math.min(100, ((totalScans / totalOps) * 100)).toFixed(0) : 100;
    document.getElementById('kpiCompliance').textContent = compliance + '%';
    if (typeof updateComplianceGrid === 'function') updateComplianceGrid();
    console.log('[DASH] Dashboard atualizado:', {
        totalParts, totalScans, inTransit, installed, inQuarantine,
        disposed: state.disposalRecords ? state.disposalRecords.length : 0, totalOps,
        compliance: compliance + '%',
        nonCompliance: state.nonComplianceList ? state.nonComplianceList.length : 0
    });
};

// Patch seguro para placeSpareElement
window.placeSpareElement = function(spareDiv) {
    const stateName = spareDiv.dataset.state || 'RECEBIDO';
    let target = null;
    if (stateName === 'RECEBIDO' || stateName === 'ESCANEADO') {
        target = document.getElementById('sparesList');
    } else if (stateName === 'EM_TRANSITO') {
        target = document.getElementById('transportInTransit');
        if (!target) {
            // fallback seguro
            let panel = document.getElementById('inTransitForBordo');
            if (!panel) {
                const panelsGrid = document.getElementById('panelsGrid');
                if (panelsGrid) {
                    const transitPanel = document.createElement('div');
                    transitPanel.className = 'panel';
                    transitPanel.innerHTML = `
                        <div class="panel-header" style="border-bottom-color: #ffa502;\">\n                            <span class="panel-icon">${icon('truck')}</span>\n                            <span class="panel-title" style="color: #ffa502;">PEÇAS EM TRÂNSITO</span>\n                        </div>\n                        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;\">\n                            Peças coletadas pela transportadora e a caminho do bordo. Aguarde entrega.\n                        </p>\n                        <div id="inTransitForBordo" style="min-height: 40px;\"></div>\n                    `;
                    panelsGrid.insertBefore(transitPanel, panelsGrid.firstChild.nextSibling);
                    panel = transitPanel.querySelector('#inTransitForBordo');
                }
            }
            target = panel;
        }
    } else if (stateName === 'ENTREGUE_BORDO') {
        target = document.getElementById('bordoList');
    } else if (stateName === 'ARMAZENADO' && spareDiv.dataset.shelf) {
        target = document.getElementById(`shelf${spareDiv.dataset.shelf}`);
        const shelfSlot = target ? target.closest('.shelf-slot') : null;
        if (shelfSlot) shelfSlot.classList.add('occupied');
    } else if (stateName === 'INSTALADO') {
        target = ensureSpareStagingArea();
    } else if (stateName === 'QUARENTENA') {
        target = document.getElementById('quarantineList');
    } else if (stateName === 'DESCARTADO_FINAL') {
        return;
    }
    if (target) target.appendChild(spareDiv);
};
