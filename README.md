# ljf-dev.com

个人作品集站点，用 Astro 搭的纯静态站，部署在 Netlify。

**<https://ljf-dev.com>**

## 为什么用 Astro

作品集的内容主体是项目介绍，而且会持续增加。Astro 的 content collections 让「新增一个项目」等于「新增一个 Markdown 文件」，不需要碰任何组件代码——写完 frontmatter 和正文，首页卡片和详情页就都有了。

同时它是纯静态输出，构建产物里没有前端框架运行时，首屏就是一个 HTML 文件。

## 项目结构

```
src/
├── content.config.ts      collection 定义与 schema（含字段说明）
├── content/projects/      每个项目一个 .md ← 新增项目只需要动这里
├── lib/
│   ├── projects.ts        取项目列表：过滤草稿 + 排序（首页与详情页共用）
│   └── site.ts            简历文件的存在性检查
├── layouts/BaseLayout.astro
├── components/            Hero / Section / SkillGroup / ProjectCard
├── pages/
│   ├── index.astro        首页
│   ├── 404.astro
│   └── projects/[...id].astro
└── styles/global.css      设计令牌与全站样式
```

## 新增一个项目

1. 在 `src/content/projects/` 下新建一个 `.md`，**文件名用 ASCII 英文**（它就是 URL 段）
2. 按 schema 填 frontmatter
3. 正文写 Markdown

文件名决定 URL：`pet-clinic-admin.md` → `/projects/pet-clinic-admin/`。

没写完的项目把 `draft` 设成 `true`，首页不展示、详情页也不会构建出来。写完了改成 `false` 即可。

## 本地运行

```bash
npm install
npm run dev      # http://localhost:4321
```

其他命令：

```bash
npm run build    # 生成静态产物到 dist/
npm run preview  # 本地预览构建产物
npm run check    # astro check 类型检查
```

> 需要 Node 22.12+（Astro 7 的要求）。

## 部署

推送到 `main` 分支，Netlify 自动构建部署。配置见 `netlify.toml`。

域名绑的是根域名 `ljf-dev.com`（阿里云 A 记录指向 Netlify）；`www` 作为别名。

## 内容约定

- 工作项目**隐去客户与机构名称**，只保留技术方案和可公开的成果数据
- 不使用任何原雇主的代码、截图或内部业务术语
- 项目数据如有出入以实际为准，不虚构量化指标
