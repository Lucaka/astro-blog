---
title: JS｜insertBefore
date: "2023.11.25"
category: frontend
tags: ["JS"]
summary: 同一個節點並不會同時出現在兩個地方。所以當節點已經有父節點，它會先被移除，然後被插入在新的位置上。
---

同一個節點並不會同時出現在兩個地方。所以當節點已經有父節點，它會先被移除，然後被插入在新的位置上。
```javascript=
parentNode.insertBefore(newNode, referenceNode);
```
