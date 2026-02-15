/**
 * 颜色工具类
 */
export class ColorUtils {
    // 常用颜色定义
    static COMMON_COLORS = [
        '#000000', // 黑
        '#6b7280', // 灰
        '#ef4444', // 红
        '#eab308', // 黄
        '#3b82f6', // 蓝
        '#8b5cf6', // 紫
        '#10b981', // 绿
        '#ec4899'  // 粉
    ];

    /**
     * 十六进制颜色转RGB对象
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * 计算颜色亮度 (0-255)
     */
    static getColorBrightness(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    }

    /**
     * 根据背景颜色选择合适的文本颜色
     */
    static getContrastTextColor(backgroundColor) {
        const brightness = this.getColorBrightness(backgroundColor);
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    /**
     * 生成随机颜色
     */
    static getRandomColor() {
        return this.COMMON_COLORS[Math.floor(Math.random() * this.COMMON_COLORS.length)];
    }

    /**
     * 验证颜色格式是否为有效的十六进制颜色
     */
    static isValidHexColor(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }
}

/**
 * 数学工具类
 */
export class MathUtils {
    /**
     * 计算两点间距离
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算向量角度 (弧度)
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * 将角度从弧度转换为度数
     */
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * 将角度从度数转换为弧度
     */
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * 限制值在指定范围内
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 线性插值
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * 计算点到线段的最短距离
     */
    static pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * DOM工具类
 */
export class DOMUtils {
    /**
     * 获取元素相对于SVG的坐标
     */
    static getSvgCoordinates(element, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * 创建SVG元素
     */
    static createSvgElement(tagName, attributes = {}) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    }

    /**
     * 显示元素
     */
    static show(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    }

    /**
     * 隐藏元素
     */
    static hide(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }

    /**
     * 切换元素显示状态
     */
    static toggle(element) {
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    /**
     * 添加CSS类
     */
    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * 移除CSS类
     */
    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * 检查是否包含CSS类
     */
    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    /**
     * 获取所有匹配选择器的元素
     */
    static querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * 获取单个元素
     */
    static querySelector(selector) {
        return document.querySelector(selector);
    }

    /**
     * 添加事件监听器
     */
    static addEventListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    /**
     * 移除事件监听器
     */
    static removeEventListener(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    }
}

/**
 * 存储工具类
 */
export class StorageUtils {
    static PREFIX = 'mini-graph-editor-';

    /**
     * 保存数据到localStorage
     */
    static save(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(this.PREFIX + key, serializedData);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    /**
     * 从localStorage读取数据
     */
    static load(key, defaultValue = null) {
        try {
            const serializedData = localStorage.getItem(this.PREFIX + key);
            return serializedData ? JSON.parse(serializedData) : defaultValue;
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除localStorage中的数据
     */
    static remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有相关数据
     */
    static clearAll() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
}

/**
 * 文件工具类
 */
export class FileUtils {
    /**
     * 下载文件
     */
    static download(data, filename, mimeType = 'application/octet-stream') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 读取文件内容
     */
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * 验证文件类型
     */
    static validateFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type) || 
               allowedTypes.includes(file.name.split('.').pop().toLowerCase());
    }
}