/**
 * SPARES-CHAIN v6.3 — UI (Criação de Painéis e Elementos)
 */

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
                <div class="qr-placeholder">${icon('smartphone', 'xl')}</div>
            </div>
            <p>Arraste uma peça aqui</p>
        </div>
    `;
    return panel;
}

function createAlmoxPanel() {
    const isAlmox = state.currentUser?.role === 'ALMOX';
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header">
            <span class="panel-icon">${icon('package')}</span>
            <span class="panel-title">ALMOXARIFADO</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            ${isAlmox ? 'Recebe de fornecedores e registra saída para a transportadora.' : 'Peças disponíveis no almoxarifado (apenas visualização).'}
        </p>
        <div id="almoxarifado" class="drop-zone" ${isAlmox ? 'ondrop="drop(event)" ondragover="allowDrop(event)"' : ''}>
            <p>${icon('factory')} ESTOQUE ALMOXARIFADO</p>
            <div id="sparesList"></div>
            ${isAlmox ? `<button class="action-btn" onclick="addSpare()">${icon('plus')} Receber Peça</button>` : ''}
        </div>
        <div id="registerTransporterModal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width: 420px;">
                <div class="modal-header">
                    <h2 class="modal-title">${icon('truck')} Registrar Transportador</h2>
                    <button class="modal-close" onclick="closeRegisterTransporterModal()">✕</button>
                </div>
                <form id="transporterForm" onsubmit="submitTransporterForm(event)">
                    <div class="form-group">
                        <label for="transpName">Nome do Transportador</label>
                        <input type="text" id="transpName" required>
                    </div>
                    <div class="form-group">
                        <label for="transpDoc">Documento</label>
                        <input type="text" id="transpDoc" required>
                    </div>
                    <div class="form-group">
                        <label for="transpCompany">Empresa</label>
                        <input type="text" id="transpCompany" required>
                    </div>
                    <div class="form-group">
                        <label for="transpVehicle">Veículo</label>
                        <input type="text" id="transpVehicle" required>
                    </div>
                    <div class="form-group">
                        <label for="transpContact">Contato</label>
                        <input type="text" id="transpContact" required>
                    </div>
                    <input type="hidden" id="transpPartCode">
                    <button type="submit" class="action-btn">${icon('checkCircle')} Registrar Saída</button>
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
            Transportadora coleta peças do almoxarifado. Escaneamento recomendado antes da coleta.
        </p>
        <div id="transportCollect" class="drop-zone transportadora" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('package')} ZONA DE COLETA</p>
            <p style="font-size: 12px; color: #ffa502;">Peças aguardando coleta autorizada</p>
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
            Transportadora entrega peças a bordo. Escanear antes da entrega mantém a cadeia conforme.
        </p>
        <div id="transportDeliver" class="drop-zone transportadora" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('upload')} ZONA DE ENTREGA</p>
            <div id="transportInTransit" style="margin-top: 15px; width: 100%;"></div>
        </div>
        <div id="arrivalModal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width: 420px;">
                <div class="modal-header">
                    <h2 class="modal-title">${icon('clock')} Registrar Chegada</h2>
                    <button class="modal-close" onclick="closeArrivalModal()">✕</button>
                </div>
                <form id="arrivalForm" onsubmit="submitArrivalForm(event)">
                    <div class="form-group">
                        <label for="arrivalDatetime">Data/Hora de Chegada</label>
                        <input type="datetime-local" id="arrivalDatetime" required>
                    </div>
                    <input type="hidden" id="arrivalPartCode">
                    <button type="submit" class="action-btn">${icon('checkCircle')} Registrar Chegada</button>
                </form>
            </div>
        </div>
        <div id="deliveryModal" class="modal" style="display:none;">
            <div class="modal-content" style="max-width: 420px;">
                <div class="modal-header">
                    <h2 class="modal-title">${icon('upload')} Registrar Entrega</h2>
                    <button class="modal-close" onclick="closeDeliveryModal()">✕</button>
                </div>
                <form id="deliveryForm" onsubmit="submitDeliveryForm(event)">
                    <div class="form-group">
                        <label for="deliveryDatetime">Data/Hora de Entrega</label>
                        <input type="datetime-local" id="deliveryDatetime" required>
                    </div>
                    <input type="hidden" id="deliveryPartCode">
                    <button type="submit" class="action-btn">${icon('checkCircle')} Registrar Entrega</button>
                </form>
            </div>
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
            <div id="bordoList" style="margin-top: 15px; width: 100%;"></div>
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
            <div class="equipment-label">${icon('ship')} MCP BORESTE (BE)</div>
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
            ${['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].map((shelf) => `
                <div class="shelf-slot" data-shelf="${shelf}" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <div>${shelf}</div>
                    <div id="shelf${shelf}"></div>
                </div>
            `).join('')}
        </div>
        <div class="panel-header" style="margin-top: 20px;">
            <span class="panel-icon">${icon('alertTriangle')}</span>
            <span class="panel-title" style="color: #ff4757;">NÃO CONFORME</span>
        </div>
        <div class="shelf-slot" data-shelf="NAO_CONFORME" style="border:2px solid #ff4757; background:rgba(255,71,87,0.08); min-height:60px;" ondrop="drop(event)" ondragover="allowDrop(event)">
            <div>NAO CONFORME</div>
            <div id="shelfNAO_CONFORME"></div>
        </div>
    `;
    return panel;
}

