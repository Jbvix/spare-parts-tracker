/**
 * SPARES-CHAIN v6.3 — App (Bootstrap / Inicialização)
 */

function login() {
    const name = document.getElementById('userName').value.trim();
    const role = document.getElementById('userRole').value;
    const location = document.getElementById('userLocation').value.trim();

    if (!name) {
        alert('Por favor, insira seu nome completo.');
        return;
    }

    state.currentUser = {
        name,
        role,
        location,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));

    document.getElementById('displayUserName').textContent = name;
    document.getElementById('displayUserRole').textContent = getRoleName(role);

    const badge = document.getElementById('userBadge');
    if (badge) {
        badge.classList.toggle('transportadora', role === 'TRANSPORTADORA');
    }

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');

    addLog(
        `${icon('lock')} Login realizado: ${escapeHtml(name)} (${escapeHtml(getRoleName(role))}) - ${escapeHtml(location)}`,
        'success'
    );

    initializeInterface();
}

function logout() {
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

function initializeInterface() {
    const panelsGrid = document.getElementById('panelsGrid');
    if (!panelsGrid || !state.currentUser) return;

    panelsGrid.innerHTML = '';

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

function showRoleSwitchModal() {
    const modal = document.getElementById('roleSwitchModal');
    if (modal) modal.style.display = 'flex';
}

function closeRoleSwitchModal() {
    const modal = document.getElementById('roleSwitchModal');
    if (modal) modal.style.display = 'none';
}

function switchRole(newRole) {
    const user = state.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return;

    user.role = newRole;
    state.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    const displayRole = document.getElementById('displayUserRole');
    if (displayRole) displayRole.textContent = getRoleName(newRole);

    const badge = document.getElementById('userBadge');
    if (badge) {
        badge.classList.toggle('transportadora', newRole === 'TRANSPORTADORA');
    }

    closeRoleSwitchModal();
    initializeInterface();

    addLog(`${icon('refresh')} Troca de tela: ${escapeHtml(getRoleName(newRole))}`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    checkFirstVisit();

    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return;

    try {
        const user = JSON.parse(savedUser);
        state.currentUser = user;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userRole').value = user.role || 'CHEFE_MAQ';
        document.getElementById('userLocation').value = user.location || '';
        login();
    } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
    }
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
