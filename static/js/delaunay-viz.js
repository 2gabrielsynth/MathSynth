// DelaunayVisualizer.js - Visualização da Triangulação de Delaunay

class DelaunayVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.delaunay = null;
        
        // Configurações de desenho
        this.config = {
            pointRadius: 8,
            pointRadiusHover: 10,
            edgeWidth: 2,
            hullWidth: 3,
            voronoiWidth: 1,
            circumcircleWidth: 2,
            gridSize: 50,
            colors: {
                background: '#0a1929',
                grid: 'rgba(255, 255, 255, 0.05)',
                point: '#4361ee',
                pointHover: '#4cc9f0',
                triangle: 'rgba(74, 222, 128, 0.3)',
                triangleBorder: '#4ade80',
                activeTriangle: 'rgba(255, 145, 0, 0.5)',
                circumcircle: 'rgba(76, 201, 240, 0.3)',
                circumcircleBorder: '#4cc9f0',
                convexHull: '#f72585',
                voronoi: 'rgba(247, 37, 133, 0.2)',
                voronoiEdge: '#f72585',
                text: '#e0e1dd',
                angle: 'rgba(255, 255, 255, 0.7)'
            }
        };

        this.setupCanvas();
        this.hoveredPoint = null;
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
        
        // Configurar hover
        this.canvas.addEventListener('mousemove', (e) => {
            const { x, y } = this.getCanvasCoordinates(e);
            this.hoveredPoint = this.delaunay?.findPointNear(x, y, 20);
            this.draw();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredPoint = null;
            this.draw();
        });
    }

    setDelaunay(delaunay) {
        this.delaunay = delaunay;
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    draw() {
        if (!this.ctx || !this.delaunay) return;

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar grade
        if (this.delaunay.showGrid) {
            this.drawGrid();
        }

        // Desenhar diagrama de Voronoi
        if (this.delaunay.showVoronoi) {
            this.drawVoronoi();
        }

        // Desenhar triângulos
        if (this.delaunay.showTriangles) {
            this.drawTriangles();
        }

        // Desenhar círculos circunscritos
        if (this.delaunay.showCircumcircles) {
            this.drawCircumcircles();
        }

        // Desenhar fecho convexo
        if (this.delaunay.showConvexHull) {
            this.drawConvexHull();
        }

        // Desenhar pontos
        if (this.delaunay.showPoints) {
            this.drawPoints();
        }

        // Desenhar ângulos
        if (this.delaunay.showAngles) {
            this.drawAngles();
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
        const points = this.delaunay.getPoints();
        
        points.forEach((point, index) => {
            const isHovered = this.hoveredPoint === point;
            const radius = isHovered ? 
                this.config.pointRadiusHover : this.config.pointRadius;
            
            // Desenhar ponto
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = isHovered ? 
                this.config.colors.pointHover : this.config.colors.point;
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Desenhar número do ponto se habilitado
            if (this.delaunay.showIndexes) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((index + 1).toString(), point.x, point.y);
            }

            // Efeito de brilho para ponto hover
            if (isHovered) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, radius + 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Mostrar coordenadas
                this.ctx.fillStyle = this.config.colors.text;
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(
                    `(${Math.round(point.x)}, ${Math.round(point.y)})`, 
                    point.x + 15, 
                    point.y - 15
                );
            }
        });
    }

    drawTriangles() {
        const triangles = this.delaunay.getTriangles();
        
        triangles.forEach((triangle, index) => {
            // Desenhar triângulo preenchido
            this.ctx.beginPath();
            this.ctx.moveTo(triangle.a.x, triangle.a.y);
            this.ctx.lineTo(triangle.b.x, triangle.b.y);
            this.ctx.lineTo(triangle.c.x, triangle.c.y);
            this.ctx.closePath();
            
            // Escolher cor baseada no ângulo mínimo
            const minAngle = triangle.angles?.min || 0;
            const colorIntensity = Math.min(1, minAngle / 60); // Normalizar para 0-60 graus
            
            if (this.delaunay.animateFlips && index === triangles.length - 1) {
                // Efeito para triângulo recém-adicionado
                this.ctx.fillStyle = `rgba(255, 145, 0, ${0.3 + Math.sin(Date.now() / 300) * 0.2})`;
            } else {
                this.ctx.fillStyle = `rgba(74, 222, 128, ${0.1 + colorIntensity * 0.3})`;
            }
            this.ctx.fill();
            
            // Contorno do triângulo
            this.ctx.strokeStyle = this.config.colors.triangleBorder;
            this.ctx.lineWidth = this.config.edgeWidth;
            this.ctx.stroke();
            
            // Desenhar número do triângulo se habilitado
            if (this.delaunay.showIndexes) {
                const centroid = this.calculateCentroid([triangle.a, triangle.b, triangle.c]);
                this.ctx.fillStyle = this.config.colors.text;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText((index + 1).toString(), centroid.x, centroid.y);
            }
        });
    }

    drawCircumcircles() {
        const triangles = this.delaunay.getTriangles();
        
        triangles.forEach(triangle => {
            if (triangle.circumcircle) {
                const { center, radius } = triangle.circumcircle;
                
                // Desenhar círculo circunscrito
                this.ctx.beginPath();
                this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                
                this.ctx.strokeStyle = this.config.colors.circumcircleBorder;
                this.ctx.lineWidth = this.config.circumcircleWidth;
                this.ctx.setLineDash([5, 3]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                // Preencher círculo
                this.ctx.fillStyle = this.config.colors.circumcircle;
                this.ctx.fill();
                
                // Desenhar circuncentro
                this.ctx.beginPath();
                this.ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = this.config.colors.circumcircleBorder;
                this.ctx.fill();
                
                // Linha do circuncentro aos vértices
                [triangle.a, triangle.b, triangle.c].forEach(vertex => {
                    this.ctx.beginPath();
                    this.ctx.moveTo(center.x, center.y);
                    this.ctx.lineTo(vertex.x, vertex.y);
                    this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.2)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                });
            }
        });
    }

    drawConvexHull() {
        const hull = this.delaunay.getConvexHull();
        
        if (hull.length < 3) return;
        
        // Desenhar fecho convexo
        this.ctx.beginPath();
        this.ctx.moveTo(hull[0].x, hull[0].y);
        
        for (let i = 1; i < hull.length; i++) {
            this.ctx.lineTo(hull[i].x, hull[i].y);
        }
        this.ctx.closePath();
        
        // Preencher fecho convexo
        this.ctx.fillStyle = 'rgba(247, 37, 133, 0.05)';
        this.ctx.fill();
        
        // Contorno do fecho convexo
        this.ctx.strokeStyle = this.config.colors.convexHull;
        this.ctx.lineWidth = this.config.hullWidth;
        this.ctx.stroke();
        
        // Destacar vértices do fecho convexo
        hull.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.colors.convexHull;
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    drawVoronoi() {
        const voronoi = this.delaunay.getVoronoiDiagram();
        if (!voronoi || !voronoi.cells) return;
        
        // Desenhar células de Voronoi
        voronoi.cells.forEach(cell => {
            if (cell.vertices.length < 3) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(cell.vertices[0].x, cell.vertices[0].y);
            
            for (let i = 1; i < cell.vertices.length; i++) {
                this.ctx.lineTo(cell.vertices[i].x, cell.vertices[i].y);
            }
            this.ctx.closePath();
            
            // Preencher célula
            this.ctx.fillStyle = this.config.colors.voronoi;
            this.ctx.fill();
            
            // Contorno da célula
            this.ctx.strokeStyle = this.config.colors.voronoiEdge;
            this.ctx.lineWidth = this.config.voronoiWidth;
            this.ctx.setLineDash([3, 3]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Linha do sítio ao centróide da célula
            const centroid = this.calculateCentroid(cell.vertices);
            this.ctx.beginPath();
            this.ctx.moveTo(cell.site.x, cell.site.y);
            this.ctx.lineTo(centroid.x, centroid.y);
            this.ctx.strokeStyle = 'rgba(247, 37, 133, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }

    drawAngles() {
        const triangles = this.delaunay.getTriangles();
        
        triangles.forEach(triangle => {
            if (!triangle.angles) return;
            
            const vertices = [triangle.a, triangle.b, triangle.c];
            const angles = [triangle.angles.A, triangle.angles.B, triangle.angles.C];
            
            // Desenhar cada ângulo
            for (let i = 0; i < 3; i++) {
                const vertex = vertices[i];
                const prev = vertices[(i + 2) % 3];
                const next = vertices[(i + 1) % 3];
                const angle = angles[i];
                
                // Calcular vetores
                const v1 = { x: prev.x - vertex.x, y: prev.y - vertex.y };
                const v2 = { x: next.x - vertex.x, y: next.y - vertex.y };
                
                // Normalizar vetores
                const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                
                if (len1 < 1e-10 || len2 < 1e-10) continue;
                
                v1.x /= len1; v1.y /= len1;
                v2.x /= len2; v2.y /= len2;
                
                // Desenhar arco do ângulo
                const radius = 20;
                const startAngle = Math.atan2(v1.y, v1.x);
                const endAngle = Math.atan2(v2.y, v2.x);
                
                this.ctx.beginPath();
                this.ctx.arc(vertex.x, vertex.y, radius, startAngle, endAngle);
                this.ctx.strokeStyle = this.config.colors.angle;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Mostrar valor do ângulo
                const midAngle = (startAngle + endAngle) / 2;
                const textX = vertex.x + (radius + 10) * Math.cos(midAngle);
                const textY = vertex.y + (radius + 10) * Math.sin(midAngle);
                
                this.ctx.fillStyle = this.config.colors.angle;
                this.ctx.font = '11px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${angle.toFixed(1)}°`, textX, textY);
            }
        });
    }

    drawInfo() {
        const stats = this.delaunay.getStats();
        
        // Painel de informações
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 140);
        
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `Pontos: ${stats.totalPoints}`,
            `Triângulos: ${stats.totalTriangles}`,
            `Arestas: ${stats.totalEdges}`,
            `Flips: ${stats.totalFlips}`,
            `Ângulo mínimo: ${stats.minAngle}°`,
            `Tempo: ${stats.calcTime}ms`,
            `Algoritmo: ${this.delaunay.algorithm}`,
            `Status: ${stats.isRunning ? (stats.isPaused ? 'Pausado' : 'Executando') : 'Pronto'}`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 20, 35 + i * 15);
        });
        
        // Propriedades de Delaunay
        if (stats.totalTriangles > 0) {
            const minAngle = parseFloat(stats.minAngle);
            let quality = '';
            let color = '';
            
            if (minAngle > 30) {
                quality = 'Excelente';
                color = '#4ade80';
            } else if (minAngle > 20) {
                quality = 'Boa';
                color = '#4cc9f0';
            } else if (minAngle > 10) {
                quality = 'Regular';
                color = '#ff9100';
            } else {
                quality = 'Ruim';
                color = '#f72585';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 13px Arial';
            this.ctx.fillText(`Qualidade: ${quality}`, 20, 155);
        }
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

// Controles da interface
class DelaunayControls {
    constructor() {
        this.delaunay = new Delaunay();
        this.visualizer = new DelaunayVisualizer('delaunayCanvas');
        this.visualizer.setDelaunay(this.delaunay);
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupCanvasInteraction();
        this.updateUI();
        
        // Adicionar alguns pontos iniciais para demonstração
        setTimeout(() => {
            this.delaunay.loadPreset('circle');
            this.updateUI();
        }, 500);
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
            toggleTrianglesBtn: document.getElementById('toggleTrianglesBtn'),
            toggleCircumcirclesBtn: document.getElementById('toggleCircumcirclesBtn'),
            togglePointsBtn: document.getElementById('togglePointsBtn'),
            toggleVoronoiBtn: document.getElementById('toggleVoronoiBtn'),
            toggleConvexHullBtn: document.getElementById('toggleConvexHullBtn'),
            toggleAnglesBtn: document.getElementById('toggleAnglesBtn'),
            
            // Controles de algoritmo
            stepBtn: document.getElementById('stepBtn'),
            runBtn: document.getElementById('runBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            
            // Sliders
            pointCount: document.getElementById('pointCount'),
            pointCountValue: document.getElementById('pointCountValue'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            
            // Checkboxes
            showGrid: document.getElementById('showGrid'),
            showIndexes: document.getElementById('showIndexes'),
            animateFlips: document.getElementById('animateFlips'),
            
            // Select
            algorithmSelect: document.getElementById('algorithmSelect'),
            
            // Estatísticas
            totalPoints: document.getElementById('totalPoints'),
            totalTriangles: document.getElementById('totalTriangles'),
            totalEdges: document.getElementById('totalEdges'),
            totalFlips: document.getElementById('totalFlips'),
            minAngle: document.getElementById('minAngle'),
            calcTime: document.getElementById('calcTime'),
            
            // Canvas
            canvas: document.getElementById('delaunayCanvas')
        };
    }

    setupEventListeners() {
        // Botões de pontos
        this.elements.randomBtn.addEventListener('click', () => this.handleRandom());
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        this.elements.loadPresetBtn.addEventListener('click', () => this.showPresetMenu());
        
        // Botões de toggle de visualização
        this.elements.toggleTrianglesBtn.addEventListener('click', () => this.toggleVisualization('showTriangles'));
        this.elements.toggleCircumcirclesBtn.addEventListener('click', () => this.toggleVisualization('showCircumcircles'));
        this.elements.togglePointsBtn.addEventListener('click', () => this.toggleVisualization('showPoints'));
        this.elements.toggleVoronoiBtn.addEventListener('click', () => this.toggleVisualization('showVoronoi'));
        this.elements.toggleConvexHullBtn.addEventListener('click', () => this.toggleVisualization('showConvexHull'));
        this.elements.toggleAnglesBtn.addEventListener('click', () => this.toggleVisualization('showAngles'));
        
        // Botões de algoritmo
        this.elements.stepBtn.addEventListener('click', () => this.handleStep());
        this.elements.runBtn.addEventListener('click', () => this.handleRun());
        this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        
        // Sliders
        this.elements.pointCount.addEventListener('input', (e) => {
            this.elements.pointCountValue.textContent = e.target.value;
        });
        
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.delaunay.speed = parseInt(e.target.value);
            this.elements.speedValue.textContent = this.delaunay.speed;
        });
        
        // Checkboxes
        this.elements.showGrid.addEventListener('change', (e) => {
            this.delaunay.showGrid = e.target.checked;
            this.visualizer.draw();
        });
        
        this.elements.showIndexes.addEventListener('change', (e) => {
            this.delaunay.showIndexes = e.target.checked;
            this.visualizer.draw();
        });
        
        this.elements.animateFlips.addEventListener('change', (e) => {
            this.delaunay.animateFlips = e.target.checked;
            this.visualizer.draw();
        });
        
        // Select de algoritmo
        this.elements.algorithmSelect.addEventListener('change', (e) => {
            this.delaunay.algorithm = e.target.value;
            this.delaunay.computeDelaunay();
            this.updateUI();
        });
    }

    setupCanvasInteraction() {
        const canvas = this.elements.canvas;
        let isDragging = false;
        let draggedPoint = null;

        canvas.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            
            if (e.shiftKey) {
                // Adicionar múltiplos pontos
                for (let i = 0; i < 3; i++) {
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 50;
                    this.delaunay.addPoint(x + offsetX, y + offsetY);
                }
            } else {
                this.delaunay.addPoint(x, y);
            }
            
            this.updateUI();
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            const point = this.delaunay.findPointNear(x, y);
            
            if (point) {
                this.delaunay.removePoint(point.id);
                this.updateUI();
            }
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            draggedPoint = this.delaunay.findPointNear(x, y);
            
            if (draggedPoint) {
                isDragging = true;
                e.preventDefault();
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggedPoint) return;
            
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            draggedPoint.x = x;
            draggedPoint.y = y;
            
            this.delaunay.computeDelaunay();
            this.visualizer.draw();
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            draggedPoint = null;
            canvas.style.cursor = 'crosshair';
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            draggedPoint = null;
            canvas.style.cursor = 'crosshair';
        });
    }

    handleRandom() {
        const count = parseInt(this.elements.pointCount.value);
        this.delaunay.generateRandomPoints(count, this.elements.canvas.width, this.elements.canvas.height);
        this.updateUI();
    }

    handleClear() {
        this.delaunay.reset();
        this.updateUI();
    }

    handleStep() {
        // Implementar passo a passo se necessário
        this.updateUI();
    }

    handleRun() {
        if (this.delaunay.isRunning) return;
        
        this.delaunay.startAnimation();
        this.updateControls();
        
        // Simular animação de adição de pontos
        const pointsToAdd = 10;
        let added = 0;
        
        const animate = () => {
            if (!this.delaunay.isRunning || this.delaunay.isPaused || added >= pointsToAdd) {
                this.delaunay.stopAnimation();
                this.updateControls();
                return;
            }
            
            const x = 100 + Math.random() * (this.elements.canvas.width - 200);
            const y = 100 + Math.random() * (this.elements.canvas.height - 200);
            this.delaunay.addPoint(x, y);
            
            added++;
            this.delaunay.animationId = setTimeout(animate, 1000 / this.delaunay.speed);
        };
        
        animate();
    }

    handlePause() {
        this.delaunay.pauseAnimation();
        this.updateControls();
    }

    handleReset() {
        this.delaunay.stopAnimation();
        this.delaunay.reset();
        this.updateUI();
    }

    toggleVisualization(property) {
        this.delaunay[property] = !this.delaunay[property];
        
        // Atualizar estado do botão
        const buttonMap = {
            showTriangles: this.elements.toggleTrianglesBtn,
            showCircumcircles: this.elements.toggleCircumcirclesBtn,
            showPoints: this.elements.togglePointsBtn,
            showVoronoi: this.elements.toggleVoronoiBtn,
            showConvexHull: this.elements.toggleConvexHullBtn,
            showAngles: this.elements.toggleAnglesBtn
        };
        
        const button = buttonMap[property];
        if (button) {
            if (this.delaunay[property]) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
        
        this.visualizer.draw();
    }

    showPresetMenu() {
        const presets = [
            { name: 'Círculo + Centro', value: 'circle' },
            { name: 'Grade 4x4', value: 'grid' },
            { name: 'Pontos Aleatórios', value: 'random' },
            { name: 'Pontos Cocirculares', value: 'cocircular' }
        ];
        
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
            min-width: 200px;
        `;
        
        presets.forEach(preset => {
            const button = document.createElement('button');
            button.textContent = preset.name;
            button.className = 'btn btn-secondary';
            button.style.cssText = 'display: block; width: 100%; margin-bottom: 5px; padding: 8px 12px;';
            button.addEventListener('click', () => {
                this.delaunay.loadPreset(preset.value);
                this.updateUI();
                document.body.removeChild(menu);
            });
            menu.appendChild(button);
        });
        
        const rect = this.elements.loadPresetBtn.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        
        document.body.appendChild(menu);
        
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

    updateControls() {
        const stats = this.delaunay.getStats();
        
        this.elements.stepBtn.disabled = stats.isRunning;
        this.elements.runBtn.disabled = stats.isRunning;
        this.elements.pauseBtn.disabled = !stats.isRunning;
        this.elements.resetBtn.disabled = stats.totalPoints === 0;
        
        if (stats.isRunning) {
            this.elements.pauseBtn.innerHTML = stats.isPaused ? 
                '<span class="btn-icon">▶</span> Continuar' : 
                '<span class="btn-icon">⏸</span> Pausar';
        }
    }

    updateUI() {
        // Atualizar estatísticas
        const stats = this.delaunay.getStats();
        this.elements.totalPoints.textContent = stats.totalPoints;
        this.elements.totalTriangles.textContent = stats.totalTriangles;
        this.elements.totalEdges.textContent = stats.totalEdges;
        this.elements.totalFlips.textContent = stats.totalFlips;
        this.elements.minAngle.textContent = `${stats.minAngle}°`;
        this.elements.calcTime.textContent = `${stats.calcTime}ms`;
        
        // Atualizar controles
        this.updateControls();
        
        // Redesenhar
        this.visualizer.draw();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.delaunayControls = new DelaunayControls();
});