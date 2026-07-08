---
title: VS Code｜用 JSDoc @type 為 JS 加上型別提示
date: "2022.09.09"
category: frontend
tags: ["vs code", "JSDoc"]
summary: 不寫 TypeScript，也能用 JSDoc 的 @type 註解讓 VS Code 給出型別檢查與自動補全。
---

即使專案是純 JavaScript，也可以透過 **JSDoc 的 `@type` 註解**讓 VS Code 推斷型別，得到自動補全與錯誤提示——不必改寫成 TypeScript。

以下用 Pinia store 為例，替 `state` 的每個欄位標註型別：

```javascript
export const useTodos = defineStore("todos", {
  state: () => ({
    /** @type {{ text: string, id: number, isFinished: boolean }[]} */
    todos: [],
    /** @type {'all' | 'finished' | 'unfinished'} */
    filter: "all",
    nextId: 0,
  }),
});
```

這樣一來，存取 `todos` 時 VS Code 就知道陣列元素有 `text`、`id`、`isFinished`；把 `filter` 指派成清單以外的字串時，也會即時標紅提示。
