// Controls.js - Gerenciamento da interface e controles

class GrahamScanControls {
    constructor() {
        this.grahamScan = new GrahamScan();
        this.visualizer = new GrahamScanVisualizer('grahamCanvas');
        this.visualizer.setGrahamScan(this.grahamScan);
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }

    initializeElements() {
        // Elementos de controle
        this.elements = {
            stepBtn: document.getElementById('stepBtn'),
            runBtn: document.getElementById('runBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            clearBtn: document.getElementById('clearBtn'),
            randomBtn: document.getElementById('randomBtn'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            pointCount: document.getElementById('pointCount'),
            pointCountValue: document.getElementById('pointCountValue'),
            showAngles: document.getElementById('showAngles'),
            showGrid: document.getElementById('showGrid'),
            totalPoints: document.getElementById('totalPoints'),
            currentStep: document.getElementById('currentStep'),
            hullPoints: document.getElementById('hullPoints'),
            status: document.getElementById('status'),
            stepList: document.getElementById('stepList'),
            canvas: document.getElementById('grahamCanvas')
        };
    }

    setupEventListeners() {
        // Controles de botão
        this.elements.stepBtn.addEventListener('click', () => this.handleStep());
        this.elements.runBtn.addEventListener('click', () => this.handleRun());
        this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        this.elements.randomBtn.addEventListener('click', () => this.handleRandom());

        // Controles deslizantes
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.grahamScan.speed = parseInt(e.target.value);
            this.elements.speedValue.textContent = `${this.grahamScan.speed}ms`;
        });

        this.elements.pointCount.addEventListener('input', (e) => {
            this.elements.pointCountValue.textContent = e.target.value;
        });

        // Checkboxes
        this.elements.showAngles.addEventListener('change', (e) => {
            this.grahamScan.showAngles = e.target.checked;
            this.visualizer.draw();
        });

        this.elements.showGrid.addEventListener('change', (e) => {
            this.grahamScan.showGrid = e.target.checked;
            this.visualizer.draw();
        });

        // Interação com o canvas
        this.setupCanvasInteraction();
    }

    setupCanvasInteraction() {
        const canvas = this.elements.canvas;
        
        // Adicionar ponto com clique
        canvas.addEventListener('click', (e) => {
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            this.grahamScan.addPoint(x, y);
            this.updateUI();
        });

        // Remover ponto com clique direito
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            const point = this.grahamScan.findPointNear(x, y);
            if (point) {
                this.grahamScan.removePoint(point.id);
                this.updateUI();
            }
        });

        // Arrastar pontos
        let isDragging = false;
        let draggedPoint = null;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Apenas botão esquerdo
            
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            draggedPoint = this.grahamScan.findPointNear(x, y);
            
            if (draggedPoint) {
                isDragging = true;
                e.preventDefault();
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggedPoint) return;
            
            const { x, y } = this.visualizer.getCanvasCoordinates(e);
            draggedPoint.x = x;
            draggedPoint.y = y;
            
            this.grahamScan.resetAlgorithm();
            this.updateUI();
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            draggedPoint = null;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            draggedPoint = null;
        });
    }

    // Handlers de controle
    handleStep() {
        this.grahamScan.nextStep();
        this.updateUI();
    }

    handleRun() {
        this.grahamScan.run(() => {
            this.updateUI();
        });
        this.updateUI();
    }

    handlePause() {
        const isPaused = this.grahamScan.togglePause();
        this.elements.pauseBtn.innerHTML = isPaused ? 
            '<span class="btn-icon">▶</span> Continuar' : 
            '<span class="btn-icon">⏸</span> Pausar';
        this.updateUI();
    }

    handleReset() {
        this.grahamScan.resetAlgorithm();
        this.updateUI();
    }

    handleClear() {
        this.grahamScan.clearAll();
        this.updateUI();
    }

    handleRandom() {
        const count = parseInt(this.elements.pointCount.value);
        const width = this.elements.canvas.width;
        const height = this.elements.canvas.height;
        
        this.grahamScan.generateRandomPoints(count, width, height);
        this.updateUI();
    }

    // Atualizar interface
    updateUI() {
        // Atualizar estatísticas
        const stats = this.grahamScan.getStats();
        this.elements.totalPoints.textContent = stats.totalPoints;
        this.elements.currentStep.textContent = stats.currentStep;
        this.elements.hullPoints.textContent = stats.hullPoints;
        
        // Atualizar status
        let statusText = 'Pronto';
        if (stats.isRunning) {
            statusText = stats.isPaused ? 'Pausado' : 'Executando...';
        } else if (stats.currentStep > 0 && stats.hullPoints >= 3) {
            statusText = 'Completo!';
        }
        this.elements.status.textContent = statusText;

        // Atualizar passos ativos
        this.updateStepList();

        // Atualizar estado dos botões
        const hasPoints = stats.totalPoints >= 3;
        const isRunning = stats.isRunning;
        const isPaused = stats.isPaused;
        const isComplete = stats.hullPoints >= 3;

        this.elements.stepBtn.disabled = !hasPoints || isComplete;
        this.elements.runBtn.disabled = !hasPoints || isRunning || isComplete;
        this.elements.pauseBtn.disabled = !isRunning;
        this.elements.resetBtn.disabled = stats.currentStep === 0;
        
        // Atualizar visualização
        this.visualizer.draw();
    }

    updateStepList() {
        const steps = this.elements.stepList.querySelectorAll('li');
        const currentStep = this.grahamScan.currentStep;
        
        steps.forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            
            if (currentStep === 0) {
                step.classList.remove('active');
            } else if (index === 0 && currentStep >= 1) {
                // Passo 1: Encontrar pivô
                step.classList.add('active');
            } else if (index === 1 && currentStep >= 2) {
                // Passo 2: Ordenar pontos
                step.classList.add('active');
            } else if (index === 2 && currentStep >= 3) {
                // Passo 3: Inicializar pilha
                step.classList.add('active');
            } else if (index >= 3 && index <= 7 && currentStep >= 4) {
                // Passos 4-7: Processamento
                const processingStep = Math.min(currentStep - 3, 5);
                if (index === 3 + processingStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            } else if (index === 8 && this.grahamScan.hull.length >= 3) {
                // Passo 8: Completo
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.grahamScanControls = new GrahamScanControls();
});