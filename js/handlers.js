/**
 * SPARES-CHAIN v6.3 — Handlers (Drag & Drop, Ações, Menu de Contexto)
 */

// ===== DRAG AND DROP =====
function drag(event) {
    event.dataTransfer.setData('text', event.target.id);
    event.target.classList.add('dragging');
}

function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
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

// ===== ESCANEAMENTO =====
function handleScan(element, name, code) {

    // Impede scan por Auditor
    if (!['ALMOX', 'TRANSPORTADORA', 'CHEFE_MAQ'].includes(state.currentUser?.role)) {
        alert('ACESSO NEGADO\n\nApenas Almoxarife, Transportadora ou Chefe de Máquinas podem escanear peças.');
        return;
    }
    const currentState = element.dataset.state;
    const scanCount = parseInt(element.dataset.scanCount || 0);

    element.dataset.scanCount = scanCount + 1;
    element.dataset.lastScan = new Date().toISOString();

    addLog(`${icon('qrCode')} ESCANEADO: ${name} (${code}) - Scan #${scanCount + 1}`, 'success');

    setTimeout(() => {
        addLog(`${icon('checkCircle')} VALIDADO: QR autêntico | Assinatura: OK | Estado: ${currentState}`, 'success');
    }, 600);


    element.dataset.state = 'ESCANEADO';
    // Remove flag de não-conformidade se presente
    element.classList.remove('non-compliant');
    const warn = element.querySelector('.spare-warning');
    if (warn) warn.remove();
    updateSpareStatus(element);

    addSpareEvent(code, 'ESCANEADO', {
        operator: state.currentUser ? state.currentUser.name : 'Sistema',
        previousState: currentState,
        scanNumber: scanCount + 1
    });

    if (state.sparesData[code]) {
        state.sparesData[code].scanCount = scanCount + 1;
    }

    saveAll();
    updateDashboard();

    console.log('[SCAN] Scan registrado:', { code, name, scanNumber: scanCount + 1 });
}

// ===== TRANSPORTADORA - COLETA =====
function handleTransportCollect(element, name, code, currentState) {
    if (state.currentUser.role !== 'TRANSPORTADORA') {
        alert('ACESSO NEGADO\n\nApenas TRANSPORTADORA pode coletar peças.');
        return;

    } else {
        // Se coleta for conforme, remove flag de não-conformidade
        element.classList.remove('non-compliant');
        const warn = element.querySelector('.spare-warning');
        if (warn) warn.remove();
    }

    if (currentState !== 'ESCANEADO') {
        const nonCompliance = {
            spare: code,
            operation: 'COLETA',
            operator: state.currentUser.name,
            timestamp: new Date().toISOString(),
            reason: 'Coleta sem escaneamento prévio'
        };

        state.nonComplianceList.push(nonCompliance);
        state.sparesData[code].nonCompliantOps.push(nonCompliance);

        element.classList.add('non-compliant');
        const warning = document.createElement('div');
        warning.className = 'spare-warning';
        warning.textContent = '!';
        element.appendChild(warning);

        addLog(`${icon('alertTriangle')} NÃO-CONFORMIDADE: ${name} coletado SEM escaneamento por ${state.currentUser.name}`, 'danger');
    }

    const targetDiv = document.getElementById('transportInTransit');
    if (targetDiv) targetDiv.appendChild(element);

    element.dataset.state = 'EM_TRANSITO';
    element.dataset.transportadora = state.currentUser.name;
    element.classList.add('in-transit');
    updateSpareStatus(element);

    addLog(`${icon('truck')} COLETADO: ${name} por ${state.currentUser.name} (Transportadora)`, 'warning');

    addSpareEvent(code, 'COLETADO', {
        operator: state.currentUser.name,
        company: state.currentUser.location,
        scanned: currentState === 'ESCANEADO'
    });

    saveAll();
    updateDashboard();
}