function createQuarantinePanel() {
    const role = state.currentUser?.role;
    const description = role === 'CHEFE_MAQ'
        ? 'Peças removidas ficam em quarentena aguardando logística reversa.'
        : role === 'TRANSPORTADORA'
            ? 'Colete resíduos para descarte. Gera documento de descarte automático.'
            : 'Peças removidas aguardando coleta pela transportadora.';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
        <div class="panel-header" style="border-bottom-color: #ffa502;">
            <span class="panel-icon">${icon('trash')}</span>
            <span class="panel-title" style="color: #ffa502;">QUARENTENA/RESÍDUOS</span>
        </div>
        <p style="font-size: 14px; color: #aaa; margin-bottom: 15px;">
            ${description}
        </p>
        <div id="quarantine" class="drop-zone" style="border-color: #ffa502; background: rgba(255, 165, 2, 0.1);" ondrop="drop(event)" ondragover="allowDrop(event)">
            <p>${icon('alertTriangle')} ZONA DE QUARENTENA</p>
            <p style="font-size: 12px; color: #ffa502;">Apenas peças removidas</p>
            <div id="quarantineList" style="margin-top: 15px; width: 100%;"></div>
        </div>
        ${role === 'TRANSPORTADORA' ? `<button class="action-btn" style="background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);" onclick="showDisposalTransport()">${icon('truck')} Logística Reversa</button>` : ''}
    `;
    return panel;
}

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

function ensureInTransitForBordoPanel() {
    let panel = document.getElementById('inTransitForBordo');
    if (panel) return panel;

    const panelsGrid = document.getElementById('panelsGrid');
    if (!panelsGrid) return null;

    const transitPanel = createInTransitPanel();
    const scannerPanel = panelsGrid.firstElementChild;

    if (scannerPanel?.nextSibling) {
        panelsGrid.insertBefore(transitPanel, scannerPanel.nextSibling);
    } else {
        panelsGrid.appendChild(transitPanel);
    }

    return transitPanel.querySelector('#inTransitForBordo');
}

function showRoleInstructions() {
    if (!state.currentUser) return;

    const instructionsDiv = document.getElementById('roleInstructions');
    if (!instructionsDiv) return;

    let instructions = '';

    switch (state.currentUser.role) {
        case 'ALMOX':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Fluxo ALMOXARIFE</h3>
                <ol style="line-height: 2;">
                    <li><strong>Receber peça:</strong> clique em "${icon('plus')} Receber Peça".</li>
                    <li><strong>Escanear:</strong> valide a peça no scanner QR.</li>
                    <li><strong>Registrar saída:</strong> associe a coleta à transportadora.</li>
                </ol>
                <p style="margin-top: 15px; color: #00ff88;"><strong>${icon('checkCircle')} Responsabilidade:</strong> liberar apenas peças rastreáveis e identificadas.</p>
            `;
            break;
        case 'TRANSPORTADORA':
            instructions = `
                <h3 style="color: #ffa502; margin-bottom: 10px;">${icon('fileText')} Fluxo TRANSPORTADORA</h3>
                <ol style="line-height: 2;">
                    <li><strong>Coletar:</strong> retire peças com saída registrada pelo almoxarifado.</li>
                    <li><strong>Transportar:</strong> acompanhe a peça em trânsito.</li>
                    <li><strong>Entregar:</strong> registre chegada e entrega a bordo.</li>
                </ol>
                <p style="margin-top: 15px; color: #ffa502;"><strong>${icon('alertTriangle')} Crítico:</strong> ausência de escaneamento gera não-conformidade.</p>
            `;
            break;
        case 'CHEFE_MAQ':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Fluxo CHEFE DE MÁQUINAS</h3>
                <ol style="line-height: 2;">
                    <li><strong>Receber:</strong> confira as peças entregues a bordo.</li>
                    <li><strong>Armazenar:</strong> organize nas prateleiras do bordo.</li>
                    <li><strong>Instalar:</strong> escaneie antes de instalar no equipamento.</li>
                    <li><strong>Remover:</strong> direcione para quarentena, reaproveitamento ou não conforme.</li>
                </ol>
                <p style="margin-top: 15px; color: #00ff88;"><strong>${icon('checkCircle')} Boa prática:</strong> escanear cada movimentação mantém o histórico confiável.</p>
            `;
            break;
        case 'AUDITOR':
            instructions = `
                <h3 style="color: #00d4ff; margin-bottom: 10px;">${icon('fileText')} Responsabilidades AUDITOR</h3>
                <ol style="line-height: 2;">
                    <li><strong>Monitorar:</strong> acompanhe painéis e histórico completo.</li>
                    <li><strong>Investigar:</strong> valide responsáveis e motivos das falhas.</li>
                    <li><strong>Reportar:</strong> use os painéis de conformidade e descarte.</li>
                </ol>
                <p style="margin-top: 15px; color: #ff4757;"><strong>${icon('alertTriangle')} Alerta:</strong> uma lacuna de rastreabilidade compromete garantia e auditoria.</p>
            `;
            break;
        default:
            instructions = '';
    }

    instructionsDiv.innerHTML = instructions;
}

function getSpareControlMarkup(spare) {
    if (!state.currentUser) return '';

    const actions = [];
    const currentState = spare.currentState || 'RECEBIDO';

    if (state.currentUser.role === 'ALMOX' && currentState === 'RECEBIDO') {
        actions.push(
            `<button class="action-btn" style="margin-top:6px;" onclick="openRegisterTransporterModal('${spare.code}')">${icon('truck')} Registrar Saída</button>`
        );
    }

    if (state.currentUser.role === 'TRANSPORTADORA' && currentState === 'EM_TRANSITO') {
        actions.push(
            `<button class="action-btn" style="margin-top:6px;" onclick="openArrivalModal('${spare.code}')">${icon('clock')} Registrar Chegada</button>`
        );
        actions.push(
            `<button class="action-btn" style="margin-top:6px;" onclick="openDeliveryModal('${spare.code}')">${icon('upload')} Registrar Entrega</button>`
        );
    }

    return actions.join('');
}

function applySpareClasses(spareDiv, spare) {
    spareDiv.classList.remove('installed', 'in-transit', 'removed', 'non-compliant');

    switch (spare.currentState) {
        case 'INSTALADO':
            spareDiv.classList.add('installed');
            break;
        case 'EM_TRANSITO':
            spareDiv.classList.add('in-transit');
            break;
        case 'QUARENTENA':
        case 'NAO_CONFORME':
            spareDiv.classList.add('removed');
            break;
        default:
            break;
    }

    if (spare.nonCompliantOps?.length) {
        spareDiv.classList.add('non-compliant');
    }
}

function buildSpareElement(spare) {
    const spareDiv = document.createElement('div');
    spareDiv.className = 'spare-item';
    spareDiv.draggable = true;
    spareDiv.id = spare.code;
    spareDiv.dataset.name = spare.name;
    spareDiv.dataset.code = spare.code;
    spareDiv.dataset.state = spare.currentState || 'RECEBIDO';
    spareDiv.dataset.scanCount = String(spare.scanCount || 0);

    if (spare.lastScan) spareDiv.dataset.lastScan = spare.lastScan;
    if (spare.transportadora) spareDiv.dataset.transportadora = spare.transportadora;
    if (spare.shelf) spareDiv.dataset.shelf = spare.shelf;
    if (spare.equip) spareDiv.dataset.equip = spare.equip;
    if (spare.hours !== undefined) spareDiv.dataset.hours = String(spare.hours);

    applySpareClasses(spareDiv, spare);

    spareDiv.innerHTML = `
        <span class="spare-icon">${renderIcon(spare.icon)}</span>
        <div class="spare-info">
            <div class="spare-name">${escapeHtml(spare.name)}</div>
            <div class="spare-code">${escapeHtml(spare.code)}</div>
            <div class="spare-status">Estado: ${escapeHtml(spare.currentState || 'RECEBIDO')} | Scans: ${escapeHtml(spare.scanCount || 0)}</div>
        </div>
        ${spare.nonCompliantOps?.length ? '<div class="spare-warning">!</div>' : ''}
        ${getSpareControlMarkup(spare)}
    `;

    spareDiv.addEventListener('dragstart', drag);
    spareDiv.addEventListener('contextmenu', showContextMenu);
    return spareDiv;
}

function createSpareElement(name, code, spareIcon) {
    const spare = {
        code,
        name,
        icon: spareIcon,
        history: [],
        currentState: 'RECEBIDO',
        scanCount: 0,
        nonCompliantOps: [],
        transportEvents: []
    };

    if (!state.sparesData[code]) {
        state.sparesData[code] = spare;
    }

    const spareDiv = buildSpareElement(spare);
    placeSpareElement(spareDiv);
    saveAll();
    return spareDiv;
}

function recreateSpareElement(spare) {
    const spareDiv = buildSpareElement(spare);
    placeSpareElement(spareDiv);
    return spareDiv;
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

function placeSpareElement(spareDiv) {
    const stateName = spareDiv.dataset.state || 'RECEBIDO';
    let target = null;

    if (['RECEBIDO', 'AGUARDANDO_COLETA'].includes(stateName)) {
        target = document.getElementById('sparesList');
    } else if (stateName === 'EM_TRANSITO') {
        target = document.getElementById('transportInTransit') || ensureInTransitForBordoPanel();
    } else if (stateName === 'ENTREGUE_BORDO') {
        target = document.getElementById('bordoList');
    } else if (stateName === 'ARMAZENADO' && spareDiv.dataset.shelf) {
        target = document.getElementById(`shelf${spareDiv.dataset.shelf}`);
        const shelfSlot = target?.closest('.shelf-slot');
        if (shelfSlot) shelfSlot.classList.add('occupied');
    } else if (stateName === 'NAO_CONFORME') {
        target = document.getElementById('shelfNAO_CONFORME');
        const shelfSlot = target?.closest('.shelf-slot');
        if (shelfSlot) shelfSlot.classList.add('occupied');
    } else if (stateName === 'INSTALADO') {
        target = ensureSpareStagingArea();
    } else if (stateName === 'QUARENTENA') {
        target = document.getElementById('quarantineList');
    } else if (stateName === 'DESCARTADO_FINAL') {
        return;
    }

    if (!target) {
        target = ensureSpareStagingArea();
    }

    target.appendChild(spareDiv);
}

function clearRenderedSpares() {
    const selectors = [
        '#sparesList',
        '#transportInTransit',
        '#bordoList',
        '#quarantineList',
        '#inTransitForBordo',
        '#equipMCPBB',
        '#equipMCPBE',
        '#equipGERADOR',
        '#shelfA1',
        '#shelfA2',
        '#shelfA3',
        '#shelfB1',
        '#shelfB2',
        '#shelfB3',
        '#shelfNAO_CONFORME',
        '#spareStaging'
    ];

    selectors.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) element.innerHTML = '';
    });

    document.querySelectorAll('.equipment-slot').forEach((slot) => {
        slot.classList.remove('filled');
    });

    document.querySelectorAll('.shelf-slot').forEach((slot) => {
        slot.classList.remove('occupied');
    });
}

function restoreInstalledPart(equipName, installedData) {
    const code = installedData.code;
    const element = document.getElementById(code);

    if (!element) {
        console.warn(`Peça ${code} instalada em ${equipName} não encontrada no DOM`);
        return;
    }

    const equipContentId = equipName === 'MCP_BB'
        ? 'equipMCPBB'
        : equipName === 'MCP_BE'
            ? 'equipMCPBE'
            : 'equipGERADOR';

    const targetDiv = document.getElementById(equipContentId);
    if (!targetDiv) return;

    targetDiv.appendChild(element);

    const equipSlot = document.querySelector(`[data-equip="${equipName}"]`);
    if (equipSlot) equipSlot.classList.add('filled');

    element.dataset.state = 'INSTALADO';
    element.dataset.equip = equipName;
    element.dataset.hours = String(installedData.hours);
    element.classList.add('installed');
    updateSpareStatus(element);
}

function updateSpareStatus(element) {
    const statusDiv = element.querySelector('.spare-status');
    if (!statusDiv) return;

    statusDiv.textContent = `Estado: ${element.dataset.state} | Scans: ${element.dataset.scanCount || 0}`;
}

function addSpare() {
    if (state.currentUser?.role !== 'ALMOX') {
        alert('ACESSO NEGADO\n\nApenas ALMOXARIFE pode receber peças de fornecedores.');
        return;
    }

    const spareName = prompt('Nome da peça:');
    if (!spareName || !spareName.trim() || spareName.trim().length < 3) {
        alert('Nome da peça inválido.');
        return;
    }

    const spareCode = `SP-${new Date().getFullYear()}-${String(state.spareCounter).padStart(3, '0')}`;
    state.spareCounter += 1;

    createSpareElement(spareName.trim(), spareCode, 'wrench');

    const operator = state.currentUser?.name || 'Sistema';
    const blockchainEvent = addSpareEvent(spareCode, 'RECEBIDO', {
        operator,
        location: 'ALMOXARIFADO'
    });

    addLog(
        `${icon('package')} RECEBIDO no ALMOXARIFADO: ${escapeHtml(spareName.trim())} (${escapeHtml(spareCode)}) | Recebedor: ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`,
        'success'
    );

    updateDashboard();
}

function updateComplianceGrid() {
    const grid = document.getElementById('complianceGrid');
    if (!grid) return;

    if (!state.nonComplianceList.length) {
        grid.innerHTML = `<div style="text-align: center; color: #00ff88; padding: 20px;">${icon('checkCircle')} Sem não-conformidades</div>`;
        return;
    }

    const recent = state.nonComplianceList.slice(-3).reverse();
    grid.innerHTML = recent.map((nc) => `
        <div class="compliance-item critical">
            <strong>${escapeHtml(nc.operation)}</strong><br>
            <small>${escapeHtml(nc.spare)} | ${escapeHtml(nc.operator)}</small><br>
            <small style="color: #ff4757;">${escapeHtml(nc.reason)}</small>
        </div>
    `).join('');
}

function updateDashboard() {
    hydrateState();

    const spares = Object.values(state.sparesData);
    let totalParts = 0;
    let inTransit = 0;
    let installed = 0;
    let inQuarantine = 0;
    let totalScans = 0;
    let totalOps = 0;

    spares.forEach((spare) => {
        if (spare.currentState !== 'DESCARTADO_FINAL') {
            totalParts += 1;
        }

        if (spare.currentState === 'EM_TRANSITO') inTransit += 1;
        if (spare.currentState === 'INSTALADO') installed += 1;
        if (spare.currentState === 'QUARENTENA') inQuarantine += 1;

        totalScans += parseInt(spare.scanCount || 0, 10);
        totalOps += Array.isArray(spare.history) ? spare.history.length : 0;
    });

    if (totalOps === 0) totalOps = totalParts;

    const totalDisposed = state.disposalRecords.length;
    const compliance = totalOps > 0
        ? Math.min(100, ((totalScans / totalOps) * 100)).toFixed(0)
        : '100';

    const bindings = {
        kpiTotalParts: totalParts,
        kpiTotalScans: totalScans,
        kpiInTransit: inTransit,
        kpiInstalled: installed,
        kpiQuarantine: inQuarantine,
        kpiDisposed: totalDisposed,
        kpiNonCompliant: state.nonComplianceList.length,
        kpiCompliance: `${compliance}%`
    };

    Object.entries(bindings).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    });

    updateComplianceGrid();
}

function initializeSpares() {
    hydrateState();
    clearRenderedSpares();

    Object.values(state.sparesData).forEach((spare) => {
        recreateSpareElement(spare);
    });

    Object.entries(state.equipmentState).forEach(([equipName, installed]) => {
        restoreInstalledPart(equipName, installed);
    });

    updateDashboard();
}
