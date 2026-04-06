// Funções para registrar chegada no destino e entrega a bordo
function openArrivalModal(partCode) {
    document.getElementById('arrivalModal').style.display = 'flex';
    document.getElementById('arrivalPartCode').value = partCode;
    document.getElementById('arrivalDatetime').value = new Date().toISOString().slice(0,16);
}
function closeArrivalModal() {
    document.getElementById('arrivalModal').style.display = 'none';
}
function submitArrivalForm(event) {
    event.preventDefault();
    const code = document.getElementById('arrivalPartCode').value;
    const datetime = document.getElementById('arrivalDatetime').value;
    if (!state.sparesData[code].transportEvents) state.sparesData[code].transportEvents = [];
    state.sparesData[code].transportEvents.push({
        type: 'CHEGADA_DESTINO',
        operator: state.currentUser.name,
        company: state.currentUser.location,
        datetime
    });
    saveAll();
    closeArrivalModal();
    addLog(`${icon('clock')} Chegada registrada para ${state.sparesData[code].name}`, 'info');
    updateDashboard();
    initializeSpares();
}

function openDeliveryModal(partCode) {
    document.getElementById('deliveryModal').style.display = 'flex';
    document.getElementById('deliveryPartCode').value = partCode;
    document.getElementById('deliveryDatetime').value = new Date().toISOString().slice(0,16);
}
function closeDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'none';
}
function submitDeliveryForm(event) {
    event.preventDefault();
    const code = document.getElementById('deliveryPartCode').value;
    const datetime = document.getElementById('deliveryDatetime').value;
    if (!state.sparesData[code].transportEvents) state.sparesData[code].transportEvents = [];
    state.sparesData[code].transportEvents.push({
        type: 'ENTREGA_BORDO',
        operator: state.currentUser.name,
        company: state.currentUser.location,
        datetime
    });
    // Atualiza status para entregue
    state.sparesData[code].currentState = 'ENTREGUE_BORDO';
    saveAll();
    closeDeliveryModal();
    addLog(`${icon('upload')} Entrega a bordo registrada para ${state.sparesData[code].name}`, 'success');
    updateDashboard();
    initializeSpares();
}