// ===== TRANSPORTADORA - ENTREGA =====
function handleTransportDeliver(element, name, code, currentState) {
    if (state.currentUser.role !== 'TRANSPORTADORA') {
        alert('ACESSO NEGADO\n\nApenas TRANSPORTADORA pode entregar peças.');
        return;
    }

    if (currentState !== 'EM_TRANSITO') {
        alert('ATENÇÃO\n\nEsta peça não está em trânsito. Colete do almoxarifado primeiro.');
        return;
    }

    const lastScan = element.dataset.lastScan;
    const timeSinceLastScan = lastScan ? (Date.now() - new Date(lastScan).getTime()) / 1000 : Infinity;

    if (timeSinceLastScan > 60) {
        const proceed = confirm(`ATENÇÃO: ${name} não foi escaneado antes da entrega.\n\nPara conformidade, escanear é OBRIGATÓRIO.\n\nProsseguir mesmo assim? (NÃO RECOMENDADO)`);
        if (!proceed) return;

        const nonCompliance = {
            spare: code,
            operation: 'ENTREGA',
            operator: state.currentUser.name,
            timestamp: new Date().toISOString(),
            reason: 'Entrega sem escaneamento prévio'
        };

        state.nonComplianceList.push(nonCompliance);
        state.sparesData[code].nonCompliantOps.push(nonCompliance);

        addLog(`${icon('alertTriangle')} NÃO-CONFORMIDADE: ${name} entregue SEM escaneamento por ${state.currentUser.name}`, 'danger');
    }

    element.dataset.state = 'ENTREGUE_BORDO';
    element.classList.remove('in-transit');
    updateSpareStatus(element);

    addLog(`${icon('package')} ENTREGUE A BORDO: ${name} por ${state.currentUser.name}`, 'success');

    addSpareEvent(code, 'ENTREGUE_BORDO', {
        operator: state.currentUser.name,
        company: state.currentUser.location,
        scanned: timeSinceLastScan <= 60
    });

    saveAll();
    updateDashboard();
}

// ===== INSTALAÇÃO =====
function handleInstallation(element, equipSlot, name, code, currentState) {
    const equipName = equipSlot.dataset.equip;

    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode instalar peças.');
        return;
    }

    if (currentState !== 'ESCANEADO' && currentState !== 'ENTREGUE_BORDO') {
        alert('ATENÇÃO\n\nEscanear peça antes de instalar é OBRIGATÓRIO para conformidade.');
        return;
    }


    // Impede instalação duplicada da mesma peça em múltiplos equipamentos
    const alreadyInstalledEquip = Object.entries(state.equipmentState).find(([eq, data]) => data.code === code);
    if (alreadyInstalledEquip) {
        alert(`NÃO PERMITIDO\n\nEsta peça já está instalada em outro equipamento (${alreadyInstalledEquip[0]}). Remova antes de instalar em outro.`);
        return;
    }

    if (state.equipmentState[equipName]) {
        const installed = state.equipmentState[equipName];
        const proceed = confirm(
            `JÁ EXISTE PEÇA INSTALADA!\n\n` +
            `Equipamento: ${equipName}\n` +
            `Peça atual: ${installed.name} (${installed.code})\n` +
            `Horas instalação: ${installed.hours}\n\n` +
            `Deseja REMOVER a peça antiga e instalar a nova?\n` +
            `(A peça antiga será marcada para DESCARTE)`
        );
        if (!proceed) return;
        handleRemoval(equipName, installed);
    }

    const hours = prompt(`Horas do equipamento ${equipName}:`, '12345.6');
    if (!hours) return;

    const equipContentId = equipName === 'MCP_BB' ? 'equipMCPBB' :
                           equipName === 'MCP_BE' ? 'equipMCPBE' : 'equipGERADOR';
    const targetDiv = document.getElementById(equipContentId);
    if (targetDiv) targetDiv.appendChild(element);

    equipSlot.classList.add('filled');
    element.dataset.state = 'INSTALADO';
    element.dataset.equip = equipName;
    element.dataset.hours = hours;
    element.classList.add('installed');
    updateSpareStatus(element);

    const eventHash = generateHash(code, equipName, hours);
    const operator = state.currentUser ? state.currentUser.name : 'Operador';

    state.equipmentState[equipName] = {
        code, name,
        hours: parseFloat(hours),
        installDate: new Date().toISOString(),
        operator
    };

    addLog(`${icon('cog')} INSTALADO: ${name} → ${equipName} | Horas: ${hours} | ${operator} | Hash: ${eventHash}`, 'success');

    addSpareEvent(code, 'INSTALADO', {
        operator,
        equipment: equipName,
        hours: parseFloat(hours),
        hash: eventHash
    });

    saveAll();
    updateDashboard();
}

