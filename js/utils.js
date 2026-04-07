/**
 * SPARES-CHAIN v6.3 — Utilitários
 * Funções auxiliares reutilizáveis em todo o sistema.
 */

/** Escapa HTML para prevenir XSS */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

/** Renderiza ícone SVG quando existir, ou texto escapado para dados legados. */
function renderIcon(iconName, size) {
    const svg = icon(iconName, size);
    return svg || escapeHtml(iconName);
}

/** Hash simples para registros de blockchain simulada */
function generateHash(code, equip, hours) {
    const str = `${code}-${equip}-${hours}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash &= hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

function hashStringStable(input) {
    const value = String(input ?? '');
    let hash = 2166136261;

    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeHashPart(part) {
    if (part === null || part === undefined) return '';
    if (typeof part === 'string') return part;
    return JSON.stringify(part);
}

function generateDeterministicHash(...parts) {
    const normalized = parts.map(normalizeHashPart).join('|');
    const reverse = normalized.split('').reverse().join('');
    return `${hashStringStable(normalized)}${hashStringStable(reverse)}`;
}

function combineMerkleHashes(leftHash, rightHash) {
    const left = String(leftHash || '');
    const right = String(rightHash || left);
    return generateDeterministicHash('MERKLE_NODE', left, right);
}

function buildMerkleTree(leafHashes) {
    const leaves = (leafHashes || []).filter(Boolean).map((hash) => String(hash));
    if (!leaves.length) {
        return {
            root: '',
            levels: [],
            leafCount: 0,
            treeHeight: 0
        };
    }

    const levels = [leaves];
    let currentLevel = leaves;

    while (currentLevel.length > 1) {
        const nextLevel = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || currentLevel[i];
            nextLevel.push(combineMerkleHashes(left, right));
        }

        levels.push(nextLevel);
        currentLevel = nextLevel;
    }

    return {
        root: levels[levels.length - 1][0],
        levels,
        leafCount: leaves.length,
        treeHeight: levels.length
    };
}

function buildMerkleProof(levels, leafIndex) {
    if (!Array.isArray(levels) || !levels.length) return [];

    let currentIndex = leafIndex;
    const proof = [];

    for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
        const level = levels[levelIndex];
        const isRightNode = currentIndex % 2 === 1;
        const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
        const siblingHash = level[siblingIndex] || level[currentIndex];

        proof.push({
            position: isRightNode ? 'left' : 'right',
            hash: siblingHash
        });

        currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
}

function verifyMerkleProof(leafHash, proof, rootHash) {
    if (!leafHash || !rootHash) return false;

    let computedHash = String(leafHash);

    for (const step of proof || []) {
        if (!step?.hash) return false;
        computedHash = step.position === 'left'
            ? combineMerkleHashes(step.hash, computedHash)
            : combineMerkleHashes(computedHash, step.hash);
    }

    return computedHash === rootHash;
}

function createBlockchainProcessId(code, seed = '') {
    const normalizedCode = String(code || 'PROCESSO').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const suffix = generateDeterministicHash(normalizedCode, 'PROCESSO', seed || Date.now()).slice(0, 12);
    return `BC-${normalizedCode}-${suffix}`;
}

function formatBlockchainTag(source) {
    const blockchain = source?.blockchain || source;
    if (!blockchain?.processId) return '';

    const processId = escapeHtml(blockchain.processId);
    const blockId = escapeHtml(blockchain.blockId || '-');
    const txId = escapeHtml(blockchain.txId || '-');
    return ` | Processo: ${processId} | ${blockId} | Tx: ${txId}`;
}

/** Traduz código de papel para nome legível */
function getRoleName(role) {
    const roles = {
        CHEFE_MAQ: 'Chefe de Máquinas',
        ALMOX: 'Almoxarife',
        TRANSPORTADORA: 'Transportadora',
        AUDITOR: 'Auditor'
    };
    return roles[role] || role;
}

/** Adiciona entrada no log de atividades (blockchain visual) */
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('activityLog');
    if (!logContainer) return;

    const logDiv = document.createElement('div');
    logDiv.className = `log-entry ${type}`;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR');

    logDiv.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        ${message}
    `;

    logContainer.insertBefore(logDiv, logContainer.firstChild);

    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}
