document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const arraySizeInput = document.getElementById('arraySize');
    const sizeValue = document.getElementById('sizeValue');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const baseSelect = document.getElementById('base');
    const generateBtn = document.getElementById('generateBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Elementos de visualização
    const arrayContainer = document.getElementById('arrayContainer');
    const bucketsContainer = document.getElementById('bucketsContainer');
    const operationDetails = document.getElementById('operationDetails');
    
    // Elementos de status
    const currentDigitEl = document.getElementById('currentDigit');
    const digitValueEl = document.getElementById('digitValue');
    const activeBucketEl = document.getElementById('activeBucket');
    const currentNumberEl = document.getElementById('currentNumber');
    const iterationCountEl = document.getElementById('iterationCount');
    const digitsProcessedEl = document.getElementById('digitsProcessed');
    const maxDigitsEl = document.getElementById('maxDigits');
    const statusTextEl = document.getElementById('statusText');
    
    // Variáveis de estado
    let originalArray = [];
    let currentArray = [];
    let buckets = [];
    let isRunning = false;
    let isPaused = false;
    let currentStep = 0;
    let currentDigit = 1; // Começa com unidades
    let maxDigits = 0;
    let iterationCount = 0;
    let digitsProcessed = 0;
    let animationSpeed = 1000;
    let animationTimeout;
    let base = 10;
    
    // Inicialização
    init();
    
    function init() {
        updateArraySize();
        generateNewArray();
        setupEventListeners();
        renderArray();
        renderBuckets();
        updateStatus();
    }
    
    function setupEventListeners() {
        arraySizeInput.addEventListener('input', updateArraySize);
        speedInput.addEventListener('input', updateSpeed);
        baseSelect.addEventListener('change', updateBase);
        generateBtn.addEventListener('click', generateNewArray);
        startBtn.addEventListener('click', startSorting);
        pauseBtn.addEventListener('click', togglePause);
        resetBtn.addEventListener('click', resetSorting);
    }
    
    function updateArraySize() {
        sizeValue.textContent = arraySizeInput.value;
    }
    
    function updateSpeed() {
        const value = parseInt(speedInput.value);
        // Inverter: maior valor = mais rápido
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function updateBase() {
        base = parseInt(baseSelect.value);
        resetSorting();
    }
    
    function generateNewArray() {
        const size = parseInt(arraySizeInput.value);
        originalArray = Array.from({length: size}, () => {
            // Gerar números com até 3 dígitos
            const max = base === 2 ? 127 : 
                       base === 8 ? 511 : 
                       base === 16 ? 4095 : 999;
            return Math.floor(Math.random() * max) + 1;
        });
        resetSorting();
    }
    
    function resetSorting() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        currentArray = [...originalArray];
        currentStep = 0;
        currentDigit = 1;
        iterationCount = 0;
        digitsProcessed = 0;
        
        // Calcular máximo de dígitos
        const maxNumber = Math.max(...currentArray);
        maxDigits = maxNumber.toString(base).length;
        
        buckets = Array.from({length: base}, () => []);
        
        renderArray();
        renderBuckets();
        updateStatus();
        
        operationDetails.innerHTML = '<p>Ordenação reiniciada. Clique em "Iniciar" para começar.</p>';
        statusTextEl.textContent = 'Pronto';
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        generateBtn.disabled = false;
    }
    
    function startSorting() {
        if (isRunning) return;
        
        isRunning = true;
        isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        generateBtn.disabled = true;
        statusTextEl.textContent = 'Executando';
        
        performRadixSort();
    }
    
    function togglePause() {
        if (!isRunning) return;
        
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        statusTextEl.textContent = isPaused ? 'Pausado' : 'Executando';
        
        if (!isPaused) {
            performRadixSortStep();
        }
    }
    
    async function performRadixSort() {
        if (currentDigit > maxDigits) {
            finishSorting();
            return;
        }
        
        operationDetails.innerHTML = `<p><strong>Passo ${currentDigit}</strong>: Ordenando pelo ${currentDigit}º dígito (${getDigitName(currentDigit)})</p>`;
        
        // Resetar buckets
        buckets = Array.from({length: base}, () => []);
        renderBuckets();
        await sleep(animationSpeed / 2);
        
        if (isPaused) return;
        
        // Distribuir números nos buckets
        operationDetails.innerHTML = `<p>Distribuindo números nos buckets baseado no ${currentDigit}º dígito...</p>`;
        
        for (let i = 0; i < currentArray.length; i++) {
            if (isPaused) return;
            
            const num = currentArray[i];
            const numStr = num.toString(base).padStart(maxDigits, '0');
            const digitIndex = numStr.length - currentDigit;
            const digitValue = digitIndex >= 0 ? parseInt(numStr[digitIndex], base) : 0;
            
            // Atualizar interface
            currentNumberEl.textContent = num;
            digitValueEl.textContent = digitValue;
            activeBucketEl.textContent = digitValue;
            currentDigitEl.textContent = currentDigit;
            
            // Destacar elemento no array
            highlightArrayElement(i, 'current-digit-highlight');
            await sleep(animationSpeed / 3);
            
            if (isPaused) return;
            
            // Mover para bucket
            highlightArrayElement(i, 'moving-to-bucket');
            buckets[digitValue].push(num);
            renderBuckets();
            highlightBucket(digitValue, true);
            
            await sleep(animationSpeed / 2);
            
            if (isPaused) return;
            
            // Remover destaque
            highlightArrayElement(i, 'bucket-distributed');
            highlightBucket(digitValue, false);
            
            await sleep(animationSpeed / 4);
        }
        
        if (isPaused) return;
        
        // Coletar números dos buckets
        operationDetails.innerHTML = `<p>Coletando números dos buckets na ordem (0-${base-1})...</p>`;
        
        currentArray = [];
        for (let i = 0; i < base; i++) {
            if (isPaused) return;
            
            if (buckets[i].length > 0) {
                highlightBucket(i, true);
                await sleep(animationSpeed / 3);
                
                if (isPaused) return;
                
                currentArray.push(...buckets[i]);
                renderArray();
                
                await sleep(animationSpeed / 3);
                
                if (isPaused) return;
                
                highlightBucket(i, false);
            }
        }
        
        // Marcar dígito como processado
        iterationCount++;
        digitsProcessed = currentDigit;
        
        // Atualizar interface
        renderArray();
        renderBuckets();
        updateStatus();
        
        operationDetails.innerHTML = `<p><strong>✓ Passo ${currentDigit} concluído!</strong> Array após ordenar pelo ${currentDigit}º dígito: ${currentArray.join(', ')}</p>`;
        
        await sleep(animationSpeed);
        
        if (isPaused) return;
        
        // Próximo dígito
        currentDigit++;
        
        if (currentDigit <= maxDigits) {
            animationTimeout = setTimeout(performRadixSort, 100);
        } else {
            finishSorting();
        }
    }
    
    async function performRadixSortStep() {
        // Implementação simplificada para passo a passo
        if (currentDigit > maxDigits) {
            finishSorting();
            return;
        }
        
        if (currentStep === 0) {
            // Iniciar novo dígito
            operationDetails.innerHTML = `<p><strong>Passo ${currentDigit}</strong>: Ordenando pelo ${currentDigit}º dígito (${getDigitName(currentDigit)})</p>`;
            buckets = Array.from({length: base}, () => []);
            currentStep = 1;
            renderBuckets();
        } else if (currentStep === 1) {
            // Distribuir números
            if (currentArray.length > 0) {
                const num = currentArray[0];
                const numStr = num.toString(base).padStart(maxDigits, '0');
                const digitIndex = numStr.length - currentDigit;
                const digitValue = digitIndex >= 0 ? parseInt(numStr[digitIndex], base) : 0;
                
                currentNumberEl.textContent = num;
                digitValueEl.textContent = digitValue;
                activeBucketEl.textContent = digitValue;
                currentDigitEl.textContent = currentDigit;
                
                buckets[digitValue].push(num);
                currentArray.shift();
                
                renderArray();
                renderBuckets();
                highlightArrayElement(0, 'moving-to-bucket');
                highlightBucket(digitValue, true);
                
                setTimeout(() => {
                    highlightBucket(digitValue, false);
                }, 500);
            } else {
                currentStep = 2;
                operationDetails.innerHTML = `<p>Coletando números dos buckets...</p>`;
            }
        } else if (currentStep === 2) {
            // Coletar dos buckets
            let allBucketsEmpty = true;
            for (let i = 0; i < base; i++) {
                if (buckets[i].length > 0) {
                    currentArray.push(...buckets[i]);
                    buckets[i] = [];
                    allBucketsEmpty = false;
                    break;
                }
            }
            
            if (allBucketsEmpty) {
                iterationCount++;
                digitsProcessed = currentDigit;
                currentDigit++;
                currentStep = 0;
                
                if (currentDigit > maxDigits) {
                    finishSorting();
                } else {
                    operationDetails.innerHTML = `<p><strong>✓ Passo ${currentDigit-1} concluído!</strong> Iniciando passo ${currentDigit}...</p>`;
                }
            }
            
            renderArray();
            renderBuckets();
            updateStatus();
        }
        
        if (currentDigit <= maxDigits) {
            isRunning = false;
            startBtn.disabled = false;
        }
    }
    
    function finishSorting() {
        isRunning = false;
        statusTextEl.textContent = 'Concluído';
        operationDetails.innerHTML = `<p><strong>✅ Ordenação concluída!</strong> Array final ordenado: ${currentArray.join(', ')}</p>`;
        
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        generateBtn.disabled = false;
        
        // Destacar todos os elementos como ordenados
        const elements = document.querySelectorAll('.array-element');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.remove('processing', 'bucket-distributed', 'current-digit-highlight');
                element.classList.add('sorted');
            }, index * 100);
        });
    }
    
    function getDigitName(digit) {
        const names = ['unidades', 'dezenas', 'centenas', 'milhares', 'dezenas de milhares'];
        return names[digit - 1] || `${digit}º dígito`;
    }
    
    function renderArray() {
        arrayContainer.innerHTML = '';
        const maxValue = Math.max(...currentArray, 1);
        
        currentArray.forEach((num, index) => {
            const element = document.createElement('div');
            element.className = 'array-element';
            element.id = `array-element-${index}`;
            
            // Calcular altura proporcional
            const height = (num / maxValue) * 150 + 50;
            element.style.height = `${height}px`;
            
            // Valor do número
            const valueDiv = document.createElement('div');
            valueDiv.className = 'value';
            valueDiv.textContent = num;
            element.appendChild(valueDiv);
            
            // Índice
            const indexDiv = document.createElement('div');
            indexDiv.className = 'index';
            indexDiv.textContent = `[${index}]`;
            element.appendChild(indexDiv);
            
            // Dígito atual (se aplicável)
            if (currentDigit <= maxDigits) {
                const numStr = num.toString(base).padStart(maxDigits, '0');
                const digitIndex = numStr.length - currentDigit;
                const digitValue = digitIndex >= 0 ? numStr[digitIndex] : '0';
                
                const digitDiv = document.createElement('div');
                digitDiv.className = 'current-digit';
                digitDiv.textContent = `${currentDigit}º: ${digitValue}`;
                element.appendChild(digitDiv);
            }
            
            arrayContainer.appendChild(element);
        });
    }
    
    function renderBuckets() {
        bucketsContainer.innerHTML = '';
        
        for (let i = 0; i < base; i++) {
            const bucket = document.createElement('div');
            bucket.className = 'bucket';
            bucket.id = `bucket-${i}`;
            
            const header = document.createElement('div');
            header.className = 'bucket-header';
            header.textContent = base === 16 ? i.toString(16).toUpperCase() : i;
            bucket.appendChild(header);
            
            const items = document.createElement('div');
            items.className = 'bucket-items';
            
            if (buckets[i]) {
                buckets[i].forEach(num => {
                    const item = document.createElement('div');
                    item.className = 'bucket-item';
                    item.textContent = num;
                    items.appendChild(item);
                });
            }
            
            bucket.appendChild(items);
            bucketsContainer.appendChild(bucket);
        }
    }
    
    function highlightArrayElement(index, className) {
        const elements = document.querySelectorAll('.array-element');
        elements.forEach(el => {
            el.classList.remove('processing', 'bucket-distributed', 'current-digit-highlight', 
                               'moving-to-bucket', 'comparing');
        });
        
        if (index >= 0 && index < elements.length) {
            elements[index].classList.add(className);
        }
    }
    
    function highlightBucket(bucketIndex, active) {
        const bucket = document.getElementById(`bucket-${bucketIndex}`);
        if (bucket) {
            const header = bucket.querySelector('.bucket-header');
            if (active) {
                header.classList.add('active');
            } else {
                header.classList.remove('active');
            }
        }
    }
    
    function updateStatus() {
        iterationCountEl.textContent = iterationCount;
        digitsProcessedEl.textContent = digitsProcessed;
        maxDigitsEl.textContent = maxDigits;
    }
    
    function sleep(ms) {
        return new Promise(resolve => {
            if (isPaused) {
                const checkInterval = setInterval(() => {
                    if (!isPaused) {
                        clearInterval(checkInterval);
                        animationTimeout = setTimeout(resolve, ms);
                    }
                }, 100);
            } else {
                animationTimeout = setTimeout(resolve, ms);
            }
        });
    }
    
    // Funções auxiliares para a interface
    function updateBase() {
        base = parseInt(baseSelect.value);
        resetSorting();
    }
    
    // Inicializar valores
    updateSpeed();
});