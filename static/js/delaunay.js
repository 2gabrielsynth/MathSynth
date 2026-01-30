// Delaunay.js - Lógica para Triangulação de Delaunay

class Delaunay {
    constructor() {
        this.points = [];
        this.triangles = [];
        this.superTriangle = null;
        this.edges = [];
        this.convexHull = [];
        this.voronoiDiagram = null;
        
        // Configurações de visualização
        this.showTriangles = true;
        this.showCircumcircles = false;
        this.showPoints = true;
        this.showVoronoi = false;
        this.showConvexHull = true;
        this.showAngles = false;
        this.showGrid = true;
        this.showIndexes = false;
        this.animateFlips = false;
        
        // Estado do algoritmo
        this.algorithm = 'bowyerWatson';
        this.speed = 30;
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.animationId = null;
        
        // Estatísticas
        this.totalFlips = 0;
        this.minAngle = 0;
        this.calcTime = 0;
        
        // Cores para visualização
        this.colors = [
            '#4361ee', '#4cc9f0', '#4ade80', '#f72585', '#ff9100',
            '#7209b7', '#3a0ca3', '#f15bb5', '#00bbf9', '#00f5d4'
        ];
    }

    // Métodos matemáticos básicos
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceSquared(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return dx * dx + dy * dy;
    }

    static orientation(a, b, c) {
        const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
        if (Math.abs(val) < 1e-10) return 0; // Colinear
        return val > 0 ? 1 : -1; // CW : CCW
    }

    static triangleArea(a, b, c) {
        return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
    }

    // Verificar se ponto está dentro do círculo circunscrito
    static pointInCircumcircle(a, b, c, p) {
        // Usando determinantes (mais estável numericamente)
        const d = [
            [a.x - p.x, a.y - p.y, (a.x - p.x) ** 2 + (a.y - p.y) ** 2],
            [b.x - p.x, b.y - p.y, (b.x - p.x) ** 2 + (b.y - p.y) ** 2],
            [c.x - p.x, c.y - p.y, (c.x - p.x) ** 2 + (c.y - p.y) ** 2]
        ];
        
        const det = 
            d[0][0] * (d[1][1] * d[2][2] - d[2][1] * d[1][2]) -
            d[0][1] * (d[1][0] * d[2][2] - d[2][0] * d[1][2]) +
            d[0][2] * (d[1][0] * d[2][1] - d[2][0] * d[1][1]);
        
        return det > 0;
    }

    // Calcular circuncentro e raio
    static circumcircle(a, b, c) {
        const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
        
        if (Math.abs(d) < 1e-10) {
            return null; // Pontos colineares
        }
        
        const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) +
                   (b.x * b.x + b.y * b.y) * (c.y - a.y) +
                   (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
        
        const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) +
                   (b.x * b.x + b.y * b.y) * (a.x - c.x) +
                   (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
        
        const radius = Math.sqrt((a.x - ux) ** 2 + (a.y - uy) ** 2);
        
        return {
            center: { x: ux, y: uy },
            radius: radius
        };
    }

    // Calcular ângulos de um triângulo
    static triangleAngles(a, b, c) {
        const sideA = Delaunay.distance(b, c);
        const sideB = Delaunay.distance(a, c);
        const sideC = Delaunay.distance(a, b);
        
        // Lei dos cossenos
        const angleA = Math.acos((sideB * sideB + sideC * sideC - sideA * sideA) / 
                                 (2 * sideB * sideC)) * (180 / Math.PI);
        const angleB = Math.acos((sideA * sideA + sideC * sideC - sideB * sideB) / 
                                 (2 * sideA * sideC)) * (180 / Math.PI);
        const angleC = 180 - angleA - angleB;
        
        return {
            A: angleA,
            B: angleB,
            C: angleC,
            min: Math.min(angleA, angleB, angleC)
        };
    }

