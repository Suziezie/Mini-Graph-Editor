import { Graph } from './models/Graph.js';
import { ExportManager, ImportManager } from './services/ExportService.js';
import { AppEventManager } from './services/EventService.js';

import { 
    Button, 
    Modal, 
    ColorPicker, 
    PropertyPanel, 
    Toast, 
    ContextMenu 
} from './components/UIComponents.js';
import { DOMUtils, StorageUtils, ColorUtils } from './utils/helpers.js';

class GraphEditor {
    constructor() {
        this.graph = new Graph();
        this.svgElement = null;
        this.nodesGroup = null;
        this.edgesGroup = null;
        
        // 模式
        this.currentMode = 'addNode';
        this.graphMode = 'circle'; // 'circle' or 'dot' (圆点模式或微点模式)
        
        // 图类型和特性
        this.graphType = 'undirected'; // 'directed' 或 'undirected'
        this.graphFeatures = {
            simple: true,        // 简单图模式
            allowMultiEdges: false,  // 是否允许重边
            allowSelfLoops: false    // 是否允许自环
        };
        
        // 当前状态
        this.selectedNode = null;
        this.selectedEdge = null;
        this.edgeStart = null;
        this.isDragging = false;
        this.draggedNode = null;
        
        // 管理器
        this.exportManager = null;
        this.importManager = null;
        this.eventManager = null;
        
        // UI组件
        this.components = {};
        
        // 初始化
        this.initialize();
    }

    /**
     * 初始化应用
     */
    initialize() {
        this.setupDOMElements();
        this.setupManagers();
        this.setupComponents();
        this.setupEventListeners();
        this.loadSavedState();
        this.showToast('应用已加载', 'success');
    }

    /**
     * 设置DOM元素引用
     */
    setupDOMElements() {
        this.svgElement = DOMUtils.querySelector('#canvas');
        this.nodesGroup = DOMUtils.querySelector('#nodes');
        this.edgesGroup = DOMUtils.querySelector('#edges');
        
        if (!this.svgElement || !this.nodesGroup || !this.edgesGroup) {
            throw new Error('必要的DOM元素未找到');
        }
    }

    /**
     * 设置管理器
     */
    setupManagers() {
        this.exportManager = new ExportManager(this.graph, this.svgElement);
        this.importManager = new ImportManager(this.graph);
        this.eventManager = new AppEventManager();
        this.eventManager.initElementEvents(this.svgElement);
    }

    /**
     * 设置UI组件
     */
    setupComponents() {
        // 模式按钮
        this.components.addNodeBtn = new Button(DOMUtils.querySelector('#addNodeBtn'));
        this.components.addEdgeBtn = new Button(DOMUtils.querySelector('#addEdgeBtn'));
        this.components.deleteBtn = new Button(DOMUtils.querySelector('#deleteBtn'));
        
        // 其他按钮
        this.components.clearCanvasBtn = new Button(DOMUtils.querySelector('#clearCanvasBtn'));
        this.components.exportBtn = new Button(DOMUtils.querySelector('#exportBtn'));
        this.components.exportJsonBtn = new Button(DOMUtils.querySelector('#exportJsonBtn'));
        this.components.importJsonBtn = new Button(DOMUtils.querySelector('#importJsonBtn'));
        
        // 模式切换按钮
        this.components.toggleModeBtn = new Button(DOMUtils.querySelector('#toggleModeBtn'));
        
        // 模态框
        this.components.exportModal = new Modal(DOMUtils.querySelector('#exportModal'));
        
        // 属性面板
        this.components.propertyPanel = new PropertyPanel(DOMUtils.querySelector('#propertyPanel'));
        
        // Toast通知
        this.components.toast = new Toast(DOMUtils.querySelector('#toastContainer'));
        
        // 右键菜单
        this.components.contextMenu = new ContextMenu(DOMUtils.querySelector('#contextMenu'));
        this.setupContextMenu();
        
        // 设置初始激活状态
        this.components.addNodeBtn.setActive(true);
    }

    /**
     * 设置右键菜单
     */
    setupContextMenu() {
        this.components.contextMenu.addMenuItem('编辑标签', 'fa-edit', () => {
            this.editSelectedElementLabel();
        });
        
        this.components.contextMenu.addMenuItem('更改颜色', 'fa-palette', () => {
            this.changeSelectedElementColor();
        });
        
        this.components.contextMenu.addMenuItem('删除', 'fa-trash', () => {
            // 直接实现删除逻辑
            if (this.selectedEdge) {
                const edgeIndex = this.graph.edges.findIndex(edge => edge.id === this.selectedEdge.id);
                if (edgeIndex !== -1) {
                    this.graph.edges.splice(edgeIndex, 1);
                    this.renderGraph();
                    this.selectedEdge = null;
                    this.clearVisualSelection();
                }
            } else if (this.selectedNode) {
                const nodeIndex = this.graph.nodes.findIndex(node => node.id === this.selectedNode.id);
                if (nodeIndex !== -1) {
                    this.graph.nodes.splice(nodeIndex, 1);
                    // 删除相关边
                    this.graph.edges = this.graph.edges.filter(edge => 
                        edge.source !== this.selectedNode.id && edge.target !== this.selectedNode.id
                    );
                    this.renderGraph();
                    this.selectedNode = null;
                    this.clearVisualSelection();
                }
            }
        }, 'text-red-600');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 按钮事件
        this.setupButtonEvents();
        
        // SVG画布事件
        this.setupCanvasEvents();
        
        // 模态框事件
        this.setupModalEvents();
        
        // 文件输入事件
        this.setupFileEvents();
        
        // 属性面板事件
        this.setupPropertyPanelEvents();
        
        // 图特性事件
        this.setupGraphFeatureEvents();
        
        // 键盘事件
        this.setupKeyboardEvents();
    }

