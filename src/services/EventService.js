import { DOMUtils } from '../utils/helpers.js';

/**
 * 事件处理基类
 */
export class EventHandler {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理错误 ${event}:`, error);
                }
            });
        }
    }

    /**
     * 移除所有监听器
     */
    removeAllListeners() {
        this.listeners.clear();
    }
}

/**
 * 键盘事件处理器
 */
export class KeyboardHandler extends EventHandler {
    constructor() {
        super();
        this.pressedKeys = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        DOMUtils.addEventListener(document, 'keydown', (e) => this.handleKeyDown(e));
        DOMUtils.addEventListener(document, 'keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        if (!this.pressedKeys.has(key)) {
            this.pressedKeys.add(key);
            this.emit('keydown', { key, event, pressedKeys: this.pressedKeys });
        }
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        this.pressedKeys.delete(key);
        this.emit('keyup', { key, event, pressedKeys: this.pressedKeys });
    }

    /**
     * 检查键是否被按下
     */
    isKeyPressed(key) {
        return this.pressedKeys.has(key.toLowerCase());
    }

    /**
     * 获取当前按下的所有键
     */
    getPressedKeys() {
        return Array.from(this.pressedKeys);
    }
}

/**
 * 鼠标事件处理器
 */
export class MouseHandler extends EventHandler {
    constructor(element) {
        super();
        this.element = element;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentPosition = { x: 0, y: 0 };
        this.setupEventListeners();
    }

    setupEventListeners() {
        DOMUtils.addEventListener(this.element, 'mousedown', (e) => this.handleMouseDown(e));
        DOMUtils.addEventListener(this.element, 'mousemove', (e) => this.handleMouseMove(e));
        DOMUtils.addEventListener(this.element, 'mouseup', (e) => this.handleMouseUp(e));
        DOMUtils.addEventListener(this.element, 'mouseleave', (e) => this.handleMouseLeave(e));
        DOMUtils.addEventListener(this.element, 'click', (e) => this.handleClick(e));
        DOMUtils.addEventListener(this.element, 'dblclick', (e) => this.handleDoubleClick(e));
        DOMUtils.addEventListener(this.element, 'contextmenu', (e) => this.handleContextMenu(e));
    }

    handleMouseDown(event) {
        this.isDragging = true;
        this.dragStart = { x: event.clientX, y: event.clientY };
        this.currentPosition = { x: event.clientX, y: event.clientY };
        this.emit('mousedown', { 
            event, 
            x: event.clientX, 
            y: event.clientY,
            isDragging: this.isDragging 
        });
    }

    handleMouseMove(event) {
        this.currentPosition = { x: event.clientX, y: event.clientY };
        this.emit('mousemove', { 
            event, 
            x: event.clientX, 
            y: event.clientY,
            dx: event.clientX - this.dragStart.x,
            dy: event.clientY - this.dragStart.y,
            isDragging: this.isDragging 
        });
    }

    handleMouseUp(event) {
        if (this.isDragging) {
            this.emit('dragend', { 
                event, 
                startX: this.dragStart.x,
                startY: this.dragStart.y,
                endX: event.clientX,
                endY: event.clientY,
                dx: event.clientX - this.dragStart.x,
                dy: event.clientY - this.dragStart.y
            });
        }
        this.isDragging = false;
        this.emit('mouseup', { event, x: event.clientX, y: event.clientY });
    }

    handleMouseLeave(event) {
        if (this.isDragging) {
            this.handleMouseUp(event);
        }
    }

    handleClick(event) {
        this.emit('click', { event, x: event.clientX, y: event.clientY });
    }

    handleDoubleClick(event) {
        this.emit('dblclick', { event, x: event.clientX, y: event.clientY });
    }

    handleContextMenu(event) {
        this.emit('contextmenu', { event, x: event.clientX, y: event.clientY });
        event.preventDefault();
    }

    /**
     * 获取当前鼠标位置
     */
    getCurrentPosition() {
        return { ...this.currentPosition };
    }

    /**
     * 检查是否正在拖拽
     */
    getIsDragging() {
        return this.isDragging;
    }
}

/**
 * 触摸事件处理器
 */
export class TouchHandler extends EventHandler {
    constructor(element) {
        super();
        this.element = element;
        this.touches = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        DOMUtils.addEventListener(this.element, 'touchstart', (e) => this.handleTouchStart(e));
        DOMUtils.addEventListener(this.element, 'touchmove', (e) => this.handleTouchMove(e));
        DOMUtils.addEventListener(this.element, 'touchend', (e) => this.handleTouchEnd(e));
        DOMUtils.addEventListener(this.element, 'touchcancel', (e) => this.handleTouchCancel(e));
    }

    handleTouchStart(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now()
            });
        });
        
        this.emit('touchstart', {
            event,
            touches: Array.from(this.touches.values()),
            touchCount: this.touches.size
        });
    }

    handleTouchMove(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            if (this.touches.has(touch.identifier)) {
                const touchData = this.touches.get(touch.identifier);
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
                touchData.currentTime = Date.now();
            }
        });
        
        this.emit('touchmove', {
            event,
            touches: Array.from(this.touches.values()),
            touchCount: this.touches.size
        });
    }

    handleTouchEnd(event) {
        event.preventDefault();
        const endedTouches = Array.from(event.changedTouches).map(touch => {
            const touchData = this.touches.get(touch.identifier);
            this.touches.delete(touch.identifier);
            return {
                ...touchData,
                endX: touch.clientX,
                endY: touch.clientY,
                endTime: Date.now(),
                identifier: touch.identifier
            };
        });
        
        this.emit('touchend', {
            event,
            endedTouches,
            remainingTouchCount: this.touches.size
        });
    }

    handleTouchCancel(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });
        
        this.emit('touchcancel', {
            event,
            remainingTouchCount: this.touches.size
        });
    }

    /**
     * 获取当前触摸点
     */
    getTouches() {
        return Array.from(this.touches.values());
    }

    /**
     * 获取触摸点数量
     */
    getTouchCount() {
        return this.touches.size;
    }
}

/**
 * 应用事件管理器
 */
export class AppEventManager {
    constructor() {
        this.keyboard = new KeyboardHandler();
        this.mouse = null;
        this.touch = null;
        this.eventHandlers = new Map();
    }

    /**
     * 初始化特定元素的鼠标和触摸事件
     */
    initElementEvents(element) {
        this.mouse = new MouseHandler(element);
        this.touch = new TouchHandler(element);
    }

    /**
     * 注册事件处理器
     */
    registerHandler(name, handler) {
        this.eventHandlers.set(name, handler);
    }

    /**
     * 获取事件处理器
     */
    getHandler(name) {
        return this.eventHandlers.get(name);
    }

    /**
     * 移除事件处理器
     */
    removeHandler(name) {
        this.eventHandlers.delete(name);
    }

    /**
     * 销毁所有事件处理器
     */
    destroy() {
        this.keyboard.removeAllListeners();
        if (this.mouse) {
            this.mouse.removeAllListeners();
        }
        if (this.touch) {
            this.touch.removeAllListeners();
        }
        this.eventHandlers.clear();
    }

    /**
     * 获取键盘处理器
     */
    getKeyboard() {
        return this.keyboard;
    }

    /**
     * 获取鼠标处理器
     */
    getMouse() {
        return this.mouse;
    }

    /**
     * 获取触摸处理器
     */
    getTouch() {
        return this.touch;
    }
}