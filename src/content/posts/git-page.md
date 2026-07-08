---
title: Git Page
date: "2025.10.09"
category: frontend
tags: ["Git Page"]
summary: 將dist 資料夾內的東西推至 指定github 分支
---

將dist 資料夾內的東西推至 指定github 分支 
```
set -e
npm run build
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:Hi-Alan-Liu/the-f2e-4th.git master:gh-pages
cd -
```

## [Gitter](https://gitter.im/)
Gitter是GitHub儲存庫的開發人員和使用者的即時通訊聊天室系統。

## Release Note

### Vue 
Release Note 統一在 CHANGELOG.md 顯示
```
v3.3.4 Latest
Please refer to CHANGELOG.md for details.
```

:::info 
`CHANGELOG.md`

####  [3.x.x](https://github.com/vuejs/core/compare/v3.3.3...v3.3.4) (2023-05-18)

##### Features

* **sfc:** support imported types in SFC macros ([#8083](https://github.com/vuejs/core/pull/8083))
* 
##### Bug Fixes

* **build:** ensure correct typing for node esm ([d621d4c](https://github.com/vuejs/core/commit/d621d4c646b2d7b190fbd44ad1fd04512b3de300))
* **compiler-sfc:** handle imported types from default exports ([5aec717](https://github.com/vuejs/core/commit/5aec717a2402652306085f58432ba3ab91848a74)), closes [#8355](https://github.com/vuejs/core/issues/8355


:::
