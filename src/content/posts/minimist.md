---
title: node｜minimist
date: "2023.02.16"
category: frontend
tags: ["node"]
summary: 可以解析node下,cmd 所帶入的參數
---

```
// script
node deploy/build.js --report --system=kch,ptch
```
可以解析node下,cmd 所帶入的參數
```javascript=
const argv = require('minimist')(process.argv.slice(2))
console.log('argv', argv)// argv { _: [], report: true, system: 'kch,ptch' }
```
