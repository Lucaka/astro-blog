---
title: node｜取得指令內的參數
date: "2025.09.27"
category: frontend
tags: ["node"]
summary: 取得指令內的參數 相關筆記與範例整理。
---

```json
// package.json script
{
  "name": "mhms_frontend",
  "version": "0.10.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "serve:system": "vue-cli-service serve --system=kch,ptch",
    // ...
  },
  // ...
}
```
```
commands : npm run serve:system
// 同上
commands : npm run serve -- --system=kch,ptch
// 同上
commands : npx vue-cli-service serve -- --system=kch,ptch
```
```javascript
const { argv } = require('process')
console.log(argv)
```
![](https://i.imgur.com/C2Wdaav.png)
