---
title: JS｜Object keys 排序
date: "2024.05.10"
category: frontend
tags: ["JS"]
summary: * 在ES6 之前Object 的鍵值對是無序的
---

* 在ES6 之前Object 的鍵值對是無序的
* 在ES6 之後Object 的鍵值對按照自然數、非自然數和Symbol 進行排序，自然數是按照大小升序進行排序，其他兩種都是按照插入的時間順序進行排序。

```javascript=
const objWithStrings = {
  "002": "002",
  [Symbol("first")]: "first",
  c: "c",
  b: "b",
  "100": "100",
  "001": "001",
  [Symbol("second")]: "second",
}

console.log(Reflect.ownKeys(objWithStrings));
// ["100", "002", "c", "b", "001", Symbol(first), Symbol(second)]
```
