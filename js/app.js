/**
 * SPARES-CHAIN v6.3 — App (Bootstrap / Inicialização)
 */

function readUserIdentity(nameFieldId, roleFieldId, locationFieldId) {
    const name = document.getElementById(nameFieldId)?.value.trim() || '';
    const role = document.getElementById(roleFieldId)?.value || 'CHEFE_MAQ';
    const location = document.getElementById(locationFieldId)?.value.trim() || '';

    if (!name) {
        alert('Por favor, insira o nome completo do responsável.');
        return null;
    }

    return { name, role, location };
}

function updateUserBadge(role) {
    const badge = document.getElementById('userBadge');
    if (!badge) return;

    badge.classList.remove('transportadora', 'almox', 'chefe-maq', 'auditor');

    if (role === 'TRANSPORTADORA') {
        badge.classList.add('transportadora');
    } else if (role === 'ALMOX') {
        badge.classList.add('almox');
    } else if (role === 'CHEFE_MAQ') {
        badge.classList.add('chefe-maq');
    } else if (role === 'AUDITOR') {
        badge.classList.add('auditor');
    }
}

function updateActorSwitcher(role) {
    document.querySelectorAll('.actor-role-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.role === role);
    });
}

function syncCurrentUserDisplay() {
    if (!state.currentUser) return;

    const displayUserName = document.getElementById('displayUserName');
    const displayUserRole = document.getElementById('displayUserRole');

    if (displayUserName) displayUserName.textContent = state.currentUser.name;
    if (displayUserRole) displayUserRole.textContent = getRoleName(state.currentUser.role);

    updateUserBadge(state.currentUser.role);
    updateActorSwitcher(state.currentUser.role);
}

function activateUserSession(user, mode = 'login') {
    const previousUser = state.currentUser ? { ...state.currentUser } : null;

    state.currentUser = {
        ...user,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    syncCurrentUserDisplay();

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');

    initializeInterface();

    if (mode === 'handoff' && previousUser) {
        addLog(
            `${icon('refresh')} Transferência de responsável: ${escapeHtml(previousUser.name)} (${escapeHtml(getRoleName(previousUser.role))}) → ${escapeHtml(state.currentUser.name)} (${escapeHtml(getRoleName(state.currentUser.role))})`,
            'info'
        );
        return;
    }

    addLog(
        `${icon('lock')} Login realizado: ${escapeHtml(state.currentUser.name)} (${escapeHtml(getRoleName(state.currentUser.role))}) - ${escapeHtml(state.currentUser.location)}`,
        'success'
    );
}

function login() {
    const user = readUserIdentity('userName', 'userRole', 'userLocation');
    if (!user) return;

    activateUserSession(user, 'login');
}

function logout() {
    const confirmed = confirm(
        'Encerrar a sessão reinicia o aplicativo e pode apagar o fluxo atual.\n\n' +
        'Para passar a operação ao próximo responsável, use os botões de ator ou "Trocar Responsável".\n\n' +
        'Deseja realmente sair?'
    );

    if (!confirmed) return;

    localStorage.removeItem('currentUser');
    location.reload();
}

function confirmReset() {
    const confirmed = confirm(
        'ATENÇÃO: RESET TOTAL DO SISTEMA\n\n' +
        'Esta ação irá:\n' +
        'Apagar todas as peças\n' +
        'Limpar histórico e quarentena\n' +
        'Zerar contadores e descartes\n\n' +
        'Esta ação é irreversível.\n\n' +
        'Deseja continuar?'
    );

    if (!confirmed) return;

    const doubleCheck = confirm(
        'ÚLTIMA CONFIRMAÇÃO\n\n' +
        'Tem certeza absoluta? Todos os dados serão perdidos.'
    );

    if (!doubleCheck) return;

    resetSystem();
}

function resetSystem() {
    clearAll();
    alert('RESET CONCLUÍDO!\n\nO sistema foi limpo e será reiniciado.');
    location.reload();
}

function resetPersistedStateOnStartup() {
    const welcomeShown = localStorage.getItem('welcomeShown');

    clearAll();

    if (welcomeShown) {
        localStorage.setItem('welcomeShown', welcomeShown);
    }
}

function initializeInterface() {
    const panelsGrid = document.getElementById('panelsGrid');
    if (!panelsGrid || !state.currentUser) return;

    panelsGrid.innerHTML = '';
    syncCurrentUserDisplay();

    const role = state.currentUser.role;
    panelsGrid.appendChild(createScannerPanel());

    if (role === 'ALMOX') {
        panelsGrid.appendChild(createAlmoxPanel());
    } else if (role === 'TRANSPORTADORA') {
        panelsGrid.appendChild(createAlmoxPanel());
        panelsGrid.appendChild(createTransportadoraCollectPanel());
        panelsGrid.appendChild(createTransportadoraDeliverPanel());
        panelsGrid.appendChild(createQuarantinePanel());
    } else if (role === 'CHEFE_MAQ') {
        panelsGrid.appendChild(createInTransitPanel());
        panelsGrid.appendChild(createBordoPanel());
        panelsGrid.appendChild(createEquipmentPanel());
        panelsGrid.appendChild(createShelfPanel());
        panelsGrid.appendChild(createQuarantinePanel());
    } else if (role === 'AUDITOR') {
        panelsGrid.appendChild(createAlmoxPanel());
        panelsGrid.appendChild(createTransportadoraCollectPanel());
        panelsGrid.appendChild(createTransportadoraDeliverPanel());
        panelsGrid.appendChild(createBordoPanel());
        panelsGrid.appendChild(createEquipmentPanel());
        panelsGrid.appendChild(createShelfPanel());
        panelsGrid.appendChild(createQuarantinePanel());
    }

    initializeSpares();
    showRoleInstructions();
    updateDashboard();
}

function openActorLoginModal(preselectedRole = '') {
    const modal = document.getElementById('actorLoginModal');
    const roleField = document.getElementById('actorRole');
    const nameField = document.getElementById('actorLoginName');
    const locationField = document.getElementById('actorLoginLocation');

    if (!modal || !roleField || !nameField || !locationField) return;

    roleField.value = preselectedRole || state.currentUser?.role || 'CHEFE_MAQ';
    nameField.value = '';
    locationField.value = state.currentUser?.location || '';

    modal.classList.add('active');
    nameField.focus();
}

function closeActorLoginModal() {
    const modal = document.getElementById('actorLoginModal');
    if (modal) modal.classList.remove('active');
}

function submitActorLogin(event) {
    event.preventDefault();

    const user = readUserIdentity('actorLoginName', 'actorRole', 'actorLoginLocation');
    if (!user) return;

    activateUserSession(user, state.currentUser ? 'handoff' : 'login');
    closeActorLoginModal();
}

function showRoleSwitchModal() {
    openActorLoginModal();
}

function closeRoleSwitchModal() {
    closeActorLoginModal();
}

function switchRole(newRole) {
    openActorLoginModal(newRole);
}

document.addEventListener('DOMContentLoaded', () => {
    resetPersistedStateOnStartup();
    checkFirstVisit();
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('#contextMenu') && !event.target.closest('.spare-item')) {
        closeContextMenu();
    }
});

document.addEventListener('dragover', (event) => {
    document.querySelectorAll('.drop-zone, .equipment-slot, .shelf-slot').forEach((zone) => {
        if (event.target !== zone && !zone.contains(event.target)) {
            zone.classList.remove('drag-over');
        }
    });
});
