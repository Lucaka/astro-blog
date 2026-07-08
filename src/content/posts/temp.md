---
title: temp
date: "2024.05.04"
category: frontend
tags: ["temp"]
summary: temp 相關筆記與範例整理。
---

```typescript
function selectHandle(target: Option, tag: 'selected' | 'open', mode: 'single' | 'multi', list: Option[] = dateList) {
    let parentData: Option | null = null

    list.forEach(data => {
        // single
        if (data.key === target.key && target[tag]) {
            parentData = data
            return
        }

        // multi
        if (mode === 'multi' && data[tag]) {
            parentData = data
            return
        }

        data.selected = false

        if (data.childern) selectHandle(target, tag, mode, data.childern) ? parentData = data : null
    })

    if (parentData) {
        (parentData as Option)[tag] = true
    }

    return parentData
}
```
