---
title: money format｜Intl.NumberFormat
date: "2023.05.03"
category: frontend
tags: ["JS", "money format"]
summary: 用瀏覽器內建的 Intl.NumberFormat 依語系格式化數字，做出千分位、貨幣等呈現。
---

`Intl.NumberFormat` 是瀏覽器內建的數字格式化工具，不用自己寫正則就能加上千分位、貨幣符號等。輸出格式會依「語系（locale）」而不同。

```javascript
const number = 123456.789;

// 不指定語系，使用執行環境的預設語系（例如 en-US）
console.log(new Intl.NumberFormat().format(number));
// "123,456.789"

// 指定語系：印度的千分位分組方式不同
console.log(new Intl.NumberFormat("en-IN").format(number));
// "1,23,456.789"

// 格式化成貨幣
console.log(
  new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" }).format(
    number,
  ),
);
// "$123,457"
```

> 沒有指定語系時，結果取決於執行環境（瀏覽器或 Node 的 ICU 設定），所以正式產品建議明確帶入語系，避免不同裝置顯示不一致。
