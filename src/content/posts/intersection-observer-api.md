---
title: JS｜Intersection Observer API
date: "2024.12.01"
category: frontend
tags: ["JS"]
summary: 用非同步的方式監聽元素是否進入畫面，常用於圖片延遲載入、無限捲動與進場動畫。
---

`IntersectionObserver` 讓你**非同步地監聽某個元素是否進入畫面（或某個容器）的可視範圍**，不必自己在 scroll 事件裡反覆計算位置，效能更好。常見用途：

- 圖片延遲載入（lazy-loading）
- 無限捲動（infinite scrolling）
- 元素進場才觸發動畫，或計算它露出畫面的比例

## 基本用法

建立 observer 時傳入兩個參數：一個 callback，以及一組 options。

```javascript
const options = {
  // 作為「可視範圍」基準的容器；null（預設）代表整個瀏覽器視窗
  root: document.querySelector("#scrollArea"),
  // 對 root 範圍做內縮／外擴，語法同 CSS margin
  rootMargin: "0px",
  // 露出多少比例才觸發 callback，可傳單一數字或陣列
  //   0.0（預設）：只要露出 1px 就視為可見
  //   1.0：整個元素完全進入範圍才算可見
  threshold: 1.0,
  // threshold: [0.5, 1.0] 也可以在多個比例各觸發一次
};

// 目標元素進入／離開範圍時就會呼叫
const callback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // 元素目前可見，做點事情⋯⋯
    }
  });
};

const observer = new IntersectionObserver(callback, options);

// 開始監聽指定的目標元素
observer.observe(document.querySelector("#A"));
```

`callback` 收到的 `entries` 是一組 `IntersectionObserverEntry`，可以透過 `entry.isIntersecting` 判斷是否可見、`entry.intersectionRatio` 取得露出比例。
