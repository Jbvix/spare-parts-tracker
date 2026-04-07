/**
 * SPARES-CHAIN v6.3 — Store (Estado Global e Persistência)
 * Fonte única de verdade para todo o estado da aplicação.
 */

// ===== ESTADO GLOBAL =====
const state = {
    spareCounter: parseInt(localStorage.getItem('spareCounter'), 10) || 1,
    disposalDocCounter: parseInt(localStorage.getItem('disposalDocCounter'), 10) || 1,
    currentUser: null,
    sparesData: {},
    currentContextSpare: null,
    nonComplianceList: [],
    equipmentState: {},
    disposalRecords: [],
    quarantineItems: []
};

function parseStoredJson(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error(`Erro ao carregar ${key}:`, error);
        return fallback;
    }
}

function getCanonicalState(type, data = {}, previousState = 'RECEBIDO') {
    switch (type) {
        case 'ESCANEADO':
            return previousState || 'RECEBIDO';
        case 'COLETADO':
        case 'EM_TRANSITO':
            return 'EM_TRANSITO';
        case 'ENTREGUE_BORDO':
            return 'ENTREGUE_BORDO';
        case 'ARMAZENADO':
            return data.shelf === 'NAO_CONFORME' ? 'NAO_CONFORME' : 'ARMAZENADO';
        case 'NAO_CONFORME':
            return 'NAO_CONFORME';
        case 'INSTALADO':
            return 'INSTALADO';
        case 'REMOVIDO':
            if (data.destination === 'NAO_CONFORME') return 'NAO_CONFORME';
            if (data.destination === 'PRATELEIRA_BORDO') return 'ARMAZENADO';
            return 'QUARENTENA';
        case 'QUARENTENA':
            return 'QUARENTENA';
        case 'DESCARTADO_FINAL':
            return 'DESCARTADO_FINAL';
        case 'AGUARDANDO_COLETA':
            return 'AGUARDANDO_COLETA';
        case 'RECEBIDO':
        default:
            return type || previousState || 'RECEBIDO';
        }
}

function hasCompleteMerkleCoverage(spare) {
    const orderedEvents = getOrderedSpareEvents(spare);
    if (!orderedEvents.length) {
        return Boolean(spare?.merkle && typeof spare.merkle.root === 'string');
    }

    return Boolean(spare?.merkle?.root)
        && orderedEvents.every((event) => event?.merkle?.leafHash && Array.isArray(event?.merkle?.proof));
}

function normalizeLoadedSpare(spare) {
    const maxBlockchainHeight = (items = []) => items.reduce((max, item) => {
        const current = Number(item?.blockchain?.blockNumber || 0);
        return current > max ? current : max;
    }, 0);

    const collections = [
        ...(Array.isArray(spare.history) ? spare.history : []),
        ...(Array.isArray(spare.transportEvents) ? spare.transportEvents : [])
    ];

    const blockchainHeight = maxBlockchainHeight(collections);
    const lastBlockchainEvent = collections.findLast?.((item) => item?.blockchain?.hash)
        || [...collections].reverse().find((item) => item?.blockchain?.hash)
        || null;

    const normalized = {
        code: spare.code || '',
        name: spare.name || '',
        icon: spare.icon || 'wrench',
        history: Array.isArray(spare.history) ? spare.history : [],
        scanCount: Number.isFinite(Number(spare.scanCount)) ? parseInt(spare.scanCount, 10) : 0,
        nonCompliantOps: Array.isArray(spare.nonCompliantOps) ? spare.nonCompliantOps : [],
        transportEvents: Array.isArray(spare.transportEvents) ? spare.transportEvents : [],
        blockchainProcessId: spare.blockchainProcessId || createBlockchainProcessId(spare.code || 'PROCESSO', spare.code || Date.now()),
        blockchainHeight,
        blockchainLastHash: spare.blockchainLastHash || lastBlockchainEvent?.blockchain?.hash || ''
    };

    if (spare.lastScan) normalized.lastScan = spare.lastScan;
    if (spare.transportadora) normalized.transportadora = spare.transportadora;
    if (spare.shelf) normalized.shelf = spare.shelf;
    if (spare.origin) normalized.origin = spare.origin;
    if (spare.merkle) normalized.merkle = spare.merkle;

    let currentState = spare.currentState || 'RECEBIDO';
    const lastEvent = normalized.history[normalized.history.length - 1];

    if (lastEvent && lastEvent.type) {
        currentState = getCanonicalState(
            lastEvent.type,
            lastEvent.data || {},
            lastEvent.data?.previousState || currentState
        );
    } else {
        currentState = getCanonicalState(currentState, spare, spare.previousState || 'RECEBIDO');
    }

    normalized.currentState = currentState;
    if (!hasCompleteMerkleCoverage(normalized)) {
        rebuildSpareMerkle(normalized);
    }
    return normalized;
}

