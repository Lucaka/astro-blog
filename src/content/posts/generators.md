---
title: JS｜Generators
date: "2023.05.14"
category: frontend
tags: ["JS"]
summary: `*` 表示為一個 Generator function type
---

`*` 表示為一個 Generator function type
```javascript=
function* doOperations() {
  yield 2;
  yield 3;
  return 4
}
const operations = doOperations();
// "next : ", {  done: false,  value: 2 }
console.log('next : ', operations.next());
// "next : ", {  done: false,  value: 3 }
console.log('next : ', operations.next());
// "next : ", {  done: true,  value: 4 }
console.log('next : ', operations.next());
```
可以強制結束, 一旦強制結束就不會執行任何動作,也不會返回值
:::warning
“Once a generator is completed, either normally or early, it no longer processes any code or returns any values.” — You Don’t Know JS: ES6 & Beyond by Kyle Simpson
:::
```javascript=
function* doOperations() {
  yield 2;
  yield 3;
  return 4
}
const operations = doOperations();
// "next : ", {  done: true,  value: undefined }
console.log('next : ', operations.return());
// "next : ", {  done: true,  value: undefined }
console.log('next : ', operations.next());
```
可以使用 function 產生複數個 yield

```javascript=
function* generateCharSequence(start, end) {
  for (let i = start; i <= end; i++) yield String.fromCharCode(i);
}
function* generateAPassword() {
  // 0..9
  yield* generateCharSequence(48, 57);
  // same as 
  // for (let i = start; i <= end; i++) yield String.fromCharCode(i);
}
let password = '';
for (let code of generateAPassword()) {
  password += code;
}
console.log('password : ', password);
// "password : ", "0123456789"
```
### FIFO
// ...
