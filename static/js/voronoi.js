// Voronoi.js - Lógica para Diagramas de Voronoi

class Voronoi {
    constructor() {
        this.points = [];
        this.diagram = null;
        this.delaunayTriangles = [];
        this.voronoiCells = [];
        this.edges = [];
        this.vertices = [];
        
        this.showCells = true;
        this.showEdges = true;
        this.showPoints = true;
        this.showDelaunay = false;
        this.showGrid = true;
        this.showDistance = true;
        this.animateColors = false;
        
        this.cellOpacity = 0.4;
        this.animationSpeed = 30;
        this.algorithm = 'incremental';
        
        this.colors = [
            '#4361ee', '#4cc9f0', '#4ade80', '#f72585', '#ff9100',
            '#7209b7', '#3a0ca3', '#f15bb5', '#00bbf9', '#00f5d4'
        ];
    }

    // Adicionar ponto
    addPoint(x, y) {
        this.points.push({ x, y, id: Date.now() + Math.random() });
        this.computeVoronoi();
    }

    // Remover ponto
    removePoint(pointId) {
        this.points = this.points.filter(p => p.id !== pointId);
        this.computeVoronoi();
    }

    // Encontrar ponto próximo
    findPointNear(x, y, threshold = 10) {
        return this.points.find(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
    }

    // Calcular distância entre dois pontos
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calcular ponto médio
    static midpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }

    // Calcular perpendicular bisector entre dois pontos
    static perpendicularBisector(p1, p2) {
        const mid = Voronoi.midpoint(p1, p2);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        return {
            point: mid,
            slope: -dx / dy,
            direction: { x: -dy, y: dx }
        };
    }

    // Encontrar interseção de duas linhas
    static lineIntersection(line1, line2) {
        if (Math.abs(line1.slope - line2.slope) < 0.0001) {
            return null; // Linhas paralelas
        }
        
        if (Math.abs(line1.slope) === Infinity) {
            // Linha 1 vertical
            const x = line1.point.x;
            const y = line2.slope * (x - line2.point.x) + line2.point.y;
            return { x, y };
        }
        
        if (Math.abs(line2.slope) === Infinity) {
            // Linha 2 vertical
            const x = line2.point.x;
            const y = line1.slope * (x - line1.point.x) + line1.point.y;
            return { x, y };
        }
        
        const x = (line2.slope * line2.point.x - line1.slope * line1.point.x + 
                  line1.point.y - line2.point.y) / (line2.slope - line1.slope);
        const y = line1.slope * (x - line1.point.x) + line1.point.y;
        
        return { x, y };
    }

