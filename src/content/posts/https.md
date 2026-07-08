---
title: node｜https
date: "2023.08.17"
category: frontend
tags: ["node"]
summary: 1. 取得OpenSSL
---

1. 取得OpenSSL
   Git已內建OpenSSL，預設路徑為C:\Program Files\Git\usr\bin\openssl.exe
2. 建立Private Key與Certificate
新增一個 `server.conf` 檔案
```csv
    [req]
    prompt = no
    default_md = sha256
    default_bits = 2048
    distinguished_name = dn
    x509_extensions = v3_req

    [dn]
    C = TW
    ST = Taiwan
    L = Taipei
    O = Duotify Inc.
    OU = IT Department
    emailAddress = admin@example.com
    CN = localhost

    [v3_req]
    subjectAltName = @alt_names

    [alt_names]
    DNS.1 = *.localhost
    DNS.2 = localhost
```
3. 開啟命令列並執行以下指令以建立private key和certificate

* Windows
 `$ openssl req -x509 -new -nodes -sha256 -utf8 -days 3650 -newkey rsa:2048 -keyout server.key -out cert.crt -config server.conf `
* Linux
 `$ openssl req -x509 -new -nodes -sha256 -utf8 -days 3650 -newkey rsa:2048 -keyout key.pem -out cert.pem -config server.conf`
