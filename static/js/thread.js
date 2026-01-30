// concurrency.js - Visualização de Concorrência

document.addEventListener('DOMContentLoaded', function() {
    // ===== CONSTANTES =====
    const THREAD_COLORS = [
        '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
    ];

    const SPEED_LABELS = {
        50: 'Muito Rápido',
        150: 'Rápido',
        300: 'Normal',
        600: 'Lento',
        1000: 'Muito Lento'
    };

    const SCENARIO_INFO = {
        race_condition: {
            title: 'Race Condition',
            description: 'Múltiplas threads acessando e modificando uma variável compartilhada sem sincronização adequada, resultando em valores incorretos devido à intercalação das operações.',
            code: `shared_counter = 0

def thread_function():
    global shared_counter
    for i in range(1000):
        temp = shared_counter
        temp += 1
        shared_counter = temp
        
# Resultado esperado: 4000
# Resultado real: < 4000 (depende da intercalação)`
        },
        deadlock: {
            title: 'Deadlock',
            description: 'Duas ou mais threads bloqueadas permanentemente, cada uma esperando por um recurso mantido pela outra. Condições: posse e espera, não-preempção, espera circular.',
            code: `recurso_A = Lock()
recurso_B = Lock()

def thread_1():
    recurso_A.acquire()
    recurso_B.acquire()
    # Operações...
    recurso_B.release()
    recurso_A.release()

def thread_2():
    recurso_B.acquire()
    recurso_A.acquire()  # DEADLOCK!
    # Operações...
    recurso_A.release()
    recurso_B.release()`
        },
        producer_consumer: {
            title: 'Produtor-Consumidor',
            description: 'Produtores adicionam itens a um buffer compartilhado enquanto consumidores removem. Problema de sincronização quando buffer está vazio/cheio.',
            code: `buffer = []
tamanho_maximo = 5
mutex = Lock()
vazio = Semaphore(tamanho_maximo)
cheio = Semaphore(0)

def produtor():
    while True:
        item = produzir_item()
        vazio.acquire()
        mutex.acquire()
        buffer.append(item)
        mutex.release()
        cheio.release()

def consumidor():
    while True:
        cheio.acquire()
        mutex.acquire()
        item = buffer.pop(0)
        mutex.release()
        vazio.release()
        consumir_item(item)`
        },
        reader_writer: {
            title: 'Leitores-Escritores',
            description: 'Múltiplos leitores podem acessar simultaneamente, mas escritores requerem acesso exclusivo. Problema de justiça entre leitores e escritores.',
            code: `leitores_ativos = 0
mutex = Lock()
escritor_lock = Lock()

def leitor():
    mutex.acquire()
    leitores_ativos += 1
    if leitores_ativos == 1:
        escritor_lock.acquire()
    mutex.release()
    
    # Ler dados...
    
    mutex.acquire()
    leitores_ativos -= 1
    if leitores_ativos == 0:
        escritor_lock.release()
    mutex.release()

def escritor():
    escritor_lock.acquire()
    # Escrever dados...
    escritor_lock.release()`
        }
    };

    // ===== ELEMENTOS DOM =====
    const elements = {
        // Cenário
        scenarioOptions: document.querySelectorAll('.scenario-option'),
        scenarioTitle: document.getElementById('scenarioTitle'),
        scenarioDescription: document.getElementById('scenarioDescription'),
        scenarioCode: document.getElementById('scenarioCode'),
        
        // Configurações
        threadCount: document.getElementById('threadCount'),
        threadCountValue: document.getElementById('threadCountValue'),
        executionSpeed: document.getElementById('executionSpeed'),
        executionSpeedValue: document.getElementById('executionSpeedValue'),
        synchronization: document.getElementById('synchronization'),
        iterations: document.getElementById('iterations'),
        iterationsValue: document.getElementById('iterationsValue'),
        
        // Botões
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        stepBtn: document.getElementById('stepBtn'),
        resetBtn: document.getElementById('resetBtn'),
        zoomIn: document.getElementById('zoomIn'),
        zoomOut: document.getElementById('zoomOut'),
        
        // Estatísticas
        activeThreads: document.getElementById('activeThreads'),
        totalOperations: document.getElementById('totalOperations'),
        raceConditions: document.getElementById('raceConditions'),
        deadlocks: document.getElementById('deadlocks'),
        executionTime: document.getElementById('executionTime'),
        status: document.getElementById('status'),
        
        // Estado do Sistema
        sharedVariable: document.getElementById('sharedVariable'),
        bufferState: document.getElementById('bufferState'),
        mutexState: document.getElementById('mutexState'),
        semaphoreCount: document.getElementById('semaphoreCount'),
        activeReaders: document.getElementById('activeReaders'),
        activeWriter: document.getElementById('activeWriter'),
        
        // Containers
        threadsContainer: document.getElementById('threadsContainer'),
        resourcesContainer: document.getElementById('resourcesContainer'),
        timelineContainer: document.getElementById('timelineContainer'),
        eventsContainer: document.getElementById('eventsContainer'),
        problemsContainer: document.getElementById('problemsContainer')
    };

    // ===== ESTADO DA APLICAÇÃO =====
    const state = {
        currentScenario: 'race_condition',
        threads: [],
        resources: {},
        timeline: [],
        events: [],
        problems: [],
        
        // Estado compartilhado
        sharedCounter: 0,
        buffer: [],
        mutexLocked: false,
        semaphoreValue: 1,
        readersCount: 0,
        writerActive: false,
        
        // Contadores
        totalOperations: 0,
        raceConditionCount: 0,
        deadlockCount: 0,
        startTime: null,
        
        // Controle de execução
        isRunning: false,
        isPaused: false,
        stepMode: false,
        speed: 300,
        iterationLimit: 20
    };

    // ===== INICIALIZAÇÃO =====
    function init() {
        setupEventListeners();
        updateControls();
        setupScenario();
        updateStatistics();
        logEvent('Sistema inicializado. Selecione um cenário e clique em Iniciar.', 'info');
    }

    // ===== CONFIGURAÇÃO DE EVENTOS =====
    function setupEventListeners() {
        // Seleção de cenário
        elements.scenarioOptions.forEach(option => {
            option.addEventListener('click', () => {
                elements.scenarioOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                state.currentScenario = option.dataset.scenario;
                setupScenario();
                resetSimulation();
            });
        });
        
        // Sliders
        elements.threadCount.addEventListener('input', updateControls);
        elements.executionSpeed.addEventListener('input', updateControls);
        elements.iterations.addEventListener('input', updateControls);
        
        // Botões
        elements.startBtn.addEventListener('click', startSimulation);
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.stepBtn.addEventListener('click', toggleStepMode);
        elements.resetBtn.addEventListener('click', resetSimulation);
        
        // Controles de zoom
        elements.zoomIn.addEventListener('click', () => zoomVisualization(1.2));
        elements.zoomOut.addEventListener('click', () => zoomVisualization(0.8));
    }

    // ===== ATUALIZAÇÃO DE CONTROLES =====
    function updateControls() {
        // Atualizar displays
        elements.threadCountValue.textContent = elements.threadCount.value;
        elements.iterationsValue.textContent = elements.iterations.value;
        
        const speed = parseInt(elements.executionSpeed.value);
        state.speed = speed;
        elements.executionSpeedValue.textContent = SPEED_LABELS[speed] || 'Normal';
        
        state.iterationLimit = parseInt(elements.iterations.value);
    }

    // ===== CONFIGURAÇÃO DO CENÁRIO =====
    function setupScenario() {
        const info = SCENARIO_INFO[state.currentScenario];
        
        // Atualizar informações
        elements.scenarioTitle.textContent = info.title;
        elements.scenarioDescription.textContent = info.description;
        elements.scenarioCode.textContent = info.code;
        
        // Configurar recursos baseados no cenário
        setupResources();
        
        // Atualizar visualização
        updateVisualization();
        
        logEvent(`Cenário alterado para: ${info.title}`, 'info');
    }

    function setupResources() {
        state.resources = {};
        
        switch(state.currentScenario) {
            case 'race_condition':
                state.resources = {
                    'shared_variable': { name: 'Contador Compartilhado', locked: false, owner: null }
                };
                break;
                
            case 'deadlock':
                state.resources = {
                    'resource_a': { name: 'Recurso A', locked: false, owner: null },
                    'resource_b': { name: 'Recurso B', locked: false, owner: null }
                };
                break;
                
            case 'producer_consumer':
                state.resources = {
                    'buffer': { name: 'Buffer Compartilhado', locked: false, owner: null },
                    'mutex': { name: 'Mutex do Buffer', locked: false, owner: null },
                    'semaphore_empty': { name: 'Semáforo Vazio', locked: false, owner: null },
                    'semaphore_full': { name: 'Semáforo Cheio', locked: false, owner: null }
                };
                state.buffer = [];
                break;
                
            case 'reader_writer':
                state.resources = {
                    'data': { name: 'Dados Compartilhados', locked: false, owner: null },
                    'mutex': { name: 'Mutex de Leitores', locked: false, owner: null },
                    'writer_lock': { name: 'Lock de Escritor', locked: false, owner: null }
                };
                state.readersCount = 0;
                state.writerActive = false;
                break;
        }
        
        renderResources();
    }

    // ===== SIMULAÇÃO =====
    function startSimulation() {
        if (state.isRunning) return;
        
        state.isRunning = true;
        state.isPaused = false;
        state.startTime = Date.now();
        
        // Resetar contadores
        state.totalOperations = 0;
        state.raceConditionCount = 0;
        state.deadlockCount = 0;
        state.problems = [];
        
        // Criar threads
        createThreads();
        
        // Atualizar interface
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        elements.stepBtn.disabled = true;
        updateStatus('running');
        updateStatistics();
        
        // Iniciar simulação
        runSimulation();
        
        logEvent('Simulação iniciada.', 'info');
    }

    function createThreads() {
        const threadCount = parseInt(elements.threadCount.value);
        state.threads = [];
        
        for (let i = 0; i < threadCount; i++) {
            state.threads.push({
                id: i,
                name: `Thread ${i + 1}`,
                color: THREAD_COLORS[i % THREAD_COLORS.length],
                state: 'waiting',
                progress: 0,
                completed: 0,
                total: state.iterationLimit,
                operations: [],
                waitingFor: null
            });
        }
        
        renderThreads();
    }

    async function runSimulation() {
        const syncType = elements.synchronization.value;
        
        // Executar baseado no cenário
        switch(state.currentScenario) {
            case 'race_condition':
                await simulateRaceCondition(syncType);
                break;
                
            case 'deadlock':
                await simulateDeadlock(syncType);
                break;
                
            case 'producer_consumer':
                await simulateProducerConsumer(syncType);
                break;
                
            case 'reader_writer':
                await simulateReaderWriter(syncType);
                break;
        }
        
        // Finalizar simulação
        finishSimulation();
    }

    async function simulateRaceCondition(syncType) {
        const expectedTotal = state.threads.length * state.iterationLimit;
        state.sharedCounter = 0;
        
        // Função para thread
        async function threadWork(thread) {
            for (let i = 0; i < state.iterationLimit; i++) {
                if (!state.isRunning || state.isPaused) return;
                
                // Atualizar estado da thread
                thread.state = 'working';
                thread.progress = (i + 1) / state.iterationLimit * 100;
                updateThread(thread);
                
                // Simular operação com/sem sincronização
                await sleep(state.speed / 2);
                
                if (syncType === 'none') {
                    // Race condition: ler, modificar, escrever sem atomicidade
                    const temp = state.sharedCounter;
                    await sleep(Math.random() * state.speed / 4); // Simular intercalação
                    state.sharedCounter = temp + 1;
                    
                    // Detectar race condition
                    if (state.sharedCounter !== i + thread.completed + 1) {
                        state.raceConditionCount++;
                        logEvent(`Race condition detectada! Thread ${thread.id + 1}, valor: ${state.sharedCounter}`, 'warning');
                        addProblem(`Race Condition: Thread ${thread.id + 1} interferiu na operação`);
                    }
                } else {
                    // Com sincronização
                    await acquireSync(syncType, 'shared_variable', thread);
                    state.sharedCounter++;
                    await releaseSync(syncType, 'shared_variable', thread);
                }
                
                thread.completed++;
                state.totalOperations++;
                
                // Atualizar interface
                updateVisualization();
                await sleep(state.speed / 2);
            }
            
            thread.state = 'finished';
            updateThread(thread);
        }
        
        // Executar todas as threads
        const promises = state.threads.map(thread => threadWork(thread));
        await Promise.all(promises);
        
        // Verificar resultado
        if (syncType === 'none') {
            const success = state.sharedCounter === expectedTotal;
            logEvent(`Resultado final: ${state.sharedCounter} (Esperado: ${expectedTotal})`, 
                    success ? 'success' : 'error');
            if (!success) {
                addProblem(`Race Condition: Valor final incorreto (${state.sharedCounter} vs ${expectedTotal})`);
            }
        } else {
            const success = state.sharedCounter === expectedTotal;
            logEvent(`Resultado com ${syncType}: ${state.sharedCounter} (Correto!)`, 
                    success ? 'success' : 'error');
        }
    }

    async function simulateDeadlock(syncType) {
        // Configurar deadlock ou não baseado na sincronização
        const willDeadlock = syncType === 'none' && state.threads.length >= 2;
        
        async function threadWork(thread) {
            if (thread.id % 2 === 0) {
                // Threads pares: A -> B
                await acquireSync(syncType, 'resource_a', thread);
                logEvent(`Thread ${thread.id + 1} adquiriu Recurso A`, 'info');
                await sleep(state.speed);
                
                await acquireSync(syncType, 'resource_b', thread);
                logEvent(`Thread ${thread.id + 1} adquiriu Recurso B`, 'info');
                
                // Trabalhar...
                await sleep(state.speed);
                
                await releaseSync(syncType, 'resource_b', thread);
                await releaseSync(syncType, 'resource_a', thread);
            } else {
                // Threads ímpares: B -> A (potencial deadlock)
                if (willDeadlock) {
                    await acquireSync(syncType, 'resource_b', thread);
                    logEvent(`Thread ${thread.id + 1} adquiriu Recurso B`, 'info');
                    await sleep(state.speed);
                    
                    // Tentar adquirir A (deadlock se A já estiver com outra thread)
                    const acquired = await tryAcquireSync(syncType, 'resource_a', thread, 1000);
                    if (!acquired) {
                        state.deadlockCount++;
                        logEvent(`DEADLOCK! Thread ${thread.id + 1} esperando por Recurso A`, 'error');
                        addProblem(`Deadlock: Thread ${thread.id + 1} bloqueada esperando Recurso A`);
                        thread.state = 'deadlocked';
                        updateThread(thread);
                        return;
                    }
                } else {
                    // Com sincronização ou ordem consistente
                    await acquireSync(syncType, 'resource_a', thread);
                    await acquireSync(syncType, 'resource_b', thread);
                }
                
                // Trabalhar...
                await sleep(state.speed);
                
                await releaseSync(syncType, 'resource_b', thread);
                await releaseSync(syncType, 'resource_a', thread);
            }
            
            thread.state = 'finished';
            updateThread(thread);
        }
        
        const promises = state.threads.map(thread => threadWork(thread));
        await Promise.all(promises);
    }

    // Funções auxiliares de sincronização
    async function acquireSync(type, resource, thread) {
        if (type === 'none') {
            state.resources[resource].locked = true;
            state.resources[resource].owner = thread.id;
            thread.waitingFor = null;
            updateResources();
            return true;
        }
        
        // Simular diferentes mecanismos de sincronização
        await sleep(state.speed / 3);
        state.resources[resource].locked = true;
        state.resources[resource].owner = thread.id;
        updateResources();
        return true;
    }

    async function tryAcquireSync(type, resource, thread, timeout) {
        const start = Date.now();
        
        while (Date.now() - start < timeout) {
            if (!state.resources[resource].locked) {
                return await acquireSync(type, resource, thread);
            }
            await sleep(100);
        }
        
        return false;
    }

    async function releaseSync(type, resource, thread) {
        if (state.resources[resource].owner === thread.id) {
            state.resources[resource].locked = false;
            state.resources[resource].owner = null;
            updateResources();
        }
        await sleep(state.speed / 3);
    }

    // ===== CONTROLES DA SIMULAÇÃO =====
    function togglePause() {
        if (!state.isRunning) return;
        
        state.isPaused = !state.isPaused;
        elements.pauseBtn.innerHTML = state.isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
        
        updateStatus(state.isPaused ? 'paused' : 'running');
        
        if (!state.isPaused && !state.stepMode) {
            // Continuar simulação
            setTimeout(() => {}, 0);
        }
    }

    function toggleStepMode() {
        state.stepMode = !state.stepMode;
        elements.stepBtn.innerHTML = state.stepMode ? 
            '<i class="fas fa-forward"></i> Próximo Passo' : 
            '<i class="fas fa-step-forward"></i> Passo';
        
        if (state.stepMode && !state.isRunning) {
            startSimulation();
        }
    }

    function resetSimulation() {
        state.isRunning = false;
        state.isPaused = false;
        state.stepMode = false;
        
        // Resetar estado
        state.sharedCounter = 0;
        state.buffer = [];
        state.readersCount = 0;
        state.writerActive = false;
        state.totalOperations = 0;
        state.raceConditionCount = 0;
        state.deadlockCount = 0;
        state.problems = [];
        
        // Resetar threads
        state.threads.forEach(thread => {
            thread.state = 'waiting';
            thread.progress = 0;
            thread.completed = 0;
            thread.waitingFor = null;
        });
        
        // Resetar recursos
        Object.keys(state.resources).forEach(key => {
            state.resources[key].locked = false;
            state.resources[key].owner = null;
        });
        
        // Resetar interface
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        elements.stepBtn.disabled = false;
        elements.stepBtn.innerHTML = '<i class="fas fa-step-forward"></i> Passo';
        
        // Atualizar visualização
        updateVisualization();
        updateStatistics();
        updateStatus('ready');
        
        logEvent('Simulação reiniciada.', 'info');
    }

    function finishSimulation() {
        state.isRunning = false;
        
        // Calcular tempo de execução
        const elapsedTime = state.startTime ? 
            Math.floor((Date.now() - state.startTime) / 1000) : 0;
        elements.executionTime.textContent = `${elapsedTime}s`;
        
        // Atualizar interface
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.stepBtn.disabled = false;
        
        updateStatus('finished');
        
        // Resumo
        logEvent(`Simulação concluída! Operações: ${state.totalOperations}, Race Conditions: ${state.raceConditionCount}, Deadlocks: ${state.deadlockCount}`, 
                state.raceConditionCount > 0 || state.deadlockCount > 0 ? 'warning' : 'success');
    }

    // ===== RENDERIZAÇÃO =====
    function renderThreads() {
        elements.threadsContainer.innerHTML = '';
        
        state.threads.forEach(thread => {
            const threadEl = document.createElement('div');
            threadEl.className = `thread-item ${thread.state === 'working' ? 'active' : ''}`;
            threadEl.style.borderColor = thread.color;
            
            threadEl.innerHTML = `
                <div class="thread-color" style="background: ${thread.color}"></div>
                <div class="thread-info">
                    <div class="thread-name">${thread.name}</div>
                    <div class="thread-state">${thread.state === 'deadlocked' ? '❌ Deadlock' : thread.state}</div>
                </div>
                <div class="thread-progress">
                    <div class="thread-progress-fill" style="width: ${thread.progress}%; background: ${thread.color}"></div>
                </div>
            `;
            
            elements.threadsContainer.appendChild(threadEl);
        });
    }

    function updateThread(thread) {
        const threadIndex = state.threads.findIndex(t => t.id === thread.id);
        if (threadIndex !== -1) {
            state.threads[threadIndex] = thread;
            renderThreads();
        }
    }

    function renderResources() {
        elements.resourcesContainer.innerHTML = '';
        
        Object.entries(state.resources).forEach(([key, resource]) => {
            const resourceEl = document.createElement('div');
            resourceEl.className = 'resource-item';
            
            const isLocked = resource.locked;
            const ownerThread = resource.owner !== null ? 
                state.threads.find(t => t.id === resource.owner) : null;
            
            resourceEl.innerHTML = `
                <div class="resource-icon">
                    <i class="fas ${isLocked ? 'fa-lock' : 'fa-unlock'}"></i>
                </div>
                <div class="resource-info">
                    <div class="resource-name">${resource.name}</div>
                    <div class="resource-state ${isLocked ? 'resource-locked' : 'resource-unlocked'}">
                        ${isLocked ? 
                            `🔒 Bloqueado por ${ownerThread ? ownerThread.name : 'Thread'}` : 
                            '🔓 Desbloqueado'}
                    </div>
                </div>
            `;
            
            elements.resourcesContainer.appendChild(resourceEl);
        });
    }

    function updateResources() {
        // Atualizar estado do sistema baseado nos recursos
        switch(state.currentScenario) {
            case 'race_condition':
                elements.sharedVariable.textContent = state.sharedCounter;
                elements.mutexState.textContent = state.resources.shared_variable?.locked ? 'Bloqueado' : 'Desbloqueado';
                break;
                
            case 'producer_consumer':
                elements.bufferState.textContent = state.buffer.length > 0 ? 
                    `${state.buffer.length} itens` : 'Vazio';
                elements.mutexState.textContent = state.resources.mutex?.locked ? 'Bloqueado' : 'Desbloqueado';
                break;
                
            case 'reader_writer':
                elements.activeReaders.textContent = state.readersCount;
                elements.activeWriter.textContent = state.writerActive ? 'Sim' : 'Não';
                elements.mutexState.textContent = state.resources.mutex?.locked ? 'Bloqueado' : 'Desbloqueado';
                break;
        }
        
        renderResources();
    }

    function updateVisualization() {
        renderThreads();
        updateResources();
        updateStatistics();
        
        // Atualizar timeline
        updateTimeline();
    }

    function updateTimeline() {
        // Manter apenas os últimos 10 eventos na timeline
        if (state.timeline.length > 10) {
            state.timeline = state.timeline.slice(-10);
        }
        
        elements.timelineContainer.innerHTML = '';
        
        state.timeline.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'timeline-event';
            eventEl.style.borderLeftColor = event.color;
            
            eventEl.innerHTML = `
                <span class="timeline-time">${event.time}</span>
                <span class="timeline-message">${event.message}</span>
            `;
            
            elements.timelineContainer.appendChild(eventEl);
        });
    }

    function updateStatistics() {
        // Atualizar estatísticas
        elements.activeThreads.textContent = state.threads.filter(t => t.state === 'working').length;
        elements.totalOperations.textContent = state.totalOperations;
        elements.raceConditions.textContent = state.raceConditionCount;
        elements.deadlocks.textContent = state.deadlockCount;
        
        if (state.startTime && state.isRunning) {
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

    // ===== LOGGING E PROBLEMAS =====
    function logEvent(message, type = 'info') {
        const time = new Date();
        const timeString = time.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Adicionar ao log
        const eventEntry = document.createElement('div');
        eventEntry.className = `event-entry ${type}`;
        eventEntry.innerHTML = `
            <span class="event-time">${timeString}</span>
            <span class="event-message">${message}</span>
        `;
        
        elements.eventsContainer.appendChild(eventEntry);
        
        // Adicionar à timeline
        const threadColor = type === 'info' ? '#3b82f6' : 
                           type === 'warning' ? '#f59e0b' : 
                           type === 'error' ? '#ef4444' : '#10b981';
        
        state.timeline.push({
            time: timeString.split(' ')[0],
            message: message,
            color: threadColor
        });
        
        // Limitar logs
        const events = elements.eventsContainer.querySelectorAll('.event-entry');
        if (events.length > 20) {
            events[0].remove();
        }
        
        // Scroll para o final
        elements.eventsContainer.scrollTop = elements.eventsContainer.scrollHeight;
        updateTimeline();
    }

    function addProblem(message) {
        state.problems.push(message);
        
        // Atualizar painel de problemas
        elements.problemsContainer.innerHTML = '';
        
        if (state.problems.length === 0) {
            elements.problemsContainer.innerHTML = `
                <div class="problem-item">
                    <div class="problem-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="problem-content">
                        <p>Nenhum problema detectado ainda. Execute a simulação para ver problemas de concorrência.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Mostrar apenas os últimos problemas
        const recentProblems = state.problems.slice(-3);
        
        recentProblems.forEach(problem => {
            const problemEl = document.createElement('div');
            problemEl.className = 'problem-item';
            
            problemEl.innerHTML = `
                <div class="problem-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="problem-content">
                    <p>${problem}</p>
                </div>
            `;
            
            elements.problemsContainer.appendChild(problemEl);
        });
    }

    // ===== UTILITÁRIOS =====
    function sleep(ms) {
        return new Promise(resolve => {
            if (state.isPaused && !state.stepMode) {
                const checkInterval = setInterval(() => {
                    if (!state.isPaused && state.isRunning) {
                        clearInterval(checkInterval);
                        setTimeout(resolve, ms);
                    }
                }, 100);
            } else {
                setTimeout(resolve, ms);
            }
        });
    }

    function zoomVisualization(factor) {
        // Implementar zoom se necessário
        console.log(`Zoom: ${factor}`);
    }

    // ===== INICIAR APLICAÇÃO =====
    init();
});