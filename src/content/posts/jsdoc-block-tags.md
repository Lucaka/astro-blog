---
title: vs code｜JSDoc block tags
date: "2024.09.24"
category: frontend
tags: ["vs code"]
summary: JSDoc block tags 相關筆記與範例整理。
---

```javascript
// src/toast.js

/**
 * @typedef {Object} Toast
 * @property {string} id
 * @property {boolean} closed - Indicates whether user has close the toast.
 * @property {Date} generatedOn - Indicates when the toast was generated.
 * @property {string} message - toast content.
 * @property {"warn" | "info"} type -  Indicates type of toast.
 * Also useful to show different icons.
 */

/**
 * A function for showing toast
 * @param {Toast} toast - {@link toast} object
 * containing all components of the toast.
 */
export function showToast(toast) {}
```
