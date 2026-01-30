document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const structureTypeSelect = document.getElementById('structureType');
    const operationSpeedInput = document.getElementById('operationSpeed');
    const speedValue = document.getElementById('speedValue');
    const listSizeInput = document.getElementById('listSize');
    const listSizeValue = document.getElementById('listSizeValue');
    const stackSizeInput = document.getElementById('stackSize');
    const stackSizeValue = document.getElementById('stackSizeValue');
    const elementValueInput = document.getElementById('elementValue');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Elementos de visualização
    const listContainer = document.getElementById('listContainer');
    const listConnections = document.getElementById('listConnections');
    const stackContainer = document.getElementById('stackContainer');
    const stackPointer = document.getElementById('stackPointer');
    const stackInfo = document.getElementById('stackInfo');
    
    // Elementos de operações
    const listOperations = document.getElementById('listOperations');
    const stackOperations = document.getElementById('stackOperations');
    const operationDetails = document.getElementById('operationDetails');
    
    // Elementos de status
    const currentSize = document.getElementById('currentSize');
    const currentCapacity = document.getElementById('currentCapacity');
    const currentIndex = document.getElementById('currentIndex');
    const currentValue = document.getElementById('currentValue');
    const operationCount = document.getElementById('operationCount');
    const elementCount = document.getElementById('elementCount');
    const accessCount = document.getElementById('accessCount');
    const statusText = document.getElementById('statusText');
    
    // Tabs
    const structureTabs = document.querySelectorAll('.structure-tab');
    const listVisualization = document.querySelector('.list-visualization');
    const stackVisualization = document.querySelector('.stack-visualization');
    
    // Variáveis de estado
    let currentStructure = 'list';
    let animationSpeed = 1000;
    let operationCounter = 0;
    let accessCounter = 0;
    let isAnimating = false;
    let animationTimeout;
    
    // Estruturas de dados
    let list = [];
    let listCapacity = 7;
    let stack = [];
    let stackCapacity = 5;
    
    // Inicialização
    init();
    
    function init() {
        setupEventListeners();
        updateStructure();
        generateRandomData();
        updateStatus();
    }
    
    function setupEventListeners() {
        // Seleção de estrutura
        structureTypeSelect.addEventListener('change', updateStructure);
        
        // Tabs
        structureTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const structure = tab.dataset.structure;
                switchStructure(structure);
            });
        });
        
        // Controles
        operationSpeedInput.addEventListener('input', updateSpeed);
        listSizeInput.addEventListener('input', updateListSize);
        stackSizeInput.addEventListener('input', updateStackSize);
        elementValueInput.addEventListener('keypress', handleEnterKey);
        
        // Botões principais
        generateBtn.addEventListener('click', generateRandomData);
        clearBtn.addEventListener('click', clearData);
        resetBtn.addEventListener('click', resetAll);
        
        // Operações de lista
        document.querySelectorAll('#listOperations .operation-btn').forEach(btn => {
            btn.addEventListener('click', () => handleListOperation(btn.dataset.op));
        });
        
        // Operações de pilha
        document.querySelectorAll('#stackOperations .operation-btn').forEach(btn => {
            btn.addEventListener('click', () => handleStackOperation(btn.dataset.op));
        });
    }
    
    function updateSpeed() {
        const value = parseInt(operationSpeedInput.value);
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function updateListSize() {
        listCapacity = parseInt(listSizeInput.value);
        listSizeValue.textContent = listCapacity;
        
        if (currentStructure === 'list') {
            // Ajustar lista se necessário
            if (list.length > listCapacity) {
                list = list.slice(0, listCapacity);
            }
            renderList();
            updateStatus();
        }
    }
    
    function updateStackSize() {
        stackCapacity = parseInt(stackSizeInput.value);
        stackSizeValue.textContent = stackCapacity;
        
        if (currentStructure === 'stack') {
            // Ajustar pilha se necessário
            if (stack.length > stackCapacity) {
                stack = stack.slice(0, stackCapacity);
            }
            renderStack();
            updateStatus();
        }
    }
    
    function updateStructure() {
        currentStructure = structureTypeSelect.value;
        switchStructure(currentStructure);
    }
    
    function switchStructure(structure) {
        currentStructure = structure;
        
        // Atualizar tabs
        structureTabs.forEach(tab => {
            if (tab.dataset.structure === structure) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Atualizar visualização
        if (structure === 'list') {
            listVisualization.classList.add('active');
            stackVisualization.classList.remove('active');
            listOperations.style.display = 'grid';
            stackOperations.style.display = 'none';
            
            // Atualizar controles visíveis
            document.getElementById('listSizeControl').style.display = 'block';
            document.getElementById('stackSizeControl').style.display = 'none';
            
            renderList();
            updateStatus();
        } else {
            listVisualization.classList.remove('active');
            stackVisualization.classList.add('active');
            listOperations.style.display = 'none';
            stackOperations.style.display = 'grid';
            
            // Atualizar controles visíveis
            document.getElementById('listSizeControl').style.display = 'none';
            document.getElementById('stackSizeControl').style.display = 'block';
            
            renderStack();
            updateStatus();
        }
        
        // Atualizar select
        structureTypeSelect.value = structure;
    }
    
    function generateRandomData() {
        if (currentStructure === 'list') {
            // Gerar lista aleatória
            list = [];
            const size = Math.floor(Math.random() * (listCapacity - 2)) + 2; // 2 a capacity-1
            for (let i = 0; i < size; i++) {
                list.push(Math.floor(Math.random() * 100) + 1);
            }
            renderList();
        } else {
            // Gerar pilha aleatória
            stack = [];
            const size = Math.floor(Math.random() * (stackCapacity - 1)) + 1; // 1 a capacity-1
            for (let i = 0; i < size; i++) {
                stack.push(Math.floor(Math.random() * 100) + 1);
            }
            renderStack();
        }
        
        operationDetails.innerHTML = `<p>Dados aleatórios gerados com sucesso.</p>`;
        operationCounter++;
        updateStatus();
    }
    
    function clearData() {
        if (currentStructure === 'list') {
            list = [];
            renderList();
            operationDetails.innerHTML = `<p>Lista limpa. Todos os elementos foram removidos.</p>`;
        } else {
            stack = [];
            renderStack();
            operationDetails.innerHTML = `<p>Pilha limpa. Todos os elementos foram removidos.</p>`;
        }
        
        operationCounter++;
        updateStatus();
    }
    
    function resetAll() {
        list = [];
        stack = [];
        operationCounter = 0;
        accessCounter = 0;
        
        if (currentStructure === 'list') {
            renderList();
            operationDetails.innerHTML = `<p>Sistema reiniciado. Lista vazia.</p>`;
        } else {
            renderStack();
            operationDetails.innerHTML = `<p>Sistema reiniciado. Pilha vazia.</p>`;
        }
        
        updateStatus();
    }
    
    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            const value = elementValueInput.value.trim();
            if (value) {
                if (currentStructure === 'list') {
                    handleListOperation('insertEnd');
                } else {
                    handleStackOperation('push');
                }
            }
        }
    }
    
    async function handleListOperation(operation) {
        if (isAnimating) return;
        isAnimating = true;
        statusText.textContent = 'Processando...';
        
        const value = elementValueInput.value.trim();
        let result;
        
        switch (operation) {
            case 'insertStart':
                result = await insertAtStart(value);
                break;
            case 'insertEnd':
                result = await insertAtEnd(value);
                break;
            case 'insertAt':
                result = await insertAtIndex(value);
                break;
            case 'removeStart':
                result = await removeFromStart();
                break;
            case 'removeEnd':
                result = await removeFromEnd();
                break;
            case 'removeAt':
                result = await removeAtIndex();
                break;
            case 'search':
                result = await searchValue(value);
                break;
            case 'update':
                result = await updateValue(value);
                break;
        }
        
        isAnimating = false;
        statusText.textContent = 'Pronto';
        operationCounter++;
        updateStatus();
    }
    
    async function handleStackOperation(operation) {
        if (isAnimating) return;
        isAnimating = true;
        statusText.textContent = 'Processando...';
        
        const value = elementValueInput.value.trim();
        let result;
        
        switch (operation) {
            case 'push':
                result = await pushToStack(value);
                break;
            case 'pop':
                result = await popFromStack();
                break;
            case 'peek':
                result = await peekStack();
                break;
            case 'isFull':
                result = await checkStackFull();
                break;
            case 'isEmpty':
                result = await checkStackEmpty();
                break;
        }
        
        isAnimating = false;
        statusText.textContent = 'Pronto';
        operationCounter++;
        updateStatus();
    }
    
    // Operações de Lista
    async function insertAtStart(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para inserir.</p>`;
            return;
        }
        
        if (list.length >= listCapacity) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está cheia (capacidade: ${listCapacity}).</p>`;
            return;
        }
        
        // Animação de inserção
        operationDetails.innerHTML = `<p><strong>Inserindo no início:</strong> Valor "${value}" será inserido na posição 0.</p>`;
        
        // Mostrar espaço vazio no início
        const tempList = ['?', ...list];
        renderList(tempList);
        highlightListElement(0, 'highlight');
        
        await sleep(animationSpeed / 2);
        
        // Inserir valor
        list.unshift(parseInt(value));
        renderList();
        highlightListElement(0, 'active');
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" inserido no início da lista.</p>`;
        elementValueInput.value = '';
        accessCounter++;
    }
    
    async function insertAtEnd(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para inserir.</p>`;
            return;
        }
        
        if (list.length >= listCapacity) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está cheia (capacidade: ${listCapacity}).</p>`;
            return;
        }
        
        const index = list.length;
        operationDetails.innerHTML = `<p><strong>Inserindo no fim:</strong> Valor "${value}" será inserido na posição ${index}.</p>`;
        
        // Mostrar espaço vazio no fim
        const tempList = [...list, '?'];
        renderList(tempList);
        highlightListElement(index, 'highlight');
        
        await sleep(animationSpeed / 2);
        
        // Inserir valor
        list.push(parseInt(value));
        renderList();
        highlightListElement(index, 'active');
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" inserido no fim da lista.</p>`;
        elementValueInput.value = '';
        accessCounter++;
    }
    
    async function insertAtIndex(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para inserir.</p>`;
            return;
        }
        
        if (list.length >= listCapacity) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está cheia (capacidade: ${listCapacity}).</p>`;
            return;
        }
        
        const index = prompt('Digite o índice para inserir (0 a ' + list.length + '):');
        if (index === null) return;
        
        const idx = parseInt(index);
        if (isNaN(idx) || idx < 0 || idx > list.length) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Índice inválido. Deve estar entre 0 e ${list.length}.</p>`;
            return;
        }
        
        operationDetails.innerHTML = `<p><strong>Inserindo na posição ${idx}:</strong> Valor "${value}" será inserido.</p>`;
        
        // Animação de deslocamento
        for (let i = list.length; i > idx; i--) {
            highlightListElement(i - 1, 'next');
            await sleep(animationSpeed / 3);
        }
        
        // Mostrar espaço vazio
        const tempList = [...list.slice(0, idx), '?', ...list.slice(idx)];
        renderList(tempList);
        highlightListElement(idx, 'highlight');
        
        await sleep(animationSpeed / 2);
        
        // Inserir valor
        list.splice(idx, 0, parseInt(value));
        renderList();
        highlightListElement(idx, 'active');
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" inserido na posição ${idx}.</p>`;
        elementValueInput.value = '';
        accessCounter++;
    }
    
    async function removeFromStart() {
        if (list.length === 0) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está vazia.</p>`;
            return;
        }
        
        const value = list[0];
        operationDetails.innerHTML = `<p><strong>Removendo do início:</strong> Valor "${value}" será removido da posição 0.</p>`;
        
        highlightListElement(0, 'removing');
        
        await sleep(animationSpeed / 2);
        
        // Remover valor
        list.shift();
        renderList();
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" removido do início da lista.</p>`;
        accessCounter++;
    }
    
    async function removeFromEnd() {
        if (list.length === 0) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está vazia.</p>`;
            return;
        }
        
        const index = list.length - 1;
        const value = list[index];
        operationDetails.innerHTML = `<p><strong>Removendo do fim:</strong> Valor "${value}" será removido da posição ${index}.</p>`;
        
        highlightListElement(index, 'removing');
        
        await sleep(animationSpeed / 2);
        
        // Remover valor
        list.pop();
        renderList();
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" removido do fim da lista.</p>`;
        accessCounter++;
    }
    
    async function removeAtIndex() {
        if (list.length === 0) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Lista está vazia.</p>`;
            return;
        }
        
        const index = prompt('Digite o índice para remover (0 a ' + (list.length - 1) + '):');
        if (index === null) return;
        
        const idx = parseInt(index);
        if (isNaN(idx) || idx < 0 || idx >= list.length) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Índice inválido. Deve estar entre 0 e ${list.length - 1}.</p>`;
            return;
        }
        
        const value = list[idx];
        operationDetails.innerHTML = `<p><strong>Removendo da posição ${idx}:</strong> Valor "${value}" será removido.</p>`;
        
        highlightListElement(idx, 'removing');
        
        await sleep(animationSpeed / 2);
        
        // Animação de deslocamento
        for (let i = idx; i < list.length - 1; i++) {
            highlightListElement(i + 1, 'next');
            await sleep(animationSpeed / 3);
        }
        
        // Remover valor
        list.splice(idx, 1);
        renderList();
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" removido da posição ${idx}.</p>`;
        accessCounter++;
    }
    
    async function searchValue(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para buscar.</p>`;
            return;
        }
        
        const searchVal = parseInt(value);
        if (isNaN(searchVal)) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Valor inválido. Digite um número.</p>`;
            return;
        }
        
        operationDetails.innerHTML = `<p><strong>Buscando valor:</strong> Procurando "${searchVal}" na lista...</p>`;
        
        let found = false;
        for (let i = 0; i < list.length; i++) {
            highlightListElement(i, 'highlight');
            await sleep(animationSpeed / 3);
            
            if (list[i] === searchVal) {
                highlightListElement(i, 'active');
                found = true;
                operationDetails.innerHTML = `<p><strong>Valor encontrado:</strong> "${searchVal}" está na posição ${i}.</p>`;
                break;
            }
            
            highlightListElement(i, 'normal');
        }
        
        if (!found) {
            operationDetails.innerHTML = `<p><strong>Valor não encontrado:</strong> "${searchVal}" não está na lista.</p>`;
        }
        
        elementValueInput.value = '';
        accessCounter++;
    }
    
    async function updateValue(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para atualizar.</p>`;
            return;
        }
        
        const index = prompt('Digite o índice para atualizar (0 a ' + (list.length - 1) + '):');
        if (index === null) return;
        
        const idx = parseInt(index);
        if (isNaN(idx) || idx < 0 || idx >= list.length) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Índice inválido. Deve estar entre 0 e ${list.length - 1}.</p>`;
            return;
        }
        
        const oldValue = list[idx];
        const newValue = parseInt(value);
        if (isNaN(newValue)) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Valor inválido. Digite um número.</p>`;
            return;
        }
        
        operationDetails.innerHTML = `<p><strong>Atualizando posição ${idx}:</strong> "${oldValue}" → "${newValue}".</p>`;
        
        highlightListElement(idx, 'removing');
        
        await sleep(animationSpeed / 2);
        
        // Atualizar valor
        list[idx] = newValue;
        renderList();
        highlightListElement(idx, 'active');
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Posição ${idx} atualizada de "${oldValue}" para "${newValue}".</p>`;
        elementValueInput.value = '';
        accessCounter++;
    }
    
    // Operações de Pilha
    async function pushToStack(value) {
        if (!value) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Digite um valor para empilhar.</p>`;
            return;
        }
        
        if (stack.length >= stackCapacity) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Pilha está cheia (capacidade: ${stackCapacity}).</p>`;
            return;
        }
        
        const newValue = parseInt(value);
        if (isNaN(newValue)) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Valor inválido. Digite um número.</p>`;
            return;
        }
        
        operationDetails.innerHTML = `<p><strong>Push (Empilhar):</strong> Valor "${newValue}" será empilhado no topo.</p>`;
        
        // Animação de push
        const tempStack = [...stack, newValue];
        renderStack(tempStack);
        highlightStackElement(stack.length, 'pushing');
        
        await sleep(animationSpeed / 2);
        
        // Empilhar valor
        stack.push(newValue);
        renderStack();
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${newValue}" empilhado. Topo da pilha: ${stack.length - 1}.</p>`;
        elementValueInput.value = '';
        accessCounter++;
    }
    
    async function popFromStack() {
        if (stack.length === 0) {
            operationDetails.innerHTML = `<p><strong>Erro:</strong> Pilha está vazia.</p>`;
            return;
        }
        
        const value = stack[stack.length - 1];
        operationDetails.innerHTML = `<p><strong>Pop (Desempilhar):</strong> Valor "${value}" será removido do topo.</p>`;
        
        highlightStackElement(stack.length - 1, 'popping');
        
        await sleep(animationSpeed / 2);
        
        // Desempilhar valor
        stack.pop();
        renderStack();
        
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Sucesso:</strong> Valor "${value}" desempilhado.`;
        if (stack.length > 0) {
            operationDetails.innerHTML += ` Novo topo: ${stack[stack.length - 1]}.</p>`;
        } else {
            operationDetails.innerHTML += ` Pilha vazia.</p>`;
        }
        
        accessCounter++;
    }
    
    async function peekStack() {
        if (stack.length === 0) {
            operationDetails.innerHTML = `<p><strong>Peek (Ver Topo):</strong> Pilha está vazia.</p>`;
            return;
        }
        
        const value = stack[stack.length - 1];
        operationDetails.innerHTML = `<p><strong>Peek (Ver Topo):</strong> Valor no topo: "${value}".</p>`;
        
        highlightStackElement(stack.length - 1, 'top');
        
        await sleep(animationSpeed);
        
        highlightStackElement(stack.length - 1, 'normal');
        accessCounter++;
    }
    
    async function checkStackFull() {
        const isFull = stack.length >= stackCapacity;
        
        if (isFull) {
            operationDetails.innerHTML = `<p><strong>Está Cheia?:</strong> SIM, pilha está cheia (${stack.length}/${stackCapacity}).</p>`;
            
            // Destaque todos os elementos
            for (let i = 0; i < stack.length; i++) {
                highlightStackElement(i, 'top');
                await sleep(animationSpeed / 4);
            }
        } else {
            operationDetails.innerHTML = `<p><strong>Está Cheia?:</strong> NÃO, pilha tem ${stack.length} de ${stackCapacity} elementos.</p>`;
        }
        
        accessCounter++;
    }
    
    async function checkStackEmpty() {
        const isEmpty = stack.length === 0;
        
        if (isEmpty) {
            operationDetails.innerHTML = `<p><strong>Está Vazia?:</strong> SIM, pilha está vazia.</p>`;
        } else {
            operationDetails.innerHTML = `<p><strong>Está Vazia?:</strong> NÃO, pilha tem ${stack.length} elementos.</p>`;
            
            // Mostrar todos os elementos
            for (let i = 0; i < stack.length; i++) {
                highlightStackElement(i, 'highlight');
                await sleep(animationSpeed / 4);
            }
        }
        
        accessCounter++;
    }
    
    // Funções de renderização
    function renderList(customList = null) {
        const data = customList || list;
        listContainer.innerHTML = '';
        listConnections.innerHTML = '';
        
        if (data.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <i class="fas fa-list"></i>
                <p>Lista vazia. Adicione elementos usando as operações.</p>
            `;
            listContainer.appendChild(emptyMessage);
            return;
        }
        
        // Criar elementos
        data.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'list-element';
            element.id = `list-element-${index}`;
            
            const indexSpan = document.createElement('span');
            indexSpan.className = 'index';
            indexSpan.textContent = `[${index}]`;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            valueSpan.textContent = value;
            
            element.appendChild(indexSpan);
            element.appendChild(valueSpan);
            
            // Adicionar ponteiro se não for o último
            if (index < data.length - 1) {
                const pointer = document.createElement('span');
                pointer.className = 'pointer';
                pointer.innerHTML = `<i class="fas fa-arrow-right"></i>`;
                element.appendChild(pointer);
            }
            
            listContainer.appendChild(element);
        });
        
        // Atualizar conexões
        updateListConnections();
    }
    
    function updateListConnections() {
        listConnections.innerHTML = '';
        
        if (list.length <= 1) return;
        
        const connectionsDiv = document.createElement('div');
        connectionsDiv.className = 'connection';
        connectionsDiv.innerHTML = `
            <span>Head</span>
            <i class="fas fa-arrow-right"></i>
            <span>...</span>
            <i class="fas fa-arrow-right"></i>
            <span>Tail</span>
        `;
        listConnections.appendChild(connectionsDiv);
    }
    
    function highlightListElement(index, className) {
        const element = document.getElementById(`list-element-${index}`);
        if (element) {
            // Remover todas as classes de destaque
            document.querySelectorAll('.list-element').forEach(el => {
                el.classList.remove('active', 'highlight', 'next', 'previous', 'removing');
            });
            
            // Adicionar classe específica
            if (className !== 'normal') {
                element.classList.add(className);
            }
            
            // Atualizar interface
            currentIndex.textContent = index;
            currentValue.textContent = list[index] || '-';
        }
    }
    
    function renderStack(customStack = null) {
        const data = customStack || stack;
        const stackElements = stackContainer.querySelectorAll('.stack-element:not(.stack-base)');
        stackElements.forEach(el => el.remove());
        
        // Criar elementos da pilha (de baixo para cima)
        data.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'stack-element';
            element.id = `stack-element-${index}`;
            element.textContent = value;
            
            // Inserir antes da base
            const base = stackContainer.querySelector('.stack-base');
            stackContainer.insertBefore(element, base);
        });
        
        // Atualizar posição do ponteiro de topo
        updateStackPointer();
    }
    
    function highlightStackElement(index, className) {
        const element = document.getElementById(`stack-element-${index}`);
        if (element) {
            // Remover todas as classes de destaque
            document.querySelectorAll('.stack-element').forEach(el => {
                el.classList.remove('top', 'pushing', 'popping', 'highlight');
            });
            
            // Adicionar classe específica
            if (className !== 'normal') {
                element.classList.add(className);
            }
            
            // Atualizar interface
            currentIndex.textContent = index;
            currentValue.textContent = stack[index] || '-';
        }
    }
    
    function updateStackPointer() {
        if (stack.length === 0) {
            stackPointer.style.display = 'none';
        } else {
            stackPointer.style.display = 'flex';
            // Posicionar ponteiro ao lado do topo
            const topElement = document.getElementById(`stack-element-${stack.length - 1}`);
            if (topElement) {
                const topRect = topElement.getBoundingClientRect();
                const containerRect = stackContainer.getBoundingClientRect();
                const offset = topRect.top - containerRect.top + (topRect.height / 2);
                stackPointer.style.top = `${offset - 15}px`;
            }
        }
    }
    
    function updateStatus() {
        if (currentStructure === 'list') {
            currentSize.textContent = list.length;
            currentCapacity.textContent = listCapacity;
            elementCount.textContent = list.length;
        } else {
            currentSize.textContent = stack.length;
            currentCapacity.textContent = stackCapacity;
            elementCount.textContent = stack.length;
        }
        
        operationCount.textContent = operationCounter;
        accessCount.textContent = accessCounter;
    }
    
    function sleep(ms) {
        return new Promise(resolve => {
            animationTimeout = setTimeout(resolve, ms);
        });
    }
    
    // Inicializar valores
    updateSpeed();
    updateListSize();
    updateStackSize();
});