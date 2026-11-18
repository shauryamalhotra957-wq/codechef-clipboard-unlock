// popup.js — Popup logic for CodeChef Clipboard Unlock

document.addEventListener('DOMContentLoaded', async () => {
  const siteDot = document.getElementById('site-dot');
  const siteLabel = document.getElementById('site-label');
  const editorDot = document.getElementById('editor-dot');
  const editorLabel = document.getElementById('editor-label');
  const clipboardDot = document.getElementById('clipboard-dot');
  const clipboardLabel = document.getElementById('clipboard-label');
  const siteStatus = document.getElementById('site-status');
  const fallbackSection = document.getElementById('fallback-section');

  // ─── Detect current site and editor ──────────────────────────────

  let currentTab = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (tab.url && tab.url.includes('codechef.com')) {
      siteDot.className = 'status-dot green';
      siteLabel.textContent = 'CodeChef ✓';
      siteStatus.textContent = 'Connected to CodeChef';

      // Ask content script about editor
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_EDITOR_STATUS' });
        if (response && response.editorType !== 'unknown') {
          editorDot.className = 'status-dot green';
          editorLabel.textContent = response.editorType + ' ✓';
        } else {
          editorDot.className = 'status-dot yellow';
          editorLabel.textContent = 'Loading...';
        }
      } catch {
        editorDot.className = 'status-dot yellow';
        editorLabel.textContent = 'No editor page';
      }
    } else {
      siteDot.className = 'status-dot red';
      siteLabel.textContent = 'Not CodeChef';
      siteStatus.textContent = 'Open a CodeChef problem page to use';
      editorDot.className = 'status-dot red';
      editorLabel.textContent = 'N/A';
    }
  } catch {
    siteDot.className = 'status-dot red';
    siteLabel.textContent = 'Error';
    siteStatus.textContent = 'Could not detect page';
  }

  // ─── Clipboard status ───────────────────────────────────────────

  try {
    const text = await navigator.clipboard.readText();
    clipboardDot.className = 'status-dot green';
    clipboardLabel.textContent = text ? `${text.length} chars` : 'Empty';
  } catch {
    clipboardDot.className = 'status-dot yellow';
    clipboardLabel.textContent = 'Ask permission';
    fallbackSection.style.display = 'block';
  }

  // ─── Helper: send command to content script ─────────────────────

  async function sendToContent(message) {
    if (!currentTab) {
      siteStatus.textContent = 'No active tab';
      return;
    }
    try {
      await chrome.tabs.sendMessage(currentTab.id, message);
    } catch (err) {
      siteStatus.textContent = 'Error: ' + err.message;
    }
  }

  // ─── Paste Button ──────────────────────────────────────────────

  document.getElementById('btn-paste').addEventListener('click', async () => {
    await sendToContent({ type: 'paste-code' });
    window.close();
  });

  // ─── Copy Button ───────────────────────────────────────────────

  document.getElementById('btn-copy').addEventListener('click', async () => {
    await sendToContent({ type: 'copy-code' });
    window.close();
  });

  // ─── Clear Button ──────────────────────────────────────────────

  document.getElementById('btn-clear').addEventListener('click', async () => {
    if (!currentTab) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          window.postMessage({ source: 'ccu-content', action: 'clearCode' }, '*');
        }
      });
      siteStatus.textContent = 'Editor cleared!';
    } catch (err) {
      siteStatus.textContent = 'Error: ' + err.message;
    }
  });

  // ─── Save Button ───────────────────────────────────────────────

  document.getElementById('btn-save').addEventListener('click', async () => {
    await sendToContent({ type: 'save-solution' });
    siteStatus.textContent = 'Solution saved!';
    setTimeout(loadSolutions, 500);
  });

  // ─── Manual Paste Fallback ──────────────────────────────────────

  document.getElementById('btn-manual-paste').addEventListener('click', async () => {
    const code = document.getElementById('manual-code').value;
    if (!code || !currentTab) return;

    try {
      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'PASTE_FROM_POPUP',
        code: code
      });
      siteStatus.textContent = 'Code inserted!';
      window.close();
    } catch (err) {
      siteStatus.textContent = 'Error: ' + err.message;
    }
  });

  // ─── Toggle Sections ───────────────────────────────────────────

  document.getElementById('toggle-solutions').addEventListener('click', () => {
    const list = document.getElementById('solutions-list');
    const chevron = document.getElementById('solutions-chevron');
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    chevron.textContent = isHidden ? '▾' : '▸';
    if (isHidden) loadSolutions();
  });

  document.getElementById('toggle-shortcuts').addEventListener('click', () => {
    const list = document.getElementById('shortcuts-list');
    const chevron = document.getElementById('shortcuts-chevron');
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    chevron.textContent = isHidden ? '▾' : '▸';
  });

  // ─── Load Saved Solutions ──────────────────────────────────────

  async function loadSolutions() {
    const container = document.getElementById('solutions-list');
    const emptyMsg = document.getElementById('empty-msg');

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SOLUTIONS' }, resolve);
      });

      const solutions = response?.solutions || {};
      const entries = Object.entries(solutions);

      container.querySelectorAll('.solution-item').forEach(el => el.remove());

      if (entries.length === 0) {
        emptyMsg.style.display = 'block';
        return;
      }

      emptyMsg.style.display = 'none';

      entries
        .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0))
        .forEach(([url, sol]) => {
          const item = document.createElement('div');
          item.className = 'solution-item';

          const title = document.createElement('span');
          title.className = 'solution-title';
          title.textContent = sol.problemTitle || url.split('/').pop();
          title.title = url;

          const actions = document.createElement('div');
          actions.className = 'solution-actions';

          // Load button
          const loadBtn = document.createElement('button');
          loadBtn.className = 'solution-btn';
          loadBtn.textContent = '📥';
          loadBtn.title = 'Load into editor';
          loadBtn.addEventListener('click', async () => {
            if (!currentTab) return;
            try {
              await chrome.tabs.sendMessage(currentTab.id, {
                type: 'PASTE_FROM_POPUP',
                code: sol.code
              });
              siteStatus.textContent = 'Solution loaded!';
            } catch (err) {
              siteStatus.textContent = 'Error: ' + err.message;
            }
          });

          // Copy button
          const copyBtn = document.createElement('button');
          copyBtn.className = 'solution-btn';
          copyBtn.textContent = '📋';
          copyBtn.title = 'Copy to clipboard';
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(sol.code);
              siteStatus.textContent = 'Copied to clipboard!';
            } catch {
              siteStatus.textContent = 'Copy failed';
            }
          });

          // Delete button
          const delBtn = document.createElement('button');
          delBtn.className = 'solution-btn delete';
          delBtn.textContent = '✕';
          delBtn.title = 'Delete saved solution';
          delBtn.addEventListener('click', async () => {
            await new Promise((resolve) => {
              chrome.runtime.sendMessage({ type: 'DELETE_SOLUTION', url }, resolve);
            });
            item.remove();
            if (!container.querySelector('.solution-item')) {
              emptyMsg.style.display = 'block';
            }
            siteStatus.textContent = 'Solution deleted';
          });

          actions.appendChild(loadBtn);
          actions.appendChild(copyBtn);
          actions.appendChild(delBtn);
          item.appendChild(title);
          item.appendChild(actions);
          container.appendChild(item);
        });
    } catch {
      emptyMsg.textContent = 'Error loading solutions';
      emptyMsg.style.display = 'block';
    }
  }

  // ─── Settings link ─────────────────────────────────────────────

  document.getElementById('btn-settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'settings.html' });
  });
});
