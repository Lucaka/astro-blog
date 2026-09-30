---
title: CORS、CSRF 與 Cookie：瀏覽器到底在防什麼？
date: 2025.09.30
category: frontend
tags:
  - Security
summary: CORS 是瀏覽器的跨 Origin 資料讀取限制，而 CSRF、Cookie、Origin 驗證與
  Authentication/Authorization 則分別負責防止偽造請求、保護身份與控制 API 存取權限。
---
在前端開發中，CORS 幾乎是很常遇到的問題。

尤其是開發環境使用 Vite 時，通常會直接設定：

```ts
server: {
  proxy: {
    '/api': {
      target: 'https://api.example.com'
    }
  }
}

```

正式環境則可能透過 Nginx：

```text
Browser
   ↓
Nginx
   ↓
API Server

```

這時候原本的 CORS 問題往往就消失了。

因此很容易產生一個疑問：

> 如果 Vite Proxy 或 Nginx Reverse Proxy 就能「避開」CORS，那 CORS 到底是在防什麼？

更進一步，如果攻擊者自己的網站也架一個 Proxy，是否也能繞過 CORS？

要回答這些問題，必須先把幾個常被混在一起的概念拆開：

- Same-Origin Policy
- CORS
- Cookie
- SameSite
- CSRF
- Origin / Referer
- Authentication / Authorization
- Reverse Proxy

---

# 1. CORS 不是用來阻止 API 被呼叫

這是理解 CORS 最重要的一點。

假設：

```text
https://app.example.com
https://api.example.com

```

雖然都是 `example.com`，但兩者 Origin 不同：

```text
https://app.example.com
        ≠
https://api.example.com

```

因此瀏覽器會套用 Same-Origin Policy。

前端：

```ts
fetch('https://api.example.com/users')

```

瀏覽器會關心：

> `https://app.example.com` 的 JavaScript 是否被允許讀取 `api.example.com` 的 response？

Server 可以回：

```http
Access-Control-Allow-Origin: https://app.example.com

```

告訴 Browser：

> 我允許這個 Origin 的 JavaScript 讀我的 response。

這就是 CORS。

---

# 2. CORS 防的是「讀取 Response」，不是「發送 Request」

這是最容易產生誤解的地方。

很多人會把 CORS 理解成：

```text
evil.com
   ↓
bank.com

❌ Request 被阻止

```

其實並不完全是這樣。

更接近：

```text
evil.com
   │
   │ Request
   ▼
bank.com
   │
   │ Response
   ▼
Browser
   │
   X
   │
evil.com JavaScript

```

Request 可能已經送出去了。

但如果 `bank.com` 沒有允許：

```http
Access-Control-Allow-Origin: https://evil.com

```

那麼 `evil.com` 的 JavaScript 就不能讀取 response。

所以可以簡化成：

```text
CORS
 ↓
控制「Cross-Origin JavaScript 能不能讀 Response」

```

而不是：

```text
CORS
 ↓
阻止任何人呼叫 API

```

---

# 3. 那為什麼 Vite Proxy 可以解決 CORS？

例如原本：

```text
Browser
   │
   │ Cross-Origin
   ▼
https://api.example.com

```

Browser 會遇到 CORS。

但是 Vite Proxy 可以改成：

```text
Browser
   │
   │ Same-Origin
   ▼
http://localhost:5173/api
   │
   │ Server-to-Server
   ▼
https://api.example.com

```

前端實際呼叫：

```ts
fetch('/api/users')

```

Browser 看到的是：

```text
localhost:5173
       ↓
localhost:5173

```

這是 Same-Origin。

所以 Browser 根本不需要啟動 CORS 機制。

真正跨 Origin 的部分：

```text
Vite Server
     ↓
api.example.com

```

是 Server-to-Server request。

瀏覽器不會對這個 request 套用 Browser CORS restriction。

---

# 4. Nginx Reverse Proxy 也是同樣的概念

正式環境可能是：

```text
https://app.example.com

```

Nginx：

```nginx
location /api/ {
    proxy_pass https://api.example.com/;
}

```

於是：

