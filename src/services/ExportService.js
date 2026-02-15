import { DOMUtils, FileUtils } from '../utils/helpers.js';
import { Graph, Node, Edge } from '../models/Graph.js';

/**
 * 导出功能管理器
 */
export class ExportManager {
    constructor(graph, svgElement) {
        this.graph = graph;
        this.svgElement = svgElement;
        this.defaultFileName = 'graph';
        this.selectedFormat = 'svg';
        this.selectedBackground = 'white';
        this.quality = 0.9;
    }

    /**
     * 设置导出格式
     */
    setFormat(format) {
        this.selectedFormat = format;
    }

    /**
     * 设置背景
     */
    setBackground(background) {
        this.selectedBackground = background;
    }

    /**
     * 设置质量
     */
    setQuality(quality) {
        this.quality = quality;
    }

    /**
     * 设置文件名
     */
    setFileName(fileName) {
        this.defaultFileName = fileName;
    }

    /**
     * 执行导出
     */
    async export(format = this.selectedFormat, fileName = this.defaultFileName) {
        switch (format.toLowerCase()) {
            case 'svg':
                return this.exportToSVG(fileName, this.selectedBackground);
            case 'pdf':
                return this.exportToPDF(fileName);
            case 'jpg':
            case 'jpeg':
                return this.exportToImage('jpg', fileName, this.quality, false);
            case 'png':
                return this.exportToImage('png', fileName, this.quality, this.selectedBackground === 'transparent');
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 导出为SVG格式
     */
    exportToSVG(fileName, background = 'white') {
        const svgRect = this.svgElement.getBoundingClientRect();
        
        // 创建新的SVG元素
        const newSvg = DOMUtils.createSvgElement('svg', {
            width: svgRect.width,
            height: svgRect.height,
            viewBox: `0 0 ${svgRect.width} ${svgRect.height}`,
            xmlns: 'http://www.w3.org/2000/svg'
        });

        // 添加背景
        if (background === 'white') {
            const bgRect = DOMUtils.createSvgElement('rect', {
                width: svgRect.width,
                height: svgRect.height,
                fill: 'white'
            });
            newSvg.appendChild(bgRect);
        }

        // 复制定义
        const defs = this.svgElement.querySelector('defs');
        if (defs) {
            newSvg.appendChild(defs.cloneNode(true));
        }

        // 复制边组
        const edgesGroup = this.svgElement.querySelector('#edges');
        if (edgesGroup) {
            newSvg.appendChild(edgesGroup.cloneNode(true));
        }

        // 复制节点组
        const nodesGroup = this.svgElement.querySelector('#nodes');
        if (nodesGroup) {
            newSvg.appendChild(nodesGroup.cloneNode(true));
        }

        // 转换为字符串并下载
        const svgData = new XMLSerializer().serializeToString(newSvg);
        FileUtils.download(svgData, `${fileName}.svg`, 'image/svg+xml;charset=utf-8');
        
        return { success: true, format: 'svg', fileName: `${fileName}.svg` };
    }

    /**
     * 导出为图片格式
     */
    async exportToImage(format, fileName, quality = 0.9, transparentBg = false) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgRect = this.svgElement.getBoundingClientRect();

        canvas.width = svgRect.width;
        canvas.height = svgRect.height;

        // 设置背景
        if (!transparentBg || format === 'jpg') {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 获取SVG内容
        const svgData = new XMLSerializer().serializeToString(this.svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = svgUrl;
            });

            ctx.drawImage(img, 0, 0);

            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        FileUtils.download(blob, `${fileName}.${format}`, `image/${format}`);
                        URL.revokeObjectURL(svgUrl);
                        resolve({ 
                            success: true, 
                            format: format, 
                            fileName: `${fileName}.${format}` 
                        });
                    } else {
                        reject(new Error('图片生成失败'));
                    }
                }, `image/${format}`, quality);
            });
        } finally {
            URL.revokeObjectURL(svgUrl);
        }
    }

    /**
     * 导出为PDF格式
     */
    async exportToPDF(fileName) {
        // 检查jsPDF是否可用
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('PDF导出功能需要jsPDF库');
        }

        const { jsPDF } = window.jspdf;
        const svgRect = this.svgElement.getBoundingClientRect();

        // 创建PDF，根据画布比例选择方向
        const isLandscape = svgRect.width > svgRect.height;
        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'px',
            format: [svgRect.width, svgRect.height]
        });

        // 将SVG转换为Canvas再转为图片，提高稳定性
        try {
            // 创建临时canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = svgRect.width;
            canvas.height = svgRect.height;
            
            // 将SVG绘制到canvas
            const svgData = new XMLSerializer().serializeToString(this.svgElement);
            const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // 绘制到canvas
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve();
                    } catch (drawError) {
                        reject(new Error('Canvas绘制失败: ' + drawError.message));
                    }
                };
                img.onerror = () => reject(new Error('SVG图像加载失败'));
                img.src = imgSrc;
            });

            // 从canvas获取图片数据
            const imageData = canvas.toDataURL('image/png');
            
            // 添加图片到PDF
            pdf.addImage(imageData, 'PNG', 0, 0, svgRect.width, svgRect.height);

            // 保存PDF
            pdf.save(`${fileName}.pdf`);
            
            return { 
                success: true, 
                format: 'pdf', 
                fileName: `${fileName}.pdf` 
            };
        } catch (error) {
            console.error('PDF导出错误:', error);
            throw new Error('PDF导出失败: ' + error.message);
        }
    }

    /**
     * 导出图数据为JSON
     */
    exportGraphData(fileName = 'graph') {
        const graphData = this.graph.toJSON();
        
        const dataStr = JSON.stringify(graphData, null, 2);
        
        if (dataStr.length <= 20) { // 基本的空数据检测
            throw new Error('图中没有数据可以导出，请先添加节点或边');
        }
        
        FileUtils.download(dataStr, `${fileName}.json`, 'application/json;charset=utf-8');
        
        return { 
            success: true, 
            format: 'json', 
            fileName: `${fileName}.json` 
        };
    }

    /**
     * 获取支持的导出格式
     */
    static getSupportedFormats() {
        return [
            { id: 'svg', name: 'SVG矢量图', icon: 'fas fa-vector-square' },
            { id: 'png', name: 'PNG图片', icon: 'fas fa-image' },
            { id: 'jpg', name: 'JPG图片', icon: 'fas fa-image' },
            { id: 'pdf', name: 'PDF文档', icon: 'fas fa-file-pdf' }
        ];
    }

    /**
     * 获取支持的背景选项
     */
    static getBackgroundOptions() {
        return [
            { id: 'white', name: '白色背景', type: 'solid' },
            { id: 'transparent', name: '透明背景', type: 'transparent' }
        ];
    }
}

