class CountingSortVisualizer {
    constructor() {
        this.array = [];
        this.arraySize = 10;
        this.speed = 15;
        this.valueRange = 'medium';
        this.isSorting = false;
        this.isPaused = false;
        this.sortingInterval = null;
        
        // Contadores
        this.maxValue = 0;
        this.countOperations = 0;
        this.placementOperations = 0;
        this.rangeSize = 0;
        
        // Para o algoritmo
        this.originalArray = [];
        this.countArray = [];
        this.outputArray = [];
        this.steps = [];
        this.currentStepIndex = 0;
        
        // Estado atual
        this.currentState = 'pronto';
        this.currentValue = null;
        this.currentIndex = null;
        this.currentCount = null;
        this.currentPosition = null;
        this.currentStep = 0;
        
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
                document.getElementById('arraySizeValue').textContent = this.arraySize;
                document.getElementById('nValue').textContent = this.arraySize;
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
        
        document.getElementById('valueRange').addEventListener('change', (e) => {
            this.valueRange = e.target.value;
            this.generateNewArray();
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
    
    getRangeLimits() {
        switch(this.valueRange) {
            case 'small': return { min: 1, max: 10 };
            case 'medium': return { min: 1, max: 20 };
            case 'large': return { min: 1, max: 30 };
            default: return { min: 1, max: 20 };
        }
    }
    
    generateNewArray() {
        const limits = this.getRangeLimits();
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * (limits.max - limits.min + 1)) + limits.min);
        }
        this.originalArray = [...this.array];
        this.resetCounters();
        this.renderAll();
    }
    
    resetCounters() {
        this.maxValue = 0;
        this.countOperations = 0;
        this.placementOperations = 0;
        this.rangeSize = 0;
        
        this.currentState = 'pronto';
        this.currentValue = null;
        this.currentIndex = null;
        this.currentCount = null;
        this.currentPosition = null;
        this.currentStep = 0;
        
        this.countArray = [];
        this.outputArray = [];
        this.steps = [];
        this.currentStepIndex = 0;
        
        document.getElementById('maxValue').textContent = '-';
        document.getElementById('countOperations').textContent = '0';
        document.getElementById('placementOperations').textContent = '0';
        document.getElementById('rangeSize').textContent = '0';
        document.getElementById('statusText').textContent = 'Pronto';
        document.getElementById('currentValue').textContent = '-';
        document.getElementById('currentIndex').textContent = '-';
        document.getElementById('currentCount').textContent = '-';
        document.getElementById('currentPosition').textContent = '-';
        
        // Atualizar eficiência
        document.getElementById('rangeValue').textContent = '0';
        document.getElementById('kValue').textContent = '0';
        this.updateEfficiencyChart();
        
        this.updateOperationDetails('Array gerado. Clique em "Iniciar" para começar a ordenação.');
        this.updateStepIndicator(0);
    }
    
    updateOperationDetails(message) {
        document.getElementById('operationDetails').innerHTML = `<p>${message}</p>`;
    }
    
    updateStepIndicator(step) {
        // Resetar todos os steps
        for (let i = 1; i <= 5; i++) {
            const stepEl = document.getElementById(`step${i}`);
            stepEl.classList.remove('active', 'completed');
        }
        
        // Ativar step atual e marcar anteriores como completos
        for (let i = 1; i <= step; i++) {
            const stepEl = document.getElementById(`step${i}`);
            if (i === step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.add('completed');
            }
        }
        
        this.currentStep = step;
    }
    
    updateCurrentValues() {
        document.getElementById('currentValue').textContent = this.currentValue !== null ? this.currentValue : '-';
        document.getElementById('currentIndex').textContent = this.currentIndex !== null ? this.currentIndex : '-';
        document.getElementById('currentCount').textContent = this.currentCount !== null ? this.currentCount : '-';
        document.getElementById('currentPosition').textContent = this.currentPosition !== null ? this.currentPosition : '-';
    }
    
    updateCounters() {
        document.getElementById('maxValue').textContent = this.maxValue;
        document.getElementById('countOperations').textContent = this.countOperations;
        document.getElementById('placementOperations').textContent = this.placementOperations;
        document.getElementById('rangeSize').textContent = this.rangeSize;
        document.getElementById('statusText').textContent = this.getStatusText();
        
        // Atualizar eficiência
        document.getElementById('rangeValue').textContent = this.rangeSize;
        document.getElementById('kValue').textContent = this.rangeSize;
        this.updateEfficiencyChart();
    }
    
