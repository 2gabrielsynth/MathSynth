document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const fibNumberInput = document.getElementById('fibNumber');
    const methodSelect = document.getElementById('methodSelect');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const generateBtn = document.getElementById('generateBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Elementos de visualização
    const sequenceContainer = document.getElementById('sequenceContainer');
    const spiralContainer = document.getElementById('spiralContainer');
    const treeContainer = document.getElementById('treeContainer');
    const treeVertical = document.getElementById('treeVertical');
    
    // Elementos de status
    const currentN = document.getElementById('currentN');
    const currentFib = document.getElementById('currentFib');
    const prevFib1 = document.getElementById('prevFib1');
    const prevFib2 = document.getElementById('prevFib2');
    const callCount = document.getElementById('callCount');
    const calculationCount = document.getElementById('calculationCount');
    const executionTime = document.getElementById('executionTime');
    const statusText = document.getElementById('statusText');
    const operationDetails = document.getElementById('operationDetails');
    const examplesTable = document.getElementById('examplesTable');
    
    // Variáveis de estado
    let n = 6;
    let method = 'recursive';
    let isRunning = false;
    let isPaused = false;
    let animationSpeed = 1000;
    let animationTimeout;
    let callCounter = 0;
    let calculationCounter = 0;
    let startTime = 0;
    let memo = {};
    let treeNodes = [];
    let treeConnections = [];
    let sequence = [];
    let duplicateCalculations = new Set();
    
    // Inicialização
    init();
    
    function init() {
        updateExamples();
        setupEventListeners();
        resetCalculation();
    }
    
    function setupEventListeners() {
        fibNumberInput.addEventListener('change', updateNumber);
        methodSelect.addEventListener('change', updateMethod);
        speedInput.addEventListener('input', updateSpeed);
        generateBtn.addEventListener('click', generateRandomNumber);
        startBtn.addEventListener('click', startCalculation);
        pauseBtn.addEventListener('click', togglePause);
        resetBtn.addEventListener('click', resetCalculation);
    }
    
    function updateNumber() {
        n = Math.min(15, Math.max(0, parseInt(fibNumberInput.value) || 6));
        fibNumberInput.value = n;
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
        n = Math.floor(Math.random() * 11) + 3; // 3 a 13
        fibNumberInput.value = n;
        resetCalculation();
    }
    
    function resetCalculation() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        
        // Resetar contadores
        callCounter = 0;
        calculationCounter = 0;
        
        // Resetar estruturas
        memo = {};
        treeNodes = [];
        treeConnections = [];
        sequence = [];
        duplicateCalculations.clear();
        
        // Limpar visualizações
        sequenceContainer.innerHTML = '';
        spiralContainer.innerHTML = '';
        treeVertical.innerHTML = '';
        
        // Adicionar mensagem inicial à espiral
        const spiralMessage = document.createElement('div');
        spiralMessage.className = 'spiral-message';
        spiralMessage.innerHTML = `
            <i class="fas fa-spinner"></i>
            <p>Espiral áurea aparecerá durante o cálculo</p>
        `;
        spiralContainer.appendChild(spiralMessage);
        
        // Atualizar status
        updateStatus();
        operationDetails.innerHTML = '<p>Pronto para calcular. Insira n e clique em "Calcular Fibonacci".</p>';
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
            visualizeRecursiveFibonacci(n);
        } else {
            visualizeIterativeFibonacci(n);
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
    
    async function visualizeRecursiveFibonacci(num, level = 0, parentId = null, position = null) {
        if (isPaused) return;
        
        callCounter++;
        updateStatus();
        
        // Atualizar interface
        currentN.textContent = num;
        operationDetails.innerHTML = `<p><strong>Calculando F(${num})</strong>: F(${num}) = F(${num-1}) + F(${num-2})</p>`;
        
        // Verificar se é caso base
        const isBaseCase = num <= 1;
        
        // Criar nó da árvore
        const nodeId = `node-${num}-${level}-${Date.now()}`;
        const node = createTreeNode(num, level, nodeId, parentId, position, isBaseCase);
        
        if (!isBaseCase) {
            node.classList.add('calculating');
        }
        
        // Verificar memoização
        const memoKey = `${num}-${level}`;
        if (memo[memoKey] && !isBaseCase) {
            duplicateCalculations.add(memoKey);
            node.classList.add('duplicate');
            operationDetails.innerHTML = `<p><strong>Cálculo já feito!</strong> F(${num}) = ${memo[memoKey]} (recuperado da memoização)</p>`;
            
            updateTreeNode(nodeId, memo[memoKey]);
            await sleep(animationSpeed / 2);
            
            return memo[memoKey];
        }
        
        // Casos base
        if (num === 0) {
            calculationCounter++;
            updateTreeNode(nodeId, 0);
            memo[memoKey] = 0;
            await sleep(animationSpeed);
            return 0;
        }
        
        if (num === 1) {
            calculationCounter++;
            updateTreeNode(nodeId, 1);
            memo[memoKey] = 1;
            await sleep(animationSpeed);
            return 1;
        }
        
        await sleep(animationSpeed);
        if (isPaused) return;
        
        // Chamadas recursivas
        operationDetails.innerHTML = `<p><strong>Chamando recursivamente:</strong> F(${num}) = F(${num-1}) + F(${num-2})</p>`;
        
        // Calcular F(n-1)
        const leftChildId = `node-${num-1}-${level+1}-${Date.now()}`;
        const fib1 = await visualizeRecursiveFibonacci(num - 1, level + 1, nodeId, 'left');
        if (isPaused) return;
        
        // Calcular F(n-2)
        const rightChildId = `node-${num-2}-${level+1}-${Date.now()}`;
        const fib2 = await visualizeRecursiveFibonacci(num - 2, level + 2, nodeId, 'right');
        if (isPaused) return;
        
        // Calcular resultado
        calculationCounter++;
        const result = fib1 + fib2;
        
        // Atualizar interface
        prevFib1.textContent = fib1;
        prevFib2.textContent = fib2;
        currentFib.textContent = result;
        operationDetails.innerHTML = `<p><strong>Resultado:</strong> F(${num}) = ${fib1} + ${fib2} = ${result}</p>`;
        
        // Atualizar nó da árvore
        updateTreeNode(nodeId, result, fib1, fib2);
        
        // Memoizar resultado
        memo[memoKey] = result;
        
        // Atualizar sequência
        updateSequence(num, result);
        
        // Atualizar status
        updateStatus();
        
        await sleep(animationSpeed);
        if (isPaused) return;
        
        return result;
    }
    
    async function visualizeIterativeFibonacci(num) {
        if (num === 0) {
            operationDetails.innerHTML = `<p><strong>F(0) = 0</strong> (caso base)</p>`;
            updateSequence(0, 0);
            await sleep(animationSpeed);
            finishCalculation(0);
            return;
        }
        
        if (num === 1) {
            operationDetails.innerHTML = `<p><strong>F(1) = 1</strong> (caso base)</p>`;
            updateSequence(0, 0);
            updateSequence(1, 1);
            await sleep(animationSpeed);
            finishCalculation(1);
            return;
        }
        
        // Inicializar os primeiros valores
        let a = 0; // F(n-2)
        let b = 1; // F(n-1)
        
        updateSequence(0, 0);
        await sleep(animationSpeed / 2);
        
        updateSequence(1, 1);
        await sleep(animationSpeed / 2);
        
        operationDetails.innerHTML = `<p><strong>Método Iterativo:</strong> Calculando F(${num}) usando iteração</p>`;
        
        // Calcular iterativamente
        for (let i = 2; i <= num; i++) {
            if (isPaused) return;
            
            calculationCounter++;
            callCounter++;
            
            const current = a + b;
            
            // Atualizar interface
            currentN.textContent = i;
            prevFib1.textContent = b;
            prevFib2.textContent = a;
            currentFib.textContent = current;
            
            operationDetails.innerHTML = `<p><strong>Iteração ${i}:</strong> F(${i}) = F(${i-1}) + F(${i-2}) = ${b} + ${a} = ${current}</p>`;
            
            // Atualizar sequência
            updateSequence(i, current);
            
            // Atualizar status
            updateStatus();
            
            // Preparar para próxima iteração
            a = b;
            b = current;
            
            await sleep(animationSpeed);
            if (isPaused) return;
        }
        
        finishCalculation(b);
    }
    
    function continueRecursiveCalculation() {
        // Implementação simplificada - recomeçar do início
        resetCalculation();
        startCalculation();
    }
    
    function continueIterativeCalculation() {
        // Implementação simplificada - recomeçar do início
        resetCalculation();
        startCalculation();
    }
    
    function createTreeNode(num, level, nodeId, parentId, position, isBaseCase = false) {
        // Limpar mensagem inicial se existir
        const initialMessage = treeVertical.querySelector('.initial-message');
        if (initialMessage) {
            initialMessage.remove();
        }
        
        // Garantir que o nível existe
        let levelContainer = treeVertical.querySelector(`.tree-level[data-level="${level}"]`);
        if (!levelContainer) {
            levelContainer = document.createElement('div');
            levelContainer.className = 'tree-level';
            levelContainer.dataset.level = level;
            treeVertical.appendChild(levelContainer);
        }
        
        // Criar nó
        const node = document.createElement('div');
        node.id = nodeId;
        node.className = `tree-node level-${level % 9}`;
        if (isBaseCase) node.classList.add('base-case');
        
        // Posicionar baseado na posição (left/right)
        if (position === 'left') {
            node.style.marginRight = 'auto';
            node.style.marginLeft = '20px';
        } else if (position === 'right') {
            node.style.marginLeft = 'auto';
            node.style.marginRight = '20px';
        }
        
        // Conteúdo do nó
        const nodeContent = document.createElement('div');
        nodeContent.className = 'node-content';
        nodeContent.innerHTML = `
            <div class="node-value">F(${num})</div>
            <div class="node-formula">?</div>
        `;
        
        node.appendChild(nodeContent);
        levelContainer.appendChild(node);
        
        // Salvar referência
        treeNodes.push({
            id: nodeId,
            num,
            level,
            result: null,
            element: node,
            parentId,
            position
        });
        
        // Criar conexão com pai se existir
        if (parentId) {
            setTimeout(() => createTreeConnection(parentId, nodeId, position), 100);
        }
        
        return node;
    }
    
    function createTreeConnection(parentId, childId, position) {
        const parentData = treeNodes.find(n => n.id === parentId);
        const childData = treeNodes.find(n => n.id === childId);
        
        if (!parentData || !childData || !parentData.element || !childData.element) return;
        
        const parentRect = parentData.element.getBoundingClientRect();
        const childRect = childData.element.getBoundingClientRect();
        const treeRect = treeVertical.getBoundingClientRect();
        
        // Calcular posições relativas
        const x1 = parentRect.left + parentRect.width / 2 - treeRect.left;
        const y1 = parentRect.bottom - treeRect.top;
        const x2 = childRect.left + childRect.width / 2 - treeRect.left;
        const y2 = childRect.top - treeRect.top;
        
        // Criar linha de conexão
        const connection = document.createElement('div');
        connection.className = 'tree-connection';
        
        // Calcular ângulo e comprimento
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Estilizar a linha
        connection.style.position = 'absolute';
        connection.style.left = `${x1}px`;
        connection.style.top = `${y1}px`;
        connection.style.width = `${length}px`;
        connection.style.height = '2px';
        connection.style.backgroundColor = `rgba(255, 255, 255, ${0.7 - (parentData.level * 0.1)})`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = '0 0';
        connection.style.zIndex = '1';
        
        treeVertical.appendChild(connection);
        treeConnections.push(connection);
    }
    
    function updateTreeNode(nodeId, result, fib1 = null, fib2 = null) {
        const nodeData = treeNodes.find(n => n.id === nodeId);
        if (nodeData && nodeData.element) {
            nodeData.result = result;
            
            const nodeContent = nodeData.element.querySelector('.node-content');
            if (nodeContent) {
                let formula = '?';
                if (fib1 !== null && fib2 !== null) {
                    formula = `${fib1} + ${fib2}`;
                } else if (nodeData.num <= 1) {
                    formula = 'caso base';
                }
                
                nodeContent.innerHTML = `
                    <div class="node-value">F(${nodeData.num})</div>
                    <div class="node-formula">${formula}</div>
                    <div style="color: #ffd700; font-weight: bold; margin-top: 2px;">${result}</div>
                `;
            }
            
            nodeData.element.classList.remove('calculating');
            nodeData.element.classList.add('result');
            
            // Destacar visualmente
            nodeData.element.style.animation = 'pulse 0.5s 2';
        }
    }
    
    function updateSequence(index, value) {
        // Remover números existentes com este índice
        const existing = document.querySelector(`.fibonacci-number[data-index="${index}"]`);
        if (existing) {
            existing.remove();
        }
        
        // Criar novo número
        const fibNumber = document.createElement('div');
        fibNumber.className = 'fibonacci-number';
        fibNumber.dataset.index = index;
        
        const indexSpan = document.createElement('span');
        indexSpan.className = 'index';
        indexSpan.textContent = `F(${index})`;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = value;
        
        fibNumber.appendChild(indexSpan);
        fibNumber.appendChild(valueSpan);
        
        // Adicionar fórmula se não for caso base
        if (index >= 2) {
            const formulaSpan = document.createElement('span');
            formulaSpan.className = 'formula';
            
            // Encontrar valores anteriores
            const prev1 = sequence[index - 1];
            const prev2 = sequence[index - 2];
            if (prev1 !== undefined && prev2 !== undefined) {
                formulaSpan.textContent = `${prev1} + ${prev2}`;
            }
            
            fibNumber.appendChild(formulaSpan);
        }
        
        // Destacar se estiver sendo calculado
        if (index === parseInt(currentN.textContent)) {
            fibNumber.classList.add('calculating');
        }
        
        // Casos base
        if (index <= 1) {
            fibNumber.classList.add('base-case');
        }
        
        sequenceContainer.appendChild(fibNumber);
        
        // Atualizar array da sequência
        sequence[index] = value;
        
        // Atualizar espiral áurea
        updateGoldenSpiral();
    }
    
    function updateGoldenSpiral() {
        // Limpar espiral anterior
        spiralContainer.innerHTML = '';
        
        if (sequence.length < 2) return;
        
        // Configurações da espiral
        const centerX = spiralContainer.clientWidth / 2;
        const centerY = spiralContainer.clientHeight / 2;
        const scale = 15; // Fator de escala para os quadrados
        
        let x = centerX;
        let y = centerY;
        let direction = 0; // 0: direita, 1: baixo, 2: esquerda, 3: cima
        let size = 0;
        
        // Criar quadrados e arcos
        for (let i = 1; i < Math.min(sequence.length, 8); i++) {
            const fibValue = sequence[i];
            if (fibValue === undefined) continue;
            
            size = fibValue * scale;
            
            // Criar quadrado
            const square = document.createElement('div');
            square.className = 'spiral-square';
            square.style.width = `${size}px`;
            square.style.height = `${size}px`;
            square.style.left = `${x}px`;
            square.style.top = `${y}px`;
            
            // Adicionar label
            const label = document.createElement('div');
            label.className = 'spiral-label';
            label.textContent = fibValue;
            
            // Posicionar label no centro do quadrado
            const labelX = x + size / 2;
            const labelY = y + size / 2;
            label.style.left = `${labelX}px`;
            label.style.top = `${labelY}px`;
            
            // Criar arco (quarto de círculo)
            const arc = document.createElement('div');
            arc.className = 'spiral-arc';
            
            // Ajustar posição e tamanho do arco baseado na direção
            let arcX, arcY, arcWidth, arcHeight;
            
            switch (direction % 4) {
                case 0: // direita
                    arcX = x + size - fibValue * scale;
                    arcY = y;
                    arcWidth = fibValue * scale * 2;
                    arcHeight = fibValue * scale * 2;
                    arc.style.borderRightColor = 'transparent';
                    arc.style.borderBottomColor = 'transparent';
                    x += size;
                    break;
                case 1: // baixo
                    arcX = x - fibValue * scale;
                    arcY = y;
                    arcWidth = fibValue * scale * 2;
                    arcHeight = fibValue * scale * 2;
                    arc.style.borderBottomColor = 'transparent';
                    arc.style.borderLeftColor = 'transparent';
                    y += size;
                    break;
                case 2: // esquerda
                    arcX = x - size;
                    arcY = y - fibValue * scale;
                    arcWidth = fibValue * scale * 2;
                    arcHeight = fibValue * scale * 2;
                    arc.style.borderTopColor = 'transparent';
                    arc.style.borderLeftColor = 'transparent';
                    x -= fibValue * scale;
                    break;
                case 3: // cima
                    arcX = x;
                    arcY = y - size;
                    arcWidth = fibValue * scale * 2;
                    arcHeight = fibValue * scale * 2;
                    arc.style.borderTopColor = 'transparent';
                    arc.style.borderRightColor = 'transparent';
                    y -= fibValue * scale;
                    break;
            }
            
            arc.style.left = `${arcX}px`;
            arc.style.top = `${arcY}px`;
            arc.style.width = `${arcWidth}px`;
            arc.style.height = `${arcHeight}px`;
            
            spiralContainer.appendChild(square);
            spiralContainer.appendChild(arc);
            spiralContainer.appendChild(label);
            
            direction++;
        }
    }
    
    function finishCalculation(result) {
        statusText.textContent = 'Concluído';
        operationDetails.innerHTML = `<p><strong>✅ Cálculo Completo!</strong> F(${n}) = ${result}</p>`;
        
        // Destacar resultado final na sequência
        const finalNumber = document.querySelector(`.fibonacci-number[data-index="${n}"]`);
        if (finalNumber) {
            finalNumber.classList.remove('calculating');
            finalNumber.classList.add('result');
            finalNumber.style.animation = 'pulse 1s 3';
        }
        
        // Atualizar botões
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        generateBtn.disabled = false;
    }
    
    function updateStatus() {
        callCount.textContent = callCounter;
        calculationCount.textContent = calculationCounter;
        
        // Calcular tempo de execução
        const elapsed = Date.now() - startTime;
        executionTime.textContent = `${elapsed}ms`;
        
        // Mostrar estatísticas de duplicação
        if (duplicateCalculations.size > 0) {
            operationDetails.innerHTML += `<p><small>Cálculos duplicados evitados: ${duplicateCalculations.size}</small></p>`;
        }
    }
    
    function updateExamples() {
        // Primeiros 12 números de Fibonacci
        const examples = [
            { n: 0, value: 0, formula: 'Caso Base' },
            { n: 1, value: 1, formula: 'Caso Base' },
            { n: 2, value: 1, formula: '1 + 0' },
            { n: 3, value: 2, formula: '1 + 1' },
            { n: 4, value: 3, formula: '2 + 1' },
            { n: 5, value: 5, formula: '3 + 2' },
            { n: 6, value: 8, formula: '5 + 3' },
            { n: 7, value: 13, formula: '8 + 5' },
            { n: 8, value: 21, formula: '13 + 8' },
            { n: 9, value: 34, formula: '21 + 13' },
            { n: 10, value: 55, formula: '34 + 21' },
            { n: 11, value: 89, formula: '55 + 34' },
            { n: 12, value: 144, formula: '89 + 55' }
        ];
        
        examplesTable.innerHTML = '';
        examples.forEach(example => {
            const exampleItem = document.createElement('div');
            exampleItem.className = 'example-item';
            exampleItem.dataset.n = example.n;
            
            const indexDiv = document.createElement('div');
            indexDiv.className = 'example-index';
            indexDiv.textContent = `F(${example.n})`;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'example-value';
            valueDiv.textContent = example.value;
            
            const formulaDiv = document.createElement('div');
            formulaDiv.className = 'example-formula';
            formulaDiv.textContent = example.formula;
            
            exampleItem.appendChild(indexDiv);
            exampleItem.appendChild(valueDiv);
            exampleItem.appendChild(formulaDiv);
            examplesTable.appendChild(exampleItem);
            
            // Adicionar evento de clique para usar o exemplo
            exampleItem.addEventListener('click', () => {
                n = example.n;
                fibNumberInput.value = n;
                resetCalculation();
            });
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
    
    // Inicializar valores
    updateSpeed();
});