    /**
     * 设置按钮事件
     */
    setupButtonEvents() {
        // 模式按钮
        this.components.addNodeBtn.addEventListener('click', () => this.setMode('addNode'));
        this.components.addEdgeBtn.addEventListener('click', () => this.setMode('addEdge'));
        this.components.deleteBtn.addEventListener('click', () => this.setMode('delete'));
        
        // 其他按钮
        this.components.clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
        this.components.exportBtn.addEventListener('click', () => this.showExportModal());
        this.components.exportJsonBtn.addEventListener('click', () => this.exportGraphData());
        this.components.importJsonBtn.addEventListener('click', () => this.importGraphData());
        this.components.toggleModeBtn.addEventListener('click', () => this.toggleGraphMode());
    }

    /**
     * 设置画布事件
     */
    setupCanvasEvents() {
        const mouseHandler = this.eventManager.getMouse();
        
        mouseHandler.on('click', (data) => this.handleCanvasClick(data));
        mouseHandler.on('mousedown', (data) => this.handleNodeMouseDown(data));
        mouseHandler.on('mousemove', (data) => this.handleDragMove(data));
        mouseHandler.on('dragend', (data) => this.handleDragEnd(data));
        mouseHandler.on('contextmenu', (data) => this.handleRightClick(data));
    }

