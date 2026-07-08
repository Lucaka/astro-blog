---
title: Mono-repo
date: "2022.05.12"
category: frontend
tags: ["Mono-repo"]
summary: 比較 Monolith、Multi-repo 與 Mono-repo 三種程式碼倉庫策略，以及 Nx、Lerna 等工具。
---

當專案越來越大、模組越來越多，「程式碼要放在幾個 Git 倉庫」就成了一個需要取捨的問題。這篇整理三種常見策略，以及對應的建置工具。

![Monorepo 示意圖](https://i.imgur.com/yjIOF7P.png)

## 三種策略

**Monolith：一個專案、一個 Git 倉庫。**

- 優點：實作簡單，一庫到底。
- 缺點：複雜專案的程式碼複用性低，不利於團隊協作。

**Multi-repo：拆成多個模組，一個模組一個 Git 倉庫。**

- 優點：模組劃分清晰，每個模組都是獨立的 repo，利於團隊協作。
- 缺點：程式碼管理難度增加。例如某個模組出現 bug，相關模組都要各自編譯、上線，還要手動控制版本，非常繁瑣；issue 也散在各個 repo，管理麻煩。

**Mono-repo：拆成多個模組，但所有模組放在同一個 Git 倉庫。**

- 優點：程式碼結構清晰、利於協作，同時集中在一個倉庫也降低了專案管理、程式碼管理與除錯的難度。
- 缺點：專案本身會變得龐大，模組一多也會遇到一些新問題：
  1. **幽靈依賴（phantom dependency）**：APP1 依賴了 `A@1.0.0`，APP2 也想用 `A@1.0.0`。此時在 APP2 裡直接 `import X from 'A'` 竟然跑得起來，看似沒問題，但其實 APP2 的 `dependencies` 裡根本沒宣告 A——它是「借用」了 APP1 裝下來的依賴。
  2. **peerDependencies 衝突**：APP1 依賴 `A@1.0.0`、APP2 依賴 `A@2.0.0`，若兩個版本完全不相容，專案就會直接壞掉。

因此 Mono-repo 需要更好的建置工具來管理，例如 Lerna、Nx。

## [Nx](https://github.com/nrwl/nx)

建立一個新的 workspace：

```bash
npx create-nx-workspace@latest
```

## [Lerna](https://github.com/lerna/lerna)

[Nx 與 Lerna 的差異](https://stackoverflow.com/questions/67000436/the-difference-between-nx-and-lerna-monorepos)：

- **Lerna** 專注於串連同一專案中的多個 package，並管理 npm 發佈，大致就這些。主要處理的是 package（而非完整應用），常搭配 gulp 或 rollup 輸出。
- **Nx** 更專注於管理多個 package 的整體開發流程，適合完整的應用，常搭配 webpack。

### 上手範例

需要 npm 7.0 以上版本（要用到 npm workspaces）。

```bash
# 初始化範例專案
git clone https://github.com/lerna/getting-started-example.git
cd getting-started-example
git checkout prelerna
npm install

# 加入 Lerna
npx lerna@latest init

# 視覺化 workspace 相依關係
npx nx graph

# 對所有專案執行指令
npx lerna run test
npx lerna run build
```

## 其他大型工具

同類型的還有各大公司自家的建置系統：Bazel（Google）、Buck（Facebook）、Pants（Twitter）。

---

參考資料：

- <https://zhuanlan.zhihu.com/p/516546403>
- <https://ithelp.ithome.com.tw/articles/10248776>
