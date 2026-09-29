---
title: 宠物诊所管理后台
summary: 从零搭的连锁宠物诊所后台 Demo，重点演示路由级 + 按钮级 + 数据级三层权限体系。
category: 个人项目
period: "2026.09"
role: 独立开发
stack: [Vue 3, TypeScript, Vite, Element Plus, Pinia, ECharts]
highlights:
  - 路由级 + 按钮级 + 数据级三层权限，四种角色可在登录页一键切换对比
  - 静态托管没有后端，用 axios 自定义 adapter 把 mock 打进构建产物，线上照样能跑通全流程
  - 窄屏下换掉整个展示形态（表格→卡片流、侧边栏→抽屉），并用 390×844 视口逐页量过 scrollWidth
cover: /shots/dashboard.webp
demo: https://pet-clinic-admin.ljf-dev.com
repo: https://github.com/ljf980304/pet-clinic-admin
order: 1
draft: false
---

## 背景

想做一个能完整展示中后台开发能力的 Demo：不是几个孤立的组件示例，而是一套能真正点进去跑通「登录 → 看板 → 列表 → 表单」的完整系统。

重点放在**权限体系**上 —— 这是中后台项目里最容易被做得潦草、又最能看出工程水平的部分。所有数据由本地 mock 生成，不依赖任何后端。

## 三层权限

- **路由级**：按角色动态 `addRoute()`，没权限的菜单根本不挂载
- **按钮级**：用自定义指令直接把元素从 DOM 上摘掉，不是 `display: none` —— CSS 隐藏只是「看不见」，DOM 里还在
- **数据级**：门店隔离做在数据层，按当前登录用户过滤，前端传什么参数都绕不过去

四种角色（管理员 / 医生 / 前台 / 访客）可以在登录页一键切换，方便直接对比菜单和按钮的差异。

## 两个卡住过的地方

### Mock 数据要在生产环境也能跑

作品集部署到静态托管后是没有后端的。常见方案 `vite-plugin-mock` 只在 dev server 生效，构建产物里的接口请求会直接 404 —— 招聘方点开链接看到的是一片空白，作品集等于废了。

最后写了个 axios 自定义 adapter，把请求直接路由到本地 mock 分发器，不走网络层：

```ts
const mockAdapter: AxiosAdapter = async (config) => {
  const result = await dispatchMock({ url, method, params, data, token })
  const response = { data: result.body, status: result.status /* ... */ }
  if (result.status >= 200 && result.status < 300) return response
  throw new AxiosError(result.body.message, String(result.status), config, undefined, response)
}
```

mock 层跟着打包进产物，静态托管照跑不误。顺便模拟了 180–480ms 的网络延迟，loading 状态才是真的在转，而不是一闪而过。

### 动态路由刷新后 404

按角色 `addRoute()` 挂菜单，登录时一切正常；但页面一刷新，Pinia 是空的、路由表也是空的，当前地址匹配不到任何路由。

守卫里识别「有 token 但没有用户信息」这个状态，重新拉取用户信息并重建路由，然后返回一个重定向让导航**再跑一遍**：

```ts
accessible.forEach((route) => router.addRoute(route))
if (!router.hasRoute('CatchAll')) router.addRoute(catchAllRoute)
// 动态路由是刚刚才挂上去的，本次导航用的还是旧路由表，必须重跑一次才能匹配到
return { path: to.path, query: to.query, hash: to.hash, replace: true }
```

还有个坑：兜底路由 `/:pathMatch(.*)*` 必须等动态路由**全部挂完**再加，否则它会抢先匹配掉 `/pet` 这类路径。

## 界面

**档案列表** —— 多条件查询、服务端排序、分页、批量删除、CSV 导出，带 loading 与空态：

![档案列表](/shots/list.webp)

**权限演示**（这个 Demo 的重点）—— 同一个列表页，切到「前台」角色后编辑和删除入口直接消失，因为元素已经被指令从 DOM 上摘掉了：

![权限演示](/shots/permission.webp)

## 其他细节

**移动端** —— 1440px 宽的表格塞进 390px 的手机，列全挤成一团，横向滚动条还把卡片撑破了。做法是窄屏下整个换掉展示形态，而不是硬压缩：表格换卡片流，侧边栏收进抽屉（点完菜单自动收起），查询表单从行内排布改成一列。

这类问题是**截图看不出来、只有真机或真视口才暴露**的，最后靠 Playwright 切到 390×844 逐个页面量 `scrollWidth` 才确认没有横向溢出。

**CSV 导出中文乱码** —— Excel 默认按 GBK 解析 CSV，在内容最前面加一个 UTF-8 BOM 就好。

**504 Outdated Optimize Dep** —— 开发时进某个页面突然白屏。原因是按需引入插件为每个组件注入样式导入，而入口又整包引了一份 Element Plus 的 CSS，Vite 首次进入新页面时才发现这批新依赖，触发依赖重新预构建，打断了进行中的请求。关掉按需样式、样式统一在入口引一次即可。

更完整的踩坑记录写在仓库的 README 里。
