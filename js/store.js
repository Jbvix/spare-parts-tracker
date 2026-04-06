/**
 * SPARES-CHAIN v6.3 — Store (Estado Global e Persistência)
 * Fonte única de verdade para todo o estado da aplicação.
 */

// ===== ESTADO GLOBAL =====
const state = {
    spareCounter: parseInt(localStorage.getItem('spareCounter')) || 1,
    disposalDocCounter: parseInt(localStorage.getItem('disposalDocCounter')) || 1,
    currentUser: null,
    sparesData: {},
    currentContextSpare: null,
    nonComplianceList: [],
    equipmentState: {},
    disposalRecords: [],
    quarantineItems: []
};

// ===== PERSISTÊNCIA =====
function saveAll() {
    try {
        localStorage.setItem('sparesData', JSON.stringify(state.sparesData));
        localStorage.setItem('equipmentState', JSON.stringify(state.equipmentState));
        localStorage.setItem('disposalRecords', JSON.stringify(state.disposalRecords));
        localStorage.setItem('quarantineItems', JSON.stringify(state.quarantineItems));
        localStorage.setItem('nonComplianceList', JSON.stringify(state.nonComplianceList));
        localStorage.setItem('spareCounter', state.spareCounter);
        localStorage.setItem('disposalDocCounter', state.disposalDocCounter);
        console.log('[SAVE] Dados salvos:', {
            peças: Object.keys(state.sparesData).length,
            equipamentos: Object.keys(state.equipmentState).length,
            descartes: state.disposalRecords.length,
            quarentena: state.quarantineItems.length,
            naoConformidades: state.nonComplianceList.length
        });
    } catch (e) {
        console.error('Erro ao salvar:', e);
    }
}

function loadAll() {
    const saved = key => localStorage.getItem(key);

    // Peças
    const sparesRaw = saved('sparesData');
    if (sparesRaw) {
        try {
            state.sparesData = JSON.parse(sparesRaw);
            addLog(`${icon('refresh')} ${Object.keys(state.sparesData).length} peça(s) carregada(s) do sistema`, 'success');
        } catch (e) { console.error('Erro ao carregar peças:', e); }
    }

    // Equipamentos
    const equipRaw = saved('equipmentState');
    if (equipRaw) {
        try {
            state.equipmentState = JSON.parse(equipRaw);
            addLog(`${icon('wrench')} ${Object.keys(state.equipmentState).length} equipamento(s) com peças instaladas`, 'success');
        } catch (e) { console.error('Erro ao carregar equipamentos:', e); }
    }

    // Descartes
    const disposalRaw = saved('disposalRecords');
    if (disposalRaw) {
        try {
            state.disposalRecords = JSON.parse(disposalRaw);
            addLog(`${icon('trash')} ${state.disposalRecords.length} descarte(s) registrado(s)`, 'warning');
        } catch (e) { console.error('Erro ao carregar descartes:', e); }
    }

    // Quarentena
    const quarantineRaw = saved('quarantineItems');
    if (quarantineRaw) {
        try {
            state.quarantineItems = JSON.parse(quarantineRaw);
            addLog(`${icon('alertTriangle')} ${state.quarantineItems.length} item(ns) em quarentena`, 'warning');
        } catch (e) { console.error('Erro ao carregar quarentena:', e); }
    }

    // Não-conformidades
    const ncRaw = saved('nonComplianceList');
    if (ncRaw) {
        try {
            state.nonComplianceList = JSON.parse(ncRaw);
            if (state.nonComplianceList.length > 0) {
                addLog(`${icon('alertTriangle')} ${state.nonComplianceList.length} não-conformidade(s) registrada(s)`, 'danger');
            }
        } catch (e) { console.error('Erro ao carregar não-conformidades:', e); }
    }
}

// ===== GESTÃO DE EVENTOS =====
function addSpareEvent(code, type, data) {
    if (!state.sparesData[code]) {
        state.sparesData[code] = {
            code,
            history: [],
            currentState: type,
            scanCount: 0,
            nonCompliantOps: []
        };
    }

    state.sparesData[code].history.push({
        type,
        timestamp: new Date().toISOString(),
        data
    });
    state.sparesData[code].currentState = type;

    if (type === 'ESCANEADO') {
        state.sparesData[code].lastScan = new Date().toISOString();
        delete state.sparesData[code].shelf;
    }
    if (type === 'COLETADO') {
        state.sparesData[code].transportadora = data.operator;
        delete state.sparesData[code].shelf;
    }
    if (type === 'ENTREGUE_BORDO') {
        delete state.sparesData[code].shelf;
    }
    if (type === 'ARMAZENADO') {
        state.sparesData[code].shelf = data.shelf;
    }
    if (type === 'INSTALADO' || type === 'REMOVIDO' || type === 'DESCARTADO_FINAL' || type === 'RECEBIDO') {
        delete state.sparesData[code].shelf;
    }

    saveAll();
}

function generateDisposalDoc() {
    const now = new Date();
    const year = now.getFullYear();
    const ts = now.getTime().toString().slice(-6); // 6 dígitos finais do timestamp
    const docNumber = `DD-${year}-${ts}-${String(state.disposalDocCounter).padStart(4, '0')}`;
    state.disposalDocCounter++;
    localStorage.setItem('disposalDocCounter', state.disposalDocCounter);
    return docNumber;
}

function clearAll() {
    localStorage.clear();
    state.spareCounter = 1;
    state.disposalDocCounter = 1;
    state.blockchainLog = [];
    state.sparesData = {};
    state.currentContextSpare = null;
    state.nonComplianceList = [];
    state.equipmentState = {};
    state.disposalRecords = [];
    state.quarantineItems = [];
}