    // Algoritmo de Bowyer-Watson (Incremental)
    computeBowyerWatson(points) {
        this.triangles = [];
        
        if (points.length < 3) return this.triangles;
        
        // Criar super triângulo que contém todos os pontos
        const superTriangle = this.createSuperTriangle(points);
        this.superTriangle = superTriangle;
        this.triangles.push(superTriangle);
        
        // Adicionar pontos um por um
        for (const point of points) {
            const badTriangles = [];
            
            // Encontrar todos os triângulos cujo círculo circunscrito contém o ponto
            for (const triangle of this.triangles) {
                if (Delaunay.pointInCircumcircle(
                    triangle.a, triangle.b, triangle.c, point)) {
                    badTriangles.push(triangle);
                }
            }
            
            // Encontrar a fronteira do polígono formado pelos triângulos ruins
            const polygonEdges = [];
            for (const triangle of badTriangles) {
                const edges = [
                    [triangle.a, triangle.b],
                    [triangle.b, triangle.c],
                    [triangle.c, triangle.a]
                ];
                
                for (const edge of edges) {
                    // Verificar se a aresta é compartilhada com outro triângulo ruim
                    const isShared = badTriangles.some(otherTriangle => {
                        if (otherTriangle === triangle) return false;
                        const otherEdges = [
                            [otherTriangle.a, otherTriangle.b],
                            [otherTriangle.b, otherTriangle.c],
                            [otherTriangle.c, otherTriangle.a]
                        ];
                        return otherEdges.some(otherEdge =>
                            (edge[0] === otherEdge[0] && edge[1] === otherEdge[1]) ||
                            (edge[0] === otherEdge[1] && edge[1] === otherEdge[0])
                        );
                    });
                    
                    if (!isShared) {
                        polygonEdges.push(edge);
                    }
                }
            }
            
            // Remover triângulos ruins
            this.triangles = this.triangles.filter(t => !badTriangles.includes(t));
            
            // Criar novos triângulos a partir das arestas do polígono
            for (const edge of polygonEdges) {
                const newTriangle = this.createTriangle(edge[0], edge[1], point);
                this.triangles.push(newTriangle);
            }
        }
        
        // Remover triângulos que compartilham vértices com o super triângulo
        this.triangles = this.triangles.filter(triangle => 
            !this.sharesVertexWithSuperTriangle(triangle, superTriangle)
        );
        
        return this.triangles;
    }

    // Criar super triângulo
    createSuperTriangle(points) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const dx = maxX - minX;
        const dy = maxY - minY;
        const deltaMax = Math.max(dx, dy);
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        
        // Triângulo equilátero grande o suficiente
        const a = { x: midX - 20 * deltaMax, y: midY - 10 * deltaMax };
        const b = { x: midX, y: midY + 20 * deltaMax };
        const c = { x: midX + 20 * deltaMax, y: midY - 10 * deltaMax };
        
