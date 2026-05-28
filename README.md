# WorldForge-灵感激荡

一站式架空世界观构建平台，帮助 OC 创作者、小说/漫画作者快速构建丰富的架空世界。

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3
- OpenAI API (gpt-4o-mini)
- Lucide React 图标库

## 功能特性

### 模块1：世界观核心生成
- 输入世界观主题、灵感关键词
- 一键生成完整世界观设定，包含：
  - 社会文化与阶层
  - 独特习俗与节日
  - 地理环境与气候
  - 核心势力/种族
  - 角色示例（姓名、性格、怪癖）
  - 核心背景故事/冲突钩子
- 支持重新生成和获取更多灵感变体

### 模块2：幻想地图生成器
- Canvas 客户端渲染，无需外部地图 API
- 使用噪声算法生成地形高度图
- 自动着色：深水、浅水、沙滩、绿地、森林、山地、雪顶
- 自动生成河流和城市标记
- AI 生成符合世界观风格的地名
- 支持导出为 PNG 图片

### 模块3：历史与架空灵感推荐
- 推荐真实历史事件作为灵感来源
- 分析著名架空世界的构建手法
- 提供情节与设定片段激发创作

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 配置环境变量

1. 复制 `.env.example` 为 `.env`
2. 在 OpenAI 平台获取 API Key：https://platform.openai.com/api-keys
3. 将 API Key 填入 `.env` 文件：

```env
OPENAI_API_KEY=your-api-key-here
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 项目结构

```
worldforge/
├── app/
│   ├── api/
│   │   ├── generate-world/route.ts    # 世界观生成 API
│   │   ├── generate-place-names/route.ts  # 地名生成 API
│   │   └── recommend-inspiration/route.ts # 灵感推荐 API
│   ├── globals.css                    # 全局样式
│   ├── layout.tsx                     # 根布局
│   └── page.tsx                       # 主页面
├── components/
│   ├── Navbar.tsx                     # 导航栏组件
│   ├── WorldGenerator.tsx             # 世界观生成组件
│   ├── MapGenerator.tsx               # 地图生成器组件
│   └── InspirationRecommend.tsx       # 灵感推荐组件
├── .env.example                       # 环境变量示例
├── .gitignore
├── next.config.js                     # Next.js 配置
├── package.json
├── postcss.config.js                  # PostCSS 配置
├── tailwind.config.js                 # Tailwind CSS 配置
└── tsconfig.json                      # TypeScript 配置
```

## 使用说明

1. **世界观核心生成**：在输入框中输入你的世界观主题，点击「生成世界观」按钮
2. **幻想地图生成**：切换到「幻想地图」标签，点击「生成地图」创建随机地形
3. **灵感推荐**：先生成一个世界观，然后切换到「灵感推荐」标签获取建议

## 主题切换

点击导航栏右侧的太阳/月亮图标可以切换亮色/暗色模式。

## 注意事项

- 本应用需要有效的 OpenAI API Key 才能正常工作
- API 调用会产生费用，请合理使用
- 所有数据仅保存在浏览器内存中，刷新页面后会丢失

## License

MIT
