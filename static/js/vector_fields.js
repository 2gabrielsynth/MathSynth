// Classes para o sistema de campos vetoriais
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }
    
    subtract(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }
    
    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }
    
    divide(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return this.divide(mag);
    }
    
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    
    angle() {
        return Math.atan2(this.y, this.x);
    }
    
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    
    clone() {
        return new Vector2D(this.x, this.y);
    }
    
    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
}

class VectorField {
    constructor(width, height, resolution = 20) {
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.fieldType = 'uniform';
        this.intensity = 1.0;
        this.angle = Math.PI / 4; // 45 graus
        this.center = new Vector2D(width / 2, height / 2);
        this.customFnX = (x, y) => y;
        this.customFnY = (x, y) => -x;
        
        this.grid = [];
        this.createGrid();
    }
    
    createGrid() {
        this.grid = [];
        const cols = Math.floor(this.width / this.resolution);
        const rows = Math.floor(this.height / this.resolution);
        
        for (let i = 0; i <= cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j <= rows; j++) {
                const x = i * this.resolution;
                const y = j * this.resolution;
                this.grid[i][j] = this.calculateVector(x, y);
            }
        }
    }
    
    calculateVector(x, y) {
        const normalizedX = (x - this.width / 2) / (this.width / 2);
        const normalizedY = (y - this.height / 2) / (this.height / 2);
        
        let vx = 0, vy = 0;
        
        switch(this.fieldType) {
            case 'uniform':
                vx = Math.cos(this.angle);
                vy = Math.sin(this.angle);
                break;
                
            case 'radial':
                const dx = normalizedX;
                const dy = normalizedY;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
                vx = dx / dist;
                vy = dy / dist;
                break;
                
            case 'vortex':
                vx = -normalizedY;
                vy = normalizedX;
                break;
                
            case 'sink':
                vx = -normalizedX;
                vy = -normalizedY;
                break;
                
            case 'source':
                vx = normalizedX;
                vy = normalizedY;
                break;
                
            case 'shear':
                vx = Math.sin(normalizedY * Math.PI * 2);
                vy = 0;
                break;
                
            case 'gradient':
                // Gradiente de f(x,y) = x^2 + y^2
                vx = 2 * normalizedX;
                vy = 2 * normalizedY;
                break;
                
            case 'custom':
                try {
                    vx = this.evaluateFunction(this.customFnX, normalizedX, normalizedY);
                    vy = this.evaluateFunction(this.customFnY, normalizedX, normalizedY);
                } catch (e) {
                    vx = 0;
                    vy = 0;
                }
                break;
        }
        
        return new Vector2D(vx * this.intensity, vy * this.intensity);
    }
    
    evaluateFunction(fnStr, x, y) {
        if (typeof fnStr === 'function') {
            return fnStr(x, y);
        }
        
        // Converte string para função
        const safeFnStr = fnStr
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/exp\(/g, 'Math.exp(')
            .replace(/log\(/g, 'Math.log(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/pow\(/g, 'Math.pow(')
            .replace(/PI/g, 'Math.PI')
            .replace(/E/g, 'Math.E');
        
        try {
            // Cria uma função segura usando eval no contexto restrito
            const fn = new Function('x', 'y', `return ${safeFnStr}`);
            return fn(x, y);
        } catch (e) {
            return 0;
        }
    }
    
    getVectorAt(x, y) {
        const gridX = Math.floor(x / this.resolution);
        const gridY = Math.floor(y / this.resolution);
        
        if (gridX >= 0 && gridX < this.grid.length && 
            gridY >= 0 && gridY < this.grid[0].length) {
            return this.grid[gridX][gridY].clone();
        }
        
        return this.calculateVector(x, y);
    }
    
    setFieldType(type) {
        this.fieldType = type;
        this.createGrid();
    }
    
    setIntensity(value) {
        this.intensity = value;
        this.createGrid();
    }
    
    setAngle(degrees) {
        this.angle = degrees * Math.PI / 180;
        this.createGrid();
    }
    
    setCustomFunctions(fnX, fnY) {
        this.customFnX = fnX;
        this.customFnY = fnY;
        this.createGrid();
    }
    
    calculateDivergence(x, y) {
        const h = 0.01;
        const v1 = this.getVectorAt(x + h, y);
        const v2 = this.getVectorAt(x - h, y);
        const v3 = this.getVectorAt(x, y + h);
        const v4 = this.getVectorAt(x, y - h);
        
        const divergence = (v1.x - v2.x) / (2 * h) + (v3.y - v4.y) / (2 * h);
        return divergence;
    }
    
    calculateCurl(x, y) {
        const h = 0.01;
        const v1 = this.getVectorAt(x, y + h);
        const v2 = this.getVectorAt(x, y - h);
        const v3 = this.getVectorAt(x + h, y);
        const v4 = this.getVectorAt(x - h, y);
        
        const curl = (v1.x - v2.x) / (2 * h) - (v3.y - v4.y) / (2 * h);
        return curl;
    }
}

class Particle {
    constructor(x, y, field) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.acceleration = new Vector2D(0, 0);
        this.field = field;
        this.size = 3;
        this.life = 300;
        this.maxLife = 300;
        this.color = '#006eff';
        this.speed = 1.0;
        this.trail = [];
        this.maxTrailLength = 20;
    }
    
    update() {
        // Obtém o vetor do campo na posição atual
        const fieldVector = this.field.getVectorAt(this.position.x, this.position.y);
        
        // Atualiza aceleração baseada no campo
        this.acceleration = fieldVector.multiply(0.1 * this.speed);
        
        // Atualiza velocidade
        this.velocity = this.velocity.add(this.acceleration);
        this.velocity = this.velocity.multiply(0.98); // Atrito
        
        // Atualiza posição
        this.position = this.position.add(this.velocity.multiply(this.speed));
        
        // Adiciona posição ao rastro
        this.trail.push({x: this.position.x, y: this.position.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Reduz vida
        this.life--;
        
        // Limites da tela
        if (this.position.x < 0 || this.position.x > this.field.width || 
            this.position.y < 0 || this.position.y > this.field.height) {
            this.life = 0;
        }
    }
    
    draw(ctx) {
        // Desenha o rastro
        ctx.save();
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const alpha = i / this.trail.length * 0.5;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * (i / this.trail.length), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`; // AZUL PARA O RASTRO
                ctx.fill();
            }
            ctx.restore();
                    
        // Desenha a partícula
       ctx.save();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`; // AZUL MAIS CLARO PARA A PARTÍCULA
        ctx.fill();
        
        // Seta indicando direção
        if (this.velocity.magnitude() > 0.1) {
            const angle = this.velocity.angle();
            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size * 0.5, this.size * 0.5);
            ctx.lineTo(-this.size * 0.5, -this.size * 0.5);
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`; // DEIXE BRANCO OU MUDE TAMBÉM
            ctx.fill();
}
        ctx.restore();
    }
    
    isAlive() {
        return this.life > 0;
    }
}

class ParticleSystem {
    constructor(field) {
        this.field = field;
        this.particles = [];
        this.maxParticles = 20;
        this.particleSize = 3;
        this.particleLife = 300;
        this.particleSpeed = 1.0;
        this.autoSpawn = true;
        this.spawnRate = 100; // ms
        this.lastSpawnTime = 0;
    }
    
    update(deltaTime) {
        // Remove partículas mortas
        this.particles = this.particles.filter(p => p.isAlive());
        
        // Atualiza partículas
        this.particles.forEach(particle => {
            particle.update();
        });
        
        // Spawn automático
        if (this.autoSpawn && Date.now() - this.lastSpawnTime > this.spawnRate) {
            this.spawnRandomParticle();
            this.lastSpawnTime = Date.now();
        }
    }
    
    spawnParticle(x, y) {
        if (this.particles.length < this.maxParticles) {
            const particle = new Particle(x, y, this.field);
            particle.size = this.particleSize;
            particle.maxLife = this.particleLife;
            particle.life = this.particleLife;
            particle.speed = this.particleSpeed;
            this.particles.push(particle);
        }
    }
    
    spawnRandomParticle() {
        const x = Math.random() * this.field.width;
        const y = Math.random() * this.field.height;
        this.spawnParticle(x, y);
    }
    
    clear() {
        this.particles = [];
    }
    
    setMaxParticles(count) {
        this.maxParticles = count;
    }
    
    setParticleSize(size) {
        this.particleSize = size;
        this.particles.forEach(p => p.size = size);
    }
    
    setParticleLife(life) {
        this.particleLife = life;
        this.particles.forEach(p => {
            p.maxLife = life;
            p.life = Math.min(p.life, life);
        });
    }
    
    setParticleSpeed(speed) {
        this.particleSpeed = speed;
        this.particles.forEach(p => p.speed = speed);
    }
    
    draw(ctx) {
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }
}

class VectorFieldVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.field = new VectorField(canvas.width, canvas.height, 25);
        this.particleSystem = new ParticleSystem(this.field);
        
        this.showVectors = true;
        this.showStreamlines = false;
        this.showDivergence = false;
        this.showCurl = false;
        this.colorByMagnitude = true;
        this.colorByDirection = false;
        this.animate = true;
        this.colorScheme = 'rainbow';
        this.showGrid = true;
        
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoverPosition = null;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.updateEquationDisplay();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;
        
        this.hoverPosition = {x, y};
        
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
        
        this.updateCoordinateDisplay(x, y);
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.scale *= zoomFactor;
        this.offsetX = mouseX - (mouseX - this.offsetX) * zoomFactor;
        this.offsetY = mouseY - (mouseY - this.offsetY) * zoomFactor;
        
        document.getElementById('scaleValue').textContent = this.scale.toFixed(1);
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;
        
        this.particleSystem.spawnParticle(x, y);
    }
    
    startAnimation() {
        if (!this.animationId) {
            this.animate = true;
            this.animationId = requestAnimationFrame(this.animateFrame.bind(this));
        }
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animateFrame(timestamp) {
        const deltaTime = timestamp - this.lastTime || 0;
        this.lastTime = timestamp;
        
        this.particleSystem.update(deltaTime);
        this.draw();
        
        if (this.animate) {
            this.animationId = requestAnimationFrame(this.animateFrame.bind(this));
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Limpa o canvas
        ctx.clearRect(0, 0, width, height);
        
        // Aplica transformações
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Desenha grade
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Desenha divergência/rotacional
        if (this.showDivergence || this.showCurl) {
            this.drawFieldProperties();
        }
        
        // Desenha vetores
        if (this.showVectors) {
            this.drawVectors();
        }
        
        // Desenha linhas de fluxo
        if (this.showStreamlines) {
            this.drawStreamlines();
        }
        
        // Desenha partículas
        this.particleSystem.draw(ctx);
        
        // Desenha indicador de posição
        if (this.hoverPosition) {
            this.drawPositionIndicator();
        }
        
        ctx.restore();
        
        // Atualiza estatísticas
        this.updateStats();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width / this.scale;
        const height = this.canvas.height / this.scale;
        const resolution = this.field.resolution;
        
        ctx.strokeStyle = 'rgba(0, 200, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = 0; x <= width; x += resolution) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = 0; y <= height; y += resolution) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }
    
    drawVectors() {
        const ctx = this.ctx;
        const cols = this.field.grid.length;
        const rows = this.field.grid[0].length;
        const resolution = this.field.resolution;
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * resolution;
                const y = j * resolution;
                const vector = this.field.grid[i][j];
                const magnitude = vector.magnitude();
                
                if (magnitude > 0.01) {
                    // Cor baseada nas opções
                    let color;
                    if (this.colorByMagnitude) {
                        color = this.getColorByMagnitude(magnitude);
                    } else if (this.colorByDirection) {
                        color = this.getColorByDirection(vector.angle());
                    } else {
                        color = '#0026ff';
                    }
                    
                    this.drawVector(x, y, vector, color, magnitude);
                }
            }
        }
    }
    
    drawVector(x, y, vector, color, magnitude) {
        const ctx = this.ctx;
        const scale = 10;
        const arrowLength = Math.min(magnitude * scale, this.field.resolution * 0.8);
        
        if (arrowLength < 2) return;
        
        const angle = vector.angle();
        const headLength = 6;
        const headAngle = Math.PI / 6;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Corpo do vetor
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowLength - headLength, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cabeça do vetor
        ctx.beginPath();
        ctx.moveTo(arrowLength - headLength, 0);
        ctx.lineTo(
            arrowLength - headLength - headLength * Math.cos(headAngle),
            headLength * Math.sin(headAngle)
        );
        ctx.lineTo(
            arrowLength - headLength - headLength * Math.cos(headAngle),
            -headLength * Math.sin(headAngle)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.restore();
    }
    
    drawStreamlines() {
        const ctx = this.ctx;
        const numLines = 20;
        const lineLength = 100;
        const stepSize = 2;
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numLines; i++) {
            // Ponto inicial aleatório
            let x = Math.random() * this.canvas.width / this.scale;
            let y = Math.random() * this.canvas.height / this.scale;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            // Segue o campo por vários passos
            for (let j = 0; j < lineLength; j++) {
                const vector = this.field.getVectorAt(x, y);
                const step = vector.normalize().multiply(stepSize);
                x += step.x;
                y += step.y;
                
                // Verifica limites
                if (x < 0 || x > this.canvas.width / this.scale || 
                    y < 0 || y > this.canvas.height / this.scale) {
                    break;
                }
                
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
    
    drawFieldProperties() {
        const ctx = this.ctx;
        const cols = Math.floor(this.canvas.width / this.scale / 20);
        const rows = Math.floor(this.canvas.height / this.scale / 20);
        
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = i * 20;
                const y = j * 20;
                
                if (this.showDivergence) {
                    const div = this.field.calculateDivergence(x, y);
                    const alpha = Math.min(Math.abs(div) * 2, 0.5);
                    const color = div > 0 ? 
                        `rgba(255, 0, 0, ${alpha})` : 
                        `rgba(0, 0, 255, ${alpha})`;
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x - 5, y - 5, 10, 10);
                }
                
                if (this.showCurl) {
                    const curl = this.field.calculateCurl(x, y);
                    const radius = Math.min(Math.abs(curl) * 10, 8);
                    const color = curl > 0 ? '#ffff00' : '#00ffff';
                    
                    ctx.beginPath();
                    ctx.arc(x + 10, y + 10, radius, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                }
            }
        }
    }
    
    drawPositionIndicator() {
        const ctx = this.ctx;
        const {x, y} = this.hoverPosition;
        const vector = this.field.getVectorAt(x, y);
        
        // Círculo na posição
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        // Linha para o vetor
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vector.x * 20, y + vector.y * 20);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    getColorByMagnitude(magnitude) {
        const maxMagnitude = 2;
        const normalized = Math.min(magnitude / maxMagnitude, 1);
        
        switch(this.colorScheme) {
            case 'rainbow':
                const hue = (1 - normalized) * 240; // Azul (baixa) -> Vermelho (alta)
                return `hsl(${hue}, 100%, 50%)`;
                
            case 'heat':
                const r = Math.min(normalized * 2, 1);
                const g = Math.min((normalized - 0.5) * 2, 1);
                const b = 0;
                return `rgb(${r * 255}, ${g * 255}, ${b})`;
                
            case 'cool':
                const r2 = 0;
                const g2 = Math.min(normalized * 2, 1);
                const b2 = Math.min((normalized - 0.5) * 2, 1);
                return `rgb(${r2}, ${g2 * 255}, ${b2 * 255})`;
                
            case 'viridis':
                // Aproximação do Viridis
                const colors = [
                    [68, 1, 84],
                    [72, 40, 120],
                    [62, 74, 137],
                    [49, 104, 142],
                    [38, 130, 142],
                    [31, 158, 137],
                    [53, 183, 121],
                    [109, 205, 89],
                    [181, 222, 43],
                    [253, 231, 37]
                ];
                const index = Math.floor(normalized * (colors.length - 1));
                const [r3, g3, b3] = colors[index];
                return `rgb(${r3}, ${g3}, ${b3})`;
                
            case 'plasma':
                // Aproximação do Plasma
                const colors2 = [
                    [13, 8, 135],
                    [84, 2, 163],
                    [139, 10, 165],
                    [185, 50, 137],
                    [219, 92, 104],
                    [244, 136, 73],
                    [254, 188, 43],
                    [240, 249, 33]
                ];
                const index2 = Math.floor(normalized * (colors2.length - 1));
                const [r4, g4, b4] = colors2[index2];
                return `rgb(${r4}, ${g4}, ${b4})`;
                
            case 'hacker':
                const intensity = Math.floor(normalized * 255);
                return `rgb(0, ${intensity}, 0)`;
                
            default:
                  return `rgb(100, 150, ${blueValue})`; // AZUL GRADIENTE
        }
    }
    
    getColorByDirection(angle) {
        const normalized = (angle + Math.PI) / (2 * Math.PI); // Normaliza para 0-1
        const hue = normalized * 360;
        return `hsl(${hue}, 100%, 50%)`;
    }
    
    updateStats() {
        // Atualiza contagem de partículas
        const particleCount = this.particleSystem.particles.length;
        document.getElementById('particleCount').textContent = particleCount;
        
        // Atualiza velocidade
        document.getElementById('speedValue').textContent = this.particleSystem.particleSpeed.toFixed(1);
        
        // Calcula propriedades do campo
        let totalMagnitude = 0;
        let sampleCount = 0;
        
        for (let i = 0; i < this.field.grid.length; i++) {
            for (let j = 0; j < this.field.grid[0].length; j++) {
                totalMagnitude += this.field.grid[i][j].magnitude();
                sampleCount++;
            }
        }
        
        const avgMagnitude = totalMagnitude / sampleCount;
        document.getElementById('avgMagnitude').textContent = avgMagnitude.toFixed(2);
        
        // Calcula divergência e rotacional no centro
        const centerX = this.canvas.width / (2 * this.scale);
        const centerY = this.canvas.height / (2 * this.scale);
        const divergence = this.field.calculateDivergence(centerX, centerY);
        const curl = this.field.calculateCurl(centerX, centerY);
        
        document.getElementById('divergence').textContent = divergence.toFixed(2);
        document.getElementById('curl').textContent = curl.toFixed(2);
    }
    
    updateCoordinateDisplay(x, y) {
        const vector = this.field.getVectorAt(x, y);
        const magnitude = vector.magnitude();
        const angle = vector.angle() * 180 / Math.PI;
        
        document.getElementById('positionCoords').textContent = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
        document.getElementById('vectorValue').textContent = vector.toString();
        document.getElementById('vectorMagnitude').textContent = magnitude.toFixed(2);
        document.getElementById('vectorDirection').textContent = `${angle.toFixed(2)}°`;
    }
    
    updateEquationDisplay() {
        let equation = '';
        
        switch(this.field.fieldType) {
            case 'uniform':
                const angleDeg = this.field.angle * 180 / Math.PI;
                equation = `F(x,y) = (${Math.cos(this.field.angle).toFixed(2)}, ${Math.sin(this.field.angle).toFixed(2)})`;
                break;
                
            case 'radial':
                equation = 'F(x,y) = (x, y) / |(x,y)|';
                break;
                
            case 'vortex':
                equation = 'F(x,y) = (-y, x)';
                break;
                
            case 'sink':
                equation = 'F(x,y) = (-x, -y)';
                break;
                
            case 'source':
                equation = 'F(x,y) = (x, y)';
                break;
                
            case 'shear':
                equation = 'F(x,y) = (sin(2πy), 0)';
                break;
                
            case 'gradient':
                equation = 'F(x,y) = ∇(x² + y²) = (2x, 2y)';
                break;
                
            case 'custom':
                const fnX = typeof this.field.customFnX === 'function' ? 'f(x,y)' : this.field.customFnX;
                const fnY = typeof this.field.customFnY === 'function' ? 'g(x,y)' : this.field.customFnY;
                equation = `F(x,y) = (${fnX}, ${fnY})`;
                break;
        }
        
        document.getElementById('fieldEquation').innerHTML = `<p>${equation}</p>`;
    }
    
    updateFieldDescription() {
        const description = document.getElementById('fieldDescription');
        let text = '';
        
        switch(this.field.fieldType) {
            case 'uniform':
                text = `
                    <p><strong>Campo Uniforme</strong>: Vetores com direção e magnitude constantes em todo o espaço.</p>
                    <p><strong>Aplicações</strong>: Campo elétrico uniforme, gravidade próximo à superfície, escoamento uniforme.</p>
                    <p><strong>Propriedades</strong>: Divergência zero, rotacional zero.</p>
                `;
                break;
                
            case 'radial':
                text = `
                    <p><strong>Campo Radial</strong>: Vetores apontando para fora do centro, com magnitude proporcional à distância.</p>
                    <p><strong>Aplicações</strong>: Campo elétrico de carga pontual, fonte isotrópica, explosão.</p>
                    <p><strong>Propriedades</strong>: Divergência positiva, rotacional zero.</p>
                `;
                break;
                
            case 'vortex':
                text = `
                    <p><strong>Campo de Vórtice</strong>: Vetores girando ao redor do centro, formando círculos concêntricos.</p>
                    <p><strong>Aplicações</strong>: Escoamento rotacional, campo magnético ao redor de fio, redemoinho.</p>
                    <p><strong>Propriedades</strong>: Divergência zero, rotacional positivo.</p>
                `;
                break;
                
            case 'gradient':
                text = `
                    <p><strong>Campo Gradiente</strong>: Direção de maior crescimento de uma função escalar.</p>
                    <p><strong>Aplicações</strong>: Campos conservativos, linhas equipotenciais, otimização.</p>
                    <p><strong>Propriedades</strong>: Rotacional zero (campo irrotacional).</p>
                `;
                break;
                
            default:
                text = `<p>Campo vetorial selecionado: ${this.field.fieldType}</p>`;
        }
        
        if (description) {
            description.innerHTML = text;
        }
    }
}

// Variáveis globais
let visualizer;
let canvas;

// Inicialização
function init() {
    canvas = document.getElementById('vectorFieldCanvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    // Configura canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Cria visualizador
    visualizer = new VectorFieldVisualizer(canvas);
    
    // Configura eventos
    setupEventListeners();
    
    // Inicia animação
    visualizer.startAnimation();
    
    // Atualiza descrição inicial
    visualizer.updateFieldDescription();
    
    console.log('Sistema de campos vetoriais inicializado!');
}

function resizeCanvas() {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    if (visualizer) {
        visualizer.field.width = canvas.width;
        visualizer.field.height = canvas.height;
        visualizer.field.createGrid();
    }
}

function setupEventListeners() {
    // Botões de tipo de campo
    document.querySelectorAll('.btn-field').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-field').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const fieldType = this.dataset.field;
            visualizer.field.setFieldType(fieldType);
            visualizer.updateEquationDisplay();
            visualizer.updateFieldDescription();
            
            // Mostra/oculta controles customizados
            const customGroup = document.getElementById('customFieldGroup');
            if (customGroup) {
                customGroup.style.display = fieldType === 'custom' ? 'block' : 'none';
            }
            
            console.log(`Campo alterado para: ${fieldType}`);
        });
    });
    
    // Controles de intensidade e ângulo
    const intensitySlider = document.getElementById('fieldIntensity');
    const angleSlider = document.getElementById('fieldAngle');
    
    if (intensitySlider) {
        intensitySlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            visualizer.field.setIntensity(value);
            document.getElementById('intensityValue').textContent = value.toFixed(1);
        });
    }
    
    if (angleSlider) {
        angleSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            visualizer.field.setAngle(value);
            document.getElementById('angleValue').textContent = `${value}°`;
        });
    }
    
    // Controles customizados
    const customFieldX = document.getElementById('customFieldX');
    const customFieldY = document.getElementById('customFieldY');
    
    if (customFieldX && customFieldY) {
        const updateCustomField = () => {
            const fnX = customFieldX.value || '0';
            const fnY = customFieldY.value || '0';
            visualizer.field.setCustomFunctions(fnX, fnY);
            visualizer.updateEquationDisplay();
        };
        
        customFieldX.addEventListener('input', updateCustomField);
        customFieldY.addEventListener('input', updateCustomField);
    }
    
    // Controles de visualização
    const showVectors = document.getElementById('showVectors');
    const showStreamlines = document.getElementById('showStreamlines');
    const showDivergence = document.getElementById('showDivergence');
    const showCurl = document.getElementById('showCurl');
    const colorByMagnitude = document.getElementById('colorByMagnitude');
    const colorByDirection = document.getElementById('colorByDirection');
    const animateField = document.getElementById('animateField');
    const colorScheme = document.getElementById('colorScheme');
    
    if (showVectors) {
        showVectors.addEventListener('change', function() {
            visualizer.showVectors = this.checked;
        });
    }
    
    if (showStreamlines) {
        showStreamlines.addEventListener('change', function() {
            visualizer.showStreamlines = this.checked;
        });
    }
    
    if (showDivergence) {
        showDivergence.addEventListener('change', function() {
            visualizer.showDivergence = this.checked;
        });
    }
    
    if (showCurl) {
        showCurl.addEventListener('change', function() {
            visualizer.showCurl = this.checked;
        });
    }
    
    if (colorByMagnitude) {
        colorByMagnitude.addEventListener('change', function() {
            visualizer.colorByMagnitude = this.checked;
            if (this.checked && colorByDirection) {
                colorByDirection.checked = false;
                visualizer.colorByDirection = false;
            }
        });
    }
    
    if (colorByDirection) {
        colorByDirection.addEventListener('change', function() {
            visualizer.colorByDirection = this.checked;
            if (this.checked && colorByMagnitude) {
                colorByMagnitude.checked = false;
                visualizer.colorByMagnitude = false;
            }
        });
    }
    
    if (animateField) {
        animateField.addEventListener('change', function() {
            visualizer.animate = this.checked;
            if (this.checked) {
                visualizer.startAnimation();
            } else {
                visualizer.stopAnimation();
            }
        });
    }
    
    if (colorScheme) {
        colorScheme.addEventListener('change', function() {
            visualizer.colorScheme = this.value;
        });
    }
    
    // Controles de partículas
    const particleCountSlider = document.getElementById('particleCountSlider');
    const particleSizeSlider = document.getElementById('particleSizeSlider');
    const particleLifeSlider = document.getElementById('particleLifeSlider');
    const particleSpeedSlider = document.getElementById('particleSpeedSlider');
    
    if (particleCountSlider) {
        particleCountSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            visualizer.particleSystem.setMaxParticles(value);
            document.getElementById('particleCountDisplay').textContent = value;
        });
    }
    
    if (particleSizeSlider) {
        particleSizeSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            visualizer.particleSystem.setParticleSize(value);
            document.getElementById('particleSizeDisplay').textContent = value;
        });
    }
    
    if (particleLifeSlider) {
        particleLifeSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            visualizer.particleSystem.setParticleLife(value);
            document.getElementById('particleLifeDisplay').textContent = value;
        });
    }
    
    if (particleSpeedSlider) {
        particleSpeedSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            visualizer.particleSystem.setParticleSpeed(value);
            document.getElementById('particleSpeedDisplay').textContent = value.toFixed(1);
        });
    }
    
    // Botões de execução
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const toggleGridBtn = document.getElementById('toggleGridBtn');
    const toggleParticlesBtn = document.getElementById('toggleParticlesBtn');
    const clearParticlesBtn = document.getElementById('clearParticlesBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            visualizer.animate = true;
            visualizer.startAnimation();
            if (animateField) animateField.checked = true;
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            visualizer.animate = false;
            visualizer.stopAnimation();
            if (animateField) animateField.checked = false;
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            visualizer.scale = 1.0;
            visualizer.offsetX = 0;
            visualizer.offsetY = 0;
            visualizer.particleSystem.clear();
            document.getElementById('scaleValue').textContent = '1.0';
            console.log('Visualização resetada');
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportFieldData();
        });
    }
    
    if (toggleGridBtn) {
        toggleGridBtn.addEventListener('click', () => {
            visualizer.showGrid = !visualizer.showGrid;
            toggleGridBtn.innerHTML = visualizer.showGrid ? 
                '<i class="fas fa-th"></i> Ocultar Grade' : 
                '<i class="fas fa-th"></i> Mostrar Grade';
        });
    }
    
    if (toggleParticlesBtn) {
        toggleParticlesBtn.addEventListener('click', () => {
            visualizer.particleSystem.autoSpawn = !visualizer.particleSystem.autoSpawn;
            toggleParticlesBtn.innerHTML = visualizer.particleSystem.autoSpawn ?
                '<i class="fas fa-circle"></i> Parar Partículas' :
                '<i class="fas fa-circle"></i> Iniciar Partículas';
        });
    }
    
    if (clearParticlesBtn) {
        clearParticlesBtn.addEventListener('click', () => {
            visualizer.particleSystem.clear();
            console.log('Partículas removidas');
        });
    }
}

function exportFieldData() {
    const data = {
        fieldType: visualizer.field.fieldType,
        intensity: visualizer.field.intensity,
        angle: visualizer.field.angle * 180 / Math.PI,
        timestamp: new Date().toISOString(),
        properties: {
            divergence: document.getElementById('divergence').textContent,
            curl: document.getElementById('curl').textContent,
            avgMagnitude: document.getElementById('avgMagnitude').textContent
        }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-field-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Dados do campo exportados');
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);