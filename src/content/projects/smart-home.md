---
title: 万枢 · 全屋 AI 智能体
summary: 中立第三方的全屋智能体，不绑生态、数据全本地。目前落地的是设备控制基座这一层。
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

## 万枢是什么

一个**中立第三方**的全屋智能体：不绑定任何一家厂商的生态，把不同品牌的设备统一接进来；所有语音、设备记录、使用习惯**全部存在本地主机里**，不上传云端。

盯的是三个现有的缺口：

- **生态被锁死** —— 米家、华为智联、Aqara 各管各的，用户换一个品牌就得换一套中控
- **断网即瘫** —— 指令绕一圈云端，家里网一断，灯都开不了
- **老人用不了** —— 配网要点四五层菜单、说话带口音就识别不了，这是最需要它的人群反而最用不上

所以方向定成：**本地优先**（断网核心功能照常）、**零门槛语音配网**（不用点菜单，说设备类型 + 念设备底部的六位序列号就行）、**多方言离线识别**（不会说普通话也能用）、**家庭留言板**（对着它说一句，人回家自动定向播报）。

## 技术路线

四层，从交互到扩展：

| 层 | 选型 | 解决什么 |
|---|---|---|
| 前端交互层 | Vue 3 + TypeScript + Vite + Electron + Naive UI | 可视化控制面板，打包成 Windows 单文件 exe，另有大字体老年模式 |
| 后端服务层 | Node.js + Express + SQLite | 设备调度、本地数据；封装米家 / 华为 IoT SDK 与 Matter 协议（matter.js） |
| AI 语音能力层 | PaddleSpeech + Porcupine + 端侧开源大模型 + edge-tts | 多方言离线识别、自定义唤醒、自然语言指令解析、方言语音合成 |
| 扩展能力层 | 内网穿透 + 增量静默升级 | 外网远程访问、不发安装包的版本迭代 |

**已经落地的是前两层**，AI 语音层和扩展层还没开始 —— 具体进度在最后一节。

## 已落地：设备控制基座

```
apps/dashboard   Vue 3 控制面板（Vite 8）
apps/server      Express 5 + SQLite 本地后端
docs/api         接口清单 —— 前后端共同遵守的契约
```

前端请求统一走 `/api` 前缀，dev 时由 Vite proxy 转发到本地后端；后端地址可以用环境变量覆盖，不用改代码。

### 设备模型：按类型判别联合

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

这一步不只是为了好看 —— 后面要接米家和 Matter 的适配层，那时候就是「外部设备类型 → 这个契约」的映射。映射关系有类型兜着，比对着文档手写字段靠谱。

副产品：模板里 `v-if="device.type === 'fan'"` 之后，`device.state` 在 vue-tsc 里会自动收敛到 `FanState`，写错字段直接编译报错。

### 后端：为什么用 node:sqlite

这东西最终要装进用户家里的主机，**装不上的方案等于没方案**。`better-sqlite3` 这类要编译原生模块，Windows 上经常卡在 node-gyp，换台机器 clone 下来第一件事就是修环境。

Node 22.5 起内置了 `node:sqlite`（`DatabaseSync`），零原生依赖。代价是项目从此要求 Node ≥ 22.5，这条写进了根目录 `engines`，pnpm 安装时会校验。

设备状态更新按类型做**白名单合并**，跟判别联合契约对齐，脏字段进不来。

### 契约先行的回报

后端写完那天，前端切到真实接口**只改了一行** —— Vite proxy 的目标地址。组件、service、store 一行没动就通了。

不是运气：契约是双方各自实现的依据，只要都照着它写，中间那层就是可替换的。

## 界面

**设备管理** —— 7 类设备卡片，每张卡按类型渲染不同的控制项：

![设备管理](/shots/smart-home-devices.webp)

**总览** —— 设备概况、类型分布、快捷控制和按房间分组：

![总览](/shots/smart-home-overview.webp)

**场景** —— 回家 / 睡眠 / 离家 / 观影四种模式，可启停：

![场景](/shots/smart-home-scenes.webp)

卡片是**数据驱动**的：每类型一份 `DEVICE_CONTROLS` 清单，控件分三种（开关 / 单选 / 滑块），调整数组就能改默认显示项。布局定了两条 —— 卡片固定高度、四区块；控制区默认最多显示 4 个，超出的收进「···」打开的完整弹窗。风扇有挡位、模式、左右摇头、上下摇头、定时五项，正好用上这个规则。

挡位按真实设备的 4 档物理语义建模（`windLevel: 1 | 2 | 3 | 4`），不是 0–100 的连续值 —— 设备本身就只有四档。

## 一次没排查完的故障

接第一台真机（桌面循环扇）时踩的坑，值得记下来。

风扇连上电脑热点后，ARP 能查到 MAC、ping 也通，但 **miIO 的 54321 端口和 mDNS 全都没响应** —— 设备在，服务不在。

排查结论：**Windows 移动热点不能共享「Wi-Fi 上网」**，热点里没有外网，风扇连上了热点却连不上厂商云，局域网控制服务因此根本没启动。App 里显示的「在线」是缓存的旧状态。

顺带确认了一件事：**已绑定设备不会通过局域网泄露 token** —— `miIO.info` 对这类设备只返回 `token:"0"`，必须走云端接口提取。

这个问题**目前还没解决**，卡在给风扇提供一个有外网的环境上。适配层代码也就还没写。

## 现在的进度

一期拆成六个模块，总工期 14 个工作日：

| 模块 | 工期 | 状态 |
|---|---|---|
| 基础环境（Node + Express / Vue 3 + TS / SQLite） | 2 天 | ✅ 完成，就是现在这个仓库 |
| 端侧语音交互（离线唤醒 + ASR + 本地意图理解） | 4 天 | ⬜ 未开始 |
| 设备中控联动（米家 / Home Assistant 适配 + 场景自动化） | 3 天 | 🚧 场景管理页已完成，设备适配层未开始 |
| 本地多端同步（Socket.io + 桌面端 / 小程序） | 2 天 | ⬜ 未开始 |
| 适老化 UI（大字号、大触控区、首页三大按钮） | 1 天 | ⬜ 未开始，现在是普通桌面后台 |
| 全场景测试与验收 | 2 天 | ⬜ 未开始 |

**做完了大约 2–3 个工作日的量，AI 语音这一层整个还没动。**

所以界面上那台风扇是**种子数据** —— 模型按真机规格建的，但真机还没接上，这条不想含糊过去。

产品规划、模块拆解和每次的决策理由都放在仓库的 `docs/` 里。
