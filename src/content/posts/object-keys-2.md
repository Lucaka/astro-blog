---
title: TypeScript｜Object.keys
date: "2022.09.01"
category: frontend
tags: ["TypeScript"]
summary: 解決 key 無法型別判斷的問題 參考
---

解決 key 無法型別判斷的問題 [參考](https://twitter.com/mattpocockuk/status/1681267079977000961)

```typescript
const user = {
    name: 'James',
    age: 111
}

// solution 1
const keys1 = Object.keys(user) as Array<keyof typeof user>
keys1.forEach(key => {
    console.log(user[key])
})

// solution 2
const keys2 = Object.keys(user)
keys2.forEach(key => {
    console.log(user[key as keyof typeof user])
})
```
