// Trees.js - Lógica para Árvores de Busca (BST, AVL, Red-Black)

class TreeNode {
    constructor(value, type = 'bst') {
        this.value = value;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.height = 1;
        this.balanceFactor = 0;
        this.color = type === 'redblack' ? 'RED' : null; // RED-BLACK trees
        this.type = type;
        this.id = Date.now() + Math.random();
        this.x = 0;
        this.y = 0;
        this.isRoot = false;
        this.isHighlighted = false;
        this.isTraversing = false;
    }

    isRed() {
        return this.color === 'RED';
    }

    isBlack() {
        return this.color === 'BLACK' || this.color === null;
    }

    toggleColor() {
        if (this.type === 'redblack') {
            this.color = this.isRed() ? 'BLACK' : 'RED';
        }
    }

    updateHeight() {
        const leftHeight = this.left ? this.left.height : 0;
        const rightHeight = this.right ? this.right.height : 0;
        this.height = Math.max(leftHeight, rightHeight) + 1;
        this.balanceFactor = leftHeight - rightHeight;
        return this.height;
    }

    isBalanced() {
        return Math.abs(this.balanceFactor) <= 1;
    }
}

class BinarySearchTree {
    constructor(type = 'bst') {
        this.root = null;
        this.type = type;
        this.rotationCount = 0;
        this.nodeCount = 0;
        this.selectedNode = null;
        this.traversalPath = [];
        this.animationSpeed = 50;
        this.operations = [];
        this.showValues = true;
        this.showHeights = true;
        this.showBalance = true;
        this.animateOperations = true;
    }

    // Operações básicas
    insert(value) {
        this.operations = [`Inserindo valor: ${value}`];
        
        if (!this.root) {
            this.root = new TreeNode(value, this.type);
            this.root.isRoot = true;
            if (this.type === 'redblack') {
                this.root.color = 'BLACK'; // Raiz é sempre preta
            }
            this.nodeCount++;
            this.operations.push(`Criando raiz com valor ${value}`);
            return this.root;
        }

        const newNode = new TreeNode(value, this.type);
        this.operations.push(`Criando novo nó para ${value}`);
        
        let current = this.root;
        const path = [];
        
        while (true) {
            path.push(current);
            
            if (value < current.value) {
                this.operations.push(`${value} < ${current.value} → indo para esquerda`);
                if (!current.left) {
                    current.left = newNode;
                    newNode.parent = current;
                    this.operations.push(`Inserindo ${value} como filho esquerdo de ${current.value}`);
                    break;
                }
                current = current.left;
            } else if (value > current.value) {
                this.operations.push(`${value} > ${current.value} → indo para direita`);
                if (!current.right) {
                    current.right = newNode;
                    newNode.parent = current;
                    this.operations.push(`Inserindo ${value} como filho direito de ${current.value}`);
                    break;
                }
                current = current.right;
            } else {
                this.operations.push(`Valor ${value} já existe na árvore`);
                return null; // Valor duplicado
            }
        }
        
        this.nodeCount++;
        
        // Atualizar alturas e balancear
        this.updateHeights(newNode);
        
        if (this.type === 'avl') {
            this.balanceAVL(newNode);
        } else if (this.type === 'redblack') {
            this.fixRedBlackInsert(newNode);
        }
        
        this.operations.push(`Inserção concluída. Total de nós: ${this.nodeCount}`);
        return newNode;
    }

    delete(value) {
        this.operations = [`Removendo valor: ${value}`];
        
        let node = this.search(value);
        if (!node) {
            this.operations.push(`Valor ${value} não encontrado`);
            return null;
        }

        this.operations.push(`Nó ${value} encontrado`);
        this.nodeCount--;

        // Caso 1: Nó sem filhos
        if (!node.left && !node.right) {
            this.operations.push(`Nó ${value} é folha → removendo diretamente`);
            this.replaceNode(node, null);
            
        // Caso 2: Nó com um filho
        } else if (!node.left || !node.right) {
            const child = node.left || node.right;
            this.operations.push(`Nó ${value} tem um filho (${child.value}) → substituindo`);
            this.replaceNode(node, child);
            
        // Caso 3: Nó com dois filhos
        } else {
            const successor = this.getMinNode(node.right);
            this.operations.push(`Nó ${value} tem dois filhos → sucessor é ${successor.value}`);
            
            // Salvar valores do sucessor
            const successorValue = successor.value;
            const successorColor = successor.color;
            
            // Remover sucessor
            this.delete(successor.value);
            
            // Substituir valor do nó
            node.value = successorValue;
            if (this.type === 'redblack') {
                node.color = successorColor;
            }
            this.operations.push(`Substituído valor de ${value} para ${successorValue}`);
        }

        // Atualizar alturas e balancear
        if (node.parent) {
            this.updateHeights(node.parent);
            
            if (this.type === 'avl') {
                this.balanceAVL(node.parent);
            } else if (this.type === 'redblack') {
                this.fixRedBlackDelete(node);
            }
        }

        this.operations.push(`Remoção concluída. Total de nós: ${this.nodeCount}`);
        return true;
    }

