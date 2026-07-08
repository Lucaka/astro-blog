---
title: NPM｜module mode
date: "2024.02.13"
category: frontend
tags: ["NPM"]
summary: package.json
---

package.json
```json
{
  "name": "@test/utils",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  // es module mode
  "type": "module",
  // ...
  "dependencies": {
    "@test/utils": "workspace:^1.0.0",
    "axios": "^0.25.0
    // ...
  }0
}

```
