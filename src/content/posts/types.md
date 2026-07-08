---
title: vs code｜Types
date: "2022.09.09"
category: frontend
tags: ["vs code"]
summary: Types 相關筆記與範例整理。
---

```javascript
export const useTodos = defineStore('todos', {
  state: () => ({
    /** @type {{ text: string, id: number, isFinished: boolean }[]} */
    todos: [],
    /** @type {'all' | 'finished' | 'unfinished'} */
    filter: 'all',
    nextId: 0,
  },
})    
```
