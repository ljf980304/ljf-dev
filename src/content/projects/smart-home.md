---
title: 智能家居控制面板
summary: pnpm monorepo 单仓库：Vue 3 控制面板 + Express / SQLite 本地后端，一套接口契约前后端共用。
category: 个人项目
period: "2026.08"
role: 独立开发
stack: [Vue 3, TypeScript, Naive UI, Pinia, Vite, Express, SQLite, pnpm]
highlights:
  - 契约先行：后端按接口清单实现完，前端组件一行没改就切到真实接口
  - 设备模型按类型做判别联合，加设备类型不用碰公共字段
  - 后端用 Node 内置 node:sqlite，零原生依赖，Windows 上省掉 node-gyp 编译
cover: /shots/smart-home-devices.webp
repo: https://github.com/ljf980304/home-ai-smart-home
order: 2
draft: false
---

## 背景

想把家里的灯、空调、传感器接到一块自己写的控制面板上，顺带把后端也自己写一遍，不依赖任何云服务。

前端 Vue 3 + Naive UI，后端 Express + SQLite，用 pnpm workspace 放在同一个仓库里。**目前设备管理、总览、场景三个页面和本地后端都已经跑通**；AI 对话和真机设备接入还在做，进度写在最后。

## 结构

```
apps/dashboard   Vue 3 控制面板（Vite 8）
apps/server      Express 5 + SQLite 本地后端
docs/api         接口清单 —— 前后端共同遵守的契约
```

前端请求统一走 `/api` 前缀，dev 时由 Vite proxy 转发到本地后端；后端地址可以用环境变量覆盖，不用改代码。

**接口清单先于实现存在。** 先把 `docs/api/接口清单.md` 定下来，后端照着它实现，前端照着它写 service 层。好处在下面兑现了。

## 设备模型：改成按类型判别联合

一开始 `Device` 是个「大杂烩」——`brightness?` / `temperature?` / `speed?` 全堆在一个接口里，谁有值全靠注释说明。设备类型一多，这个接口会变成没人敢动的公共字段垃圾场。

改成判别联合，让 `type` 决定 `state` 的形态：

```ts
/** 所有设备共有的属性 */
interface DeviceBase {
  id: string
  name: string
  room: string
  online: boolean
  power: boolean
}

export type Device =
  | (DeviceBase & { type: 'light'; state: LightState })
  | (DeviceBase & { type: 'air-conditioner'; state: AirConditionerState })
  | (DeviceBase & { type: 'fan'; state: FanState })
  | (DeviceBase & { type: 'switch' | 'curtain' | 'sensor' | 'plug' })
```

这么改的三个好处：

- 接口自文档化，看类型就知道每种设备有哪些状态，不用翻文档
- 模板里 `v-if="device.type === 'fan'"` 之后，`device.state` 在 vue-tsc 里会自动收敛到 `FanState`，写错字段直接报错
- 以后加米家 / Matter 适配层，映射关系就是类型到类型，一目了然

代价是类型、service、store、视图、契约文档要一次性同步改完 —— 所以要趁代码量还小的时候做。

## 后端：为什么用 node:sqlite

`better-sqlite3` 这类方案要编译原生模块，Windows 上经常卡在 node-gyp 上，换台机器 clone 下来第一件事就是修环境。

Node 22.5 起内置了 `node:sqlite`（`DatabaseSync`），零原生依赖，装完就能跑。代价是**项目从此要求 Node ≥ 22.5**，这条写进了根目录 `engines`，pnpm 安装时会校验。

三张表（`devices` / `scenes`），首次启动自动建表并写入种子数据，SQLite 文件在 `apps/server/data/`，已 gitignore —— 删掉文件就等于重置数据。

设备状态更新按类型做**白名单合并**，跟判别联合契约对齐，脏字段进不来。

## 契约先行的回报

后端写完那天，前端切到真实接口**只改了一行** —— Vite proxy 的目标地址。组件、service、store 一行没动就通了。

这不是运气：契约是双方各自实现的依据，只要都照着它写，中间那层就是可替换的。

## 界面

**设备管理** —— 7 类设备卡片，每张卡按类型渲染不同的控制项：

![设备管理](/shots/smart-home-devices.webp)

**总览** —— 设备概况、类型分布、快捷控制和按房间分组：

![总览](/shots/smart-home-overview.webp)

**场景** —— 回家 / 睡眠 / 离家 / 观影四种模式，可启停：

![场景](/shots/smart-home-scenes.webp)

### 卡片为什么是数据驱动的

设备卡片的控制区写死 `v-if` 的话，七种设备就是七套模板。改成每类型一份 `DEVICE_CONTROLS` 清单，控件分三种（开关 / 单选 / 滑块），调整数组就能改默认显示项。

布局上定了两条：卡片固定高度、四区块（名称+标签 / 房间 / 控制区 / 更多）；控制区**默认最多显示 4 个控件**，超过的收进「···」打开的完整控制弹窗。风扇有挡位、模式、左右摇头、上下摇头、定时五项，正好用上这个规则。

挡位是按真实设备的 4 档物理语义建的（`windLevel: 1 | 2 | 3 | 4`），不是 0–100 的连续值 —— 设备本身就只有四档。

## 一次没排查完的故障

接第一台真机（小米桌面循环扇）时踩了个坑，值得记下来。

风扇连上电脑热点后，ARP 能查到 MAC、ping 也通，但 **miIO 的 54321 端口和 mDNS 全都没响应** —— 设备在，服务不在。

排查下来结论是：**Windows 移动热点不能共享「Wi-Fi 上网」**，热点里没有外网，风扇连上了热点却连不上米家云，局域网控制服务因此根本没启动。米家 App 里显示的「在线」是缓存的旧状态，不是真的在线。

顺带确认了一件事：**已绑定设备不会通过局域网泄露 token** —— `miIO.info` 对这类设备只返回 `token:"0"`，必须走云端接口提取。所以 token 提取那步是绕不过去的，不是配置问题。

这个问题**目前还没解决**，卡在给风扇提供一个有外网的环境上。适配层代码也就还没写。

## 现在的进度

写清楚做到哪儿了：

- ✅ monorepo 脚手架、dashboard 路由骨架
- ✅ 设备管理 / 总览 / 场景三个页面 + 数据层（乐观更新，失败回滚）
- ✅ 本地后端（Express + SQLite），接口全部按契约实现
- ✅ 设备模型判别联合、数据驱动的设备卡片
- 🚧 米家设备适配层 —— 卡在上面那个网络问题上
- ⬜ AI 对话 / 场景控制
- ⬜ `packages/` 共享包拆分

界面上那台风扇的状态是按真机规格建模的**种子数据**，不是真连上的设备 —— 真机还没接上，这条不想含糊过去。

改动都有研发日志记着，连同每次的决策理由和踩坑过程，都放在仓库的 `docs/` 里。
