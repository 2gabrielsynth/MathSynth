document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const diskCountInput = document.getElementById('diskCount');
    const diskCountValue = document.getElementById('diskCountValue');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const showNumbersSelect = document.getElementById('showNumbers');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const autoSolveBtn = document.getElementById('autoSolveBtn');
    
    // Elementos do jogo
    const gameContainer = document.getElementById('gameContainer');
    const moveInstruction = document.getElementById('moveInstruction');
    const stepNumber = document.getElementById('stepNumber');
    const moveText = document.getElementById('moveText');
    const moveCounter = document.getElementById('moveCounter');
    const currentMove = document.getElementById('currentMove');
    const totalMoves = document.getElementById('totalMoves');
    
    // Elementos das torres
    const towerA = document.getElementById('towerA');
    const towerB = document.getElementById('towerB');
    const towerC = document.getElementById('towerC');
    const disksA = document.getElementById('disksA');
    const disksB = document.getElementById('disksB');
    const disksC = document.getElementById('disksC');
    
    // Elementos de status
    const currentDisk = document.getElementById('currentDisk');
    const sourceTower = document.getElementById('sourceTower');
    const destinationTower = document.getElementById('destinationTower');
    const auxiliaryTower = document.getElementById('auxiliaryTower');
    const moveCount = document.getElementById('moveCount');
    const executionTime = document.getElementById('executionTime');
    const recursionCount = document.getElementById('recursionCount');
    const statusText = document.getElementById('statusText');
    const operationDetails = document.getElementById('operationDetails');
    const recursionStack = document.getElementById('recursionStack');
    
    // Elementos da calculadora
    const currentDiskCount = document.getElementById('currentDiskCount');
    const formulaN = document.getElementById('formulaN');
    const minMovesResult = document.getElementById('minMovesResult');
    
    // Variáveis de estado
    let diskCount = 3;
    let animationSpeed = 1000;
    let isRunning = false;
    let isPaused = false;
    let isAutoSolving = false;
    let currentMoveNumber = 0;
    let totalMoveCount = 0;
    let recursionDepth = 0;
    let moveHistory = [];
    let pendingMoves = [];
    let animationTimeout;
    let startTime = 0;
    let recursionStackFrames = [];
    
    // Estado do jogo
    let towers = {
        'A': [], // Torre origem
        'B': [], // Torre auxiliar
        'C': []  // Torre destino
    };
    
    // Cores dos discos
    const diskColors = [
        'linear-gradient(135deg, #ff6b6b, #ee5a52)',    // Vermelho
        'linear-gradient(135deg, #ff9e6d, #ff8a65)',    // Laranja
        'linear-gradient(135deg, #ffd166, #ffca3a)',    // Amarelo
        'linear-gradient(135deg, #06d6a0, #05c793)',    // Verde
        'linear-gradient(135deg, #118ab2, #0d7ea2)',    // Azul
        'linear-gradient(135deg, #073b4c, #052d3a)',    // Azul escuro
        'linear-gradient(135deg, #7209b7, #5a0895)',    // Roxo
        'linear-gradient(135deg, #ff006e, #e0005e)'     // Rosa
    ];
    
    // Inicialização
    init();
    
    function init() {
        setupEventListeners();
        updateDiskCount();
        resetGame();
        updateMinMoves();
    }
    
    function setupEventListeners() {
        diskCountInput.addEventListener('input', updateDiskCount);
        speedInput.addEventListener('input', updateSpeed);
        showNumbersSelect.addEventListener('change', updateShowNumbers);
        
        startBtn.addEventListener('click', startSolution);
        pauseBtn.addEventListener('click', togglePause);
        stepBtn.addEventListener('click', stepSolution);
        resetBtn.addEventListener('click', resetGame);
        autoSolveBtn.addEventListener('click', toggleAutoSolve);
    }
    
    function updateDiskCount() {
        diskCount = parseInt(diskCountInput.value);
        diskCountValue.textContent = diskCount;
        currentDiskCount.textContent = diskCount;
        formulaN.textContent = diskCount;
        updateMinMoves();
        resetGame();
    }
    
    function updateMinMoves() {
        const minMoves = Math.pow(2, diskCount) - 1;
        minMovesResult.textContent = minMoves;
        totalMoves.textContent = minMoves;
        totalMoveCount = minMoves;
    }
    
    function updateSpeed() {
        const value = parseInt(speedInput.value);
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function updateShowNumbers() {
        const showNumbers = showNumbersSelect.value === 'true';
        const allDisks = document.querySelectorAll('.disk');
        allDisks.forEach(disk => {
            if (showNumbers) {
                disk.innerHTML = disk.dataset.size;
            } else {
                disk.innerHTML = '';
            }
        });
    }
    
    function resetGame() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        isAutoSolving = false;
        currentMoveNumber = 0;
        recursionDepth = 0;
        moveHistory = [];
        pendingMoves = [];
        recursionStackFrames = [];
        
        // Resetar torres
        towers = {
            'A': [],
            'B': [],
            'C': []
        };
        
        // Limpar discos visuais
        disksA.innerHTML = '';
        disksB.innerHTML = '';
        disksC.innerHTML = '';
        
        // Criar discos na torre A
        for (let i = diskCount; i >= 1; i--) {
            towers['A'].push(i);
            createDisk(i, 'A');
        }
        
        // Limpar pilha de recursão
        recursionStack.innerHTML = '';
        
        // Atualizar interface
        updateStatus();
        moveInstruction.style.display = 'none';
        moveCounter.style.display = 'block';
        operationDetails.innerHTML = '<p>Jogo reiniciado. Clique em "Iniciar Solução" para ver o algoritmo.</p>';
        statusText.textContent = 'Pronto';
        
        // Atualizar botões
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stepBtn.disabled = false;
        autoSolveBtn.disabled = false;
        autoSolveBtn.innerHTML = '<i class="fas fa-robot"></i> Resolver Automaticamente';
    }
    
    function createDisk(size, tower) {
        const disk = document.createElement('div');
        disk.className = `disk size-${size}`;
        disk.dataset.size = size;
        disk.dataset.tower = tower;
        
        // Adicionar número se configurado
        if (showNumbersSelect.value === 'true') {
            disk.textContent = size;
        }
        
        // Estilo adicional
        disk.style.background = diskColors[size - 1] || diskColors[0];
        
        // Adicionar à torre correta
        const towerElement = getTowerElement(tower);
        towerElement.querySelector('.tower-disks').appendChild(disk);
        
        return disk;
    }
    
    function getTowerElement(tower) {
        switch(tower) {
            case 'A': return towerA;
            case 'B': return towerB;
            case 'C': return towerC;
            default: return towerA;
        }
    }
    
    function getTowerDisksElement(tower) {
        switch(tower) {
            case 'A': return disksA;
            case 'B': return disksB;
            case 'C': return disksC;
            default: return disksA;
        }
    }
    
    function startSolution() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stepBtn.disabled = true;
        autoSolveBtn.disabled = true;
        statusText.textContent = 'Executando';
        startTime = Date.now();
        
        // Gerar movimentos da solução
        generateSolution(diskCount, 'A', 'C', 'B');
        
        // Executar primeiro movimento
        executeNextMove();
    }
    
    function generateSolution(n, source, destination, auxiliary) {
        if (n === 1) {
            pendingMoves.push({
                disk: 1,
                from: source,
                to: destination,
                step: currentMoveNumber + pendingMoves.length + 1
            });
            return;
        }
        
        // Mover n-1 discos de source para auxiliary
        generateSolution(n - 1, source, auxiliary, destination);
        
        // Mover disco n de source para destination
        pendingMoves.push({
            disk: n,
            from: source,
            to: destination,
            step: currentMoveNumber + pendingMoves.length + 1
        });
        
        // Mover n-1 discos de auxiliary para destination
        generateSolution(n - 1, auxiliary, destination, source);
    }
    
    async function executeNextMove() {
        if (!isRunning || isPaused || pendingMoves.length === 0) {
            if (pendingMoves.length === 0 && isRunning) {
                finishSolution();
            }
            return;
        }
        
        const move = pendingMoves.shift();
        currentMoveNumber++;
        
        // Atualizar interface
        updateMoveDisplay(move);
        updateStatus();
        
        // Executar movimento
        await performMove(move);
        
        // Continuar com próximo movimento
        if (!isPaused) {
            animationTimeout = setTimeout(executeNextMove, 100);
        }
    }
    
    function updateMoveDisplay(move) {
        stepNumber.textContent = move.step;
        moveText.textContent = `Mover disco ${move.disk} de ${move.from} para ${move.to}`;
        moveInstruction.style.display = 'block';
        
        currentMove.textContent = currentMoveNumber;
        
        // Atualizar detalhes da operação
        currentDisk.textContent = move.disk;
        sourceTower.textContent = move.from;
        destinationTower.textContent = move.to;
        auxiliaryTower.textContent = getAuxiliaryTower(move.from, move.to);
        
        operationDetails.innerHTML = `
            <p><strong>Movimento ${move.step}:</strong> Mover disco ${move.disk} de ${move.from} para ${move.to}</p>
            <p><small>Algoritmo: hanoi(${diskCount}, ${move.from}, ${move.to}, ${getAuxiliaryTower(move.from, move.to)})</small></p>
        `;
    }
    
    function getAuxiliaryTower(from, to) {
        const towers = ['A', 'B', 'C'];
        return towers.find(t => t !== from && t !== to);
    }
    
    async function performMove(move) {
        const { disk, from, to } = move;
        
        // Encontrar o disco na torre de origem
        const fromTower = getTowerDisksElement(from);
        const disks = fromTower.querySelectorAll('.disk');
        const diskElement = Array.from(disks).find(d => parseInt(d.dataset.size) === disk);
        
        if (!diskElement) {
            console.error('Disco não encontrado:', disk, 'na torre', from);
            return;
        }
        
        // Verificar se o movimento é válido
        const toTower = towers[to];
        if (toTower.length > 0 && toTower[toTower.length - 1] < disk) {
            // Movimento inválido - disco maior sobre menor
            diskElement.classList.add('invalid');
            await sleep(animationSpeed / 2);
            diskElement.classList.remove('invalid');
            return;
        }
        
        // Marcar disco como selecionado
        diskElement.classList.add('selected');
        
        // Remover da torre de origem (logicamente)
        towers[from] = towers[from].filter(d => d !== disk);
        
        await sleep(animationSpeed / 3);
        
        // Animação de levantar
        diskElement.style.position = 'absolute';
        diskElement.style.zIndex = '1000';
        diskElement.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        
        const fromRect = fromTower.getBoundingClientRect();
        const gameRect = gameContainer.getBoundingClientRect();
        
        // Posição inicial (relativa ao gameContainer)
        const startX = fromRect.left - gameRect.left + fromRect.width / 2;
        const startY = fromRect.bottom - gameRect.top - 50;
        
        // Posição elevada
        const highY = startY - 150;
        
        // Aplicar posição elevada
        diskElement.style.left = `${startX - diskElement.offsetWidth / 2}px`;
        diskElement.style.top = `${highY}px`;
        
        await sleep(animationSpeed / 2);
        
        // Encontrar posição na torre de destino
        const toTowerElement = getTowerDisksElement(to);
        const toRect = toTowerElement.getBoundingClientRect();
        
        // Posição sobre a torre de destino
        const overX = toRect.left - gameRect.left + toRect.width / 2;
        diskElement.style.left = `${overX - diskElement.offsetWidth / 2}px`;
        
        await sleep(animationSpeed / 2);
        
        // Calcular posição final (baseado no número de discos na torre)
        const diskCountInTo = toTowerElement.querySelectorAll('.disk').length;
        const finalY = toRect.bottom - gameRect.top - 50 - (diskCountInTo * 33);
        
        diskElement.style.top = `${finalY}px`;
        
        await sleep(animationSpeed / 2);
        
        // Adicionar à torre de destino (logicamente)
        towers[to].push(disk);
        
        // Resetar estilos e adicionar à nova torre
        diskElement.classList.remove('selected');
        diskElement.style.position = '';
        diskElement.style.left = '';
        diskElement.style.top = '';
        diskElement.style.transition = '';
        diskElement.style.zIndex = '';
        diskElement.dataset.tower = to;
        
        // Remover do DOM e adicionar na posição correta
        diskElement.remove();
        toTowerElement.appendChild(diskElement);
        
        // Adicionar ao histórico
        moveHistory.push(move);
        
        // Atualizar contador de movimentos
        moveCount.textContent = currentMoveNumber;
    }
    
    function stepSolution() {
        if (isRunning || pendingMoves.length === 0) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stepBtn.disabled = false;
        statusText.textContent = 'Passo a Passo';
        
        if (pendingMoves.length > 0) {
            const move = pendingMoves.shift();
            currentMoveNumber++;
            updateMoveDisplay(move);
            updateStatus();
            performMove(move);
        }
        
        if (pendingMoves.length === 0) {
            finishSolution();
        }
    }
    
    function togglePause() {
        if (!isRunning) return;
        
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        statusText.textContent = isPaused ? 'Pausado' : 'Executando';
        
        if (!isPaused) {
            executeNextMove();
        }
    }
    
    function toggleAutoSolve() {
        if (isAutoSolving) {
            // Parar solução automática
            isAutoSolving = false;
            autoSolveBtn.innerHTML = '<i class="fas fa-robot"></i> Resolver Automaticamente';
            operationDetails.innerHTML += '<p><small>Solução automática interrompida.</small></p>';
        } else {
            // Iniciar solução automática
            if (!isRunning) {
                startSolution();
            }
            isAutoSolving = true;
            autoSolveBtn.innerHTML = '<i class="fas fa-stop"></i> Parar Solução Automática';
            operationDetails.innerHTML += '<p><small>Solução automática iniciada.</small></p>';
        }
    }
    
    function finishSolution() {
        isRunning = false;
        statusText.textContent = 'Concluído';
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        executionTime.textContent = `${elapsed}s`;
        
        operationDetails.innerHTML = `
            <p><strong>✅ Solução Completa!</strong></p>
            <p>Todos os ${diskCount} discos foram movidos da torre A para a torre C.</p>
            <p>Total de movimentos: ${currentMoveNumber} (mínimo possível: ${totalMoveCount})</p>
            <p>Tempo de execução: ${elapsed} segundos</p>
        `;
        
        // Destacar torre de destino
        towerC.style.animation = 'pulse 2s 3';
        
        // Atualizar botões
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        stepBtn.disabled = true;
        autoSolveBtn.disabled = false;
        autoSolveBtn.innerHTML = '<i class="fas fa-robot"></i> Resolver Automaticamente';
    }
    
    function updateStatus() {
        // Calcular tempo decorrido
        if (startTime > 0) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            executionTime.textContent = `${elapsed}s`;
        }
        
        // Atualizar profundidade de recursão
        recursionCount.textContent = recursionDepth;
        
        // Atualizar pilha de recursão
        updateRecursionStack();
    }
    
    function updateRecursionStack() {
        recursionStack.innerHTML = '';
        
        if (recursionStackFrames.length === 0) {
            const emptyFrame = document.createElement('div');
            emptyFrame.className = 'stack-frame';
            emptyFrame.textContent = 'Nenhuma chamada recursiva ativa';
            recursionStack.appendChild(emptyFrame);
            return;
        }
        
        recursionStackFrames.forEach((frame, index) => {
            const stackFrame = document.createElement('div');
            stackFrame.className = 'stack-frame';
            if (index === recursionStackFrames.length - 1) {
                stackFrame.classList.add('active');
            }
            
            stackFrame.innerHTML = `
                <div style="font-weight: bold; color: #00b4d8;">hanoi(${frame.n}, ${frame.source}, ${frame.destination}, ${frame.auxiliary})</div>
                <div style="font-size: 0.8rem; color: #a9a9a9;">
                    Estado: ${frame.state === 'moving' ? 'Movendo n-1 discos' : 'Movendo disco n'}
                </div>
            `;
            
            recursionStack.appendChild(stackFrame);
        });
        
        // Scroll para o frame ativo
        recursionStack.scrollTop = recursionStack.scrollHeight;
    }
    
    function pushRecursionFrame(n, source, destination, auxiliary, state = 'moving') {
        recursionDepth++;
        recursionStackFrames.push({
            n,
            source,
            destination,
            auxiliary,
            state
        });
        updateStatus();
    }
    
    function popRecursionFrame() {
        if (recursionStackFrames.length > 0) {
            recursionStackFrames.pop();
            recursionDepth--;
            updateStatus();
        }
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
    
    // Inicializar valores
    updateSpeed();
});