---
title: JS｜Generators
date: "2023.05.14"
category: frontend
tags: ["JS"]
summary: function* 定義的產生器函式可以暫停與恢復執行，透過 next() 一次取一個值。
---

在 `function` 後面加上 `*` 就是一個 **Generator（產生器）函式**。它最特別的地方是可以「暫停」與「恢復」執行：每呼叫一次 `next()`，就從上一個 `yield` 之後繼續跑，直到遇到下一個 `yield` 或 `return`。

```javascript
function* doOperations() {
  yield 2;
  yield 3;
  return 4;
}

const operations = doOperations();

console.log("next : ", operations.next()); // { done: false, value: 2 }
console.log("next : ", operations.next()); // { done: false, value: 3 }
console.log("next : ", operations.next()); // { done: true,  value: 4 }
```

每次 `next()` 回傳一個物件：`value` 是這次 `yield`／`return` 的值，`done` 表示產生器是否已結束。

## 提前結束

呼叫 `return()` 可以強制結束產生器。一旦結束，之後再呼叫 `next()` 也不會再執行任何程式碼或回傳新的值。

```javascript
function* doOperations() {
  yield 2;
  yield 3;
  return 4;
}

const operations = doOperations();

console.log("next : ", operations.return()); // { done: true, value: undefined }
console.log("next : ", operations.next()); // { done: true, value: undefined }
```

> “Once a generator is completed, either normally or early, it no longer processes any code or returns any values.”
> — _You Don't Know JS: ES6 & Beyond_, Kyle Simpson

## 用 yield\* 委派給另一個產生器

`yield*` 可以把另一個產生器（或可迭代物件）的值「攤平」接進來，方便組合出更長的序列。

```javascript
function* generateCharSequence(start, end) {
  for (let i = start; i <= end; i++) yield String.fromCharCode(i);
}

function* generateAPassword() {
  // 0..9（字元碼 48–57）
  yield* generateCharSequence(48, 57);
}

let password = "";
for (const code of generateAPassword()) {
  password += code;
}

console.log("password : ", password); // "0123456789"
```
