// Visualization.js - Responsável por renderizar no canvas

class GrahamScanVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.grahamScan = null;
        
        // Configurações de desenho
        this.config = {
            pointRadius: 6,
            pivotRadius: 10,
            currentPointRadius: 9,
            lineWidth: 2,
            hullLineWidth: 3,
            gridSize: 50,
            colors: {
                point: '#4361ee',
                pivot: '#4cc9f0',
                currentPoint: '#f72585',
                stack: '#4ade80',
                hull: '#ff9100',
                angleLine: 'rgba(76, 201, 240, 0.3)',
                grid: 'rgba(255, 255, 255, 0.05)',
                text: '#e0e1dd',
                background: '#0a1929'
            }
        };

        this.setupCanvas();
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

    setGrahamScan(grahamScan) {
        this.grahamScan = grahamScan;
    }

    draw() {
        if (!this.ctx) return;

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar grade
        if (this.grahamScan?.showGrid) {
            this.drawGrid();
        }

        // Desenhar ângulos polares
        if (this.grahamScan?.showAngles && this.grahamScan.getPivot()) {
            this.drawPolarAngles();
        }

        // Desenhar fecho convexo
        const hull = this.grahamScan?.getHull();
        if (hull && hull.length >= 3) {
            this.drawHull(hull);
        }

        // Desenhar pilha atual
        const stack = this.grahamScan?.getStack();
        if (stack && stack.length >= 2) {
            this.drawStack(stack);
        }

        // Desenhar pontos
        const points = this.grahamScan?.getPoints();
        if (points) {
            this.drawPoints(points);
        }

        // Desenhar ponto atual
        const currentPoint = this.grahamScan?.getCurrentPoint();
        if (currentPoint) {
            this.drawCurrentPoint(currentPoint);
        }

        // Desenhar pivô
        const pivot = this.grahamScan?.getPivot();
        if (pivot) {
            this.drawPivot(pivot);
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

    drawPoints(points) {
        points.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.config.pointRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.colors.point;
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = this.config.lineWidth;
            this.ctx.stroke();
        });
    }

    drawPivot(pivot) {
        this.ctx.beginPath();
        this.ctx.arc(pivot.x, pivot.y, this.config.pivotRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.config.colors.pivot;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = this.config.lineWidth + 1;
        this.ctx.stroke();

        // Anel animado
        this.ctx.beginPath();
        const pulseRadius = this.config.pivotRadius + 5 + 
                           Math.sin(Date.now() / 300) * 2;
        this.ctx.arc(pivot.x, pivot.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawCurrentPoint(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.config.currentPointRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.config.colors.currentPoint;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = this.config.lineWidth;
        this.ctx.stroke();

        // Efeito de brilho
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.config.currentPointRadius + 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(247, 37, 133, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawStack(stack) {
        if (stack.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(stack[0].x, stack[0].y);
        
        for (let i = 1; i < stack.length; i++) {
            this.ctx.lineTo(stack[i].x, stack[i].y);
        }

        this.ctx.strokeStyle = this.config.colors.stack;
        this.ctx.lineWidth = this.config.lineWidth + 1;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Pontos da pilha
        stack.forEach((point, i) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.config.pointRadius + 1, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.colors.stack;
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = this.config.lineWidth;
            this.ctx.stroke();

            // Número do ponto na pilha
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((i + 1).toString(), point.x, point.y);
        });
    }

    drawHull(hull) {
        if (hull.length < 3) return;

        this.ctx.beginPath();
        this.ctx.moveTo(hull[0].x, hull[0].y);
        
        for (let i = 1; i < hull.length; i++) {
            this.ctx.lineTo(hull[i].x, hull[i].y);
        }
        
        // Fechar o polígono
        this.ctx.closePath();

        // Preencher polígono
        this.ctx.fillStyle = 'rgba(255, 145, 0, 0.1)';
        this.ctx.fill();

        // Contorno do polígono
        this.ctx.strokeStyle = this.config.colors.hull;
        this.ctx.lineWidth = this.config.hullLineWidth;
        this.ctx.stroke();
    }

    drawPolarAngles() {
        const pivot = this.grahamScan.getPivot();
        const sortedPoints = this.grahamScan.getSortedPoints();
        
        if (!pivot || !sortedPoints) return;

        sortedPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.moveTo(pivot.x, pivot.y);
            this.ctx.lineTo(point.x, point.y);
            
            this.ctx.strokeStyle = this.config.colors.angleLine;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 4]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Calcular e desenhar ângulo
            const angle = GrahamScan.polarAngle(pivot, point);
            const midX = (pivot.x + point.x) / 2;
            const midY = (pivot.y + point.y) / 2;
            
            this.ctx.fillStyle = 'rgba(76, 201, 240, 0.7)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                `${(angle * 180 / Math.PI).toFixed(1)}°`, 
                midX, 
                midY
            );
        });
    }

    drawInfo() {
        const stats = this.grahamScan?.getStats();
        if (!stats) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 180, 90);
        
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = [
            `Pontos: ${stats.totalPoints}`,
            `Passo: ${stats.currentStep}`,
            `Fecho: ${stats.hullPoints} pontos`,
            `Status: ${stats.isRunning ? (stats.isPaused ? 'Pausado' : 'Executando') : 'Pronto'}`
        ];
        
        lines.forEach((line, i) => {
            this.ctx.fillText(line, 20, 35 + i * 15);
        });
    }

    // Métodos de interação
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
    }
}

// Exportar para uso global
window.GrahamScanVisualizer = GrahamScanVisualizer;