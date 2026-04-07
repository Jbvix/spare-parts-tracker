/**
 * SPARES-CHAIN v6.3 — Handlers (Drag & Drop, Ações, Menu de Contexto)
 */

function drag(event) {
    event.dataTransfer.setData('text', event.currentTarget.id);
    event.currentTarget.classList.add('dragging');
}

function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function wasRecentlyScanned(element, maxAgeSeconds = 60) {
    const lastScan = element.dataset.lastScan || state.sparesData[element.dataset.code]?.lastScan;
    if (!lastScan) return false;

    const ageInSeconds = (Date.now() - new Date(lastScan).getTime()) / 1000;
    return ageInSeconds <= maxAgeSeconds;
}

function addVisualNonCompliance(element) {
    if (!element) return;

    element.classList.add('non-compliant');
    if (!element.querySelector('.spare-warning')) {
        const warning = document.createElement('div');
        warning.className = 'spare-warning';
        warning.textContent = '!';
        element.appendChild(warning);
    }
}

function registerNonCompliance(code, operation, reason, element) {
    const nonCompliance = {
        spare: code,
        operation,
        operator: state.currentUser?.name || 'Sistema',
        timestamp: new Date().toISOString(),
        reason
    };

    state.nonComplianceList.push(nonCompliance);

    if (!state.sparesData[code].nonCompliantOps) {
        state.sparesData[code].nonCompliantOps = [];
    }
    state.sparesData[code].nonCompliantOps.push(nonCompliance);

    addVisualNonCompliance(element);
}

function drop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const data = event.dataTransfer.getData('text');
    const draggedElement = document.getElementById(data);
    if (!draggedElement) return;

    const dropZone = event.currentTarget;
    const code = draggedElement.dataset.code;
    const name = draggedElement.dataset.name;
    const currentState = draggedElement.dataset.state;

    const isScanner = dropZone.id === 'scanner' || dropZone.closest('#scanner');
    const spareData = state.sparesData[code];
    const forbiddenDirectReceive = spareData?.origin === 'RECONDICIONADO'
        && (dropZone.id === 'almoxarifado' || dropZone.id === 'bordo' || dropZone.classList.contains('shelf-slot'));

    if (forbiddenDirectReceive) {
        addLog(`${icon('alertTriangle')} Sobressalente recondicionado deve ser recebido via TRANSPORTADORA.`, 'danger');
        draggedElement.classList.remove('dragging');
        return;
    }

    if (isScanner) {
        handleScan(draggedElement, name, code);
    } else if (dropZone.id === 'transportCollect') {
        handleTransportCollect(draggedElement, name, code, currentState);
    } else if (dropZone.id === 'transportDeliver') {
        handleTransportDeliver(draggedElement, name, code, currentState);
    } else if (dropZone.id === 'quarantine') {
        handleQuarantineDrop(draggedElement, name, code, currentState);
    } else if (dropZone.classList.contains('equipment-slot')) {
        handleInstallation(draggedElement, dropZone, name, code, currentState);
    } else if (dropZone.classList.contains('shelf-slot')) {
        handleShelfStorage(draggedElement, dropZone, name, code, currentState);
    }

    draggedElement.classList.remove('dragging');
}

function handleScan(element, name, code) {
    if (!['ALMOX', 'TRANSPORTADORA', 'CHEFE_MAQ'].includes(state.currentUser?.role)) {
        alert('ACESSO NEGADO\n\nApenas Almoxarife, Transportadora ou Chefe de Máquinas podem escanear peças.');
        return;
    }

    const currentState = element.dataset.state;
    const scanCount = parseInt(element.dataset.scanCount || '0', 10);
    const newScanCount = scanCount + 1;

    element.dataset.scanCount = String(newScanCount);
    element.dataset.lastScan = new Date().toISOString();
    updateSpareStatus(element);

    const blockchainEvent = addSpareEvent(code, 'ESCANEADO', {
        operator: state.currentUser?.name || 'Sistema',
        previousState: currentState,
        scanNumber: newScanCount
    });

    addLog(
        `${icon('qrCode')} ESCANEADO: ${escapeHtml(name)} (${escapeHtml(code)}) - Scan #${newScanCount}${formatBlockchainTag(blockchainEvent)}`,
        'success'
    );

    setTimeout(() => {
        addLog(
            `${icon('checkCircle')} VALIDADO: QR autêntico | Estado atual: ${escapeHtml(currentState)}${formatBlockchainTag(blockchainEvent)}`,
            'success'
        );
    }, 600);

    state.sparesData[code].scanCount = newScanCount;
    state.sparesData[code].lastScan = element.dataset.lastScan;

    saveAll();
    updateDashboard();
}

