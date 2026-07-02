---
title: Rendering a Black Hole
date: "2025.03"
category: demo
tags: ["Three.js", "GLSL", "WebGL"]
summary: 用 Three.js 打造吸積盤、光子環與重力透鏡的即時渲染。
---

拆解**吸積盤粒子系統**、螢幕空間重力透鏡與光子環的實作細節，以及如何在維持 60fps 下堆疊這些效果。

1. 吸積盤：以 Keplerian 螺旋回收粒子
2. 重力透鏡：螢幕空間後製，僅在陰影邊緣扭曲
3. 光子環：釘在陰影半徑上的細環，交給 bloom 發光
