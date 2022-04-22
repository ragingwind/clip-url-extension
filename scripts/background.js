'use strict';

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    chrome.tabs.executeScript( {
      code: "window.getSelection().toString();"
    }, function(selection) {
      port.postMessage({
        shortUrl: msg.url,
        selectedText: selection[0]
      });
    });
  });
});
