import { DOMUtils, ColorUtils } from '../utils/helpers.js';

/**
 * UI组件基类
 */
export class UIComponent {
    constructor(element) {
        this.element = element;
        this.eventListeners = [];
    }

    /**
     * 添加事件监听器
     */
    addEventListener(event, handler) {
        DOMUtils.addEventListener(this.element, event, handler);
        this.eventListeners.push({ event, handler });
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(event, handler) {
        DOMUtils.removeEventListener(this.element, event, handler);
        this.eventListeners = this.eventListeners.filter(
            listener => listener.event !== event || listener.handler !== handler
        );
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.eventListeners.forEach(({ event, handler }) => {
            DOMUtils.removeEventListener(this.element, event, handler);
        });
        this.eventListeners = [];
    }

    /**
     * 显示组件
     */
    show() {
        DOMUtils.show(this.element);
    }

    /**
     * 隐藏组件
     */
    hide() {
        DOMUtils.hide(this.element);
    }

    /**
     * 切换显示状态
     */
    toggle() {
        DOMUtils.toggle(this.element);
    }
}

/**
 * 按钮组件
 */
export class Button extends UIComponent {
    constructor(element) {
        super(element);
        this.isActive = false;
    }

    /**
     * 设置激活状态
     */
    setActive(active) {
        this.isActive = active;
        if (active) {
            DOMUtils.addClass(this.element, 'active');
        } else {
            DOMUtils.removeClass(this.element, 'active');
        }
    }

    /**
     * 检查是否激活
     */
    getActive() {
        return this.isActive;
    }

    /**
     * 设置禁用状态
     */
    setDisabled(disabled) {
        this.element.disabled = disabled;
        if (disabled) {
            DOMUtils.addClass(this.element, 'disabled');
            DOMUtils.addClass(this.element, 'opacity-50');
            DOMUtils.addClass(this.element, 'cursor-not-allowed');
        } else {
            DOMUtils.removeClass(this.element, 'disabled');
            DOMUtils.removeClass(this.element, 'opacity-50');
            DOMUtils.removeClass(this.element, 'cursor-not-allowed');
        }
    }
}

/**
 * 模态框组件
 */
export class Modal extends UIComponent {
    constructor(element) {
        super(element);
        this.isOpen = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 点击背景关闭模态框
        this.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });
    }

    /**
     * 打开模态框
     */
    open() {
        this.isOpen = true;
        DOMUtils.removeClass(this.element, 'hidden');
        document.body.style.overflow = 'hidden';
        this.emit('open');
    }

    /**
     * 关闭模态框
     */
    close() {
        this.isOpen = false;
        DOMUtils.addClass(this.element, 'hidden');
        document.body.style.overflow = '';
        this.emit('close');
    }

    /**
     * 切换模态框状态
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * 检查是否打开
     */
    isOpen() {
        return this.isOpen;
    }

    /**
     * 触发自定义事件
     */
    emit(eventName) {
        const event = new CustomEvent(eventName, { bubbles: true });
        this.element.dispatchEvent(event);
    }
}

/**
 * 颜色选择器组件
 */
export class ColorPicker extends UIComponent {
    constructor(element, colors = ColorUtils.COMMON_COLORS) {
        super(element);
        this.colors = colors;
        this.selectedColor = colors[0];
        this.createColorOptions();
        this.setupEventListeners();
    }

