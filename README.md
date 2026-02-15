# Mini-Graph-Editor
一个基于Web的图论可视化编辑器，支持创建、编辑和导出各种类型的图。

## 项目结构

```bash
mini-graph-editor/
├── index.html              # 在线版主页面（需HTTP服务器运行）
├── mini-graph-editor.html   # 离线版主页面（可双击直接运行；部分导出功能受限）
├── README.md              # 项目说明文档
└── src/                    # 源代码目录
    ├── main.js             # 应用入口文件
    ├── components/         # UI组件
    │   └── UIComponents.js # UI组件实现
    ├── models/             # 数据模型
    │   ├── Graph.js        # 图数据结构
    │   └── Layout.js       # 布局算法
    ├── services/           # 服务层
    │   ├── ExportService.js # 导出/导入服务
    │   └── EventService.js  # 事件处理服务
    ├── styles/             # 样式文件
    │   └── main.css        # 主样式表
    └── utils/              # 工具函数
        └── helpers.js      # 辅助工具类
```

## 版本说明

### 在线版 (index.html)
- 使用ES6模块化架构，需要通过HTTP服务器运行
- 访问地址：`http://localhost:8080`
- 依赖src目录下的模块化JavaScript文件

### 离线版 (mini-graph-editor.html)
- 单文件版本，无需HTTP服务器，可直接双击在浏览器中打开
- 所有代码（HTML/CSS/JavaScript）整合在单个文件中
- 功能与在线版保持一致
- 适合在没有网络环境或无法启动服务器的场景下使用
- 支持所有核心功能：
  - 节点和边的添加、删除、编辑
  - 有向图/无向图切换
  - 简单图模式、重边支持、自环支持
  - SVG/PNG/JPG/PDF导出
  - JSON导出/导入
  - 双模式渲染（圆点模式/微点模式）

## 功能特性

### 基础功能
- ✅ 添加/删除节点和边
- ✅ 节点拖拽移动
- ✅ 边的自动渲染（直线、弧线、自环）
- ✅ 节点和边属性编辑
- ✅ 颜色自定义
- ✅ 标签编辑
- ✅ 节点位置精确编辑
- ✅ 双模式渲染（圆点模式/微点模式）

### 图特性支持
- ✅ 有向图/无向图切换
- ✅ 简单图模式
- ✅ 重边支持
- ✅ 自环支持

### 导出功能
- ✅ SVG格式导出
- ✅ PNG/JPG图片导出
- ✅ PDF文档导出
- ✅ JSON数据导出/导入

### 交互特性
- ✅ 右键菜单
- ✅ 键盘快捷键 (Delete键删除)
- ✅ 属性面板实时更新
- ✅ Toast通知

## 技术栈

- **前端框架**: 原生JavaScript (ES6+模块化)
- **样式框架**: Tailwind CSS
- **图标库**: Font Awesome
- **PDF导出**: jsPDF
- **构建工具**: 无（直接运行）

## 使用方法

### 本地运行

1. 克隆项目到本地
2. 在项目根目录启动HTTP服务器：
   ```bash
   # 使用Python
   python -m http.server 8080
   
   # 或使用Node.js
   npx http-server -p 8080
   ```
3. 在浏览器中访问 `http://localhost:8080`

### 操作说明

#### 基本操作
- **添加节点**: 选择"添加/选中点"模式，在画布上点击
- **添加边**: 选择"添加/选中边"模式，依次点击两个节点
- **删除元素**: 选择"删除"模式，点击要删除的元素
- **移动节点**: 在"添加/选中点"模式下拖拽节点

#### 快捷键
- `Delete` - 删除选中元素

#### 图类型切换
- 选择"有向图"或"无向图"切换图的性质
- 选择"简单图"模式禁用重边和自环
- 单独控制"支持重边"和"支持自环"选项

#### 导入导出功能
- 点击"导出"按钮选择格式和设置
- 点击"导出JSON"保存图数据
- 点击"导入JSON"加载图数据

## 代码架构说明

### 核心模块

1. **Graph.js** - 图数据模型
   - `Node` 类：节点数据结构（支持位置、标签、颜色、形状）
   - `Edge` 类：边数据结构（支持权重、标签、颜色）
   - `Graph` 类：图的完整数据管理

2. **main.js** - 应用核心逻辑
   - `GraphEditor` 类：主应用控制器
   - 节点/边的增删改查操作
   - 拖拽交互和属性编辑
   - 图特性和渲染模式管理

3. **UIComponents.js** - UI组件
   - `PropertyPanel`：属性编辑面板
   - `Toast`：通知组件
   - 各种可复用的UI组件类

4. **ExportService.js** - 导出服务
   - `ExportManager`：导出功能管理（SVG/PNG/PDF/JSON）
   - `ImportManager`：导入功能管理

5. **EventService.js** - 事件处理
   - `KeyboardHandler`：键盘事件
   - `MouseHandler`：鼠标事件
   - `AppEventManager`：应用事件管理器

### 设计模式

- **模块化设计**: 使用ES6模块系统
- **面向对象**: 核心功能封装为类
- **事件驱动**: 基于事件的交互处理
- **组件化**: UI组件可复用和独立

## 开发规范

### 代码风格
- 使用ES6+语法
- 遵循JavaScript标准代码规范
- 模块化导入导出
- 适当的注释和文档

### 文件命名
- JavaScript文件使用PascalCase类名
- CSS类名使用kebab-case
- 变量和函数使用camelCase

## 扩展建议

1. **算法扩展**
   - 添加更多图算法可视化
   - 实现最短路径算法演示
   - 添加图遍历动画

2. **功能增强**
   - 支持多图管理
   - 添加图的统计信息面板
   - 实现协作编辑功能

3. **性能优化**
   - 大图渲染优化
   - 虚拟滚动支持
   - WebGL加速渲染

## 许可证

MIT License

## 作者

Suzie NJU
