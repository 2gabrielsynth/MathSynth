// gradient-viz.js - Versão Completa e Corrigida

class GradientVisualizer {
    constructor() {
        // Inicializar otimizador
        this.gd = new GradientDescent();
        
        // Elementos do DOM
        this.controls = {};
        this.plots = {};
        this.is3DRotating = false;
        this.animationSpeed = 50;
        
        this.init();
    }

    init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.cacheElements();
        this.bindEvents();
        this.initPlots();
        this.reset();
        this.updateStats();
    }

    cacheElements() {
        // Mapear todos os elementos do HTML
        this.controls = {
            // Função
            functionSelect: document.getElementById('functionSelect'),
            customFunctionSection: document.getElementById('customFunctionSection'),
            customFunctionExpr: document.getElementById('customFunctionExpr'),
            
            // Parâmetros
            learningRate: document.getElementById('learningRate'),
            learningRateValue: document.getElementById('learningRateValue'),
            iterations: document.getElementById('iterations'),
            iterationsValue: document.getElementById('iterationsValue'),
            momentum: document.getElementById('momentum'),
            momentumValue: document.getElementById('momentumValue'),
            startX: document.getElementById('startX'),
            startY: document.getElementById('startY'),
            
            // Algoritmo
            algorithmType: document.getElementById('algorithmType'),
            
            // Botões
            stepBtn: document.getElementById('stepBtn'),
            runBtn: document.getElementById('runBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            randomStartBtn: document.getElementById('randomStartBtn'),
            
            // Visualização
            showTrajectory: document.getElementById('showTrajectory'),
            showGradientVectors: document.getElementById('showGradientVectors'),
            showHeatmap: document.getElementById('showHeatmap'),
            animateSteps: document.getElementById('animateSteps'),
            animationSpeed: document.getElementById('animationSpeed'),
            animationSpeedValue: document.getElementById('animationSpeedValue'),
            
            // Controles de plot
            rotate3dBtn: document.getElementById('rotate3dBtn'),
            resetViewBtn: document.getElementById('resetViewBtn'),
            toggleContourBtn: document.getElementById('toggleContourBtn'),
            
            // Estatísticas
            currentIteration: document.getElementById('currentIteration'),
            currentValue: document.getElementById('currentValue'),
            gradientNorm: document.getElementById('gradientNorm'),
            executionTime: document.getElementById('executionTime'),
            minimumFound: document.getElementById('minimumFound'),
            algorithmStatus: document.getElementById('algorithmStatus')
        };
        
        // Elementos de plot
        this.plotElements = {
            surfacePlot: document.getElementById('surfacePlot'),
            contourPlot: document.getElementById('contourPlot'),
            convergencePlot: document.getElementById('convergencePlot')
        };
    }

    bindEvents() {
        // Função de otimização
        this.controls.functionSelect.addEventListener('change', (e) => {
            const funcName = e.target.value;
            if (funcName === 'custom') {
                this.controls.customFunctionSection.style.display = 'block';
                // Preencher com exemplo
                this.controls.customFunctionExpr.value = 'Math.sin(x)*Math.cos(y) + 0.1*x*y';
            } else {
                this.controls.customFunctionSection.style.display = 'none';
                this.gd.setFunction(funcName);
                this.reset();
            }
        });
        
        // Custom function
        this.controls.customFunctionExpr.addEventListener('blur', (e) => {
            const expr = e.target.value.trim();
            if (expr) {
                // Tentar derivar automaticamente ou pedir gradiente
                const gradX = this.deriveExpression(expr, 'x');
                const gradY = this.deriveExpression(expr, 'y');
                
                if (gradX && gradY) {
                    const success = this.gd.setCustomFunction(expr, `${gradX}, ${gradY}`);
                    if (success) {
                        this.reset();
                    }
                }
            }
        });
        
        // Parâmetros do algoritmo
        this.controls.learningRate.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.gd.learningRate = value;
            this.controls.learningRateValue.textContent = value.toFixed(3);
        });
        
        this.controls.iterations.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.gd.iterations = value;
            this.controls.iterationsValue.textContent = value;
        });
        
        this.controls.momentum.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.gd.momentum = value;
            this.controls.momentumValue.textContent = value.toFixed(2);
        });
        
        // Posição inicial
        this.controls.startX.addEventListener('change', (e) => {
            this.gd.x = parseFloat(e.target.value);
            this.reset();
        });
        
        this.controls.startY.addEventListener('change', (e) => {
            this.gd.y = parseFloat(e.target.value);
            this.reset();
        });
        
        // Tipo de algoritmo
        this.controls.algorithmType.addEventListener('change', (e) => {
            this.gd.algorithmType = e.target.value;
        });
        
        // Botões de execução
        this.controls.stepBtn.addEventListener('click', () => this.handleStep());
        this.controls.runBtn.addEventListener('click', () => this.handleRun());
        this.controls.pauseBtn.addEventListener('click', () => this.handlePause());
        this.controls.resetBtn.addEventListener('click', () => this.reset());
        this.controls.randomStartBtn.addEventListener('click', () => this.randomStart());
        
        // Controles de visualização
        this.controls.animationSpeed.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            this.controls.animationSpeedValue.textContent = this.animationSpeed;
        });
        
        // Controles de plot
        this.controls.rotate3dBtn.addEventListener('click', () => this.toggle3DRotation());
        this.controls.resetViewBtn.addEventListener('click', () => this.resetView());
        this.controls.toggleContourBtn.addEventListener('click', () => this.toggleContour());
    }

    initPlots() {
        // Plot da superfície 3D
        this.initSurfacePlot();
        
        // Plot de contorno
        this.initContourPlot();
        
        // Plot de convergência
        this.initConvergencePlot();
    }

    initSurfacePlot() {
        const surfaceData = this.gd.generateSurfaceData();
        
        const surfaceTrace = {
            type: 'surface',
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            colorscale: 'Viridis',
            opacity: 0.8,
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#ff0000",
                    project: {z: true}
                }
            },
            name: 'Superfície'
        };
        
        const layout = {
            title: 'Superfície da Função',
            scene: {
                xaxis: { 
                    title: 'X', 
                    range: this.gd.xDomain,
                    backgroundcolor: '#f0f0f0',
                    gridcolor: '#ffffff',
                    zerolinecolor: '#ffffff'
                },
                yaxis: { 
                    title: 'Y', 
                    range: this.gd.yDomain,
                    backgroundcolor: '#f0f0f0',
                    gridcolor: '#ffffff',
                    zerolinecolor: '#ffffff'
                },
                zaxis: { 
                    title: 'f(x,y)',
                    backgroundcolor: '#f0f0f0',
                    gridcolor: '#ffffff',
                    zerolinecolor: '#ffffff'
                },
                aspectratio: { x: 1, y: 1, z: 0.7 },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1 }
                }
            },
            margin: { t: 50, b: 20, l: 20, r: 20 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff'
        };
        
        Plotly.newPlot(this.plotElements.surfacePlot, [surfaceTrace], layout);
    }

    initContourPlot() {
        const surfaceData = this.gd.generateSurfaceData();
        
        const contourTrace = {
            type: 'contour',
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            colorscale: 'Viridis',
            contours: {
                coloring: 'heatmap',
                showlabels: true
            },
            name: 'Curvas de Nível'
        };
        
        const layout = {
            title: 'Curvas de Nível',
            xaxis: { 
                title: 'X', 
                scaleanchor: 'y',
                range: this.gd.xDomain
            },
            yaxis: { 
                title: 'Y',
                range: this.gd.yDomain
            },
            margin: { t: 50, b: 50, l: 50, r: 20 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff'
        };
        
        Plotly.newPlot(this.plotElements.contourPlot, [contourTrace], layout);
    }

    initConvergencePlot() {
        const convergenceData = this.gd.getConvergenceData();
        
        const trace = {
            type: 'scatter',
            mode: 'lines',
            x: convergenceData.iterations,
            y: convergenceData.values,
            line: { color: '#4cc9f0', width: 3 },
            name: 'Valor da Função'
        };
        
        const layout = {
            title: 'Convergência do Algoritmo',
            xaxis: { title: 'Iteração' },
            yaxis: { title: 'f(x,y)', type: 'log' },
            margin: { t: 30, b: 40, l: 50, r: 20 },
            height: 200,
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff'
        };
        
        Plotly.newPlot(this.plotElements.convergencePlot, [trace], layout);
    }

    updatePlots() {
        this.updateSurfacePlot();
        this.updateContourPlot();
        this.updateConvergencePlot();
    }

    updateSurfacePlot() {
        const trajectory = this.gd.getTrajectoryData();
        
        // Trajetória principal
        const trajectoryTrace = {
            type: 'scatter3d',
            mode: 'lines+markers',
            x: trajectory.x,
            y: trajectory.y,
            z: trajectory.z,
            line: { 
                color: '#4ade80', 
                width: 4 
            },
            marker: { 
                color: trajectory.z,
                colorscale: 'Viridis',
                size: 4,
                showscale: false
            },
            name: 'Trajetória',
            showlegend: true
        };
        
        // Ponto atual
        const currentPointTrace = {
            type: 'scatter3d',
            mode: 'markers',
            x: [this.gd.x],
            y: [this.gd.y],
            z: [this.gd.evaluate(this.gd.x, this.gd.y)],
            marker: { 
                color: '#4cc9f0',
                size: 8,
                symbol: 'circle'
            },
            name: 'Ponto Atual',
            showlegend: true
        };
        
        // Ponto inicial
        const startPoint = this.gd.history[0];
        const startPointTrace = {
            type: 'scatter3d',
            mode: 'markers',
            x: [startPoint[0]],
            y: [startPoint[1]],
            z: [this.gd.evaluate(startPoint[0], startPoint[1])],
            marker: { 
                color: '#f72585',
                size: 10,
                symbol: 'diamond'
            },
            name: 'Ponto Inicial',
            showlegend: true
        };
        
        // Vetores gradiente
        let gradientTraces = [];
        if (this.controls.showGradientVectors.checked) {
            const vectors = this.gd.getGradientVectors();
            vectors.forEach((vec, i) => {
                const trace = {
                    type: 'cone',
                    x: [vec.x],
                    y: [vec.y],
                    z: [vec.z],
                    u: [vec.dx],
                    v: [vec.dy],
                    w: [vec.dz],
                    sizemode: 'absolute',
                    sizeref: 0.5,
                    anchor: 'tail',
                    colorscale: [[0, '#7209b7'], [1, '#7209b7']],
                    showscale: false,
                    name: i === 0 ? 'Gradiente' : ''
                };
                gradientTraces.push(trace);
            });
        }
        
        // Combinar todos os traces
        const allTraces = [
            trajectoryTrace, 
            currentPointTrace, 
            startPointTrace,
            ...gradientTraces
        ];
        
        Plotly.react(this.plotElements.surfacePlot, allTraces, {
            title: `Superfície: ${GradientDescent.functions[this.gd.currentFunction]?.name || 'Função'}`
        });
    }

    updateContourPlot() {
        const trajectory = this.gd.getTrajectoryData();
        
        // Trajetória no plano XY
        const trajectoryTrace = {
            type: 'scatter',
            mode: 'lines+markers',
            x: trajectory.x,
            y: trajectory.y,
            line: { 
                color: '#4ade80', 
                width: 3 
            },
            marker: { 
                color: '#4cc9f0',
                size: 6,
                symbol: 'circle'
            },
            name: 'Trajetória'
        };
        
        // Ponto atual
        const currentPointTrace = {
            type: 'scatter',
            mode: 'markers',
            x: [this.gd.x],
            y: [this.gd.y],
            marker: { 
                color: '#ff9100',
                size: 10,
                symbol: 'star'
            },
            name: 'Ponto Atual'
        };
        
        // Mínimo global (se conhecido)
        const func = GradientDescent.functions[this.gd.currentFunction];
        const minTrace = {
            type: 'scatter',
            mode: 'markers',
            x: [func.min[0]],
            y: [func.min[1]],
            marker: { 
                color: '#ff0000',
                size: 12,
                symbol: 'x'
            },
            name: 'Mínimo Global'
        };
        
        Plotly.react(this.plotElements.contourPlot, [
            trajectoryTrace, 
            currentPointTrace, 
            minTrace
        ], {
            title: `Curvas de Nível: ${func.name}`
        });
    }

    updateConvergencePlot() {
        const convergenceData = this.gd.getConvergenceData();
        
        Plotly.react(this.plotElements.convergencePlot, [{
            type: 'scatter',
            mode: 'lines',
            x: convergenceData.iterations,
            y: convergenceData.values,
            line: { color: '#4cc9f0', width: 3 }
        }], {
            title: `Convergência (Iteração: ${this.gd.currentIteration})`
        });
    }

    updateStats() {
        const stats = this.gd.getStats();
        
        this.controls.currentIteration.textContent = stats.iteration;
        this.controls.currentValue.textContent = stats.value.toFixed(6);
        this.controls.gradientNorm.textContent = stats.gradientNorm.toFixed(6);
        this.controls.executionTime.textContent = `${stats.executionTime}ms`;
        this.controls.minimumFound.textContent = stats.minimumFound ? 'Sim' : 'Não';
        this.controls.algorithmStatus.textContent = 
            stats.isRunning ? (stats.isPaused ? 'Pausado' : 'Executando') : 'Pronto';
        
        // Atualizar estado dos botões
        this.controls.runBtn.disabled = stats.isRunning && !stats.isPaused;
        this.controls.pauseBtn.disabled = !stats.isRunning;
        this.controls.stepBtn.disabled = stats.isRunning;
        
        if (stats.isRunning) {
            this.controls.runBtn.style.display = 'none';
            this.controls.pauseBtn.style.display = 'inline-block';
        } else {
            this.controls.runBtn.style.display = 'inline-block';
            this.controls.pauseBtn.style.display = 'none';
        }
        
        this.controls.pauseBtn.innerHTML = stats.isPaused ? 
            '<i class="fas fa-play"></i> Continuar' : 
            '<i class="fas fa-pause"></i> Pausar';
    }

    handleStep() {
        if (!this.gd.isRunning) {
            const success = this.gd.step();
            if (success) {
                this.updatePlots();
                this.updateStats();
            }
        }
    }

    handleRun() {
        if (!this.gd.isRunning) {
            this.controls.runBtn.disabled = true;
            this.controls.pauseBtn.disabled = false;
            
            this.gd.run((update) => {
                if (update.finished) {
                    this.controls.runBtn.disabled = false;
                    this.controls.pauseBtn.disabled = true;
                    this.controls.algorithmStatus.textContent = 'Concluído';
                } else {
                    if (this.controls.animateSteps.checked) {
                        this.updatePlots();
                    }
                    this.updateStats();
                }
            });
        }
    }

    handlePause() {
        const isPaused = this.gd.pause();
        this.controls.algorithmStatus.textContent = isPaused ? 'Pausado' : 'Executando';
        this.updateStats();
        
        // Se estava pausado e agora continuou, atualizar plots
        if (!isPaused && this.controls.animateSteps.checked) {
            this.updatePlots();
        }
    }

    reset() {
        this.gd.reset();
        this.initPlots();
        this.updateStats();
    }

    randomStart() {
        this.gd.x = (Math.random() * 10 - 5); // Entre -5 e 5
        this.gd.y = (Math.random() * 10 - 5); // Entre -5 e 5
        this.reset();
    }

    toggle3DRotation() {
        this.is3DRotating = !this.is3DRotating;
        
        if (this.is3DRotating) {
            this.rotate3D();
            this.controls.rotate3dBtn.innerHTML = '<i class="fas fa-stop"></i> Parar Rotação';
        } else {
            this.controls.rotate3dBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Girar 3D';
        }
    }

    rotate3D() {
        if (!this.is3DRotating) return;
        
        const camera = {
            eye: {
                x: 1.5 * Math.cos(Date.now() / 3000),
                y: 1.5 * Math.sin(Date.now() / 3000),
                z: 1.2
            }
        };
        
        Plotly.relayout(this.plotElements.surfacePlot, {
            'scene.camera': camera
        });
        
        if (this.is3DRotating) {
            requestAnimationFrame(() => this.rotate3D());
        }
    }

    resetView() {
        this.is3DRotating = false;
        this.controls.rotate3dBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Girar 3D';
        
        Plotly.relayout(this.plotElements.surfacePlot, {
            'scene.camera': {
                eye: { x: 1.5, y: 1.5, z: 1 }
            }
        });
    }

    toggleContour() {
        const isVisible = this.plotElements.contourPlot.style.display !== 'none';
        this.plotElements.contourPlot.style.display = isVisible ? 'none' : 'block';
        
        this.controls.toggleContourBtn.innerHTML = isVisible ? 
            '<i class="fas fa-eye"></i> Mostrar' : 
            '<i class="fas fa-eye-slash"></i> Esconder';
    }

    deriveExpression(expr, variable) {
        // Derivada simplificada para expressões comuns
        const rules = [
            { pattern: /Math\.pow\(([^,]+),2\)/, derivative: `2*$1` },
            { pattern: /Math\.sin\(([^)]+)\)/, derivative: `Math.cos($1)` },
            { pattern: /Math\.cos\(([^)]+)\)/, derivative: `-Math.sin($1)` },
            { pattern: /Math\.exp\(([^)]+)\)/, derivative: `Math.exp($1)` },
            { pattern: /([a-zA-Z_$][a-zA-Z_$0-9]*)\s*\*\s*\1/, derivative: `2*$1` }
        ];
        
        let derived = expr;
        rules.forEach(rule => {
            derived = derived.replace(rule.pattern, rule.derivative);
        });
        
        // Derivada de x é 1, de y é 0 (ou vice-versa)
        if (variable === 'x') {
            derived = derived.replace(/x/g, '1').replace(/y/g, '0');
        } else {
            derived = derived.replace(/y/g, '1').replace(/x/g, '0');
        }
        
        return derived || '0';
    }
}

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', function() {
    window.gradientViz = new GradientVisualizer();
});