    createColorOptions() {
        this.element.innerHTML = '';
        this.colors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color;
            colorOption.dataset.color = color;
            this.element.appendChild(colorOption);
        });
    }

    setupEventListeners() {
        DOMUtils.addEventListener(this.element, 'click', (e) => {
            const colorOption = e.target.closest('.color-option');
            if (colorOption) {
                const color = colorOption.dataset.color;
                this.selectColor(color);
            }
        });
    }

    /**
     * 选择颜色
     */
    selectColor(color) {
        this.selectedColor = color;
        
        // 更新选中状态
        DOMUtils.querySelectorAll('.color-option', this.element).forEach(option => {
            DOMUtils.removeClass(option, 'selected');
        });
        
        const selectedOption = this.element.querySelector(`[data-color="${color}"]`);
        if (selectedOption) {
            DOMUtils.addClass(selectedOption, 'selected');
        }
        
        this.emit('change', { color });
    }

    /**
     * 获取选中的颜色
     */
    getSelectedColor() {
        return this.selectedColor;
    }

    /**
     * 设置选中的颜色
     */
    setSelectedColor(color) {
        if (this.colors.includes(color)) {
            this.selectColor(color);
        }
    }

    /**
     * 触发自定义事件
     */
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { 
            bubbles: true, 
            detail: data 
        });
        this.element.dispatchEvent(event);
    }
}

/**
 * 属性面板组件
 */
export class PropertyPanel extends UIComponent {
    constructor(element) {
        super(element);
        this.currentElement = null;
    }

    /**
     * 显示节点属性
     */
    showNodeProperties(node, onUpdate) {
        this.currentElement = { type: 'node', data: node };
        
        const colorOptions = ColorUtils.COMMON_COLORS.map(color => 
            `<div class="color-option ${node.color === color ? 'selected' : ''}" 
                  style="background-color: ${color}" 
                  data-color="${color}"></div>`
        ).join('');

        this.element.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-gray-600">节点ID</label>
                    <p class="font-semibold">${node.id}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">标签</label>
                    <input type="text" value="${node.label}" 
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-property="label">
                </div>
                <div>
                    <label class="text-sm text-gray-600">颜色</label>
                    <div class="grid grid-cols-4 gap-2 mt-2" data-color-picker>
                        ${colorOptions}
                    </div>
                    <input type="color" value="${node.color}" 
                           class="w-full h-10 rounded-lg cursor-pointer mt-2"
                           data-property="color">
                </div>
                <div>
                    <label class="text-sm text-gray-600">位置</label>
                    <div class="flex space-x-2">
                        <div class="flex-1">
                            <label class="text-xs text-gray-500">X</label>
                            <input type="number" value="${Math.round(node.x)}" 
                                   class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                   data-position="x" min="0" max="1000">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-gray-500">Y</label>
                            <input type="number" value="${Math.round(node.y)}" 
                                   class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                   data-position="y" min="0" max="600">
                        </div>
                    </div>
                </div>
                <div>
                    <button id="deleteElementBtn" class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                        <i class="fas fa-trash mr-2"></i>删除
                    </button>
                </div>
            </div>
        `;

        this.setupPropertyListeners(onUpdate);
    }

    /**
     * 为微点模式显示节点属性（只显示标签，不显示颜色）
     */
    showNodePropertiesForDotMode(node, onUpdate) {
        this.currentElement = { type: 'node', data: node };

        const shapeOptions = ['circle', 'triangle', 'square', 'star'].map(shape => 
            `<div class="shape-option ${node.shape === shape ? 'selected' : ''}" 
                  data-shape="${shape}"
                  style="display: inline-block; margin: 0 5px; cursor: pointer; padding: 5px; border: ${node.shape === shape ? '2px solid #8b5cf6' : '1px solid #ccc'}; border-radius: 4px;">
                <svg width="20" height="20" viewBox="-10 -10 20 20">
                    ${this.getShapeSVG(node, shape)}
                </svg>
            </div>`
        ).join('');

        this.element.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-gray-600">节点ID</label>
                    <p class="font-semibold">${node.id}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">标签</label>
                    <input type="text" value="${node.label}" 
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-property="label">
                </div>
                <div>
                    <label class="text-sm text-gray-600">形状</label>
                    <div class="mt-2" data-shape-picker>
                        ${shapeOptions}
                    </div>
                </div>
                <div>
                    <label class="text-sm text-gray-600">位置</label>
                    <div class="flex space-x-2">
                        <div class="flex-1">
                            <label class="text-xs text-gray-500">X</label>
                            <input type="number" value="${Math.round(node.x)}" 
                                   class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                   data-position="x" min="0" max="1000">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-gray-500">Y</label>
                            <input type="number" value="${Math.round(node.y)}" 
                                   class="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                   data-position="y" min="0" max="600">
                        </div>
                    </div>
                </div>
                <div>
                    <button id="deleteElementBtn" class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                        <i class="fas fa-trash mr-2"></i>删除
                    </button>
                </div>
            </div>
        `;

        this.setupPropertyListeners(onUpdate);
        this.setupShapeListeners(onUpdate);
    }

