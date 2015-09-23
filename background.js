chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.url.toLowerCase().indexOf("blossom.io") > -1){
    chrome.pageAction.show(tabId);
    chrome.pageAction.setTitle({
        tabId: tab.id,
        title: 'Flourish - A Better Blossom'
    });
  }
});