    // Algoritmo incremental (simples)
    computeIncrementalVoronoi() {
        this.voronoiCells = [];
        this.edges = [];
        this.vertices = [];
        
        if (this.points.length < 2) return;
        
        // Para cada ponto, calcular sua célula de Voronoi
        for (let i = 0; i < this.points.length; i++) {
            const site = this.points[i];
            const cell = {
                site: site,
                vertices: [],
                edges: []
            };
            
            // Calcular diagrama de Voronoi básico
            // Esta é uma versão simplificada para visualização
            this.voronoiCells.push(cell);
        }
        
        // Calcular arestas como perpendicular bisectors entre pontos próximos
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const bisector = Voronoi.perpendicularBisector(this.points[i], this.points[j]);
                this.edges.push({
                    start: { x: bisector.point.x - bisector.direction.x * 1000, 
                            y: bisector.point.y - bisector.direction.y * 1000 },
                    end: { x: bisector.point.x + bisector.direction.x * 1000, 
                          y: bisector.point.y + bisector.direction.y * 1000 },
                    sites: [this.points[i], this.points[j]]
                });
            }
        }
    }

    // Calcular triangulação de Delaunay (simplificada)
    computeDelaunayTriangulation() {
        this.delaunayTriangles = [];
        
        if (this.points.length < 3) return;
        
        // Algoritmo simples: triangulação por força bruta (para visualização)
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                for (let k = j + 1; k < this.points.length; k++) {
                    const p1 = this.points[i];
                    const p2 = this.points[j];
                    const p3 = this.points[k];
                    
                    // Verificar se é uma triangulação válida (simplificado)
                    this.delaunayTriangles.push({
                        vertices: [p1, p2, p3],
                        circumcenter: this.calculateCircumcenter(p1, p2, p3),
                        radius: this.calculateCircumradius(p1, p2, p3)
                    });
                }
            }
        }
    }

    // Calcular circuncentro de um triângulo
    calculateCircumcenter(p1, p2, p3) {
        const d = 2 * (p1.x * (p2.y - p3.y) + 
                       p2.x * (p3.y - p1.y) + 
                       p3.x * (p1.y - p2.y));
        
        if (Math.abs(d) < 0.0001) {
            return null; // Pontos colineares
        }
        
        const ux = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) +
                   (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) +
                   (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d;
        
        const uy = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) +
                   (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) +
                   (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d;
        
        return { x: ux, y: uy };
    }

    // Calcular raio da circunferência circunscrita
    calculateCircumradius(p1, p2, p3) {
        const a = Voronoi.distance(p2, p3);
        const b = Voronoi.distance(p1, p3);
        const c = Voronoi.distance(p1, p2);
        
        const area = Math.abs(
            (p1.x * (p2.y - p3.y) + 
             p2.x * (p3.y - p1.y) + 
             p3.x * (p1.y - p2.y)) / 2
        );
        
        if (area < 0.0001) return Infinity;
        
        return (a * b * c) / (4 * area);
    }

    // Calcular diagrama de Voronoi
    computeVoronoi() {
        const startTime = performance.now();
        
        switch (this.algorithm) {
            case 'incremental':
                this.computeIncrementalVoronoi();
                break;
            case 'fortune':
                // Implementação simplificada do Fortune's Algorithm
                this.computeFortuneVoronoi();
                break;
            case 'delaunay':
                this.computeDelaunayTriangulation();
                this.computeVoronoiFromDelaunay();
                break;
        }
        
        const endTime = performance.now();
        this.calcTime = Math.round(endTime - startTime);
    }

    // Fortune's Algorithm (versão simplificada para visualização)
    computeFortuneVoronoi() {
        this.voronoiCells = [];
        this.edges = [];
        
        if (this.points.length < 2) return;
        
        // Ordenar pontos por coordenada x
        const sortedPoints = [...this.points].sort((a, b) => a.x - b.x);
        
        // Para visualização, usar aproximação baseada em sweep line
        for (let i = 0; i < sortedPoints.length; i++) {
            for (let j = i + 1; j < sortedPoints.length; j++) {
                // Calcular bisector
                const bisector = Voronoi.perpendicularBisector(sortedPoints[i], sortedPoints[j]);
                
                // Adicionar aresta infinita para visualização
                this.edges.push({
                    start: { 
                        x: bisector.point.x - bisector.direction.x * 1000, 
                        y: bisector.point.y - bisector.direction.y * 1000 
                    },
                    end: { 
                        x: bisector.point.x + bisector.direction.x * 1000, 
                        y: bisector.point.y + bisector.direction.y * 1000 
                    },
                    sites: [sortedPoints[i], sortedPoints[j]]
                });
            }
        }
    }

    // Calcular Voronoi a partir de Delaunay
    computeVoronoiFromDelaunay() {
        if (this.delaunayTriangles.length === 0) return;
        
        this.voronoiCells = [];
        this.vertices = [];
        
        // Coletar todos os circuncentros
        const circumcenters = [];
        this.delaunayTriangles.forEach(triangle => {
            if (triangle.circumcenter) {
                circumcenters.push(triangle.circumcenter);
            }
        });
        
        // Criar células de Voronoi (simplificado)
        this.points.forEach(site => {
            // Encontrar triângulos que contêm este site
            const relatedTriangles = this.delaunayTriangles.filter(triangle =>
                triangle.vertices.includes(site)
            );
            
            const cell = {
                site: site,
                vertices: relatedTriangles
                    .map(t => t.circumcenter)
                    .filter(c => c !== null)
            };
            
            this.voronoiCells.push(cell);
        });
    }

    // Gerar pontos aleatórios
    generateRandomPoints(count, width, height, margin = 50) {
        this.points = [];
        
        for (let i = 0; i < count; i++) {
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);
            this.addPoint(x, y);
        }
    }

    // Carregar presets
    loadPreset(presetName) {
        this.points = [];
        
        switch (presetName) {
            case 'grid':
                // Grid 3x3
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        this.addPoint(100 + i * 200, 100 + j * 200);
                    }
                }
                break;
                
            case 'circle':
                // Pontos em círculo
                const centerX = 400;
                const centerY = 300;
                const radius = 200;
                const numPoints = 8;
                
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i * 2 * Math.PI) / numPoints;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    this.addPoint(x, y);
                }
                break;
                
            case 'random':
                // Pontos aleatórios
                this.generateRandomPoints(10, 800, 600);
                break;
                
            case 'clusters':
                // Clusters
                const clusters = [
                    { x: 200, y: 200 },
                    { x: 600, y: 200 },
                    { x: 400, y: 400 },
                    { x: 200, y: 600 },
                    { x: 600, y: 600 }
                ];
                
                clusters.forEach(cluster => {
                    for (let i = 0; i < 3; i++) {
                        const x = cluster.x + (Math.random() - 0.5) * 100;
                        const y = cluster.y + (Math.random() - 0.5) * 100;
                        this.addPoint(x, y);
                    }
                });
                break;
        }
        
        this.computeVoronoi();
    }

    // Métodos para obter dados de visualização
    getPoints() {
        return this.points;
    }

    getVoronoiCells() {
        return this.voronoiCells;
    }

    getEdges() {
        return this.edges;
    }

    getDelaunayTriangles() {
        return this.delaunayTriangles;
    }

    getStats() {
        return {
            totalPoints: this.points.length,
            totalCells: this.voronoiCells.length,
            totalEdges: this.edges.length,
            totalVertices: this.vertices.length + this.voronoiCells.reduce((sum, cell) => 
                sum + cell.vertices.length, 0),
            calcTime: this.calcTime || 0
        };
    }

    // Obter cor para um índice (com animação opcional)
    getColor(index) {
        const colorIndex = index % this.colors.length;
        
        if (this.animateColors) {
            // Adicionar efeito de animação
            const hueShift = (Date.now() / 1000) % 360;
            return `hsl(${(colorIndex * 60 + hueShift) % 360}, 70%, 60%)`;
        }
        
        return this.colors[colorIndex];
    }
}

// Exportar para uso global
window.Voronoi = Voronoi;