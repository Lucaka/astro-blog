---
title: money format｜regex
date: "2023.10.05"
category: frontend
tags: ["JS", "money format"]
summary: regex 相關筆記與範例整理。
---

```javascript
const formatMoney = (money) => {
  return money.replace(new RegExp(`(?!^)(?=(\\d{3})+${money.includes('.') ? '\\.' : '$'})`, 'g'), ',')  
}

formatMoney('123456789') // '123,456,789'
formatMoney('123456789.123') // '123,456,789.123'
formatMoney('123') // '123'
```
