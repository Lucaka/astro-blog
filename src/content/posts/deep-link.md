---
title: iOS｜Deep Link
date: "2025.03.05"
category: frontend
tags: ["Mobile", "網頁開啟 APP", "iOS"]
summary: iOS9 以前使用 URL Scheme 開啟 APP 的方式,未安裝時會出現轉跳錯誤訊息。
---

目前網頁開啟IOS APP的方式有兩種
`Universal Link` : 點選連結會直接開啟APP 不會開啟瀏覽器.
有裝APP: 直接開啟應用程式
沒裝APP: 會開啟URL連結
`Deep Link(<iOS9)` : 開啟瀏覽器由前端使用 URL Scheme 開啟APP.
有裝APP: 直接開啟應用程式
沒裝APP: 會開啟URL連結, 但會出現轉跳錯誤的訊息

#### Deep Link
使用 URI schemes
```typescript
window.location.href = 'xxxxapp://redirect/*'
```


站台設定 (/.well-known/apple-app-site-association)