    /**
     * 获取形状的SVG表示
     */
    getShapeSVG(node, shape) {
        switch(shape) {
            case 'circle':
                return '<circle cx="0" cy="0" r="4" fill="#000000" />';
            case 'triangle':
                return '<polygon points="-4,2.3 0,-4 4,2.3" fill="#000000" />';
            case 'square':
                return '<rect x="-4" y="-4" width="8" height="8" fill="#000000" />';
            case 'star':
                // 简化的五角星
                const points = [];
                for (let i = 0; i < 10; i++) {
                    const angle = Math.PI / 2 + (i * Math.PI) / 5;
                    const radius = i % 2 === 0 ? 4 : 1.5;
                    const x = Math.cos(angle) * radius;
                    const y = -Math.sin(angle) * radius;
                    points.push(x + ',' + y);
                }
                return '<polygon points="' + points.join(' ') + '" fill="#000000" />';
            default:
                return '<circle cx="0" cy="0" r="4" fill="#000000" />';
        }
    }

    /**
     * 设置形状选择监听器
     */
    setupShapeListeners(onUpdate) {
        const shapePicker = this.element.querySelector('[data-shape-picker]');
        if (shapePicker) {
            shapePicker.addEventListener('click', (e) => {
                const shapeOption = e.target.closest('.shape-option');
                if (shapeOption) {
                    const shape = shapeOption.dataset.shape;
                    if (this.currentElement && this.currentElement.type === 'node') {
                        onUpdate('node', this.currentElement.data.id, 'shape', shape);
                        
                        // 更新选中状态
                        shapePicker.querySelectorAll('.shape-option').forEach(option => {
                            option.classList.remove('selected');
                            option.style.border = '1px solid #ccc';
                        });
                        shapeOption.classList.add('selected');
                        shapeOption.style.border = '2px solid #8b5cf6';
                    }
                }
            });
        }
    }

