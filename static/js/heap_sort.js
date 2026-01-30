class HeapSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 10;
        this.speed = 15;
        this.heapType = 'max';
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        
        // Contadores
        this.comparisons = 0;
        this.swaps = 0;
        this.extractions = 0;
        this.heapSize = 0;
        
        // Para o algoritmo
        this.steps = [];
        this.currentStepIndex = 0;
        this.originalArray = [];
        
        // Estado atual
        this.currentState = 'pronto';
        this.currentNode = -1;
        this.parentNode = -1;
        this.leftChild = -1;
        this.rightChild = -1;
        this.heapArray = [];
        this.sortedPart = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateNewArray();
        this.updateSpeedValue();
    }
    
    setupEventListeners() {
        document.getElementById('arraySize').addEventListener('input', (e) => {
            if (!this.isSorting) {
                this.arraySize = parseInt(e.target.value);
                document.getElementById('sizeValue').textContent = this.arraySize;
                this.generateNewArray();
            }
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.updateSpeedValue();
            
            if (this.isSorting && !this.isPaused) {
                clearInterval(this.sortingInterval);
                this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
            }
        });
        
        document.getElementById('heapType').addEventListener('change', (e) => {
            this.heapType = e.target.value;
        });
        
        document.getElementById('generateBtn').addEventListener('click', () => {
            if (!this.isSorting) {
                this.generateNewArray();
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startSorting();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
    }
    
    getSpeedInterval() {
        return 2000 - (this.speed * 47.5);
    }
    
    updateSpeedValue() {
        const speedValue = document.getElementById('speedValue');
        if (this.speed <= 10) {
            speedValue.textContent = 'Muito Lento';
        } else if (this.speed <= 20) {
            speedValue.textContent = 'Lento';
        } else if (this.speed <= 30) {
            speedValue.textContent = 'Médio';
        } else {
            speedValue.textContent = 'Rápido';
        }
    }
    
    generateNewArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 95) + 5);
        }
        this.originalArray = [...this.array];
        this.resetCounters();
        this.renderArray();
        this.renderTree();
    }
    
    resetCounters() {
        this.comparisons = 0;
        this.swaps = 0;
        this.extractions = 0;
        this.heapSize = 0;
        
        this.currentState = 'pronto';
        this.currentNode = -1;
        this.parentNode = -1;
        this.leftChild = -1;
        this.rightChild = -1;
        this.heapArray = [...this.array];
        this.sortedPart = [];
        
        this.steps = [];
        this.currentStepIndex = 0;
        
        document.getElementById('comparisonCount').textContent = '0';
        document.getElementById('swapCount').textContent = '0';
        document.getElementById('extractionCount').textContent = '0';
        document.getElementById('heapSize').textContent = '0';
        document.getElementById('statusText').textContent = 'Pronto';
        document.getElementById('currentNode').textContent = '-';
        document.getElementById('parentNode').textContent = '-';
        document.getElementById('leftChild').textContent = '-';
        document.getElementById('rightChild').textContent = '-';
        
        this.updateOperationDetails('Array gerado. Clique em "Iniciar" para começar a ordenação.');
    }
    
    updateOperationDetails(message) {
        document.getElementById('operationDetails').innerHTML = `<p>${message}</p>`;
    }
    
    renderArray() {
        const container = document.getElementById('arrayContainer');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.array);
        const containerHeight = 150;
        
        this.array.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'array-element';
            element.style.height = `${(value / maxValue) * containerHeight}px`;
            element.innerHTML = `
                <div class="value">${value}</div>
                <div class="index">${index}</div>
            `;
            
            // Determinar classe baseado no estado
            if (this.currentState === 'pronto') {
                element.classList.add('unsorted');
            } else {
                if (index < this.heapSize) {
                    if (index === 0) {
                        element.classList.add('root');
                    } else if (index === this.currentNode) {
                        element.classList.add('comparing');
                    } else if (this.currentState === 'heapify' || this.currentState === 'building_heap') {
                        element.classList.add('heapified');
                    } else {
                        element.classList.add('heap');
                    }
                } else {
                    element.classList.add('sorted');
                }
                
                // Se está trocando, destacar
                if (this.currentState === 'swapping' && 
                    (index === this.currentNode || index === this.parentNode || 
                     index === this.leftChild || index === this.rightChild)) {
                    element.classList.add('swapping');
                }
            }
            
            container.appendChild(element);
        });
    }
    
    renderTree() {
        const container = document.getElementById('treeContainer');
        
        if (this.currentState === 'pronto' || this.array.length === 0) {
            container.innerHTML = `
                <div class="tree-message">
                    <i class="fas fa-tree"></i>
                    <p>Clique em "Iniciar" para visualizar o Heap</p>
                </div>
            `;
            return;
        }
        
        // Criar representação da árvore
        let html = '<div class="tree">';
        
        // Calcular número de níveis
        const levels = Math.ceil(Math.log2(this.heapSize + 1));
        
        for (let level = 0; level < levels; level++) {
            const levelStart = Math.pow(2, level) - 1;
            const levelEnd = Math.min(Math.pow(2, level + 1) - 1, this.heapSize);
            
            html += `<div class="tree-level" data-level="${level}">`;
            
            for (let i = levelStart; i < levelEnd; i++) {
                const value = this.array[i];
                let nodeClass = 'tree-node';
                
                // Determinar classe do nó
                if (i < this.heapSize) {
                    if (i === 0) {
                        nodeClass += ' root';
                    } else if (i === this.currentNode) {
                        nodeClass += ' comparing';
                    } else if (this.currentState === 'heapify' || this.currentState === 'building_heap') {
                        nodeClass += ' heapified';
                    } else {
                        nodeClass += ' heap';
                    }
                    
                    // Se está trocando
                    if (this.currentState === 'swapping' && 
                        (i === this.currentNode || i === this.parentNode || 
                         i === this.leftChild || i === this.rightChild)) {
                        nodeClass += ' swapping';
                    }
                } else {
                    nodeClass += ' sorted';
                }
                
                html += `
                    <div class="${nodeClass}" data-index="${i}">
                        ${value}
                        <div class="node-index">${i}</div>
                    </div>
                `;
            }
            
            html += '</div>';
            
            // Adicionar conexões para o próximo nível
            if (level < levels - 1) {
                const nextLevelStart = Math.pow(2, level + 1) - 1;
                const nextLevelEnd = Math.min(Math.pow(2, level + 2) - 1, this.heapSize);
                
                // Calcular posições para linhas
                const parentCount = levelEnd - levelStart;
                const childCount = nextLevelEnd - nextLevelStart;
                const spacing = 60;
                
                html += `<div class="tree-connections" style="height: 40px; position: relative;">`;
                
                for (let p = 0; p < parentCount; p++) {
                    const parentIndex = levelStart + p;
                    const leftChildIndex = 2 * parentIndex + 1;
                    const rightChildIndex = 2 * parentIndex + 2;
                    
                    if (leftChildIndex < this.heapSize) {
                        // Linha para filho esquerdo
                        const parentPos = p * spacing;
                        const childPos = p * 2 * spacing;
                        html += `
                            <div class="tree-connection" style="
                                position: absolute;
                                top: 0;
                                left: ${parentPos + 25}px;
                                width: ${spacing/2}px;
                                height: 40px;
                                background: linear-gradient(to bottom right, rgba(255,255,255,0.3) 50%, transparent 50%);
                                transform: rotate(30deg);
                                transform-origin: top left;
                            "></div>
                        `;
                    }
                    
                    if (rightChildIndex < this.heapSize) {
                        // Linha para filho direito
                        const parentPos = p * spacing;
                        const childPos = (p * 2 + 1) * spacing;
                        html += `
                            <div class="tree-connection" style="
                                position: absolute;
                                top: 0;
                                left: ${parentPos + 25}px;
                                width: ${spacing/2}px;
                                height: 40px;
                                background: linear-gradient(to bottom left, rgba(255,255,255,0.3) 50%, transparent 50%);
                                transform: rotate(-30deg);
                                transform-origin: top left;
                            "></div>
                        `;
                    }
                }
                
                html += `</div>`;
            }
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    updateNodeInfo() {
        document.getElementById('currentNode').textContent = 
            this.currentNode !== -1 ? `${this.array[this.currentNode]} (${this.currentNode})` : '-';
        
        document.getElementById('parentNode').textContent = 
            this.parentNode !== -1 ? `${this.array[this.parentNode]} (${this.parentNode})` : '-';
        
        document.getElementById('leftChild').textContent = 
            this.leftChild !== -1 ? `${this.array[this.leftChild]} (${this.leftChild})` : '-';
        
        document.getElementById('rightChild').textContent = 
            this.rightChild !== -1 ? `${this.array[this.rightChild]} (${this.rightChild})` : '-';
    }
    
    updateCounters() {
        document.getElementById('comparisonCount').textContent = this.comparisons;
        document.getElementById('swapCount').textContent = this.swaps;
        document.getElementById('extractionCount').textContent = this.extractions;
        document.getElementById('heapSize').textContent = this.heapSize;
        document.getElementById('statusText').textContent = this.getStatusText();
    }
    
    getStatusText() {
        switch(this.currentState) {
            case 'building_heap': return 'Construindo Heap...';
            case 'heapify': return 'Heapificando...';
            case 'extracting': return 'Extraindo máximo...';
            case 'swapping': return 'Trocando...';
            case 'comparing': return 'Comparando...';
            case 'ordenado': return 'Ordenado!';
            case 'pronto': return 'Pronto';
            case 'completo': return 'Completo';
            default: return 'Ordenando...';
        }
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('heapType').disabled = true;
        
        // Gerar passos do Heap Sort
        this.generateHeapSortSteps();
        
        // Iniciar com o primeiro passo
        this.currentStepIndex = 0;
        this.nextStep();
        
        if (!this.isPaused) {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
        }
    }
    
    generateHeapSortSteps() {
        this.steps = [];
        const arrayCopy = [...this.array];
        this.heapSize = arrayCopy.length;
        
        // Passo 1: Construir max-heap
        this.steps.push({
            type: 'start_build_heap',
            heapSize: this.heapSize,
            message: `Iniciando construção do max-heap com ${this.heapSize} elementos`
        });
        
        // Construir heap a partir do último nó não-folha
        for (let i = Math.floor(this.heapSize / 2) - 1; i >= 0; i--) {
            this.steps.push({
                type: 'heapify_start',
                index: i,
                heapSize: this.heapSize,
                message: `Heapificando a partir do índice ${i} (valor: ${arrayCopy[i]})`
            });
            
            this.heapifyWithSteps(arrayCopy, i, this.heapSize);
        }
        
        this.steps.push({
            type: 'heap_built',
            heapSize: this.heapSize,
            array: [...arrayCopy],
            message: `Max-heap construído! Raiz: ${arrayCopy[0]} (maior elemento)`
        });
        
        // Passo 2: Extrair elementos do heap
        for (let i = this.heapSize - 1; i > 0; i--) {
            // Extrair máximo (trocar raiz com último)
            this.steps.push({
                type: 'extract_start',
                heapSize: this.heapSize,
                maxIndex: 0,
                lastIndex: i,
                maxValue: arrayCopy[0],
                lastValue: arrayCopy[i],
                message: `Extraindo máximo ${arrayCopy[0]} da raiz, trocando com ${arrayCopy[i]} no índice ${i}`
            });
            
            // Trocar
            [arrayCopy[0], arrayCopy[i]] = [arrayCopy[i], arrayCopy[0]];
            
            this.steps.push({
                type: 'extract_swap',
                heapSize: this.heapSize,
                index1: 0,
                index2: i,
                value1: arrayCopy[0],
                value2: arrayCopy[i],
                message: `Trocado: ${arrayCopy[i]} ↔ ${arrayCopy[0]}`
            });
            
            this.heapSize--;
            this.extractions++;
            
            this.steps.push({
                type: 'heap_size_decreased',
                heapSize: this.heapSize,
                sortedIndex: i,
                sortedValue: arrayCopy[i],
                message: `Heap size reduzido para ${this.heapSize}. Elemento ${arrayCopy[i]} na posição ${i} está ordenado`
            });
            
            // Re-heapify
            if (this.heapSize > 0) {
                this.steps.push({
                    type: 'reheapify_start',
                    heapSize: this.heapSize,
                    index: 0,
                    message: `Re-heapificando a partir da raiz (índice 0, valor: ${arrayCopy[0]})`
                });
                
                this.heapifyWithSteps(arrayCopy, 0, this.heapSize);
            }
        }
        
        this.steps.push({
            type: 'complete',
            array: [...arrayCopy],
            message: `Heap Sort completo! Array totalmente ordenado`
        });
    }
    
    heapifyWithSteps(array, index, heapSize) {
        let largest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        
        // Comparar com filho esquerdo
        if (left < heapSize) {
            this.steps.push({
                type: 'compare_left',
                parentIndex: index,
                parentValue: array[index],
                leftIndex: left,
                leftValue: array[left],
                heapSize: heapSize,
                message: `Comparando pai ${array[index]} (índice ${index}) com filho esquerdo ${array[left]} (índice ${left})`
            });
            
            this.comparisons++;
            
            if ((this.heapType === 'max' && array[left] > array[largest]) ||
                (this.heapType === 'min' && array[left] < array[largest])) {
                largest = left;
                
                this.steps.push({
                    type: 'new_largest_left',
                    oldLargest: index,
                    newLargest: left,
                    oldValue: array[index],
                    newValue: array[left],
                    message: `Filho esquerdo ${array[left]} é maior que pai ${array[index]}`
                });
            }
        }
        
        // Comparar com filho direito
        if (right < heapSize) {
            this.steps.push({
                type: 'compare_right',
                currentLargest: largest,
                currentLargestValue: array[largest],
                rightIndex: right,
                rightValue: array[right],
                heapSize: heapSize,
                message: `Comparando maior atual ${array[largest]} (índice ${largest}) com filho direito ${array[right]} (índice ${right})`
            });
            
            this.comparisons++;
            
            if ((this.heapType === 'max' && array[right] > array[largest]) ||
                (this.heapType === 'min' && array[right] < array[largest])) {
                largest = right;
                
                this.steps.push({
                    type: 'new_largest_right',
                    oldLargest: index,
                    newLargest: right,
                    oldValue: array[index],
                    newValue: array[right],
                    message: `Filho direito ${array[right]} é o maior`
                });
            }
        }
        
        // Se o maior não é o pai, trocar e continuar heapify
        if (largest !== index) {
            this.steps.push({
                type: 'heapify_swap',
                index1: index,
                index2: largest,
                value1: array[index],
                value2: array[largest],
                heapSize: heapSize,
                message: `Trocando ${array[index]} (índice ${index}) com ${array[largest]} (índice ${largest})`
            });
            
            // Trocar
            [array[index], array[largest]] = [array[largest], array[index]];
            this.swaps++;
            
            // Continuar heapify recursivamente
            this.heapifyWithSteps(array, largest, heapSize);
        } else {
            this.steps.push({
                type: 'heapify_complete',
                index: index,
                value: array[index],
                heapSize: heapSize,
                message: `Heapificação completa no índice ${index}. Propriedade heap satisfeita`
            });
        }
    }
    
    nextStep() {
        if (!this.isSorting || this.isPaused) return;
        
        if (this.currentStepIndex >= this.steps.length) {
            this.finishSorting();
            return;
        }
        
        const step = this.steps[this.currentStepIndex];
        
        switch(step.type) {
            case 'start_build_heap':
                this.currentState = 'building_heap';
                this.heapSize = step.heapSize;
                this.updateOperationDetails(step.message);
                break;
                
            case 'heapify_start':
                this.currentState = 'heapify';
                this.currentNode = step.index;
                this.parentNode = step.index;
                this.leftChild = 2 * step.index + 1;
                this.rightChild = 2 * step.index + 2;
                this.heapSize = step.heapSize;
                this.updateOperationDetails(step.message);
                break;
                
            case 'compare_left':
                this.currentState = 'comparing';
                this.currentNode = step.parentIndex;
                this.parentNode = step.parentIndex;
                this.leftChild = step.leftIndex;
                this.rightChild = -1;
                this.updateOperationDetails(step.message);
                break;
                
            case 'compare_right':
                this.currentState = 'comparing';
                this.currentNode = step.currentLargest;
                this.parentNode = step.currentLargest;
                this.leftChild = -1;
                this.rightChild = step.rightIndex;
                this.updateOperationDetails(step.message);
                break;
                
            case 'new_largest_left':
            case 'new_largest_right':
                this.currentState = 'comparing';
                this.currentNode = step.newLargest;
                this.parentNode = step.oldLargest;
                this.updateOperationDetails(step.message);
                break;
                
            case 'heapify_swap':
                this.currentState = 'swapping';
                this.currentNode = step.index1;
                this.parentNode = step.index2;
                this.leftChild = -1;
                this.rightChild = -1;
                // Realizar a troca no array
                [this.array[step.index1], this.array[step.index2]] = [this.array[step.index2], this.array[step.index1]];
                this.updateOperationDetails(step.message);
                break;
                
            case 'heapify_complete':
                this.currentState = 'heapify';
                this.currentNode = step.index;
                this.parentNode = -1;
                this.leftChild = -1;
                this.rightChild = -1;
                this.updateOperationDetails(step.message);
                break;
                
            case 'heap_built':
                this.currentState = 'building_heap';
                this.array = [...step.array];
                this.updateOperationDetails(step.message);
                break;
                
            case 'extract_start':
                this.currentState = 'extracting';
                this.currentNode = step.maxIndex;
                this.parentNode = step.lastIndex;
                this.leftChild = -1;
                this.rightChild = -1;
                this.updateOperationDetails(step.message);
                break;
                
            case 'extract_swap':
                this.currentState = 'swapping';
                this.currentNode = step.index1;
                this.parentNode = step.index2;
                // Realizar a troca no array
                [this.array[step.index1], this.array[step.index2]] = [this.array[step.index2], this.array[step.index1]];
                this.updateOperationDetails(step.message);
                break;
                
            case 'heap_size_decreased':
                this.currentState = 'extracting';
                this.heapSize = step.heapSize;
                this.updateOperationDetails(step.message);
                break;
                
            case 'reheapify_start':
                this.currentState = 'heapify';
                this.currentNode = step.index;
                this.parentNode = step.index;
                this.leftChild = 2 * step.index + 1;
                this.rightChild = 2 * step.index + 2;
                this.updateOperationDetails(step.message);
                break;
                
            case 'complete':
                this.currentState = 'completo';
                this.array = [...step.array];
                this.updateOperationDetails(step.message);
                break;
        }
        
        this.currentStepIndex++;
        this.renderArray();
        this.renderTree();
        this.updateNodeInfo();
        this.updateCounters();
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        this.currentState = 'completo';
        this.currentNode = -1;
        this.parentNode = -1;
        this.leftChild = -1;
        this.rightChild = -1;
        this.heapSize = 0;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('heapType').disabled = false;
        
        // Verificar ordenação
        const isSorted = this.isArraySorted();
        const sortedCopy = [...this.originalArray].sort((a, b) => 
            this.heapType === 'max' ? a - b : b - a
        );
        const correctSort = JSON.stringify(this.array) === JSON.stringify(sortedCopy);
        
        let message = '';
        if (isSorted && correctSort) {
            message = `🎉 Heap Sort concluído com sucesso!<br>`;
        } else {
            message = `⚠️ Ordenação concluída<br>`;
        }
        
        message += `↳ Tipo de Heap: ${this.heapType === 'max' ? 'Max-Heap' : 'Min-Heap'}<br>`;
        message += `↳ Total de comparações: ${this.comparisons}<br>`;
        message += `↳ Total de trocas: ${this.swaps}<br>`;
        message += `↳ Total de extrações: ${this.extractions}<br>`;
        message += `↳ Array original: [${this.originalArray.join(', ')}]<br>`;
        message += `↳ Array final: [${this.array.join(', ')}]<br>`;
        message += `↳ Ordenação esperada: [${sortedCopy.join(', ')}]`;
        
        if (!correctSort) {
            message += `<br><span style="color: #ff6b6b;">⚠️ O array pode não estar ordenado corretamente!</span>`;
        }
        
        this.updateOperationDetails(message);
        
        // Marcar todos como ordenados
        const elements = document.querySelectorAll('.array-element, .tree-node');
        elements.forEach(el => {
            el.classList.remove('unsorted', 'heap', 'heapified', 'comparing', 'swapping', 'root');
            el.classList.add('sorted');
        });
        
        this.renderTree();
        this.updateNodeInfo();
        this.updateCounters();
    }
    
    isArraySorted() {
        for (let i = 1; i < this.array.length; i++) {
            if (this.heapType === 'max') {
                if (this.array[i] < this.array[i - 1]) {
                    return false;
                }
            } else {
                if (this.array[i] > this.array[i - 1]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    togglePause() {
        if (!this.isSorting) return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            clearInterval(this.sortingInterval);
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
            this.updateOperationDetails('⏸️ Ordenação pausada. Clique em "Continuar" para retomar.');
        } else {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            this.updateOperationDetails('▶️ Retomando ordenação...');
        }
        
        this.updateCounters();
    }
    
    reset() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        this.isPaused = false;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('heapType').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        this.generateNewArray();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HeapSortVisualizer();
});