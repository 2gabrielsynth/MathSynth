// Configuração dos canvases
const timeCanvas = document.getElementById('time-domain');
const freqCanvas = document.getElementById('frequency-domain');
const circlesCanvas = document.getElementById('fourier-circles');

const timeCtx = timeCanvas.getContext('2d');
const freqCtx = freqCanvas.getContext('2d');
const circlesCtx = circlesCanvas.getContext('2d');

// Ajusta o tamanho dos canvases para alta resolução
function resizeCanvases() {
    const containers = document.querySelectorAll('.canvas-container');
    
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        const containerWidth = container.clientWidth;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = containerWidth * dpr;
        canvas.height = 250 * dpr;
        
        // Ajusta o contexto para o DPI
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = '250px';
    });
}

// Variáveis de controle
let signalType = 'sine';
let frequency = 3.0;
let harmonics = 5;
let animationSpeed = 5;
let isPlaying = true;
let time = 0;

// Elementos da interface
const signalTypeSelect = document.getElementById('signal-type');
const frequencySlider = document.getElementById('frequency');
const frequencyValue = document.getElementById('frequency-value');
const harmonicsSlider = document.getElementById('harmonics');
const harmonicsValue = document.getElementById('harmonics-value');
const speedSlider = document.getElementById('animation-speed');
const speedValue = document.getElementById('speed-value');
const playPauseBtn = document.getElementById('play-pause');
const resetBtn = document.getElementById('reset');

// Inicialização
function init() {
    resizeCanvases();
    setupEventListeners();
    draw();
}

// Configura os listeners de eventos
function setupEventListeners() {
    signalTypeSelect.addEventListener('change', () => {
        signalType = signalTypeSelect.value;
    });
    
    frequencySlider.addEventListener('input', () => {
        frequency = parseFloat(frequencySlider.value);
        frequencyValue.textContent = frequency.toFixed(1) + ' Hz';
    });
    
    harmonicsSlider.addEventListener('input', () => {
        harmonics = parseInt(harmonicsSlider.value);
        harmonicsValue.textContent = harmonics;
    });
    
    speedSlider.addEventListener('input', () => {
        animationSpeed = parseInt(speedSlider.value);
        speedValue.textContent = animationSpeed;
    });
    
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i> Pausar' : 
            '<i class="fas fa-play"></i> Reproduzir';
    });
    
    resetBtn.addEventListener('click', () => {
        time = 0;
        signalTypeSelect.value = 'sine';
        signalType = 'sine';
        frequencySlider.value = 3.0;
        frequency = 3.0;
        frequencyValue.textContent = '3.0 Hz';
        harmonicsSlider.value = 5;
        harmonics = 5;
        harmonicsValue.textContent = '5';
        speedSlider.value = 5;
        animationSpeed = 5;
        speedValue.textContent = '5';
        isPlaying = true;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    });
    
    window.addEventListener('resize', resizeCanvases);
}

// Gera o sinal baseado no tipo selecionado
function generateSignal(t, type, freq) {
    switch(type) {
        case 'sine':
            return Math.sin(2 * Math.PI * freq * t);
            
        case 'square':
            let sum = 0;
            for (let n = 1; n <= harmonics; n += 2) {
                sum += Math.sin(2 * Math.PI * n * freq * t) / n;
            }
            return (4 / Math.PI) * sum;
            
        case 'triangle':
            let triSum = 0;
            for (let n = 1; n <= harmonics; n += 2) {
                triSum += Math.pow(-1, (n - 1) / 2) * Math.sin(2 * Math.PI * n * freq * t) / (n * n);
            }
            return (8 / (Math.PI * Math.PI)) * triSum;
            
        case 'sawtooth':
            let sawSum = 0;
            for (let n = 1; n <= harmonics; n++) {
                sawSum += Math.sin(2 * Math.PI * n * freq * t) / n;
            }
            return 0.5 - (1 / Math.PI) * sawSum;
            
        case 'composite':
            return 0.5 * Math.sin(2 * Math.PI * freq * t) + 
                   0.3 * Math.sin(2 * Math.PI * 2 * freq * t + 0.5) + 
                   0.2 * Math.sin(2 * Math.PI * 3 * freq * t + 1.0);
            
        case 'custom':
            return Math.sin(2 * Math.PI * freq * t) + 
                   0.5 * Math.sin(2 * Math.PI * 2.5 * freq * t + 0.7) + 
                   0.3 * Math.sin(2 * Math.PI * 4 * freq * t + 1.2);
            
        default:
            return Math.sin(2 * Math.PI * freq * t);
    }
}