function handleTransportCollect(element, name, code, currentState) {
    if (state.currentUser?.role !== 'TRANSPORTADORA') {
        alert('ACESSO NEGADO\n\nApenas TRANSPORTADORA pode coletar peças.');
        return;
    }

    const validCollectionStates = ['RECEBIDO', 'AGUARDANDO_COLETA', 'ESCANEADO'];
    if (!validCollectionStates.includes(currentState)) {
        alert('Só é possível coletar peças que ainda estão no fluxo do almoxarifado.');
        return;
    }

    const scanned = wasRecentlyScanned(element);
    if (!scanned) {
        const proceed = confirm(
            `ATENÇÃO: ${name} não foi escaneada antes da coleta.\n\n` +
            'Para conformidade, o escaneamento é obrigatório.\n\n' +
            'Deseja prosseguir mesmo assim?'
        );
        if (!proceed) return;

        registerNonCompliance(code, 'COLETA', 'Coleta sem escaneamento prévio', element);
        addLog(
            `${icon('alertTriangle')} NÃO-CONFORMIDADE: ${escapeHtml(name)} coletada sem escaneamento por ${escapeHtml(state.currentUser.name)}`,
            'danger'
        );
    }

    element.dataset.state = 'EM_TRANSITO';
    element.dataset.transportadora = state.currentUser.name;
    element.classList.add('in-transit');
    updateSpareStatus(element);
    placeSpareElement(element);

    addTransportEvent(code, 'COLETA_TRANSPORTADORA', {
        type: 'COLETA_TRANSPORTADORA',
        operator: state.currentUser.name,
        company: state.currentUser.location,
        timestamp: new Date().toISOString()
    });

    const blockchainEvent = addSpareEvent(code, 'COLETADO', {
        operator: state.currentUser.name,
        company: state.currentUser.location,
        scanned,
        previousState: currentState
    });

    addLog(
        `${icon('truck')} COLETADO: ${escapeHtml(name)} por ${escapeHtml(state.currentUser.name)} (${escapeHtml(state.currentUser.location || 'Transportadora')})${formatBlockchainTag(blockchainEvent)}`,
        'warning'
    );

    saveAll();
    updateDashboard();
}

function handleTransportDeliver(element, name, code, currentState) {
    if (state.currentUser?.role !== 'TRANSPORTADORA') {
        alert('ACESSO NEGADO\n\nApenas TRANSPORTADORA pode entregar peças.');
        return;
    }

    if (currentState !== 'EM_TRANSITO') {
        alert('ATENÇÃO\n\nEsta peça não está em trânsito. Colete do almoxarifado primeiro.');
        return;
    }

    const scanned = wasRecentlyScanned(element);
    if (!scanned) {
        const proceed = confirm(
            `ATENÇÃO: ${name} não foi escaneada antes da entrega.\n\n` +
            'Para conformidade, o escaneamento é obrigatório.\n\n' +
            'Deseja prosseguir mesmo assim?'
        );
        if (!proceed) return;

        registerNonCompliance(code, 'ENTREGA', 'Entrega sem escaneamento prévio', element);
        addLog(
            `${icon('alertTriangle')} NÃO-CONFORMIDADE: ${escapeHtml(name)} entregue sem escaneamento por ${escapeHtml(state.currentUser.name)}`,
            'danger'
        );
    }

    element.dataset.state = 'ENTREGUE_BORDO';
    element.classList.remove('in-transit');
    updateSpareStatus(element);
    placeSpareElement(element);

    addTransportEvent(code, 'ENTREGA_TRANSPORTADORA', {
        type: 'ENTREGA_TRANSPORTADORA',
        operator: state.currentUser.name,
        company: state.currentUser.location,
        timestamp: new Date().toISOString(),
        scanned
    });

    const blockchainEvent = addSpareEvent(code, 'ENTREGUE_BORDO', {
        operator: state.currentUser.name,
        company: state.currentUser.location,
        scanned,
        previousState: currentState
    });

    addLog(
        `${icon('package')} ENTREGUE A BORDO: ${escapeHtml(name)} por ${escapeHtml(state.currentUser.name)}${formatBlockchainTag(blockchainEvent)}`,
        'success'
    );

    saveAll();
    updateDashboard();
}

