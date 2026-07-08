---
title: web｜beforeunload
date: "2024.08.02"
category: frontend
tags: ["JS", "web"]
summary: 當window 準備釋放它的資源時，該事件被觸發。此時文件仍然可見，且事件仍可被取消的。
---

當window 準備釋放它的資源時，該事件被觸發。此時文件仍然可見，且事件仍可被取消的。
```javascript
window.addEventListener("beforeunload", function (event) {
    console.log(window.location.href); // capture the url
    event.preventDefault(); // just to pause and see the condole
});
```
