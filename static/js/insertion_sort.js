class InsertionSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 12;
        this.speed = 15;
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        
        // Estados do Insertion Sort
        this.currentIndex = 1;
        this.comparingIndex = 0;
        this.currentValue = null;
        this.state = 'PICKING';
        
        // Para mostrar a posição temporária do valor sendo inserido
        this.tempPosition = -1;
        
        // Contadores
        this.comparisons = 0;
        this.shifts = 0;
        this.insertions = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateNewArray();
        this.updateSpeedValue();
    }
    
    setupEventListeners() {
        // Array size slider
        document.getElementById('arraySize').addEventListener('input', (e) => {
            if (!this.isSorting) {
                this.arraySize = parseInt(e.target.value);
                document.getElementById('sizeValue').textContent = this.arraySize;
                this.generateNewArray();
            }
        });
        
        // Speed slider
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.updateSpeedValue();
            
            if (this.isSorting && !this.isPaused) {
                clearInterval(this.sortingInterval);
                this.sortingInterval = setInterval(() => this.sortStep(), this.getSpeedInterval());
            }
        });
        
        // Buttons
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
            speedValue.textContent = 'Very Slow';
        } else if (this.speed <= 20) {
            speedValue.textContent = 'Slow';
        } else if (this.speed <= 30) {
            speedValue.textContent = 'Medium';
        } else {
            speedValue.textContent = 'Fast';
        }
    }
    
    generateNewArray() {
        this.array = [];
        const usedNumbers = new Set();
        while (this.array.length < this.arraySize) {
            const num = Math.floor(Math.random() * 95) + 5;
            if (!usedNumbers.has(num)) {
                usedNumbers.add(num);
                this.array.push(num);
            }
        }
        this.resetCounters();
        this.renderArray();
    }
    
    resetCounters() {
        this.currentIndex = 1;
        this.comparingIndex = 0;
        this.currentValue = null;
        this.state = 'PICKING';
        this.tempPosition = -1;
        this.comparisons = 0;
        this.shifts = 0;
        this.insertions = 0;
        
        document.getElementById('comparisonCount').textContent = '0';
        document.getElementById('shiftCount').textContent = '0';
        document.getElementById('insertionCount').textContent = '0';
        document.getElementById('currentIndex').textContent = '-';
        document.getElementById('statusText').textContent = 'Ready';
        document.getElementById('currentElementValue').textContent = '-';
        document.getElementById('currentElementIndex').textContent = '-';
    }
    
    renderArray() {
        const container = document.getElementById('arrayContainer');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.array);
        const containerHeight = container.clientHeight - 40;
        
        // Primeiro, criar um array temporário para renderização
        // que mostra o valor atual sendo movido
        const displayArray = [...this.array];
        
        // Se estamos no meio de um shift, mostrar o valor atual na posição temporária
        if (this.state === 'SHIFTING' && this.tempPosition !== -1) {
            // Não modificamos o array principal durante a renderização
            // Apenas mostramos visualmente
        }
        
        this.array.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.style.height = `${(value / maxValue) * containerHeight}px`;
            bar.style.width = `calc(90% / ${this.arraySize})`;
            
            // Se este é o valor que está sendo movido temporariamente
            if (this.state === 'SHIFTING' && index === this.comparingIndex + 1) {
                // Mostrar que esta posição está vazia (sendo ocupada pelo shift)
                bar.textContent = '←';
                bar.style.color = '#ff5400';
            } else {
                bar.textContent = value;
            }
            
            bar.dataset.index = index;
            bar.dataset.value = value;
            
            // Add index label at bottom
            const indexLabel = document.createElement('div');
            indexLabel.className = 'index-label';
            indexLabel.textContent = index;
            indexLabel.style.position = 'absolute';
            indexLabel.style.bottom = '-25px';
            indexLabel.style.left = '50%';
            indexLabel.style.transform = 'translateX(-50%)';
            indexLabel.style.color = '#a9a9a9';
            indexLabel.style.fontSize = '0.8rem';
            
            bar.appendChild(indexLabel);
            container.appendChild(bar);
        });
        
        // Adicionar uma barra especial para mostrar o valor atual sendo movido
        if (this.currentValue !== null && this.state !== 'INSERTING') {
            this.addTempValueBar(container, maxValue, containerHeight);
        }
        
        this.updateBarClasses();
    }
    
    addTempValueBar(container, maxValue, containerHeight) {
        const tempBar = document.createElement('div');
        tempBar.className = 'array-bar temp-value';
        tempBar.style.height = `${(this.currentValue / maxValue) * containerHeight}px`;
        tempBar.style.width = `calc(90% / ${this.arraySize})`;
        tempBar.textContent = this.currentValue;
        tempBar.style.position = 'absolute';
        tempBar.style.bottom = '20px';
        
        // Posicionar a barra temporária
        if (this.state === 'PICKING' || this.state === 'COMPARING') {
            // Mostrar acima da posição original
            const leftPosition = (this.currentIndex / this.arraySize) * 90 + 5;
            tempBar.style.left = `${leftPosition}%`;
            tempBar.style.backgroundColor = '#f72585';
            tempBar.style.boxShadow = '0 0 20px rgba(247, 37, 133, 0.8)';
        } else if (this.state === 'SHIFTING') {
            // Mostrar se movendo para a esquerda
            const targetPosition = (this.comparingIndex + 1) / this.arraySize * 90 + 5;
            tempBar.style.left = `${targetPosition}%`;
            tempBar.style.backgroundColor = '#ff5400';
            tempBar.style.boxShadow = '0 0 20px rgba(255, 84, 0, 0.8)';
            tempBar.style.transition = 'left 0.3s ease';
        }
        
        tempBar.style.zIndex = '100';
        tempBar.style.border = '2px solid white';
        container.appendChild(tempBar);
    }
    
    updateBarClasses() {
        const bars = document.querySelectorAll('.array-bar:not(.temp-value)');
        bars.forEach((bar, index) => {
            bar.className = 'array-bar';
            
            // Base class
            if (index < this.currentIndex && this.state !== 'SHIFTING') {
                bar.classList.add('sorted');
            } else {
                bar.classList.add('unsorted');
            }
            
            // Highlight based on state
            if (this.isSorting) {
                if (this.state === 'PICKING' && index === this.currentIndex) {
                    bar.classList.add('current');
                } else if (this.state === 'COMPARING') {
                    if (index === this.currentIndex) {
                        bar.classList.add('current');
                    }
                    if (index === this.comparingIndex) {
                        bar.classList.add('comparing');
                    }
                } else if (this.state === 'SHIFTING') {
                    if (index === this.comparingIndex) {
                        bar.classList.add('shifting');
                    }
                    if (index === this.comparingIndex + 1) {
                        bar.classList.add('empty');
                    }
                }
            }
        });
    }
    
    updateCurrentElementInfo() {
        document.getElementById('currentElementValue').textContent = this.currentValue;
        document.getElementById('currentElementIndex').textContent = this.currentIndex;
        document.getElementById('currentIndex').textContent = this.currentIndex;
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        this.isPaused = false;
        this.currentIndex = 1;
        this.comparingIndex = this.currentIndex - 1;
        this.currentValue = this.array[this.currentIndex];
        this.state = 'PICKING';
        this.tempPosition = -1;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('statusText').textContent = 'Picking element...';
        
        this.updateCurrentElementInfo();
        this.renderArray();
        this.sortingInterval = setInterval(() => this.sortStep(), this.getSpeedInterval());
    }
    
    sortStep() {
        if (this.currentIndex >= this.array.length) {
            this.finishSorting();
            return;
        }
        
        switch (this.state) {
            case 'PICKING':
                this.pickingStep();
                break;
            case 'COMPARING':
                this.comparingStep();
                break;
            case 'SHIFTING':
                this.shiftingStep();
                break;
            case 'INSERTING':
                this.insertingStep();
                break;
        }
    }
    
    pickingStep() {
        this.currentValue = this.array[this.currentIndex];
        this.comparingIndex = this.currentIndex - 1;
        this.state = 'COMPARING';
        
        document.getElementById('statusText').textContent = 
            `Picked element ${this.currentValue} from index ${this.currentIndex}`;
        
        this.updateCurrentElementInfo();
        this.renderArray();
    }
    
    comparingStep() {
        if (this.comparingIndex >= 0 && this.array[this.comparingIndex] > this.currentValue) {
            // Element needs to shift
            this.comparisons++;
            document.getElementById('comparisonCount').textContent = this.comparisons;
            
            document.getElementById('statusText').textContent = 
                `${this.array[this.comparingIndex]} > ${this.currentValue}, need to shift`;
            
            this.state = 'SHIFTING';
            this.renderArray();
        } else {
            // Found insertion point
            this.comparisons++;
            document.getElementById('comparisonCount').textContent = this.comparisons;
            
            const insertPos = this.comparingIndex + 1;
            document.getElementById('statusText').textContent = 
                `Found position for ${this.currentValue} at index ${insertPos}`;
            
            this.state = 'INSERTING';
            this.renderArray();
        }
    }
    
    shiftingStep() {
        // Mostrar visualmente o shift
        document.getElementById('statusText').textContent = 
            `Shifting ${this.array[this.comparingIndex]} from index ${this.comparingIndex} to ${this.comparingIndex + 1}`;
        
        // Realizar o shift no array
        this.array[this.comparingIndex + 1] = this.array[this.comparingIndex];
        this.shifts++;
        document.getElementById('shiftCount').textContent = this.shifts;
        
        // Move to next comparison
        this.comparingIndex--;
        
        // Re-render para mostrar o shift
        this.renderArray();
        
        // Voltar para comparação
        setTimeout(() => {
            this.state = 'COMPARING';
        }, 500);
    }
    
    insertingStep() {
        // Calcular posição de inserção
        const insertPos = this.comparingIndex + 1;
        
        // Inserir o valor atual
        this.array[insertPos] = this.currentValue;
        this.insertions++;
        document.getElementById('insertionCount').textContent = this.insertions;
        
        document.getElementById('statusText').textContent = 
            `Inserting ${this.currentValue} at index ${insertPos}`;
        
        // Mover para o próximo elemento
        this.currentIndex++;
        
        // Re-render após inserção
        this.renderArray();
        
        // Verificar se terminou
        if (this.currentIndex < this.array.length) {
            setTimeout(() => {
                this.state = 'PICKING';
                this.currentValue = this.array[this.currentIndex];
                this.comparingIndex = this.currentIndex - 1;
                this.updateCurrentElementInfo();
            }, 500);
        }
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        const bars = document.querySelectorAll('.array-bar');
        bars.forEach(bar => {
            bar.classList.remove('unsorted', 'current', 'comparing', 'shifting', 'empty');
            bar.classList.add('sorted');
        });
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('statusText').textContent = 'Sorted!';
        document.getElementById('currentElementValue').textContent = '-';
        document.getElementById('currentElementIndex').textContent = '-';
        document.getElementById('currentIndex').textContent = 'Complete';
        
        const isSorted = this.isArraySorted();
        
        setTimeout(() => {
            if (isSorted) {
                alert(`Insertion Sort completed!\n\nComparisons: ${this.comparisons}\nShifts: ${this.shifts}\nInsertions: ${this.insertions}`);
            } else {
                alert(`Sorting completed!\n\nComparisons: ${this.comparisons}\nShifts: ${this.shifts}\nInsertions: ${this.insertions}`);
            }
        }, 500);
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
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            document.getElementById('statusText').textContent = 'Paused';
        } else {
            this.sortingInterval = setInterval(() => this.sortStep(), this.getSpeedInterval());
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            document.getElementById('statusText').textContent = this.getStatusMessage();
        }
    }
    
    getStatusMessage() {
        switch (this.state) {
            case 'PICKING': return 'Picking element...';
            case 'COMPARING': return 'Comparing elements...';
            case 'SHIFTING': return 'Shifting element...';
            case 'INSERTING': return 'Inserting element...';
            default: return 'Sorting...';
        }
    }
    
    reset() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        this.isPaused = false;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        this.generateNewArray();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InsertionSortVisualizer();
});