    /**
     * 设置模态框事件
     */
    setupModalEvents() {
        const exportModal = this.components.exportModal;
        
        DOMUtils.addEventListener(DOMUtils.querySelector('#cancelExportBtn'), 'click', () => {
            exportModal.close();
        });
        
        DOMUtils.addEventListener(DOMUtils.querySelector('#confirmExportBtn'), 'click', () => {
            this.performExport();
        });
        
        // 导出格式选择
        ['Jpg', 'Png', 'Svg', 'Pdf'].forEach(format => {
            DOMUtils.addEventListener(DOMUtils.querySelector(`#format${format}`), 'click', () => {
                this.selectExportFormat(format.toLowerCase());
            });
        });
        
        // 背景选择
        ['White', 'Transparent'].forEach(bg => {
            DOMUtils.addEventListener(DOMUtils.querySelector(`#bg${bg}`), 'click', () => {
                this.selectBackground(bg.toLowerCase());
            });
        });
        
        // 质量滑块
        const qualitySlider = DOMUtils.querySelector('#exportQuality');
        const qualityValue = DOMUtils.querySelector('#qualityValue');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValue.textContent = e.target.value;
                this.exportManager.setQuality(parseFloat(e.target.value));
            });
        }
    }

    /**
     * 设置文件事件
     */
    setupFileEvents() {
        const fileInput = DOMUtils.querySelector('#fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }
    }

    /**
     * 设置属性面板事件
     */
    setupPropertyPanelEvents() {
        this.components.propertyPanel.onUpdate = (elementType, elementId, property, value) => {
            this.updateElementProperty(elementType, elementId, property, value);
        };
        
        // 添加删除按钮事件监听（使用事件委托）
        document.addEventListener('click', (e) => {
            if (e.target.id === 'deleteElementBtn' || e.target.closest('#deleteElementBtn')) {
                // 直接实现删除逻辑
                if (this.selectedEdge) {
                    const edgeIndex = this.graph.edges.findIndex(edge => edge.id === this.selectedEdge.id);
                    if (edgeIndex !== -1) {
                        this.graph.edges.splice(edgeIndex, 1);
                        this.renderGraph();
                        this.selectedEdge = null;
                        this.clearVisualSelection();
                    }
                } else if (this.selectedNode) {
                    const nodeIndex = this.graph.nodes.findIndex(node => node.id === this.selectedNode.id);
                    if (nodeIndex !== -1) {
                        this.graph.nodes.splice(nodeIndex, 1);
                        // 删除相关边
                        this.graph.edges = this.graph.edges.filter(edge => 
                            edge.source !== this.selectedNode.id && edge.target !== this.selectedNode.id
                        );
                        this.renderGraph();
                        this.selectedNode = null;
                        this.clearVisualSelection();
                    }
                }
                this.saveCurrentState();
            }
        });
    }

    /**
     * 设置图特性事件
     */
    setupGraphFeatureEvents() {
        // 简单图选项
        const simpleGraphCheckbox = DOMUtils.querySelector('#simpleGraph');
        if (simpleGraphCheckbox) {
            simpleGraphCheckbox.addEventListener('change', (e) => {
                this.graphFeatures.simple = e.target.checked;
                
                // 更新UI状态
                const multiEdgesCheckbox = DOMUtils.querySelector('#allowMultiEdges');
                const selfLoopsCheckbox = DOMUtils.querySelector('#allowSelfLoops');
                
                if (e.target.checked) {
                    // 启用简单图模式
                    this.graphFeatures.allowMultiEdges = false;
                    this.graphFeatures.allowSelfLoops = false;
                    
                    if (multiEdgesCheckbox) {
                        multiEdgesCheckbox.checked = false;
                        multiEdgesCheckbox.disabled = true;
                    }
                    if (selfLoopsCheckbox) {
                        selfLoopsCheckbox.checked = false;
                        selfLoopsCheckbox.disabled = true;
                    }
                    
                    this.showToast('已启用简单图模式', 'info');
                } else {
                    // 禁用简单图模式
                    if (multiEdgesCheckbox) {
                        multiEdgesCheckbox.disabled = false;
                    }
                    if (selfLoopsCheckbox) {
                        selfLoopsCheckbox.disabled = false;
                    }
                    
                    this.showToast('已切换到自定义图模式', 'info');
                }
            });
            
            // 初始化时设置UI状态
            if (simpleGraphCheckbox.checked) {
                const multiEdgesCheckbox = DOMUtils.querySelector('#allowMultiEdges');
                const selfLoopsCheckbox = DOMUtils.querySelector('#allowSelfLoops');
                
                if (multiEdgesCheckbox) {
                    multiEdgesCheckbox.checked = false;
                    multiEdgesCheckbox.disabled = true;
                }
                if (selfLoopsCheckbox) {
                    selfLoopsCheckbox.checked = false;
                    selfLoopsCheckbox.disabled = true;
                }
            }
        }
        
        // 重边选项
        const multiEdgesCheckbox = DOMUtils.querySelector('#allowMultiEdges');
        if (multiEdgesCheckbox) {
            multiEdgesCheckbox.addEventListener('change', (e) => {
                this.graphFeatures.allowMultiEdges = e.target.checked;
                if (!this.graphFeatures.simple) {
                    this.showToast(e.target.checked ? '已启用重边支持' : '已禁用重边支持', 'info');
                }
            });
        }
        
        // 自环选项
        const selfLoopsCheckbox = DOMUtils.querySelector('#allowSelfLoops');
        if (selfLoopsCheckbox) {
            selfLoopsCheckbox.addEventListener('change', (e) => {
                this.graphFeatures.allowSelfLoops = e.target.checked;
                if (!this.graphFeatures.simple) {
                    this.showToast(e.target.checked ? '已启用自环支持' : '已禁用自环支持', 'info');
                }
            });
        }
        
        // 监听图类型变化，更新简单图状态
        const graphTypeRadios = DOMUtils.querySelectorAll('input[name="graphType"]');
        graphTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'directed') {
                    this.graphType = 'directed';
                } else {
                    this.graphType = 'undirected';
                }
                
                // 更新Graph对象的有向性
                this.graph.directed = (this.graphType === 'directed');
                this.renderGraph(); // 重新渲染以更新箭头显示
                this.saveCurrentState();
                this.showToast(`图类型已设置为${this.graphType === 'directed' ? '有向图' : '无向图'}`, 'success');
            });
        });
    }

    /**
     * 设置键盘事件
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Delete键删除选中元素
            if (e.key === 'Delete' || e.key === 'Del') {
                e.preventDefault();
                
                // 直接实现删除逻辑
                if (this.selectedEdge) {
                    const edgeIndex = this.graph.edges.findIndex(edge => edge.id === this.selectedEdge.id);
                    if (edgeIndex !== -1) {
                        this.graph.edges.splice(edgeIndex, 1);
                        this.renderGraph();
                        this.selectedEdge = null;
                        this.clearVisualSelection();
                    }
                } else if (this.selectedNode) {
                    const nodeIndex = this.graph.nodes.findIndex(node => node.id === this.selectedNode.id);
                    if (nodeIndex !== -1) {
                        this.graph.nodes.splice(nodeIndex, 1);
                        // 删除相关边
                        this.graph.edges = this.graph.edges.filter(edge => 
                            edge.source !== this.selectedNode.id && edge.target !== this.selectedNode.id
                        );
                        this.renderGraph();
                        this.selectedNode = null;
                        this.clearVisualSelection();
                    }
                }
                this.saveCurrentState();
            }
        });
    }

    /**
     * 加载保存的状态
     */
    loadSavedState() {
        console.log('=== 开始加载保存状态 ===');
        console.log('加载前的graph对象:', this.graph);
        
        const savedGraph = StorageUtils.load('graph');
        if (savedGraph) {
            try {
                const newGraph = Graph.fromJSON(savedGraph);
                
                // 更新this.graph引用
                this.graph = newGraph;
                
                // 更新所有持有graph引用的管理器
                if (this.exportManager) {
                    this.exportManager.graph = this.graph;
                }
                if (this.importManager) {
                    this.importManager.graph = this.graph;
                }
                
                this.renderGraph();
                this.showToast('已加载保存的图形', 'success');
            } catch (error) {
                console.error('加载保存状态失败:', error);
            }
        }
    }

    /**
     * 保存当前状态
     */
    saveCurrentState() {
        StorageUtils.save('graph', this.graph.toJSON());
    }

    // === 模式和状态管理 ===

    /**
     * 设置当前模式
     */
    setMode(mode) {
        this.currentMode = mode;
        
        // 更新按钮状态
        Object.keys(this.components).forEach(key => {
            if (this.components[key] instanceof Button && key.endsWith('Btn')) {
                this.components[key].setActive(false);
            }
        });
        
        const modeBtn = this.components[`${mode}Btn`];
        if (modeBtn) {
            modeBtn.setActive(true);
        }
        
        // 更新鼠标样式
        this.updateCursorStyle();
        
        // 重置选择状态
        this.resetSelection();
    }

    /**
     * 更新鼠标样式
     */
    updateCursorStyle() {
        switch (this.currentMode) {
            case 'addNode':
                this.svgElement.style.cursor = 'crosshair';
                this.setEdgesHoverEffect(false);
                break;
            case 'addEdge':
                this.svgElement.style.cursor = 'pointer';
                this.setEdgesHoverEffect(true);
                break;
            case 'delete':
                this.svgElement.style.cursor = 'not-allowed';
                this.setEdgesHoverEffect(true);
                break;
        }
    }

    /**
     * 设置边的悬停效果
     */
    setEdgesHoverEffect(enable) {
        const edges = this.edgesGroup.querySelectorAll('.edge');
        edges.forEach(edge => {
            if (enable) {
                edge.classList.remove('no-hover');
            } else {
                edge.classList.add('no-hover');
            }
        });
    }

    /**
     * 重置选择状态
     */
    resetSelection() {
        this.edgeStart = null;
        this.selectedNode = null;
        this.selectedEdge = null;
        this.clearVisualSelection();
        this.components.propertyPanel.reset();
    }

    // === 图形操作方法 ===

    /**
     * 处理画布点击
     */
    handleCanvasClick(data) {
        const { event } = data;
        const target = event.target;
        
        console.log('Canvas clicked:', target, 'mode:', this.currentMode);
        
        // 点击空白处
        if (target === this.svgElement || target.tagName === 'rect') {
            const coords = DOMUtils.getSvgCoordinates(this.svgElement, event.clientX, event.clientY);
            console.log('Adding node at coordinates:', coords);
            
            if (this.currentMode === 'addNode') {
                this.addNode(coords.x, coords.y);
            } else if (this.currentMode === 'select') {
                this.resetSelection();
            }
        }
    }

    /**
     * 添加节点
     */
    addNode(x, y) {
        console.log('=== 开始添加节点 ===');
        console.log('传入坐标:', x, y);
        console.log('当前图对象:', this.graph);
        console.log('添加前节点数量:', this.graph.nodes.length);
        
        // 在微点模式下，节点默认形状为circle，颜色为黑色
        const node = this.graph.addNode(x, y, undefined, this.graphMode === 'dot' ? '#000000' : undefined, this.graphMode === 'dot' ? 'circle' : 'circle');
        
        console.log('创建的节点:', node);
        console.log('添加后节点数量:', this.graph.nodes.length);
        console.log('当前所有节点:', this.graph.nodes);
        
        this.renderNode(node);
        this.saveCurrentState();
        this.showToast('节点已添加', 'success');
        
        console.log('=== 节点添加完成 ===');
    }

    /**
     * 切换图模式（圆点模式/微点模式）
     */
    toggleGraphMode() {
        if (this.graphMode === 'circle') {
            this.graphMode = 'dot';
            this.components.toggleModeBtn.element.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>切换到圆点模式';
            this.showToast('已切换到微点模式', 'info');
        } else {
            this.graphMode = 'circle';
            this.components.toggleModeBtn.element.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>切换到微点模式';
            this.showToast('已切换到圆点模式', 'info');
        }
        
        // 重新渲染整个图
        this.renderGraph();
    }

    /**
     * 渲染节点
     */
    renderNode(node) {
        if (this.graphMode === 'circle') {
            // 圆点模式 - 保持原有的圆点和标签在圆内显示
            this.renderNodeAsCircle(node);
        } else {
            // 微点模式 - 小点半径，标签在旁边
            this.renderNodeAsDot(node);
        }
    }

    /**
     * 以圆点模式渲染节点
     */
    renderNodeAsCircle(node) {
        const g = DOMUtils.createSvgElement('g', {
            id: node.id,
            class: 'node',
            transform: `translate(${node.x}, ${node.y})`
        });
        
        const circle = DOMUtils.createSvgElement('circle', {
            r: '20',
            fill: node.color,
            stroke: 'white',
            'stroke-width': '3'
        });
        
        const text = DOMUtils.createSvgElement('text', {
            'text-anchor': 'middle',
            dy: '5',
            fill: ColorUtils.getContrastTextColor(node.color),
            'font-weight': 'bold'
        });
        text.textContent = node.label;
        
        g.appendChild(circle);
        g.appendChild(text);
        
        // 添加事件监听
        g.addEventListener('click', (e) => this.handleNodeClick(e, node));
        g.addEventListener('mousedown', (e) => this.handleNodeMouseDownDirect(e, node));
        
        this.nodesGroup.appendChild(g);
    }

    /**
     * 以微点模式渲染节点
     */
    renderNodeAsDot(node) {
        // 微点模式：点半径缩小到原来的1/5（即4像素）
        const g = DOMUtils.createSvgElement('g', {
            id: node.id,
            class: 'node',
            transform: `translate(${node.x}, ${node.y})`
        });
        
        // 根据形状创建不同的图形
        let shapeElement;
        switch(node.shape) {
            case 'triangle':
                // 创建三角形
                shapeElement = DOMUtils.createSvgElement('polygon', {
                    points: '-5,2.9 0,-5 5,2.9',  // 调大一点点
                    fill: '#000000',
                    stroke: '#000000',
                    'stroke-width': '1'
                });
                break;
            case 'square':
                // 创建正方形
                shapeElement = DOMUtils.createSvgElement('rect', {
                    x: '-5',
                    y: '-5',
                    width: '10',
                    height: '10',
                    fill: '#000000',
                    stroke: '#000000',
                    'stroke-width': '1'
                });
                break;
            case 'star':
                // 创建五角星
                const starPoints = [];
                for (let i = 0; i < 10; i++) {
                    const angle = Math.PI / 2 + (i * Math.PI) / 5;
                    const radius = i % 2 === 0 ? 5 : 2;  // 调大一点
                    const x = Math.cos(angle) * radius;
                    const y = -Math.sin(angle) * radius;
                    starPoints.push(`${x},${y}`);
                }
                shapeElement = DOMUtils.createSvgElement('polygon', {
                    points: starPoints.join(' '),
                    fill: '#000000',
                    stroke: '#000000',
                    'stroke-width': '1'
                });
                break;
            case 'circle':
            default:
                // 默认圆形
                shapeElement = DOMUtils.createSvgElement('circle', {
                    r: '5',
                    fill: '#000000',
                    stroke: '#000000',
                    'stroke-width': '1'
                });
        }
        
        // 标签放在点旁边，避免遮挡边
        const text = DOMUtils.createSvgElement('text', {
            'text-anchor': 'start',
            dx: '8',
            dy: '-8',
            fill: '#000000',
                        'font-weight': 'normal',
            'font-size': '18px'
        });
        text.textContent = node.label;
        
        g.appendChild(shapeElement);
        g.appendChild(text);
        
        // 添加事件监听 - 点击点或标签都可以选中
        g.addEventListener('click', (e) => this.handleNodeClick(e, node));
        g.addEventListener('mousedown', (e) => this.handleNodeMouseDownDirect(e, node));
        
        this.nodesGroup.appendChild(g);
    }

    /**
     * 处理节点点击
     */
    handleNodeClick(event, node) {
        event.stopPropagation();
        
        if (this.currentMode === 'addEdge') {
            if (!this.edgeStart) {
                this.edgeStart = node;
                this.showToast('选择第二个节点创建边', 'info');
            } else {
                this.addEdge(this.edgeStart, node);
                this.edgeStart = null;
            }
        } else if (this.currentMode === 'addNode') {
            if (this.isDragging) return;
            this.selectNode(node);
        } else if (this.currentMode === 'delete') {
            this.deleteNode(node);
        }
    }

    /**
     * 处理节点鼠标按下（直接事件）
     */
    handleNodeMouseDownDirect(event, node) {
        if (this.currentMode === 'addNode') {
            this.isDragging = false;
            this.draggedNode = node;
            event.preventDefault();
            
            // 拖拽开始时选中节点并显示属性
            this.selectNode(node);
            
            // 在 SVG 上监听 mousemove 和 mouseup，确保拖拽流畅
            const svgHandler = (e) => this.handleSvgMouseMove(e);
            const endHandler = (e) => this.handleSvgMouseUp(e);
            
            this.svgElement.addEventListener('mousemove', svgHandler);
            this.svgElement.addEventListener('mouseleave', endHandler);
            document.addEventListener('mouseup', endHandler);
            
            // 保存清理函数
            this.cleanupDragListeners = () => {
                this.svgElement.removeEventListener('mousemove', svgHandler);
                this.svgElement.removeEventListener('mouseleave', endHandler);
                document.removeEventListener('mouseup', endHandler);
            };
        }
    }

    /**
     * 处理SVG鼠标移动
     */
    handleSvgMouseMove(event) {
        if (this.draggedNode && this.currentMode === 'addNode') {
            const rect = this.svgElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // 检查是否开始拖拽
            if (!this.isDragging) {
                const startX = this.draggedNode.x;
                const startY = this.draggedNode.y;
                const distance = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                if (distance > 3) {
                    this.isDragging = true;
                }
            }
            
            if (this.isDragging) {
                this.draggedNode.setPosition(x, y);
                const nodeElement = DOMUtils.querySelector(`#${this.draggedNode.id}`);
                if (nodeElement) {
                    nodeElement.setAttribute('transform', `translate(${x}, ${y})`);
                    this.updateEdges();
                }
                
                // 实时更新属性面板中的位置信息
                this.components.propertyPanel.updateNodePosition(this.draggedNode);
            }
        }
    }

    /**
     * 处理SVG鼠标抬起
     */
    handleSvgMouseUp(event) {
        if (this.cleanupDragListeners) {
            this.cleanupDragListeners();
            this.cleanupDragListeners = null;
        }
        
        if (this.isDragging && this.draggedNode) {
            // 拖拽结束后选中该节点并显示属性
            this.selectNode(this.draggedNode);
            this.saveCurrentState();
        }
        this.isDragging = false;
        this.draggedNode = null;
    }

    /**
     * 处理节点鼠标按下
     */
    handleNodeMouseDown(data) {
        // 这个方法现在通过直接事件处理
        // 保留空实现以避免事件管理器报错
    }

    /**
     * 处理拖拽移动
     */
    handleDragMove(data) {
        // 拖拽处理现在通过直接事件处理
        // 保留空实现以避免事件管理器报错
    }

    /**
     * 处理拖拽结束
     */
    handleDragEnd(data) {
        // 拖拽处理现在通过直接事件处理
        // 保留空实现以避免事件管理器报错
    }

    /**
     * 选择节点
     */
    selectNode(node) {
        this.clearVisualSelection();
        this.selectedNode = node;
        this.selectedEdge = null;  // 清除选中的边
        const nodeElement = DOMUtils.querySelector(`#${node.id}`);
        if (nodeElement) {
            DOMUtils.addClass(nodeElement, 'selected');
        }
        if (this.graphMode === 'dot') {
            // 微点模式：只显示标签设置，不显示颜色设置
            this.components.propertyPanel.showNodePropertiesForDotMode(
                node, 
                this.updateElementProperty.bind(this)
            );
        } else {
            // 圆点模式：显示完整的属性设置
            this.components.propertyPanel.showNodeProperties(
                node, 
                this.updateElementProperty.bind(this)
            );
        }
    }

    /**
     * 添加边
     */
    addEdge(sourceNode, targetNode) {
        try {
            // 检查图特性限制
            if (this.graphFeatures.simple) {
                // 简单图模式：不允许重边和自环
                if (sourceNode.id === targetNode.id) {
                    this.showToast('简单图不支持自环', 'warning');
                    return;
                }
                
                // 检查是否已存在相同的边
                const existingEdge = this.graph.edges.find(edge => 
                    (edge.source === sourceNode.id && edge.target === targetNode.id) ||
                    (!this.graph.directed && edge.source === targetNode.id && edge.target === sourceNode.id)
                );
                
                if (existingEdge) {
                    this.showToast('简单图不支持重边', 'warning');
                    return;
                }
            } else {
                // 非简单图模式：检查单独的选项
                if (sourceNode.id === targetNode.id && !this.graphFeatures.allowSelfLoops) {
                    this.showToast('未启用自环支持', 'warning');
                    return;
                }
                
                if (!this.graphFeatures.allowMultiEdges) {
                    // 检查是否已存在相同的边
                    const existingEdge = this.graph.edges.find(edge => 
                        (edge.source === sourceNode.id && edge.target === targetNode.id) ||
                        (!this.graph.directed && edge.source === targetNode.id && edge.target === sourceNode.id)
                    );
                    
                    if (existingEdge) {
                        this.showToast('未启用重边支持', 'warning');
                        return;
                    }
                }
            }
            
            const edge = this.graph.addEdge(sourceNode.id, targetNode.id);
            this.updateEdges();
            this.saveCurrentState();
            this.showToast('边已添加', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * 更新边的渲染
     */
    updateEdges() {
        this.edgesGroup.innerHTML = '';
        this.graph.edges.forEach(edge => this.renderEdge(edge));
    }

    /**
     * 渲染边
     */
    renderEdge(edge) {
        const sourceNode = this.graph.getNode(edge.source);
        const targetNode = this.graph.getNode(edge.target);
        
        if (!sourceNode || !targetNode) return;
        
        const edgeColor = edge.color || '#6b7280';
        const isSelfLoop = edge.source === edge.target;
        
        // 计算同一对节点之间相同方向的所有边，确定当前边的索引和总数
        const sameDirectionEdges = this.graph.edges.filter(e => {
            return e.source === edge.source && e.target === edge.target;
        });
        const edgeIndex = sameDirectionEdges.indexOf(edge);
        const totalSameDirection = sameDirectionEdges.length;
        
        // 创建一个 g 元素包裹边的所有部分
        const g = DOMUtils.createSvgElement('g', {
            id: edge.id
        });
        
        let pathD, labelX, labelY;
        
        if (isSelfLoop) {
            // ====== 自环 ======
            const loopRadius = 25 + edgeIndex * 15;
            const cx = sourceNode.x;
            const cy = sourceNode.y - (this.graphMode === 'dot' ? 0 : 20); // 从节点顶部出发
            
            // 自环路径：从节点顶部左侧出发，画一个圆弧回到顶部右侧
            const startAngle = -Math.PI * 0.75;
            const endAngle = -Math.PI * 0.25;
            const offset = this.graphMode === 'dot' ? 0 : 20;
            const sx = sourceNode.x + offset * Math.cos(startAngle);
            const sy = sourceNode.y + offset * Math.sin(startAngle);
            const ex = sourceNode.x + offset * Math.cos(endAngle);
            const ey = sourceNode.y + offset * Math.sin(endAngle);
            
            // 控制点在节点上方
            const cpx = sourceNode.x;
            const cpy = sourceNode.y - 20 - loopRadius * 2;
            const cp1x = sx - loopRadius;
            const cp1y = sy - loopRadius * 1.5;
            const cp2x = ex + loopRadius;
            const cp2y = ey - loopRadius * 1.5;
            
            pathD = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
            labelX = cpx;
            labelY = sourceNode.y - 20 - loopRadius * 0.5;  // 标签显示在节点上方，距离更近
        } else {
            // ====== 普通边或重边 ======
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) return;
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            // 法线方向（垂直于边的方向）
            const normalX = -unitY;
            const normalY = unitX;
            
            const startX = sourceNode.x + unitX * (this.graphMode === 'dot' ? 0 : 20);
            const startY = sourceNode.y + unitY * (this.graphMode === 'dot' ? 0 : 20);
            const endX = targetNode.x - unitX * (this.graphMode === 'dot' ? 0 : 20);
            const endY = targetNode.y - unitY * (this.graphMode === 'dot' ? 0 : 20);
            
            if (totalSameDirection === 1) {
                // 单条边：直线
                pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                labelX = (startX + endX) / 2;
                labelY = (startY + endY) / 2;
            } else {
                // 重边：用弧形
                let curveOffset = 0;
                if (edgeIndex > 0) {
                    const level = Math.ceil(edgeIndex / 2);
                    const sign = (edgeIndex % 2 === 1) ? 1 : -1;
                    curveOffset = sign * level * 50;
                }
                
                if (curveOffset === 0) {
                    pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                    labelX = (startX + endX) / 2;
                    labelY = (startY + endY) / 2;
                } else {
                    // 二次贝塞尔曲线的控制点
                    const midX = (startX + endX) / 2 + normalX * curveOffset;
                    const midY = (startY + endY) / 2 + normalY * curveOffset;
                    
                    pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
                    // 标签位置在曲线的 1/4 处
                    labelX = (startX + 2 * midX + endX) / 4;
                    labelY = (startY + 2 * midY + endY) / 4;
                }
            }
        }
        
        // 不可见的宽击打区域
        const hitArea = DOMUtils.createSvgElement('path', {
            class: 'edge-hit-area',
            d: pathD
        });
        
        const path = DOMUtils.createSvgElement('path', {
            class: 'edge',
            d: pathD,
            stroke: edgeColor
        });
        
        console.log('Edge path:', pathD);
        console.log('Graph directed:', this.graph.directed);
        
        // 根据当前模式设置悬停效果
        if (this.currentMode === 'addNode') {
            path.classList.add('no-hover');
        }
        
        if (this.graph.directed) {
            // 为每种颜色创建唯一的marker ID
            const markerId = `arrowhead-${edgeColor.replace('#', '')}`;
            
            // 检查是否已存在该颜色的marker
            if (!document.getElementById(markerId)) {
                // 动态创建marker
                const defs = this.svgElement.querySelector('defs');
                const marker = DOMUtils.createSvgElement('marker', {
                    id: markerId,
                    markerWidth: this.graphMode === 'circle' ? '12' : '8',
                    markerHeight: this.graphMode === 'circle' ? '12' : '8',
                    refX: '8',  // 指向尖端位置
                    refY: '3',
                    orient: 'auto',
                    class: 'arrow-marker',
                    viewBox: '0 0 12 12'
                });
                
                // 创建 ">" 形状的箭头（只用三角形，不要线段）
                const arrow = DOMUtils.createSvgElement('polygon', {
                    points: '4,0 8,3 4,6',  // 保持尖端在(8,3)，宽度增加两倍，长度缩短一半
                    fill: edgeColor
                });
                
                console.log('Creating arrow marker:', markerId, 'with points:', this.graphMode === 'circle' ? '0,0 16,3 0,6' : '0,0 4,2 0,4');
                
                marker.appendChild(arrow);
                defs.appendChild(marker);
            }
            
            path.setAttribute('marker-end', `url(#${markerId})`);
            console.log('Applied marker to path:', markerId);
        }
        
        g.appendChild(hitArea);
        g.appendChild(path);
        
        // 渲染边标签
        if (edge.label) {
            const labelBg = DOMUtils.createSvgElement('rect', {
                x: labelX - 15,
                y: labelY - 10,
                width: '30',
                height: '20',
                rx: '4',
                fill: 'white',
                stroke: '#e5e7eb',
                class: 'edge-label-bg'
            });
            
            const text = DOMUtils.createSvgElement('text', {
                class: 'edge-label',
                x: labelX,
                y: labelY + 4,
                'text-anchor': 'middle'
            });
            text.textContent = edge.label;
            
            g.appendChild(labelBg);
            g.appendChild(text);
            
            requestAnimationFrame(() => {
                const bbox = text.getBBox();
                if (bbox.width > 0) {
                    labelBg.setAttribute('x', bbox.x - 4);
                    labelBg.setAttribute('y', bbox.y - 2);
                    labelBg.setAttribute('width', bbox.width + 8);
                    labelBg.setAttribute('height', bbox.height + 4);
                }
            });
        }
        
        // 点击事件
        const handleEdgeClick = (e) => {
            e.stopPropagation();
            if (this.currentMode === 'delete') {
                this.deleteEdge(edge);
            } else if (this.currentMode === 'addEdge') {
                // 在添加边模式下，点击边实现选中功能
                this.clearVisualSelection();
                path.classList.add('selected');
                path.setAttribute('stroke', '#8b5cf6');
                // 重新设置marker以使用选中颜色
                const selectedMarkerId = 'arrowhead-8b5cf6';
                if (!document.getElementById(selectedMarkerId)) {
                    const defs = this.svgElement.querySelector('defs');
                    const marker = DOMUtils.createSvgElement('marker', {
                        id: selectedMarkerId,
                        markerWidth: this.graphMode === 'circle' ? '12' : '8',
                        markerHeight: this.graphMode === 'circle' ? '12' : '8',
                        refX: '8',  // 指向尖端位置
                        refY: '3',
                        orient: 'auto',
                        class: 'arrow-marker',
                        viewBox: '0 0 12 12'
                    });
                    
                    // 创建 ">" 形状的选中箭头
                    const arrow = DOMUtils.createSvgElement('polygon', {
                        points: '4,0 8,3 4,6',  // 保持尖端在(8,3)，宽度增加两倍，长度缩短一半
                        fill: '#8b5cf6'
                    });
                    
                    marker.appendChild(arrow);
                    defs.appendChild(marker);
                }
                path.setAttribute('marker-end', 'url(#arrowhead-8b5cf6)');
                this.selectedEdge = edge;  // 设置选中的边
                this.showEdgeProperties(edge);
            }
        };
        
        hitArea.addEventListener('click', handleEdgeClick);
        path.addEventListener('click', handleEdgeClick);
        
        this.edgesGroup.appendChild(g);
    }

    /**
     * 显示边属性
     */
    showEdgeProperties(edge) {
        const sourceNode = this.graph.getNode(edge.source);
        const targetNode = this.graph.getNode(edge.target);
        this.components.propertyPanel.showEdgeProperties(
            edge, 
            sourceNode, 
            targetNode, 
            this.updateElementProperty.bind(this)
        );
    }

    /**
     * 删除边
     */
    deleteEdge(edge) {
        console.log('Deleting edge with ID:', edge.id);
        this.graph.deleteEdge(edge.id);
        this.renderGraph();
        this.saveCurrentState();
        this.showToast('边已删除', 'success');
    }
    deleteNode(node) {
        this.graph.deleteNode(node.id);
        this.renderGraph();
        this.saveCurrentState();
        this.showToast('节点已删除', 'success');
    }

    /**
     * 清除视觉选择
     */
    clearVisualSelection() {
        DOMUtils.querySelectorAll('.node').forEach(node => {
            DOMUtils.removeClass(node, 'selected');
        });
        DOMUtils.querySelectorAll('.edge').forEach(edge => {
            DOMUtils.removeClass(edge, 'selected');
            // 恢复边的原始颜色
            const edgeId = edge.parentElement.id.replace('edge-', '');
            const edgeObj = this.graph.getEdge(edgeId);
            if (edgeObj) {
                const originalColor = edgeObj.color || '#6b7280';
                edge.setAttribute('stroke', originalColor);
                
                // 恢复原始的marker
                const originalMarkerId = `arrowhead-${originalColor.replace('#', '')}`;
                edge.setAttribute('marker-end', `url(#${originalMarkerId})`);
            }
        });
        this.selectedEdge = null;  // 清除选中的边
    }

    /**
     * 渲染整个图形
     */
    renderGraph() {
        this.nodesGroup.innerHTML = '';
        this.edgesGroup.innerHTML = '';
        this.graph.nodes.forEach(node => this.renderNode(node));
        this.graph.edges.forEach(edge => this.renderEdge(edge));
    }

    // === 图类型相关方法 ===

    /**
     * 设置图类型
     */
    setGraphType(type) {
        const isDirected = type === 'directed';
        this.graph.setDirected(isDirected);
        
        // 重新渲染所有边
        this.updateEdges();
        
        this.showToast(`切换到${isDirected ? '有向' : '无向'}图`, 'info');
        console.log('Graph type set to:', type, 'Directed:', isDirected);
    }

    // === 布局相关方法 ===

    // === 导出/导入相关方法 ===

    /**
     * 显示导出模态框
     */
    showExportModal() {
        this.components.exportModal.open();
        this.selectExportFormat('svg');
        this.selectBackground('white');
    }

    /**
     * 选择导出格式
     */
    selectExportFormat(format) {
        this.exportManager.setFormat(format);
        // 更新UI选中状态
        DOMUtils.querySelectorAll('.export-format-btn').forEach(btn => {
            DOMUtils.removeClass(btn, 'bg-purple-600', 'text-white');
            DOMUtils.addClass(btn, 'bg-gray-100');
        });
        
        const selectedBtn = DOMUtils.querySelector(`#format${format.charAt(0).toUpperCase() + format.slice(1)}`);
        if (selectedBtn) {
            DOMUtils.removeClass(selectedBtn, 'bg-gray-100');
            DOMUtils.addClass(selectedBtn, 'bg-purple-600', 'text-white');
        }
        
        // 显示/隐藏相关选项
        const qualitySection = DOMUtils.querySelector('#qualitySection');
        const backgroundSection = DOMUtils.querySelector('#backgroundSection');
        
        if (format === 'jpg') {
            qualitySection.style.display = 'block';
            backgroundSection.style.display = 'none';
        } else if (format === 'png' || format === 'svg') {
            qualitySection.style.display = 'none';
            backgroundSection.style.display = 'block';
        } else {
            qualitySection.style.display = 'none';
            backgroundSection.style.display = 'none';
        }
    }

    /**
     * 选择背景
     */
    selectBackground(bg) {
        this.exportManager.setBackground(bg);
        // 更新UI选中状态
        DOMUtils.querySelectorAll('.bg-option').forEach(opt => {
            DOMUtils.removeClass(opt, 'selected');
        });
        
        const selectedOption = DOMUtils.querySelector(`#bg${bg.charAt(0).toUpperCase() + bg.slice(1)}`);
        if (selectedOption) {
            DOMUtils.addClass(selectedOption, 'selected');
        }
    }

    /**
     * 执行导出
     */
    async performExport() {
        try {
            const fileName = DOMUtils.querySelector('#exportFileName').value || 'graph';
            await this.exportManager.export(this.exportManager.selectedFormat, fileName);
            this.components.exportModal.close();
            this.showToast(`已导出为 ${this.exportManager.selectedFormat.toUpperCase()} 格式`, 'success');
        } catch (error) {
            this.showToast(`导出失败: ${error.message}`, 'error');
        }
    }

    /**
     * 导出图数据
     */
    exportGraphData() {
        try {
            this.exportManager.exportGraphData();
            this.showToast('图数据已导出', 'success');
        } catch (error) {
            this.showToast(`导出失败: ${error.message}`, 'error');
        }
    }

    /**
     * 导入图数据
     */
    importGraphData() {
        DOMUtils.querySelector('#fileInput').click();
    }

    /**
     * 处理文件导入
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const result = await this.importManager.importFromFile(file);
            this.renderGraph();
            this.saveCurrentState();
            this.showToast(`成功导入 ${result.nodeCount} 个节点和 ${result.edgeCount} 条边`, 'success');
        } catch (error) {
            this.showToast(`导入失败: ${error.message}`, 'error');
        }
        
        // 清空文件输入
        event.target.value = '';
    }

    // === 属性更新方法 ===

    /**
     * 更新元素属性
     */
    updateElementProperty(elementType, elementId, property, value) {
        if (elementType === 'node') {
            const node = this.graph.getNode(elementId);
            if (node) {
                switch (property) {
                    case 'label':
                        node.setLabel(value);
                        this.updateNodeLabel(node);
                        break;
                    case 'color':
                        node.setColor(value);
                        this.updateNodeColor(node);
                        break;
                    case 'shape':
                        node.setShape(value);
                        this.updateNodeShape(node);
                        break;
                    case 'position_x':
                        node.setPosition(value, node.y);
                        this.updateNodePosition(node);
                        // 更新拖拽相关状态
                        if (this.draggedNode && this.draggedNode.id === node.id) {
                            this.draggedNode = node;
                        }
                        break;
                    case 'position_y':
                        node.setPosition(node.x, value);
                        this.updateNodePosition(node);
                        // 更新拖拽相关状态
                        if (this.draggedNode && this.draggedNode.id === node.id) {
                        this.draggedNode = node;
                        }
                        break;
                }
                this.saveCurrentState();
                this.showToast('属性已更新', 'success');
            }
        } else if (elementType === 'edge') {
            const edge = this.graph.getEdge(elementId);
            if (edge) {
                switch (property) {
                    case 'label':
                        edge.setLabel(value);
                        break;
                    case 'color':
                        edge.setColor(value);
                        break;
                    case 'weight':
                        edge.setWeight(parseFloat(value) || 1);
                        break;
                }
                this.updateEdges();
                this.saveCurrentState();
                this.showToast('属性已更新', 'success');
            }
        }
    }

    /**
     * 更新节点标签显示
     */
    updateNodeLabel(node) {
        const nodeElement = DOMUtils.querySelector(`#${node.id}`);
        if (nodeElement) {
            const textElement = nodeElement.querySelector('text');
            if (textElement) {
                textElement.textContent = node.label;
            }
        }
    }

    /**
     * 更新节点颜色显示
     */
    updateNodeColor(node) {
        const nodeElement = DOMUtils.querySelector(`#${node.id}`);
        if (nodeElement) {
            const circleElement = nodeElement.querySelector('circle');
            const textElement = nodeElement.querySelector('text');
            if (circleElement) {
                circleElement.setAttribute('fill', node.color);
            }
            if (textElement) {
                textElement.setAttribute('fill', ColorUtils.getContrastTextColor(node.color));
            }
        }
    }

    /**
     * 更新节点形状显示
     */
    updateNodeShape(node) {
        // 重新渲染整个节点以应用新的形状
        const existingElement = DOMUtils.querySelector(`#${node.id}`);
        if (existingElement) {
            existingElement.remove();
        }
        this.renderNode(node);
    }

    /**
     * 更新节点位置显示
     */
    updateNodePosition(node) {
        const nodeElement = DOMUtils.querySelector(`#${node.id}`);
        if (nodeElement) {
            // 更新节点的transform属性
            nodeElement.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            // 更新相关边的显示
            this.updateEdges();
        }
        
        // 更新属性面板中的位置显示
        if (this.components.propertyPanel) {
            this.components.propertyPanel.updateNodePosition(node);
        }
    }

    /**
     * 删除选中的元素
     */
    // === 右键菜单方法 ===

    /**
     * 处理右键点击
     */
    handleRightClick(data) {
        const { event } = data;
        const target = event.target.closest('.node');
        if (target) {
            const nodeId = target.id;
            const node = this.graph.getNode(nodeId);
            if (node) {
                this.selectedNode = node;
                this.components.contextMenu.open(event.pageX, event.pageY);
            }
        }
    }

    /**
     * 编辑选中元素标签
     */
    editSelectedElementLabel() {
        if (this.selectedNode) {
            const newLabel = prompt('输入新标签:', this.selectedNode.label);
            if (newLabel) {
                this.updateElementProperty('node', this.selectedNode.id, 'label', newLabel);
            }
        }
    }

    /**
     * 更改选中元素颜色
     */
    changeSelectedElementColor() {
        if (this.selectedNode) {
            const newColor = ColorUtils.getRandomColor();
            this.updateElementProperty('node', this.selectedNode.id, 'color', newColor);
        }
    }

    /**
     * 删除选中元素
     */
    // === 清空画布 ===

    /**
     * 清空画布
     */
    clearCanvas() {
        if (confirm('确定要清空画布吗？')) {
            this.graph.clear();
            this.renderGraph();
            this.resetSelection();
            this.saveCurrentState();
            this.showToast('画布已清空', 'success');
        }
    }

    // === 通知方法 ===

    /**
     * 显示Toast通知
     */
    showToast(message, type = 'info', duration = 3000) {
        this.components.toast.show(message, type, duration);
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.graphEditor = new GraphEditor();
        
        // 全局函数，供HTML调用
        window.setGraphType = (type) => {
            if (window.graphEditor) {
                window.graphEditor.setGraphType(type);
            }
        };
        
        window.setMode = (mode) => {
            if (window.graphEditor) {
                window.graphEditor.setMode(mode);
            }
        };
        
    } catch (error) {
        console.error('应用启动失败:', error);
        alert('应用启动失败，请检查控制台错误信息');
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

export default GraphEditor;