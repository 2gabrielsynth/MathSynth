// TreeVisualizer.js - Visualização de Árvores de Busca (Versão Corrigida)

class TreeVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas com id '${canvasId}' não encontrado`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.tree = null;
        this.hoveredNode = null;
        this.selectedNode = null;
        this.traversalAnimation = null;
        this.currentTraversal = [];
        this.traversalIndex = 0;
        
        // Configurações de desenho
        this.config = {
            nodeRadius: 40,
            nodeSpacing: 200,
            levelSpacing: 100,
            fontSize: 16,
            lineWidth: 3,
            colors: {
                background: '#ffffff',
                nodeNormal: '#4361ee',
                nodeRoot: '#4cc9f0',
                nodeHighlight: '#f72585',
                nodeRed: '#f72585',
                nodeBlack: '#2d3748',
                nodeUnbalanced: '#ff9100',
                nodeTraversing: '#4ade80',
                edge: '#778da9',
                text: '#ffffff',
                textDark: '#333333',
                balanceGood: '#4ade80',
                balanceWarning: '#ff9100',
                balanceBad: '#f72585'
            }
        };

        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        const updateSize = () => {
            if (!this.canvas) return;
            
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.draw();
        };

        updateSize();
        window.addEventListener('resize', updateSize.bind(this));
    }

    setupEventListeners() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.hoveredNode = this.tree ? this.tree.getNodeAtPosition(x, y, this.config.nodeRadius * 1.5) : null;
            this.draw();
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clickedNode = this.tree ? this.tree.getNodeAtPosition(x, y, this.config.nodeRadius * 1.5) : null;
            
            if (clickedNode) {
                this.selectedNode = clickedNode;
                this.showNodeDetails(clickedNode);
            } else {
                this.selectedNode = null;
                this.hideNodeDetails();
            }
            
            this.draw();
        });
    }

    setTree(tree) {
        this.tree = tree;
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.canvas || !this.tree) {
            if (this.ctx && this.canvas) {
                this.drawEmptyTreeMessage();
            }
            return;
        }

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calcular posições
        const positions = this.tree.calculateNodePositions();
        
        if (positions && positions.size > 0) {
            // Desenhar arestas primeiro (para ficarem atrás dos nós)
            this.drawEdges(positions);
            
            // Desenhar nós
            this.drawNodes(positions);
        } else {
            // Desenhar mensagem quando árvore está vazia
            this.drawEmptyTreeMessage();
        }
    }

    drawEdges(positions) {
        if (!positions || positions.size === 0) return;
        
        this.ctx.strokeStyle = this.config.colors.edge;
        this.ctx.lineWidth = this.config.lineWidth;
        this.ctx.lineCap = 'round';

        for (const [id, pos] of positions) {
            const node = pos.node;
            
            // Desenhar aresta para filho esquerdo
            if (node.left) {
                const leftPos = positions.get(node.left.id);
                if (leftPos) {
                    this.drawEdge(pos.x, pos.y, leftPos.x, leftPos.y);
                }
            }
            
            // Desenhar aresta para filho direito
            if (node.right) {
                const rightPos = positions.get(node.right.id);
                if (rightPos) {
                    this.drawEdge(pos.x, pos.y, rightPos.x, rightPos.y);
                }
            }
        }
    }

    drawEdge(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawNodes(positions) {
        for (const [id, pos] of positions) {
            this.drawNode(pos.node, pos.x, pos.y);
        }
    }

    drawNode(node, x, y) {
        // Determinar cor do nó
        let nodeColor = this.config.colors.nodeNormal;
        
        if (node.isRoot) {
            nodeColor = this.config.colors.nodeRoot;
        }
        
        if (node === this.selectedNode) {
            nodeColor = this.config.colors.nodeHighlight;
        } else if (node === this.hoveredNode) {
            nodeColor = this.config.colors.nodeHighlight;
        } else if (node.isTraversing) {
            nodeColor = this.config.colors.nodeTraversing;
        }
        
        // Para Red-Black trees
        if (node.type === 'redblack') {
            nodeColor = node.isRed() ? this.config.colors.nodeRed : this.config.colors.nodeBlack;
        }
        
        // Para nós desbalanceados (AVL)
        if (node.type === 'avl' && !node.isBalanced()) {
            nodeColor = this.config.colors.nodeUnbalanced;
        }

        // Desenhar nó
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.config.nodeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = nodeColor;
        this.ctx.fill();
        
        // Borda do nó
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Desenhar valor
        if (this.tree.showValues) {
            this.ctx.fillStyle = this.config.colors.text;
            this.ctx.font = `bold ${this.config.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.value.toString(), x, y);
        }

        // Desenhar altura (se habilitado)
        if (this.tree.showHeights && node.height > 0) {
            this.ctx.fillStyle = this.config.colors.textDark;
            this.ctx.font = `12px Arial`;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`h:${node.height}`, x + this.config.nodeRadius - 5, y - this.config.nodeRadius + 5);
        }

        // Desenhar fator de balanceamento (se habilitado)
        if (this.tree.showBalance && node.type === 'avl') {
            let balanceColor = this.config.colors.balanceGood;
            if (Math.abs(node.balanceFactor) === 1) {
                balanceColor = this.config.colors.balanceWarning;
            } else if (Math.abs(node.balanceFactor) > 1) {
                balanceColor = this.config.colors.balanceBad;
            }
            
            this.ctx.fillStyle = balanceColor;
            this.ctx.font = `12px Arial`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`bf:${node.balanceFactor}`, x - this.config.nodeRadius + 5, y - this.config.nodeRadius + 5);
        }

        // Desenhar cor (para Red-Black)
        if (node.type === 'redblack') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = `10px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(node.color.charAt(0), x, y + this.config.nodeRadius - 5);
        }

        // Efeito de destaque para hover
        if (node === this.hoveredNode) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.config.nodeRadius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(247, 37, 133, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawEmptyTreeMessage() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.fillStyle = '#778da9';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Árvore Vazia', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Insira valores para começar', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    showNodeDetails(node) {
        const modal = document.getElementById('nodeModal');
        const details = document.getElementById('nodeDetails');
        
        if (!modal || !details) return;
        
        const nodeType = node.type === 'redblack' ? 'Red-Black' : node.type.toUpperCase();
        
        details.innerHTML = `
            <div class="node-detail-item">
                <span class="detail-label">Valor:</span>
                <span class="detail-value">${node.value}</span>
            </div>
            <div class="node-detail-item">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${nodeType}</span>
            </div>
            <div class="node-detail-item">
                <span class="detail-label">Altura:</span>
                <span class="detail-value">${node.height}</span>
            </div>
            ${node.type === 'avl' ? `
            <div class="node-detail-item">
                <span class="detail-label">Fator Balanceamento:</span>
                <span class="detail-value">${node.balanceFactor}</span>
            </div>
            <div class="node-detail-item">
                <span class="detail-label">Balanceado:</span>
                <span class="detail-value">${node.isBalanced() ? 'Sim' : 'Não'}</span>
            </div>
            ` : ''}
            ${node.type === 'redblack' ? `
            <div class="node-detail-item">
                <span class="detail-label">Cor:</span>
                <span class="detail-value" style="color: ${node.isRed() ? '#f72585' : '#2d3748'}">
                    ${node.color}
                </span>
            </div>
            ` : ''}
            <div class="node-detail-item">
                <span class="detail-label">Filho Esquerdo:</span>
                <span class="detail-value">${node.left ? node.left.value : 'Nenhum'}</span>
            </div>
            <div class="node-detail-item">
                <span class="detail-label">Filho Direito:</span>
                <span class="detail-value">${node.right ? node.right.value : 'Nenhum'}</span>
            </div>
            <div class="node-detail-item">
                <span class="detail-label">Pai:</span>
                <span class="detail-value">${node.parent ? node.parent.value : 'Raiz'}</span>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    hideNodeDetails() {
        const modal = document.getElementById('nodeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    animateTraversal(traversalType) {
        if (!this.tree) return;
        
        // Limpar animação anterior
        if (this.traversalAnimation) {
            clearInterval(this.traversalAnimation);
            this.clearTraversalHighlight();
        }
        
        // Obter travessia
        let traversal = [];
        switch (traversalType) {
            case 'inorder':
                traversal = this.tree.inorder();
                break;
            case 'preorder':
                traversal = this.tree.preorder();
                break;
            case 'postorder':
                traversal = this.tree.postorder();
                break;
            case 'levelorder':
                traversal = this.tree.levelorder();
                break;
            default:
                return;
        }
        
        this.currentTraversal = traversal;
        this.traversalIndex = 0;
        
        // Exibir travessia no resultado
        const resultBox = document.getElementById('traversalResult');
        if (resultBox) {
            resultBox.textContent = traversal.join(' → ');
        }
        
        // Animação passo a passo
        this.traversalAnimation = setInterval(() => {
            if (this.traversalIndex >= traversal.length) {
                clearInterval(this.traversalAnimation);
                setTimeout(() => this.clearTraversalHighlight(), 1000);
                return;
            }
            
            const value = traversal[this.traversalIndex];
            this.highlightNodeWithValue(value);
            this.traversalIndex++;
            
        }, 1000 / (this.tree.animationSpeed || 50));
    }

    highlightNodeWithValue(value) {
        // Limpar destaque anterior
        this.clearTraversalHighlight();
        
        // Encontrar e destacar nó
        const positions = this.tree.calculateNodePositions();
        
        if (positions && positions.size > 0) {
            for (const [id, pos] of positions) {
                if (pos.node.value === value) {
                    pos.node.isTraversing = true;
                    break;
                }
            }
        }
        
        this.draw();
    }

    clearTraversalHighlight() {
        if (!this.tree) return;
        
        const positions = this.tree.calculateNodePositions();
        
        if (positions && positions.size > 0) {
            for (const [id, pos] of positions) {
                pos.node.isTraversing = false;
            }
        }
        
        this.draw();
    }

    highlightInsertion(node) {
        if (!node || !this.tree.animateOperations) return;
        
        node.isTraversing = true;
        this.draw();
        
        setTimeout(() => {
            node.isTraversing = false;
            this.draw();
        }, 1000);
    }

    highlightDeletion(node) {
        if (!node || !this.tree.animateOperations) return;
        
        node.isTraversing = true;
        this.draw();
        
        setTimeout(() => {
            if (this.tree) {
                const positions = this.tree.calculateNodePositions();
                if (positions && positions.size > 0) {
                    for (const [id, pos] of positions) {
                        pos.node.isTraversing = false;
                    }
                }
                this.draw();
            }
        }, 1000);
    }
}