// Calcula os coeficientes de Fourier para o espectro
function calculateFourierCoefficients(type, freq, numHarmonics) {
    const coeffs = [];
    
    // Coeficiente DC (componente constante)
    coeffs.push({ freq: 0, amp: 0 });
    
    // Para sinais senoidais simples, apenas o primeiro harmônico
    if (type === 'sine') {
        coeffs.push({ freq: freq, amp: 1 });
        return coeffs;
    }
    
    // Para outros tipos de sinais, calcular múltiplos harmônicos
    for (let n = 1; n <= numHarmonics; n++) {
        let amplitude = 0;
        
        switch(type) {
            case 'square':
                if (n % 2 === 1) amplitude = 4 / (Math.PI * n);
                break;
                
            case 'triangle':
                if (n % 2 === 1) amplitude = 8 / (Math.PI * Math.PI * n * n);
                break;
                
            case 'sawtooth':
                amplitude = 2 / (Math.PI * n);
                break;
                
            case 'composite':
                if (n === 1) amplitude = 0.5;
                else if (n === 2) amplitude = 0.3;
                else if (n === 3) amplitude = 0.2;
                break;
                
            case 'custom':
                if (n === 1) amplitude = 1;
                else if (n === 2) amplitude = 0.5;
                else if (n === 3) amplitude = 0.3;
                break;
        }
        
        coeffs.push({ freq: n * freq, amp: amplitude });
    }
    
    return coeffs;
}

// Desenha o sinal no domínio do tempo
function drawTimeDomain() {
    const width = timeCanvas.width / (window.devicePixelRatio || 1);
    const height = timeCanvas.height / (window.devicePixelRatio || 1);
    
    // Limpa o canvas
    timeCtx.clearRect(0, 0, width, height);
    
    // Desenha a grade
    drawGrid(timeCtx, width, height);
    
    // Configura o estilo da linha
    timeCtx.strokeStyle = '#6ee7ff';
    timeCtx.lineWidth = 3;
    timeCtx.beginPath();
    
    // Desenha o sinal
    const samples = 500;
    for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * width;
        const t = time + (i / samples) * 2; // 2 segundos de visualização
        const y = height/2 - generateSignal(t, signalType, frequency) * (height/3);
        
        if (i === 0) {
            timeCtx.moveTo(x, y);
        } else {
            timeCtx.lineTo(x, y);
        }
    }
    
    timeCtx.stroke();
    
    // Desenha o eixo do tempo
    timeCtx.strokeStyle = '#a0a0ff';
    timeCtx.lineWidth = 1;
    timeCtx.beginPath();
    timeCtx.moveTo(0, height/2);
    timeCtx.lineTo(width, height/2);
    timeCtx.stroke();
    
    // Rótulos
    timeCtx.fillStyle = '#e0e0ff';
    timeCtx.font = '14px "Source Code Pro", monospace';
    timeCtx.fillText('Tempo (s)', width - 80, height - 10);
    timeCtx.fillText('Amplitude', 10, 20);
    
    // Marcas de tempo
    for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * width;
        timeCtx.beginPath();
        timeCtx.moveTo(x, height/2 - 5);
        timeCtx.lineTo(x, height/2 + 5);
        timeCtx.stroke();
        
        timeCtx.fillText(i/2 + 's', x - 10, height/2 + 20);
    }
}

// Desenha o espectro de frequências
function drawFrequencyDomain() {
    const width = freqCanvas.width / (window.devicePixelRatio || 1);
    const height = freqCanvas.height / (window.devicePixelRatio || 1);
    
    // Limpa o canvas
    freqCtx.clearRect(0, 0, width, height);
    
    // Desenha a grade
    drawGrid(freqCtx, width, height);
    
    // Calcula os coeficientes de Fourier
    const coeffs = calculateFourierCoefficients(signalType, frequency, harmonics);
    
    // Desenha as barras do espectro
    const barWidth = width / (coeffs.length + 1);
    const maxAmp = Math.max(...coeffs.map(c => Math.abs(c.amp)), 1);
    
    for (let i = 0; i < coeffs.length; i++) {
        const coeff = coeffs[i];
        const x = (i + 1) * barWidth;
        const barHeight = (coeff.amp / maxAmp) * (height * 0.7);
        
        // Desenha a barra
        freqCtx.fillStyle = '#495bff';
        freqCtx.fillRect(x - barWidth/2, height - barHeight - 30, barWidth * 0.8, barHeight);
        
        // Desenha a linha de frequência
        freqCtx.fillStyle = '#a0a0ff';
        freqCtx.font = '12px "Source Code Pro", monospace';
        freqCtx.textAlign = 'center';
        freqCtx.fillText(coeff.freq.toFixed(1) + ' Hz', x, height - 10);
        
        // Desenha o valor da amplitude
        freqCtx.fillStyle = '#6ee7ff';
        freqCtx.fillText(coeff.amp.toFixed(2), x, height - barHeight - 35);
    }
    
    // Rótulos
    freqCtx.fillStyle = '#e0e0ff';
    freqCtx.font = '14px "Source Code Pro", monospace';
    freqCtx.textAlign = 'left';
    freqCtx.fillText('Espectro de Frequências', 10, 20);
    freqCtx.fillText('Frequência (Hz)', width - 100, height - 10);
}