// ===== REMOÇÃO =====
function handleRemoval(equipName, installedData) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode remover peças de equipamentos.');
        return;
    }

    const code = installedData.code;
    const name = installedData.name;

    const reason = prompt(
        `Motivo da remoção de ${name}:\n\n` +
        `1 - Fim de vida útil\n` +
        `2 - Defeito/Falha\n` +
        `3 - Manutenção preventiva\n` +
        `4 - Upgrade\n` +
        `5 - Outro\n\n` +
        `Digite o número:`, '1'
    );

    const reasons = {
        '1': 'Fim de vida útil',
        '2': 'Defeito/Falha',
        '3': 'Manutenção preventiva',
        '4': 'Upgrade',
        '5': 'Outro'
    };
    const reasonText = reasons[reason] || 'Não especificado';


    let removalHours = prompt(`Horas do equipamento na REMOÇÃO:`, '12500.0');
    if (!removalHours) return;
    removalHours = parseFloat(removalHours);
    if (isNaN(removalHours)) {
        alert('Valor de horas inválido.');
        return;
    }
    if (removalHours < installedData.hours) {
        alert('Horas de remoção não podem ser menores que as horas de instalação!');
        return;
    }

    const hoursWorked = removalHours - installedData.hours;

    const willDispose = confirm(
        `Peça removida: ${name}\n` +
        `Horas trabalhadas: ${hoursWorked.toFixed(1)}h\n` +
        `Motivo: ${reasonText}\n\n` +
        `Destino:\n` +
        `SIM = Quarentena (aguarda logística reversa)\n` +
        `NÃO = Retorna ao estoque (peça reutilizável)\n\n` +
        `Enviar para QUARENTENA?`
    );

    const operator = state.currentUser ? state.currentUser.name : 'Operador';
    const removalHash = generateHash(code, equipName, removalHours);

    if (willDispose) {
        addLog(
            `${icon('trash')} REMOVIDO → QUARENTENA: ${name} de ${equipName} | ` +
            `Trabalhou: ${hoursWorked.toFixed(1)}h | ` +
            `Motivo: ${reasonText} | ${operator}`,
            'warning'
        );

        addSpareEvent(code, 'REMOVIDO', {
            operator, equipment: equipName,
            installHours: installedData.hours,
            removalHours: parseFloat(removalHours),
            hoursWorked, reason: reasonText,
            destination: 'QUARENTENA',
            hash: removalHash
        });

        const elementToMove = document.getElementById(code);
        if (elementToMove) {
            elementToMove.dataset.state = 'QUARENTENA';
            elementToMove.classList.remove('installed');
            elementToMove.classList.add('removed');
            if (state.sparesData[code]) {
                state.sparesData[code].currentState = 'QUARENTENA';
            }

            const quarantineList = document.getElementById('quarantineList');
            if (quarantineList) {
                quarantineList.appendChild(elementToMove);

                state.quarantineItems.push({
                    code, name,
                    addedBy: operator,
                    addedDate: new Date().toISOString(),
                    removalData: {
                        equipment: equipName,
                        installHours: installedData.hours,
                        removalHours: parseFloat(removalHours),
                        hoursWorked, reason: reasonText
                    }
                });
            }

            updateSpareStatus(elementToMove);

            setTimeout(() => {
                alert(
                    `PEÇA ENVIADA PARA QUARENTENA\n\n` +
                    `${name} foi removido do ${equipName}.\n\n` +
                    `A peça foi movida AUTOMATICAMENTE para\n` +
                    `o painel "QUARENTENA/RESÍDUOS".\n\n` +
                    `Aguardando coleta pela transportadora.`
                );
            }, 500);
        }
    } else {
        addLog(
            `${icon('upload')} REMOVIDO → ESTOQUE: ${name} de ${equipName} | ` +
            `Trabalhou: ${hoursWorked.toFixed(1)}h | ` +
            `Peça reutilizável | ${operator}`,
            'success'
        );

        addSpareEvent(code, 'REMOVIDO', {
            operator, equipment: equipName,
            installHours: installedData.hours,
            removalHours: parseFloat(removalHours),
            hoursWorked, reason: reasonText,
            destination: 'ESTOQUE',
            returnToStock: true,
            hash: removalHash
        });

        const elementToMove = document.getElementById(code);
        if (elementToMove) {
            elementToMove.dataset.state = 'RECEBIDO';
            elementToMove.classList.remove('installed');
            elementToMove.classList.remove('removed');
            if (state.sparesData[code]) {
                state.sparesData[code].currentState = 'RECEBIDO';
            }

            const sparesList = document.getElementById('sparesList');
            if (sparesList) sparesList.appendChild(elementToMove);

            updateSpareStatus(elementToMove);
        }
    }

    delete state.equipmentState[equipName];

    const equipSlot = document.querySelector(`[data-equip="${equipName}"]`);
    if (equipSlot) equipSlot.classList.remove('filled');

    saveAll();
    updateDashboard();
}