function getOrderedSpareEvents(spare) {
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

function buildEventMerkleLeafHash(spareCode, event, position = 0) {
    return generateDeterministicHash('MERKLE_LEAF', {
        code: spareCode || '',
        type: event?.type || '',
        timestamp: event?.timestamp || '',
        data: event?.data || {},
        blockchain: {
            processId: event?.blockchain?.processId || '',
            blockNumber: Number(event?.blockchain?.blockNumber || 0),
            blockId: event?.blockchain?.blockId || '',
            txId: event?.blockchain?.txId || '',
            previousHash: event?.blockchain?.previousHash || '',
            hash: event?.blockchain?.hash || ''
        },
        position
    });
}

function rebuildSpareMerkle(spare) {
    if (!spare) return null;

    const orderedEvents = getOrderedSpareEvents(spare);
    if (!orderedEvents.length) {
        spare.merkle = {
            root: '',
            leafCount: 0,
            treeHeight: 0,
            generatedAt: new Date().toISOString(),
            lastLeafHash: ''
        };
        return spare.merkle;
    }

    const leafHashes = orderedEvents.map((event, index) => buildEventMerkleLeafHash(spare.code, event, index));
    const tree = buildMerkleTree(leafHashes);

    orderedEvents.forEach((event, index) => {
        const proof = buildMerkleProof(tree.levels, index);
        event.merkle = {
            leafHash: leafHashes[index],
            root: tree.root,
            proof,
            proofDepth: proof.length,
            leafIndex: index,
            leafCount: tree.leafCount,
            verified: verifyMerkleProof(leafHashes[index], proof, tree.root)
        };
    });

    spare.merkle = {
        root: tree.root,
        leafCount: tree.leafCount,
        treeHeight: tree.treeHeight,
        generatedAt: new Date().toISOString(),
        lastLeafHash: leafHashes[leafHashes.length - 1]
    };

    return spare.merkle;
}

function createBlockchainEventMetadata(spare, type, data = {}, timestamp = new Date().toISOString()) {
    if (!spare.blockchainProcessId) {
        spare.blockchainProcessId = createBlockchainProcessId(spare.code, timestamp);
    }

    const blockNumber = (spare.blockchainHeight || 0) + 1;
    const previousHash = spare.blockchainLastHash || 'GENESIS';
    const payloadFingerprint = JSON.stringify({
        type,
        timestamp,
        previousHash,
        data
    });
    const hash = generateDeterministicHash(spare.code, type, payloadFingerprint);
    const txId = `TX-${generateDeterministicHash(spare.code, type, `${timestamp}-${blockNumber}`).slice(0, 12)}`;
    const blockId = `BLK-${String(blockNumber).padStart(4, '0')}`;

    spare.blockchainHeight = blockNumber;
    spare.blockchainLastHash = hash;

    return {
        processId: spare.blockchainProcessId,
        blockNumber,
        blockId,
        txId,
        previousHash,
        hash
    };
}

function hydrateState() {
    const spares = parseStoredJson('sparesData', {});
    const normalizedSpares = {};

    Object.entries(spares || {}).forEach(([code, spare]) => {
        normalizedSpares[code] = normalizeLoadedSpare(spare || {});
    });

    state.sparesData = normalizedSpares;
    state.equipmentState = parseStoredJson('equipmentState', {}) || {};
    state.disposalRecords = parseStoredJson('disposalRecords', []) || [];
    state.quarantineItems = parseStoredJson('quarantineItems', []) || [];
    state.nonComplianceList = parseStoredJson('nonComplianceList', []) || [];
    state.spareCounter = parseInt(localStorage.getItem('spareCounter'), 10) || 1;
    state.disposalDocCounter = parseInt(localStorage.getItem('disposalDocCounter'), 10) || 1;

    const installedByCode = new Map();
    Object.entries(state.equipmentState).forEach(([equipName, installed]) => {
        if (installed?.code) {
            installedByCode.set(installed.code, { equipName, installed });
        }
    });

    const quarantinedCodes = new Set(
        (state.quarantineItems || [])
            .map((item) => item?.code)
            .filter(Boolean)
    );

    const disposedCodes = new Set(
        (state.disposalRecords || [])
            .map((item) => item?.code)
            .filter(Boolean)
    );

    Object.values(state.sparesData).forEach((spare) => {
        if (disposedCodes.has(spare.code)) {
            spare.currentState = 'DESCARTADO_FINAL';
            delete spare.shelf;
            delete spare.equip;
            delete spare.hours;
            return;
        }

        const installedRef = installedByCode.get(spare.code);
        if (installedRef) {
            spare.currentState = 'INSTALADO';
            spare.equip = installedRef.equipName;
            spare.hours = installedRef.installed.hours;
            delete spare.shelf;
            return;
        }

        delete spare.equip;
        delete spare.hours;

        if (quarantinedCodes.has(spare.code)) {
            spare.currentState = 'QUARENTENA';
            delete spare.shelf;
        }
    });

    return state;
}

// Mantido por compatibilidade com chamadas existentes.
function loadAll() {
    return hydrateState();
}

// ===== PERSISTÊNCIA =====
function saveAll() {
    try {
        localStorage.setItem('sparesData', JSON.stringify(state.sparesData));
        localStorage.setItem('equipmentState', JSON.stringify(state.equipmentState));
        localStorage.setItem('disposalRecords', JSON.stringify(state.disposalRecords));
        localStorage.setItem('quarantineItems', JSON.stringify(state.quarantineItems));
        localStorage.setItem('nonComplianceList', JSON.stringify(state.nonComplianceList));
        localStorage.setItem('spareCounter', String(state.spareCounter));
        localStorage.setItem('disposalDocCounter', String(state.disposalDocCounter));
        console.log('[SAVE] Dados salvos:', {
            pecas: Object.keys(state.sparesData).length,
            equipamentos: Object.keys(state.equipmentState).length,
            descartes: state.disposalRecords.length,
            quarentena: state.quarantineItems.length,
            naoConformidades: state.nonComplianceList.length
        });
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

// ===== GESTÃO DE EVENTOS =====
function addSpareEvent(code, type, data = {}) {
    if (!state.sparesData[code]) {
        state.sparesData[code] = {
            code,
            name: data.name || '',
            icon: data.icon || 'wrench',
            history: [],
            currentState: 'RECEBIDO',
            scanCount: 0,
            nonCompliantOps: [],
            transportEvents: []
        };
    }

    const spare = state.sparesData[code];
    const previousState = spare.currentState || 'RECEBIDO';
    const timestamp = new Date().toISOString();
    const blockchain = createBlockchainEventMetadata(spare, type, data, timestamp);

    const event = {
        type,
        timestamp,
        data,
        blockchain
    };

    spare.history.push(event);

    spare.currentState = getCanonicalState(type, data, data.previousState || previousState);

    if (type === 'ESCANEADO') {
        spare.lastScan = new Date().toISOString();
    }

    if (spare.currentState === 'EM_TRANSITO' && data.operator) {
        spare.transportadora = data.operator;
        delete spare.shelf;
    }

    if (spare.currentState === 'ARMAZENADO' && data.shelf) {
        spare.shelf = data.shelf;
    }

    if (spare.currentState === 'NAO_CONFORME') {
        spare.shelf = 'NAO_CONFORME';
    }

    if (['RECEBIDO', 'AGUARDANDO_COLETA', 'ENTREGUE_BORDO', 'INSTALADO', 'QUARENTENA', 'DESCARTADO_FINAL'].includes(spare.currentState)) {
        delete spare.shelf;
    }

    rebuildSpareMerkle(spare);
    saveAll();
    return event;
}

function addTransportEvent(code, type, data = {}) {
    if (!state.sparesData[code]) {
        state.sparesData[code] = {
            code,
            name: data.name || '',
            icon: data.icon || 'wrench',
            history: [],
            currentState: 'RECEBIDO',
            scanCount: 0,
            nonCompliantOps: [],
            transportEvents: [],
            blockchainProcessId: createBlockchainProcessId(code, Date.now()),
            blockchainHeight: 0,
            blockchainLastHash: ''
        };
    }

    const spare = state.sparesData[code];
    if (!spare.transportEvents) spare.transportEvents = [];

    const timestamp = data.timestamp || data.datetime || new Date().toISOString();
    const blockchain = createBlockchainEventMetadata(spare, type, data, timestamp);
    const event = {
        type,
        timestamp,
        ...data,
        data,
        blockchain
    };

    spare.transportEvents.push(event);
    rebuildSpareMerkle(spare);
    saveAll();
    return event;
}

function generateDisposalDoc() {
    const now = new Date();
    const year = now.getFullYear();
    const ts = now.getTime().toString().slice(-6);
    const docNumber = `DD-${year}-${ts}-${String(state.disposalDocCounter).padStart(4, '0')}`;
    state.disposalDocCounter += 1;
    localStorage.setItem('disposalDocCounter', String(state.disposalDocCounter));
    return docNumber;
}

function clearAll() {
    localStorage.clear();
    state.spareCounter = 1;
    state.disposalDocCounter = 1;
    state.currentUser = null;
    state.sparesData = {};
    state.currentContextSpare = null;
    state.nonComplianceList = [];
    state.equipmentState = {};
    state.disposalRecords = [];
    state.quarantineItems = [];
}
