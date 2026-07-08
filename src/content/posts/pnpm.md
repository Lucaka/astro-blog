---
title: PNPM
date: "2024.10.09"
category: frontend
tags: ["PNPM"]
summary: performant npm
---

performant npm
* pnpm add `pkg`
* pnpm install
* pnpm update
* pnpm remove
* pnpm link
* pnpm unlink


## options
* -w 
    npm i `<pkg>` -w, 將pkg 安裝在 root 的 node_module
* -r
    npm i `<pkg>` -r, 將pkg 安裝在所有 packages 中
* `--filter`
    npm i `<pkg>` --filter package, 將pkg 安裝在指定的 package 中
    
## Commands
| npm command   | pnpm equivalent  |
| ------------- | ---------------- |
| npm install   | pnpm install     |
| npm i `<pkg>` | pnpm add `<pkg>` |
| npm run `cmd` | pnpm `cmd`       |

:::info
When an unknown command is used, pnpm will search for a script with the given name
:::

## workspace (monorepo)
### workflow
1. npm i pnpm
2. pnpm init
3. 新增 pnpm-workspace.yaml 檔案. 並增加下方資訊
```
packages:
  # all packages in subdirs of packages/ and components/
  - 'packages/**'
```
4. 新增 packages 資料夾, 
   底下再新增各模組(e.g. pageages/ui, pageages/web), 
   並在模組底下執行pnpm init 初始化 package.json
   package name分別為 @test/ui, @test/web
   package type設定為 module
   ```json=
    {
      "name": "@test/ui",
      "type": "module",
      // ...
    }
   ```
   ```
   packages
   └ ui
      └ package.json
   └ web
      └ package.json
   pnpm-workspace.yaml
   ```
 5. 在pageages/ui 底下新增 index.js並加入
    ```javascript=
    export const add = (a,b) => a + b
    ```
    在root cmd 下 pnpm i @test/ui --filter @test/web
    接下來在pageages/web 底下新增 index,就能使用 @test/ui的東西了
    ```javascript= 
    import { add } from "@test/ui";
    ```
    
    
    
### Features