```text
Browser
   │
   │ https://app.example.com/api/users
   ▼
Nginx
   │
   │ proxy
   ▼
api.example.com

```

Browser 只知道：

```text
https://app.example.com/api/users

```

所以它是 Same-Origin。

Nginx 再替 Browser 去呼叫真正的 API。

因此這不是「繞過 CORS」，而是：

> 把 Cross-Origin boundary 從 Browser 移到了 Server-to-Server 的網路層。

---

# 5. 如果 evil.com 自己架 Proxy 呢？

這時候就會發現 CORS 並沒有因此失去意義。

假設：

```text
evil.com

```

自己架了一個 Proxy：

```text
Browser
   │
   │ https://evil.com/api/bank
   ▼
evil.com Proxy
   │
   │ Server-to-Server
   ▼
bank.com

```

Browser 實際請求的是：

```text
https://evil.com/api/bank

```

而不是：

```text
https://bank.com/api

```

因此 Browser 不會因為這個 request 自動把 `bank.com` 的 Cookie 帶給 `evil.com`。

例如：

```text
Browser
   │
   │ Cookie: evil.com
   ▼
evil.com Proxy
   │
   ▼
bank.com

```

Proxy 自己去呼叫 `bank.com` 時，也不會神奇地擁有使用者 Browser 裡的：

```text
bank.com Session Cookie

```

除非使用者自己把 credentials 提供給 evil.com。

所以 Proxy 並沒有讓攻擊者取得使用者在 `bank.com` 的登入身份。

---

# 6. Same-Origin Policy 才是更底層的概念

CORS 可以看成是建立在 Browser Same-Origin Policy 上的一套授權機制。

Same-Origin Policy 的核心概念是：

```text
https://evil.com
       ✕
https://bank.com

```

不同 Origin 的 JavaScript 原則上不能任意讀取彼此的資料。

但現代 Web 應用程式需要大量跨 Origin 的功能。

例如：

```text
frontend.com
     ↓
api.backend.com

```

因此 CORS 讓 Server 可以明確表示：

```http
Access-Control-Allow-Origin: https://frontend.com

```

意思是：

> 我允許這個 Origin 的 Browser JavaScript 讀取我的 response。

所以可以把關係理解成：

```text
Same-Origin Policy
        ↓
預設限制 Cross-Origin access
        ↓
CORS
        ↓
Server 可以選擇性放寬這個限制

```

CORS 最終成為 Web 平台標準，目前相關行為主要由 WHATWG Fetch Standard 定義。

---

# 7. 但是 `<form>` 為什麼可以跨 Origin？

這就進入另一個問題。

假設 evil.com：

```html
<form
  action="https://bank.com/transfer"
  method="POST"
>
  <input type="hidden" name="amount" value="100000">
</form>

```

JavaScript：

```js
document.forms[0].submit()

```

Browser 可以真的送：

```text
evil.com
   │
   │ POST
   ▼
bank.com/transfer

```

這不是 CORS 的主要防護範圍。

因為 CORS 的核心問題是：

> JavaScript 能不能讀 Cross-Origin response？

而 HTML `<form>` 本來就被設計成可以送出 request。

因此：

```text
CORS

```

不能單獨解決：

```text
Cross-Site Request Forgery

```

也就是 CSRF。

---

# 8. CSRF 是什麼？

假設使用者已經登入：

```text
bank.com

```

Browser 裡有：

```text
Session Cookie

```

此時使用者瀏覽：

```text
evil.com

```

evil.com 嘗試：

```text
POST https://bank.com/transfer

```

如果 Browser 在這個 request 中帶上 bank.com 的 Session Cookie：

```text
evil.com
   │
   │ POST + bank.com Cookie
   ▼
bank.com

```

bank.com 可能會以為：

> 這是已經登入的使用者發出的 request。

這就是 CSRF 的核心問題。

---

# 9. SameSite Cookie

現代 Browser 有一個非常重要的防護：

```http
Set-Cookie:
Session=abc;
Secure;
HttpOnly;
SameSite=Lax

```

三個 attribute 分別解決不同問題。


