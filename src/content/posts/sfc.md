---
title: Vue SFC｜在SFC內寫一個元件
date: "2024.05.16"
category: frontend
tags: ["Vue.js", "Vue SFC"]
summary: 在SFC內寫一個元件 相關筆記與範例整理。
---

```javascript
<script setup lang="tsx">
const Foo = (props: {msg: string }) => {
   return <div>{props.msg}</div>
}
</script>
<template>
    <Foo :msg="" />
</template>
```
