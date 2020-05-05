/*
This script runs on every page
https://developer.chrome.com/extensions/content_scripts
*/

/// Gets Frame:0 Tab content and sends to background script
chrome.runtime.sendMessage({
  msg: "TAB",
  data: Date.now(),
});
