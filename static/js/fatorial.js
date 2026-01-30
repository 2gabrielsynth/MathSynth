document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const numberInput = document.getElementById('numberInput');
    const methodSelect = document.getElementById('methodSelect');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const generateBtn = document.getElementById('generateBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Elementos de visualização
    const functionDisplay = document.getElementById('functionDisplay');
    const currentCalculation = document.getElementById('currentCalculation');
    const functionEquation = document.getElementById('functionEquation');
    const functionResult = document.getElementById('functionResult');
    const recursionStack = document.getElementById('recursionStack');
    const treeContainer = document.getElementById('treeContainer');
    
    // Elementos de status
    const currentN = document.getElementById('currentN');
    const currentStep = document.getElementById('currentStep');
    const partialResult = document.getElementById('partialResult');
    const recursionLevel = document.getElementById('recursionLevel');
    const multiplicationCount = document.getElementById('multiplicationCount');
    const recursiveCalls = document.getElementById('recursiveCalls');
    const estimatedTime = document.getElementById('estimatedTime');
    const statusText = document.getElementById('statusText');
    const operationDetails = document.getElementById('operationDetails');
    const examplesGrid = document.getElementById('examplesGrid');
    
    // Variáveis de estado
    let n = 5;
    let method = 'recursive';
    let isRunning = false;
    let isPaused = false;
    let animationSpeed = 1000;
    let animationTimeout;
    let stack = [];
    let treeNodes = [];
    let treeConnections = [];
    let multiplicationCounter = 0;
    let recursionCounter = 0;
    let startTime = 0;
    
    // Inicialização
    init();
    
    function init() {
        updateExamples();
        setupEventListeners();
        resetCalculation();
    }
    
    function setupEventListeners() {
        numberInput.addEventListener('change', updateNumber);
        methodSelect.addEventListener('change', updateMethod);
        speedInput.addEventListener('input', updateSpeed);
        generateBtn.addEventListener('click', generateRandomNumber);
        startBtn.addEventListener('click', startCalculation);
        pauseBtn.addEventListener('click', togglePause);
        resetBtn.addEventListener('click', resetCalculation);
    }
    
    function updateNumber() {
        n = Math.min(20, Math.max(0, parseInt(numberInput.value) || 5));
        
        // Limitar para evitar travamento
        if (n > 15) {
            operationDetails.innerHTML = `
                <p><strong>Atenção:</strong> Números acima de 15 criam árvores muito grandes.</p>
                <p>Recomendamos usar valores menores para melhor visualização.</p>
            `;
        }
        
        numberInput.value = n;
        resetCalculation();
    }
    
    function updateMethod() {
        method = methodSelect.value;
        resetCalculation();
    }
    
    function updateSpeed() {
        const value = parseInt(speedInput.value);
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function generateRandomNumber() {
        n = Math.floor(Math.random() * 10) + 1; // 1 a 10
        numberInput.value = n;
        resetCalculation();
    }
    
    function resetCalculation() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        
        // Resetar contadores
        multiplicationCounter = 0;
        recursionCounter = 0;
        
        // Resetar árvore
        treeNodes = [];
        treeConnections = [];
        
        // Atualizar display
        currentCalculation.textContent = `${n}! = ?`;
        functionEquation.textContent = '';
        functionResult.textContent = '';
        
        // Limpar stacks
        recursionStack.innerHTML = '';
        treeContainer.innerHTML = '';
        
        // Atualizar status
        updateStatus();
        operationDetails.innerHTML = '<p>Pronto para calcular. Clique em "Calcular" para iniciar.</p>';
        statusText.textContent = 'Pronto';
        
        // Habilitar/desabilitar botões
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        generateBtn.disabled = false;
    }
    
    function startCalculation() {
        if (isRunning) return;
        
        isRunning = true;
        isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        generateBtn.disabled = true;
        statusText.textContent = 'Calculando';
        
        startTime = Date.now();
        
        if (method === 'recursive' || method === 'both') {
            visualizeRecursiveFactorial(n);
        } else {
            visualizeIterativeFactorial(n);
        }
    }
    
    function togglePause() {
        if (!isRunning) return;
        
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        statusText.textContent = isPaused ? 'Pausado' : 'Calculando';
        
        if (!isPaused) {
            if (method === 'recursive' || method === 'both') {
                continueRecursiveCalculation();
            } else {
                continueIterativeCalculation();
            }
        }
    }
    
    async function visualizeRecursiveFactorial(num, level = 0, parentId = null) {
        if (isPaused) return;
        
        // Atualizar interface
        currentN.textContent = num;
        recursionLevel.textContent = level;
        currentStep.textContent = `Chamada ${recursionCounter + 1}`;
        
        // Verificar se é caso base
        const isBaseCase = num <= 1;
        
        // Criar nó da árvore
        const nodeId = `node-${num}-${level}-${Date.now()}`;
        const node = createTreeNode(num, level, nodeId, parentId, isBaseCase);
        
        if (!isBaseCase) {
            node.classList.add('solving');
        }
        
        // Adicionar ao stack de recursão
        addToRecursionStack(num, level, isBaseCase ? 'base-case' : 'chamada');
        
        // Atualizar detalhes da operação
        if (isBaseCase) {
            operationDetails.innerHTML = `<p><strong>Caso Base</strong>: ${num}! = 1</p>`;
            await sleep(animationSpeed);
            if (isPaused) return;
            
            recursionCounter++;
            updateStatus();
            return 1;
        } else {
            operationDetails.innerHTML = `<p><strong>Chamada Recursiva</strong>: Calculando ${num}! = ${num} × (${num-1})!</p>`;
        }
        
        await sleep(animationSpeed);
        if (isPaused) return;
        
        // Chamada recursiva
        recursionCounter++;
        updateStatus();
        
        // Chamar recursivamente
        const subResult = await visualizeRecursiveFactorial(num - 1, level + 1, nodeId);
        if (isPaused) return;
        
        // Calcular resultado
        multiplicationCounter++;
        const result = num * subResult;
        
        // Atualizar interface com cálculo
        operationDetails.innerHTML = `<p><strong>Retornando</strong>: ${num}! = ${num} × ${subResult} = ${result}</p>`;
        partialResult.textContent = result;
        
        // Atualizar nó da árvore
        updateTreeNode(nodeId, result);
        
        // Atualizar status
        updateStatus();
        
        await sleep(animationSpeed);
        if (isPaused) return;
        
        return result;
    }
    
    async function visualizeIterativeFactorial(num) {
        let result = 1;
        
        operationDetails.innerHTML = `<p><strong>Método Iterativo</strong>: Calculando ${num}! multiplicando de 1 até ${num}</p>`;
        
        for (let i = 1; i <= num; i++) {
            if (isPaused) return;
            
            currentN.textContent = i;
            currentStep.textContent = `Iteração ${i}`;
            
            // Mostrar cálculo atual
            const oldResult = result;
            result *= i;
            multiplicationCounter++;
            
            // Atualizar display
            if (i === 1) {
                currentCalculation.textContent = `${num}! = 1`;
            } else {
                currentCalculation.textContent = `${num}! = 1 × ${Array.from({length: i-1}, (_, idx) => idx + 2).join(' × ')}`;
            }
            
            functionEquation.textContent = `= ${result}`;
            partialResult.textContent = result;
            
            // Atualizar detalhes
            operationDetails.innerHTML = `<p><strong>Multiplicação ${i}</strong>: ${oldResult} × ${i} = ${result}</p>`;
            
            // Atualizar status
            updateStatus();
            
            // Criar nó de progresso
            createProgressNode(i, num, result);
            
            await sleep(animationSpeed / 2);
            if (isPaused) return;
        }
        
        // Resultado final
        functionResult.textContent = result;
        operationDetails.innerHTML = `<p><strong>Cálculo Completo</strong>: ${num}! = ${result}</p>`;
        statusText.textContent = 'Concluído';
        
        updateFinalResult(result);
    }
    
    function continueRecursiveCalculation() {
        // Esta função seria usada para continuar de onde parou
        // Implementação simplificada para recomeçar do início
        resetCalculation();
        startCalculation();
    }
    
    function continueIterativeCalculation() {
        // Similar à recursiva, recomeça do início
        resetCalculation();
        startCalculation();
    }
    
    function initializeTreeContainer() {
        treeContainer.innerHTML = '';
        
        // Criar wrapper vertical
        const treeVertical = document.createElement('div');
        treeVertical.id = 'treeVertical';
        treeVertical.className = 'tree-vertical';
        treeContainer.appendChild(treeVertical);
        
        // Criar controles
        const treeControls = document.createElement('div');
        treeControls.className = 'tree-controls';
        treeControls.innerHTML = `
            <button class="tree-control-btn" id="compactViewBtn" title="Modo Compacto">
                <i class="fas fa-compress"></i>
            </button>
            <button class="tree-control-btn" id="scrollToBottomBtn" title="Ir para o Fundo">
                <i class="fas fa-arrow-down"></i>
            </button>
            <button class="tree-control-btn" id="scrollToTopBtn" title="Ir para o Topo">
                <i class="fas fa-arrow-up"></i>
            </button>
        `;
        treeContainer.appendChild(treeControls);
        
        // Criar indicador de progresso
        const treeProgress = document.createElement('div');
        treeProgress.className = 'tree-progress';
        treeProgress.id = 'treeProgress';
        treeProgress.textContent = 'Níveis: 0';
        treeContainer.appendChild(treeProgress);
        
        // Event listeners
        document.getElementById('compactViewBtn').addEventListener('click', () => {
            treeVertical.classList.toggle('compact');
        });
        
        document.getElementById('scrollToBottomBtn').addEventListener('click', () => {
            treeContainer.scrollTop = treeContainer.scrollHeight;
        });
        
        document.getElementById('scrollToTopBtn').addEventListener('click', () => {
            treeContainer.scrollTop = 0;
        });
        
        return treeVertical;
    }
    
    function createTreeNode(num, level, nodeId, parentId, isBaseCase = false) {
        let treeVertical = document.getElementById('treeVertical');
        if (!treeVertical) {
            treeVertical = initializeTreeContainer();
        }
        
        // Criar wrapper para o nó
        const nodeWrapper = document.createElement('div');
        nodeWrapper.className = 'tree-node-wrapper';
        nodeWrapper.id = `wrapper-${nodeId}`;
        nodeWrapper.dataset.level = level;
        nodeWrapper.dataset.nodeId = nodeId;
        
        // Adicionar indicador de nível
        const levelIndicator = document.createElement('div');
        levelIndicator.className = 'node-level';
        levelIndicator.textContent = `Nível ${level}`;
        nodeWrapper.appendChild(levelIndicator);
        
        // Criar nó
        const node = document.createElement('div');
        node.id = nodeId;
        node.className = `tree-node level-${level % 11}`;
        if (isBaseCase) node.classList.add('base-case');
        
        // Conteúdo do nó
        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';
        nodeContent.innerHTML = `
            <div class="node-main-value">${num}!</div>
            ${isBaseCase ? '<div class="node-result">= 1</div>' : '<div class="node-result">?</div>'}
        `;
        
        node.appendChild(nodeContent);
        nodeWrapper.appendChild(node);
        
        // Se for caso base, mostrar imediatamente
        if (isBaseCase) {
            node.classList.add('solved');
            node.title = `${num}! = 1 (caso base)`;
        } else {
            node.title = `Calculando ${num}!\nNível: ${level}\nClique para detalhes`;
        }
        
        // Adicionar linha de multiplicação se não for caso base e não for o último nível
        if (!isBaseCase && level > 0) {
            const multLine = document.createElement('div');
            multLine.className = 'multiplication-line';
            multLine.textContent = `${num} × factorial(${num - 1})`;
            multLine.id = `mult-${nodeId}`;
            nodeWrapper.appendChild(multLine);
        }
        
        // Adicionar ao container
        treeVertical.appendChild(nodeWrapper);
        
        // Criar conexão vertical com o pai
        if (parentId) {
            setTimeout(() => createVerticalConnection(parentId, nodeId), 100);
        }
        
        // Salvar referência
        treeNodes.push({
            id: nodeId,
            num,
            level,
            result: isBaseCase ? 1 : null,
            element: node,
            wrapper: nodeWrapper,
            isBaseCase
        });
        
        // Atualizar progresso
        updateTreeProgress();
        
        // Scroll automático para o novo nó
        setTimeout(() => {
            nodeWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        
        return node;
    }
    
    function createVerticalConnection(parentId, childId) {
        const parentData = treeNodes.find(n => n.id === parentId);
        const childData = treeNodes.find(n => n.id === childId);
        
        if (!parentData || !childData || !parentData.wrapper || !childData.wrapper) return;
        
        // Encontrar os wrappers
        const parentWrapper = parentData.wrapper;
        const childWrapper = childData.wrapper;
        
        // Criar linha de conexão
        const connection = document.createElement('div');
        connection.className = 'node-connection-vertical';
        
        // Posicionar entre os wrappers
        const parentRect = parentWrapper.getBoundingClientRect();
        const childRect = childWrapper.getBoundingClientRect();
        const treeVertical = document.getElementById('treeVertical');
        const treeRect = treeVertical.getBoundingClientRect();
        
        // Calcular posição
        const top = parentRect.bottom - treeRect.top;
        const height = childRect.top - parentRect.bottom;
        
        connection.style.top = `${top}px`;
        connection.style.height = `${height}px`;
        
        // Inserir antes do childWrapper
        treeVertical.insertBefore(connection, childWrapper);
        treeConnections.push(connection);
    }
    
    function updateTreeNode(nodeId, result) {
        const nodeData = treeNodes.find(n => n.id === nodeId);
        if (nodeData && nodeData.element) {
            nodeData.result = result;
            
            const nodeContent = nodeData.element.querySelector('.node-content');
            if (nodeContent) {
                nodeContent.innerHTML = `
                    <div class="node-main-value">${nodeData.num}!</div>
                    <div class="node-result">= ${formatLargeNumber(result)}</div>
                `;
            }
            
            // Atualizar linha de multiplicação se existir
            const multLine = document.getElementById(`mult-${nodeId}`);
            if (multLine && nodeData.num > 1) {
                multLine.textContent = `${nodeData.num} × ${formatLargeNumber(result / nodeData.num)} = ${formatLargeNumber(result)}`;
                multLine.style.color = '#4caf50';
                multLine.style.fontWeight = 'bold';
            }
            
            nodeData.element.classList.remove('solving');
            nodeData.element.classList.add('solved');
            nodeData.element.title = `${nodeData.num}! = ${formatLargeNumber(result)}\nNível: ${nodeData.level}\nResolvido!`;
            
            // Destaque visual
            nodeData.element.style.animation = 'pulse 0.5s 2';
        }
    }
    
    function formatLargeNumber(num) {
        if (num >= 1e6) {
            return num.toExponential(2);
        }
        return num.toLocaleString();
    }
    
    function updateTreeProgress() {
        const treeProgress = document.getElementById('treeProgress');
        if (treeProgress) {
            const levels = new Set(treeNodes.map(n => n.level));
            treeProgress.textContent = `Níveis: ${levels.size} | Nós: ${treeNodes.length}`;
        }
    }
    
    function createProgressNode(step, total, result) {
        // Para o método iterativo, criar uma visualização simples
        const treeVertical = document.getElementById('treeVertical');
        if (!treeVertical) return;
        
        const progressNode = document.createElement('div');
        progressNode.className = 'tree-node-wrapper';
        
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
        
        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';
        nodeContent.innerHTML = `
            <div class="node-main-value">${step}!</div>
            <div class="node-result">= ${result}</div>
        `;
        
        node.appendChild(nodeContent);
        progressNode.appendChild(node);
        
        const progressText = document.createElement('div');
        progressText.className = 'multiplication-line';
        progressText.textContent = `Passo ${step}/${total}`;
        progressNode.appendChild(progressText);
        
        treeVertical.appendChild(progressNode);
    }
    
    function addToRecursionStack(num, level, type) {
        const stackItem = document.createElement('div');
        stackItem.className = `stack-level ${type}`;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'stack-level-number';
        numberDiv.textContent = level + 1;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'stack-level-content';
        
        if (type === 'chamada') {
            contentDiv.textContent = `factorial(${num})`;
            if (num <= 1) {
                contentDiv.innerHTML += ` <span class="stack-level-result">(caso base → 1)</span>`;
            } else {
                contentDiv.innerHTML += ` <span class="stack-level-result">→ ${num} × factorial(${num-1})</span>`;
            }
        } else if (type === 'base-case') {
            contentDiv.textContent = `factorial(${num})`;
            contentDiv.innerHTML += ` <span class="stack-level-result">= 1 (caso base)</span>`;
        }
        
        stackItem.appendChild(numberDiv);
        stackItem.appendChild(contentDiv);
        recursionStack.appendChild(stackItem);
        
        // CORREÇÃO: Scroll apenas dentro do container
        recursionStack.scrollTop = recursionStack.scrollHeight;
        
        // Remover classe active de outros itens
        document.querySelectorAll('.stack-level').forEach(item => {
            item.classList.remove('active');
        });
        
        // Adicionar classe active ao item atual
        stackItem.classList.add('active');
        
        stack.push(stackItem);
    }
    
    function updateStackResult(num, result) {
        const lastItem = stack[stack.length - 1];
        if (lastItem) {
            const contentDiv = lastItem.querySelector('.stack-level-content');
            if (contentDiv) {
                contentDiv.innerHTML = `factorial(${num}) <span class="stack-level-result">= ${formatLargeNumber(result)}</span>`;
            }
            lastItem.classList.remove('active');
            lastItem.classList.add('solved');
        }
    }
    
    function updateStatus() {
        multiplicationCount.textContent = multiplicationCounter;
        recursiveCalls.textContent = recursionCounter;
        
        // Calcular tempo estimado
        const elapsed = Date.now() - startTime;
        estimatedTime.textContent = `${elapsed}ms`;
        
        // Atualizar display do cálculo atual
        if (!isRunning) return;
        
        if (method === 'iterative') {
            currentCalculation.textContent = `${n}! = ${getFactorialString(n)}`;
        }
    }
    
    function updateFinalResult(result) {
        functionResult.textContent = result;
        currentCalculation.textContent = `${n}! = ${result}`;
        functionEquation.textContent = getFactorialString(n);
        
        // Destacar resultado
        functionResult.style.animation = 'pulse 1s 3';
        
        // Atualizar botões
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        generateBtn.disabled = false;
    }
    
    function getFactorialString(num) {
        if (num <= 1) return '1';
        return Array.from({length: num}, (_, i) => i + 1).join(' × ');
    }
    
    function updateExamples() {
        const examples = [
            { n: 0, result: 1 },
            { n: 1, result: 1 },
            { n: 2, result: 2 },
            { n: 3, result: 6 },
            { n: 4, result: 24 },
            { n: 5, result: 120 },
            { n: 6, result: 720 },
            { n: 7, result: 5040 }
        ];
        
        examplesGrid.innerHTML = '';
        examples.forEach(example => {
            const exampleItem = document.createElement('div');
            exampleItem.className = 'example-item';
            
            const formula = document.createElement('div');
            formula.className = 'example-formula';
            formula.textContent = `${example.n}!`;
            
            const result = document.createElement('div');
            result.className = 'example-result';
            result.textContent = example.result.toLocaleString();
            
            exampleItem.appendChild(formula);
            exampleItem.appendChild(result);
            examplesGrid.appendChild(exampleItem);
        });
    }
    
    function sleep(ms) {
        return new Promise(resolve => {
            if (isPaused) {
                const checkInterval = setInterval(() => {
                    if (!isPaused && isRunning) {
                        clearInterval(checkInterval);
                        animationTimeout = setTimeout(resolve, ms);
                    }
                }, 100);
            } else {
                animationTimeout = setTimeout(resolve, ms);
            }
        });
    }
    
    // Adicionar evento para prevenir scroll da página
    document.addEventListener('wheel', function(e) {
        if (e.target.closest('.recursion-stack, .tree-container, .function-container')) {
            e.stopPropagation();
        }
    }, { passive: false });
    
    // Inicializar valores
    updateSpeed();
});