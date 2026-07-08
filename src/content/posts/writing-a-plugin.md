---
title: plugin｜Writing a Plugin
date: "2024.12.04"
category: frontend
tags: ["webpack", "plugin"]
summary: webpack dev server 自定義訊息顯示
---

webpack dev server 自定義訊息顯示
```javascript
// test.js
class TestPlugin {
  constructor (options) {
    this.info = options.info || {}
  }

  apply (compiler) {
    compiler.hooks.done.tap('Show something', () => console.log(this.info))
  }
}
module.exports = TestPlugin
```

```javascript
// vue.config.js
const TestPlugin = require('./TestPlugin')
module.exports = {
  // ...
  configureWebpack: {
    plugins: [
      new TestPlugin({
        info: 'Piece of shit'
    ]
  }
}
```
npm run server後就會顯示info 所帶入的訊息
