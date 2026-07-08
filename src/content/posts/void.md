---
title: JS｜void
date: "2023.04.26"
category: frontend
tags: ["JS"]
summary: 語法
---

語法
```
void expression
```

```javascript
void 0;   // undefined
void(0);  // undefined

// 匿名函式
void function saySomething (msg) {
  console.log(msg);
} ('Hello');

saySomething('Hi'); // Uncaught ReferenceError: saySomething is not defined
```
void vs undefined 
undefined 並不是保留詞（reserved word）