function handleInstallation(element, equipSlot, name, code, currentState) {
    const equipName = equipSlot.dataset.equip;

    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode instalar peças.');
        return;
    }

    if (!['ENTREGUE_BORDO', 'ARMAZENADO'].includes(currentState)) {
        alert('ATENÇÃO\n\nApenas peças disponíveis a bordo ou em prateleira podem ser instaladas.');
        return;
    }

    if (!wasRecentlyScanned(element)) {
        alert('ATENÇÃO\n\nEscaneie a peça antes de instalar para manter a conformidade.');
        return;
    }

    const alreadyInstalledEquip = Object.entries(state.equipmentState).find(([, data]) => data.code === code);
    if (alreadyInstalledEquip) {
        alert(`NÃO PERMITIDO\n\nEsta peça já está instalada em ${alreadyInstalledEquip[0]}.`);
        return;
    }

    if (state.equipmentState[equipName]) {
        const installed = state.equipmentState[equipName];
        const proceed = confirm(
            `JÁ EXISTE PEÇA INSTALADA\n\n` +
            `Equipamento: ${equipName}\n` +
            `Peça atual: ${installed.name} (${installed.code})\n\n` +
            'Deseja remover a peça atual e instalar a nova?'
        );
        if (!proceed) return;
        handleRemoval(equipName, installed);
    }

    const hours = prompt(`Horas do equipamento ${equipName}:`, '12345.6');
    if (!hours) return;

    const numericHours = parseFloat(hours);
    if (Number.isNaN(numericHours)) {
        alert('Horas inválidas.');
        return;
    }

    const equipContentId = equipName === 'MCP_BB'
        ? 'equipMCPBB'
        : equipName === 'MCP_BE'
            ? 'equipMCPBE'
            : 'equipGERADOR';

    const targetDiv = document.getElementById(equipContentId);
    if (targetDiv) targetDiv.appendChild(element);

    equipSlot.classList.add('filled');
    element.dataset.state = 'INSTALADO';
    element.dataset.equip = equipName;
    element.dataset.hours = String(numericHours);
    element.classList.add('installed');
    delete element.dataset.shelf;
    updateSpareStatus(element);

    const eventHash = generateHash(code, equipName, numericHours);
    const operator = state.currentUser?.name || 'Operador';

    state.equipmentState[equipName] = {
        code,
        name,
        hours: numericHours,
        installDate: new Date().toISOString(),
        operator
    };

    const blockchainEvent = addSpareEvent(code, 'INSTALADO', {
        operator,
        equipment: equipName,
        hours: numericHours,
        hash: eventHash,
        previousState: currentState
    });

    addLog(
        `${icon('cog')} INSTALADO: ${escapeHtml(name)} → ${escapeHtml(equipName)} | Horas: ${escapeHtml(numericHours)} | ${escapeHtml(operator)} | Hash: ${escapeHtml(eventHash)}${formatBlockchainTag(blockchainEvent)}`,
        'success'
    );

    saveAll();
    updateDashboard();
}

