// Funções para modal de registro de transportador
function openRegisterTransporterModal(partCode) {
    document.getElementById('registerTransporterModal').style.display = 'flex';
    document.getElementById('transpPartCode').value = partCode;
}

function closeRegisterTransporterModal() {
    document.getElementById('registerTransporterModal').style.display = 'none';
}

function submitTransporterForm(event) {
    event.preventDefault();
    const code = document.getElementById('transpPartCode').value;
    const name = document.getElementById('transpName').value;
    const doc = document.getElementById('transpDoc').value;
    const company = document.getElementById('transpCompany').value;
    const vehicle = document.getElementById('transpVehicle').value;
    const contact = document.getElementById('transpContact').value;
    const timestamp = new Date().toISOString();

    // Salva no histórico da peça
    if (!state.sparesData[code].transportEvents) state.sparesData[code].transportEvents = [];
    state.sparesData[code].transportEvents.push({
        type: 'SAIDA_ALMOX',
        name, doc, company, vehicle, contact, timestamp
    });
    state.sparesData[code].currentState = 'AGUARDANDO_COLETA';
    saveAll();
    closeRegisterTransporterModal();
    addLog(`${icon('truck')} Saída registrada para ${name} (${company})`, 'info');
    updateDashboard();
    initializeSpares();
}