// Controles da interface (Versão Corrigida)
class TreeControls {
    constructor() {
        try {
            this.tree = TreeFactory.createTree('avl'); // AVL como padrão
            
            // Inicializar elementos primeiro
            this.initializeElements();
            
            // Verificar se canvas existe
            if (!this.elements.canvas) {
                console.error('Canvas não encontrado! Verifique se o elemento com id "treeCanvas" existe no HTML.');
                return;
            }
            
            this.visualizer = new TreeVisualizer('treeCanvas');
            this.visualizer.setTree(this.tree);
            
            this.setupEventListeners();
            this.setupModal();
            this.updateUI();
            
            // Inserir alguns valores iniciais para demonstração
            setTimeout(() => {
                this.insertDemoValues();
            }, 500);
            
        } catch (error) {
            console.error('Erro ao inicializar TreeControls:', error);
        }
    }

    initializeElements() {
        try {
            // Elementos de controle
            this.elements = {
                // Input e botões
                valueInput: document.getElementById('valueInput'),
                insertBtn: document.getElementById('insertBtn'),
                deleteBtn: document.getElementById('deleteBtn'),
                searchBtn: document.getElementById('searchBtn'),
                clearBtn: document.getElementById('clearBtn'),
                randomBtn: document.getElementById('randomBtn'),
                balanceBtn: document.getElementById('balanceBtn'),
                
                // Travessias
                inorderBtn: document.getElementById('inorderBtn'),
                preorderBtn: document.getElementById('preorderBtn'),
                postorderBtn: document.getElementById('postorderBtn'),
                levelorderBtn: document.getElementById('levelorderBtn'),
                traversalResult: document.getElementById('traversalResult'),
                
                // Sliders
                animationSpeed: document.getElementById('animationSpeed'),
                speedValue: document.getElementById('speedValue'),
                nodeSize: document.getElementById('nodeSize'),
                nodeSizeValue: document.getElementById('nodeSizeValue'),
                randomCount: document.getElementById('randomCount'),
                randomCountValue: document.getElementById('randomCountValue'),
                
                // Checkboxes
                showValues: document.getElementById('showValues'),
                showHeights: document.getElementById('showHeights'),
                showBalance: document.getElementById('showBalance'),
                animateOperations: document.getElementById('animateOperations'),
                
                // Cards de tipo de árvore
                treeTypeCards: document.querySelectorAll('.tree-type-card'),
                
                // Estatísticas
                nodeCount: document.getElementById('nodeCount'),
                treeHeight: document.getElementById('treeHeight'),
                balanceFactor: document.getElementById('balanceFactor'),
                rotationCount: document.getElementById('rotationCount'),
                treeType: document.getElementById('treeType'),
                treeStatus: document.getElementById('treeStatus'),
                
                // Passos da operação
                operationSteps: document.getElementById('operationSteps'),
                
                // Canvas
                canvas: document.getElementById('treeCanvas')
            };
            
            // Verificar elementos essenciais
            const requiredElements = ['canvas', 'valueInput', 'insertBtn'];
            for (const elem of requiredElements) {
                if (!this.elements[elem]) {
                    console.warn(`Elemento '${elem}' não encontrado`);
                }
            }
            
        } catch (error) {
            console.error('Erro ao inicializar elementos:', error);
            this.elements = {
                canvas: document.getElementById('treeCanvas')
            };
        }
    }