// ===== ARMAZENAMENTO EM PRATELEIRA =====
function handleShelfStorage(element, shelfSlot, name, code) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode armazenar peças em prateleiras.');
        return;
    }

    const shelfId = shelfSlot.dataset.shelf;

    const targetDiv = shelfSlot.querySelector('div:last-child');
    targetDiv.appendChild(element);

    shelfSlot.classList.add('occupied');
    element.dataset.state = 'ARMAZENADO';
    element.dataset.shelf = shelfId;
    updateSpareStatus(element);

    const operator = state.currentUser ? state.currentUser.name : 'Operador';
    addLog(`${icon('archive')} ARMAZENADO: ${name} → Prateleira ${shelfId} | ${operator}`, 'success');

    addSpareEvent(code, 'ARMAZENADO', { operator, shelf: shelfId });

    saveAll();
    updateDashboard();
}

// ===== QUARENTENA =====
function handleQuarantineDrop(element, name, code, currentState) {
    if (state.currentUser?.role !== 'CHEFE_MAQ') {
        alert('ACESSO NEGADO\n\nApenas CHEFE DE MÁQUINAS pode enviar peças para a quarentena.');
        return;
    }

    if (currentState !== 'REMOVIDO' && currentState !== 'QUARENTENA') {
        alert('ACESSO NEGADO\n\nApenas peças REMOVIDAS podem ir para a QUARENTENA.\n\nPrimeiro remova a peça do equipamento.');
        return;
    }

    const targetDiv = document.getElementById('quarantineList');
    if (targetDiv) targetDiv.appendChild(element);

    element.dataset.state = 'QUARENTENA';
    element.classList.add('removed');
    updateSpareStatus(element);

    const alreadyTracked = state.quarantineItems.some(item => item.code === code);
    if (!alreadyTracked) {
        const quarantineItem = {
            code, name,
            addedBy: state.currentUser ? state.currentUser.name : 'Sistema',
            addedDate: new Date().toISOString(),
            removalData: state.sparesData[code] ? state.sparesData[code].history.find(h => h.type === 'REMOVIDO') : null
        };

        state.quarantineItems.push(quarantineItem);
    }

    const operator = state.currentUser ? state.currentUser.name : 'Operador';
    addLog(`${icon('alertTriangle')} QUARENTENA: ${name} movido para zona de quarentena | ${operator}`, 'warning');

    addSpareEvent(code, 'QUARENTENA', { operator, location: 'QUARANTINE_ZONE' });

    saveAll();
    updateDashboard();
}

// ===== MENU DE CONTEXTO =====
function showContextMenu(event) {
    event.preventDefault();

    const spare = event.currentTarget;
    state.currentContextSpare = spare;

    const menu = document.getElementById('contextMenu');
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

    if (currentState !== 'DESCARTADO') {
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

    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
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
    document.getElementById('contextMenu').classList.remove('active');
}
