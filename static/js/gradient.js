// gradient.js - Versão Completa e Corrigida

class GradientDescent {
    constructor() {
        // Configurações básicas
        this.currentFunction = 'sphere';
        this.learningRate = 0.1;
        this.iterations = 100;
        this.currentIteration = 0;
        this.momentum = 0.9;
        this.velocityX = 0;
        this.velocityY = 0;
        this.algorithmType = 'batch';
        this.batchSize = 10;
        
        // Estado
        this.x = -2;
        this.y = 2;
        this.isRunning = false;
        this.isPaused = false;
        
        // Histórico
        this.history = [];
        this.valuesHistory = [];
        this.gradientHistory = [];
        
        // Domínio para visualização
        this.xDomain = [-5, 5];
        this.yDomain = [-5, 5];
        
        // Timers
        this.startTime = 0;
        this.executionTime = 0;
        
        // Mínimo encontrado
        this.minimumFound = false;
        this.minimumTolerance = 0.001;
    }

    // Todas as funções do HTML
    static functions = {
        sphere: {
            name: 'Esfera',
            f: (x, y) => x * x + y * y,
            grad: (x, y) => [2 * x, 2 * y],
            min: [0, 0],
            minValue: 0,
            description: 'f(x,y) = x² + y²'
        },
        rosenbrock: {
            name: 'Rosenbrock',
            f: (x, y) => Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2),
            grad: (x, y) => [
                -2 * (1 - x) - 400 * x * (y - x * x),
                200 * (y - x * x)
            ],
            min: [1, 1],
            minValue: 0,
            description: 'f(x,y) = (1-x)² + 100(y-x²)²'
        },
        rastrigin: {
            name: 'Rastrigin',
            f: (x, y) => 20 + (x * x - 10 * Math.cos(2 * Math.PI * x)) + 
                        (y * y - 10 * Math.cos(2 * Math.PI * y)),
            grad: (x, y) => [
                2 * x + 20 * Math.PI * Math.sin(2 * Math.PI * x),
                2 * y + 20 * Math.PI * Math.sin(2 * Math.PI * y)
            ],
            min: [0, 0],
            minValue: 0,
            description: 'f(x,y) = 20 + (x²-10cos(2πx)) + (y²-10cos(2πy))'
        },
        ackley: {
            name: 'Ackley',
            f: (x, y) => {
                const term1 = -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x*x + y*y)));
                const term2 = -Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)));
                return term1 + term2 + Math.E + 20;
            },
            grad: (x, y) => {
                const sqrtTerm = Math.sqrt(0.5 * (x*x + y*y));
                const expTerm1 = Math.exp(-0.2 * sqrtTerm);
                const expTerm2 = Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)));
                
                const gradX = (0.2 * x * expTerm1 / (sqrtTerm + 1e-8)) + 
                             (Math.PI * Math.sin(2 * Math.PI * x) * expTerm2);
                const gradY = (0.2 * y * expTerm1 / (sqrtTerm + 1e-8)) + 
                             (Math.PI * Math.sin(2 * Math.PI * y) * expTerm2);
                
                return [gradX, gradY];
            },
            min: [0, 0],
            minValue: 0,
            description: 'Ackley Function'
        },
        beale: {
            name: 'Beale',
            f: (x, y) => {
                const t1 = Math.pow(1.5 - x + x*y, 2);
                const t2 = Math.pow(2.25 - x + x*y*y, 2);
                const t3 = Math.pow(2.625 - x + x*Math.pow(y, 3), 2);
                return t1 + t2 + t3;
            },
            grad: (x, y) => {
                const gradX = -2*(1.5 - x + x*y) + 2*(1.5 - x + x*y)*(-1 + y) +
                             -2*(2.25 - x + x*y*y) + 2*(2.25 - x + x*y*y)*(-1 + y*y) +
                             -2*(2.625 - x + x*Math.pow(y,3)) + 2*(2.625 - x + x*Math.pow(y,3))*(-1 + Math.pow(y,3));
                
                const gradY = 2*(1.5 - x + x*y)*x +
                             2*(2.25 - x + x*y*y)*2*x*y +
                             2*(2.625 - x + x*Math.pow(y,3))*3*x*y*y;
                
                return [gradX, gradY];
            },
            min: [3, 0.5],
            minValue: 0,
            description: 'Beale Function'
        },
        himmelblau: {
            name: 'Himmelblau',
            f: (x, y) => Math.pow(x*x + y - 11, 2) + Math.pow(x + y*y - 7, 2),
            grad: (x, y) => [
                4*x*(x*x + y - 11) + 2*(x + y*y - 7),
                2*(x*x + y - 11) + 4*y*(x + y*y - 7)
            ],
            min: [3, 2], // Existem 4 mínimos, este é um deles
            minValue: 0,
            description: 'f(x,y) = (x²+y-11)² + (x+y²-7)²'
        },
        custom: {
            name: 'Custom',
            f: (x, y) => x * x + y * y, // Default
            grad: (x, y) => [2 * x, 2 * y], // Default
            min: [0, 0],
            minValue: 0,
            description: 'Função Personalizada',
            isCustom: true
        }
    };

    evaluate(x, y) {
        const func = GradientDescent.functions[this.currentFunction];
        if (!func) {
            console.error(`Função "${this.currentFunction}" não encontrada`);
            return 0;
        }
        return func.f(x, y);
    }

    gradient(x, y) {
        const func = GradientDescent.functions[this.currentFunction];
        if (!func) {
            console.error(`Função "${this.currentFunction}" não encontrada`);
            return [0, 0];
        }
        return func.grad(x, y);
    }

    step() {
        if (this.currentIteration >= this.iterations) {
            return false;
        }

        const [gradX, gradY] = this.gradient(this.x, this.y);
        
        // Aplicar algoritmo selecionado
        switch(this.algorithmType) {
            case 'momentum':
                this.velocityX = this.momentum * this.velocityX - this.learningRate * gradX;
                this.velocityY = this.momentum * this.velocityY - this.learningRate * gradY;
                this.x += this.velocityX;
                this.y += this.velocityY;
                break;
                
            case 'stochastic':
                // Adiciona um pouco de ruído para simular SGD
                const noiseX = (Math.random() - 0.5) * 0.1;
                const noiseY = (Math.random() - 0.5) * 0.1;
                this.x -= this.learningRate * (gradX + noiseX);
                this.y -= this.learningRate * (gradY + noiseY);
                break;
                
            case 'miniBatch':
                // Simula mini-batch com média ponderada
                const batchFactor = 0.8 + 0.4 * Math.random(); // Entre 0.8 e 1.2
                this.x -= this.learningRate * gradX * batchFactor;
                this.y -= this.learningRate * gradY * batchFactor;
                break;
                
            default: // batch
                this.x -= this.learningRate * gradX;
                this.y -= this.learningRate * gradY;
        }
        
        // Registrar histórico
        const currentValue = this.evaluate(this.x, this.y);
        this.history.push([this.x, this.y]);
        this.valuesHistory.push(currentValue);
        this.gradientHistory.push([gradX, gradY]);
        
        // Verificar convergência
        const gradNorm = Math.sqrt(gradX*gradX + gradY*gradY);
        if (gradNorm < this.minimumTolerance) {
            this.minimumFound = true;
        }
        
        this.currentIteration++;
        return true;
    }

    run(callback) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        
        const runStep = () => {
            if (!this.isRunning || this.isPaused) return;
            
            const hasMore = this.step();
            
            if (callback) {
                this.executionTime = Date.now() - this.startTime;
                callback({
                    iteration: this.currentIteration,
                    x: this.x,
                    y: this.y,
                    value: this.evaluate(this.x, this.y),
                    gradient: this.gradient(this.x, this.y),
                    hasMoreSteps: hasMore,
                    executionTime: this.executionTime,
                    minimumFound: this.minimumFound
                });
            }
            
            if (hasMore && this.currentIteration < this.iterations && !this.minimumFound) {
                setTimeout(runStep, 50);
            } else {
                this.stop();
                if (callback) {
                    callback({
                        finished: true,
                        iteration: this.currentIteration,
                        executionTime: this.executionTime,
                        minimumFound: this.minimumFound
                    });
                }
            }
        };
        
        runStep();
    }

    pause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.executionTime = Date.now() - this.startTime;
    }

    reset() {
        this.stop();
        this.currentIteration = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.minimumFound = false;
        this.executionTime = 0;
        this.history = [[this.x, this.y]];
        this.valuesHistory = [this.evaluate(this.x, this.y)];
        this.gradientHistory = [this.gradient(this.x, this.y)];
    }

    setFunction(funcName) {
        if (GradientDescent.functions[funcName]) {
            this.currentFunction = funcName;
        } else {
            console.warn(`Função "${funcName}" não encontrada, usando sphere`);
            this.currentFunction = 'sphere';
        }
        this.reset();
    }

    setCustomFunction(fStr, gradStr) {
        try {
            // Cria função customizada
            const customFunc = {
                name: 'Custom',
                f: new Function('x', 'y', `return ${fStr};`),
                grad: new Function('x', 'y', `return [${gradStr}];`),
                min: [0, 0],
                minValue: 0,
                description: 'Função Personalizada',
                isCustom: true
            };
            
            GradientDescent.functions.custom = customFunc;
            this.setFunction('custom');
            return true;
        } catch (error) {
            console.error('Erro ao criar função customizada:', error);
            return false;
        }
    }

    // Dados para visualização
    generateSurfaceData(resolution = 30) {
        const data = {
            x: [],
            y: [],
            z: []
        };
        
        const xStep = (this.xDomain[1] - this.xDomain[0]) / resolution;
        const yStep = (this.yDomain[1] - this.yDomain[0]) / resolution;
        
        for (let i = 0; i <= resolution; i++) {
            const x = this.xDomain[0] + i * xStep;
            data.x.push(x);
            
            const rowZ = [];
            for (let j = 0; j <= resolution; j++) {
                const y = this.yDomain[0] + j * yStep;
                if (i === 0) data.y.push(y);
                
                const z = this.evaluate(x, y);
                rowZ.push(z);
            }
            data.z.push(rowZ);
        }
        
        return data;
    }

    getTrajectoryData() {
        return {
            x: this.history.map(p => p[0]),
            y: this.history.map(p => p[1]),
            z: this.history.map(p => this.evaluate(p[0], p[1]))
        };
    }

    getGradientVectors() {
        if (this.history.length < 2) return [];
        
        const vectors = [];
        for (let i = 0; i < Math.min(this.history.length, 20); i++) {
            const point = this.history[i];
            const grad = this.gradientHistory[i] || [0, 0];
            vectors.push({
                x: point[0],
                y: point[1],
                z: this.evaluate(point[0], point[1]),
                dx: -grad[0] * 0.1,
                dy: -grad[1] * 0.1,
                dz: 0
            });
        }
        return vectors;
    }

    getStats() {
        const currentValue = this.evaluate(this.x, this.y);
        const [gradX, gradY] = this.gradient(this.x, this.y);
        const gradNorm = Math.sqrt(gradX*gradX + gradY*gradY);
        
        return {
            iteration: this.currentIteration,
            x: this.x,
            y: this.y,
            value: currentValue,
            gradientX: gradX,
            gradientY: gradY,
            gradientNorm: gradNorm,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            minimumFound: this.minimumFound,
            executionTime: this.executionTime,
            historyLength: this.history.length,
            algorithmType: this.algorithmType
        };
    }

    getConvergenceData() {
        return {
            iterations: Array.from({length: this.valuesHistory.length}, (_, i) => i),
            values: this.valuesHistory
        };
    }
}

window.GradientDescent = GradientDescent;