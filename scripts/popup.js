// firefox and safari use `browser` for web-extension APIs, chromium uses `chrome`
var extension = typeof browser == 'undefined' ? chrome : browser;

var linkTextFormats = [
  '<span class="label">{{shortenUrl}}</span>',
  '<span class="label">[{{title}}]</span>({{shortenUrl}})',
  '<span class="label">{{title}}</span> - {{shortenUrl}}'
];

var linkInfo = {
  title: '',
  longUrl: '',
  shortenUrl: '',
  autocopy: true,
};

var selectedShorten = 0;

function showOptions() {
  document.getElementsByClassName('options')[0].style.display = 'block';
}

async function loadOptions() {
  const { textFormat } = await extension.storage.local.get(["textFormat"]);
  linkInfo.textFormat = Number(Math.max(Math.min(textFormat, linkTextFormats.length - 1), 0));
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
    var text = format
      .replace('{{title}}', selectedText || linkInfo.title)
      .replace('{{shortenUrl}}', linkInfo.shortenUrl);
    var div = document.createElement('div');
    div.className = 'shortenUrl';
    div.style.cursor = 'pointer';
    div.style.marginBottom = '10px';
    div.style.width = '100%;';
    div.dataset.idx = idx;
    div.innerHTML = `${text}`;
    div.addEventListener('click', async () => {
      copyToClipboard(idx);
    });

    document.getElementById('url').appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', function (event) {
  // Bind event for autocopy
  document.getElementById('autocopy').addEventListener("click", function () {
    linkInfo.autocopy = !linkInfo.autocopy;
    updateAutocopyText();
  });

  loadOptions();

  extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    extension.scripting.executeScript({
      target: {
        tabId: tabs[0].id
      },
      func: () => {
        return window.getSelection().toString();
      }
    }, (res) => {
      const { result } = res[0];

      linkInfo.title = tabs[0].title;
      linkInfo.longUrl = tabs[0].url;
      linkInfo.shortenUrl = tabs[0].url;

      updateLinkText(result);
      updateAutocopyText();
      showOptions();
      copyToClipboard(linkInfo.textFormat);
    });
  });
});