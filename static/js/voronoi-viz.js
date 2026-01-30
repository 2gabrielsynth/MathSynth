// VoronoiVisualizer.js - Visualização de Diagramas de Voronoi

class VoronoiVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.voronoi = null;
        
        // Configurações de desenho
        this.config = {
            pointRadius: 8,
            edgeWidth: 2,
            delaunayWidth: 1,
            gridSize: 50,
            colors: {
                background: '#0a1929',
                grid: 'rgba(255, 255, 255, 0.05)',
                point: '#4361ee',
                edge: '#f72585',
                delaunay: 'rgba(255, 145, 0, 0.6)',
                circumcenter: '#4cc9f0',
                text: '#e0e1dd'
            }
        };

        this.setupCanvas();
        this.setupControls();
    }

    setupCanvas() {
        // Ajustar tamanho do canvas
        const updateSize = () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.draw();
        };

        updateSize();
        window.addEventListener('resize', updateSize.bind(this));
    }

    setVoronoi(voronoi) {
        this.voronoi = voronoi;
    }

    setupControls() {
        // Configurar eventos dos controles
        document.getElementById('addPointBtn')?.addEventListener('click', () => {
            this.mode = 'add';
            this.canvas.style.cursor = 'crosshair';
        });

        document.getElementById('clearBtn')?.addEventListener('click', () => {
            this.voronoi?.points.splice(0);
            this.voronoi?.computeVoronoi();
            this.draw();
        });

        document.getElementById('randomBtn')?.addEventListener('click', () => {
            const count = parseInt(document.getElementById('pointCount').value);
            this.voronoi?.generateRandomPoints(count, this.canvas.width, this.canvas.height);
            this.draw();
        });

        // Configurar canvas interaction
        this.setupCanvasInteraction();
    }

    setupCanvasInteraction() {
        let isDragging = false;
        let draggedPoint = null;

        this.canvas.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            const { x, y } = this.getCanvasCoordinates(e);
            
            if (e.shiftKey) {
                // Adicionar múltiplos pontos
                for (let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 50;
                    this.voronoi?.addPoint(x + offsetX, y + offsetY);
                }
            } else {
                this.voronoi?.addPoint(x, y);
            }
            
            this.draw();
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = this.getCanvasCoordinates(e);
            const point = this.voronoi?.findPointNear(x, y);
            
            if (point) {
                this.voronoi?.removePoint(point.id);
                this.draw();
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            const { x, y } = this.getCanvasCoordinates(e);
            draggedPoint = this.voronoi?.findPointNear(x, y);
            
            if (draggedPoint) {
                isDragging = true;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggedPoint) return;
            
            const { x, y } = this.getCanvasCoordinates(e);
            draggedPoint.x = x;
            draggedPoint.y = y;
            
            this.voronoi?.computeVoronoi();
            this.draw();
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
            draggedPoint = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            draggedPoint = null;
        });
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    draw() {
        if (!this.ctx || !this.voronoi) return;

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar grade
        if (this.voronoi.showGrid) {
            this.drawGrid();
        }

        // Desenhar diagrama de Voronoi
        if (this.voronoi.showCells) {
            this.drawVoronoiCells();
        }

        if (this.voronoi.showEdges) {
            this.drawEdges();
        }

        if (this.voronoi.showDelaunay && this.voronoi.getDelaunayTriangles().length > 0) {
            this.drawDelaunayTriangulation();
            this.drawCircumcenters();
        }

        if (this.voronoi.showPoints) {
            this.drawPoints();
        }

        // Desenhar informações
        this.drawInfo();
    }

    drawGrid() {
        const { width, height } = this.canvas;
        const gridSize = this.config.gridSize;

        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 1;

        // Linhas verticais
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // Linhas horizontais
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    drawPoints() {
        const points = this.voronoi.getPoints();
        
        points.forEach((point, index) => {
            // Desenhar ponto
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.config.pointRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.colors.point;
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Desenhar número do ponto
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((index + 1).toString(), point.x, point.y);
        });
    }

    drawVoronoiCells() {
        const cells = this.voronoi.getVoronoiCells();
        const opacity = this.voronoi.cellOpacity / 100;
        
        cells.forEach((cell, index) => {
            if (cell.vertices.length < 3) return;
            
            // Desenhar célula como polígono
            this.ctx.beginPath();
            this.ctx.moveTo(cell.vertices[0].x, cell.vertices[0].y);
            
            for (let i = 1; i < cell.vertices.length; i++) {
                this.ctx.lineTo(cell.vertices[i].x, cell.vertices[i].y);
            }
            
            this.ctx.closePath();
            
            // Preencher célula
            const color = this.voronoi.getColor(index);
            this.ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
            this.ctx.fill();
            
            // Contorno da célula
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Desenhar linha do ponto ao centróide da célula
            if (this.voronoi.showDistance) {
                const centroid = this.calculateCentroid(cell.vertices);
                this.ctx.beginPath();
                this.ctx.moveTo(cell.site.x, cell.site.y);
                this.ctx.lineTo(centroid.x, centroid.y);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 3]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });
    }

    drawEdges() {
        const edges = this.voronoi.getEdges();
        
        edges.forEach(edge => {
            this.ctx.beginPath();
            this.ctx.moveTo(edge.start.x, edge.start.y);
            this.ctx.lineTo(edge.end.x, edge.end.y);
            
            this.ctx.strokeStyle = this.config.colors.edge;
            this.ctx.lineWidth = this.config.edgeWidth;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });
    }

    drawDelaunayTriangulation() {
        const triangles = this.voronoi.getDelaunayTriangles();
        
        triangles.forEach(triangle => {
            // Desenhar triângulo
            this.ctx.beginPath();
            this.ctx.moveTo(triangle.vertices[0].x, triangle.vertices[0].y);
            this.ctx.lineTo(triangle.vertices[1].x, triangle.vertices[1].y);
            this.ctx.lineTo(triangle.vertices[2].x, triangle.vertices[2].y);
            this.ctx.closePath();
            
            // Preencher triângulo
            this.ctx.fillStyle = this.config.colors.delaunay;
            this.ctx.fill();
            
            // Contorno do triângulo
            this.ctx.strokeStyle = this.config.colors.delaunay;
            this.ctx.lineWidth = this.config.delaunayWidth;
            this.ctx.stroke();
        });
    }

    drawCircumcenters() {
        const triangles = this.voronoi.getDelaunayTriangles();
        
        triangles.forEach(triangle => {
            if (triangle.circumcenter) {
                // Desenhar circuncentro
                this.ctx.beginPath();
                this.ctx.arc(triangle.circumcenter.x, triangle.circumcenter.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = this.config.colors.circumcenter;
                this.ctx.fill();
                
                // Desenhar circunferência circunscrita
                this.ctx.beginPath();
                this.ctx.arc(triangle.circumcenter.x, triangle.circumcenter.y, triangle.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });
    }

    drawInfo() {
        const stats = this.voronoi.getStats();
        
        // Painel de informações
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 220, 120);
        
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `Pontos: ${stats.totalPoints}`,
            `Células: ${stats.totalCells}`,
            `Arestas: ${stats.totalEdges}`,
            `Vértices: ${stats.totalVertices}`,
            `Tempo: ${stats.calcTime}ms`,
            `Algoritmo: ${this.voronoi.algorithm}`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 20, 35 + i * 15);
        });
    }

    calculateCentroid(vertices) {
        if (vertices.length === 0) return { x: 0, y: 0 };
        
        let sumX = 0;
        let sumY = 0;
        
        vertices.forEach(v => {
            sumX += v.x;
            sumY += v.y;
        });
        
        return {
            x: sumX / vertices.length,
            y: sumY / vertices.length
        };
    }
}