    updateEfficiencyChart() {
        const n = this.arraySize;
        const k = this.rangeSize;
        const maxValue = Math.max(n, k);
        
        const nBar = document.getElementById('nBar');
        const kBar = document.getElementById('kBar');
        
        if (maxValue > 0) {
            const nHeight = (n / maxValue) * 80;
            const kHeight = (k / maxValue) * 80;
            
            nBar.style.height = `${nHeight}px`;
            kBar.style.height = `${kHeight}px`;
        }
    }
    
    getStatusText() {
        switch(this.currentState) {
            case 'finding_max': return 'Encontrando máximo...';
            case 'counting': return 'Contando ocorrências...';
            case 'accumulating': return 'Acumulando contagens...';
            case 'building_output': return 'Construindo saída...';
            case 'completo': return 'Completo!';
            case 'pronto': return 'Pronto';
            default: return 'Ordenando...';
        }
    }
    
    renderAll() {
        this.renderInputArray();
        this.renderOutputArray();
        this.renderCountArray();
        this.updateCurrentValues();
        this.updateCounters();
    }
    
    renderInputArray() {
        const container = document.getElementById('inputArray');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.array, 1);
        const containerHeight = 150;
        
        this.array.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'array-element input';
            element.style.height = `${(value / maxValue) * containerHeight}px`;
            element.innerHTML = `
                <div class="value">${value}</div>
                <div class="index">${index}</div>
            `;
            
            // Destacar se está sendo processado
            if (this.currentState === 'finding_max' && value === this.currentValue) {
                element.classList.add('current-max');
            } else if (this.currentState === 'counting' && index === this.currentIndex) {
                element.classList.add('processing');
            } else if (this.currentState === 'building_output' && index === this.currentIndex) {
                element.classList.add('counted');
            }
            