    setupEventListeners() {
        try {
            // Cards de tipo de árvore
            if (this.elements.treeTypeCards) {
                this.elements.treeTypeCards.forEach(card => {
                    card.addEventListener('click', () => {
                        const type = card.dataset.type;
                        this.changeTreeType(type);
                        
                        // Atualizar seleção visual
                        this.elements.treeTypeCards.forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                    });
                });
            }

            // Botões de operação
            if (this.elements.insertBtn) {
                this.elements.insertBtn.addEventListener('click', () => this.handleInsert());
            }
            if (this.elements.deleteBtn) {
                this.elements.deleteBtn.addEventListener('click', () => this.handleDelete());
            }
            if (this.elements.searchBtn) {
                this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
            }
            if (this.elements.clearBtn) {
                this.elements.clearBtn.addEventListener('click', () => this.handleClear());
            }
            if (this.elements.randomBtn) {
                this.elements.randomBtn.addEventListener('click', () => this.handleRandom());
            }
            if (this.elements.balanceBtn) {
                this.elements.balanceBtn.addEventListener('click', () => this.handleBalance());
            }

            // Botões de travessia
            if (this.elements.inorderBtn) {
                this.elements.inorderBtn.addEventListener('click', () => this.handleTraversal('inorder'));
            }
            if (this.elements.preorderBtn) {
                this.elements.preorderBtn.addEventListener('click', () => this.handleTraversal('preorder'));
            }
            if (this.elements.postorderBtn) {
                this.elements.postorderBtn.addEventListener('click', () => this.handleTraversal('postorder'));
            }
            if (this.elements.levelorderBtn) {
                this.elements.levelorderBtn.addEventListener('click', () => this.handleTraversal('levelorder'));
            }

            // Sliders
            if (this.elements.animationSpeed) {
                this.elements.animationSpeed.addEventListener('input', (e) => {
                    this.tree.animationSpeed = parseInt(e.target.value) || 50;
                    if (this.elements.speedValue) {
                        this.elements.speedValue.textContent = this.tree.animationSpeed;
                    }
                });
            }

            if (this.elements.nodeSize) {
                this.elements.nodeSize.addEventListener('input', (e) => {
                    const radius = parseInt(e.target.value) / 2;
                    if (this.visualizer && this.visualizer.config) {
                        this.visualizer.config.nodeRadius = radius;
                    }
                    if (this.elements.nodeSizeValue) {
                        this.elements.nodeSizeValue.textContent = `${e.target.value}px`;
                    }
                    if (this.visualizer) {
                        this.visualizer.draw();
                    }
                });
            }

            if (this.elements.randomCount) {
                this.elements.randomCount.addEventListener('input', (e) => {
                    if (this.elements.randomCountValue) {
                        this.elements.randomCountValue.textContent = e.target.value;
                    }
                });
            }

            // Checkboxes
            if (this.elements.showValues) {
                this.elements.showValues.addEventListener('change', (e) => {
                    this.tree.showValues = e.target.checked;
                    if (this.visualizer) {
                        this.visualizer.draw();
                    }
                });
            }

            if (this.elements.showHeights) {
                this.elements.showHeights.addEventListener('change', (e) => {
                    this.tree.showHeights = e.target.checked;
                    if (this.visualizer) {
                        this.visualizer.draw();
                    }
                });
            }

            if (this.elements.showBalance) {
                this.elements.showBalance.addEventListener('change', (e) => {
                    this.tree.showBalance = e.target.checked;
                    if (this.visualizer) {
                        this.visualizer.draw();
                    }
                });
            }

            if (this.elements.animateOperations) {
                this.elements.animateOperations.addEventListener('change', (e) => {
                    this.tree.animateOperations = e.target.checked;
                });
            }

            // Enter para inserir
            if (this.elements.valueInput) {
                this.elements.valueInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleInsert();
                    }
                });
            }
            
        } catch (error) {
            console.error('Erro ao configurar event listeners:', error);
        }
    }

    setupModal() {
        try {
            const modal = document.getElementById('nodeModal');
            const closeBtn = document.querySelector('.close-modal');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (modal) modal.style.display = 'none';
                    if (this.visualizer) {
                        this.visualizer.selectedNode = null;
                        this.visualizer.draw();
                    }
                });
            }
            
            window.addEventListener('click', (e) => {
                const modal = document.getElementById('nodeModal');
                if (e.target === modal && modal) {
                    modal.style.display = 'none';
                    if (this.visualizer) {
                        this.visualizer.selectedNode = null;
                        this.visualizer.draw();
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao configurar modal:', error);
        }
    }

    insertDemoValues() {
        try {
            const demoValues = [50, 30, 70, 20, 40, 60, 80];
            
            // Limpar árvore primeiro
            this.tree.clear();
            if (this.visualizer) {
                this.visualizer.selectedNode = null;
                this.visualizer.hoveredNode = null;
            }
            
            demoValues.forEach((value, index) => {
                setTimeout(() => {
                    this.tree.insert(value);
                    this.updateUI();
                }, index * 300);
            });
            
        } catch (error) {
            console.error('Erro ao inserir valores demo:', error);
        }
    }

    changeTreeType(type) {
        try {
            // Salvar valores atuais
            const values = this.tree ? this.tree.inorder() : [];
            
            // Criar nova árvore
            this.tree = TreeFactory.createTree(type);
            
            // Transferir configurações
            if (this.elements.animationSpeed) {
                this.tree.animationSpeed = parseInt(this.elements.animationSpeed.value) || 50;
            }
            if (this.elements.showValues) {
                this.tree.showValues = this.elements.showValues.checked;
            }
            if (this.elements.showHeights) {
                this.tree.showHeights = this.elements.showHeights.checked;
            }
            if (this.elements.showBalance) {
                this.tree.showBalance = this.elements.showBalance.checked;
            }
            if (this.elements.animateOperations) {
                this.tree.animateOperations = this.elements.animateOperations.checked;
            }
            
            // Reinserir valores
            values.forEach(value => {
                this.tree.insert(value);
            });
            
            // Atualizar visualizador
            if (this.visualizer) {
                this.visualizer.setTree(this.tree);
            }
            this.updateUI();
            
            // Atualizar informações do tipo
            const treeInfo = TreeFactory.getTreeInfo(type);
            this.showNotification(`Alterado para ${treeInfo.name}`);
            
        } catch (error) {
            console.error('Erro ao mudar tipo de árvore:', error);
            this.showNotification('Erro ao mudar tipo de árvore', 'error');
        }
    }

    handleInsert() {
        try {
            const value = parseInt(this.elements.valueInput?.value);
            
            if (isNaN(value) || value < 0 || value > 999) {
                this.showNotification('Por favor, insira um valor entre 0 e 999', 'error');
                return;
            }
            
            const node = this.tree.insert(value);
            
            if (node) {
                if (this.visualizer) {
                    this.visualizer.highlightInsertion(node);
                }
                this.showNotification(`Valor ${value} inserido com sucesso`, 'success');
            } else {
                this.showNotification(`Valor ${value} já existe na árvore`, 'warning');
            }
            
            if (this.elements.valueInput) {
                this.elements.valueInput.value = '';
                this.elements.valueInput.focus();
            }
            this.updateUI();
            
        } catch (error) {
            console.error('Erro ao inserir valor:', error);
            this.showNotification('Erro ao inserir valor', 'error');
        }
    }

    handleDelete() {
        try {
            const value = parseInt(this.elements.valueInput?.value);
            
            if (isNaN(value)) {
                this.showNotification('Por favor, insira um valor válido', 'error');
                return;
            }
            
            const success = this.tree.delete(value);
            
            if (success) {
                if (this.visualizer) {
                    this.visualizer.highlightDeletion(this.tree.selectedNode);
                }
                this.showNotification(`Valor ${value} removido com sucesso`, 'success');
            } else {
                this.showNotification(`Valor ${value} não encontrado`, 'warning');
            }
            
            if (this.elements.valueInput) {
                this.elements.valueInput.value = '';
                this.elements.valueInput.focus();
            }
            this.updateUI();
            
        } catch (error) {
            console.error('Erro ao remover valor:', error);
            this.showNotification('Erro ao remover valor', 'error');
        }
    }

    handleSearch() {
        try {
            const value = parseInt(this.elements.valueInput?.value);
            
            if (isNaN(value)) {
                this.showNotification('Por favor, insira um valor válido', 'error');
                return;
            }
            
            const node = this.tree.search(value);
            
            if (node) {
                if (this.visualizer) {
                    this.visualizer.selectedNode = node;
                }
                this.showNotification(`Valor ${value} encontrado`, 'success');
            } else {
                if (this.visualizer) {
                    this.visualizer.selectedNode = null;
                }
                this.showNotification(`Valor ${value} não encontrado`, 'warning');
            }
            
            if (this.visualizer) {
                this.visualizer.draw();
            }
            this.updateUI();
            
        } catch (error) {
            console.error('Erro ao buscar valor:', error);
            this.showNotification('Erro ao buscar valor', 'error');
        }
    }

    handleClear() {
        try {
            if (confirm('Tem certeza que deseja limpar a árvore? Todos os nós serão removidos.')) {
                this.tree.clear();
                if (this.visualizer) {
                    this.visualizer.selectedNode = null;
                    this.visualizer.hoveredNode = null;
                }
                this.showNotification('Árvore limpa', 'info');
                this.updateUI();
            }
        } catch (error) {
            console.error('Erro ao limpar árvore:', error);
            this.showNotification('Erro ao limpar árvore', 'error');
        }
    }

    handleRandom() {
        try {
            const count = parseInt(this.elements.randomCount?.value || '15');
            
            if (this.tree.nodeCount > 0) {
                if (!confirm(`A árvore atual será substituída por ${count} valores aleatórios. Continuar?`)) {
                    return;
                }
            }
            
            this.tree.generateRandomTree(count);
            this.showNotification(`Árvore gerada com ${count} valores aleatórios`, 'info');
            this.updateUI();
            
        } catch (error) {
            console.error('Erro ao gerar árvore aleatória:', error);
            this.showNotification('Erro ao gerar árvore aleatória', 'error');
        }
    }

    handleBalance() {
        try {
            this.tree.balanceTree();
            this.showNotification('Árvore balanceada', 'info');
            this.updateUI();
        } catch (error) {
            console.error('Erro ao balancear árvore:', error);
            this.showNotification('Erro ao balancear árvore', 'error');
        }
    }

    handleTraversal(type) {
        try {
            const typeNames = {
                inorder: 'In-Order',
                preorder: 'Pre-Order',
                postorder: 'Post-Order',
                levelorder: 'Level-Order'
            };
            
            this.showNotification(`Executando travessia ${typeNames[type]}`, 'info');
            if (this.visualizer) {
                this.visualizer.animateTraversal(type);
            }
        } catch (error) {
            console.error('Erro ao executar travessia:', error);
            this.showNotification('Erro ao executar travessia', 'error');
        }
    }

    updateUI() {
        try {
            // Atualizar estatísticas
            const stats = this.tree.getStats();
            
            if (this.elements.nodeCount) {
                this.elements.nodeCount.textContent = stats.nodeCount;
            }
            if (this.elements.treeHeight) {
                this.elements.treeHeight.textContent = stats.height;
            }
            if (this.elements.balanceFactor) {
                this.elements.balanceFactor.textContent = stats.isBalanced ? 'Sim' : 'Não';
            }
            if (this.elements.rotationCount) {
                this.elements.rotationCount.textContent = stats.rotationCount;
            }
            if (this.elements.treeType) {
                this.elements.treeType.textContent = stats.type;
            }
            if (this.elements.treeStatus) {
                this.elements.treeStatus.textContent = stats.isBalanced ? 'Balanceada' : 'Desbalanceada';
                this.elements.treeStatus.style.color = stats.isBalanced ? '#4ade80' : '#f72585';
            }
            
            // Atualizar passos da operação
            this.updateOperationSteps();
            
            // Redesenhar árvore
            if (this.visualizer) {
                this.visualizer.draw();
            }
            
        } catch (error) {
            console.error('Erro ao atualizar UI:', error);
        }
    }

    updateOperationSteps() {
        try {
            const container = this.elements.operationSteps;
            if (!container) return;
            
            if (!this.tree.operations || this.tree.operations.length === 0) {
                container.innerHTML = '<p class="no-operation">Nenhuma operação em andamento</p>';
                return;
            }
            
            container.innerHTML = this.tree.operations.map((step, index) => 
                `<div class="step-item ${index === this.tree.operations.length - 1 ? 'active' : ''}">
                    ${step}
                </div>`
            ).join('');
            
            // Scroll para o final
            container.scrollTop = container.scrollHeight;
            
        } catch (error) {
            console.error('Erro ao atualizar passos da operação:', error);
        }
    }

    showNotification(message, type = 'info') {
        try {
            // Criar notificação
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icon = type === 'success' ? 'check-circle' :
                        type === 'error' ? 'exclamation-circle' :
                        type === 'warning' ? 'exclamation-triangle' : 'info-circle';
            
            notification.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            `;
            
            // Estilos
            const bgColor = type === 'success' ? '#4ade80' :
                           type === 'error' ? '#f72585' :
                           type === 'warning' ? '#ff9100' : '#4361ee';
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease-out;
            `;
            
            // Adicionar ao body
            document.body.appendChild(notification);
            
            // Adicionar animações CSS se não existirem
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes slideOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Remover após 3 segundos
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao mostrar notificação:', error);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.treeControls = new TreeControls();
        console.log('TreeControls inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar TreeControls:', error);
    }
});