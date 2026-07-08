---
title: plugin｜SpeedMeasurePlugin
date: "2025.08.13"
category: frontend
tags: ["webpack", "plugin"]
summary: 顯示各項目的編譯速度
---

顯示各項目的編譯速度

```javascript=
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin({
  disable: !process.env.MEASURE // MEASURE=true npm run build
  outputFormat: 'humanVerbose',
  compareLoadersBuild: {
    filePath: `./buildInfo.${system?.length === 1 ? system[0] : 'index'}.json`
  }
})

module.exports = {
    configureWebpack: smp.wrap({
    plugins: [...]
  })
}

```