    search(value) {
        this.operations = [`Buscando valor: ${value}`];
        this.traversalPath = [];
        
        let current = this.root;
        while (current) {
            this.traversalPath.push(current);
            
            if (value === current.value) {
                this.operations.push(`Valor ${value} encontrado!`);
                this.selectedNode = current;
                return current;
            } else if (value < current.value) {
                this.operations.push(`${value} < ${current.value} → indo para esquerda`);
                current = current.left;
            } else {
                this.operations.push(`${value} > ${current.value} → indo para direita`);
                current = current.right;
            }
        }
        
        this.operations.push(`Valor ${value} não encontrado`);
        return null;
    }

    // Métodos auxiliares
    getMinNode(node = this.root) {
        let current = node;
        while (current && current.left) {
            current = current.left;
        }
        return current;
    }

    getMaxNode(node = this.root) {
        let current = node;
        while (current && current.right) {
            current = current.right;
        }
        return current;
    }

    replaceNode(oldNode, newNode) {
        if (!oldNode.parent) {
            this.root = newNode;
            if (newNode) {
                newNode.isRoot = true;
                newNode.parent = null;
            }
        } else if (oldNode.parent.left === oldNode) {
            oldNode.parent.left = newNode;
        } else {
            oldNode.parent.right = newNode;
        }
        
        if (newNode) {
            newNode.parent = oldNode.parent;
            newNode.isRoot = newNode.parent === null;
        }
    }

    updateHeights(startNode) {
        let current = startNode;
        while (current) {
            current.updateHeight();
            current = current.parent;
        }
    }

    // Rotações AVL
    rotateRight(y) {
        this.operations.push(`Rotação direita em nó ${y.value}`);
        this.rotationCount++;
        
        const x = y.left;
        const T2 = x.right;
        
        // Realizar rotação
        x.right = y;
        y.left = T2;
        
        // Atualizar pais
        x.parent = y.parent;
        y.parent = x;
        if (T2) T2.parent = y;
        
        // Atualizar referência do pai
        if (!x.parent) {
            this.root = x;
            x.isRoot = true;
            y.isRoot = false;
        } else if (x.parent.left === y) {
            x.parent.left = x;
        } else {
            x.parent.right = x;
        }
        
        // Atualizar alturas
        y.updateHeight();
        x.updateHeight();
        
        return x;
    }

    rotateLeft(x) {
        this.operations.push(`Rotação esquerda em nó ${x.value}`);
        this.rotationCount++;
        
        const y = x.right;
        const T2 = y.left;
        
        // Realizar rotação
        y.left = x;
        x.right = T2;
        
        // Atualizar pais
        y.parent = x.parent;
        x.parent = y;
        if (T2) T2.parent = x;
        
        // Atualizar referência do pai
        if (!y.parent) {
            this.root = y;
            y.isRoot = true;
            x.isRoot = false;
        } else if (y.parent.left === x) {
            y.parent.left = y;
        } else {
            y.parent.right = y;
        }
        
        // Atualizar alturas
        x.updateHeight();
        y.updateHeight();
        
        return y;
    }

    // Balanceamento AVL
    balanceAVL(node) {
        let current = node;
        
        while (current) {
            current.updateHeight();
            
            if (Math.abs(current.balanceFactor) > 1) {
                this.operations.push(`Nó ${current.value} desbalanceado (BF: ${current.balanceFactor})`);
                
                // Caso Left Left
                if (current.balanceFactor > 1 && current.left.balanceFactor >= 0) {
                    this.operations.push(`Caso Left-Left → rotação direita`);
                    current = this.rotateRight(current);
                }
                // Caso Left Right
                else if (current.balanceFactor > 1 && current.left.balanceFactor < 0) {
                    this.operations.push(`Caso Left-Right → rotação esquerda-direita`);
                    current.left = this.rotateLeft(current.left);
                    current = this.rotateRight(current);
                }
                // Caso Right Right
                else if (current.balanceFactor < -1 && current.right.balanceFactor <= 0) {
                    this.operations.push(`Caso Right-Right → rotação esquerda`);
                    current = this.rotateLeft(current);
                }
                // Caso Right Left
                else if (current.balanceFactor < -1 && current.right.balanceFactor > 0) {
                    this.operations.push(`Caso Right-Left → rotação direita-esquerda`);
                    current.right = this.rotateRight(current.right);
                    current = this.rotateLeft(current);
                }
            }
            
            current = current.parent;
        }
    }

