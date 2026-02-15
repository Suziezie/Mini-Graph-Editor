/**
 * 图节点类
 */
export class Node {
    constructor(id, x, y, label = '', color = '#000000', shape = 'circle') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = label;
        this.color = color;
        this.shape = shape; // 节点形状：'circle', 'triangle', 'square', 'star'
    }

    /**
     * 更新节点位置
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 更新节点标签
     */
    setLabel(label) {
        this.label = label;
    }

    /**
     * 更新节点颜色
     */
    setColor(color) {
        this.color = color;
    }

    /**
     * 更新节点形状
     */
    setShape(shape) {
        this.shape = shape;
    }

    /**
     * 克隆节点
     */
    clone() {
        return new Node(this.id, this.x, this.y, this.label, this.color);
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            label: this.label,
            color: this.color,
            shape: this.shape
        };
    }

    /**
     * 从JSON对象创建节点
     */
    static fromJSON(json) {
        return new Node(json.id, json.x, json.y, json.label, json.color);
    }
}

/**
 * 图边类
 */
export class Edge {
    constructor(id, source, target, weight = 1, label = '', color = '#000000') {
        this.id = id;
        this.source = source;  // 源节点ID
        this.target = target;  // 目标节点ID
        this.weight = weight;
        this.label = label;
        this.color = color;
    }

    /**
     * 更新边标签
     */
    setLabel(label) {
        this.label = label;
    }

    /**
     * 更新边权重
     */
    setWeight(weight) {
        this.weight = weight;
    }

    /**
     * 更新边颜色
     */
    setColor(color) {
        this.color = color;
    }

    /**
     * 检查是否是自环
     */
    isSelfLoop() {
        return this.source === this.target;
    }

    /**
     * 克隆边
     */
    clone() {
        return new Edge(this.id, this.source, this.target, this.weight, this.label, this.color);
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            source: this.source,
            target: this.target,
            weight: this.weight,
            label: this.label,
            color: this.color
        };
    }

    /**
     * 从JSON对象创建边
     */
    static fromJSON(json) {
        return new Edge(json.id, json.source, json.target, json.weight, json.label, json.color);
    }
}

/**
 * 图类 - 核心数据结构
 */
export class Graph {
    constructor(directed = false) {
        this.nodes = [];
        this.edges = [];
        this.directed = directed;
        this.nodeIdCounter = 1;
        this.edgeIdCounter = 1;
    }

    /**
     * 添加节点
     */
    addNode(x, y, label = null, color = '#000000', shape = 'circle') {
        const nodeId = `node_${this.nodeIdCounter++}`;
        const nodeLabel = label || `V${this.nodeIdCounter - 1}`;
        const node = new Node(nodeId, x, y, nodeLabel, color, shape);
        this.nodes.push(node);
        return node;
    }

    /**
     * 添加边
     */
    addEdge(sourceId, targetId, weight = 1, label = '') {
        // 检查节点是否存在
        if (!this.getNode(sourceId) || !this.getNode(targetId)) {
            throw new Error('源节点或目标节点不存在');
        }

        const edgeId = `edge_${this.edgeIdCounter++}`;
        const edge = new Edge(edgeId, sourceId, targetId, weight, label);
        this.edges.push(edge);
        return edge;
    }

    /**
     * 获取节点
     */
    getNode(nodeId) {
        return this.nodes.find(node => node.id === nodeId);
    }

    /**
     * 获取边
     */
    getEdge(edgeId) {
        return this.edges.find(edge => edge.id === edgeId);
    }

    /**
     * 获取与节点相连的所有边
     */
    getEdgesForNode(nodeId) {
        return this.edges.filter(edge => 
            edge.source === nodeId || edge.target === nodeId
        );
    }

    /**
     * 获取两个节点之间的所有边
     */
    getEdgesBetween(sourceId, targetId) {
        return this.edges.filter(edge => 
            (edge.source === sourceId && edge.target === targetId) ||
            (!this.directed && edge.source === targetId && edge.target === sourceId)
        );
    }

    /**
     * 删除节点
     */
    deleteNode(nodeId) {
        // 先删除相关的边
        this.edges = this.edges.filter(edge => 
            edge.source !== nodeId && edge.target !== nodeId
        );
        
        // 删除节点
        this.nodes = this.nodes.filter(node => node.id !== nodeId);
    }

    /**
     * 删除边
     */
    deleteEdge(edgeId) {
        this.edges = this.edges.filter(edge => edge.id !== edgeId);
    }

    /**
     * 清空图
     */
    clear() {
        this.nodes = [];
        this.edges = [];
        this.nodeIdCounter = 1;
        this.edgeIdCounter = 1;
    }

    /**
     * 设置图类型（有向/无向）
     */
    setDirected(directed) {
        this.directed = directed;
    }

    /**
     * 获取节点数量
     */
    getNodeCount() {
        return this.nodes.length;
    }

    /**
     * 获取边数量
     */
    getEdgeCount() {
        return this.edges.length;
    }

    /**
     * 检查图是否为空
     */
    isEmpty() {
        return this.nodes.length === 0;
    }

    /**
     * 克隆图
     */
    clone() {
        const newGraph = new Graph(this.directed);
        newGraph.nodes = this.nodes.map(node => node.clone());
        newGraph.edges = this.edges.map(edge => edge.clone());
        newGraph.nodeIdCounter = this.nodeIdCounter;
        newGraph.edgeIdCounter = this.edgeIdCounter;
        return newGraph;
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            nodes: this.nodes.map(node => node.toJSON()),
            edges: this.edges.map(edge => edge.toJSON()),
            directed: this.directed
        };
    }

    /**
     * 从JSON对象创建图
     */
    static fromJSON(json) {
        const graph = new Graph(json.directed);
        graph.nodes = json.nodes.map(nodeData => Node.fromJSON(nodeData));
        graph.edges = json.edges.map(edgeData => Edge.fromJSON(edgeData));
        
        // 更新计数器
        if (graph.nodes.length > 0) {
            const maxNodeId = Math.max(...graph.nodes.map(n => parseInt(n.id.split('_')[1])));
            graph.nodeIdCounter = maxNodeId + 1;
        }
        
        if (graph.edges.length > 0) {
            const maxEdgeId = Math.max(...graph.edges.map(e => parseInt(e.id.split('_')[1])));
            graph.edgeIdCounter = maxEdgeId + 1;
        }
        
        return graph;
    }
}