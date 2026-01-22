// Classes e estruturas de dados para o grafo
class Node {
    constructor(id, x, y, label = '', heuristic = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = label || String.fromCharCode(65 + (id % 26));
        this.heuristic = heuristic;
        this.radius = 25;
        this.color = '#00ff00';
        this.visited = false;
        this.current = false;
        this.start = false;
        this.target = false;
        this.inPath = false;
        this.neighbors = [];
    }
    
    draw(ctx) {
        // Desenha o nó
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Cor baseada no estado
        if (this.start) {
            ctx.fillStyle = '#00ff00'; // Verde - início
        } else if (this.target) {
            ctx.fillStyle = '#ff0000'; // Vermelho - destino
        } else if (this.current) {
            ctx.fillStyle = '#7209b7'; // Roxo - atual
        } else if (this.visited) {
            ctx.fillStyle = '#4cc9f0'; // Azul claro - visitado
        } else if (this.inPath) {
            ctx.fillStyle = '#4ade80'; // Verde claro - no caminho
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rótulo
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px "Source Code Pro", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y);
        
        // Heurística (se houver)
        if (this.heuristic > 0) {
            ctx.fillStyle = '#ff9100';
            ctx.font = '12px "Source Code Pro", monospace';
            ctx.fillText(`h=${this.heuristic}`, this.x, this.y + 20);
        }
    }
    
    contains(x, y) {
        const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return dist <= this.radius;
    }
}

class Edge {
    constructor(from, to, weight = 1, directed = false) {
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.directed = directed;
        this.color = '#00ff00';
        this.active = false;
    }
    