    // Red-Black Tree operations
    fixRedBlackInsert(node) {
        this.operations.push(`Corrigindo propriedades Red-Black após inserção`);
        
        while (node !== this.root && node.parent.isRed()) {
            if (node.parent === node.parent.parent.left) {
                const uncle = node.parent.parent.right;
                
                // Caso 1: Tio é vermelho
                if (uncle && uncle.isRed()) {
                    this.operations.push(`Caso 1: Tio vermelho → recoloração`);
                    node.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    node.parent.parent.color = 'RED';
                    node = node.parent.parent;
                } else {
                    // Caso 2: Nó é filho direito
                    if (node === node.parent.right) {
                        this.operations.push(`Caso 2: Nó é filho direito → rotação esquerda`);
                        node = node.parent;
                        this.rotateLeft(node);
                    }
                    
                    // Caso 3: Recoloração e rotação
                    this.operations.push(`Caso 3: Recoloração e rotação direita`);
                    node.parent.color = 'BLACK';
                    node.parent.parent.color = 'RED';
                    this.rotateRight(node.parent.parent);
                }
            } else {
                // Simétrico: pai é filho direito
                const uncle = node.parent.parent.left;
                
                if (uncle && uncle.isRed()) {
                    this.operations.push(`Caso 1 (simétrico): Tio vermelho → recoloração`);
                    node.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    node.parent.parent.color = 'RED';
                    node = node.parent.parent;
                } else {
                    if (node === node.parent.left) {
                        this.operations.push(`Caso 2 (simétrico): Nó é filho esquerdo → rotação direita`);
                        node = node.parent;
                        this.rotateRight(node);
                    }
                    
                    this.operations.push(`Caso 3 (simétrico): Recoloração e rotação esquerda`);
                    node.parent.color = 'BLACK';
                    node.parent.parent.color = 'RED';
                    this.rotateLeft(node.parent.parent);
                }
            }
        }
        
        this.root.color = 'BLACK';
        this.operations.push(`Propriedades Red-Black restauradas`);
    }

    fixRedBlackDelete(node) {
        this.operations.push(`Corrigindo propriedades Red-Black após remoção`);
        // Implementação simplificada para visualização
        if (this.root) {
            this.root.color = 'BLACK';
        }
    }

    // Traversals
    inorder(node = this.root, result = []) {
        if (!node) return result;
        
        this.inorder(node.left, result);
        result.push(node.value);
        this.inorder(node.right, result);
        
        return result;
    }

    preorder(node = this.root, result = []) {
        if (!node) return result;
        
        result.push(node.value);
        this.preorder(node.left, result);
        this.preorder(node.right, result);
        
        return result;
    }

    postorder(node = this.root, result = []) {
        if (!node) return result;
        
        this.postorder(node.left, result);
        this.postorder(node.right, result);
        result.push(node.value);
        
        return result;
    }