function handleRemoval(equipName, installedData) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode remover peças de equipamentos.');
        return;
    }

    const code = installedData.code;
    const name = installedData.name;
    const operator = state.currentUser?.name || 'Operador';
    const removalHoursRaw = prompt('Horas do equipamento no momento da remoção:');
    const reasonText = prompt(
        `Motivo da remoção de ${name}:\n\n` +
        '1 - Fim de vida útil\n' +
        '2 - Defeito/Falha\n' +
        '3 - Manutenção preventiva\n' +
        '4 - Upgrade\n\n' +
        'Descreva:'
    );

    const removalHours = parseFloat(removalHoursRaw || '0');
    const installHours = parseFloat(installedData.hours || '0');
    const hoursWorked = Number.isFinite(removalHours) ? Math.max(0, removalHours - installHours) : 0;
    const removalHash = generateHash(code, equipName, removalHoursRaw || Date.now());
    const elementToMove = document.getElementById(code);
    const hasNonCompliance = Boolean(state.sparesData[code]?.nonCompliantOps?.length);

    let nextState = 'QUARENTENA';
    let eventType = 'REMOVIDO';
    let shelf = null;

    if (hasNonCompliance) {
        nextState = 'NAO_CONFORME';
        eventType = 'NAO_CONFORME';
        shelf = 'NAO_CONFORME';
    } else if (!reasonText?.trim()) {
        nextState = 'ARMAZENADO';
        eventType = 'ARMAZENADO';
        shelf = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].find((codeShelf) => {
            const shelfDiv = document.getElementById(`shelf${codeShelf}`);
            return shelfDiv && shelfDiv.children.length === 0;
        }) || null;

        if (!shelf) {
            nextState = 'ENTREGUE_BORDO';
            eventType = 'ENTREGUE_BORDO';
        }
    }

    if (elementToMove) {
        elementToMove.classList.remove('installed');
        elementToMove.classList.remove('in-transit');
        elementToMove.classList.remove('removed');
        elementToMove.dataset.state = nextState;

        if (shelf) {
            elementToMove.dataset.shelf = shelf;
        } else {
            delete elementToMove.dataset.shelf;
        }

        updateSpareStatus(elementToMove);
        placeSpareElement(elementToMove);
    }

    if (nextState === 'QUARENTENA') {
        const alreadyTracked = state.quarantineItems.some((item) => item.code === code);
        if (!alreadyTracked) {
            state.quarantineItems.push({
                code,
                name,
                addedBy: operator,
                addedDate: new Date().toISOString(),
                removalData: {
                    equipment: equipName,
                    installHours,
                    removalHours: Number.isFinite(removalHours) ? removalHours : 0,
                    hoursWorked,
                    reason: reasonText || 'Não informado'
                }
            });
        }
    } else {
        state.quarantineItems = state.quarantineItems.filter((item) => item.code !== code);
    }

    const blockchainEvent = addSpareEvent(code, eventType, {
        operator,
        equipment: equipName,
        installHours,
        removalHours: Number.isFinite(removalHours) ? removalHours : 0,
        hoursWorked,
        reason: reasonText || 'Não informado',
        destination: nextState === 'NAO_CONFORME'
            ? 'NAO_CONFORME'
            : nextState === 'ARMAZENADO'
                ? 'PRATELEIRA_BORDO'
                : nextState === 'ENTREGUE_BORDO'
                    ? 'ESTOQUE_BORDO'
                    : 'QUARENTENA',
        shelf,
        hash: removalHash,
        previousState: 'INSTALADO'
    });

    addLog(
        nextState === 'NAO_CONFORME'
            ? `${icon('alertTriangle')} REMOVIDO → NÃO CONFORME: ${escapeHtml(name)} de ${escapeHtml(equipName)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`
            : nextState === 'ARMAZENADO'
                ? `${icon('archive')} REMOVIDO → PRATELEIRA: ${escapeHtml(name)} de ${escapeHtml(equipName)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`
                : nextState === 'ENTREGUE_BORDO'
                    ? `${icon('package')} REMOVIDO → ESTOQUE DE BORDO: ${escapeHtml(name)} de ${escapeHtml(equipName)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`
                : `${icon('alertTriangle')} REMOVIDO → QUARENTENA: ${escapeHtml(name)} de ${escapeHtml(equipName)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`,
        nextState === 'NAO_CONFORME' ? 'danger' : nextState === 'QUARENTENA' ? 'warning' : 'success'
    );

    delete state.equipmentState[equipName];
    const equipSlot = document.querySelector(`[data-equip="${equipName}"]`);
    if (equipSlot) equipSlot.classList.remove('filled');

    saveAll();
    updateDashboard();
}