    draw(ctx) {
        const dx = this.to.x - this.from.x;
        const dy = this.to.y - this.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Ajusta o ponto de início e fim para a borda dos nós
        const startX = this.from.x + nx * this.from.radius;
        const startY = this.from.y + ny * this.from.radius;
        const endX = this.to.x - nx * this.to.radius;
        const endY = this.to.y - ny * this.to.radius;
        
        // Desenha a aresta
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        // Estilo da linha
        ctx.strokeStyle = this.active ? '#ff9100' : this.color;
        ctx.lineWidth = this.active ? 3 : 2;
        ctx.stroke();
        
        // Setas para arestas direcionadas
        if (this.directed) {
            const arrowLength = 15;
            const angle = Math.atan2(dy, dx);
            
            // Ponta da seta
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle - Math.PI / 6),
                endY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle + Math.PI / 6),
                endY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = this.active ? '#ff9100' : this.color;
            ctx.fill();
        }
        
        // Peso da aresta
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px "Source Code Pro", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Fundo para o texto
        ctx.fillStyle = '#000';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        
        // Texto do peso
        ctx.fillStyle = '#00ff00';
        ctx.fillText(this.weight.toString(), midX, midY);
    }
    
    contains(x, y) {
        // Verifica se o ponto está próximo da linha
        const A = { x: this.from.x, y: this.from.y };
        const B = { x: this.to.x, y: this.to.y };
        
        // Distância do ponto à linha
        const numerator = Math.abs(
            (B.y - A.y) * x - (B.x - A.x) * y + B.x * A.y - B.y * A.x
        );
        const denominator = Math.sqrt((B.y - A.y) ** 2 + (B.x - A.x) ** 2);
        const distance = numerator / denominator;
        
        // Verifica se está entre os nós
        const dot1 = (x - A.x) * (B.x - A.x) + (y - A.y) * (B.y - A.y);
        const dot2 = (x - B.x) * (A.x - B.x) + (y - B.y) * (A.y - B.y);
        const isBetween = dot1 >= 0 && dot2 >= 0;
        
        return distance < 5 && isBetween;
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nextNodeId = 0;
        this.directed = false;
        this.weighted = true;
    }
    
    addNode(x, y, label = '', heuristic = 0) {
        const node = new Node(this.nextNodeId++, x, y, label, heuristic);
        this.nodes.push(node);
        return node;
    }
    
    addEdge(from, to, weight = 1) {
        const edge = new Edge(from, to, weight, this.directed);
        this.edges.push(edge);
        from.neighbors.push({ node: to, weight });
        if (!this.directed) {
            to.neighbors.push({ node: from, weight });
        }
        return edge;
    }
    
    removeNode(node) {
        // Remove arestas conectadas
        this.edges = this.edges.filter(edge => 
            edge.from !== node && edge.to !== node
        );
        
        // Remove de vizinhos
        this.nodes.forEach(n => {
            n.neighbors = n.neighbors.filter(neighbor => neighbor.node !== node);
        });
        
        // Remove o nó
        this.nodes = this.nodes.filter(n => n !== node);
    }
    
    removeEdge(edge) {
        // Remove da lista de arestas
        this.edges = this.edges.filter(e => e !== edge);
        
        // Remove dos vizinhos
        edge.from.neighbors = edge.from.neighbors.filter(
            neighbor => neighbor.node !== edge.to
        );
        
        if (!edge.directed) {
            edge.to.neighbors = edge.to.neighbors.filter(
                neighbor => neighbor.node !== edge.from
            );
        }
    }
    
    findNodeAt(x, y) {
        return this.nodes.find(node => node.contains(x, y));
    }
    
    findEdgeAt(x, y) {
        return this.edges.find(edge => edge.contains(x, y));
    }
    
    clearVisited() {
        this.nodes.forEach(node => {
            node.visited = false;
            node.current = false;
            node.inPath = false;
        });
        
        this.edges.forEach(edge => {
            edge.active = false;
        });
    }
    
    draw(ctx) {
        // Desenha arestas primeiro
        this.edges.forEach(edge => edge.draw(ctx));
        
        // Desenha nós por cima
        this.nodes.forEach(node => node.draw(ctx));
    }
    
    generateRandomGraph(nodeCount = 8, edgeProbability = 0.3) {
        this.nodes = [];
        this.edges = [];
        this.nextNodeId = 0;
        
        const canvas = document.getElementById('graphCanvas');
        const padding = 50;
        const width = canvas.width;
        const height = canvas.height;
        
        // Gera nós em posições aleatórias
        for (let i = 0; i < nodeCount; i++) {
            const x = padding + Math.random() * (width - 2 * padding);
            const y = padding + Math.random() * (height - 2 * padding);
            const label = String.fromCharCode(65 + i);
            const heuristic = Math.floor(Math.random() * 20);
            this.addNode(x, y, label, heuristic);
        }
        
        // Gera arestas aleatórias
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (Math.random() < edgeProbability) {
                    const weight = this.weighted ? Math.floor(Math.random() * 10) + 1 : 1;
                    this.addEdge(this.nodes[i], this.nodes[j], weight);
                }
            }
        }
        
        this.updateStats();
        this.updateNodeSelects();
    }
    
    updateStats() {
        const nodeCount = this.nodes.length;
        const edgeCount = this.edges.length;
        const totalWeight = this.edges.reduce((sum, edge) => sum + edge.weight, 0);
        
        document.getElementById('nodeCount').textContent = nodeCount;
        document.getElementById('edgeCount').textContent = edgeCount;
        document.getElementById('totalWeight').textContent = totalWeight;
    }
    
    updateNodeSelects() {
        const startSelect = document.getElementById('startNode');
        const targetSelect = document.getElementById('targetNode');
        
        // Limpa opções existentes
        startSelect.innerHTML = '<option value="">Selecione um nó</option>';
        targetSelect.innerHTML = '<option value="">Selecione um nó</option>';
        
        // Adiciona nós
        this.nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.label} (ID: ${node.id})`;
            
            startSelect.appendChild(option.cloneNode(true));
            targetSelect.appendChild(option);
        });
    }
}

// Classe para execução de algoritmos
class AlgorithmExecutor {
    constructor(graph) {
        this.graph = graph;
        this.algorithm = 'bfs';
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.animationSpeed = 5;
        this.executionLog = [];
        this.path = [];
        this.visitedCount = 0;
        this.pathCost = 0;
        this.startTime = 0;
        
        // Estados dos algoritmos
        this.bfsState = null;
        this.dfsState = null;
        this.dijkstraState = null;
        this.astarState = null;
    }
    
    setAlgorithm(algorithm) {
        this.algorithm = algorithm;
        this.reset();
        this.updateAlgorithmInfo();
    }
    
    updateAlgorithmInfo() {
        const info = document.getElementById('algorithmDescription');
        const timeComplexity = document.getElementById('timeComplexity');
        const spaceComplexity = document.getElementById('spaceComplexity');
        const optimality = document.getElementById('optimality');
        const completeness = document.getElementById('completeness');
        
        if (!info) return;
        
        switch(this.algorithm) {
            case 'bfs':
                info.innerHTML = `
                    <p><strong>Busca em Largura (BFS)</strong> explora os nós nível por nível, 
                    usando uma fila (FIFO). Ideal para encontrar o menor caminho em grafos 
                    não ponderados.</p>
                    <p><strong>Uso:</strong> Menor caminho em grafos não ponderados, 
                    verificação de conectividade.</p>
                `;
                if (timeComplexity) timeComplexity.textContent = 'O(V + E)';
                if (spaceComplexity) spaceComplexity.textContent = 'O(V)';
                if (optimality) optimality.textContent = 'Sim (não ponderado)';
                if (completeness) completeness.textContent = 'Sim';
                break;
                
            case 'dfs':
                info.innerHTML = `
                    <p><strong>Busca em Profundidade (DFS)</strong> explora o máximo possível 
                    em um ramo antes de retroceder, usando uma pilha (LIFO).</p>
                    <p><strong>Uso:</strong> Detecção de ciclos, ordenação topológica, 
                    componentes conectados.</p>
                `;
                if (timeComplexity) timeComplexity.textContent = 'O(V + E)';
                if (spaceComplexity) spaceComplexity.textContent = 'O(V)';
                if (optimality) optimality.textContent = 'Não';
                if (completeness) completeness.textContent = 'Sim';
                break;
                
            case 'dijkstra':
                info.innerHTML = `
                    <p><strong>Algoritmo de Dijkstra</strong> encontra o caminho mais curto 
                    de um nó para todos os outros em grafos com pesos não-negativos.</p>
                    <p><strong>Uso:</strong> Sistemas de roteamento, navegação GPS, 
                    redes de computadores.</p>
                `;
                if (timeComplexity) timeComplexity.textContent = 'O((V+E) log V)';
                if (spaceComplexity) spaceComplexity.textContent = 'O(V)';
                if (optimality) optimality.textContent = 'Sim';
                if (completeness) completeness.textContent = 'Sim';
                break;
                
            case 'astar':
                info.innerHTML = `
                    <p><strong>Algoritmo A*</strong> combina custo real do caminho com 
                    uma heurística para encontrar o caminho mais eficiente.</p>
                    <p><strong>Uso:</strong> Jogos, planejamento de movimento robótico, 
                    sistemas de IA.</p>
                `;
                if (timeComplexity) timeComplexity.textContent = 'O(b^d)';
                if (spaceComplexity) spaceComplexity.textContent = 'O(b^d)';
                if (optimality) optimality.textContent = 'Sim (heurística admissível)';
                if (completeness) completeness.textContent = 'Sim';
                break;
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        const startId = parseInt(document.getElementById('startNode').value);
        const targetId = parseInt(document.getElementById('targetNode').value);
        
        if (isNaN(startId)) {
            this.log('Erro: Selecione um nó inicial.');
            return;
        }
        
        const startNode = this.graph.nodes.find(n => n.id === startId);
        const targetNode = targetId ? this.graph.nodes.find(n => n.id === targetId) : null;
        
        if (!startNode) {
            this.log('Erro: Nó inicial não encontrado.');
            return;
        }
        
        if (this.algorithm !== 'bfs' && this.algorithm !== 'dfs' && !targetNode) {
            this.log('Erro: Selecione um nó destino para este algoritmo.');
            return;
        }
        
        this.reset();
        this.isRunning = true;
        this.startTime = performance.now();
        
        // Marca nós inicial e destino
        startNode.start = true;
        if (targetNode) targetNode.target = true;
        
        // Inicializa o algoritmo selecionado
        switch(this.algorithm) {
            case 'bfs':
                this.initBFS(startNode);
                break;
            case 'dfs':
                this.initDFS(startNode);
                break;
            case 'dijkstra':
                this.initDijkstra(startNode, targetNode);
                break;
            case 'astar':
                this.initAStar(startNode, targetNode);
                break;
        }
        
        this.log(`Algoritmo ${this.algorithm.toUpperCase()} iniciado.`);
        this.updateUI();
        
        if (!this.isPaused) {
            this.executeStep();
        }
    }
    
    pause() {
        this.isPaused = true;
        this.log('Execução pausada.');
    }
    
    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.log('Execução retomada.');
            this.executeStep();
        }
    }
    
    step() {
        if (this.isRunning && this.isPaused) {
            this.executeStep();
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.executionLog = [];
        this.path = [];
        this.visitedCount = 0;
        this.pathCost = 0;
        
        this.graph.clearVisited();
        this.graph.nodes.forEach(node => {
            node.start = false;
            node.target = false;
        });
        
        this.updateUI();
        this.clearLog();
        this.log('Sistema reiniciado. Pronto para executar.');
    }
    
    initBFS(startNode) {
        const queue = [startNode];
        const visited = new Set();
        visited.add(startNode);
        
        this.bfsState = {
            queue,
            visited,
            parents: new Map(),
            currentNode: startNode
        };
        
        startNode.visited = true;
        startNode.current = true;
    }
    
    initDFS(startNode) {
        const stack = [startNode];
        const visited = new Set();
        visited.add(startNode);
        
        this.dfsState = {
            stack,
            visited,
            parents: new Map(),
            currentNode: startNode
        };
        
        startNode.visited = true;
        startNode.current = true;
    }
    
    initDijkstra(startNode, targetNode) {
        const distances = new Map();
        const visited = new Set();
        const previous = new Map();
        const priorityQueue = [];
        
        this.graph.nodes.forEach(node => {
            distances.set(node, Infinity);
        });
        
        distances.set(startNode, 0);
        priorityQueue.push({ node: startNode, distance: 0 });
        
        this.dijkstraState = {
            distances,
            visited,
            previous,
            queue: priorityQueue,
            currentNode: startNode,
            targetNode
        };
        
        startNode.visited = true;
        startNode.current = true;
    }
    
    initAStar(startNode, targetNode) {
        const openSet = [startNode];
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();
        
        this.graph.nodes.forEach(node => {
            gScore.set(node, Infinity);
            fScore.set(node, Infinity);
        });
        
        gScore.set(startNode, 0);
        fScore.set(startNode, this.heuristic(startNode, targetNode));
        
        this.astarState = {
            openSet,
            closedSet,
            gScore,
            fScore,
            cameFrom,
            currentNode: startNode,
            targetNode
        };
        
        startNode.visited = true;
        startNode.current = true;
    }
    
    executeStep() {
        if (!this.isRunning || this.isPaused) return;
        
        this.currentStep++;
        
        let algorithmFinished = false;
        
        switch(this.algorithm) {
            case 'bfs':
                algorithmFinished = this.stepBFS();
                break;
            case 'dfs':
                algorithmFinished = this.stepDFS();
                break;
            case 'dijkstra':
                algorithmFinished = this.stepDijkstra();
                break;
            case 'astar':
                algorithmFinished = this.stepAStar();
                break;
        }
        
        this.updateUI();
        
        if (algorithmFinished) {
            this.finishExecution();
        } else if (!this.isPaused) {
            const speed = Math.max(100, 1000 - (this.animationSpeed * 100));
            setTimeout(() => this.executeStep(), speed);
        }
    }
    
    stepBFS() {
        const state = this.bfsState;
        if (state.queue.length === 0) return true;
        
        // Remove nó atual
        if (state.currentNode) {
            state.currentNode.current = false;
        }
        
        const currentNode = state.queue.shift();
        currentNode.current = true;
        currentNode.visited = true;
        this.visitedCount++;
        
        this.log(`Visitando nó ${currentNode.label}`);
        
        // Verifica se é o destino
        const targetId = parseInt(document.getElementById('targetNode').value);
        if (!isNaN(targetId) && currentNode.id === targetId) {
            this.reconstructPath(state.parents, currentNode);
            return true;
        }
        
        // Adiciona vizinhos à fila
        currentNode.neighbors.forEach(neighbor => {
            if (!state.visited.has(neighbor.node)) {
                state.visited.add(neighbor.node);
                state.queue.push(neighbor.node);
                state.parents.set(neighbor.node, currentNode);
                
                // Ativa visualmente a aresta
                const edge = this.findEdge(currentNode, neighbor.node);
                if (edge) edge.active = true;
                
                this.log(`Adicionando nó ${neighbor.node.label} à fila`);
            }
        });
        
        // Atualiza display da fila
        this.updateQueueDisplay(state.queue.map(n => n.label));
        
        return false;
    }
    
    stepDFS() {
        const state = this.dfsState;
        if (state.stack.length === 0) return true;
        
        // Remove nó atual
        if (state.currentNode) {
            state.currentNode.current = false;
        }
        
        const currentNode = state.stack.pop();
        currentNode.current = true;
        currentNode.visited = true;
        this.visitedCount++;
        
        this.log(`Visitando nó ${currentNode.label}`);
        
        // Verifica se é o destino
        const targetId = parseInt(document.getElementById('targetNode').value);
        if (!isNaN(targetId) && currentNode.id === targetId) {
            this.reconstructPath(state.parents, currentNode);
            return true;
        }
        
        // Adiciona vizinhos à pilha
        currentNode.neighbors.forEach(neighbor => {
            if (!state.visited.has(neighbor.node)) {
                state.visited.add(neighbor.node);
                state.stack.push(neighbor.node);
                state.parents.set(neighbor.node, currentNode);
                
                // Ativa visualmente a aresta
                const edge = this.findEdge(currentNode, neighbor.node);
                if (edge) edge.active = true;
                
                this.log(`Empilhando nó ${neighbor.node.label}`);
            }
        });
        
        // Atualiza display da pilha
        this.updateQueueDisplay(state.stack.map(n => n.label));
        
        return false;
    }
    
    stepDijkstra() {
        const state = this.dijkstraState;
        if (state.queue.length === 0) return true;
        
        // Remove nó atual
        if (state.currentNode) {
            state.currentNode.current = false;
        }
        
        // Obtém nó com menor distância
        state.queue.sort((a, b) => a.distance - b.distance);
        const currentItem = state.queue.shift();
        const currentNode = currentItem.node;
        
        if (state.visited.has(currentNode)) {
            return false; // Continua execução
        }
        
        state.visited.add(currentNode);
        currentNode.current = true;
        currentNode.visited = true;
        this.visitedCount++;
        
        this.log(`Processando nó ${currentNode.label} (distância: ${state.distances.get(currentNode)})`);
        
        // Verifica se é o destino
        if (currentNode === state.targetNode) {
            this.reconstructPath(state.previous, currentNode);
            this.pathCost = state.distances.get(currentNode);
            return true;
        }
        
        // Atualiza distâncias dos vizinhos
        currentNode.neighbors.forEach(neighbor => {
            if (!state.visited.has(neighbor.node)) {
                const newDist = state.distances.get(currentNode) + neighbor.weight;
                
                if (newDist < state.distances.get(neighbor.node)) {
                    state.distances.set(neighbor.node, newDist);
                    state.previous.set(neighbor.node, currentNode);
                    
                    // Adiciona à fila de prioridade
                    state.queue.push({ node: neighbor.node, distance: newDist });
                    
                    // Ativa visualmente a aresta
                    const edge = this.findEdge(currentNode, neighbor.node);
                    if (edge) edge.active = true;
                    
                    this.log(`Atualizando nó ${neighbor.node.label}: distância ${newDist}`);
                }
            }
        });
        
        // Atualiza display da fila de prioridade
        const queueDisplay = state.queue
            .map(item => `${item.node.label}:${Math.round(item.distance)}`)
            .sort();
        this.updateQueueDisplay(queueDisplay);
        
        return false;
    }
    
    stepAStar() {
        const state = this.astarState;
        if (state.openSet.length === 0) return true;
        
        // Remove nó atual
        if (state.currentNode) {
            state.currentNode.current = false;
        }
        
        // Encontra nó com menor fScore
        state.openSet.sort((a, b) => state.fScore.get(a) - state.fScore.get(b));
        const currentNode = state.openSet.shift();
        
        // Se encontrou o destino
        if (currentNode === state.targetNode) {
            this.reconstructPath(state.cameFrom, currentNode);
            this.pathCost = state.gScore.get(currentNode);
            return true;
        }
        
        state.closedSet.add(currentNode);
        currentNode.current = true;
        currentNode.visited = true;
        this.visitedCount++;
        
        this.log(`Processando nó ${currentNode.label} (f=${Math.round(state.fScore.get(currentNode))})`);
        
        // Processa vizinhos
        currentNode.neighbors.forEach(neighbor => {
            if (state.closedSet.has(neighbor.node)) return;
            
            const tentativeGScore = state.gScore.get(currentNode) + neighbor.weight;
            
            if (!state.openSet.includes(neighbor.node)) {
                state.openSet.push(neighbor.node);
            } else if (tentativeGScore >= state.gScore.get(neighbor.node)) {
                return;
            }
            
            state.cameFrom.set(neighbor.node, currentNode);
            state.gScore.set(neighbor.node, tentativeGScore);
            state.fScore.set(neighbor.node, 
                tentativeGScore + this.heuristic(neighbor.node, state.targetNode));
            
            // Ativa visualmente a aresta
            const edge = this.findEdge(currentNode, neighbor.node);
            if (edge) edge.active = true;
            
            this.log(`Avaliando nó ${neighbor.node.label}: g=${tentativeGScore}, f=${Math.round(state.fScore.get(neighbor.node))}`);
        });
        
        // Atualiza display do open set
        const openSetDisplay = state.openSet
            .map(n => `${n.label}:f=${Math.round(state.fScore.get(n))}`)
            .sort();
        this.updateQueueDisplay(openSetDisplay);
        
        return false;
    }
    
    findEdge(node1, node2) {
        return this.graph.edges.find(edge => 
            (edge.from === node1 && edge.to === node2) ||
            (edge.from === node2 && edge.to === node1)
        );
    }
    
    heuristic(node, target) {
        if (!target) return 0;
        // Distância Euclidiana como heurística
        const dx = node.x - target.x;
        const dy = node.y - target.y;
        return Math.sqrt(dx * dx + dy * dy) / 10;
    }
    
    reconstructPath(parents, endNode) {
        this.path = [endNode];
        let currentNode = endNode;
        
        while (parents.has(currentNode)) {
            currentNode = parents.get(currentNode);
            this.path.unshift(currentNode);
            
            // Marca arestas do caminho
            if (this.path.length > 1) {
                const nextNode = this.path[1];
                const edge = this.findEdge(currentNode, nextNode);
                if (edge) {
                    edge.active = true;
                }
            }
        }
        
        // Marca nós no caminho
        this.path.forEach(node => {
            node.inPath = true;
        });
        
        // Calcula custo do caminho se ainda não calculado
        if (this.pathCost === 0) {
            this.pathCost = this.path.reduce((total, node, index) => {
                if (index < this.path.length - 1) {
                    const nextNode = this.path[index + 1];
                    const edge = this.findEdge(node, nextNode);
                    return total + (edge ? edge.weight : 1);
                }
                return total;
            }, 0);
        }
    }
    
    finishExecution() {
        this.isRunning = false;
        const endTime = performance.now();
        const executionTime = Math.round(endTime - this.startTime);
        
        if (this.path.length > 0) {
            const pathLabels = this.path.map(n => n.label).join(' → ');
            this.log(`✓ Caminho encontrado: ${pathLabels} (Custo: ${this.pathCost})`);
            this.log(`Tempo de execução: ${executionTime}ms`);
            this.log(`Nós visitados: ${this.visitedCount}`);
            
            // Atualiza resultado do caminho
            const pathResult = document.getElementById('pathResult');
            if (pathResult) {
                pathResult.innerHTML = `
                    <p><strong>Caminho:</strong> ${pathLabels}</p>
                    <p><strong>Custo Total:</strong> ${this.pathCost}</p>
                    <p><strong>Comprimento:</strong> ${this.path.length - 1} arestas</p>
                `;
            }
        } else {
            this.log('✗ Nenhum caminho encontrado entre os nós especificados.');
            const pathResult = document.getElementById('pathResult');
            if (pathResult) {
                pathResult.innerHTML = `
                    <p><strong>Nenhum caminho encontrado</strong></p>
                    <p>Os nós podem não estar conectados.</p>
                `;
            }
        }
        
        const executionTimeElement = document.getElementById('executionTime');
        if (executionTimeElement) {
            executionTimeElement.textContent = `${executionTime}ms`;
        }
    }
    
    updateUI() {
        // Função auxiliar para atualizar elementos de forma segura
        const safeUpdate = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        safeUpdate('currentIteration', this.currentStep);
        safeUpdate('visitedCount', this.visitedCount);
        safeUpdate('pathCost', this.pathCost);
        safeUpdate('stepsCount', this.currentStep);
        
        // Atualiza estado dos botões
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stepBtn = document.getElementById('stepBtn');
        
        if (startBtn) startBtn.disabled = this.isRunning && !this.isPaused;
        if (pauseBtn) pauseBtn.disabled = !this.isRunning || this.isPaused;
        if (stepBtn) stepBtn.disabled = !this.isRunning || !this.isPaused;
        
        // Redesenha o grafo
        redrawGraph();
    }
    
    updateQueueDisplay(items) {
        const queueContent = document.getElementById('queueContent');
        if (!queueContent) return;
        
        if (items.length === 0) {
            queueContent.innerHTML = '<p>Fila vazia</p>';
        } else {
            queueContent.innerHTML = items.map(item => 
                `<div class="queue-item">${item}</div>`
            ).join('');
        }
    }
    
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.executionLog.push(logEntry);
        
        const logContent = document.getElementById('executionLog');
        if (!logContent) return;
        
        const entryElement = document.createElement('div');
        entryElement.className = 'log-entry';
        entryElement.textContent = logEntry;
        
        logContent.appendChild(entryElement);
        logContent.scrollTop = logContent.scrollHeight;
        
        // Limita o log a 100 entradas
        if (this.executionLog.length > 100) {
            this.executionLog.shift();
            if (logContent.firstChild) {
                logContent.removeChild(logContent.firstChild);
            }
        }
    }
    
    clearLog() {
        this.executionLog = [];
        const logContent = document.getElementById('executionLog');
        if (logContent) {
            logContent.innerHTML = 
                '<div class="log-entry">Sistema inicializado. Pronto para executar algoritmos.</div>';
        }
    }
}

// Variáveis globais
let graph = new Graph();
let executor = new AlgorithmExecutor(graph);
let canvas, ctx;
let selectedNode = null;
let selectedMode = 'addNode';
let isDragging = false;

// Inicialização
function init() {
    canvas = document.getElementById('graphCanvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Configura canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Configura eventos
    setupEventListeners();
    
    // Gera grafo inicial
    graph.generateRandomGraph(8, 0.4);
    
    // Atualiza informações
    executor.updateAlgorithmInfo();
    
    // Redesenha o grafo
    redrawGraph();
    
    // Log inicial
    executor.log('Sistema de visualização de grafos inicializado.');
    executor.log('Gere um grafo ou adicione nós manualmente para começar.');
}

function resizeCanvas() {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    
    ctx.scale(dpr, dpr);
    redrawGraph();
}

function redrawGraph() {
    if (!ctx || !canvas) return;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o grafo
    graph.draw(ctx);
}

function setupEventListeners() {
    // Eventos do canvas
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('dblclick', handleCanvasDoubleClick);
    
    // Botões de algoritmo
    document.querySelectorAll('.btn-algorithm').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-algorithm').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const algorithm = this.dataset.algorithm;
            executor.setAlgorithm(algorithm);
            
            // Atualiza UI baseado no algoritmo
            updateAlgorithmUI(algorithm);
        });
    });
    
    // Botões de execução
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stepBtn = document.getElementById('stepBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!executor.isRunning || executor.isPaused) {
                executor.start();
            }
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (executor.isRunning && !executor.isPaused) {
                executor.pause();
            } else if (executor.isRunning && executor.isPaused) {
                executor.resume();
            }
        });
    }
    
    if (stepBtn) {
        stepBtn.addEventListener('click', () => {
            executor.step();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            executor.reset();
        });
    }
    
    // Botões do grafo
    const generateGraphBtn = document.getElementById('generateGraphBtn');
    const clearGraphBtn = document.getElementById('clearGraphBtn');
    
    if (generateGraphBtn) {
        generateGraphBtn.addEventListener('click', () => {
            graph.generateRandomGraph(8, 0.4);
            redrawGraph();
            executor.log('Novo grafo aleatório gerado.');
        });
    }
    
    if (clearGraphBtn) {
        clearGraphBtn.addEventListener('click', () => {
            graph = new Graph();
            executor = new AlgorithmExecutor(graph);
            redrawGraph();
            executor.updateAlgorithmInfo();
            executor.log('Grafo limpo. Adicione novos nós e arestas.');
        });
    }
    
    // Modos de edição
    const addNodeModeBtn = document.getElementById('addNodeMode');
    const addEdgeModeBtn = document.getElementById('addEdgeMode');
    const moveNodeModeBtn = document.getElementById('moveNodeMode');
    const deleteModeBtn = document.getElementById('deleteMode');
    
    if (addNodeModeBtn) {
        addNodeModeBtn.addEventListener('click', () => setMode('addNode'));
    }
    if (addEdgeModeBtn) {
        addEdgeModeBtn.addEventListener('click', () => setMode('addEdge'));
    }
    if (moveNodeModeBtn) {
        moveNodeModeBtn.addEventListener('click', () => setMode('moveNode'));
    }
    if (deleteModeBtn) {
        deleteModeBtn.addEventListener('click', () => setMode('delete'));
    }
    
    // Controles
    const weightedGraphCheckbox = document.getElementById('weightedGraph');
    const directedGraphCheckbox = document.getElementById('directedGraph');
    const animationSpeedInput = document.getElementById('animationSpeed');
    
    if (weightedGraphCheckbox) {
        weightedGraphCheckbox.addEventListener('change', function() {
            graph.weighted = this.checked;
            executor.log(`Grafo ${this.checked ? 'ponderado' : 'não ponderado'}.`);
        });
    }
    
    if (directedGraphCheckbox) {
        directedGraphCheckbox.addEventListener('change', function() {
            graph.directed = this.checked;
            graph.edges.forEach(edge => edge.directed = this.checked);
            redrawGraph();
            executor.log(`Grafo ${this.checked ? 'direcionado' : 'não direcionado'}.`);
        });
    }
    
    if (animationSpeedInput) {
        animationSpeedInput.addEventListener('input', function() {
            const speed = parseInt(this.value);
            executor.animationSpeed = speed;
            const speedValue = document.getElementById('speedValue');
            if (speedValue) {
                speedValue.textContent = speed;
            }
        });
    }
    
    // Log
    const clearLogBtn = document.getElementById('clearLogBtn');
    const exportLogBtn = document.getElementById('exportLogBtn');
    
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            executor.clearLog();
        });
    }
    
    if (exportLogBtn) {
        exportLogBtn.addEventListener('click', () => {
            exportLog();
        });
    }
    
    // Previne comportamento padrão de arrastar
    canvas.addEventListener('dragstart', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => e.preventDefault());
}

function setMode(mode) {
    selectedMode = mode;
    selectedNode = null;
    
    // Atualiza botões
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.getElementById(`${mode}Mode`);
    if (modeBtn) {
        modeBtn.classList.add('active');
    }
    
    // Feedback visual
    let message = '';
    switch(mode) {
        case 'addNode': message = 'Modo: Adicionar Nó'; break;
        case 'addEdge': message = 'Modo: Adicionar Aresta'; break;
        case 'moveNode': message = 'Modo: Mover Nó'; break;
        case 'delete': message = 'Modo: Remover'; break;
    }
    executor.log(message);
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    switch(selectedMode) {
        case 'addNode':
            const labelInput = document.getElementById('nodeLabel');
            const weightInput = document.getElementById('nodeWeight');
            const label = labelInput ? labelInput.value : '';
            const heuristic = weightInput ? parseInt(weightInput.value) || 0 : 0;
            graph.addNode(x, y, label, heuristic);
            graph.updateStats();
            graph.updateNodeSelects();
            redrawGraph();
            executor.log(`Nó adicionado em (${Math.round(x)}, ${Math.round(y)})`);
            break;
            
        case 'addEdge':
            const node = graph.findNodeAt(x, y);
            if (node) {
                if (!selectedNode) {
                    selectedNode = node;
                    executor.log(`Selecionado nó ${node.label}. Agora selecione o nó destino.`);
                } else if (selectedNode !== node) {
                    const weight = graph.weighted ? Math.floor(Math.random() * 10) + 1 : 1;
                    graph.addEdge(selectedNode, node, weight);
                    selectedNode = null;
                    graph.updateStats();
                    redrawGraph();
                    executor.log(`Aresta adicionada entre ${selectedNode?.label} e ${node.label}`);
                }
            }
            break;
            
        case 'delete':
            const edge = graph.findEdgeAt(x, y);
            if (edge) {
                graph.removeEdge(edge);
                graph.updateStats();
                redrawGraph();
                executor.log(`Aresta removida.`);
            } else {
                const nodeToDelete = graph.findNodeAt(x, y);
                if (nodeToDelete) {
                    graph.removeNode(nodeToDelete);
                    graph.updateStats();
                    graph.updateNodeSelects();
                    redrawGraph();
                    executor.log(`Nó ${nodeToDelete.label} removido.`);
                }
            }
            break;
    }
}

function handleCanvasMouseDown(e) {
    if (selectedMode !== 'moveNode') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = graph.findNodeAt(x, y);
    if (node) {
        selectedNode = node;
        isDragging = true;
    }
}

function handleCanvasMouseMove(e) {
    if (!isDragging || !selectedNode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedNode.x = x;
    selectedNode.y = y;
    redrawGraph();
}

function handleCanvasMouseUp() {
    if (isDragging && selectedNode) {
        executor.log(`Nó ${selectedNode.label} movido para (${Math.round(selectedNode.x)}, ${Math.round(selectedNode.y)})`);
    }
    isDragging = false;
    selectedNode = null;
}

function handleCanvasDoubleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const edge = graph.findEdgeAt(x, y);
    if (edge && graph.weighted) {
        const newWeight = prompt('Digite o novo peso da aresta:', edge.weight);
        if (newWeight !== null && !isNaN(newWeight) && newWeight > 0) {
            edge.weight = parseInt(newWeight);
            redrawGraph();
            executor.log(`Peso da aresta atualizado para ${newWeight}`);
        }
    }
}

function updateAlgorithmUI(algorithm) {
    // Mostra/oculta controles específicos
    const targetGroup = document.getElementById('targetNodeGroup');
    const weightedToggle = document.getElementById('weightedToggle');
    
    if (targetGroup) {
        targetGroup.style.display = 'block';
    }
    
    if (weightedToggle) {
        if (algorithm === 'dijkstra' || algorithm === 'astar') {
            weightedToggle.style.display = 'block';
        } else {
            weightedToggle.style.display = 'none';
        }
    }
}

function exportLog() {
    const logContent = executor.executionLog.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-algorithm-log-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    executor.log('Log exportado com sucesso.');
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);