class SelectionSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 12;
        this.speed = 15;
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        this.currentPass = 0;
        this.currentIndex = 0;
        this.minIndex = 0;
        this.comparisons = 0;
        this.swaps = 0;
        this.totalPasses = 0;
        this.state = 'FINDING_MIN'; // Estados: FINDING_MIN, SWAPPING
        this.swapDelay = 0;
        
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
        // Fórmula ajustada para velocidade lenta
        // Velocidade 1: 2000ms (2 segundos)
        // Velocidade 40: 100ms
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
        // Gerar números únicos para melhor visualização
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
        this.currentPass = 0;
        this.currentIndex = 0;
        this.minIndex = 0;
        this.comparisons = 0;
        this.swaps = 0;
        this.state = 'FINDING_MIN';
        this.swapDelay = 0;
        this.totalPasses = this.arraySize - 1;
        
        document.getElementById('comparisonCount').textContent = '0';
        document.getElementById('swapCount').textContent = '0';
        document.getElementById('passCount').textContent = '0';
        document.getElementById('statusText').textContent = 'Ready';
        document.getElementById('passCount').textContent = `0/${this.totalPasses}`;
        document.getElementById('currentMinValue').textContent = '-';
        document.getElementById('currentMinIndex').textContent = '-';
    }
    
    renderArray() {
        const container = document.getElementById('arrayContainer');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.array);
        const containerHeight = container.clientHeight - 40;
        
        this.array.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.style.height = `${(value / maxValue) * containerHeight}px`;
            bar.style.width = `calc(90% / ${this.arraySize})`;
            bar.textContent = value;
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
        
        this.updateBarClasses();
    }
    
    updateBarClasses() {
        const bars = document.querySelectorAll('.array-bar');
        bars.forEach((bar, index) => {
            // Reset all classes
            bar.className = 'array-bar';
            
            // Add base class
            if (index < this.currentPass) {
                bar.classList.add('sorted');
            } else {
                bar.classList.add('unsorted');
            }
            
            // Highlight based on state
            if (this.isSorting) {
                if (this.state === 'FINDING_MIN') {
                    if (index === this.minIndex) {
                        bar.classList.add('current-min');
                    }
                    if (index === this.currentIndex && index >= this.currentPass) {
                        bar.classList.add('comparing');
                    }
                } else if (this.state === 'SWAPPING') {
                    if (index === this.currentPass || index === this.minIndex) {
                        bar.classList.add('swapping');
                    }
                }
            }
        });
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        this.isPaused = false;
        this.currentPass = 0;
        this.minIndex = this.currentPass;
        this.currentIndex = this.currentPass + 1;
        this.state = 'FINDING_MIN';
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('statusText').textContent = 'Finding minimum...';
        
        this.updateCurrentMinInfo();
        this.updateBarClasses();
        this.sortingInterval = setInterval(() => this.sortStep(), this.getSpeedInterval());
    }
    
    updateCurrentMinInfo() {
        document.getElementById('currentMinValue').textContent = this.array[this.minIndex];
        document.getElementById('currentMinIndex').textContent = this.minIndex;
    }
    
    sortStep() {
        if (this.currentPass >= this.arraySize) {
            this.finishSorting();
            return;
        }
        
        document.getElementById('passCount').textContent = `${this.currentPass + 1}/${this.totalPasses + 1}`;
        
        if (this.state === 'FINDING_MIN') {
            this.findMinStep();
        } else if (this.state === 'SWAPPING') {
            this.swapStep();
        }
    }
    
    findMinStep() {
        if (this.currentIndex < this.arraySize) {
            document.getElementById('statusText').textContent = 
                `Pass ${this.currentPass + 1}: Comparing ${this.array[this.currentIndex]} with min ${this.array[this.minIndex]}`;
            
            // Comparação
            this.comparisons++;
            document.getElementById('comparisonCount').textContent = this.comparisons;
            
            // Atualizar mínimo se necessário
            if (this.array[this.currentIndex] < this.array[this.minIndex]) {
                this.minIndex = this.currentIndex;
                this.updateCurrentMinInfo();
            }
            
            this.currentIndex++;
            
            // Atualizar visualização
            this.updateBarClasses();
        } else {
            // Terminou de encontrar o mínimo para esta passagem
            if (this.minIndex !== this.currentPass) {
                // Precisa trocar
                this.state = 'SWAPPING';
                this.swapDelay = 2; // Dar tempo para visualizar antes de trocar
                document.getElementById('statusText').textContent = 
                    `Pass ${this.currentPass + 1}: Ready to swap ${this.array[this.currentPass]} ↔ ${this.array[this.minIndex]}`;
                this.updateBarClasses();
            } else {
                // Não precisa trocar, ir para próxima passagem
                this.nextPass();
            }
        }
    }
    
    swapStep() {
        if (this.swapDelay > 0) {
            this.swapDelay--;
            return;
        }
        
        // Realizar a troca
        [this.array[this.currentPass], this.array[this.minIndex]] = 
        [this.array[this.minIndex], this.array[this.currentPass]];
        
        this.swaps++;
        document.getElementById('swapCount').textContent = this.swaps;
        
        document.getElementById('statusText').textContent = 
            `Pass ${this.currentPass + 1}: Swapped ${this.array[this.minIndex]} ↔ ${this.array[this.currentPass]}`;
        
        // Re-renderizar após troca
        this.renderArray();
        
        // Ir para próxima passagem
        setTimeout(() => {
            this.nextPass();
        }, 300);
    }
    
    nextPass() {
        this.currentPass++;
        
        if (this.currentPass < this.arraySize - 1) {
            this.minIndex = this.currentPass;
            this.currentIndex = this.currentPass + 1;
            this.state = 'FINDING_MIN';
            this.swapDelay = 0;
            
            this.updateCurrentMinInfo();
            document.getElementById('statusText').textContent = `Pass ${this.currentPass + 1}: Finding minimum...`;
            this.updateBarClasses();
        } else if (this.currentPass === this.arraySize - 1) {
            // Último elemento já está na posição correta
            this.currentPass = this.arraySize;
            this.finishSorting();
        } else {
            this.finishSorting();
        }
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        // Marcar todas as barras como ordenadas
        const bars = document.querySelectorAll('.array-bar');
        bars.forEach(bar => {
            bar.classList.remove('unsorted', 'comparing', 'current-min', 'swapping');
            bar.classList.add('sorted');
        });
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('statusText').textContent = 'Sorted!';
        document.getElementById('currentMinValue').textContent = '-';
        document.getElementById('currentMinIndex').textContent = '-';
        document.getElementById('passCount').textContent = `Complete (${this.totalPasses + 1} passes)`;
        
        // Verificar se realmente está ordenado
        const isSorted = this.isArraySorted();
        console.log('Array sorted correctly:', isSorted);
        console.log('Final array:', this.array);
        
        // Mostrar mensagem de conclusão
        setTimeout(() => {
            if (isSorted) {
                alert(`Selection Sort completed successfully!\n\nComparisons: ${this.comparisons}\nSwaps: ${this.swaps}\nTotal passes: ${this.currentPass}`);
            } else {
                alert(`Sorting completed but array may not be fully sorted!\n\nComparisons: ${this.comparisons}\nSwaps: ${this.swaps}\nTotal passes: ${this.currentPass}`);
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
            document.getElementById('statusText').textContent = this.state === 'FINDING_MIN' ? 'Finding minimum...' : 'Swapping...';
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

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SelectionSortVisualizer();
});