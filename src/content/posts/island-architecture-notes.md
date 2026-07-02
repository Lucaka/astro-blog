---
title: Islands & Partial Hydration
date: "2025.01"
category: blog
tags: ["Astro", "Performance"]
summary: Astro 的 island 架構如何在預設零 JS 下做互動。
---

說明 **partial hydration** 的取捨，以及何時該把一塊 UI 變成 island。

預設送出零 JavaScript，只有真正需要互動的區塊才 hydrate——這就是 island 架構讓頁面又快又互動的關鍵。