    /**
     * 显示边属性
     */
    showEdgeProperties(edge, sourceNode, targetNode, onUpdate) {
        this.currentElement = { type: 'edge', data: edge };
        const edgeColor = edge.color || '#6b7280';
        
        const colorOptions = ColorUtils.COMMON_COLORS.map(color => 
            `<div class="color-option ${edgeColor === color ? 'selected' : ''}" 
                  style="background-color: ${color}" 
                  data-color="${color}"></div>`
        ).join('');

        this.element.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-gray-600">边</label>
                    <p class="font-semibold">${sourceNode ? sourceNode.label : '?'} → ${targetNode ? targetNode.label : '?'}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">标签</label>
                    <input type="text" value="${edge.label || ''}" placeholder="输入边的名称"
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-property="label">
                </div>
                <div>
                    <label class="text-sm text-gray-600">颜色</label>
                    <div class="grid grid-cols-4 gap-2 mt-2" data-color-picker>
                        ${colorOptions}
                    </div>
                    <input type="color" value="${edgeColor}"
                           class="w-full h-10 rounded-lg cursor-pointer mt-2"
                           data-property="color">
                </div>
                <div>
                    <label class="text-sm text-gray-600">权重</label>
                    <input type="number" value="${edge.weight}" min="0"
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-property="weight">
                </div>
                <div>
                    <button id="deleteElementBtn" class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                        <i class="fas fa-trash mr-2"></i>删除
                    </button>
                </div>
            </div>
        `;

        this.setupPropertyListeners(onUpdate);
    }

    /**
     * 设置属性监听器
     */
    setupPropertyListeners(onUpdate) {
        // 文本输入监听
        const inputs = this.element.querySelectorAll('input[data-property]');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.dataset.property;
                const value = e.target.value;
                onUpdate(this.currentElement.type, this.currentElement.data.id, property, value);
            });
        });

        // 位置输入监听
        const positionInputs = this.element.querySelectorAll('input[data-position]');
        positionInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const axis = e.target.dataset.position;
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0) {
                    onUpdate(this.currentElement.type, this.currentElement.data.id, `position_${axis}`, value);
                }
            });
        });

        // 颜色选择器监听
        const colorPicker = this.element.querySelector('[data-color-picker]');
        if (colorPicker) {
            colorPicker.addEventListener('click', (e) => {
                const colorOption = e.target.closest('.color-option');
                if (colorOption) {
                    const color = colorOption.dataset.color;
                    onUpdate(this.currentElement.type, this.currentElement.data.id, 'color', color);
                    
                    // 更新选中状态
                    colorPicker.querySelectorAll('.color-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    colorOption.classList.add('selected');
                }
            });
        }
    }

    /**
     * 重置面板
     */
    reset() {
        this.currentElement = null;
        this.element.innerHTML = `
            <i class="fas fa-mouse-pointer text-4xl mb-3"></i>
            <p>选中一个元素查看属性</p>
        `;
    }

    /**
     * 更新节点位置显示
     */
    updateNodePosition(node) {
        if (this.currentElement && this.currentElement.type === 'node' && this.currentElement.data.id === node.id) {
            const xInput = this.element.querySelector('input[data-position="x"]');
            const yInput = this.element.querySelector('input[data-position="y"]');
            
            if (xInput) xInput.value = Math.round(node.x);
            if (yInput) yInput.value = Math.round(node.y);
        }
    }

    /**
     * 获取当前元素
     */
    getCurrentElement() {
        return this.currentElement;
    }
}

/**
 * Toast通知组件
 */
export class Toast extends UIComponent {
    constructor(container) {
        super(container);
    }

    /**
     * 显示通知
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.className = `toast ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2`;
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        this.element.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        return toast;
    }

    /**
     * 显示成功通知
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    /**
     * 显示错误通知
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    /**
     * 显示警告通知
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * 显示信息通知
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

/**
 * 右键菜单组件
 */
export class ContextMenu extends UIComponent {
    constructor(element) {
        super(element);
        this.isOpen = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 点击其他地方关闭菜单
        DOMUtils.addEventListener(document, 'click', () => this.close());
    }

    /**
     * 打开菜单
     */
    open(x, y) {
        this.isOpen = true;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        DOMUtils.removeClass(this.element, 'hidden');
        this.emit('open');
    }

    /**
     * 关闭菜单
     */
    close() {
        this.isOpen = false;
        DOMUtils.addClass(this.element, 'hidden');
        this.emit('close');
    }

    /**
     * 检查是否打开
     */
    isOpen() {
        return this.isOpen;
    }

    /**
     * 添加菜单项
     */
    addMenuItem(label, icon, callback, className = '') {
        const button = document.createElement('button');
        button.className = `w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${className}`;
        button.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${label}</span>
        `;
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            callback();
            this.close();
        });
        
        this.element.appendChild(button);
        return button;
    }

    /**
     * 清空菜单项
     */
    clearMenuItems() {
        this.element.innerHTML = '';
    }

    /**
     * 触发自定义事件
     */
    emit(eventName) {
        const event = new CustomEvent(eventName, { bubbles: true });
        this.element.dispatchEvent(event);
    }
}