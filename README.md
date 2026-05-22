# EasyAgent

EasyAgent 是一款基于 React 19 + TypeScript + Vite 构建的多功能 AI Agent 前端应用，提供 AI 流式对话、知识库文档管理（RAG）、文件附件上传、PPT 演示生成、工具调用（联网搜索、天气查询等）、好友实时通讯（WebSocket）、聊天分享、系统消息、主题切换等能力，旨在打造一个开箱即用、体验现代的 AI 助手平台。

## ✨ 主要特性

- **AI 流式对话**：基于 SSE（`fetch` + `ReadableStream`）的字符级流式响应，支持思考内容（think_content）、正文内容、工具调用结果分通道展示，并通过 16ms 节流缓冲池保证渲染流畅。支持流式中断（AbortController）。
- **知识库管理**：支持全局文档上传（.txt/.doc/.docx/.md），文档分块状态追踪（处理中/已完成/失败），文档内容预览与分块查看，文档删除与重试。对话中可挂载知识库文档，AI 基于 RAG 检索生成回答时展示引用来源（rag_references）。
- **文件附件**：输入框支持拖拽/点击上传文件附件（支持 .txt/.md/.csv/.json/.py/.js/.pdf/.doc/.docx/.jpg/.jpeg/.png/.webp），图片类型自动缩略图预览，非图片类型显示文件名与大小标签，支持上传中状态展示与单个移除。
- **Markdown 渲染**：使用 `react-markdown` + `remark-gfm` 渲染 Markdown，集成 `react-syntax-highlighter` 实现代码块语法高亮，并支持一键复制。
- **工具调用展示**：在 `EADrawer` 抽屉中以多 Tab 形式展示 AI 工具结果：
  - `web_search`：网页文本 / 图片 / 新闻
  - `weather_query`：未来天气列表卡片
  - `ppt`：PPT 演示生成（详见下方）
  - 其他工具可扩展
- **PPT 演示生成**：输入框支持 Text / PPT 模式切换，选择 PPT 模式后 AI 通过流式 SSE 逐步生成幻灯片大纲（`outline`）和逐页 HTML（`slide_start` → `slide_chunk` → `slide_end`）。每张幻灯片支持大纲、HTML 源码、PPT 预览三个 Tab 切换查看，PPT 预览通过 `iframe` + `srcDoc` 渲染，第三方资源（Tailwind CSS、Lucide、Reveal.js、Google Fonts）由本地 `/static/vendor/` 提供以加速加载。生成完成后侧边栏自动展开显示完整演示。
- **好友实时通讯**：基于原生 WebSocket（`ws://localhost:8000/user_chat/ws/chat/{user_id}`）实现端到端消息推送、未读消息计数、已读回执、好友请求、消息状态同步。
- **聊天分享**：可将 AI 会话分享给好友，好友可接收 / 取消分享。
- **系统消息中心**：好友请求、系统通知集中展示并支持已读状态。
- **历史会话管理**：会话列表支持创建、重命名、删除、切换。
- **用户体系**：注册 / 登录 / 忘记密码 / 注销账号 / 修改资料 / 头像上传。
- **多主题切换**：基于 daisyUI 的明亮 / 黑夜 / 跟随系统三种模式，使用 CSS 变量统一控制配色。
- **输入模式切换**：输入框底部支持 Text / PPT 模式一键切换，Text 为普通对话，PPT 为幻灯片生成模式。
- **响应式现代 UI**：Tailwind CSS v4 + daisyUI + Ant Design 6 + Lottie 动画 + GSAP + animate.css 综合呈现。

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 19、React DOM 19 |
| 语言 | TypeScript ~5.8 |
| 构建工具 | Vite 7、@vitejs/plugin-react |
| 路由 | react-router-dom v7 |
| 状态管理 | Zustand 5 |
| 样式 | Tailwind CSS v4、@tailwindcss/vite、daisyUI 5、Sass |
| UI 组件 | Ant Design 6、@ant-design/icons、lucide-react |
| Markdown | react-markdown、remark-gfm、react-syntax-highlighter |
| 网络请求 | Axios（含拦截器、统一封装）、原生 fetch（流式）、WebSocket |
| 动画 | Lottie（lottie-react）、GSAP、animate.css |
| PPT 渲染 | Reveal.js（本地 vendor）、iframe sandbox 隔离渲染 |
| 工具库 | dayjs、lodash、uuid |
| 代码规范 | ESLint 9、typescript-eslint、eslint-plugin-react-hooks、eslint-plugin-react-refresh |

## 📂 项目结构

