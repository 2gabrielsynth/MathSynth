document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const itemCountInput = document.getElementById('itemCount');
    const itemCountValue = document.getElementById('itemCountValue');
    const capacityInput = document.getElementById('capacity');
    const capacityValue = document.getElementById('capacityValue');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const itemTypeSelect = document.getElementById('itemType');
    const generateBtn = document.getElementById('generateBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Elementos de visualização
    const knapsackBag = document.getElementById('knapsackBag');
    const itemsContainer = document.getElementById('itemsContainer');
    const capacityIndicator = document.getElementById('capacityIndicator');
    const currentWeight = document.getElementById('currentWeight');
    const maxCapacity = document.getElementById('maxCapacity');
    const capacityFill = document.getElementById('capacityFill');
    const capacityPercent = document.getElementById('capacityPercent');
    const itemsTable = document.getElementById('itemsTable');
    const dpTableContainer = document.getElementById('dpTableContainer');
    const decisionTree = document.getElementById('decisionTree');
    
    // Elementos de status
    const currentItem = document.getElementById('currentItem');
    const currentValue = document.getElementById('currentValue');
    const currentWeightInfo = document.getElementById('currentWeightInfo');
    const currentDensity = document.getElementById('currentDensity');
    const totalValue = document.getElementById('totalValue');
    const totalWeight = document.getElementById('totalWeight');
    const itemsInKnapsack = document.getElementById('itemsInKnapsack');
    const statusText = document.getElementById('statusText');
    const operationDetails = document.getElementById('operationDetails');
    
    // Variáveis de estado
    let itemCount = 5;
    let capacity = 20;
    let algorithm = 'dp';
    let animationSpeed = 1000;
    let isRunning = false;
    let isPaused = false;
    let startTime = 0;
    let animationTimeout;
    let stepMode = false;
    
    // Dados do problema
    let items = [];
    let selectedItems = new Set();
    let currentItemIndex = 0;
    let totalValueSum = 0;
    let totalWeightSum = 0;
    let dpTable = [];
    let decisionPath = [];
    
    // Constantes
    const ITEM_NAMES = ['Ouro', 'Prata', 'Bronze', 'Diamante', 'Rubi', 'Esmeralda', 'Safira', 'Topázio', 'Ametista', 'Jade'];
    const ITEM_SYMBOLS = ['🥇', '🥈', '🥉', '💎', '🔴', '💚', '🔵', '🟡', '🟣', '🟢'];
    
    // Inicialização
    init();
    
    function init() {
        setupEventListeners();
        updateItemCount();
        updateCapacity();
        generateItems();
        renderItems();
        updateStatus();
    }
    
    function setupEventListeners() {
        itemCountInput.addEventListener('input', updateItemCount);
        capacityInput.addEventListener('input', updateCapacity);
        algorithmSelect.addEventListener('change', updateAlgorithm);
        speedInput.addEventListener('input', updateSpeed);
        itemTypeSelect.addEventListener('change', updateItemType);
        
        generateBtn.addEventListener('click', generateItems);
        startBtn.addEventListener('click', startAlgorithm);
        pauseBtn.addEventListener('click', togglePause);
        stepBtn.addEventListener('click', toggleStepMode);
        resetBtn.addEventListener('click', resetAlgorithm);
    }
    
    function updateItemCount() {
        itemCount = parseInt(itemCountInput.value);
        itemCountValue.textContent = itemCount;
        generateItems();
    }
    
    function updateCapacity() {
        capacity = parseInt(capacityInput.value);
        capacityValue.textContent = `${capacity} kg`;
        maxCapacity.textContent = capacity;
        updateCapacityBar();
    }
    
    function updateAlgorithm() {
        algorithm = algorithmSelect.value;
        resetAlgorithm();
    }
    
    function updateSpeed() {
        const value = parseInt(speedInput.value);
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function updateItemType() {
        generateItems();
    }
    
    function generateItems() {
        items = [];
        const itemType = itemTypeSelect.value;
        
        for (let i = 0; i < itemCount; i++) {
            let value, weight;
            
            switch(itemType) {
                case 'random':
                    value = Math.floor(Math.random() * 30) + 10;
                    weight = Math.floor(Math.random() * 15) + 5;
                    break;
                    
                case 'highvalue':
                    value = Math.floor(Math.random() * 40) + 20;
                    weight = Math.floor(Math.random() * 10) + 5;
                    break;
                    
                case 'lowweight':
                    value = Math.floor(Math.random() * 20) + 10;
                    weight = Math.floor(Math.random() * 5) + 3;
                    break;
                    
                case 'balanced':
                    value = Math.floor(Math.random() * 25) + 15;
                    weight = Math.floor(Math.random() * 12) + 4;
                    break;
            }
            
            const density = value / weight;
            let valueClass = 'value-low';
            if (density >= 3) valueClass = 'value-high';
            else if (density >= 1) valueClass = 'value-medium';
            
            items.push({
                id: i,
                name: ITEM_NAMES[i] || `Item ${i+1}`,
                symbol: ITEM_SYMBOLS[i] || '📦',
                value: value,
                weight: weight,
                density: density,
                valueClass: valueClass,
                selected: false,
                inKnapsack: false
            });
        }
        
        // Ordenar por densidade (para algoritmo guloso)
        items.sort((a, b) => b.density - a.density);
        
        renderItems();
        updateItemsTable();
        resetAlgorithm();
    }
    
    function renderItems() {
        itemsContainer.innerHTML = '';
        
        // Calcular posições dos itens fora da mochila
        const containerWidth = knapsackBag.clientWidth;
        const containerHeight = knapsackBag.clientHeight;
        const itemsPerRow = Math.ceil(Math.sqrt(itemCount));
        const itemSize = 80;
        const spacing = 15;
        
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `item ${item.valueClass} outside-knapsack`;
            itemElement.id = `item-${item.id}`;
            itemElement.dataset.id = item.id;
            
            // Calcular posição em grid
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = col * (itemSize + spacing);
            const y = row * (itemSize + spacing);
            
            itemElement.style.left = `${x}px`;
            itemElement.style.top = `${y}px`;
            
            itemElement.innerHTML = `
                <div class="item-value">${item.symbol} ${item.value}</div>
                <div class="item-weight">${item.weight}kg</div>
                <div class="item-density">${item.density.toFixed(1)}</div>
            `;
            
            // Adicionar estado visual
            if (item.selected) {
                itemElement.classList.add('selected');
            }
            if (item.inKnapsack) {
                itemElement.classList.remove('outside-knapsack');
                itemElement.classList.add('inside-knapsack');
                // Posicionar aleatoriamente dentro da mochila
                const randX = Math.random() * (containerWidth - itemSize - 40) + 20;
                const randY = Math.random() * (containerHeight - itemSize - 40) + 20;
                itemElement.style.left = `${randX}px`;
                itemElement.style.top = `${randY}px`;
            }
            
            itemsContainer.appendChild(itemElement);
        });
    }
    
    function updateItemsTable() {
        let tableHTML = `
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Símbolo</th>
                    <th>Valor</th>
                    <th>Peso</th>
                    <th>Densidade (V/P)</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        items.forEach((item, index) => {
            let state = 'Fora da Mochila';
            let rowClass = '';
            
            if (item.inKnapsack) {
                state = 'Na Mochila';
                rowClass = 'in-knapsack';
            } else if (item.selected) {
                state = 'Selecionado';
                rowClass = 'selected';
            } else if (index < currentItemIndex) {
                state = 'Excluído';
                rowClass = 'excluded';
            }
            
            tableHTML += `
                <tr class="${rowClass}" data-id="${item.id}">
                    <td>${item.name}</td>
                    <td style="font-size: 1.2rem;">${item.symbol}</td>
                    <td>${item.value}</td>
                    <td>${item.weight} kg</td>
                    <td>${item.density.toFixed(2)}</td>
                    <td>${state}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody>';
        itemsTable.innerHTML = tableHTML;
    }
    
    function updateCapacityBar() {
        const percent = Math.min(100, (totalWeightSum / capacity) * 100);
        capacityFill.style.width = `${percent}%`;
        capacityPercent.textContent = `${Math.round(percent)}%`;
        currentWeight.textContent = totalWeightSum;
        
        // Mudar cor baseado no percentual
        if (percent > 90) {
            capacityFill.style.background = 'linear-gradient(to right, #ff6b6b, #ee5a52)';
        } else if (percent > 70) {
            capacityFill.style.background = 'linear-gradient(to right, #ffd166, #ffca3a)';
        } else {
            capacityFill.style.background = 'linear-gradient(to right, #06d6a0, #00b894)';
        }
    }
    
    function startAlgorithm() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stepBtn.disabled = true;
        statusText.textContent = 'Executando';
        startTime = Date.now();
        
        // Resetar estado
        selectedItems.clear();
        currentItemIndex = 0;
        totalValueSum = 0;
        totalWeightSum = 0;
        dpTable = [];
        decisionPath = [];
        
        // Resetar visualização
        items.forEach(item => {
            item.selected = false;
            item.inKnapsack = false;
        });
        
        renderItems();
        updateStatus();
        
        // Executar algoritmo selecionado
        switch(algorithm) {
            case 'dp':
                executeDynamicProgramming();
                break;
            case 'greedy':
                executeGreedy();
                break;
            case 'backtracking':
                executeBacktracking();
                break;
            case 'branch':
                executeBranchAndBound();
                break;
            case 'bruteforce':
                executeBruteForce();
                break;
        }
    }
    
    async function executeDynamicProgramming() {
        operationDetails.innerHTML = '<p><strong>Programação Dinâmica:</strong> Construindo tabela ótima...</p>';
        
        const n = items.length;
        const W = capacity;
        
        // Inicializar tabela DP
        dpTable = Array(n + 1).fill().map(() => Array(W + 1).fill(0));
        
        // Construir tabela DP
        for (let i = 1; i <= n; i++) {
            if (isPaused || !isRunning) return;
            
            const item = items[i - 1];
            currentItemIndex = i - 1;
            
            // Atualizar interface
            updateCurrentItemInfo(item);
            highlightItem(currentItemIndex);
            
            operationDetails.innerHTML = `
                <p><strong>Item ${i}:</strong> ${item.name} (Valor: ${item.value}, Peso: ${item.weight})</p>
                <p>Calculando soluções ótimas para capacidade até ${W}...</p>
            `;
            
            for (let w = 0; w <= W; w++) {
                if (isPaused || !isRunning) return;
                
                if (item.weight <= w) {
                    dpTable[i][w] = Math.max(
                        dpTable[i - 1][w],
                        dpTable[i - 1][w - item.weight] + item.value
                    );
                } else {
                    dpTable[i][w] = dpTable[i - 1][w];
                }
                
                // Atualizar visualização da tabela DP
                if (w % 5 === 0 || w === W) {
                    updateDPTable(i, w);
                    await sleep(animationSpeed / 20);
                }
            }
            
            await sleep(animationSpeed);
        }
        
        // Reconstruir solução ótima
        await reconstructSolution(n, W);
        
        finishAlgorithm();
    }
    
    function updateDPTable(i, w) {
        let tableHTML = `
            <table class="dp-table">
                <thead>
                    <tr>
                        <th>i\\w</th>
        `;
        
        // Cabeçalho das capacidades
        for (let weight = 0; weight <= capacity; weight += 5) {
            tableHTML += `<th>${weight}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';
        
        // Linhas da tabela
        for (let row = 0; row <= Math.min(i, items.length); row++) {
            tableHTML += `<tr><th>${row}</th>`;
            
            for (let col = 0; col <= capacity; col += 5) {
                let cellClass = '';
                if (row === i && col === w) {
                    cellClass = 'current';
                } else if (row > 0 && dpTable[row] && dpTable[row][col] !== undefined) {
                    // Verificar se esta célula faz parte da solução ótima
                    if (isOptimalCell(row, col)) {
                        cellClass = 'optimal';
                    } else if (row === i) {
                        cellClass = 'considered';
                    }
                }
                
                const value = dpTable[row] && dpTable[row][col] !== undefined ? dpTable[row][col] : '';
                tableHTML += `<td class="${cellClass}">${value}</td>`;
            }
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table>';
        dpTableContainer.innerHTML = tableHTML;
    }
    
    function isOptimalCell(i, w) {
        // Implementação simplificada para verificar célula ótima
        return false;
    }
    
    async function reconstructSolution(i, w) {
        operationDetails.innerHTML = '<p><strong>Reconstruindo solução ótima...</strong></p>';
        
        let remainingWeight = w;
        let remainingItems = i;
        
        while (remainingItems > 0 && remainingWeight > 0) {
            if (isPaused || !isRunning) return;
            
            const item = items[remainingItems - 1];
            
            if (dpTable[remainingItems][remainingWeight] !== dpTable[remainingItems - 1][remainingWeight]) {
                // Item incluído na solução ótima
                selectedItems.add(remainingItems - 1);
                items[remainingItems - 1].inKnapsack = true;
                totalValueSum += item.value;
                totalWeightSum += item.weight;
                
                // Atualizar visualização
                updateStatus();
                updateCapacityBar();
                renderItems();
                updateItemsTable();
                
                // Adicionar à árvore de decisão
                addDecisionTreeNode(remainingItems - 1, true);
                
                remainingWeight -= item.weight;
                operationDetails.innerHTML += `<p>✓ Incluir ${item.name} (Valor: ${item.value}, Peso: ${item.weight})</p>`;
            } else {
                // Item não incluído
                addDecisionTreeNode(remainingItems - 1, false);
                operationDetails.innerHTML += `<p>✗ Excluir ${item.name}</p>`;
            }
            
            remainingItems--;
            await sleep(animationSpeed);
        }
    }
    
    async function executeGreedy() {
        operationDetails.innerHTML = '<p><strong>Algoritmo Guloso:</strong> Selecionando itens por densidade (valor/peso)...</p>';
        
        // Ordenar itens por densidade (já está ordenado)
        let remainingCapacity = capacity;
        currentItemIndex = 0;
        
        // Limpar árvore de decisão
        decisionTree.innerHTML = '';
        
        for (let i = 0; i < items.length; i++) {
            if (isPaused || !isRunning) return;
            
            const item = items[i];
            currentItemIndex = i;
            
            // Atualizar interface
            updateCurrentItemInfo(item);
            highlightItem(i);
            
            operationDetails.innerHTML = `
                <p><strong>Item ${i + 1}:</strong> ${item.name}</p>
                <p>Densidade: ${item.density.toFixed(2)} (Valor: ${item.value}, Peso: ${item.weight})</p>
                <p>Capacidade restante: ${remainingCapacity} kg</p>
            `;
            
            if (item.weight <= remainingCapacity) {
                // Incluir item completo
                selectedItems.add(i);
                items[i].inKnapsack = true;
                totalValueSum += item.value;
                totalWeightSum += item.weight;
                remainingCapacity -= item.weight;
                
                // Adicionar à árvore de decisão
                addDecisionTreeNode(i, true);
                
                operationDetails.innerHTML += `<p>✓ Incluir ${item.name} (peso: ${item.weight} kg)</p>`;
            } else {
                // Verificar se podemos incluir fração (para knapsack fracionário)
                if (algorithm === 'greedy') {
                    const fraction = remainingCapacity / item.weight;
                    const fractionalValue = item.value * fraction;
                    
                    selectedItems.add(i);
                    items[i].inKnapsack = true;
                    totalValueSum += fractionalValue;
                    totalWeightSum += remainingCapacity;
                    remainingCapacity = 0;
                    
                    // Adicionar à árvore de decisão
                    addDecisionTreeNode(i, true, fraction);
                    
                    operationDetails.innerHTML += `
                        <p>✓ Incluir ${(fraction * 100).toFixed(0)}% de ${item.name}</p>
                        <p>Valor parcial: ${fractionalValue.toFixed(1)}</p>
                    `;
                } else {
                    // Excluir item
                    addDecisionTreeNode(i, false);
                    operationDetails.innerHTML += `<p>✗ Excluir ${item.name} (peso excede capacidade)</p>`;
                }
            }
            
            // Atualizar visualização
            updateStatus();
            updateCapacityBar();
            renderItems();
            updateItemsTable();
            
            await sleep(animationSpeed);
            
            if (remainingCapacity <= 0) break;
        }
        
        finishAlgorithm();
    }
    
    async function executeBacktracking() {
        operationDetails.innerHTML = '<p><strong>Backtracking:</strong> Explorando todas as combinações com poda...</p>';
        
        // Limpar árvore de decisão
        decisionTree.innerHTML = '<div class="tree-node">Explorando árvore de decisão...</div>';
        
        let bestSolution = {
            value: 0,
            weight: 0,
            items: new Set()
        };
        
        async function backtrack(index, currentValue, currentWeight, selectedSet) {
            if (isPaused || !isRunning) return bestSolution;
            
            // Atualizar interface
            currentItemIndex = index;
            updateCurrentItemInfo(items[index]);
            highlightItem(index);
            
            // Adicionar nó à árvore de decisão
            const nodeId = addDecisionTreeNode(index, false, 0, currentValue, currentWeight);
            
            // Verificar se ultrapassou a capacidade
            if (currentWeight > capacity) {
                updateDecisionTreeNode(nodeId, 'exceeded');
                await sleep(animationSpeed / 2);
                return bestSolution;
            }
            
            // Verificar se é folha
            if (index >= items.length) {
                // Atualizar melhor solução se necessário
                if (currentValue > bestSolution.value) {
                    bestSolution = {
                        value: currentValue,
                        weight: currentWeight,
                        items: new Set(selectedSet)
                    };
                    
                    // Atualizar visualização
                    updateBestSolution(bestSolution);
                    updateDecisionTreeNode(nodeId, 'best');
                } else {
                    updateDecisionTreeNode(nodeId, 'leaf');
                }
                
                await sleep(animationSpeed / 2);
                return bestSolution;
            }
            
            // Podar se não puder superar melhor solução
            const remainingValue = items.slice(index).reduce((sum, item) => sum + item.value, 0);
            if (currentValue + remainingValue <= bestSolution.value) {
                updateDecisionTreeNode(nodeId, 'pruned');
                await sleep(animationSpeed / 2);
                return bestSolution;
            }
            
            // Ramo 1: Não incluir item
            updateDecisionTreeNode(nodeId, 'exploring-left');
            await sleep(animationSpeed / 2);
            await backtrack(index + 1, currentValue, currentWeight, selectedSet);
            
            // Ramo 2: Incluir item
            selectedSet.add(index);
            updateDecisionTreeNode(nodeId, 'exploring-right');
            await sleep(animationSpeed / 2);
            await backtrack(
                index + 1,
                currentValue + items[index].value,
                currentWeight + items[index].weight,
                selectedSet
            );
            selectedSet.delete(index);
            
            updateDecisionTreeNode(nodeId, 'completed');
            return bestSolution;
        }
        
        const result = await backtrack(0, 0, 0, new Set());
        
        // Aplicar melhor solução
        selectedItems = result.items;
        totalValueSum = result.value;
        totalWeightSum = result.weight;
        
        items.forEach((item, index) => {
            item.inKnapsack = selectedItems.has(index);
        });
        
        updateStatus();
        updateCapacityBar();
        renderItems();
        updateItemsTable();
        
        finishAlgorithm();
    }
    
    async function executeBranchAndBound() {
        operationDetails.innerHTML = '<p><strong>Branch and Bound:</strong> Explorando com limites superiores...</p>';
        // Implementação similar ao backtracking com limites mais sofisticados
        await executeBacktracking(); // Placeholder
    }
    
    async function executeBruteForce() {
        operationDetails.innerHTML = '<p><strong>Força Bruta:</strong> Testando todas as combinações possíveis...</p>';
        
        const n = items.length;
        const totalCombinations = Math.pow(2, n);
        
        // Limpar árvore de decisão
        decisionTree.innerHTML = '<div class="tree-node">Testando todas as 2^' + n + ' = ' + totalCombinations + ' combinações...</div>';
        
        let bestSolution = {
            value: 0,
            weight: 0,
            combination: 0
        };
        
        // Testar todas as combinações
        for (let mask = 0; mask < totalCombinations; mask++) {
            if (isPaused || !isRunning) return;
            
            let currentValue = 0;
            let currentWeight = 0;
            let currentItems = new Set();
            
            // Calcular valor e peso para esta combinação
            for (let i = 0; i < n; i++) {
                if (mask & (1 << i)) {
                    currentValue += items[i].value;
                    currentWeight += items[i].weight;
                    currentItems.add(i);
                }
            }
            
            // Atualizar contador
            operationDetails.innerHTML = `
                <p><strong>Combinação ${mask + 1}/${totalCombinations}:</strong></p>
                <p>Itens: ${Array.from(currentItems).map(i => items[i].name).join(', ')}</p>
                <p>Valor: ${currentValue}, Peso: ${currentWeight}/${capacity}</p>
            `;
            
            // Verificar se é válida e melhor
            if (currentWeight <= capacity && currentValue > bestSolution.value) {
                bestSolution = {
                    value: currentValue,
                    weight: currentWeight,
                    combination: mask,
                    items: currentItems
                };
                
                // Atualizar visualização
                updateBestSolution(bestSolution);
                
                // Adicionar à árvore de decisão
                const node = document.createElement('div');
                node.className = 'tree-node best';
                node.innerHTML = `
                    Combinação ${mask.toString(2).padStart(n, '0')}<br>
                    Valor: ${currentValue}, Peso: ${currentWeight}
                `;
                decisionTree.appendChild(node);
                decisionTree.scrollTop = decisionTree.scrollHeight;
            }
            
            // Atualizar status a cada 10 combinações
            if (mask % 10 === 0 || mask === totalCombinations - 1) {
                updateStatus();
                await sleep(animationSpeed / 5);
            }
        }
        
        // Aplicar melhor solução
        selectedItems = bestSolution.items;
        totalValueSum = bestSolution.value;
        totalWeightSum = bestSolution.weight;
        
        items.forEach((item, index) => {
            item.inKnapsack = selectedItems.has(index);
        });
        
        updateStatus();
        updateCapacityBar();
        renderItems();
        updateItemsTable();
        
        finishAlgorithm();
    }
    
    function updateCurrentItemInfo(item) {
        currentItem.textContent = item.name;
        currentValue.textContent = item.value;
        currentWeightInfo.textContent = `${item.weight} kg`;
        currentDensity.textContent = item.density.toFixed(2);
    }
    
    function highlightItem(index) {
        // Remover destaque anterior
        document.querySelectorAll('.item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.item.considering').forEach(item => {
            item.classList.remove('considering');
        });
        
        // Destacar item atual
        const itemElement = document.getElementById(`item-${index}`);
        if (itemElement) {
            itemElement.classList.add('considering');
        }
        
        // Destacar linha na tabela
        document.querySelectorAll('#itemsTable tr').forEach(row => {
            row.classList.remove('selected');
        });
        const tableRow = document.querySelector(`#itemsTable tr[data-id="${index}"]`);
        if (tableRow) {
            tableRow.classList.add('selected');
        }
    }
    
    function addDecisionTreeNode(itemIndex, taken, fraction = 1, currentValue = 0, currentWeight = 0) {
        const node = document.createElement('div');
        const item = items[itemIndex];
        const nodeId = `node-${Date.now()}-${Math.random()}`;
        
        node.id = nodeId;
        node.className = 'tree-node';
        
        if (taken) {
            node.classList.add('taken');
            if (fraction < 1) {
                node.innerHTML = `
                    ${item.name} (${(fraction * 100).toFixed(0)}%)<br>
                    Valor: +${(item.value * fraction).toFixed(1)}, Peso: +${(item.weight * fraction).toFixed(1)}<br>
                    Total: ${(currentValue + item.value * fraction).toFixed(1)} / ${(currentWeight + item.weight * fraction).toFixed(1)}
                `;
            } else {
                node.innerHTML = `
                    ✓ ${item.name}<br>
                    Valor: +${item.value}, Peso: +${item.weight}<br>
                    Total: ${currentValue + item.value} / ${currentWeight + item.weight}
                `;
            }
        } else {
            node.classList.add('not-taken');
            node.innerHTML = `
                ✗ ${item.name}<br>
                Valor: ${currentValue}, Peso: ${currentWeight}
            `;
        }
        
        decisionTree.appendChild(node);
        decisionTree.scrollTop = decisionTree.scrollHeight;
        
        return nodeId;
    }
    
    function updateDecisionTreeNode(nodeId, state) {
        const node = document.getElementById(nodeId);
        if (!node) return;
        
        node.classList.remove('current', 'best', 'leaf', 'pruned', 'exceeded', 'exploring-left', 'exploring-right', 'completed');
        
        switch(state) {
            case 'current':
                node.classList.add('current');
                break;
            case 'best':
                node.classList.add('best');
                break;
            case 'leaf':
                node.innerHTML += '<br>🌿 Folha alcançada';
                break;
            case 'pruned':
                node.innerHTML += '<br>✂️ Poda aplicada';
                node.classList.add('pruned');
                break;
            case 'exceeded':
                node.innerHTML += '<br>⚖️ Peso excedido';
                node.classList.add('exceeded');
                break;
            case 'exploring-left':
                node.innerHTML += '<br>← Explorando ramo esquerdo';
                break;
            case 'exploring-right':
                node.innerHTML += '<br>→ Explorando ramo direito';
                break;
            case 'completed':
                node.innerHTML += '<br>✓ Completo';
                break;
        }
    }
    
    function updateBestSolution(solution) {
        totalValueSum = solution.value;
        totalWeightSum = solution.weight;
        updateStatus();
        updateCapacityBar();
    }
    
    function updateStatus() {
        totalValue.textContent = totalValueSum;
        totalWeight.textContent = totalWeightSum;
        itemsInKnapsack.textContent = selectedItems.size;
        
        // Atualizar tempo de execução
        // if (startTime > 0) {
        //     const elapsed = Math.floor((Date.now() - startTime) / 1000);
        //     executionTime.textContent = `${elapsed}s`;
        // }
    }
    
    function togglePause() {
        if (!isRunning) return;
        
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        statusText.textContent = isPaused ? 'Pausado' : 'Executando';
        
        if (!isPaused) {
            // Continuar execução baseado no algoritmo
            switch(algorithm) {
                case 'dp':
                    executeDynamicProgramming();
                    break;
                case 'greedy':
                    executeGreedy();
                    break;
                case 'backtracking':
                    executeBacktracking();
                    break;
                case 'branch':
                    executeBranchAndBound();
                    break;
                case 'bruteforce':
                    executeBruteForce();
                    break;
            }
        }
    }
    
    function toggleStepMode() {
        stepMode = !stepMode;
        stepBtn.innerHTML = stepMode ? 
            '<i class="fas fa-forward"></i> Próximo Passo' : 
            '<i class="fas fa-step-forward"></i> Passo a Passo';
        
        if (stepMode && !isRunning) {
            startAlgorithm();
        }
    }
    
    function resetAlgorithm() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        stepMode = false;
        
        // Resetar estado
        selectedItems.clear();
        currentItemIndex = 0;
        totalValueSum = 0;
        totalWeightSum = 0;
        dpTable = [];
        decisionPath = [];
        
        // Resetar itens
        items.forEach(item => {
            item.selected = false;
            item.inKnapsack = false;
        });
        
        // Limpar visualizações
        dpTableContainer.innerHTML = '';
        decisionTree.innerHTML = '';
        
        // Atualizar interface
        updateStatus();
        updateCapacityBar();
        renderItems();
        updateItemsTable();
        operationDetails.innerHTML = '<p>Algoritmo reiniciado. Configure os itens e clique em "Executar Algoritmo".</p>';
        statusText.textContent = 'Pronto';
        
        // Atualizar botões
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = false;
        stepBtn.innerHTML = '<i class="fas fa-step-forward"></i> Passo a Passo';
    }
    
    function finishAlgorithm() {
        isRunning = false;
        statusText.textContent = 'Concluído';
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        // executionTime.textContent = `${elapsed}s`;
        
        operationDetails.innerHTML = `
            <p><strong>✅ Algoritmo Concluído!</strong></p>
            <p>Valor total na mochila: ${totalValueSum}</p>
            <p>Peso total: ${totalWeightSum}/${capacity} kg</p>
            <p>Itens selecionados: ${Array.from(selectedItems).map(i => items[i].name).join(', ')}</p>
            <p>Tempo de execução: ${elapsed} segundos</p>
        `;
        
        // Atualizar botões
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        stepBtn.disabled = false;
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