// Funções para modal de registro de transportador
function openRegisterTransporterModal(partCode) {
    const modal = document.getElementById('registerTransporterModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.getElementById('transpPartCode').value = partCode;
}

function closeRegisterTransporterModal() {
    const modal = document.getElementById('registerTransporterModal');
    if (!modal) return;

    modal.style.display = 'none';
}

function submitTransporterForm(event) {
    event.preventDefault();

    const code = document.getElementById('transpPartCode').value;
    const name = document.getElementById('transpName').value.trim();
    const doc = document.getElementById('transpDoc').value.trim();
    const company = document.getElementById('transpCompany').value.trim();
    const vehicle = document.getElementById('transpVehicle').value.trim();
    const contact = document.getElementById('transpContact').value.trim();
    const timestamp = new Date().toISOString();

    if (!state.sparesData[code].transportEvents) {
        state.sparesData[code].transportEvents = [];
    }

    const transportEvent = addTransportEvent(code, 'SAIDA_ALMOX', {
        name,
        doc,
        company,
        vehicle,
        contact,
        timestamp
    });

    const blockchainEvent = addSpareEvent(code, 'AGUARDANDO_COLETA', {
        operator: state.currentUser?.name || 'Sistema',
        company,
        vehicle,
        contact,
        doc,
        previousState: state.sparesData[code].currentState || 'RECEBIDO'
    });

    closeRegisterTransporterModal();
    addLog(
        `${icon('truck')} Saída registrada para ${escapeHtml(name)} (${escapeHtml(company)})${formatBlockchainTag(blockchainEvent || transportEvent)}`,
        'info'
    );
    initializeSpares();
}