function handleShelfStorage(element, shelfSlot, name, code, currentState) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode armazenar peças em prateleiras.');
        return;
    }

    if (!['ENTREGUE_BORDO', 'ARMAZENADO', 'NAO_CONFORME'].includes(currentState)) {
        alert('ATENÇÃO\n\nApenas peças disponíveis a bordo ou já armazenadas podem ir para a prateleira.');
        return;
    }

    const shelfId = shelfSlot.dataset.shelf;
    const targetDiv = shelfSlot.querySelector('div:last-child');
    if (!targetDiv) return;

    targetDiv.appendChild(element);
    shelfSlot.classList.add('occupied');

    const nextState = shelfId === 'NAO_CONFORME' ? 'NAO_CONFORME' : 'ARMAZENADO';
    element.dataset.state = nextState;

    if (nextState === 'ARMAZENADO') {
        element.dataset.shelf = shelfId;
    } else {
        element.dataset.shelf = 'NAO_CONFORME';
    }

    updateSpareStatus(element);

    const operator = state.currentUser?.name || 'Operador';
    const blockchainEvent = addSpareEvent(code, nextState, {
        operator,
        shelf: nextState === 'ARMAZENADO' ? shelfId : 'NAO_CONFORME',
        previousState: currentState
    });

    addLog(
        nextState === 'NAO_CONFORME'
            ? `${icon('alertTriangle')} ARMAZENADO COMO NÃO CONFORME: ${escapeHtml(name)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`
            : `${icon('archive')} ARMAZENADO: ${escapeHtml(name)} → Prateleira ${escapeHtml(shelfId)} | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`,
        nextState === 'NAO_CONFORME' ? 'danger' : 'success'
    );

    saveAll();
    updateDashboard();
}

function handleQuarantineDrop(element, name, code, currentState) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode enviar peças para a quarentena.');
        return;
    }

    if (!['QUARENTENA', 'NAO_CONFORME', 'ARMAZENADO'].includes(currentState)) {
        alert('ATENÇÃO\n\nA peça precisa ser removida do equipamento antes de seguir para a quarentena.');
        return;
    }

    element.dataset.state = 'QUARENTENA';
    delete element.dataset.shelf;
    element.classList.add('removed');
    updateSpareStatus(element);
    placeSpareElement(element);

    const alreadyTracked = state.quarantineItems.some((item) => item.code === code);
    if (!alreadyTracked) {
        state.quarantineItems.push({
            code,
            name,
            addedBy: state.currentUser?.name || 'Sistema',
            addedDate: new Date().toISOString(),
            removalData: state.sparesData[code]?.history.find((item) => item.type === 'REMOVIDO') || null
        });
    }

    const operator = state.currentUser?.name || 'Operador';
    const blockchainEvent = addSpareEvent(code, 'QUARENTENA', {
        operator,
        location: 'QUARANTINE_ZONE',
        previousState: currentState
    });

    addLog(
        `${icon('alertTriangle')} QUARENTENA: ${escapeHtml(name)} movido para zona de quarentena | ${escapeHtml(operator)}${formatBlockchainTag(blockchainEvent)}`,
        'warning'
    );

    saveAll();
    updateDashboard();
}

function showContextMenu(event) {
    event.preventDefault();

    const spare = event.currentTarget;
    state.currentContextSpare = spare;

    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    menu.innerHTML = '';

    const currentState = spare.dataset.state;
    const code = spare.dataset.code;
    const name = spare.dataset.name;

    const historyOption = createMenuOption(icon('scroll'), 'Ver Histórico Completo', () => {
        showHistory(code);
        closeContextMenu();
    });
    menu.appendChild(historyOption);
    menu.appendChild(createMenuSeparator());

    if (currentState !== 'DESCARTADO_FINAL') {
        const scanOption = createMenuOption(icon('qrCode'), 'Escanear QR Code', () => {
            handleScan(spare, name, code);
            closeContextMenu();
        });
        menu.appendChild(scanOption);
    }

    if (currentState === 'INSTALADO') {
        menu.appendChild(createMenuSeparator());

        const equipName = spare.dataset.equip;
        const removeOption = createMenuOption(icon('wrench'), 'Remover do Equipamento', () => {
            if (state.equipmentState[equipName]) {
                handleRemoval(equipName, state.equipmentState[equipName]);
            }
            closeContextMenu();
        });
        menu.appendChild(removeOption);
    }

    menu.appendChild(createMenuSeparator());
    menu.appendChild(createMenuOption(icon('x'), 'Cancelar', closeContextMenu));

    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    menu.classList.add('active');
}

function createMenuOption(iconHtml, text, callback) {
    const option = document.createElement('div');
    option.className = 'context-menu-item';
    option.innerHTML = `<span>${iconHtml}</span> <span>${text}</span>`;
    option.onclick = callback;
    return option;
}

function createMenuSeparator() {
    const separator = document.createElement('div');
    separator.className = 'context-menu-separator';
    return separator;
}

function closeContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.classList.remove('active');
}
