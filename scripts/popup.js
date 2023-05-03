// firefox and safari use `browser` for web-extension APIs, chromium uses `chrome`
var extension = typeof browser == 'undefined' ? chrome : browser;

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

async function saveOptions() {
  try {
    const textFormat = {
      textFormat: linkInfo.textFormat
    }

    await extension.storage.local.set(textFormat);
  } catch (e) {
    console.log('error', e)
  }
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

async function saveWithFormat(idx) {
  const urls = document.querySelectorAll('.shortenUrl');
  urls[linkInfo.textFormat].style.backgroundColor = 'white';

  linkInfo.textFormat = idx;
  urls[linkInfo.textFormat].style.backgroundColor = 'rgba(255, 0, 0, 0.5)';

  await saveOptions();
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
    div.addEventListener('click', async () => {
      copyToClipboard(idx);
      await saveWithFormat(idx)
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