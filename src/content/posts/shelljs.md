---
title: node｜shelljs
date: "2024.03.14"
category: frontend
tags: ["node"]
summary: 移除檔案
---

移除檔案
```javascript
const shell = require('shelljs')

shell.exec('npx rimraf dist')
```
