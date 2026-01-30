class BubbleSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 15;
        this.speed = 1;
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        this.currentIndex = 0;
        this.currentPass = 0;
        this.comparisons = 0;
        this.swaps = 0;
        this.totalPasses = 0;
        
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
    
    updateSpeedValue() {
        const speedValue = document.getElementById('speedValue');
        if (this.speed <= 5) {
            speedValue.textContent = 'Slow';
        } else if (this.speed <= 10) {
            speedValue.textContent = 'Medium';
        } else if (this.speed <= 15) {
            speedValue.textContent = 'Fast';
        } else {
            speedValue.textContent = 'Very Fast';
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
        this.currentIndex = 0;
        this.currentPass = 0;
        this.comparisons = 0;
        this.swaps = 0;
        this.totalPasses = this.arraySize - 1;
        
        document.getElementById('comparisonCount').textContent = '0';
        document.getElementById('swapCount').textContent = '0';
        document.getElementById('passCount').textContent = '0';
        document.getElementById('statusText').textContent = 'Ready';
        document.getElementById('passCount').textContent = `0/${this.totalPasses}`;
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
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        this.isPaused = false;
        this.resetCounters();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        
        this.sortingInterval = setInterval(() => this.sortStep(), 1000 - (this.speed * 50));
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
            this.sortingInterval = setInterval(() => this.sortStep(), 1000 - (this.speed * 50));
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            document.getElementById('statusText').textContent = 'Sorting...';
        }
    }
    
    sortStep() {
        if (this.currentPass >= this.arraySize - 1) {
            this.finishSorting();
            return;
        }
        
        document.getElementById('statusText').textContent = `Sorting... (Pass ${this.currentPass + 1})`;
        
        // Highlight comparing elements
        this.highlightBars(this.currentIndex, this.currentIndex + 1, 'comparing');
        
        this.comparisons++;
        document.getElementById('comparisonCount').textContent = this.comparisons;
        
        // Compare adjacent elements
        if (this.array[this.currentIndex] > this.array[this.currentIndex + 1]) {
            // Swap elements
            this.highlightBars(this.currentIndex, this.currentIndex + 1, 'swapping');
            
            [this.array[this.currentIndex], this.array[this.currentIndex + 1]] = 
            [this.array[this.currentIndex + 1], this.array[this.currentIndex]];
            
            this.swaps++;
            document.getElementById('swapCount').textContent = this.swaps;
            
            // Re-render after swap
            setTimeout(() => {
                this.renderArray();
                this.markSortedUpTo(this.currentIndex + 1);
            }, 100);
        }
        
        this.currentIndex++;
        
        // Check if we've completed a pass
        if (this.currentIndex >= this.arraySize - this.currentPass - 1) {
            this.markSortedUpTo(this.arraySize - this.currentPass - 1);
            this.currentPass++;
            this.currentIndex = 0;
            document.getElementById('passCount').textContent = `${this.currentPass}/${this.totalPasses}`;
        }
    }
    
    highlightBars(index1, index2, className) {
        const bars = document.querySelectorAll('.array-bar');
        bars[index1].classList.add(className);
        bars[index2].classList.add(className);
        
        // Remove highlight after a delay
        setTimeout(() => {
            if (bars[index1]) bars[index1].classList.remove(className);
            if (bars[index2]) bars[index2].classList.remove(className);
        }, 300);
    }
    
    markSortedUpTo(index) {
        const bars = document.querySelectorAll('.array-bar');
        for (let i = this.arraySize - 1; i >= index; i--) {
            if (bars[i]) {
                bars[i].classList.add('sorted');
            }
        }
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        // Mark all bars as sorted
        const bars = document.querySelectorAll('.array-bar');
        bars.forEach(bar => bar.classList.add('sorted'));
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('statusText').textContent = 'Sorted!';
        
        // Show completion message
        setTimeout(() => {
            alert(`Sorting completed!\n\nComparisons: ${this.comparisons}\nSwaps: ${this.swaps}\nTotal passes: ${this.currentPass}`);
        }, 500);
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
    new BubbleSortVisualizer();
});