            container.appendChild(element);
        });
    }
    
    renderOutputArray() {
        const container = document.getElementById('outputArray');
        container.innerHTML = '';
        
        const maxValue = Math.max(...this.outputArray.length > 0 ? this.outputArray : this.array, 1);
        const containerHeight = 150;
        
        // Se não há output ainda, mostrar array vazio
        if (this.outputArray.length === 0) {
            for (let i = 0; i < this.array.length; i++) {
                const element = document.createElement('div');
                element.className = 'array-element output';
                element.style.height = `20px`;
                element.innerHTML = `
                    <div class="value">?</div>
                    <div class="index">${i}</div>
                `;
                container.appendChild(element);
            }
            return;
        }
        
        this.outputArray.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'array-element output';
            element.style.height = `${(value / maxValue) * containerHeight}px`;
            element.innerHTML = `
                <div class="value">${value}</div>
                <div class="index">${index}</div>
            `;
            
            // Destacar se está sendo posicionado
            if (this.currentState === 'building_output' && index === this.currentPosition) {
                element.classList.add('positioned');
            }
            
            container.appendChild(element);
        });
    }
    
    renderCountArray() {
        const container = document.getElementById('countArray');
        container.innerHTML = '';
        
        if (this.countArray.length === 0) {
            // Mostrar array vazio
            for (let i = 0; i <= (this.maxValue || 5); i++) {
                const element = document.createElement('div');
                element.className = 'count-element';
                element.style.height = `30px`;
                element.innerHTML = `
                    <div class="value">0</div>
                    <div class="index">${i}</div>
                `;
                container.appendChild(element);
            }
            return;
        }
        
        // Encontrar valor máximo para escala
        const maxCount = Math.max(...this.countArray, 1);
        const containerHeight = 80;
        
        this.countArray.forEach((count, index) => {
            const element = document.createElement('div');
            element.className = 'count-element';
            element.style.height = `${(count / maxCount) * containerHeight + 20}px`;
            element.innerHTML = `
                <div class="value">${count}</div>
                <div class="index">${index}</div>
            `;
            
            // Destacar se está sendo processado
            if (this.currentState === 'counting' && index === this.currentValue) {
                element.classList.add('processing');
            } else if (this.currentState === 'accumulating' && index === this.currentIndex) {
                element.classList.add('processing');
            } else if (this.currentState === 'building_output' && index === this.currentValue) {
                element.classList.add('processing');
            }
            
            // Destacar se já foi acumulado
            if (this.currentState === 'accumulating' && index <= this.currentIndex) {
                element.classList.add('accumulated');
            }
            
            container.appendChild(element);
        });
    }
    
    startSorting() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('arraySize').disabled = true;
        document.getElementById('valueRange').disabled = true;
        
        // Gerar passos do Counting Sort
        this.generateCountingSortSteps();
        
        // Iniciar com o primeiro passo
        this.currentStepIndex = 0;
        this.nextStep();
        
        if (!this.isPaused) {
            this.sortingInterval = setInterval(() => this.nextStep(), this.getSpeedInterval());
        }
    }
    
    generateCountingSortSteps() {
        this.steps = [];
        const arrayCopy = [...this.array];
        
        // Passo 1: Encontrar valor máximo
        this.steps.push({
            type: 'start_find_max',
            message: `Iniciando busca pelo valor máximo no array`
        });
        
        let max = 0;
        for (let i = 0; i < arrayCopy.length; i++) {
            this.steps.push({
                type: 'checking_max',
                index: i,
                value: arrayCopy[i],
                currentMax: max,
                message: `Verificando elemento ${arrayCopy[i]} no índice ${i}`
            });
            
            if (arrayCopy[i] > max) {
                max = arrayCopy[i];
                this.steps.push({
                    type: 'new_max_found',
                    index: i,
                    value: arrayCopy[i],
                    newMax: max,
                    message: `Novo máximo encontrado: ${arrayCopy[i]}`
                });
            }
        }
        
        this.steps.push({
            type: 'max_found',
            maxValue: max,
            message: `Valor máximo encontrado: ${max}`
        });
        
        // Passo 2: Criar e inicializar array de contagem
        const countSize = max + 1;
        const count = new Array(countSize).fill(0);
        
        this.steps.push({
            type: 'create_count_array',
            size: countSize,
            message: `Criando array de contagem com tamanho ${countSize} (0 até ${max})`
        });
        
        // Passo 3: Contar ocorrências
        this.steps.push({
            type: 'start_counting',
            message: `Iniciando contagem de ocorrências de cada valor`
        });
        
        for (let i = 0; i < arrayCopy.length; i++) {
            const value = arrayCopy[i];
            this.steps.push({
                type: 'count_element',
                index: i,
                value: value,
                countIndex: value,
                oldCount: count[value],
                newCount: count[value] + 1,
                message: `Contando elemento ${value} no índice ${i}. Incrementando contagem na posição ${value}`
            });
            
            count[value]++;
            this.countOperations++;
        }
        
        this.steps.push({
            type: 'counting_complete',
            countArray: [...count],
            message: `Contagem completa! Array de contagens: [${count.join(', ')}]`
        });
        
        // Passo 4: Acumular contagens
        this.steps.push({
            type: 'start_accumulating',
            message: `Iniciando acumulação de contagens para obter posições`
        });
        
        for (let i = 1; i < count.length; i++) {
            const oldValue = count[i];
            const newValue = count[i] + count[i - 1];
            
            this.steps.push({
                type: 'accumulate_count',
                index: i,
                oldCount: count[i - 1],
                currentCount: count[i],
                newCount: newValue,
                message: `Acumulando contagem na posição ${i}: ${count[i]} + ${count[i - 1]} = ${newValue}`
            });
            
            count[i] += count[i - 1];
        }
        
        this.steps.push({
            type: 'accumulation_complete',
            countArray: [...count],
            message: `Acumulação completa! Contagens acumuladas: [${count.join(', ')}]`
        });
        
        // Passo 5: Construir array de saída
        const output = new Array(arrayCopy.length);
        
        this.steps.push({
            type: 'start_building_output',
            message: `Iniciando construção do array ordenado usando contagens acumuladas`
        });
        
        // Construir de trás para frente para manter estabilidade
        for (let i = arrayCopy.length - 1; i >= 0; i--) {
            const value = arrayCopy[i];
            const position = count[value] - 1;
            
            this.steps.push({
                type: 'find_position',
                index: i,
                value: value,
                countValue: count[value],
                position: position,
                message: `Elemento ${value} no índice ${i} vai para posição ${position}`
            });
            
            output[position] = value;
            count[value]--;
            this.placementOperations++;
            
            this.steps.push({
                type: 'place_element',
                index: i,
                value: value,
                position: position,
                outputArray: [...output],
                message: `Elemento ${value} colocado na posição ${position} do array de saída`
            });
        }
        
        this.steps.push({
            type: 'complete',
            outputArray: [...output],
            message: `Counting Sort completo! Array ordenado: [${output.join(', ')}]`
        });
    }
    
    nextStep() {
        if (!this.isSorting || this.isPaused) return;
        
        if (this.currentStepIndex >= this.steps.length) {
            this.finishSorting();
            return;
        }
        
        const step = this.steps[this.currentStepIndex];
        
        switch(step.type) {
            case 'start_find_max':
                this.currentState = 'finding_max';
                this.updateStepIndicator(1);
                this.updateOperationDetails(step.message);
                break;
                
            case 'checking_max':
                this.currentState = 'finding_max';
                this.currentValue = step.value;
                this.currentIndex = step.index;
                this.maxValue = step.currentMax;
                this.updateOperationDetails(step.message);
                break;
                
            case 'new_max_found':
                this.currentState = 'finding_max';
                this.currentValue = step.value;
                this.currentIndex = step.index;
                this.maxValue = step.newMax;
                this.updateOperationDetails(step.message);
                break;
                
            case 'max_found':
                this.currentState = 'finding_max';
                this.maxValue = step.maxValue;
                this.rangeSize = step.maxValue + 1;
                this.updateOperationDetails(step.message);
                break;
                
            case 'create_count_array':
                this.currentState = 'counting';
                this.updateStepIndicator(2);
                this.countArray = new Array(step.size).fill(0);
                this.updateOperationDetails(step.message);
                break;
                
            case 'start_counting':
                this.currentState = 'counting';
                this.updateOperationDetails(step.message);
                break;
                
            case 'count_element':
                this.currentState = 'counting';
                this.currentValue = step.value;
                this.currentIndex = step.index;
                this.currentCount = step.newCount;
                // Atualizar array de contagem
                this.countArray[step.countIndex] = step.newCount;
                this.countOperations++;
                this.updateOperationDetails(step.message);
                break;
                
            case 'counting_complete':
                this.currentState = 'counting';
                this.countArray = [...step.countArray];
                this.updateOperationDetails(step.message);
                break;
                
            case 'start_accumulating':
                this.currentState = 'accumulating';
                this.updateStepIndicator(3);
                this.updateOperationDetails(step.message);
                break;
                
            case 'accumulate_count':
                this.currentState = 'accumulating';
                this.currentIndex = step.index;
                this.currentCount = step.newCount;
                // Atualizar array de contagem
                this.countArray[step.index] = step.newCount;
                this.updateOperationDetails(step.message);
                break;
                
            case 'accumulation_complete':
                this.currentState = 'accumulating';
                this.countArray = [...step.countArray];
                this.updateOperationDetails(step.message);
                break;
                
            case 'start_building_output':
                this.currentState = 'building_output';
                this.updateStepIndicator(4);
                this.outputArray = new Array(this.array.length);
                this.updateOperationDetails(step.message);
                break;
                
            case 'find_position':
                this.currentState = 'building_output';
                this.currentValue = step.value;
                this.currentIndex = step.index;
                this.currentPosition = step.position;
                this.updateOperationDetails(step.message);
                break;
                
            case 'place_element':
                this.currentState = 'building_output';
                this.currentValue = step.value;
                this.currentIndex = step.index;
                this.currentPosition = step.position;
                this.outputArray = [...step.outputArray];
                this.updateOperationDetails(step.message);
                break;
                
            case 'complete':
                this.currentState = 'completo';
                this.updateStepIndicator(5);
                this.outputArray = [...step.outputArray];
                this.updateOperationDetails(step.message);
                break;
        }
        
        this.currentStepIndex++;
        this.renderAll();
        this.updateCounters();
    }
    
    finishSorting() {
        clearInterval(this.sortingInterval);
        this.isSorting = false;
        
        this.currentState = 'completo';
        this.currentValue = null;
        this.currentIndex = null;
        this.currentCount = null;
        this.currentPosition = null;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('arraySize').disabled = false;
        document.getElementById('valueRange').disabled = false;
        
        // Verificar ordenação
        const isSorted = this.isArraySorted();
        const sortedCopy = [...this.originalArray].sort((a, b) => a - b);
        const correctSort = JSON.stringify(this.outputArray) === JSON.stringify(sortedCopy);
        
        let message = '';
        if (isSorted && correctSort) {
            message = `🎉 Counting Sort concluído com sucesso!<br>`;
        } else {
            message = `⚠️ Ordenação concluída<br>`;
        }
        
        message += `↳ Valor máximo encontrado: ${this.maxValue}<br>`;
        message += `↳ Tamanho do range (k): ${this.rangeSize}<br>`;
        message += `↳ Operações de contagem: ${this.countOperations}<br>`;
        message += `↳ Operações de posicionamento: ${this.placementOperations}<br>`;
        message += `↳ Complexidade: O(n + k) = O(${this.arraySize} + ${this.rangeSize})<br>`;
        message += `↳ Array original: [${this.originalArray.join(', ')}]<br>`;
        message += `↳ Array ordenado: [${this.outputArray.join(', ')}]<br>`;
        message += `↳ Estabilidade: ✅ Preservada`;
        
        if (!correctSort) {
            message += `<br><span style="color: #ff6b6b;">⚠️ O array pode não estar ordenado corretamente!</span>`;
        }
        
        this.updateOperationDetails(message);
        
        this.renderAll();
        this.updateCounters();
    }
    
    isArraySorted() {
        for (let i = 1; i < this.outputArray.length; i++) {
            if (this.outputArray[i] < this.outputArray[i - 1]) {
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
        document.getElementById('valueRange').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        this.generateNewArray();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CountingSortVisualizer();
});