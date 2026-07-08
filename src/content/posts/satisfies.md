---
title: TypeScript｜satisfies
date: "2022.10.19"
category: frontend
tags: ["TypeScript"]
summary: satisfies 相關筆記與範例整理。
---

```typescript=
type Type = {
  amount: number | string
}

const record= {
  amount: 123.11,
} satisfies Type

console.log(Math.floor(record.amount)) // amount 的型別會是 number
```
