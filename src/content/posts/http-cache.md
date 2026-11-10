---
title: HTTP｜快取筆記：Last-Modified、ETag、no-cache 與 10% 啟發式
date: "2026.11.10"
category: frontend
tags: ["HTTP", "Cache", "IIS"]
summary: 沒寫 Cache-Control 時，瀏覽器會依 Last-Modified 自己猜有效期
---

整理自 `server/web.config` 的快取討論。重點：沒寫 `Cache-Control` 時，瀏覽器會自己猜有效期。

## 1. 四個角色

| 項目 | 類型 | 作用 |
|---|---|---|
| `Last-Modified` | 回應標頭 | 檔案最後修改時間。驗證用，也是啟發式快取的計算依據 |
| `ETag` | 回應標頭 | 檔案版本指紋。驗證用 |
| `Cache-Control` | 回應標頭 | 明確指定新鮮度策略（`max-age`、`no-cache`、`no-store`…） |
| `If-None-Match` | 請求標頭 | 瀏覽器帶上快取的 ETag，問伺服器「還一樣嗎」 |

**分工**：ETag / Last-Modified 回答「檔案變了嗎」；Cache-Control 回答「還要不要問伺服器」。

## 2. 驗證流程（條件請求）

1. 瀏覽器快取了檔案與 `ETag: "abc"`。
2. 快取過期（或被要求驗證）時，帶 `If-None-Match: "abc"` 發請求。
3. ETag 一致 → **304 Not Modified**，無 body，沿用快取。
4. ETag 不同 → **200 OK** 加新內容與新 ETag。

**注意**：ETag 沒變回的是 **304**，不是 204。204 是「成功但本來就沒有內容」，與快取驗證無關。

## 3. `no-cache` 的真正意思

- `Cache-Control: no-cache` = **可以存，但每次使用前必須向伺服器驗證**。
- 不是「不快取」。真正禁止儲存的是 `no-store`。
- 搭配 ETag：沒變回 304（省流量），有變回 200（拿新檔）。
- 規格出處：RFC 9111 第 5.2.2.4 節。

## 4. 沒有 Cache-Control 時：啟發式快取

IIS 對靜態檔案預設只送 `Last-Modified` 與 `ETag`，不送 `Cache-Control`。此時快取允許自行估算有效期，這叫**啟發式新鮮度**（heuristic freshness）。

### RFC 9111 第 4.2.2 節

出處：<https://www.rfc-editor.org/rfc/rfc9111#section-4.2.2>

大意：回應有 `Last-Modified` 時，鼓勵快取使用**不超過「自該時間以來經過時間」某個比例**的啟發式有效期；這個比例的**典型設定可能是 10%**（原文 "A typical setting of this fraction might be 10%"）。

**這是規格裡的範例，不是強制規定值。** 各瀏覽器用什麼比例，是自己的實作決定；瀏覽器是否另有上限，本筆記未查證。

此機制的前提：

- 回應沒有明確的新鮮度資訊（沒有 `max-age`、`Expires`）。
- 狀態碼屬於預設可被啟發式快取的類型（例如 200）。
- 有 `Cache-Control: no-cache` 時就不走啟發式。

### 計算公式

```text
有效期 ≈ (抓取時間 − Last-Modified) × 10%
```

**用「抓取時間」算，不是用現在**：有效期在瀏覽器收到回應時就固定，之後不會重算。

### 範例：Last-Modified = 昨天 18:00

| 抓取時間 | 檔案年齡 | 有效期 | 大約到期 |
|---|---|---|---|
| 昨天 18:30 | 30 分 | 3 分 | 昨天 18:33 |
| 昨天 22:00 | 4 小時 | 24 分 | 昨天 22:24 |
| 今天 00:00 | 6 小時 | 36 分 | 今天 00:36 |
| 今天 09:00 | 15 小時 | 1.5 小時 | 今天 10:30 |
| 今天 12:00 | 18 小時 | 1.8 小時 | 今天 13:48 |
| 今天 18:00 | 24 小時 | 2.4 小時 | 今天 20:24 |

檔案放越久才被抓，有效期越長：Last-Modified 一週前的檔案，有效期約 17 小時。

## 5. 風險：SPA 的 index.html

- `index.html` 引用帶 hash 的 chunk。
- 部署新版後，舊 chunk 會被刪除。
- 若瀏覽器在啟發式有效期內繼續用舊 `index.html`，就會請求到已不存在的 chunk，載入失敗。
- 本專案 `web.config` 的 `assets/` 規則會對不存在的檔案回 **404**，不會 fallback 成 `index.html`，避免瀏覽器把 HTML 當 JS 執行而噴 MIME 錯誤。

## 6. 建議設定

| 資源 | Cache-Control | 原因 |
|---|---|---|
| `index.html`（全站預設） | `no-cache` | 每次用 ETag 驗證，部署後立刻拿到新版 |
| `assets/*`（檔名帶 hash） | `public, max-age=31536000, immutable` | 檔名變動才代表內容變動，可長期快取 |

IIS 寫法：

```xml
<system.webServer>
  <staticContent>
    <clientCache cacheControlMode="DisableCache" />
  </staticContent>
</system.webServer>

<location path="assets">
  <system.webServer>
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
  </system.webServer>
</location>
```

- `DisableCache` 會送 `Cache-Control: no-cache`，通常還會帶 `Pragma: no-cache`、`Expires: -1`；ETag 仍保留。
- 不建議只對 `index.html` 寫 `<location path="index.html">`：請求 `/` 或經 SPA rewrite 時不一定對應到這個路徑。
- `<caching enabled="false" enableKernelCache="false" />` 只關 IIS 伺服器端快取，**不會**產生任何 `Cache-Control`。

## 7. 設定上線後的過渡期

- 新標頭要瀏覽器真的發請求才拿得到；啟發式有效期內不會發請求。
- 最晚恢復時間：

```text
最晚到期 = 設定生效時間 + 0.1 × (設定生效時間 − Last-Modified)
```

- 即使沒有 `no-cache`，有效期過後瀏覽器也會驗證，ETag 已變就拿到新檔，**預設設定下也會自己恢復**，只是時間不可預期。`no-cache` 的價值是把時間變成「下一次請求」。
- 設定修改 `Last-Modified` 不會變（改 web.config 不動 `index.html` 的修改時間）。
- 卡住的裝置若超過上述時間仍是舊的，往快取以外查：
  1. Service Worker（專案有 `.webmanifest`，需確認有無註冊）
  2. App WebView 自己的快取模式
  3. 前面有 CDN 或反向代理
  4. 瀏覽器或 WebView 版本太舊

## 8. 驗證方式

- DevTools Network 面板看 Status：**304** 代表有驗證且命中；`(memory cache)` / `(disk cache)` 代表根本沒發請求。
- 勾選 Disable cache 或 Ctrl+F5 會略過快取，收到 200，不代表正常行為。
- 多台伺服器負載平衡時，IIS 的 ETag（由修改時間與變更計數組成）可能不一致，本該 304 的請求會變成完整重傳。
