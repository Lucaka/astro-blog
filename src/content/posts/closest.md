---
title: JS｜closest
date: "2022.10.22"
category: frontend
tags: ["JS"]
summary: 取得最近距離的祖元素
---

取得最近距離的祖元素
```htmlembedded=
 <div id="div-01">Here is div-01
    <div id="div-02">Here is div-02
      <div id="div-03">Here is div-03</div>
    </div>
  </div>
```
```javascript=
const el = document.getElementById('div-03');

// the closest ancestor with the id of "div-02"
console.log(el.closest('#div-01')); // <div id="div-01">
```
