class QuickSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 8; // Reduzido para melhor visualização
        this.speed = 15;
        this.pivotStrategy = 'middle';
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        
        // Contadores
        this.comparisons = 0;
        this.swaps = 0;
        this.partitions = 0;
        this.recursionDepth = 0;
        
        // Para o algoritmo
        this.originalArray = [];
        this.sortedArray = [];
        this.steps = [];
        this.currentStepIndex = 0;
        this.isReady = false;
        
        // Estado atual
        this.currentState = 'pronto';
        this.currentPivot = null;
        this.currentPivotIndex = -1;
        this.leftPointer = 0;
        this.rightPointer = 0;
        this.currentLow = 0;
        this.currentHigh = 0;
        this.comparingValue = null;
        
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
        
        document.getElementById('pivotStrategy').addEventListener('change', (e) => {
            this.pivotStrategy = e.target.value;
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
    }
    
    resetCounters() {
        this.comparisons = 0;
        this.swaps = 0;
        this.partitions = 0;
        this.recursionDepth = 0;
        
        this.currentState = 'pronto';
        this.currentPivot = null;
        this.currentPivotIndex = -1;
        this.leftPointer = 0;
        this.rightPointer = 0;
        this.currentLow = 0;
        this.currentHigh = this.array.length - 1;
        this.comparingValue = null;
        
        this.steps = [];
        this.currentStepIndex = 0;
        this.isReady = false;
        
        document.getElementById('comparisonCount').textContent = '0';
        document.getElementById('swapCount').textContent = '0';
        document.getElementById('partitionCount').textContent = '0';
        document.getElementById('recursionDepth').textContent = '0';
        document.getElementById('statusText').textContent = 'Pronto';
        document.getElementById('currentPivot').textContent = '-';
        document.getElementById('pivotIndex').textContent = 'Índice: -';
        document.getElementById('leftPointer').textContent = '0';
        document.getElementById('rightPointer').textContent = '0';
        
        this.updatePartitionInfo('Array gerado. Clique em "Iniciar" para começar a ordenação.');
        this.renderCallStack();
    }
    
    updatePartitionInfo(message) {
        document.getElementById('partitionInfo').innerHTML = `<p>${message}</p>`;
    }
    
    renderArray() {
        const container = document.getElementById('mainArray');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.array);
        const containerHeight = 200;
        
        this.array.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.style.height = `${(value / maxValue) * containerHeight}px`;
            bar.innerHTML = `
                <div class="value">${value}</div>
                <div class="index">${index}</div>
            `;
            
            // Aplicar classes baseado no estado
            if (this.currentState === 'pronto' || this.currentState === 'completo') {
                bar.classList.add('unsorted');
            } else if (index === this.currentPivotIndex) {
                bar.classList.add('pivot');
            } else if (this.currentState === 'comparando') {
                if (index === this.leftPointer || index === this.rightPointer) {
                    bar.classList.add('comparing');
                }
            } else if (this.currentState === 'trocando') {
                if (index === this.leftPointer || index === this.rightPointer) {
                    bar.classList.add('swapping');
                }
            } else if (this.currentState === 'ordenado') {
                bar.classList.add('sorted');
            }
            
            // Destacar partições
            if (this.currentState !== 'pronto' && this.currentState !== 'completo') {
                if (index >= this.currentLow && index <= this.currentHigh) {
                    if (index < this.currentPivotIndex) {
                        bar.classList.add('left-partition');
                    } else if (index > this.currentPivotIndex) {
                        bar.classList.add('right-partition');
                    }
                } else if (index < this.currentLow || index > this.currentHigh) {
                    bar.classList.add('sorted');
                }
            }
            
            container.appendChild(bar);
        });
    }
    
    renderCallStack() {
        const container = document.getElementById('callStack');
        
        if (this.steps.length === 0 || this.currentStepIndex === 0) {
            container.innerHTML = `
                <div class="stack-empty">
                    <i class="fas fa-code-branch"></i>
                    <p>Aguardando chamadas recursivas...</p>
                </div>
            `;
            return;
        }
        
        // Mostrar histórico dos últimos passos
        let html = '';
        const start = Math.max(0, this.currentStepIndex - 5);
        const end = this.currentStepIndex;
        
        for (let i = start; i < end; i++) {
            const step = this.steps[i];
            if (step.type === 'partition_start' || step.type === 'recursive_call') {
                const callClass = i === end - 1 ? 'stack-call active' : 'stack-call';
                html += `
                    <div class="${callClass}">
                        <div class="stack-call-header">
                            <div class="stack-call-title">${step.type === 'partition_start' ? 'Particionamento' : 'Chamada Recursiva'}</div>
                            <div class="stack-call-range">[${step.low}, ${step.high}]</div>
                        </div>
                        <div class="stack-call-pivot">
                            <span>Pivô:</span>
                            <span class="pivot-badge">${step.pivotValue || '-'}</span>
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html || `
            <div class="stack-empty">
                <i class="fas fa-code-branch"></i>
                <p>Processando...</p>
            </div>
        `;
    }
    
    updateCounters() {
        document.getElementById('comparisonCount').textContent = this.comparisons;
        document.getElementById('swapCount').textContent = this.swaps;
        document.getElementById('partitionCount').textContent = this.partitions;
        document.getElementById('recursionDepth').textContent = this.recursionDepth;
        document.getElementById('statusText').textContent = this.getStatusText();
        document.getElementById('currentPivot').textContent = this.currentPivot !== null ? this.currentPivot : '-';
        document.getElementById('pivotIndex').textContent = `Índice: ${this.currentPivotIndex !== -1 ? this.currentPivotIndex : '-'}`;
        document.getElementById('leftPointer').textContent = this.leftPointer;
        document.getElementById('rightPointer').textContent = this.rightPointer;
    }
    
    getStatusText() {
        switch(this.currentState) {
            case 'escolhendo_pivo': return 'Escolhendo pivô...';
            case 'movendo_pivo': return 'Movendo pivô...';
            case 'particionando': return 'Particionando...';
            case 'comparando': return 'Comparando...';
            case 'trocando': return 'Trocando...';
            case 'reposicionando_pivo': return 'Reposicionando pivô...';
            case 'chamada_recursiva': return 'Chamada recursiva...';
            case 'ordenado': return 'Ordenado!';
            case 'pronto': return 'Pronto';
            case 'completo': return 'Completo';
            default: return 'Ordenando...';
        }
    }
    
    choosePivotIndex(low, high) {
        switch(this.pivotStrategy) {
            case 'first':
                return low;
            case 'last':
                return high;
            case 'middle':
                return Math.floor((low + high) / 2);
            case 'random':
                return Math.floor(Math.random() * (high - low + 1)) + low;
            default:
                return Math.floor((low + high) / 2);
        }
    }
    
    getPivotStrategyName() {
        switch(this.pivotStrategy) {
            case 'first': return 'Primeiro Elemento';
            case 'last': return 'Último Elemento';
            case 'middle': return 'Elemento do Meio';
            case 'random': return 'Aleatório';
            default: return 'Elemento do Meio';
        }
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('pivotStrategy').disabled = true;
        
        // Salvar array original
        this.originalArray = [...this.array];
        
        // Gerar todos os passos do algoritmo
        this.generateQuickSortSteps();
        
        // Iniciar com o primeiro passo
        this.currentStepIndex = 0;
        this.nextStep();
        
        if (!this.isPaused) {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
        }
    }
    
    generateQuickSortSteps() {
        this.steps = [];
        const arrayCopy = [...this.array];
        
        const quickSort = (arr, low, high, depth) => {
            if (low < high) {
                // Escolher pivô
                const pivotIndex = this.choosePivotIndex(low, high);
                const pivotValue = arr[pivotIndex];
                
                this.steps.push({
                    type: 'choose_pivot',
                    low: low,
                    high: high,
                    pivotIndex: pivotIndex,
                    pivotValue: pivotValue,
                    depth: depth,
                    array: [...arr]
                });
                
                // Mover pivô para o final
                if (pivotIndex !== high) {
                    this.steps.push({
                        type: 'move_pivot',
                        low: low,
                        high: high,
                        fromIndex: pivotIndex,
                        toIndex: high,
                        pivotValue: pivotValue,
                        array: [...arr]
                    });
                    
                    [arr[pivotIndex], arr[high]] = [arr[high], arr[pivotIndex]];
                }
                
                this.steps.push({
                    type: 'partition_start',
                    low: low,
                    high: high,
                    pivotIndex: high, // Após mover, o pivô está no final
                    pivotValue: pivotValue,
                    array: [...arr]
                });
                
                let i = low - 1;
                
                // Particionamento
                for (let j = low; j < high; j++) {
                    this.steps.push({
                        type: 'compare',
                        low: low,
                        high: high,
                        j: j,
                        i: i,
                        value: arr[j],
                        pivotValue: pivotValue,
                        array: [...arr]
                    });
                    
                    if (arr[j] <= pivotValue) {
                        i++;
                        
                        if (i !== j) {
                            this.steps.push({
                                type: 'swap',
                                low: low,
                                high: high,
                                i: i,
                                j: j,
                                valueI: arr[i],
                                valueJ: arr[j],
                                pivotValue: pivotValue,
                                array: [...arr]
                            });
                            
                            [arr[i], arr[j]] = [arr[j], arr[i]];
                        }
                    }
                }
                
                // Reposicionar pivô
                const finalPivotIndex = i + 1;
                
                if (finalPivotIndex !== high) {
                    this.steps.push({
                        type: 'reposition_pivot',
                        low: low,
                        high: high,
                        fromIndex: high,
                        toIndex: finalPivotIndex,
                        pivotValue: pivotValue,
                        array: [...arr]
                    });
                    
                    [arr[finalPivotIndex], arr[high]] = [arr[high], arr[finalPivotIndex]];
                }
                
                this.steps.push({
                    type: 'partition_complete',
                    low: low,
                    high: high,
                    pivotIndex: finalPivotIndex,
                    pivotValue: pivotValue,
                    leftPartition: arr.slice(low, finalPivotIndex),
                    rightPartition: arr.slice(finalPivotIndex + 1, high + 1),
                    array: [...arr]
                });
                
                // Chamadas recursivas
                if (low < finalPivotIndex - 1) {
                    this.steps.push({
                        type: 'recursive_call',
                        side: 'left',
                        low: low,
                        high: finalPivotIndex - 1,
                        depth: depth + 1
                    });
                    quickSort(arr, low, finalPivotIndex - 1, depth + 1);
                }
                
                if (finalPivotIndex + 1 < high) {
                    this.steps.push({
                        type: 'recursive_call',
                        side: 'right',
                        low: finalPivotIndex + 1,
                        high: high,
                        depth: depth + 1
                    });
                    quickSort(arr, finalPivotIndex + 1, high, depth + 1);
                }
            } else if (low === high) {
                // Caso base
                this.steps.push({
                    type: 'base_case',
                    index: low,
                    value: arr[low]
                });
            }
        };
        
        quickSort(arrayCopy, 0, arrayCopy.length - 1, 0);
        
        // Adicionar passo final
        this.steps.push({
            type: 'complete',
            array: [...arrayCopy]
        });
        
        this.sortedArray = arrayCopy;
    }
    
    nextStep() {
        if (!this.isSorting || this.isPaused) return;
        
        if (this.currentStepIndex >= this.steps.length) {
            this.finishSorting();
            return;
        }
        
        const step = this.steps[this.currentStepIndex];
        
        switch(step.type) {
            case 'choose_pivot':
                this.currentState = 'escolhendo_pivo';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.pivotIndex;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = -1;
                this.rightPointer = -1;
                this.array = [...step.array];
                
                this.updatePartitionInfo(
                    `Escolhendo pivô para partição [${step.low}, ${step.high}]: ${step.pivotValue} no índice ${step.pivotIndex}<br>
                     ↳ Estratégia: ${this.getPivotStrategyName()}`
                );
                break;
                
            case 'move_pivot':
                this.currentState = 'movendo_pivo';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.toIndex;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = step.fromIndex;
                this.rightPointer = step.toIndex;
                this.array = [...step.array];
                this.swaps++;
                
                this.updatePartitionInfo(
                    `Movendo pivô ${step.pivotValue} do índice ${step.fromIndex} para o final (índice ${step.toIndex})<br>
                     ↳ Facilitar o particionamento`
                );
                break;
                
            case 'partition_start':
                this.currentState = 'particionando';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.pivotIndex;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = step.low - 1;
                this.rightPointer = step.low;
                this.array = [...step.array];
                
                this.updatePartitionInfo(
                    `Iniciando particionamento do subarray [${step.array.slice(step.low, step.high + 1).join(', ')}]<br>
                     ↳ Pivô: ${step.pivotValue} no índice ${step.pivotIndex}`
                );
                break;
                
            case 'compare':
                this.currentState = 'comparando';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.high; // Pivô está no final
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = step.i;
                this.rightPointer = step.j;
                this.comparingValue = step.value;
                this.array = [...step.array];
                this.comparisons++;
                
                this.updatePartitionInfo(
                    `Comparando elemento ${step.value} (índice ${step.j}) com pivô ${step.pivotValue}<br>
                     ↳ ${step.value} ${step.value <= step.pivotValue ? '≤' : '>'} ${step.pivotValue}`
                );
                break;
                
            case 'swap':
                this.currentState = 'trocando';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.high;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = step.i;
                this.rightPointer = step.j;
                this.array = [...step.array];
                this.swaps++;
                
                this.updatePartitionInfo(
                    `Trocando elementos:<br>
                     ↳ ${step.valueI} (índice ${step.i}) ↔ ${step.valueJ} (índice ${step.j})<br>
                     ↳ ${step.valueJ} ≤ ${step.pivotValue}, mover para esquerda do pivô`
                );
                break;
                
            case 'reposition_pivot':
                this.currentState = 'reposicionando_pivo';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.toIndex;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = step.fromIndex;
                this.rightPointer = step.toIndex;
                this.array = [...step.array];
                this.swaps++;
                this.partitions++;
                
                this.updatePartitionInfo(
                    `Reposicionando pivô ${step.pivotValue} para a posição correta ${step.toIndex}`
                );
                break;
                
            case 'partition_complete':
                this.currentState = 'particionando';
                this.currentPivot = step.pivotValue;
                this.currentPivotIndex = step.pivotIndex;
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.leftPointer = -1;
                this.rightPointer = -1;
                this.array = [...step.array];
                
                this.updatePartitionInfo(
                    `Particionamento completo!<br>
                     ↳ Pivô ${step.pivotValue} na posição ${step.pivotIndex}<br>
                     ↳ Partição esquerda: [${step.leftPartition.join(', ')}]<br>
                     ↳ Partição direita: [${step.rightPartition.join(', ')}]`
                );
                break;
                
            case 'recursive_call':
                this.currentState = 'chamada_recursiva';
                this.currentLow = step.low;
                this.currentHigh = step.high;
                this.recursionDepth = Math.max(this.recursionDepth, step.depth);
                
                this.updatePartitionInfo(
                    `Chamando Quick Sort recursivamente na partição ${step.side === 'left' ? 'esquerda' : 'direita'}<br>
                     ↳ Intervalo: [${step.low}, ${step.high}]<br>
                     ↳ Profundidade: ${step.depth}`
                );
                break;
                
            case 'base_case':
                this.currentState = 'ordenado';
                this.currentPivot = step.value;
                this.currentPivotIndex = step.index;
                this.currentLow = step.index;
                this.currentHigh = step.index;
                
                this.updatePartitionInfo(
                    `Caso base: subarray de tamanho 1 [${step.value}] já está ordenado`
                );
                break;
                
            case 'complete':
                this.currentState = 'completo';
                this.array = [...step.array];
                this.finishSorting();
                return;
        }
        
        this.currentStepIndex++;
        this.renderArray();
        this.renderCallStack();
        this.updateCounters();
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        this.currentState = 'completo';
        this.currentPivot = null;
        this.currentPivotIndex = -1;
        this.leftPointer = 0;
        this.rightPointer = 0;
        
        // Restaurar array ordenado
        this.array = [...this.sortedArray];
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pivotStrategy').disabled = false;
        
        // Verificar ordenação
        const isSorted = this.isArraySorted();
        const sortedCopy = [...this.originalArray].sort((a, b) => a - b);
        const correctSort = JSON.stringify(this.array) === JSON.stringify(sortedCopy);
        
        let message = '';
        if (isSorted && correctSort) {
            message = `🎉 Ordenação Quick Sort concluída com sucesso!<br>`;
        } else {
            message = `⚠️ Ordenação concluída com possíveis problemas<br>`;
        }
        
        message += `↳ Estratégia do pivô: ${this.getPivotStrategyName()}<br>`;
        message += `↳ Total de comparações: ${this.comparisons}<br>`;
        message += `↳ Total de trocas: ${this.swaps}<br>`;
        message += `↳ Total de partições: ${this.partitions}<br>`;
        message += `↳ Profundidade máxima de recursão: ${this.recursionDepth}<br>`;
        message += `↳ Array original: [${this.originalArray.join(', ')}]<br>`;
        message += `↳ Array final: [${this.array.join(', ')}]<br>`;
        message += `↳ Ordenação correta: [${sortedCopy.join(', ')}]`;
        
        if (!correctSort) {
            message += `<br><span style="color: #ff6b6b;">⚠️ ERRO: O array não está ordenado corretamente!</span>`;
        }
        
        this.updatePartitionInfo(message);
        
        this.renderArray();
        this.renderCallStack();
        this.updateCounters();
    }
    
    isArraySorted() {
        for (let i = 1; i < this.array.length; i++) {
            if (this.array[i] < this.array[i - 1]) {
                return false;
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
            this.updatePartitionInfo('⏸️ Ordenação pausada. Clique em "Continuar" para retomar.');
        } else {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            this.updatePartitionInfo('▶️ Retomando ordenação...');
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
        document.getElementById('pivotStrategy').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        this.generateNewArray();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuickSortVisualizer();
});