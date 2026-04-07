// Funções para registrar chegada no destino e entrega a bordo
function openArrivalModal(partCode) {
    const modal = document.getElementById('arrivalModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.getElementById('arrivalPartCode').value = partCode;
    document.getElementById('arrivalDatetime').value = new Date().toISOString().slice(0, 16);
}

function closeArrivalModal() {
    const modal = document.getElementById('arrivalModal');
    if (!modal) return;

    modal.style.display = 'none';
}

function submitArrivalForm(event) {
    event.preventDefault();

    const code = document.getElementById('arrivalPartCode').value;
    const datetime = document.getElementById('arrivalDatetime').value;

    if (!state.sparesData[code].transportEvents) {
        state.sparesData[code].transportEvents = [];
    }

    const transportEvent = addTransportEvent(code, 'CHEGADA_DESTINO', {
        operator: state.currentUser?.name || 'Sistema',
        company: state.currentUser?.location || '',
        datetime
    });

    closeArrivalModal();
    addLog(
        `${icon('clock')} Chegada registrada para ${escapeHtml(state.sparesData[code].name)}${formatBlockchainTag(transportEvent)}`,
        'info'
    );
    updateDashboard();
}

function openDeliveryModal(partCode) {
    const modal = document.getElementById('deliveryModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.getElementById('deliveryPartCode').value = partCode;
    document.getElementById('deliveryDatetime').value = new Date().toISOString().slice(0, 16);
}

function closeDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    if (!modal) return;

    modal.style.display = 'none';
}

function submitDeliveryForm(event) {
    event.preventDefault();

    const code = document.getElementById('deliveryPartCode').value;
    const datetime = document.getElementById('deliveryDatetime').value;
    const previousState = state.sparesData[code].currentState || 'EM_TRANSITO';
    const element = document.getElementById(code);
    const scanned = element ? wasRecentlyScanned(element) : Boolean(state.sparesData[code].lastScan);

    if (!state.sparesData[code].transportEvents) {
        state.sparesData[code].transportEvents = [];
    }

    addTransportEvent(code, 'ENTREGA_BORDO', {
        operator: state.currentUser?.name || 'Sistema',
        company: state.currentUser?.location || '',
        datetime
    });

    if (!scanned) {
        registerNonCompliance(code, 'ENTREGA', 'Entrega sem escaneamento prévio', element);
    }

    const blockchainEvent = addSpareEvent(code, 'ENTREGUE_BORDO', {
        operator: state.currentUser?.name || 'Sistema',
        company: state.currentUser?.location || '',
        datetime,
        scanned,
        previousState
    });

    closeDeliveryModal();
    addLog(
        `${icon('upload')} Entrega a bordo registrada para ${escapeHtml(state.sparesData[code].name)}${formatBlockchainTag(blockchainEvent)}`,
        'success'
    );
    initializeSpares();
}
