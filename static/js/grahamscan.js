// GrahamScan.js - Lógica do algoritmo Graham Scan

class GrahamScan {
    constructor() {
        this.points = [];
        this.hull = [];
        this.stack = [];
        this.sortedPoints = [];
        this.pivot = null;
        this.currentStep = 0;
        this.animationId = null;
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 500;
        this.draggedPoint = null;
        this.showAngles = true;
        this.showGrid = true;
    }

    // Funções matemáticas
    static cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    static polarAngle(p0, p1) {
        return Math.atan2(p1.y - p0.y, p1.x - p0.x);
    }

    static distance(p0, p1) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Adicionar ponto
    addPoint(x, y) {
        this.points.push({ x, y, id: Date.now() + Math.random() });
        this.resetAlgorithm();
    }

    // Remover ponto
    removePoint(pointId) {
        this.points = this.points.filter(p => p.id !== pointId);
        this.resetAlgorithm();
    }

    // Encontrar ponto próximo
    findPointNear(x, y, threshold = 10) {
        return this.points.find(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
    }

    // Preparar algoritmo
    prepareAlgorithm() {
        if (this.points.length < 3) {
            return false;
        }

        // Encontrar pivô (menor y, menor x em caso de empate)
        this.pivot = this.points.reduce((min, p) => {
            if (p.y < min.y || (p.y === min.y && p.x < min.x)) {
                return p;
            }
            return min;
        });

        // Ordenar pontos por ângulo polar
        this.sortedPoints = this.points
            .filter(p => p !== this.pivot)
            .sort((a, b) => {
                const angleA = GrahamScan.polarAngle(this.pivot, a);
                const angleB = GrahamScan.polarAngle(this.pivot, b);
                
                if (angleA < angleB) return -1;
                if (angleA > angleB) return 1;
                
                // Se ângulos iguais, manter o mais distante
                return GrahamScan.distance(this.pivot, b) - 
                       GrahamScan.distance(this.pivot, a);
            });

        // Remover pontos colineares (manter apenas o mais distante)
        const uniquePoints = [];
        for (let i = 0; i < this.sortedPoints.length; i++) {
            while (i < this.sortedPoints.length - 1 &&
                   GrahamScan.polarAngle(this.pivot, this.sortedPoints[i]) === 
                   GrahamScan.polarAngle(this.pivot, this.sortedPoints[i + 1])) {
                i++;
            }
            uniquePoints.push(this.sortedPoints[i]);
        }
        
        this.sortedPoints = uniquePoints;

        // Inicializar pilha
        this.stack = [this.pivot];
        if (this.sortedPoints.length > 0) {
            this.stack.push(this.sortedPoints[0]);
        }

        this.currentStep = 1;
        return true;
    }

    // Executar próximo passo
    nextStep() {
        if (this.isPaused) return false;

        // Se ainda não inicializado, preparar algoritmo
        if (this.currentStep === 0 && !this.prepareAlgorithm()) {
            return false;
        }

        // Verificar se terminou
        if (this.currentStep > this.sortedPoints.length) {
            this.hull = [...this.stack];
            return false;
        }

        // Processar passo atual
        if (this.currentStep <= this.sortedPoints.length) {
            const pointIndex = this.currentStep - 1;
            const currentPoint = this.sortedPoints[pointIndex];

            // Verificar curva à direita (cross product negativo)
            while (this.stack.length >= 2) {
                const a = this.stack[this.stack.length - 2];
                const b = this.stack[this.stack.length - 1];
                
                if (GrahamScan.cross(a, b, currentPoint) <= 0) {
                    this.stack.pop();
                } else {
                    break;
                }
            }

            this.stack.push(currentPoint);
        }

        this.currentStep++;

        // Se terminou todos os pontos
        if (this.currentStep > this.sortedPoints.length) {
            this.hull = [...this.stack];
        }

        return true;
    }

    // Executar algoritmo automaticamente
    run(autoCallback) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        const runStep = () => {
            if (!this.isRunning || this.isPaused) return;

            const hasNext = this.nextStep();
            
            if (hasNext) {
                if (autoCallback) autoCallback();
                this.animationId = setTimeout(runStep, this.speed);
            } else {
                this.stop();
                if (autoCallback) autoCallback();
            }
        };

        runStep();
    }

    // Parar execução
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    // Pausar/continuar
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    // Reiniciar algoritmo
    resetAlgorithm() {
        this.stop();
        this.hull = [];
        this.stack = [];
        this.sortedPoints = [];
        this.pivot = null;
        this.currentStep = 0;
    }

    // Limpar tudo
    clearAll() {
        this.stop();
        this.points = [];
        this.resetAlgorithm();
    }

    // Gerar pontos aleatórios
    generateRandomPoints(count, width, height, margin = 50) {
        this.clearAll();
        
        for (let i = 0; i < count; i++) {
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);
            this.addPoint(x, y);
        }
    }

    // Métodos para obter estado atual
    getPoints() {
        return [...this.points];
    }

    getHull() {
        return [...this.hull];
    }

    getStack() {
        return [...this.stack];
    }

    getCurrentPoint() {
        if (this.currentStep > 0 && this.currentStep <= this.sortedPoints.length) {
            return this.sortedPoints[this.currentStep - 1];
        }
        return null;
    }

    getSortedPoints() {
        return [...this.sortedPoints];
    }

    getPivot() {
        return this.pivot;
    }

    getStats() {
        return {
            totalPoints: this.points.length,
            currentStep: this.currentStep,
            hullPoints: this.hull.length,
            stackPoints: this.stack.length,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }
}

// Exportar para uso global
window.GrahamScan = GrahamScan;