        return this.createTriangle(a, b, c);
    }

    // Verificar se triângulo compartilha vértices com super triângulo
    sharesVertexWithSuperTriangle(triangle, superTriangle) {
        const superVertices = [superTriangle.a, superTriangle.b, superTriangle.c];
        const triangleVertices = [triangle.a, triangle.b, triangle.c];
        
        return triangleVertices.some(vertex =>
            superVertices.some(superVertex =>
                vertex === superVertex
            )
        );
    }

    // Criar objeto triângulo com propriedades calculadas
    createTriangle(a, b, c) {
        const circumcircle = Delaunay.circumcircle(a, b, c);
        const angles = Delaunay.triangleAngles(a, b, c);
        const area = Delaunay.triangleArea(a, b, c);
        
        return {
            a, b, c,
            id: Date.now() + Math.random(),
            circumcircle: circumcircle,
            angles: angles,
            area: area,
            isDelaunay: true
        };
    }

    // Algoritmo de Flip (Lawson)
    computeFlipAlgorithm(points) {
        if (points.length < 3) return [];
        
        // Começar com triangulação qualquer (ex: triângulo inicial)
        const initialTriangle = this.createTriangle(points[0], points[1], points[2]);
        this.triangles = [initialTriangle];
        
        // Adicionar pontos restantes
        for (let i = 3; i < points.length; i++) {
            this.addPointWithFlips(points[i]);
        }
        
        return this.triangles;
    }

    // Adicionar ponto usando flips
    addPointWithFlips(point) {
        // Encontrar triângulo que contém o ponto
        const containingTriangle = this.findTriangleContaining(point);
        if (!containingTriangle) return;
        
        // Dividir triângulo em 3 novos triângulos
        const newTriangles = [
            this.createTriangle(containingTriangle.a, containingTriangle.b, point),
            this.createTriangle(containingTriangle.b, containingTriangle.c, point),
            this.createTriangle(containingTriangle.c, containingTriangle.a, point)
        ];
        
        // Remover triângulo antigo e adicionar novos
        this.triangles = this.triangles.filter(t => t !== containingTriangle);
        this.triangles.push(...newTriangles);
        
        // Aplicar flips até que a triangulação seja de Delaunay
        this.applyFlips();
    }

    // Aplicar flips para restaurar propriedade de Delaunay
    applyFlips() {
        let flipped = true;
        this.totalFlips = 0;
        
        while (flipped) {
            flipped = false;
            
            for (let i = 0; i < this.triangles.length; i++) {
                for (let j = i + 1; j < this.triangles.length; j++) {
                    const t1 = this.triangles[i];
                    const t2 = this.triangles[j];
                    
                    // Verificar se são adjacentes (compartilham aresta)
                    const sharedEdge = this.getSharedEdge(t1, t2);
                    if (!sharedEdge) continue;
                    
                    // Obter pontos opostos à aresta compartilhada
                    const opposite1 = this.getOppositePoint(t1, sharedEdge);
                    const opposite2 = this.getOppositePoint(t2, sharedEdge);
                    
                    // Verificar condição de Delaunay
                    if (Delaunay.pointInCircumcircle(
                        sharedEdge[0], sharedEdge[1], opposite1, opposite2)) {
                        
                        // Realizar flip
                        this.flipEdge(t1, t2, sharedEdge, opposite1, opposite2);
                        flipped = true;
                        this.totalFlips++;
                        break;
                    }
                }
                if (flipped) break;
            }
        }
    }

    // Encontrar aresta compartilhada entre dois triângulos
    getSharedEdge(t1, t2) {
        const edges1 = [
            [t1.a, t1.b], [t1.b, t1.c], [t1.c, t1.a]
        ];
        
        for (const edge1 of edges1) {
            const edges2 = [
                [t2.a, t2.b], [t2.b, t2.c], [t2.c, t2.a]
            ];
            
            for (const edge2 of edges2) {
                if ((edge1[0] === edge2[0] && edge1[1] === edge2[1]) ||
                    (edge1[0] === edge2[1] && edge1[1] === edge2[0])) {
                    return edge1;
                }
            }
        }
        return null;
    }

    // Obter ponto oposto à aresta em um triângulo
    getOppositePoint(triangle, edge) {
        const points = [triangle.a, triangle.b, triangle.c];
        return points.find(p => p !== edge[0] && p !== edge[1]);
    }

    // Realizar flip de aresta
    flipEdge(t1, t2, edge, opposite1, opposite2) {
        // Remover triângulos antigos
        this.triangles = this.triangles.filter(t => t !== t1 && t !== t2);
        
        // Criar novos triângulos com a aresta flipada
        const newT1 = this.createTriangle(edge[0], opposite1, opposite2);
        const newT2 = this.createTriangle(edge[1], opposite1, opposite2);
        
        this.triangles.push(newT1, newT2);
    }

    // Calcular fecho convexo (usando Graham Scan simplificado)
    computeConvexHull() {
        if (this.points.length < 3) return this.points;
        
        // Encontrar ponto com menor y (e menor x em caso de empate)
        let start = this.points[0];
        for (const point of this.points) {
            if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
                start = point;
            }
        }
        
        // Ordenar pontos por ângulo polar
        const sorted = [...this.points].sort((a, b) => {
            if (a === start) return -1;
            if (b === start) return 1;
            
            const angleA = Math.atan2(a.y - start.y, a.x - start.x);
            const angleB = Math.atan2(b.y - start.y, b.x - start.x);
            
            if (angleA < angleB) return -1;
            if (angleA > angleB) return 1;
            
            // Se ângulos iguais, manter o mais distante
            return Delaunay.distance(start, b) - Delaunay.distance(start, a);
        });
        
        // Construir fecho convexo
        const hull = [sorted[0], sorted[1]];
        
        for (let i = 2; i < sorted.length; i++) {
            while (hull.length >= 2 && 
                   Delaunay.orientation(
                       hull[hull.length - 2],
                       hull[hull.length - 1],
                       sorted[i]) !== -1) {
                hull.pop();
            }
            hull.push(sorted[i]);
        }
        
        this.convexHull = hull;
        return hull;
    }

    // Calcular diagrama de Voronoi a partir da triangulação
    computeVoronoiFromDelaunay() {
        if (this.triangles.length === 0) return null;
        
        const voronoi = {
            sites: this.points,
            vertices: [],
            edges: [],
            cells: []
        };
        
        // Coletar todos os circuncentros (vértices de Voronoi)
        const circumcenters = new Map();
        for (const triangle of this.triangles) {
            if (triangle.circumcircle) {
                circumcenters.set(triangle.id, triangle.circumcircle.center);
            }
        }
        
        // Criar células de Voronoi (simplificado)
        for (const site of this.points) {
            // Encontrar triângulos que contêm este site
            const relatedTriangles = this.triangles.filter(triangle =>
                triangle.a === site || triangle.b === site || triangle.c === site
            );
            
            const cell = {
                site: site,
                vertices: relatedTriangles
                    .map(t => t.circumcircle?.center)
                    .filter(c => c !== undefined)
            };
            
            voronoi.cells.push(cell);
            voronoi.vertices.push(...cell.vertices);
        }
        
        this.voronoiDiagram = voronoi;
        return voronoi;
    }

    // Encontrar triângulo que contém ponto
    findTriangleContaining(point) {
        for (const triangle of this.triangles) {
            if (this.pointInTriangle(point, triangle)) {
                return triangle;
            }
        }
        return null;
    }

    // Verificar se ponto está dentro do triângulo
    pointInTriangle(p, triangle) {
        const { a, b, c } = triangle;
        
        // Usando método de coordenadas baricêntricas
        const denominator = ((b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y));
        if (Math.abs(denominator) < 1e-10) return false;
        
        const alpha = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / denominator;
        const beta = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / denominator;
        const gamma = 1 - alpha - beta;
        
        return alpha >= 0 && beta >= 0 && gamma >= 0;
    }

    // Interface pública
    addPoint(x, y) {
        const point = { x, y, id: Date.now() + Math.random() };
        this.points.push(point);
        this.computeDelaunay();
        return point;
    }

    removePoint(pointId) {
        this.points = this.points.filter(p => p.id !== pointId);
        this.computeDelaunay();
    }

    findPointNear(x, y, threshold = 10) {
        return this.points.find(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
    }

    computeDelaunay() {
        const startTime = performance.now();
        
        // Fazer cópia dos pontos para não modificar o original
        const pointsCopy = [...this.points];
        
        switch (this.algorithm) {
            case 'bowyerWatson':
                this.computeBowyerWatson(pointsCopy);
                break;
            case 'flipAlgorithm':
                this.computeFlipAlgorithm(pointsCopy);
                break;
            case 'bruteForce':
                this.computeBruteForce(pointsCopy);
                break;
            default:
                this.computeBowyerWatson(pointsCopy);
        }
        
        // Calcular estatísticas
        this.computeStatistics();
        this.computeConvexHull();
        this.computeVoronoiFromDelaunay();
        
        const endTime = performance.now();
        this.calcTime = Math.round(endTime - startTime);
    }

    // Algoritmo de força bruta (para demonstração)
    computeBruteForce(points) {
        this.triangles = [];
        
        if (points.length < 3) return;
        
        // Gerar todas as combinações possíveis de triângulos
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                for (let k = j + 1; k < points.length; k++) {
                    const triangle = this.createTriangle(points[i], points[j], points[k]);
                    let isDelaunay = true;
                    
                    // Verificar propriedade do círculo vazio
                    for (let l = 0; l < points.length; l++) {
                        if (l === i || l === j || l === k) continue;
                        
                        if (Delaunay.pointInCircumcircle(
                            points[i], points[j], points[k], points[l])) {
                            isDelaunay = false;
                            break;
                        }
                    }
                    
                    triangle.isDelaunay = isDelaunay;
                    if (isDelaunay) {
                        this.triangles.push(triangle);
                    }
                }
            }
        }
    }

    // Calcular estatísticas
    computeStatistics() {
        if (this.triangles.length === 0) {
            this.minAngle = 0;
            return;
        }
        
        let minAngle = Infinity;
        for (const triangle of this.triangles) {
            if (triangle.angles && triangle.angles.min < minAngle) {
                minAngle = triangle.angles.min;
            }
        }
        
        this.minAngle = minAngle !== Infinity ? minAngle.toFixed(1) : 0;
    }

    // Gerar pontos aleatórios
    generateRandomPoints(count, width, height, margin = 50) {
        this.points = [];
        
        for (let i = 0; i < count; i++) {
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);
            this.addPoint(x, y);
        }
        
        this.computeDelaunay();
    }

    // Carregar presets
    loadPreset(presetName) {
        this.points = [];
        
        switch (presetName) {
            case 'circle':
                this.loadCirclePreset();
                break;
            case 'grid':
                this.loadGridPreset();
                break;
            case 'random':
                this.generateRandomPoints(15, 800, 600);
                break;
            case 'cocircular':
                this.loadCocircularPreset();
                break;
        }
        
        this.computeDelaunay();
    }

    loadCirclePreset() {
        const centerX = 400;
        const centerY = 300;
        const radius = 200;
        const numPoints = 12;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * 2 * Math.PI) / numPoints;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.addPoint(x, y);
        }
        
        // Adicionar ponto central
        this.addPoint(centerX, centerY);
    }

    loadGridPreset() {
        const rows = 4;
        const cols = 4;
        const spacing = 100;
        const startX = 200;
        const startY = 150;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = startX + j * spacing + (Math.random() - 0.5) * 20;
                const y = startY + i * spacing + (Math.random() - 0.5) * 20;
                this.addPoint(x, y);
            }
        }
    }

    loadCocircularPreset() {
        // Pontos cocirculares (desafio para Delaunay)
        const centerX = 400;
        const centerY = 300;
        const radius = 150;
        
        // Quatro pontos em um círculo
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.addPoint(x, y);
        }
        
        // Ponto no centro
        this.addPoint(centerX, centerY);
    }

    // Métodos para obter dados
    getPoints() {
        return this.points;
    }

    getTriangles() {
        return this.triangles;
    }

    getConvexHull() {
        return this.convexHull;
    }

    getVoronoiDiagram() {
        return this.voronoiDiagram;
    }

    getEdges() {
        const edges = new Set();
        
        for (const triangle of this.triangles) {
            const triangleEdges = [
                `${Math.min(triangle.a.id, triangle.b.id)}-${Math.max(triangle.a.id, triangle.b.id)}`,
                `${Math.min(triangle.b.id, triangle.c.id)}-${Math.max(triangle.b.id, triangle.c.id)}`,
                `${Math.min(triangle.c.id, triangle.a.id)}-${Math.max(triangle.c.id, triangle.a.id)}`
            ];
            
            triangleEdges.forEach(edge => edges.add(edge));
        }
        
        return Array.from(edges);
    }

    getStats() {
        return {
            totalPoints: this.points.length,
            totalTriangles: this.triangles.length,
            totalEdges: this.getEdges().length,
            totalFlips: this.totalFlips,
            minAngle: this.minAngle,
            calcTime: this.calcTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }

    // Métodos de animação
    startAnimation() {
        this.isRunning = true;
        this.isPaused = false;
    }

    pauseAnimation() {
        this.isPaused = !this.isPaused;
    }

    stopAnimation() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.points = [];
        this.triangles = [];
        this.convexHull = [];
        this.voronoiDiagram = null;
        this.totalFlips = 0;
        this.minAngle = 0;
        this.calcTime = 0;
        this.stopAnimation();
    }
}

// Exportar para uso global
window.Delaunay = Delaunay;