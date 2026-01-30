class QuickSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 16;
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
        
        // Estado atual
        this.currentState = 'pronto';
        this.currentPivot = null;
        this.currentPivotIndex = -1;
        this.leftPointer = 0;
        this.rightPointer = 0;
        this.currentLow = 0;
        this.currentHigh = 0;
        
        // Para o algoritmo
        this.stack = [];
        this.currentStep = null;
        this.steps = [];
        this.stepIndex = 0;
        
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
        
        this.stack = [];
        this.currentStep = null;
        this.steps = [];
        this.stepIndex = 0;
        
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
            if (this.currentState === 'pronto') {
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
            }
            
            // Destacar partições
            if (this.currentLow >= 0 && this.currentHigh >= 0) {
                if (index >= this.currentLow && index <= this.currentHigh) {
                    if (this.currentPivotIndex !== -1) {
                        if (index <= this.currentPivotIndex) {
                            bar.classList.add('left-partition');
                        } else {
                            bar.classList.add('right-partition');
                        }
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
        
        if (this.stack.length === 0) {
            container.innerHTML = `
                <div class="stack-empty">
                    <i class="fas fa-code-branch"></i>
                    <p>Aguardando chamadas recursivas...</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.stack.forEach((call, index) => {
            const isActive = index === this.stack.length - 1;
            const callClass = isActive ? 'stack-call active' : 'stack-call';
            
            html += `
                <div class="${callClass}">
                    <div class="stack-call-header">
                        <div class="stack-call-title">${call.type === 'partition' ? 'Particionamento' : 'Quick Sort'} ${index + 1}</div>
                        <div class="stack-call-range">[${call.low}, ${call.high}]</div>
                    </div>
                    <div class="stack-call-pivot">
                        <span>Pivô:</span>
                        <span class="pivot-badge">${call.pivotValue || '-'}</span>
                        <span>${call.pivotIndex !== undefined ? `no índice ${call.pivotIndex}` : 'a escolher'}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
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
            case 'particionando': return 'Particionando...';
            case 'comparando': return 'Comparando...';
            case 'trocando': return 'Trocando...';
            case 'recursao': return 'Recursão...';
            case 'ordenado': return 'Ordenado!';
            case 'pronto': return 'Pronto';
            default: return 'Ordenando...';
        }
    }
    
    choosePivot(low, high) {
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
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('pivotStrategy').disabled = true;
        
        // Iniciar com o array completo
        this.stack.push({
            type: 'quicksort',
            low: 0,
            high: this.array.length - 1,
            depth: 0
        });
        
        // Iniciar o processo
        this.nextStep();
        
        if (!this.isPaused) {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
        }
    }
    
    nextStep() {
        if (!this.isSorting || this.isPaused) return;
        
        // Se não há chamadas na pilha, terminou
        if (this.stack.length === 0) {
            this.finishSorting();
            return;
        }
        
        const currentCall = this.stack[this.stack.length - 1];
        
        if (currentCall.type === 'quicksort') {
            this.processQuickSortCall(currentCall);
        } else if (currentCall.type === 'partition') {
            this.processPartitionCall(currentCall);
        }
    }
    
    processQuickSortCall(call) {
        const { low, high } = call;
        
        // Caso base: array de tamanho 0 ou 1
        if (low >= high) {
            this.stack.pop();
            
            if (low === high) {
                this.currentState = 'ordenado';
                this.currentPivot = this.array[low];
                this.currentPivotIndex = low;
                this.currentLow = low;
                this.currentHigh = high;
                
                this.updatePartitionInfo(`Caso base: elemento ${this.array[low]} na posição ${low} já está ordenado`);
                this.renderArray();
                this.renderCallStack();
                this.updateCounters();
            }
            return;
        }
        
        // Escolher pivô
        const pivotIndex = this.choosePivot(low, high);
        const pivotValue = this.array[pivotIndex];
        
        this.currentState = 'escolhendo_pivo';
        this.currentPivot = pivotValue;
        this.currentPivotIndex = pivotIndex;
        this.currentLow = low;
        this.currentHigh = high;
        this.leftPointer = low - 1;
        this.rightPointer = low;
        
        this.updatePartitionInfo(
            `Escolhendo pivô para partição [${low}, ${high}]: ${pivotValue} no índice ${pivotIndex}<br>
             ↳ Estratégia: ${this.getPivotStrategyName()}`
        );
        
        // Remover esta chamada e adicionar particionamento
        this.stack.pop();
        this.stack.push({
            type: 'partition',
            low: low,
            high: high,
            pivotIndex: pivotIndex,
            pivotValue: pivotValue,
            depth: call.depth,
            i: low - 1,
            j: low,
            state: 'move_pivot'
        });
        
        this.renderArray();
        this.renderCallStack();
        this.updateCounters();
    }
    
    processPartitionCall(call) {
        const { low, high, pivotIndex, pivotValue, i, j, state } = call;
        
        if (state === 'move_pivot') {
            // Mover pivô para o final
            if (pivotIndex !== high) {
                this.currentState = 'trocando';
                this.currentPivotIndex = high;
                this.leftPointer = pivotIndex;
                this.rightPointer = high;
                
                this.updatePartitionInfo(`Movendo pivô ${pivotValue} para o final (índice ${high})`);
                
                // Realizar a troca
                [this.array[pivotIndex], this.array[high]] = [this.array[high], this.array[pivotIndex]];
                this.swaps++;
                
                // Atualizar chamada
                call.pivotIndex = high;
                call.state = 'partitioning';
                call.i = low - 1;
                call.j = low;
            } else {
                call.state = 'partitioning';
            }
        } else if (state === 'partitioning') {
            if (call.j < high) {
                const currentValue = this.array[call.j];
                
                this.currentState = 'comparando';
                this.currentPivot = pivotValue;
                this.currentPivotIndex = high;
                this.currentLow = low;
                this.currentHigh = high;
                this.leftPointer = call.i;
                this.rightPointer = call.j;
                
                this.comparisons++;
                
                if (currentValue <= pivotValue) {
                    call.i++;
                    
                    if (call.i !== call.j) {
                        this.currentState = 'trocando';
                        
                        this.updatePartitionInfo(
                            `Comparando: ${currentValue} ≤ ${pivotValue}<br>
                             ↳ Trocar ${this.array[call.i]} (${call.i}) ↔ ${this.array[call.j]} (${call.j})`
                        );
                        
                        // Realizar troca
                        [this.array[call.i], this.array[call.j]] = [this.array[call.j], this.array[call.i]];
                        this.swaps++;
                    } else {
                        this.updatePartitionInfo(
                            `Comparando: ${currentValue} ≤ ${pivotValue}<br>
                             ↳ ${currentValue} já está na posição correta`
                        );
                    }
                } else {
                    this.updatePartitionInfo(
                        `Comparando: ${currentValue} > ${pivotValue}<br>
                         ↳ Manter ${currentValue} na partição direita`
                    );
                }
                
                call.j++;
            } else {
                // Terminou de percorrer o array
                const finalPivotIndex = call.i + 1;
                
                this.currentState = 'trocando';
                this.leftPointer = finalPivotIndex;
                this.rightPointer = high;
                
                this.updatePartitionInfo(`Colocando pivô ${pivotValue} na posição final ${finalPivotIndex}`);
                
                if (finalPivotIndex !== high) {
                    [this.array[finalPivotIndex], this.array[high]] = [this.array[high], this.array[finalPivotIndex]];
                    this.swaps++;
                }
                
                this.partitions++;
                this.recursionDepth = Math.max(this.recursionDepth, call.depth + 1);
                
                // Particionamento completo
                this.stack.pop();
                
                // Adicionar chamadas recursivas para as partições
                if (low < finalPivotIndex - 1) {
                    this.stack.push({
                        type: 'quicksort',
                        low: low,
                        high: finalPivotIndex - 1,
                        depth: call.depth + 1
                    });
                }
                
                if (finalPivotIndex + 1 < high) {
                    this.stack.push({
                        type: 'quicksort',
                        low: finalPivotIndex + 1,
                        high: high,
                        depth: call.depth + 1
                    });
                }
                
                this.updatePartitionInfo(
                    `Particionamento completo!<br>
                     ↳ Pivô ${pivotValue} na posição ${finalPivotIndex}<br>
                     ↳ Partição esquerda: [${this.array.slice(low, finalPivotIndex).join(', ')}]<br>
                     ↳ Partição direita: [${this.array.slice(finalPivotIndex + 1, high + 1).join(', ')}]`
                );
            }
        }
        
        this.renderArray();
        this.renderCallStack();
        this.updateCounters();
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
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        this.currentState = 'ordenado';
        this.currentPivot = null;
        this.currentPivotIndex = -1;
        this.leftPointer = 0;
        this.rightPointer = 0;
        this.currentLow = 0;
        this.currentHigh = this.array.length - 1;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pivotStrategy').disabled = false;
        
        // Verificar se está ordenado
        const isSorted = this.isArraySorted();
        
        let message = `🎉 Ordenação Quick Sort concluída com sucesso!<br>`;
        message += `↳ Estratégia do pivô: ${this.getPivotStrategyName()}<br>`;
        message += `↳ Total de comparações: ${this.comparisons}<br>`;
        message += `↳ Total de trocas: ${this.swaps}<br>`;
        message += `↳ Total de partições: ${this.partitions}<br>`;
        message += `↳ Profundidade máxima de recursão: ${this.recursionDepth}<br>`;
        message += `↳ Array final: [${this.array.join(', ')}]`;
        
        if (!isSorted) {
            message += `<br><span style="color: #ff6b6b;">⚠️ ATENÇÃO: O array pode não estar completamente ordenado!</span>`;
        }
        
        this.updatePartitionInfo(message);
        
        // Marcar todos como ordenados
        const bars = document.querySelectorAll('.array-bar');
        bars.forEach(bar => {
            bar.classList.remove('unsorted', 'pivot', 'comparing', 'swapping', 'left-partition', 'right-partition');
            bar.classList.add('sorted');
        });
        
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