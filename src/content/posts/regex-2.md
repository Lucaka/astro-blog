---
title: JS｜regex
date: "2022.05.13"
category: frontend
tags: ["JS"]
summary: 在HTML結構的文字 抓取html content
---

在HTML結構的文字 抓取html content
```
htmlString.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
```
