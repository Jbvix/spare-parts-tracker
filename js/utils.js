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

function createBlockchainProcessId(code, seed = '') {
    const normalizedCode = String(code || 'PROCESSO').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    const suffix = generateHash(normalizedCode, 'PROCESSO', seed || Date.now());
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
