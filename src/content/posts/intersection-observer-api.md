---
title: JS｜Intersection Observer API
date: "2024.12.01"
category: frontend
tags: ["JS"]
summary: Lazy-loading of images
---

* Lazy-loading of images 
* infinite scrolling
* 顯示在畫面上的比例

```javascript=
let options = {
  // dom
  root: document.querySelector('#scrollArea'),
  //
  rootMargin: '0px',
  // type: single number or an array of numbers
  // default: 0.0 => 表示監聽元素有1px相交,元素視為可見
  //          1.0 => 整個元素在都在可見範圍才算可見
  threshold: 1.0
  // threshold: [0.5, 1.0]
}

// 子元件在父元件中 顯示時呼叫
let callback = (entries, observer) => {
  // do something
}

// 監聽父元件
let observer = new IntersectionObserver(callback, options)

// 父元件內部的子元件 加入監聽
observer.observe(document.querySelector('#A'))
```
