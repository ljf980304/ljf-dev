---
title: 全屋 AI 智能家居
summary: 个人项目，pnpm workspace 单仓库：Vue 3 控制面板 + Express / SQLite 本地后端。
category: 个人项目
period: "2026"
role: 独立开发
stack: [Vue 3, TypeScript, Naive UI, Pinia, Vite, Express, SQLite, pnpm]
highlights:
  - pnpm workspace 管理前后端两个应用，共用一套类型和接口契约
  - 后端用 Node 内置的 node:sqlite，没有原生依赖，clone 下来装完就能跑
order: 2
draft: true
---

<!-- TODO: 这个项目还在做，完成后再把 draft 改成 false 上线。 -->
<!-- 正文待补：设备接入方式、AI 部分具体做了什么、遇到的主要问题。 -->

## 背景

想把自己家的灯光、空调、传感器这些东西接到一个自建的控制面板上，顺带把本地后端也自己写一遍，不依赖任何云服务。

## 结构

pnpm workspace 单仓库，`apps/dashboard` 是 Vue 3 前端，`apps/server` 是 Express + SQLite 后端。前端请求统一走 `/api` 前缀，dev 时由 Vite proxy 转发到本地后端。

后端用的是 Node 内置的 `node:sqlite`（22.5+ 引入），不需要编译原生模块，省掉了 `better-sqlite3` 那类依赖在 Windows 上的编译问题。

技术细节整理中。