// Inicialização e controle da interface
class VoronoiControls {
    constructor() {
        this.voronoi = new Voronoi();
        this.visualizer = new VoronoiVisualizer('voronoiCanvas');
        this.visualizer.setVoronoi(this.voronoi);
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }

    initializeElements() {
        // Elementos de controle
        this.elements = {
            // Botões
            addPointBtn: document.getElementById('addPointBtn'),
            clearBtn: document.getElementById('clearBtn'),
            randomBtn: document.getElementById('randomBtn'),
            loadPresetBtn: document.getElementById('loadPresetBtn'),
            
            // Toggles de visualização
            toggleCellsBtn: document.getElementById('toggleCellsBtn'),
            toggleEdgesBtn: document.getElementById('toggleEdgesBtn'),
            togglePointsBtn: document.getElementById('togglePointsBtn'),
            toggleTriangulationBtn: document.getElementById('toggleTriangulationBtn'),
            
            // Sliders
            pointCount: document.getElementById('pointCount'),
            pointCountValue: document.getElementById('pointCountValue'),
            cellOpacity: document.getElementById('cellOpacity'),
            opacityValue: document.getElementById('opacityValue'),
            animationSpeed: document.getElementById('animationSpeed'),
            speedValue: document.getElementById('speedValue'),
            
            // Checkboxes
            showGrid: document.getElementById('showGrid'),
            showDistance: document.getElementById('showDistance'),
            animateColors: document.getElementById('animateColors'),
            
            // Select
            algorithmSelect: document.getElementById('algorithmSelect'),
            
            // Estatísticas
            totalPoints: document.getElementById('totalPoints'),
            totalCells: document.getElementById('totalCells'),
            totalVertices: document.getElementById('totalVertices'),
            totalEdges: document.getElementById('totalEdges'),
            calcTime: document.getElementById('calcTime'),
            status: document.getElementById('status'),
            
            // Canvas
            canvas: document.getElementById('voronoiCanvas')
        };
    }

