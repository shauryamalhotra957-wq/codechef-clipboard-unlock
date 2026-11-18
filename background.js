// background.js — Service Worker for CodeChef Clipboard Unlock
// No state in global variables (MV3 rule). All persistence via chrome.storage.

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: command });
  } catch (err) {
    // Content script not injected on this page — ignore
    console.warn(`[CCU] Command ${command} failed:`, err.message);
  }
});

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SOLUTIONS') {
    (async () => {
      try {
        const { solutions = {} } = await chrome.storage.local.get('solutions');
        sendResponse({ solutions });
      } catch (err) {
        sendResponse({ solutions: {}, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'SAVE_SOLUTION') {
    (async () => {
      try {
        const { solutions = {} } = await chrome.storage.local.get('solutions');
        const key = message.url || 'unknown';
        solutions[key] = {
          code: message.code,
          language: message.language || 'unknown',
          timestamp: Date.now(),
          problemTitle: message.problemTitle || key
        };
        await chrome.storage.local.set({ solutions });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'DELETE_SOLUTION') {
    (async () => {
      try {
        const { solutions = {} } = await chrome.storage.local.get('solutions');
        delete solutions[message.url];
        await chrome.storage.local.set({ solutions });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'LOAD_SOLUTION') {
    (async () => {
      try {
        const { solutions = {} } = await chrome.storage.local.get('solutions');
        const solution = solutions[message.url];
        sendResponse({ solution: solution || null });
      } catch (err) {
        sendResponse({ solution: null, error: err.message });
      }
    })();
    return true;
  }
});

// Set badge on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.action.setBadgeBackgroundColor({ color: '#5B4638' });
  console.log('[CCU] CodeChef Clipboard Unlock installed.');
});
