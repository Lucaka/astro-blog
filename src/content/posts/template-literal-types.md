---
title: TypeScript｜Template Literal Types
date: "2023.03.04"
category: frontend
tags: ["TypeScript"]
summary: 樣板文字類型
---

[樣板文字類型](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

```typescript=
type HeadingLevel = 1 | 2 | 3 | 4 | 5
type HeadingType = `h${HeadingLevel}`
const heading1: HeadingType = "h3" // 🟢
const heading2: HeadingType = "h6" // Type '"h6"' is not assignable to type ...


type Power2 = 1 | 2 | 4 | 8 | 16 | 32 | 64
type FileUnit = "B" | "KB" | "MB" | "GB"

type FileSize1 = `${number}${FileUnit}`
type FileSize2 = `${Power2}${FileUnit}`

const limitSize1_33MB: FileSize1 = "33MB" // 🟢

const limitSize2_32MB: FileSize2 = "32MB" // 🟢
const limitSize2_33MB: FileSize2 = "33MB" // Type '"33MB"' is not assignable to type ...
```