```text
EasyAgent
├── public/                       # 静态资源
├── src
│   ├── api/                      # 后端 API 封装
│   │   ├── chat.ts               # AI 聊天记录 / 创建 / 删除 / 重命名 / 取消分享 / 文件附件上传
│   │   ├── knowledge.ts          # 知识库文档上传 / 列表 / 内容 / 删除 / 重试
│   │   ├── user.ts               # 登录 / 注册 / 忘记密码 / 注销 / 头像上传 / 资料更新
│   │   ├── userChat.ts           # 好友聊天 REST + WebSocket 工厂
│   │   ├── userFriend.ts         # 好友列表 / 搜索 / 添加
│   │   └── system_info.ts        # 系统消息
│   ├── assets/                   # 图标 / SVG 资源
│   ├── components/               # 业务组件库（EA 前缀）
│   │   ├── EAActionBar.tsx       # 消息操作条（复制等）
│   │   ├── EAButton.tsx          # 通用按钮
│   │   ├── EADrawer/             # 右侧多功能抽屉（工具结果 + 好友聊天 + PPT 演示）
│   │   │   └── ToolPage/         # Weather / News / Images / Texts / SearchInput / SystemMessage / PPT
│   │   ├── EAInput/              # 自适应高度的发送输入框（含中文输入法适配、文件附件、知识库文档挂载）
│   │   ├── EAKnowledge/          # 知识库文档管理（上传、列表、内容预览、删除）
│   │   ├── EALoader.tsx          # 文字流光加载动画
│   │   ├── EALoading.tsx         # 全局加载遮罩
│   │   ├── EAMarkdown/           # Markdown + 代码高亮渲染
│   │   ├── EAMenu/               # 历史会话菜单（重命名 / 删除 / 取消分享）
│   │   ├── EAMessage/            # 全局消息提示（封装自 antd message）
│   │   ├── EAModal.tsx           # 通用弹窗
│   │   └── EAThema.tsx           # 主题切换（明亮/黑夜/跟随系统）
│   ├── LootieJson/               # Lottie 动画 JSON
│   ├── pages
│   │   ├── layout/               # 主聊天页面
│   │   └── login/                # 登录 / 注册 / 忘记密码
│   ├── router/                   # 路由配置
│   ├── store/                    # Zustand 全局状态
│   ├── utils
│   │   ├── axios.ts              # Axios 实例 + 拦截器（401 自动跳登录）
│   │   ├── chat.ts               # 流式 SSE 解析（async generator）
│   │   └── stream.ts             # useStreamAIMessage（节流缓冲 + store 写入）
│   ├── index.css                 # Tailwind / daisyUI / 主题 CSS 变量
│   └── main.tsx                  # 应用入口
├── index.html
├── vite.config.ts                # 配置 @ 别名指向 src/
├── tsconfig*.json
├── eslint.config.js
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18（建议 20+）
- 包管理器：npm / pnpm / yarn 任一

### 安装依赖

```bash
npm install
```

### 启动开发服务

```bash
npm run dev
```

默认访问地址：`http://localhost:5173`（已启用 `host: 0.0.0.0`，可在局域网访问）。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/`。

### 本地预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 🔌 后端约定

项目默认连接本地后端：

- HTTP API 基地址：`http://localhost:8000`（见 `src/utils/axios.ts`）
- WebSocket 地址：`ws://localhost:8000/user_chat/ws/chat/{user_id}`（见 `src/api/userChat.ts`）
- AI 流式接口：`POST http://localhost:8000/chat/stream`（SSE，`data:` 前缀的 JSON 块，见 `src/utils/chat.ts`）

请求统一通过 `Authorization: Bearer <token>` 携带凭证，token 与用户信息存储于 `localStorage`，401 时自动跳转 `/login`。

如需修改后端地址，请改动以下两处：

- `src/utils/axios.ts` 中的 `baseURL`
- `src/utils/chat.ts` 中的 `fetch` 地址
- `src/api/userChat.ts` 中的 `createChatSocket` WebSocket URL
- `vite.config.ts` 中的 `/static` 代理目标地址（用于 PPT 第三方资源本地代理）

## 🧠 流式消息实现要点

`src/utils/stream.ts` 中的 `useStreamAIMessage` 通过缓冲池 + `setTimeout(16ms)` 节流，将服务端推送的 chunk 按类型（`think` / `text` / `tool_content` / `tool_name` / `outline` / `slide_start` / `slide_chunk` / `slide_end`）合并写入 Zustand store，避免高频渲染抖动；流结束后强制 flush，并标记 `finished = true`。支持 `AbortController` 中断流式传输（`stopStreaming`）。PPT 相关 chunk 用于流式构建幻灯片大纲与逐页 HTML 内容。RAG 引用（`references`）直接写入 store 供前端展示。

## 🎨 主题与样式

- 全局采用 CSS 变量（见 `src/index.css`）统一驱动 daisyUI 与自定义组件配色，支持 `data-theme="dark|light"` 切换。
- 通过 `EAThema` 组件提供 "跟随系统 / 黑夜 / 日间" 三选项，"跟随系统"会自动监听 `prefers-color-scheme` 变化。

## 📜 路由

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | `pages/login` | 登录 / 注册 / 忘记密码 |
| `/` | `pages/layout` | 主聊天页面（需要登录） |

未携带 token 进入 `/` 时会自动跳转到 `/login`。

## 📦 主要 npm 脚本

| 脚本 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 检查 |

## 🤝 贡献

欢迎提交 Issue 与 Pull Request。建议提交前先执行：

```bash
npm run lint
npm run build
```

确保通过类型检查与 Lint 规则。

## 📄 License

本项目暂未声明开源许可证，如需使用、二次开发或商用，请先联系仓库维护者。
