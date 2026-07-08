---
title: JS｜multi screen
date: "2022.09.02"
category: frontend
tags: ["JS"]
summary: https://developer.chrome.com/docs/capabilities/web-apis/window-managem…
---

https://developer.chrome.com/docs/capabilities/web-apis/window-management?hl=zh-tw#demo

```javascript
async function openWindowToMultipleScreen(url) {
  const windowOpen = () =>
    window.open(
      url,
      '_blank',
      'popup=1,' + 'width=' + screen.width + ', height=' + screen.height + ', left=' + screen.width + ', top=' + 0
    )

  if (!('getScreenDetails' in window)) return windowOpen()
  const screenDetail = await window.getScreenDetails()

  const currentScreen = screenDetail.currentScreen
  const popup = windowOpen()
  if (currentScreen.left === 0) {
    const multiScreen = currentScreen.screens.find(screen => screen.left !== 0)
    popup.moveTo(multiScreen.width, 0)
    return
  } else {
    popup.moveTo(0, 0)
  }
}
```
