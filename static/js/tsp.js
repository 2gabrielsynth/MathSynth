document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const cityCountInput = document.getElementById('cityCount');
    const cityCountValue = document.getElementById('cityCountValue');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    const mapTypeSelect = document.getElementById('mapType');
    const generateBtn = document.getElementById('generateBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const optimalBtn = document.getElementById('optimalBtn');
    
    // Elementos de visualização
    const mapContainer = document.getElementById('mapContainer');
    const distanceMatrix = document.getElementById('distanceMatrix');
    const permutationVisualization = document.getElementById('permutationVisualization');
    const optimizationProgress = document.getElementById('optimizationProgress');
    
    // Elementos de status
    const currentCity = document.getElementById('currentCity');
    const nextCity = document.getElementById('nextCity');
    const partialDistance = document.getElementById('partialDistance');
    const totalDistance = document.getElementById('totalDistance');
    const visitedCount = document.getElementById('visitedCount');
    const permutationCount = document.getElementById('permutationCount');
    const executionTime = document.getElementById('executionTime');
    const statusText = document.getElementById('statusText');
    const operationDetails = document.getElementById('operationDetails');
    
    // Variáveis de estado
    let cityCount = 5;
    let algorithm = 'bruteforce';
    let animationSpeed = 1000;
    let isRunning = false;
    let isPaused = false;
    let startTime = 0;
    let animationTimeout;
    
    // Dados do problema
    let cities = [];
    let distances = [];
    let bestPath = [];
    let bestDistance = Infinity;
    let currentPath = [];
    let currentDistance = 0;
    let visitedCities = new Set();
    let testedPermutations = 0;
    let optimalSolution = null;
    
    // Constantes
    const MAP_MARGIN = 40;
    const CITY_RADIUS = 20;
    const CITY_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    // Inicialização
    init();
    
    function init() {
        setupEventListeners();
        updateCityCount();
        generateRandomCities();
        renderMap();
        updateDistanceMatrix();
        updateStatus();
    }
    
    function setupEventListeners() {
        cityCountInput.addEventListener('input', updateCityCount);
        algorithmSelect.addEventListener('change', updateAlgorithm);
        speedInput.addEventListener('input', updateSpeed);
        mapTypeSelect.addEventListener('change', updateMapType);
        
        generateBtn.addEventListener('click', generateRandomCities);
        startBtn.addEventListener('click', startAlgorithm);
        pauseBtn.addEventListener('click', togglePause);
        resetBtn.addEventListener('click', resetAlgorithm);
        optimalBtn.addEventListener('click', showOptimalSolution);
    }
    
    function updateCityCount() {
        cityCount = parseInt(cityCountInput.value);
        cityCountValue.textContent = cityCount;
        generateRandomCities();
    }
    
    function updateAlgorithm() {
        algorithm = algorithmSelect.value;
        resetAlgorithm();
    }
    
    function updateSpeed() {
        const value = parseInt(speedInput.value);
        animationSpeed = 1500 - (value * 35);
        
        const labels = ['Muito Lento', 'Lento', 'Médio', 'Rápido', 'Muito Rápido'];
        const index = Math.floor((value - 1) / 8);
        speedValue.textContent = labels[index] || labels[labels.length - 1];
    }
    
    function updateMapType() {
        generateRandomCities();
    }
    
    function generateRandomCities() {
        cities = [];
        const mapType = mapTypeSelect.value;
        const width = mapContainer.clientWidth - MAP_MARGIN * 2;
        const height = mapContainer.clientHeight - MAP_MARGIN * 2;
        
        switch(mapType) {
            case 'random':
                // Posições aleatórias
                for (let i = 0; i < cityCount; i++) {
                    cities.push({
                        id: i,
                        name: CITY_NAMES[i],
                        x: MAP_MARGIN + Math.random() * width,
                        y: MAP_MARGIN + Math.random() * height
                    });
                }
                break;
                
            case 'grid':
                // Grade regular
                const cols = Math.ceil(Math.sqrt(cityCount));
                const rows = Math.ceil(cityCount / cols);
                const cellWidth = width / (cols - 1);
                const cellHeight = height / (rows - 1);
                
                for (let i = 0; i < cityCount; i++) {
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    cities.push({
                        id: i,
                        name: CITY_NAMES[i],
                        x: MAP_MARGIN + col * cellWidth,
                        y: MAP_MARGIN + row * cellHeight
                    });
                }
                break;
                
            case 'circle':
                // Círculo
                const centerX = MAP_MARGIN + width / 2;
                const centerY = MAP_MARGIN + height / 2;
                const radius = Math.min(width, height) * 0.4;
                
                for (let i = 0; i < cityCount; i++) {
                    const angle = (i / cityCount) * 2 * Math.PI;
                    cities.push({
                        id: i,
                        name: CITY_NAMES[i],
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle)
                    });
                }
                break;
                
            case 'clustered':
                // Agrupado
                const clusters = Math.min(3, Math.ceil(cityCount / 3));
                const citiesPerCluster = Math.ceil(cityCount / clusters);
                
                for (let cluster = 0; cluster < clusters; cluster++) {
                    const clusterX = MAP_MARGIN + (cluster + 1) * (width / (clusters + 1));
                    const clusterY = MAP_MARGIN + height / 2;
                    const clusterRadius = Math.min(width, height) * 0.15;
                    
                    const startIdx = cluster * citiesPerCluster;
                    const endIdx = Math.min(startIdx + citiesPerCluster, cityCount);
                    
                    for (let i = startIdx; i < endIdx; i++) {
                        const angle = ((i - startIdx) / (endIdx - startIdx)) * 2 * Math.PI;
                        cities.push({
                            id: i,
                            name: CITY_NAMES[i],
                            x: clusterX + clusterRadius * Math.cos(angle),
                            y: clusterY + clusterRadius * Math.sin(angle)
                        });
                    }
                }
                break;
        }
        
        // Calcular matriz de distâncias
        calculateDistances();
        
        // Renderizar mapa
        renderMap();
        updateDistanceMatrix();
        resetAlgorithm();
    }
    
    function calculateDistances() {
        distances = Array(cityCount).fill().map(() => Array(cityCount).fill(0));
        
        for (let i = 0; i < cityCount; i++) {
            for (let j = 0; j < cityCount; j++) {
                if (i === j) {
                    distances[i][j] = 0;
                } else {
                    const dx = cities[i].x - cities[j].x;
                    const dy = cities[i].y - cities[j].y;
                    distances[i][j] = Math.sqrt(dx * dx + dy * dy);
                }
            }
        }
    }
    
    function renderMap() {
        mapContainer.innerHTML = '';
        
        // Desenhar rotas existentes (se houver)
        if (currentPath.length > 1) {
            drawRoute(currentPath, 'current');
        }
        
        if (optimalSolution && optimalSolution.path) {
            drawRoute(optimalSolution.path, 'optimal');
        }
        
        // Desenhar cidades
        cities.forEach((city, index) => {
            const cityElement = document.createElement('div');
            cityElement.className = 'city';
            cityElement.id = `city-${city.id}`;
            cityElement.textContent = city.name;
            cityElement.style.left = `${city.x - CITY_RADIUS}px`;
            cityElement.style.top = `${city.y - CITY_RADIUS}px`;
            
            // Adicionar classe baseada no estado
            if (index === 0 && currentPath.length === 0) {
                cityElement.classList.add('start');
            } else if (currentPath.length > 0 && index === currentPath[currentPath.length - 1]) {
                cityElement.classList.add('current');
            } else if (visitedCities.has(index)) {
                cityElement.classList.add('visited');
            }
            
            mapContainer.appendChild(cityElement);
            
            // Adicionar tooltip com coordenadas
            cityElement.title = `${city.name} (${Math.round(city.x)}, ${Math.round(city.y)})`;
        });
        
        // Desenhar distâncias entre cidades conectadas
        if (currentPath.length >= 2) {
            for (let i = 0; i < currentPath.length - 1; i++) {
                drawDistanceLabel(currentPath[i], currentPath[i + 1]);
            }
        }
    }
    
    function drawRoute(path, type) {
        for (let i = 0; i < path.length; i++) {
            const from = path[i];
            const to = path[(i + 1) % path.length];
            
            const city1 = cities[from];
            const city2 = cities[to];
            
            // Calcular ângulo e distância
            const dx = city2.x - city1.x;
            const dy = city2.y - city1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Criar linha da rota
            const routeLine = document.createElement('div');
            routeLine.className = `route-line ${type}`;
            routeLine.style.left = `${city1.x}px`;
            routeLine.style.top = `${city1.y}px`;
            routeLine.style.width = `${distance}px`;
            routeLine.style.transform = `rotate(${angle}deg)`;
            
            mapContainer.appendChild(routeLine);
        }
    }
    
    function drawDistanceLabel(fromIdx, toIdx) {
        const city1 = cities[fromIdx];
        const city2 = cities[toIdx];
        
        const midX = (city1.x + city2.x) / 2;
        const midY = (city1.y + city2.y) / 2;
        
        const distanceLabel = document.createElement('div');
        distanceLabel.className = 'distance-label';
        distanceLabel.textContent = Math.round(distances[fromIdx][toIdx]);
        distanceLabel.style.left = `${midX}px`;
        distanceLabel.style.top = `${midY}px`;
        
        mapContainer.appendChild(distanceLabel);
    }
    
    function updateDistanceMatrix() {
        if (cityCount > 8) {
            distanceMatrix.innerHTML = '<p>Matriz muito grande para exibir (mais de 8 cidades)</p>';
            return;
        }
        
        let tableHTML = `
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th></th>
        `;
        
        // Cabeçalho
        for (let i = 0; i < cityCount; i++) {
            tableHTML += `<th>${CITY_NAMES[i]}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';
        
        // Linhas da matriz
        for (let i = 0; i < cityCount; i++) {
            tableHTML += `<tr><th>${CITY_NAMES[i]}</th>`;
            
            for (let j = 0; j < cityCount; j++) {
                let cellClass = '';
                if (i === j) {
                    cellClass = 'start';
                } else if (currentPath.length >= 2) {
                    const currentIdx = currentPath.indexOf(i);
                    const nextIdx = currentPath.indexOf(j);
                    if (currentIdx !== -1 && nextIdx !== -1 && Math.abs(currentIdx - nextIdx) === 1) {
                        cellClass = 'current';
                    } else if (currentIdx !== -1 && nextIdx !== -1 && 
                              ((currentIdx === 0 && nextIdx === currentPath.length - 1) ||
                               (nextIdx === 0 && currentIdx === currentPath.length - 1))) {
                        cellClass = 'current';
                    }
                }
                
                tableHTML += `<td class="${cellClass}">${Math.round(distances[i][j])}</td>`;
            }
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table>';
        distanceMatrix.innerHTML = tableHTML;
    }
    
    function updatePermutationVisualization() {
        permutationVisualization.innerHTML = '';
        
        if (testedPermutations === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'permutation-item';
            emptyMsg.textContent = 'Nenhuma permutação testada ainda';
            permutationVisualization.appendChild(emptyMsg);
            return;
        }
        
        // Mostrar as 10 melhores permutações
        const bestPermutations = getBestPermutations(10);
        
        bestPermutations.forEach((perm, index) => {
            const permItem = document.createElement('div');
            permItem.className = 'permutation-item';
            if (index === 0) permItem.classList.add('best');
            
            const pathText = perm.path.map(idx => CITY_NAMES[idx]).join(' → ');
            permItem.innerHTML = `
                <span class="permutation-path">${pathText}</span>
                <span class="permutation-distance">${Math.round(perm.distance)}</span>
            `;
            
            permutationVisualization.appendChild(permItem);
        });
        
        // Scroll para o topo
        permutationVisualization.scrollTop = 0;
    }
    
    function getBestPermutations(limit) {
        // Esta função seria implementada para armazenar e retornar as melhores permutações
        // Por enquanto, retornamos apenas a melhor encontrada
        if (bestPath.length > 0) {
            return [{
                path: [...bestPath],
                distance: bestDistance
            }];
        }
        return [];
    }
    
    function startAlgorithm() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = true;
        optimalBtn.disabled = true;
        statusText.textContent = 'Executando';
        startTime = Date.now();
        
        // Resetar estado
        currentPath = [0]; // Começar da cidade 0
        currentDistance = 0;
        visitedCities = new Set([0]);
        bestPath = [];
        bestDistance = Infinity;
        testedPermutations = 0;
        visitedCount.textContent = 1;
        
        // Atualizar visualização
        renderMap();
        updateStatus();
        
        // Executar algoritmo selecionado
        switch(algorithm) {
            case 'bruteforce':
                executeBruteForce();
                break;
            case 'nearest':
                executeNearestNeighbor();
                break;
            case 'christofides':
                executeChristofides();
                break;
            case 'simulated':
                executeSimulatedAnnealing();
                break;
            case 'genetic':
                executeGeneticAlgorithm();
                break;
        }
    }
    
    async function executeBruteForce() {
        operationDetails.innerHTML = '<p><strong>Força Bruta:</strong> Testando todas as permutações possíveis...</p>';
        
        // Para n pequeno, podemos testar todas as permutações
        if (cityCount > 7) {
            operationDetails.innerHTML = '<p><strong>Atenção:</strong> Força bruta é muito lenta para mais de 7 cidades.</p>';
            finishAlgorithm();
            return;
        }
        
        // Gerar todas as permutações começando da cidade 0
        const citiesToPermute = Array.from({length: cityCount - 1}, (_, i) => i + 1);
        const permutations = heapPermutation(citiesToPermute);
        
        for (let perm of permutations) {
            if (isPaused || !isRunning) return;
            
            testedPermutations++;
            permutationCount.textContent = testedPermutations;
            
            // Criar caminho completo (0 + permutação + 0)
            const path = [0, ...perm, 0];
            const distance = calculatePathDistance(path);
            
            // Atualizar melhor caminho se necessário
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPath = [...path];
                
                // Atualizar visualização
                currentPath = [...path];
                currentDistance = distance;
                updateVisualization();
            }
            
            await sleep(animationSpeed / 3);
        }
        
        finishAlgorithm();
    }
    
    function heapPermutation(arr) {
        const result = [];
        
        function generate(k, arr) {
            if (k === 1) {
                result.push([...arr]);
            } else {
                for (let i = 0; i < k; i++) {
                    generate(k - 1, arr);
                    if (k % 2 === 0) {
                        [arr[i], arr[k - 1]] = [arr[k - 1], arr[i]];
                    } else {
                        [arr[0], arr[k - 1]] = [arr[k - 1], arr[0]];
                    }
                }
            }
        }
        
        generate(arr.length, arr);
        return result;
    }
    
    async function executeNearestNeighbor() {
        operationDetails.innerHTML = '<p><strong>Vizinho Mais Próximo:</strong> Construindo rota iterativamente...</p>';
        
        currentPath = [0];
        currentDistance = 0;
        visitedCities = new Set([0]);
        
        while (visitedCities.size < cityCount) {
            if (isPaused || !isRunning) return;
            
            const currentCityIdx = currentPath[currentPath.length - 1];
            let nearestCity = -1;
            let nearestDistance = Infinity;
            
            // Encontrar cidade não visitada mais próxima
            for (let i = 0; i < cityCount; i++) {
                if (!visitedCities.has(i)) {
                    const dist = distances[currentCityIdx][i];
                    if (dist < nearestDistance) {
                        nearestDistance = dist;
                        nearestCity = i;
                    }
                }
            }
            
            if (nearestCity !== -1) {
                // Adicionar cidade ao caminho
                currentPath.push(nearestCity);
                currentDistance += nearestDistance;
                visitedCities.add(nearestCity);
                
                // Atualizar interface
                currentCity.textContent = CITY_NAMES[currentCityIdx];
                nextCity.textContent = CITY_NAMES[nearestCity];
                partialDistance.textContent = Math.round(currentDistance);
                visitedCount.textContent = visitedCities.size;
                
                // Atualizar visualização
                updateVisualization();
                
                await sleep(animationSpeed);
            }
        }
        
        // Voltar para cidade inicial
        const lastCity = currentPath[currentPath.length - 1];
        const returnDistance = distances[lastCity][0];
        currentPath.push(0);
        currentDistance += returnDistance;
        
        // Atualizar melhor caminho
        if (currentDistance < bestDistance) {
            bestDistance = currentDistance;
            bestPath = [...currentPath];
        }
        
        finishAlgorithm();
    }
    
    async function executeChristofides() {
        operationDetails.innerHTML = '<p><strong>Christofides:</strong> Algoritmo de aproximação (3/2-ótimo)...</p>';
        
        // Implementação simplificada do algoritmo de Christofides
        // 1. Encontrar MST (Minimum Spanning Tree)
        const mst = primMST();
        
        // 2. Encontrar matching mínimo nos vértices de grau ímpar
        const oddVertices = findOddDegreeVertices(mst);
        const matching = greedyMatching(oddVertices);
        
        // 3. Combinar MST com matching para formar grafo Euleriano
        const eulerianGraph = combineMSTAndMatching(mst, matching);
        
        // 4. Encontrar circuito Euleriano
        const eulerianCircuit = findEulerianCircuit(eulerianGraph);
        
        // 5. Transformar em circuito Hamiltoniano (pular vértices repetidos)
        currentPath = makeHamiltonian(eulerianCircuit);
        currentDistance = calculatePathDistance(currentPath);
        
        // Atualizar melhor caminho
        if (currentDistance < bestDistance) {
            bestDistance = currentDistance;
            bestPath = [...currentPath];
        }
        
        // Atualizar visualização passo a passo
        for (let i = 0; i < currentPath.length - 1; i++) {
            if (isPaused || !isRunning) return;
            
            const from = currentPath[i];
            const to = currentPath[i + 1];
            
            currentCity.textContent = CITY_NAMES[from];
            nextCity.textContent = CITY_NAMES[to];
            partialDistance.textContent = Math.round(calculatePathDistance(currentPath.slice(0, i + 2)));
            visitedCount.textContent = i + 2;
            
            updateVisualization();
            await sleep(animationSpeed / 2);
        }
        
        finishAlgorithm();
    }
    
    async function executeSimulatedAnnealing() {
        operationDetails.innerHTML = '<p><strong>Têmpera Simulada:</strong> Busca por melhorias locais...</p>';
        
        // Criar barra de progresso
        optimizationProgress.innerHTML = `
            <h4><i class="fas fa-thermometer-half"></i> Progresso da Têmpera Simulada</h4>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text">
                <span>Temperatura: <span id="currentTemp">100</span>°</span>
                <span>Iteração: <span id="currentIteration">0</span>/1000</span>
            </div>
        `;
        
        // Solução inicial (vizinho mais próximo)
        let currentSolution = await getNearestNeighborSolution();
        let bestSolution = { path: [...currentSolution.path], distance: currentSolution.distance };
        
        // Parâmetros da têmpera simulada
        let temperature = 100;
        const coolingRate = 0.995;
        const iterations = 1000;
        
        for (let i = 0; i < iterations; i++) {
            if (isPaused || !isRunning) return;
            
            // Gerar vizinho (2-opt swap)
            const neighbor = twoOptSwap(currentSolution.path);
            const neighborDistance = calculatePathDistance(neighbor);
            
            // Calcular diferença de custo
            const delta = neighborDistance - currentSolution.distance;
            
            // Aceitar solução se for melhor ou com probabilidade baseada na temperatura
            if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
                currentSolution = { path: neighbor, distance: neighborDistance };
                
                // Atualizar melhor solução se necessário
                if (currentSolution.distance < bestSolution.distance) {
                    bestSolution = { path: [...currentSolution.path], distance: currentSolution.distance };
                    bestDistance = bestSolution.distance;
                    bestPath = [...bestSolution.path];
                    
                    // Atualizar visualização
                    currentPath = [...bestSolution.path];
                    currentDistance = bestSolution.distance;
                    updateVisualization();
                }
            }
            
            // Resfriar
            temperature *= coolingRate;
            
            // Atualizar barra de progresso
            const progress = (i + 1) / iterations * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('currentTemp').textContent = Math.round(temperature);
            document.getElementById('currentIteration').textContent = i + 1;
            
            await sleep(animationSpeed / 10);
        }
        
        finishAlgorithm();
    }
    
    async function executeGeneticAlgorithm() {
        operationDetails.innerHTML = '<p><strong>Algoritmo Genético:</strong> Evolução de soluções...</p>';
        
        // Criar barra de progresso
        optimizationProgress.innerHTML = `
            <h4><i class="fas fa-dna"></i> Evolução do Algoritmo Genético</h4>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text">
                <span>Geração: <span id="currentGeneration">0</span>/50</span>
                <span>Melhor: <span id="bestFitness">∞</span></span>
            </div>
        `;
        
        // Parâmetros do algoritmo genético
        const populationSize = 50;
        const generations = 50;
        const mutationRate = 0.1;
        const eliteSize = 5;
        
        // Criar população inicial
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            const path = generateRandomPath();
            population.push({
                path: path,
                distance: calculatePathDistance(path),
                fitness: 1 / calculatePathDistance(path)
            });
        }
        
        // Ordenar população por fitness
        population.sort((a, b) => b.fitness - a.fitness);
        
        for (let gen = 0; gen < generations; gen++) {
            if (isPaused || !isRunning) return;
            
            // Selecionar elite
            const elite = population.slice(0, eliteSize);
            
            // Criar nova população
            let newPopulation = [...elite];
            
            while (newPopulation.length < populationSize) {
                // Selecionar pais (roleta)
                const parent1 = selectParent(population);
                const parent2 = selectParent(population);
                
                // Cruzamento (order crossover)
                const child = orderCrossover(parent1.path, parent2.path);
                
                // Mutação
                if (Math.random() < mutationRate) {
                    mutate(child);
                }
                
                // Adicionar à nova população
                const distance = calculatePathDistance(child);
                newPopulation.push({
                    path: child,
                    distance: distance,
                    fitness: 1 / distance
                });
            }
            
            // Atualizar população
            population = newPopulation.sort((a, b) => b.fitness - a.fitness);
            
            // Atualizar melhor solução
            const bestInGeneration = population[0];
            if (bestInGeneration.distance < bestDistance) {
                bestDistance = bestInGeneration.distance;
                bestPath = [...bestInGeneration.path];
                
                // Atualizar visualização
                currentPath = [...bestInGeneration.path];
                currentDistance = bestInGeneration.distance;
                updateVisualization();
            }
            
            // Atualizar barra de progresso
            const progress = (gen + 1) / generations * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('currentGeneration').textContent = gen + 1;
            document.getElementById('bestFitness').textContent = Math.round(bestDistance);
            
            await sleep(animationSpeed / 5);
        }
        
        finishAlgorithm();
    }
    
    // Funções auxiliares para os algoritmos
    
    function calculatePathDistance(path) {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            distance += distances[path[i]][path[i + 1]];
        }
        return distance;
    }
    
    async function getNearestNeighborSolution() {
        const tempPath = [0];
        const tempVisited = new Set([0]);
        
        while (tempVisited.size < cityCount) {
            const current = tempPath[tempPath.length - 1];
            let nearest = -1;
            let nearestDist = Infinity;
            
            for (let i = 0; i < cityCount; i++) {
                if (!tempVisited.has(i) && distances[current][i] < nearestDist) {
                    nearestDist = distances[current][i];
                    nearest = i;
                }
            }
            
            if (nearest !== -1) {
                tempPath.push(nearest);
                tempVisited.add(nearest);
            }
        }
        
        tempPath.push(0);
        return {
            path: tempPath,
            distance: calculatePathDistance(tempPath)
        };
    }
    
    function twoOptSwap(path) {
        const newPath = [...path];
        const i = Math.floor(Math.random() * (cityCount - 1)) + 1;
        const j = Math.floor(Math.random() * (cityCount - 1)) + 1;
        
        if (i < j) {
            const reversed = newPath.slice(i, j + 1).reverse();
            for (let k = i; k <= j; k++) {
                newPath[k] = reversed[k - i];
            }
        }
        
        return newPath;
    }
    
    function generateRandomPath() {
        const path = Array.from({length: cityCount - 1}, (_, i) => i + 1);
        // Embaralhar
        for (let i = path.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [path[i], path[j]] = [path[j], path[i]];
        }
        return [0, ...path, 0];
    }
    
    function selectParent(population) {
        // Seleção por roleta
        const totalFitness = population.reduce((sum, individual) => sum + individual.fitness, 0);
        let random = Math.random() * totalFitness;
        let cumulative = 0;
        
        for (const individual of population) {
            cumulative += individual.fitness;
            if (cumulative >= random) {
                return individual;
            }
        }
        
        return population[0];
    }
    
    function orderCrossover(parent1, parent2) {
        // OX (Order Crossover)
        const size = parent1.length;
        const start = Math.floor(Math.random() * size);
        const end = Math.floor(Math.random() * size);
        
        const child = new Array(size).fill(-1);
        
        // Copiar segmento do parent1
        for (let i = start; i <= end; i++) {
            child[i] = parent1[i];
        }
        
        // Completar com parent2
        let childPos = (end + 1) % size;
        let parentPos = childPos;
        
        while (child.includes(-1)) {
            if (!child.includes(parent2[parentPos])) {
                child[childPos] = parent2[parentPos];
                childPos = (childPos + 1) % size;
            }
            parentPos = (parentPos + 1) % size;
        }
        
        return child;
    }
    
    function mutate(path) {
        // Swap mutation
        const i = Math.floor(Math.random() * (cityCount - 1)) + 1;
        const j = Math.floor(Math.random() * (cityCount - 1)) + 1;
        [path[i], path[j]] = [path[j], path[i]];
    }
    
    // Funções para Christofides (implementação simplificada)
    
    function primMST() {
        // Implementação simplificada do algoritmo de Prim
        const mst = Array(cityCount).fill().map(() => []);
        const visited = new Set([0]);
        const edges = [];
        
        // Inicializar arestas do vértice 0
        for (let i = 1; i < cityCount; i++) {
            edges.push([0, i, distances[0][i]]);
        }
        edges.sort((a, b) => a[2] - b[2]);
        
        while (visited.size < cityCount) {
            const [u, v, weight] = edges.shift();
            
            if (!visited.has(v)) {
                visited.add(v);
                mst[u].push(v);
                mst[v].push(u);
                
                // Adicionar novas arestas
                for (let i = 0; i < cityCount; i++) {
                    if (!visited.has(i)) {
                        edges.push([v, i, distances[v][i]]);
                    }
                }
                edges.sort((a, b) => a[2] - b[2]);
            }
        }
        
        return mst;
    }
    
    function findOddDegreeVertices(mst) {
        const degrees = Array(cityCount).fill(0);
        for (let u = 0; u < cityCount; u++) {
            degrees[u] = mst[u].length;
        }
        return degrees.map((deg, idx) => deg % 2 === 1 ? idx : -1).filter(idx => idx !== -1);
    }
    
    function greedyMatching(vertices) {
        const matching = [];
        const matched = new Set();
        
        vertices.forEach(u => {
            if (!matched.has(u)) {
                let minV = -1;
                let minDist = Infinity;
                
                vertices.forEach(v => {
                    if (u !== v && !matched.has(v) && distances[u][v] < minDist) {
                        minDist = distances[u][v];
                        minV = v;
                    }
                });
                
                if (minV !== -1) {
                    matching.push([u, minV]);
                    matched.add(u);
                    matched.add(minV);
                }
            }
        });
        
        return matching;
    }
    
    function combineMSTAndMatching(mst, matching) {
        const combined = mst.map(neighbors => [...neighbors]);
        matching.forEach(([u, v]) => {
            combined[u].push(v);
            combined[v].push(u);
        });
        return combined;
    }
    
    function findEulerianCircuit(graph) {
        // Implementação simplificada (Hierholzer)
        const circuit = [];
        const stack = [0];
        const tempGraph = graph.map(neighbors => [...neighbors]);
        
        while (stack.length > 0) {
            const v = stack[stack.length - 1];
            if (tempGraph[v].length > 0) {
                const u = tempGraph[v].pop();
                tempGraph[u] = tempGraph[u].filter(x => x !== v);
                stack.push(u);
            } else {
                circuit.push(stack.pop());
            }
        }
        
        return circuit.reverse();
    }
    
    function makeHamiltonian(eulerianCircuit) {
        const visited = new Set();
        const hamiltonian = [];
        
        eulerianCircuit.forEach(city => {
            if (!visited.has(city)) {
                visited.add(city);
                hamiltonian.push(city);
            }
        });
        
        hamiltonian.push(hamiltonian[0]); // Voltar ao início
        return hamiltonian;
    }
    
    function updateVisualization() {
        renderMap();
        updateDistanceMatrix();
        updatePermutationVisualization();
        updateStatus();
    }
    
    function updateStatus() {
        // Atualizar tempo de execução
        if (startTime > 0) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            executionTime.textContent = `${elapsed}s`;
        }
        
        // Atualizar contadores
        visitedCount.textContent = visitedCities.size;
        permutationCount.textContent = testedPermutations;
        partialDistance.textContent = Math.round(currentDistance);
        
        if (bestPath.length > 0) {
            totalDistance.textContent = Math.round(bestDistance);
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
            // Continuar execução baseado no algoritmo
            switch(algorithm) {
                case 'bruteforce':
                    executeBruteForce();
                    break;
                case 'nearest':
                    executeNearestNeighbor();
                    break;
                case 'christofides':
                    executeChristofides();
                    break;
                case 'simulated':
                    executeSimulatedAnnealing();
                    break;
                case 'genetic':
                    executeGeneticAlgorithm();
                    break;
            }
        }
    }
    
    function resetAlgorithm() {
        clearTimeout(animationTimeout);
        isRunning = false;
        isPaused = false;
        
        // Resetar estado
        currentPath = [];
        currentDistance = 0;
        visitedCities = new Set();
        bestPath = [];
        bestDistance = Infinity;
        testedPermutations = 0;
        optimalSolution = null;
        
        // Limpar visualizações
        optimizationProgress.innerHTML = '';
        permutationVisualization.innerHTML = '';
        
        // Atualizar interface
        updateVisualization();
        updateStatus();
        operationDetails.innerHTML = '<p>Algoritmo reiniciado. Configure e clique em "Executar Algoritmo".</p>';
        statusText.textContent = 'Pronto';
        
        // Atualizar botões
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
        optimalBtn.disabled = false;
    }
    
    function showOptimalSolution() {
        if (bestPath.length === 0) {
            operationDetails.innerHTML = '<p><strong>Atenção:</strong> Execute um algoritmo primeiro para encontrar uma solução.</p>';
            return;
        }
        
        optimalSolution = {
            path: [...bestPath],
            distance: bestDistance
        };
        
        // Destacar rota ótima
        operationDetails.innerHTML = `
            <p><strong>Solução Ótima Encontrada:</strong></p>
            <p>Rota: ${bestPath.map(idx => CITY_NAMES[idx]).join(' → ')}</p>
            <p>Distância total: ${Math.round(bestDistance)} unidades</p>
        `;
        
        updateVisualization();
    }
    
    function finishAlgorithm() {
        isRunning = false;
        statusText.textContent = 'Concluído';
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        executionTime.textContent = `${elapsed}s`;
        
        operationDetails.innerHTML = `
            <p><strong>✅ Algoritmo Concluído!</strong></p>
            <p>Melhor rota encontrada: ${bestPath.map(idx => CITY_NAMES[idx]).join(' → ')}</p>
            <p>Distância total: ${Math.round(bestDistance)} unidades</p>
            <p>Permutações testadas: ${testedPermutations}</p>
            <p>Tempo de execução: ${elapsed} segundos</p>
        `;
        
        // Atualizar botões
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
        optimalBtn.disabled = false;
    }
    
    function sleep(ms) {
        return new Promise(resolve => {
            if (isPaused) {
                const checkInterval = setInterval(() => {
                    if (!isPaused && isRunning) {
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