// Desenha os círculos de Fourier
function drawFourierCircles() {
    const width = circlesCanvas.width / (window.devicePixelRatio || 1);
    const height = circlesCanvas.height / (window.devicePixelRatio || 1);
    
    // Limpa o canvas
    circlesCtx.clearRect(0, 0, width, height);
    
    // Desenha a grade
    drawGrid(circlesCtx, width, height);
    
    // Calcula os coeficientes de Fourier
    const coeffs = calculateFourierCoefficients(signalType, frequency, harmonics);
    
    // Configura o ponto de partida (centro dos círculos)
    let x = width * 0.3;
    let y = height / 2;
    
    // Array para armazenar o caminho do ponto final
    const path = [];
    
    // Desenha cada círculo de Fourier
    for (let i = 0; i < coeffs.length; i++) {
        const coeff = coeffs[i];
        if (coeff.amp === 0) continue;
        
        const radius = coeff.amp * 100;
        const angle = 2 * Math.PI * coeff.freq * time;
        
        // Desenha o círculo (apenas para visualização)
        circlesCtx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
        circlesCtx.lineWidth = 1;
        circlesCtx.beginPath();
        circlesCtx.arc(x, y, radius, 0, 2 * Math.PI);
        circlesCtx.stroke();
        
        // Calcula o ponto na circunferência
        const pointX = x + radius * Math.cos(angle);
        const pointY = y + radius * Math.sin(angle);
        
        // Desenha a linha do centro ao ponto
        circlesCtx.strokeStyle = 'rgba(110, 231, 255, 0.7)';
        circlesCtx.lineWidth = 2;
        circlesCtx.beginPath();
        circlesCtx.moveTo(x, y);
        circlesCtx.lineTo(pointX, pointY);
        circlesCtx.stroke();
        
        // Atualiza o centro para o próximo círculo
        x = pointX;
        y = pointY;
        
        // Armazena o ponto para desenhar o caminho
        if (i === coeffs.length - 1) {
            path.push({x: pointX, y: pointY});
        }
    }
    
    // Desenha o ponto final
    circlesCtx.fillStyle = '#ff3434';
    circlesCtx.beginPath();
    circlesCtx.arc(x, y, 6, 0, 2 * Math.PI);
    circlesCtx.fill();
    
    // Desenha a linha para o gráfico de tempo reconstruído
    circlesCtx.strokeStyle = '#6ee7ff';
    circlesCtx.lineWidth = 2;
    circlesCtx.beginPath();
    circlesCtx.moveTo(x, y);
    circlesCtx.lineTo(width * 0.7, y);
    circlesCtx.stroke();
    
    // Desenha o sinal reconstruído a partir dos círculos
    circlesCtx.strokeStyle = '#cfcfcf';
    circlesCtx.lineWidth = 2;
    circlesCtx.beginPath();
    
    const samples = 200;
    for (let i = 0; i <= samples; i++) {
        const graphX = width * 0.7 + (i / samples) * (width * 0.25);
        const t = time + (i / samples) * 2; // 2 segundos de visualização
        
        // Reconstroi o sinal a partir dos coeficientes de Fourier
        let signalY = height/2;
        for (let j = 0; j < coeffs.length; j++) {
            const coeff = coeffs[j];
            if (coeff.amp === 0) continue;
            
            signalY -= coeff.amp * 100 * Math.sin(2 * Math.PI * coeff.freq * t);
        }
        
        if (i === 0) {
            circlesCtx.moveTo(graphX, signalY);
        } else {
            circlesCtx.lineTo(graphX, signalY);
        }
    }
    
    circlesCtx.stroke();
    
    // Rótulos
    circlesCtx.fillStyle = '#e0e0ff';
    circlesCtx.font = '14px "Source Code Pro", monospace';
    circlesCtx.fillText('Círculos de Fourier', 10, 20);
    circlesCtx.fillText('Sinal Reconstruído', width * 0.7, 20);
}

