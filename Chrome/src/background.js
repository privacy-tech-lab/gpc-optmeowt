chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        details.requestHeaders.push({"name": "DNS", "value": "0"})
        return {"requestHeaders": details.requestHeaders}
    },
    {
        urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders", "blocking"]);

chrome.webRequest.onSendHeaders.addListener(
    function (details) {
       console.log(details);
    },
    {
        urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders"]);