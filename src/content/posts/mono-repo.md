---
title: Mono-repo
date: "2022.05.12"
category: frontend
tags: ["Mono-repo"]
summary: * MonoLith：一個項目，一個Git倉庫。
---

![](https://i.imgur.com/yjIOF7P.png)
* MonoLith：一個項目，一個Git倉庫。
優點：實現簡單，一庫到底。
缺點：複雜項目代碼復用性低，且不利於團隊協作。
* Multi-Repo：劃分為多個模塊，一個模塊一個Git倉庫
優點：模塊劃分清晰，每個模塊都是獨立的repo，利於團隊協作
缺點：代碼管理難度增加。比如：1.某個模塊出現bug 相應模塊都需要編譯、上線、涉及到手動控製版本非常繁瑣。2.issue 管理十分麻煩。
* Mono-Repo：劃分為多個模塊，所有模塊放在一個Git倉庫
優點：代碼結構清晰，利於團隊協作，同時一個庫降低了項目管理、代碼管理以及代碼調試難度。
缺點：項目變得龐大，模塊變多後同樣會遇到各種問題。
    1. 幽靈依賴（phantom dependency） : 
    APP1依賴了`A@1.0.0`,APP2也想用 `A@1.0.0` 這個依賴, 這時，在APP2中使用 `import X from 'A'` 直接跑通了，看起來沒什麼問題，但其實APP2的 dependencies 中並沒有添加 A 依賴。
    2. peerDependencies 錯誤 : 
    APP1依賴`A@1.0.0`, APP2依賴`A@2.0.0` ,若 `A@1.0.0` 和 `A@2.0.0` 完全不兼容,專案就會直接掛掉
    
    所以需要有更好的構建工具支持。例如:Lerna


## [Nx](https://github.com/nrwl/nx)

### Create a new workspace
`npx create-nx-workspace@latest`

## [Lerna](https://github.com/lerna/lerna)


[the difference between nx and Lerna](https://stackoverflow.com/questions/67000436/the-difference-between-nx-and-lerna-monorepos)
* `Lerna` is focused on linking multiple packages from the same project and managing npm publishing, and that's about it.
* `Nx` is more focused on managing development workflow for multiple packages.

`Lerna` 主要是處理package而非一個應用, 主要使用 glup or rollup 來進行輸出
`Nx` 主要使處理完整開發流程的應用, 主要使用 webpack

### Tutorial
需要 npm 7.0以上版本(使用 npm workspaces)

#### init
```
git clone https://github.com/lerna/getting-started-example.git
cd getting-started-example
git checkout prelerna
npm install
```
#### Adding Lerna
`npx lerna@latest init`
#### Visualizing Workspace
`npx nx graph`

`npx lerna run test`
#### Building All Projects
`npx lerna run build`


## Bazel (Google)
## Buck (Facebook)
## Pants (Twitter)

refs:
https://zhuanlan.zhihu.com/p/516546403
https://ithelp.ithome.com.tw/articles/10248776
