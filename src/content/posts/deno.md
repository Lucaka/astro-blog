---
title: other｜Deno
date: "2025.10.28"
category: frontend
tags: ["Deno"]
summary: Deno 環境使用ES modules
---

Deno 環境使用ES modules
### VSCode plugin
![](https://i.imgur.com/gLTEEcg.png =640x400)

### cmd
* args
```
deno run main.ts a b -c --quiet
```
```typescript
console.log(Deno.args) // [ "a", "b", "-c", "--quiet" ]
```
* automatically be restarted / formatted / tested / bundled.
```
deno run --watch main.ts
deno test --watch
deno fmt --watch
```
* bundle
deno bundle `<file>` `output dir`
```
deno bundle main.ts min.js
```
### unit test
Deno.test ....

### third-party-module
https://www.jsdelivr.com/esm

<a href="https://www.skypack.dev" class="link">Skypack</a>, <a href="https://jspm.io" class="link">jspm.io</a>, <a href="https://www.jsdelivr.com/" class="link">jsDelivr</a> or <a href="https://esm.sh/" class="link">esm.sh</a>.
```
// import dayjs from 'https://cdn.skypack.dev/dayjs@1.11.2';
// import dayjs from 'https://esm.run/dayjs';
```

### exmaple

#### Managing dependencies
管理所有載入的套件, Deno沒有像NPM package管理方式, Deno 的解決方式是新增一個檔案(`deps.ts`)並將所使用到的依賴統一匯入匯出。也可以分成開發依賴、生產依賴

```typescript
// deps.ts
import dayjs from 'https://esm.run/dayjs';

export {
   dayjs
}
```

#### Fetch data
