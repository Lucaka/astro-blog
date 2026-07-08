---
title: iOS｜Universal Link
date: "2025.05.03"
category: frontend
tags: ["Mobile", "網頁開啟 APP", "iOS"]
summary: 點選連結直接開啟 APP、不經過瀏覽器,需設定 apple-app-site-association 檔案。
---

目前網頁開啟IOS APP的方式有兩種
`Universal Link` : 點選連結會直接開啟APP 不會開啟瀏覽器.
有裝APP: 直接開啟應用程式
沒裝APP: 會開啟URL連結
`Deep Link(<iOS9)` : 開啟瀏覽器由前端使用 URL Scheme 開啟APP.
有裝APP: 直接開啟應用程式
沒裝APP: 會開啟URL連結, 但會出現轉跳錯誤的訊息

#### Universal Link
指定路徑下設定相關檔案

> apple-app-site-association 取得方式, 
> =>iOS14 使用Apple CDN;
> <iOS14 由站台提供


`https://<fully qualified domain>/.well-known/apple-app-site-association`
```
{
    "applinks": {
        "details": [
            {
                "appIDs": [
                    "xxxx.xxx"
                ],
                "components": [
                    {
                        "/": "/redirect/app",
                        "?": {
                            "orgId": "*"
                        }
                    }
                ]
            }
        ]
    }
}
```
https://developer.apple.com/documentation/xcode/supporting-associated-domains

:::warning
**Important**

Apple's content delivery network requests the apple-app-site-association file for your domain within 24 hours. Devices check for updates approximately once per week after app installation.
:::
