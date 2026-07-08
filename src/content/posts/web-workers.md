---
title: JS｜web workers
date: "2025.07.05"
category: frontend
tags: ["JS"]
summary: 透過 worker 建構子便可以產生 worker 物件，並且執行 JavaScript 檔案。在 worker 中的 JavaScript…
---

透過 worker 建構子便可以產生 worker 物件，並且執行 JavaScript 檔案。在 worker 中的 JavaScript 運行在不同於 window 的執行緒環境，所以在 worker 中存取全域物件應該要透過 self ，如果透過 window 會導致錯誤發生。

### Dedicated workers
```javascript=
// index.js
if (window.Worker) {
  // 產生 dedicated worker, worker.js檔案需要server提供  
  var worker = new Worker('./worker.js')
  worker.postMessage(['first.value', 'second.value']);
  worker.onmessage = function(e) {
    console.log('onmessage', e.data)
  }
}
```
```javascript=
// worker.js
onmessage = function(e) {
  console.log(e)
  var workerResult = 'Result: ' + e.data[0] + e.data[1];
  postMessage(workerResult);
};
```
:::info
Note: 在主執行緒中存取 onmessage 與 postMessage 需要主動掛在 worker 物件上，在 worker 執行緒則不用，這是因為 worker 執行緒的全域物件便是 worker 物件。
:::
:::info
Note: 和 worker 傳送的資料並非共享而是複製一份後傳送
:::
#### 結束 worker
```
myWorker.terminate();
```
請注意不論 worker 正在執行的運算完成與否，一但呼叫後 worker 便會立刻被終止。
而在 worker 執行緒裡，worker 可以呼叫自己的 close 方法來結束 
```
close();
```

### Shared workers
shared web worker 能夠被多個程式腳本存取，即使是跨越不同 window、iframe 或 worker。但是瀏覽器支援度較低
```javascript=
if (window.SharedWorker) {
	var myWorker = new SharedWorker("sharedWorker.js");
    myWorker.port.onmessage = function (e) {
		console.log('Message received from worker', e);
	c c
	myWorker.port.postMessage([8,8]);
}
```
```javascript=
onconnect = function(e) {
  var port = e.ports[0];
  port.onmessage = function(e) {
    var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
    port.postMessage(workerResult);
  }

  port.start();  // 註冊 onmessage 事件的同時也自動建立連線，所以說不需要呼叫start() 了
}

```

### other worker
* ServiceWorkers
    基本上如同介於 web app 和瀏覽器以及網路之間的代理伺服器 (proxy server)，這類 worker 重點在實現離線服務，service worker 會攔截網路請求，然後依據網路連線和資源狀態做出反應，他們可以存取推播和背景同步 APIs。 
* Chrome Workers
    
* Audio Workers 
    主要用於音效處理部分。