/**
 * 导入功能管理器
 */
export class ImportManager {
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * 从JSON数据导入图
     */
    importFromJSON(jsonData) {
        try {
            const importedGraph = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!this.validateImportData(importedGraph).valid) {
                throw new Error('JSON数据格式无效');
            }
            
            // 清空当前图
            this.graph.clear();
            
            // 使用Graph类的静态方法重建图
            const newGraph = Graph.fromJSON(importedGraph);
            
            // 将新图的数据复制到当前图
            this.graph.nodes = newGraph.nodes;
            this.graph.edges = newGraph.edges;
            this.graph.directed = newGraph.directed;
            this.graph.nodeIdCounter = newGraph.nodeIdCounter;
            this.graph.edgeIdCounter = newGraph.edgeIdCounter;
            
            return { success: true, nodeCount: this.graph.nodes.length, edgeCount: this.graph.edges.length };
        } catch (error) {
            throw new Error(`导入失败：${error.message}`);
        }
    }

    /**
     * 从文件导入图
     */
    async importFromFile(file) {
        if (!file || file.type !== 'application/json') {
            throw new Error('请选择有效的JSON文件');
        }

        try {
            const content = await FileUtils.readFile(file);
            return this.importFromJSON(content);
        } catch (error) {
            throw new Error(`文件读取失败：${error.message}`);
        }
    }

    /**
     * 验证导入数据的有效性
     */
    validateImportData(data) {
        const errors = [];
        
        if (!data.nodes || !Array.isArray(data.nodes)) {
            errors.push('缺少节点数据或节点数据格式错误');
        }
        
        if (!data.edges || !Array.isArray(data.edges)) {
            errors.push('缺少边数据或边数据格式错误');
        }
        
        if (typeof data.directed !== 'boolean') {
            errors.push('缺少图类型信息');
        }
        
        // 验证节点数据
        if (data.nodes) {
            data.nodes.forEach((node, index) => {
                if (!node.id) errors.push(`节点${index}缺少ID`);
                if (typeof node.x !== 'number') errors.push(`节点${node.id || index}的X坐标无效`);
                if (typeof node.y !== 'number') errors.push(`节点${node.id || index}的Y坐标无效`);
            });
        }
        
        // 验证边数据
        if (data.edges) {
            data.edges.forEach((edge, index) => {
                if (!edge.id) errors.push(`边${index}缺少ID`);
                if (!edge.source) errors.push(`边${edge.id || index}缺少源节点`);
                if (!edge.target) errors.push(`边${edge.id || index}缺少目标节点`);
            });
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}