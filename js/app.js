/**
 * SPARES-CHAIN v6.2 — App (Bootstrap / Inicialização)
 * Carregado após: utils.js, store.js, ui.js, handlers.js, compliance.js
 */

// ===== SISTEMA DE LOGIN =====
function login() {
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const location = document.getElementById('userLocation').value;

    if (!name) {
        alert('Por favor, insira seu nome completo.');
        return;
    }

    state.currentUser = {
        name, role, location,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));

    document.getElementById('displayUserName').textContent = name;
    document.getElementById('displayUserRole').textContent = getRoleName(role);

    const badge = document.getElementById('userBadge');
    if (role === 'TRANSPORTADORA') badge.classList.add('transportadora');

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');

    addLog(`🔐 Login realizado: ${escapeHtml(name)} (${getRoleName(role)}) - ${escapeHtml(location)}`, 'success');

    initializeInterface();
    showRoleInstructions();
    updateDashboard();
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// ===== RESET =====
function confirmReset() {
    const confirmed = confirm(
        '⚠️ ATENÇÃO: RESET TOTAL DO SISTEMA\n\n' +
        'Esta ação irá:\n' +
        '❌ Apagar TODAS as peças\n' +
        '❌ Limpar histórico blockchain\n' +
        '❌ Zerar contadores\n' +
        '❌ Remover equipamentos instalados\n' +
        '❌ Limpar quarentena\n' +
        '❌ Apagar registros de descarte\n\n' +
        'Esta ação é IRREVERSÍVEL!\n\n' +
        'Deseja realmente RESETAR o sistema?'
    );

    if (!confirmed) return;

    const doubleCheck = confirm(
        '🔴 ÚLTIMA CONFIRMAÇÃO!\n\n' +
        'Tem CERTEZA ABSOLUTA?\n\n' +
        'Todos os dados serão PERDIDOS PERMANENTEMENTE!'
    );

    if (!doubleCheck) return;

    resetSystem();
}

function resetSystem() {
    try {
        clearAll();

        const sparesList = document.getElementById('sparesList');
        if (sparesList) sparesList.innerHTML = '';

        const blockchainLogDiv = document.getElementById('blockchainLog');
        if (blockchainLogDiv) blockchainLogDiv.innerHTML = '<p style="color: #aaa;">Nenhum evento registrado</p>';

        document.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.classList.remove('filled');
            const contents = slot.querySelectorAll('[id^="equip"]');
            contents.forEach(c => c.innerHTML = '');
        });

        document.querySelectorAll('.shelf-slot').forEach(slot => {
            slot.classList.remove('occupied');
            const divs = slot.querySelectorAll('div');
            if (divs.length > 1) divs[1].innerHTML = '';
        });

        const transportCollect = document.getElementById('transportCollect');
        if (transportCollect) transportCollect.innerHTML = '<p>Arraste peças ESCANEADAS aqui para coleta</p>';

        const transportDeliver = document.getElementById('transportDeliver');
        if (transportDeliver) transportDeliver.innerHTML = '<p>Arraste peças coletadas aqui para entrega a bordo</p>';

        const quarantineList = document.getElementById('quarantineList');
        if (quarantineList) quarantineList.innerHTML = '';

        updateDashboard();

        addLog('🔄 SISTEMA RESETADO | Todos os dados apagados', 'danger');

        alert(
            '✅ RESET CONCLUÍDO!\n\n' +
            'Sistema reiniciado com sucesso.\n' +
            'Todos os dados foram apagados.\n\n' +
            'Você pode começar do zero!'
        );

        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        console.error('Erro ao resetar:', e);
        alert('❌ ERRO ao resetar!\n\n' + e.message);
    }
}

// ===== INICIALIZAÇÃO DA INTERFACE =====
function initializeInterface() {
    const panelsGrid = document.getElementById('panelsGrid');
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
        panelsGrid.appendChild(createAlmoxPanel());
        panelsGrid.appendChild(createEquipmentPanel());
        panelsGrid.appendChild(createShelfPanel());
        panelsGrid.appendChild(createQuarantinePanel());
    } else if (role === 'AUDITOR') {
        panelsGrid.appendChild(createAlmoxPanel());
        panelsGrid.appendChild(createTransportadoraCollectPanel());
        panelsGrid.appendChild(createTransportadoraDeliverPanel());
        panelsGrid.appendChild(createEquipmentPanel());
        panelsGrid.appendChild(createQuarantinePanel());
    }

    initializeSpares();
}

// ===== EVENT LISTENERS =====
window.addEventListener('load', function () {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        document.getElementById('userName').value = state.currentUser.name;
        document.getElementById('userRole').value = state.currentUser.role;
        document.getElementById('userLocation').value = state.currentUser.location || '';
        login();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkFirstVisit();
});

document.addEventListener('click', function (event) {
    if (!event.target.closest('#contextMenu') && !event.target.closest('.spare-item')) {
        closeContextMenu();
    }
});

document.addEventListener('dragover', function (e) {
    const dropZones = document.querySelectorAll('.drop-zone, .equipment-slot, .shelf-slot');
    dropZones.forEach(zone => {
        if (e.target !== zone && !zone.contains(e.target)) {
            zone.classList.remove('drag-over');
        }
    });
});
