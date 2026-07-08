---
title: plugin｜FriendlyErrorsWebpackPlugin
date: "2023.08.23"
category: frontend
tags: ["webpack", "plugin"]
summary: vue cli 顯示自訂訊息
---

vue cli 顯示自訂訊息

```javascript
configureWebpack: {
    plugins: [
      new FriendlyErrorsWebpackPlugin({
        compilationSuccessInfo: {
          messages: system.map(sysName => `${sysName}:\t` + chalk.cyan(`http://localhost:${port}/${sysName}`))
        }
      })
    ]
  }
```
