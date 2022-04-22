'use strict';

var linkTextFormats = [
  '{{shortenUrl}}',
  '[{{title}}]({{shortenUrl}})',
  '{{title}} - {{shortenUrl}}',
  '{{title}}, {{shortenUrl}}',
  '{{title}} / {{shortenUrl}}',
  '{{title}}: {{shortenUrl}}'
];

var linkInfo = {
  title: '',
  longUrl: '',
  shortenUrl: '',
  textFormat: 0,
  autocopy: true,
};

var selectedShorten = 0;

function showOptions() {
  document.getElementsByClassName('options')[0].style.display = 'block';
}

function copyToClipboard(idx) {
  idx = !idx ? 0 : idx;

  var textRange = document.createRange();
  var url = document.querySelectorAll('.shortenUrl')[idx];
  var sel;

  textRange.selectNodeContents(url);
  sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(textRange);
  document.execCommand('copy')
  sel.removeRange(textRange);
}

function updateAutocopyText() {
  document.getElementById('autocopy').innerText = 'autocopy is ' + (linkInfo.autocopy ? 'on' : 'off');
}

function updateLinkText(selectedText) {
  linkTextFormats.forEach((format, idx) => {
    var text = format.replace('{{title}}', selectedText || linkInfo.title)
        .replace('{{shortenUrl}}', linkInfo.shortenUrl);
    var div = document.createElement('div');
    div.className = 'shortenUrl';
    div.style.cursor = 'pointer';
    div.style.marginBottom = '10px';
    div.style.width = '100%;';
    div.dataset.idx = idx;
    if (linkInfo.textFormat === idx) {
      div.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    }
    div.textContent = `${text}`;
    div.addEventListener('click', () => {
      const urls = document.querySelectorAll('.shortenUrl');
      urls[linkInfo.textFormat].style.backgroundColor = 'white';

      linkInfo.textFormat = idx;
      urls[linkInfo.textFormat].style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
      chrome.storage.sync.set({textFormat: linkInfo.textFormat});

      copyToClipboard(linkInfo.textFormat);
    });

    document.getElementById('url').appendChild(div);
  });
}
chrome.storage.sync.set({})

document.addEventListener('DOMContentLoaded', function(event) {
  var queryOpts = {currentWindow: true, active: true};
  var port = chrome.runtime.connect({name: "shortern"});

  port.onMessage.addListener(function(res) {
    linkInfo.shortenUrl = res.shortUrl;
    updateLinkText(res.selectedText);
    updateAutocopyText();
    showOptions();
    // if (linkInfo.autocopy) {
      copyToClipboard(linkInfo.textFormat);
    // }
  });

  // Bind event for autocopy
  document.getElementById('autocopy').addEventListener("click", function() {
    linkInfo.autocopy = !linkInfo.autocopy;
    // localforage.setItem('autocopy', linkInfo.autocopy);
    updateAutocopyText();
  });

  // Load link.textFormat index
  chrome.storage.sync.get(function(val) {
    linkInfo.textFormat = val.textFormat === undefined ? 0 : val.textFormat;
  })

  // localforage.getItem('autocopy', function(err, val) {
  //   linkInfo.autocopy = val === null ? false : val;
  // });

  // Query current activated tab info then request longUrl making shorten
  chrome.tabs.query(queryOpts, function(tab) {
    linkInfo.title = tab[0].title;
    linkInfo.longUrl = tab[0].url;
    port.postMessage({url: linkInfo.longUrl});
  });
});