| Attribute | 作用 |
| ---------- | ------------------------------------ |
| `Secure` | 只透過 HTTPS 傳送 |
| `HttpOnly` | JavaScript 無法透過 `document.cookie` 讀取 |
| `SameSite` | 控制 Cross-Site request 是否帶 Cookie |


例如：

```text
Secure

```

防止：

```text
HTTP → Session Cookie

```

而：

```text
HttpOnly

```

防止：

```js
document.cookie

```

直接取得 Session Cookie。

而：

```text
SameSite=Lax

```

則限制 Cross-Site request 帶 Cookie 的情況。

---

# 10. `SameSite=Lax` 就足夠了嗎？

不能一概而論。

在設計良好的網站中：

```text
Secure
HttpOnly
SameSite=Lax

```

已經可以阻擋大量典型 CSRF。

但是 SameSite 通常不應該被視為所有 CSRF 防護的唯一一層。

例如：

- API 錯誤使用 GET 修改資料
- `SameSite=None`
- 舊環境 / 特殊 Client
- 同一個 registrable domain 下的不受信任 subdomain
- 某些 application-level CSRF 問題

因此常見的安全設計仍然會使用：

```text
SameSite
+
CSRF Token
+
Origin validation

```

形成 Defense in Depth。

---

# 11. CSRF Token

CSRF Token 的概念非常簡單：

Server 給自己的頁面一個只有自己網站可以取得的隨機 token。

例如：

```html
<meta
  name="csrf-token"
  content="ABC123"
>

```

前端：

```ts
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': 'ABC123'
  }
})

```

Server：

```text
Session Cookie ✓
CSRF Token    ✓
      ↓
    Accept

```

而 evil.com 可以嘗試：

```text
POST /api/transfer

```

但是因為 Same-Origin Policy：

```text
evil.com
   ✕
bank.com

```

它無法正常讀取 bank.com 頁面裡的 CSRF Token。

所以它只能：

```text
Session Cookie ✓
CSRF Token    ✕

```

Server：

```text
403 Forbidden

```

這就是 CSRF Token 的價值。

---

# 12. CSRF Token 不是 Bearer Token

這兩個很容易混在一起。

例如：

```http
Authorization: Bearer eyJ...

```

通常是：

> Authentication / Authorization credential

而：

```http
X-CSRF-Token: ABC123

```

是：

> CSRF protection token

它們用途完全不同。

---

# 13. `Authorization: Bearer` 是標準嗎？

是。

`Authorization` 是 HTTP 標準的 request header。

而：

```http
Authorization: Bearer <token>

```

其中 `Bearer` authentication scheme 是 OAuth 2.0 Bearer Token Usage（RFC 6750）定義的。

因此：

```text
Authorization
      ↓
HTTP standard header
      ↓
Bearer
      ↓
OAuth 2.0 / RFC 6750

```

但：

```http
X-CSRF-Token: ABC123

```

並不是同樣意義上的統一標準 authentication scheme。

它比較像是 Web framework / application 常見的 convention。

你甚至可以自己定義：

```http
X-CSRF-Token

```

或：

```http
X-XSRF-TOKEN

```

只要 Client 和 Server 約定一致即可。

---

# 14. Origin Validation

除了 CSRF Token，Server 還可以檢查：

```http
Origin

```

例如正常請求：

```http
Origin: https://bank.com

```

Server：

```ts
if (origin !== 'https://bank.com') {
  return 403
}

```

而 evil.com 發起：

```text
evil.com
   │
   │ POST
   ▼
bank.com

```

Browser 會產生：

```http
Origin: https://evil.com

```

Server 發現：

```text
https://evil.com
      ≠
https://bank.com

```

因此拒絕。

---

# 15. 為什麼攻擊者不能直接偽造 Origin？

這裡要區分：

```text
curl / Postman / 自己寫的 Server

```

和：

```text
evil.com JavaScript

```

後者受到 Browser security model 限制。

例如 evil.com：

```js
fetch('https://bank.com/api')

```

不能隨意告訴 Browser：

```http
Origin: https://bank.com

```

因此 Server 可以利用 Browser 自己產生的 Origin header 作為 CSRF 防護訊號。