    setupEventListeners() {
        // Botões de controle
        this.elements.randomBtn.addEventListener('click', () => this.handleRandom());
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        
        // Botões de toggle
        this.elements.toggleCellsBtn.addEventListener('click', () => this.toggleVisualization('showCells'));
        this.elements.toggleEdgesBtn.addEventListener('click', () => this.toggleVisualization('showEdges'));
        this.elements.togglePointsBtn.addEventListener('click', () => this.toggleVisualization('showPoints'));
        this.elements.toggleTriangulationBtn.addEventListener('click', () => this.toggleVisualization('showDelaunay'));
        
        // Sliders
        this.elements.pointCount.addEventListener('input', (e) => {
            this.elements.pointCountValue.textContent = e.target.value;
        });
        
        this.elements.cellOpacity.addEventListener('input', (e) => {
            this.voronoi.cellOpacity = parseInt(e.target.value);
            this.elements.opacityValue.textContent = `${this.voronoi.cellOpacity}%`;
            this.visualizer.draw();
        });
        
        this.elements.animationSpeed.addEventListener('input', (e) => {
            this.voronoi.animationSpeed = parseInt(e.target.value);
            this.elements.speedValue.textContent = this.voronoi.animationSpeed;
        });
        
        // Checkboxes
        this.elements.showGrid.addEventListener('change', (e) => {
            this.voronoi.showGrid = e.target.checked;
            this.visualizer.draw();
        });
        
        this.elements.showDistance.addEventListener('change', (e) => {
            this.voronoi.showDistance = e.target.checked;
            this.visualizer.draw();
        });
        
        this.elements.animateColors.addEventListener('change', (e) => {
            this.voronoi.animateColors = e.target.checked;
            this.visualizer.draw();
        });
        
        // Select de algoritmo
        this.elements.algorithmSelect.addEventListener('change', (e) => {
            this.voronoi.algorithm = e.target.value;
            this.voronoi.computeVoronoi();
            this.updateUI();
        });
        
        // Menu de presets
        this.elements.loadPresetBtn.addEventListener('click', () => {
            this.showPresetMenu();
        });
        
        // Adicionar alguns pontos iniciais para demonstração
        setTimeout(() => {
            this.voronoi.loadPreset('circle');
            this.updateUI();
        }, 500);
    }

    handleRandom() {
        const count = parseInt(this.elements.pointCount.value);
        this.voronoi.generateRandomPoints(count, this.elements.canvas.width, this.elements.canvas.height);
        this.updateUI();
    }

    handleClear() {
        this.voronoi.points = [];
        this.voronoi.computeVoronoi();
        this.updateUI();
    }

    toggleVisualization(property) {
        this.voronoi[property] = !this.voronoi[property];
        
        // Atualizar estado do botão
        const buttonMap = {
            showCells: this.elements.toggleCellsBtn,
            showEdges: this.elements.toggleEdgesBtn,
            showPoints: this.elements.togglePointsBtn,
            showDelaunay: this.elements.toggleTriangulationBtn
        };
        
        const button = buttonMap[property];
        if (button) {
            if (this.voronoi[property]) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
        
        this.visualizer.draw();
    }

    showPresetMenu() {
        const presets = [
            { name: 'Círculo', value: 'circle' },
            { name: 'Grade 3x3', value: 'grid' },
            { name: 'Aleatório', value: 'random' },
            { name: 'Clusters', value: 'clusters' }
        ];
        
        // Criar menu simples
        const menu = document.createElement('div');
        menu.className = 'preset-menu';
        menu.style.cssText = `
            position: absolute;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        presets.forEach(preset => {
            const button = document.createElement('button');
            button.textContent = preset.name;
            button.className = 'btn btn-secondary';
            button.style.cssText = 'display: block; width: 100%; margin-bottom: 5px;';
            button.addEventListener('click', () => {
                this.voronoi.loadPreset(preset.value);
                this.updateUI();
                document.body.removeChild(menu);
            });
            menu.appendChild(button);
        });
        
        const rect = this.elements.loadPresetBtn.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        
        document.body.appendChild(menu);
        
        // Fechar menu ao clicar fora
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && e.target !== this.elements.loadPresetBtn) {
                    document.body.removeChild(menu);
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    updateUI() {
        // Atualizar estatísticas
        const stats = this.voronoi.getStats();
        this.elements.totalPoints.textContent = stats.totalPoints;
        this.elements.totalCells.textContent = stats.totalCells;
        this.elements.totalEdges.textContent = stats.totalEdges;
        this.elements.totalVertices.textContent = stats.totalVertices;
        this.elements.calcTime.textContent = `${stats.calcTime}ms`;
        
        // Atualizar status
        this.elements.status.textContent = stats.totalPoints > 0 ? 'Ativo' : 'Pronto';
        
        // Redesenhar
        this.visualizer.draw();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.voronoiControls = new VoronoiControls();
});