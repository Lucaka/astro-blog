---
title: Vue SFC｜在元件內寫一個字定義directive
date: "2025.06.15"
category: frontend
tags: ["Vue.js", "Vue SFC"]
summary: 在元件內寫一個字定義directive 相關筆記與範例整理。
---

```javascript
<script setup> 
const vBackground = {
  mounted: el => el.style.background = 'blue'
}
</script>

<template>
   <div v-background>55688</div>
</template>
```