    levelorder() {
        const result = [];
        if (!this.root) return result;
        
        const queue = [this.root];
        
        while (queue.length > 0) {
            const node = queue.shift();
            result.push(node.value);
            
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        
        return result;
    }

    // Balanceamento manual
    balanceTree() {
        this.operations = [`Balanceando árvore`];
        
        if (this.type === 'bst') {
            const values = this.inorder();
            this.clear();
            
            // Reconstruir árvore balanceada
            this.buildBalancedTree(values);
            this.operations.push(`BST reconstruída de forma balanceada`);
            
        } else if (this.type === 'avl') {
            // AVL já se auto-balanceia
            this.operations.push(`AVL já está balanceada por construção`);
            
        } else if (this.type === 'redblack') {
            // Red-Black já se auto-balanceia
            this.operations.push(`Red-Black já está balanceada por construção`);
        }
    }

    buildBalancedTree(values, start = 0, end = values.length - 1) {
        if (start > end) return null;
        
        const mid = Math.floor((start + end) / 2);
        const node = new TreeNode(values[mid], this.type);
        
        node.left = this.buildBalancedTree(values, start, mid - 1);
        node.right = this.buildBalancedTree(values, mid + 1, end);
        
        if (node.left) node.left.parent = node;
        if (node.right) node.right.parent = node;
        
        node.updateHeight();
        
        if (!this.root) {
            this.root = node;
            node.isRoot = true;
            if (this.type === 'redblack') {
                node.color = 'BLACK';
            }
        }
        
        this.nodeCount++;
        return node;
    }

    // Métodos de utilidade
    clear() {
        this.root = null;
        this.nodeCount = 0;
        this.rotationCount = 0;
        this.selectedNode = null;
        this.traversalPath = [];
        this.operations = [`Árvore limpa`];
    }

    generateRandomTree(count, min = 1, max = 100) {
        this.clear();
        this.operations = [`Gerando árvore aleatória com ${count} nós`];
        
        const values = new Set();
        while (values.size < count) {
            values.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        
        Array.from(values).forEach(value => {
            this.insert(value);
        });
        
        this.operations.push(`Árvore gerada com ${count} valores aleatórios`);
    }

    getTreeHeight(node = this.root) {
        if (!node) return 0;
        return node.height;
    }

    isTreeBalanced() {
        const checkBalance = (node) => {
            if (!node) return { balanced: true, height: 0 };
            
            const left = checkBalance(node.left);
            const right = checkBalance(node.right);
            
            const balanced = left.balanced && right.balanced && 
                            Math.abs(left.height - right.height) <= 1;
            const height = Math.max(left.height, right.height) + 1;
            
            return { balanced, height };
        };
        
        return checkBalance(this.root).balanced;
    }

    getStats() {
        return {
            nodeCount: this.nodeCount,
            height: this.getTreeHeight(),
            isBalanced: this.isTreeBalanced(),
            rotationCount: this.rotationCount,
            type: this.type.toUpperCase(),
            rootValue: this.root ? this.root.value : null
        };
    }

    // Para visualização
    calculateNodePositions() {
    if (!this.root) return new Map(); // Retornar Map vazio se não houver raiz
    
    const positions = new Map();
    const calculate = (node, x, y, depth = 0, offset = 1) => {
        if (!node) return;
        
        const horizontalSpacing = 200 / Math.pow(1.5, depth);
        const verticalSpacing = 100;
        
        node.x = x;
        node.y = y;
        positions.set(node.id, { x, y, node });
        
        if (node.left) {
            calculate(node.left, x - horizontalSpacing, y + verticalSpacing, depth + 1, offset * 0.5);
        }
        if (node.right) {
            calculate(node.right, x + horizontalSpacing, y + verticalSpacing, depth + 1, offset * 0.5);
        }
    };
    
    calculate(this.root, 400, 100);
    return positions;
}

// trees.js - Adicionar também este método à classe BinarySearchTree
    getNodeAtPosition(x, y, threshold = 30) {
        const positions = this.calculateNodePositions();
        
        if (!positions || positions.size === 0) return null;
        
        let closestNode = null;
        let minDistance = Infinity;
        
        for (const [id, pos] of positions) {
            const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            if (distance < minDistance && distance < threshold) {
                minDistance = distance;
                closestNode = pos.node;
            }
        }
        
        return closestNode;
    }
    getNodeAtPosition(x, y, threshold = 30) {
        const positions = this.calculateNodePositions();
        
        for (const [id, pos] of positions) {
            const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            if (distance < threshold) {
                return pos.node;
            }
        }
        
        return null;
    }
}

// Fábrica de árvores
class TreeFactory {
    static createTree(type) {
        return new BinarySearchTree(type);
    }
    
    static getTreeInfo(type) {
        const info = {
            bst: {
                name: 'Binary Search Tree',
                description: 'Árvore de busca binária simples sem balanceamento automático.',
                complexity: {
                    search: 'O(n) pior caso, O(log n) melhor caso',
                    insert: 'O(n) pior caso, O(log n) melhor caso',
                    delete: 'O(n) pior caso, O(log n) melhor caso'
                }
            },
            avl: {
                name: 'AVL Tree',
                description: 'Árvore balanceada por altura. Mantém diferença de altura máxima de 1 entre subárvores.',
                complexity: {
                    search: 'O(log n) garantido',
                    insert: 'O(log n) garantido',
                    delete: 'O(log n) garantido'
                }
            },
            redblack: {
                name: 'Red-Black Tree',
                description: 'Árvore balanceada por cores. Menos balanceamentos que AVL, mas mesma complexidade assintótica.',
                complexity: {
                    search: 'O(log n) garantido',
                    insert: 'O(log n) garantido',
                    delete: 'O(log n) garantido'
                }
            }
        };
        
        return info[type] || info.bst;
    }
}

// Exportar para uso global
window.BinarySearchTree = BinarySearchTree;
window.TreeNode = TreeNode;
window.TreeFactory = TreeFactory;