當然，如果攻擊者直接控制自己的 HTTP client：

```bash
curl ...

```

他可以偽造任何 header。

但這已經不是典型 CSRF 的攻擊模型了。

---

# 16. Referer Validation

另一個可以檢查的是：

```http
Referer

```

例如：

```http
Referer: https://bank.com/account

```

它比 Origin 包含更多資訊。

Origin：

```text
https://bank.com

```

Referer：

```text
https://bank.com/account

```

因此 Server 可以檢查：

```text
Origin
    ↓
https://bank.com

```

如果不存在，再視情況使用：

```text
Referer
    ↓
https://bank.com/...

```

但 Referer 可能受到：

- Referrer-Policy
- Browser privacy settings
- navigation type

等因素影響，因此 Origin 通常是更直接的檢查對象。

---

# 17. CSP 又是在做什麼？

CSP 很容易被誤認為是 CSRF 防護。

例如：

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://api.bank.com;

```

CSP 主要控制的是：

> 「我的網頁允許載入、執行、連線到哪些資源？」

例如：

```text
CSP
├── Script 可以從哪裡載入？
├── API 可以連去哪裡？
├── Image 可以從哪裡載入？
├── iframe 可以載入誰？
└── Font / Media 等資源可以去哪裡？

```

它主要是另一個安全邊界，尤其常用來降低 XSS 和資源注入造成的風險。

所以：

```text
CSP
≠
CSRF Token
≠
CORS

```

三者不要混在一起。

---

# 18. 這些機制到底各自防什麼？

可以用這張表快速理解：


| 機制 | 核心問題 |
| ------------------ | ------------------------------------- |
| Same-Origin Policy | 不同 Origin 的 JS 可以讀什麼？ |
| CORS | Server 是否允許某個 Origin 的 JS 讀 Response？ |
| Secure Cookie | Cookie 是否只能透過 HTTPS 傳送？ |
| HttpOnly | JS 能不能直接讀 Session Cookie？ |
| SameSite Cookie | Cross-Site request 是否帶 Cookie？ |
| CSRF Token | Request 是否真的來自自己網站的正常流程？ |
| Origin validation | Request 是從哪個 Origin 發出的？ |
| Referer validation | Request 前一個頁面是哪裡？ |
| Authentication | 你是誰？ |
| Authorization | 你有沒有權限？ |
| CSP | 我的網站允許執行 / 載入哪些資源？ |


---

# 19. 一張圖理解整個關係

```text
                         Browser
                            │
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          Same-Origin Policy       Cookie
                 │                     │
                 ▼              ┌──────┴──────┐
                CORS            │             │
                 │           Secure        SameSite
                 │           HttpOnly
                 │
                 ▼
        「能不能讀 Response？」


                 Cross-Site Request
                         │
                         ▼
                       CSRF
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
          SameSite    CSRF Token   Origin
                                    │
                                  Referer

```

---

# 20. 最後用三句話記住

如果只想記住最重要的概念，可以記這三句：

### CORS

> **「另一個 Origin 的 JavaScript 能不能讀我的 Response？」**

### CSRF

> **「另一個網站能不能利用使用者目前的登入身份，讓我的 Server 執行敏感操作？」**

### Authentication / Authorization

> **「你是誰？你有沒有權限做這件事？」**

因此，CORS 並沒有被 Vite Proxy 或 Nginx 「破解」。

Proxy 做的事情其實是：

```text
Browser
   │
   │ Same-Origin
   ▼
Proxy
   │
   │ Server-to-Server
   ▼
API

```

把跨 Origin 的部分移出了 Browser。

而真正完整的 Web Security 通常不是依賴單一機制，而是：

```text
                 ┌─ Authentication
                 │
                 ├─ Authorization
                 │
Request ─────────┼─ SameSite Cookie
                 │
                 ├─ CSRF Token
                 │
                 ├─ Origin / Referer validation
                 │
                 └─ Server-side validation

Response ──────── CORS

Web Page ──────── CSP

```

每一層處理的是不同問題。

也因此，**「CORS 能不能被 Proxy 解決？」和「API 是否安全？」其實是兩個不同層次的問題。**