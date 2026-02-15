import { MathUtils } from '../utils/helpers.js';

/**
 * 布局算法基类
 */
export class LayoutAlgorithm {
    constructor(graph, svgElement) {
        this.graph = graph;
        this.svgElement = svgElement;
        this.width = svgElement.clientWidth;
        this.height = svgElement.clientHeight;
    }

    /**
     * 应用布局算法
     * @returns {Object} 布局后的节点位置信息
     */
    apply() {
        throw new Error('子类必须实现 apply 方法');
    }

    /**
     * 获取画布中心坐标
     */
    getCenter() {
        return {
            x: this.width / 2,
            y: this.height / 2
        };
    }

    /**
     * 获取有效半径（考虑边距）
     */
    getEffectiveRadius(margin = 0.1) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        return Math.min(centerX, centerY) * (1 - margin);
    }
}

/**
 * 圆形布局算法
 */
export class CircleLayout extends LayoutAlgorithm {
    apply() {
        if (this.graph.nodes.length === 0) return {};

        const center = this.getCenter();
        const radius = this.getEffectiveRadius(0.3);
        const positions = {};

        this.graph.nodes.forEach((node, index) => {
            const angle = (index / this.graph.nodes.length) * 2 * Math.PI;
            positions[node.id] = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            };
        });

        return positions;
    }
}

/**
 * 网格布局算法
 */
export class GridLayout extends LayoutAlgorithm {
    apply() {
        if (this.graph.nodes.length === 0) return {};

        const positions = {};
        const nodeCount = this.graph.nodes.length;
        const cols = Math.ceil(Math.sqrt(nodeCount));
        const rows = Math.ceil(nodeCount / cols);
        
        const cellWidth = this.width / (cols + 1);
        const cellHeight = this.height / (rows + 1);

        this.graph.nodes.forEach((node, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            positions[node.id] = {
                x: cellWidth * (col + 1),
                y: cellHeight * (row + 1)
            };
        });

        return positions;
    }
}

/**
 * 力导向布局算法
 * 使用简单的弹簧-斥力模型
 */
export class ForceLayout extends LayoutAlgorithm {
    constructor(graph, svgElement, options = {}) {
        super(graph, svgElement);
        this.options = {
            iterations: 100,
            repulsion: 10000,
            springLength: 100,
            springConstant: 0.1,
            damping: 0.9,
            ...options
        };
    }

    apply() {
        if (this.graph.nodes.length === 0) return {};

        // 初始化节点位置（圆形分布）
        const positions = {};
        const velocities = {};
        const center = this.getCenter();
        const radius = this.getEffectiveRadius(0.4);

        this.graph.nodes.forEach((node, index) => {
            const angle = (index / this.graph.nodes.length) * 2 * Math.PI;
            positions[node.id] = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            };
            velocities[node.id] = { x: 0, y: 0 };
        });

        // 执行迭代
        for (let i = 0; i < this.options.iterations; i++) {
            this.iterate(positions, velocities);
        }

        return positions;
    }

    iterate(positions, velocities) {
        // 计算节点间的斥力
        this.applyRepulsionForces(positions, velocities);
        
        // 计算边的弹簧力
        this.applySpringForces(positions, velocities);
        
        // 更新位置
        this.updatePositions(positions, velocities);
        
        // 应用阻尼
        this.applyDamping(velocities);
    }

    applyRepulsionForces(positions, velocities) {
        const nodes = this.graph.nodes;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                const pos1 = positions[node1.id];
                const pos2 = positions[node2.id];
                
                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const distance = Math.max(MathUtils.distance(pos1.x, pos1.y, pos2.x, pos2.y), 1);
                
                // 斥力：与距离平方成反比
                const force = this.options.repulsion / (distance * distance);
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                velocities[node1.id].x -= fx;
                velocities[node1.id].y -= fy;
                velocities[node2.id].x += fx;
                velocities[node2.id].y += fy;
            }
        }
    }

    applySpringForces(positions, velocities) {
        this.graph.edges.forEach(edge => {
            const sourceNode = this.graph.getNode(edge.source);
            const targetNode = this.graph.getNode(edge.target);
            
            if (!sourceNode || !targetNode) return;
            
            const pos1 = positions[sourceNode.id];
            const pos2 = positions[targetNode.id];
            
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.max(MathUtils.distance(pos1.x, pos1.y, pos2.x, pos2.y), 1);
            
            // 弹簧力：胡克定律
            const displacement = distance - this.options.springLength;
            const force = this.options.springConstant * displacement;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            velocities[sourceNode.id].x += fx;
            velocities[sourceNode.id].y += fy;
            velocities[targetNode.id].x -= fx;
            velocities[targetNode.id].y -= fy;
        });
    }

    updatePositions(positions, velocities) {
        const margin = 20;
        const maxX = this.width - margin;
        const maxY = this.height - margin;
        const minX = margin;
        const minY = margin;

        this.graph.nodes.forEach(node => {
            const pos = positions[node.id];
            const vel = velocities[node.id];
            
            // 更新位置
            pos.x += vel.x;
            pos.y += vel.y;
            
            // 边界约束
            pos.x = MathUtils.clamp(pos.x, minX, maxX);
            pos.y = MathUtils.clamp(pos.y, minY, maxY);
        });
    }

    applyDamping(velocities) {
        this.graph.nodes.forEach(node => {
            const vel = velocities[node.id];
            vel.x *= this.options.damping;
            vel.y *= this.options.damping;
        });
    }
}

/**
 * 布局管理器
 */
export class LayoutManager {
    static LAYOUTS = {
        circle: CircleLayout,
        grid: GridLayout,
        force: ForceLayout
    };

    constructor(graph, svgElement) {
        this.graph = graph;
        this.svgElement = svgElement;
        this.previousLayoutState = null;
    }

    /**
     * 应用指定的布局算法
     */
    applyLayout(layoutType, options = {}) {
        if (!this.graph.nodes.length) {
            throw new Error('图中没有节点');
        }

        const LayoutClass = this.LAYOUTS[layoutType];
        if (!LayoutClass) {
            throw new Error(`不支持的布局类型: ${layoutType}`);
        }

        // 保存当前状态用于恢复
        this.saveCurrentState(layoutType);

        const layout = new LayoutClass(this.graph, this.svgElement, options);
        const positions = layout.apply();

        // 应用新位置到节点
        Object.keys(positions).forEach(nodeId => {
            const node = this.graph.getNode(nodeId);
            if (node) {
                const pos = positions[nodeId];
                node.setPosition(pos.x, pos.y);
            }
        });

        return positions;
    }

    /**
     * 保存当前布局状态
     */
    saveCurrentState(layoutType) {
        this.previousLayoutState = {
            nodes: this.graph.nodes.map(node => ({
                id: node.id,
                x: node.x,
                y: node.y
            })),
            layoutType: layoutType
        };
    }

    /**
     * 恢复到之前的布局状态
     */
    restorePreviousLayout() {
        if (!this.previousLayoutState) {
            throw new Error('没有可恢复的布局历史');
        }

        this.previousLayoutState.nodes.forEach(nodeState => {
            const node = this.graph.getNode(nodeState.id);
            if (node) {
                node.setPosition(nodeState.x, nodeState.y);
            }
        });

        const restoredLayoutType = this.previousLayoutState.layoutType;
        this.previousLayoutState = null;
        
        return restoredLayoutType;
    }

    /**
     * 检查是否有可恢复的布局
     */
    canRestoreLayout() {
        return this.previousLayoutState !== null;
    }
}