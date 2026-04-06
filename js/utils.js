/**
 * SPARES-CHAIN v6.2 — Utilitários
 * Funções auxiliares reutilizáveis em todo o sistema.
 */

/** Escapa HTML para prevenir XSS */
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/** Hash simples para registros de blockchain simulada */
function generateHash(code, equip, hours) {
    const str = `${code}-${equip}-${hours}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

/** Traduz código de papel para nome legível */
function getRoleName(role) {
    const roles = {
        'CHEFE_MAQ': 'Chefe de Máquinas',
        'ALMOX': 'Almoxarife',
        'TRANSPORTADORA': 'Transportadora',
        'AUDITOR': 'Auditor'
    };
    return roles[role] || role;
}

/** Adiciona entrada no log de atividades (blockchain visual) */
function addLog(message, type = 'info') {
    const logDiv = document.createElement('div');
    logDiv.className = `log-entry ${type}`;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR');

    logDiv.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        ${message}
    `;

    const logContainer = document.getElementById('activityLog');
    logContainer.insertBefore(logDiv, logContainer.firstChild);

    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}
