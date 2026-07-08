---
title: HTML attribute｜hidden
date: "2022.09.22"
category: frontend
tags: ["HTML", "HTML attribute"]
summary: "hidden 是一個布林屬性，加上去的元素會被瀏覽器隱藏，效果等同於 display: none。"
---

`hidden` 是一個**布林屬性**：只要加在元素上，瀏覽器就不會顯示它，效果等同於 `display: none`——元素不佔版面、螢幕閱讀器也會略過。

```html
<p hidden>這段文字不會顯示在畫面上。</p>

<abbr
  title="Strategic Homeland Intervention, Enforcement, and Logistics Division"
>
  SHIELD
</abbr>
```

要再顯示出來，用 JavaScript 移除屬性即可：

```javascript
element.hidden = false;
// 或
element.removeAttribute("hidden");
```

> 注意：CSS 的 `display` 會蓋過 `hidden`。若元素被設定了 `display: block`，即使加上 `hidden` 也依然會顯示。
