---
title: Shader Field Notes
date: "2024.12"
category: demo
tags: ["GLSL", "Graphics"]
summary: 累積的一些片段著色器技巧與筆記。
---

從 **SDF**、噪聲到後製，收集實作過程中反覆用到的 shader 片段。

- `smoothstep` 是你最好的朋友
- 用噪聲打破一切完美的規律
- 後製決定畫面的「氛圍」

例如一個常用的柔邊圓形遮罩：

```glsl
float softCircle(vec2 uv, vec2 center, float radius, float edge) {
  float d = distance(uv, center);
  return 1.0 - smoothstep(radius - edge, radius + edge, d);
}
```
