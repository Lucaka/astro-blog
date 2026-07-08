---
title: JS｜previousSibling
date: "2024.03.29"
category: frontend
tags: ["JS"]
summary: 取得相同父元素下,前一個子元素節點(Node)
---

取得相同父元素下,前一個子元素節點(Node)
```html
<img id="b0">
<img id="b1">
<img id="b2">
```
```javascript
document.getElementById("b1").previousSibling;                 // #text
document.getElementById("b1").previousSibling.previousSibling; // <img id="b0">
```
