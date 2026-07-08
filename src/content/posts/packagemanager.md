---
title: node｜packageManager
date: "2024.06.09"
category: frontend
tags: ["node"]
summary: node.js v16.9.0 的實驗功能, 需搭配 Corepack 使用
---

node.js v16.9.0 的實驗功能, 需搭配 Corepack 使用

可以確保您的團隊使用完全相同的套件管理器版本，而無需安裝除了 Node.js 以外的其他東西。

Corepack 有支援的 Package manager
| Package manager | Binary names |
| -------- | -------- |
| Yarn     | yarn, yarnpkg  |
| pnpm     | pnpm, pnpx   |

### 使用方式
1. package.json 建立 packageManager
```
// package.json
{
  "name": "test",
  "version": "0.0.0",
  "packageManager": "pnpm@8.6.2",
  "scripts": {
  // ...
```
2. 執行 `corepack enable`
3. pnpm run `script`