// Função auxiliar para desenhar grade nos canvases
function drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Linhas verticais
    for (let x = 0; x <= width; x += width / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Linhas horizontais
    for (let y = 0; y <= height; y += height / 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// Loop de animação principal
function draw() {
    if (isPlaying) {
        time += 0.01 * (animationSpeed / 5);
    }
    
    drawTimeDomain();
    drawFrequencyDomain();
    drawFourierCircles();
    
    requestAnimationFrame(draw);
}
// Adicione estas funções ao final do arquivo fourier.js existente

// Efeito de glitch aleatório nos canvases
function applyGlitchEffect() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        if (Math.random() > 0.95) { // 5% de chance de glitch
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Desloca alguns pixels aleatoriamente
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() > 0.99) {
                    data[i] = 255; // Vermelho
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Remove o glitch após 100ms
            setTimeout(() => {
                draw(); // Redesenha o canvas normal
            }, 100);
        }
    });
}

// Adiciona texto de terminal em tempo real
function addTerminalText() {
    const terminalText = [
        "INITIALIZING FOURIER TRANSFORM VISUALIZER...",
        "LOADING SIGNAL PROCESSING MODULES...",
        "CALIBRATING FREQUENCY DOMAIN ANALYZER...",
        "SYSTEM STATUS: ONLINE",
        "READY FOR USER INPUT"
    ];
    
    const terminalElement = document.createElement('div');
    terminalElement.className = 'terminal-output';
    terminalElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: rgba(0, 10, 0, 0.9);
        border: 1px solid #00ff00;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #00ff00;
        z-index: 1000;
        opacity: 0.8;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    `;
    
    document.body.appendChild(terminalElement);
    
    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = '';
    
    function typeLine() {
        if (lineIndex < terminalText.length) {
            if (charIndex < terminalText[lineIndex].length) {
                currentLine += terminalText[lineIndex].charAt(charIndex);
                terminalElement.innerHTML = currentLine + '<span class="cursor">|</span>';
                charIndex++;
                setTimeout(typeLine, 50);
            } else {
                currentLine += '<br>';
                charIndex = 0;
                lineIndex++;
                setTimeout(typeLine, 500);
            }
        }
    }
    
    typeLine();
}

// Efeito de digitação nos títulos
function typeWriterEffect() {
    const titles = document.querySelectorAll('h1, h2, h3');
    titles.forEach(title => {
        const originalText = title.textContent;
        title.textContent = '';
        
        let i = 0;
        function typeChar() {
            if (i < originalText.length) {
                title.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeChar, 50);
            }
        }
        
        // Inicia após um delay aleatório
        setTimeout(typeChar, Math.random() * 1000);
    });
}

// Modifique a função draw() para incluir efeitos de glitch
const originalDraw = draw;
function enhancedDraw() {
    originalDraw();
    applyGlitchEffect();
    
    // Atualiza o texto do terminal
    updateTerminalStats();
}

// Substitui a chamada original
// requestAnimationFrame(draw);
// por:
// requestAnimationFrame(enhancedDraw);

// Atualiza estatísticas no terminal
function updateTerminalStats() {
    const terminalElement = document.querySelector('.terminal-output');
    if (terminalElement) {
        const stats = [
            `FREQ: ${frequency.toFixed(2)}Hz`,
            `HARMONICS: ${harmonics}`,
            `SIGNAL: ${signalType.toUpperCase()}`,
            `TIME: ${time.toFixed(2)}s`,
            `STATUS: ${isPlaying ? 'RUNNING' : 'PAUSED'}`
        ];
        
        terminalElement.innerHTML = stats.join('<br>') + '<br><span class="cursor">_</span>';
    }
}

// Adiciona efeitos de partículas
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particlesContainer);
    
    // Cria partículas
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: #00ff00;
            border-radius: 50%;
            opacity: ${Math.random() * 0.5 + 0.1};
            box-shadow: 0 0 5px #00ff00;
        `;
        
        // Posição inicial aleatória
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        
        particlesContainer.appendChild(particle);
        
        // Anima a partícula
        animateParticle(particle);
    }
}

function animateParticle(particle) {
    let x = parseFloat(particle.style.left);
    let y = parseFloat(particle.style.top);
    let speedX = (Math.random() - 0.5) * 0.5;
    let speedY = (Math.random() - 0.5) * 0.5;
    
    function move() {
        x += speedX;
        y += speedY;
        
        // Rebate nas bordas
        if (x <= 0 || x >= 100) speedX = -speedX;
        if (y <= 0 || y >= 100) speedY = -speedY;
        
        particle.style.left = `${x}vw`;
        particle.style.top = `${y}vh`;
        
        requestAnimationFrame(move);
    }
    
    move();
}

// Modifique a função init() para incluir os novos efeitos
function init() {
    resizeCanvases();
    setupEventListeners();
    addTerminalText();
    createParticles();
    // typeWriterEffect(); // Descomente se quiser o efeito de digitação
    
    // Substitua a chamada original
    // draw();
    // por:
    enhancedDraw();
}

// Inicializa a aplicação quando a página carrega
window.addEventListener('load', init);