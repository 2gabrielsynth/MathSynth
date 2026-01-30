// backtracking_maze.js - Implementação refatorada

document.addEventListener('DOMContentLoaded', function() {
    // ===== CONSTANTES =====
    const DIRECTIONS = [
        { dx: 0, dy: -1, name: 'Cima', symbol: '↑' },
        { dx: 1, dy: 0, name: 'Direita', symbol: '→' },
        { dx: 0, dy: 1, name: 'Baixo', symbol: '↓' },
        { dx: -1, dy: 0, name: 'Esquerda', symbol: '←' }
    ];

    const SPEED_LABELS = {
        10: 'Muito Rápido',
        50: 'Rápido',
        100: 'Normal',
        250: 'Lento',
        500: 'Muito Lento'
    };

    // ===== ELEMENTOS DOM =====
    const elements = {
        // Sliders e displays
        mazeSize: document.getElementById('mazeSize'),
        mazeSizeValue: document.getElementById('mazeSizeValue'),
        wallDensity: document.getElementById('wallDensity'),
        wallDensityValue: document.getElementById('wallDensityValue'),
        animationSpeed: document.getElementById('animationSpeed'),
        animationSpeedValue: document.getElementById('animationSpeedValue'),
        algorithmType: document.getElementById('algorithmType'),
        
        // Botões
        generateMazeBtn: document.getElementById('generateMazeBtn'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        stepBtn: document.getElementById('stepBtn'),
        resetBtn: document.getElementById('resetBtn'),
        zoomIn: document.getElementById('zoomIn'),
        zoomOut: document.getElementById('zoomOut'),
        
        // Estatísticas
        currentSize: document.getElementById('currentSize'),
        totalCells: document.getElementById('totalCells'),
        pathLength: document.getElementById('pathLength'),
        exploredCells: document.getElementById('exploredCells'),
        backtrackCount: document.getElementById('backtrackCount'),
        executionTime: document.getElementById('executionTime'),
        status: document.getElementById('status'),
        
        // Estado atual
        currentPosition: document.getElementById('currentPosition'),
        currentDirection: document.getElementById('currentDirection'),
        stackSize: document.getElementById('stackSize'),
        nextMove: document.getElementById('nextMove'),
        
        // Visualização
        mazeGrid: document.getElementById('mazeGrid'),
        
        // Pilha e Log
        stackContainer: document.getElementById('stackContainer'),
        logContainer: document.getElementById('logContainer')
    };

    // ===== ESTADO DA APLICAÇÃO =====
    const state = {
        maze: [],
        size: 10,
        start: { x: 1, y: 1 },
        end: { x: 8, y: 8 },
        current: { x: 1, y: 1 },
        
        algorithmRunning: false,
        algorithmPaused: false,
        stepMode: false,
        speed: 100,
        
        visited: new Set(),
        path: [],
        backtrackPath: [],
        stack: [],
        exploredCount: 0,
        backtrackCount: 0,
        
        startTime: null,
        zoom: 1.0
    };

    // ===== INICIALIZAÇÃO =====
    function init() {
        setupEventListeners();
        updateControls();
        generateMaze();
        updateStatistics();
        logMessage('Sistema inicializado. Gere um labirinto e clique em Resolver.', 'info');
    }

    // ===== CONFIGURAÇÃO DE EVENTOS =====
    function setupEventListeners() {
        // Sliders
        elements.mazeSize.addEventListener('input', () => {
            updateControls();
            generateMaze();
            resetAlgorithm();
        });
        
        elements.wallDensity.addEventListener('input', () => {
            updateControls();
            generateMaze();
            resetAlgorithm();
        });
        
        elements.animationSpeed.addEventListener('input', updateSpeed);
        
        // Botões principais
        elements.generateMazeBtn.addEventListener('click', () => {
            generateMaze();
            resetAlgorithm();
        });
        
        elements.startBtn.addEventListener('click', startAlgorithm);
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.stepBtn.addEventListener('click', toggleStepMode);
        elements.resetBtn.addEventListener('click', resetAlgorithm);
        
        // Controles de zoom
        elements.zoomIn.addEventListener('click', () => zoomMaze(1.2));
        elements.zoomOut.addEventListener('click', () => zoomMaze(0.8));
    }

    // ===== ATUALIZAÇÃO DE CONTROLES =====
    function updateControls() {
        // Atualizar displays dos sliders
        const size = parseInt(elements.mazeSize.value);
        elements.mazeSizeValue.textContent = `${size}x${size}`;
        
        const density = parseInt(elements.wallDensity.value);
        elements.wallDensityValue.textContent = `${density}%`;
        
        updateSpeed();
    }

    function updateSpeed() {
        const speed = parseInt(elements.animationSpeed.value);
        state.speed = speed;
        elements.animationSpeedValue.textContent = SPEED_LABELS[speed] || 'Normal';
    }

    // ===== GERAÇÃO DO LABIRINTO =====
    function generateMaze() {
        const size = parseInt(elements.mazeSize.value);
        const wallProbability = parseInt(elements.wallDensity.value) / 100;
        
        state.size = size;
        state.maze = [];
        
        // Gerar grid vazio
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                // Bordas são sempre paredes
                if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
                    row.push({ x, y, isWall: true });
                } else {
                    // Interno tem chance de ser parede
                    row.push({ x, y, isWall: Math.random() < wallProbability });
                }
            }
            state.maze.push(row);
        }
        
        // Definir início e fim
        state.start = { x: 1, y: 1 };
        state.end = { x: size - 2, y: size - 2 };
        
        state.maze[state.start.y][state.start.x].isWall = false;
        state.maze[state.end.y][state.end.x].isWall = false;
        
        // Garantir caminho mínimo
        guaranteeBasicPath();
        
        // Resetar estado atual
        state.current = { ...state.start };
        
        // Atualizar interface
        updateStatistics();
        renderMaze();
        
        logMessage(`Labirinto ${size}x${size} gerado com ${Math.round(wallProbability * 100)}% de paredes.`, 'info');
    }

    function guaranteeBasicPath() {
        // Garante um caminho básico do início ao fim
        let x = state.start.x;
        let y = state.start.y;
        
        // Direita até a coluna do fim
        while (x < state.end.x) {
            state.maze[y][x].isWall = false;
            x++;
        }
        
        // Baixo até a linha do fim
        while (y < state.end.y) {
            state.maze[y][x].isWall = false;
            y++;
        }
        
        state.maze[state.end.y][state.end.x].isWall = false;
    }

    // ===== RENDERIZAÇÃO DO LABIRINTO =====
    function renderMaze() {
        elements.mazeGrid.innerHTML = '';
        elements.mazeGrid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
        
        // Aplicar zoom
        const cellSize = 30 * state.zoom;
        elements.mazeGrid.style.fontSize = `${Math.max(10, 12 * state.zoom)}px`;
        
        for (let y = 0; y < state.size; y++) {
            for (let x = 0; x < state.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const cellData = state.maze[y][x];
                
                // Definir tipo de célula
                if (cellData.isWall) {
                    cell.classList.add('wall');
                } else {
                    // Verificar estado da célula
                    if (x === state.start.x && y === state.start.y) {
                        cell.classList.add('start');
                    } else if (x === state.end.x && y === state.end.y) {
                        cell.classList.add('end');
                    } else if (state.path.some(p => p.x === x && p.y === y)) {
                        cell.classList.add('path');
                    } else if (state.backtrackPath.some(p => p.x === x && p.y === y)) {
                        cell.classList.add('backtrack');
                    } else if (state.visited.has(`${x},${y}`)) {
                        cell.classList.add('visited');
                    }
                    
                    // Célula atual
                    if (x === state.current.x && y === state.current.y) {
                        cell.classList.add('current');
                    }
                }
                
                // Tooltip com coordenadas
                cell.title = `(${x}, ${y})`;
                
                elements.mazeGrid.appendChild(cell);
            }
        }
    }

    function zoomMaze(factor) {
        state.zoom = Math.max(0.5, Math.min(2.0, state.zoom * factor));
        renderMaze();
    }

    // ===== ALGORITMO DE BACKTRACKING =====
    function startAlgorithm() {
        if (state.algorithmRunning) return;
        
        state.algorithmRunning = true;
        state.algorithmPaused = false;
        state.startTime = Date.now();
        
        // Resetar dados do algoritmo
        state.visited.clear();
        state.path = [];
        state.backtrackPath = [];
        state.stack = [];
        state.exploredCount = 0;
        state.backtrackCount = 0;
        state.current = { ...state.start };
        
        // Atualizar interface
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        elements.stepBtn.disabled = true;
        
        updateStatus('running');
        updateStatistics();
        updateStack();
        
        // Iniciar algoritmo
        runDFS();
    }

    async function runDFS() {
        const algorithm = elements.algorithmType.value;
        let found = false;
        
        async function dfs(x, y) {
            if (!state.algorithmRunning || state.algorithmPaused) {
                return false;
            }
            
            // Verificar se chegou ao fim
            if (x === state.end.x && y === state.end.y) {
                state.path.push({ x, y });
                state.visited.add(`${x},${y}`);
                state.exploredCount++;
                
                updateVisualization();
                logMessage(`🎉 Saída encontrada em (${x}, ${y})!`, 'success');
                return true;
            }
            
            // Marcar como visitado
            state.visited.add(`${x},${y}`);
            state.exploredCount++;
            state.current = { x, y };
            
            // Adicionar à pilha
            state.stack.push({ x, y, depth: state.stack.length });
            updateStack();
            
            // Atualizar visualização
            updateVisualization();
            await sleep(state.speed);
            
            // Determinar ordem das direções
            let directionsToTry = [...DIRECTIONS];
            
            switch (algorithm) {
                case 'dfs_random':
                    // Embaralhar direções
                    directionsToTry.sort(() => Math.random() - 0.5);
                    break;
                    
                case 'dfs_heuristic':
                    // Ordenar por proximidade do objetivo
                    directionsToTry.sort((a, b) => {
                        const distA = Math.abs(state.end.x - (x + a.dx)) + Math.abs(state.end.y - (y + a.dy));
                        const distB = Math.abs(state.end.x - (x + b.dx)) + Math.abs(state.end.y - (y + b.dy));
                        return distA - distB;
                    });
                    break;
            }
            
            // Tentar cada direção
            for (const dir of directionsToTry) {
                if (!state.algorithmRunning || state.algorithmPaused) {
                    return false;
                }
                
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                // Atualizar direção atual
                elements.currentDirection.textContent = dir.symbol;
                elements.nextMove.textContent = dir.name;
                
                await sleep(state.speed / 2);
                
                // Verificar se pode mover
                if (canMoveTo(newX, newY)) {
                    // Adicionar ao caminho
                    state.path.push({ x, y });
                    
                    // Chamada recursiva
                    const result = await dfs(newX, newY);
                    
                    if (result) {
                        // Caminho encontrado, voltar adicionando ao caminho
                        state.path.push({ x, y });
                        return true;
                    }
                    
                    // Backtrack: remover do caminho
                    state.path.pop();
                    state.backtrackPath.push({ x, y });
                    state.backtrackCount++;
                    
                    updateVisualization();
                    updateStatistics();
                    
                    logMessage(`↩️ Backtrack de (${x}, ${y})`, 'warning');
                    await sleep(state.speed);
                }
            }
            
            // Remover da pilha
            state.stack.pop();
            updateStack();
            
            return false;
        }
        
        // Executar DFS
        found = await dfs(state.start.x, state.start.y);
        
        // Finalizar algoritmo
        finishAlgorithm(found);
    }

    function canMoveTo(x, y) {
        // Verificar limites
        if (x < 0 || x >= state.size || y < 0 || y >= state.size) {
            return false;
        }
        
        // Verificar se não é parede
        if (state.maze[y][x].isWall) {
            return false;
        }
        
        // Verificar se não foi visitada
        if (state.visited.has(`${x},${y}`)) {
            return false;
        }
        
        return true;
    }

    // ===== CONTROLES DO ALGORITMO =====
    function togglePause() {
        if (!state.algorithmRunning) return;
        
        state.algorithmPaused = !state.algorithmPaused;
        elements.pauseBtn.innerHTML = state.algorithmPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        
        updateStatus(state.algorithmPaused ? 'paused' : 'running');
        
        if (!state.algorithmPaused && !state.stepMode) {
            // Continuar execução
            setTimeout(() => {}, 0);
        }
    }

    function toggleStepMode() {
        state.stepMode = !state.stepMode;
        elements.stepBtn.innerHTML = state.stepMode ? 
            '<i class="fas fa-forward"></i> Próximo Passo' : 
            '<i class="fas fa-step-forward"></i> Passo a Passo';
        
        if (state.stepMode && !state.algorithmRunning) {
            startAlgorithm();
        }
    }

    function resetAlgorithm() {
        state.algorithmRunning = false;
        state.algorithmPaused = false;
        state.stepMode = false;
        
        // Resetar dados
        state.visited.clear();
        state.path = [];
        state.backtrackPath = [];
        state.stack = [];
        state.exploredCount = 0;
        state.backtrackCount = 0;
        state.current = { ...state.start };
        
        // Resetar interface
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        elements.stepBtn.disabled = false;
        elements.stepBtn.innerHTML = '<i class="fas fa-step-forward"></i> Passo';
        
        // Atualizar displays
        updateVisualization();
        updateStatistics();
        updateStack();
        updateStatus('ready');
        
        logMessage('Algoritmo reiniciado.', 'info');
    }

    function finishAlgorithm(success) {
        state.algorithmRunning = false;
        
        // Calcular tempo de execução
        const elapsedTime = state.startTime ? 
            Math.floor((Date.now() - state.startTime) / 1000) : 0;
        elements.executionTime.textContent = `${elapsedTime}s`;
        
        // Atualizar interface
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.stepBtn.disabled = false;
        
        if (success) {
            updateStatus('finished');
            elements.pathLength.textContent = state.path.length;
            logMessage(`✅ Algoritmo concluído! Caminho com ${state.path.length} passos.`, 'success');
            logMessage(`📊 Estatísticas: ${state.exploredCount} células exploradas, ${state.backtrackCount} backtracks`, 'info');
        } else {
            updateStatus('finished');
            logMessage('❌ Não foi possível encontrar um caminho.', 'error');
        }
    }

    // ===== ATUALIZAÇÃO DA INTERFACE =====
    function updateVisualization() {
        renderMaze();
        updateCurrentPosition();
        updateStatistics();
    }

    function updateCurrentPosition() {
        elements.currentPosition.textContent = `(${state.current.x}, ${state.current.y})`;
        elements.stackSize.textContent = state.stack.length;
    }

    function updateStatistics() {
        // Atualizar estatísticas
        elements.currentSize.textContent = `${state.size}x${state.size}`;
        elements.totalCells.textContent = state.size * state.size;
        elements.exploredCells.textContent = state.exploredCount;
        elements.backtrackCount.textContent = state.backtrackCount;
        elements.pathLength.textContent = state.path.length > 0 ? state.path.length : '-';
        
        // Atualizar tempo se estiver executando
        if (state.startTime && state.algorithmRunning) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            elements.executionTime.textContent = `${elapsed}s`;
        }
    }

    function updateStatus(newStatus) {
        elements.status.className = `status-badge status-${newStatus}`;
        
        const statusTexts = {
            ready: 'Pronto',
            running: 'Executando',
            paused: 'Pausado',
            finished: 'Concluído'
        };
        
        elements.status.textContent = statusTexts[newStatus] || newStatus;
    }

    function updateStack() {
        elements.stackContainer.innerHTML = '';
        
        if (state.stack.length === 0) {
            elements.stackContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Pilha vazia</p>
                </div>
            `;
            return;
        }
        
        // Mostrar apenas os últimos frames
        const framesToShow = state.stack.slice(-8);
        
        framesToShow.forEach((frame, index) => {
            const stackFrame = document.createElement('div');
            stackFrame.className = `stack-frame ${index === framesToShow.length - 1 ? 'active' : ''}`;
            
            stackFrame.innerHTML = `
                <div>Posição: (${frame.x}, ${frame.y})</div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
                    Profundidade: ${frame.depth}
                </div>
            `;
            
            elements.stackContainer.appendChild(stackFrame);
        });
        
        // Scroll para o final
        elements.stackContainer.scrollTop = elements.stackContainer.scrollHeight;
    }

    function logMessage(message, type = 'info') {
        const time = new Date();
        const timeString = time.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">${timeString}</span>
            <span class="log-message">${message}</span>
        `;
        
        elements.logContainer.appendChild(logEntry);
        
        // Limitar número de logs
        const logs = elements.logContainer.querySelectorAll('.log-entry');
        if (logs.length > 30) {
            logs[0].remove();
        }
        
        // Scroll para o final
        elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
    }

    // ===== UTILITÁRIOS =====
    function sleep(ms) {
        return new Promise(resolve => {
            if (state.algorithmPaused && !state.stepMode) {
                const checkInterval = setInterval(() => {
                    if (!state.algorithmPaused && state.algorithmRunning) {
                        clearInterval(checkInterval);
                        setTimeout(resolve, ms);
                    }
                }, 100);
            } else {
                setTimeout(resolve, ms);
            }
        });
    }

    // ===== INICIAR APLICAÇÃO =====
    init();
});