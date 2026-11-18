// content.js — CodeChef Clipboard Unlock (Event Simulation Fix)
(() => {
  'use strict';
  if (window.__ccuInjected) return;
  window.__ccuInjected = true;

  function showToast(message, type = 'success') {
    const existing = document.getElementById('ccu-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'ccu-toast';
    toast.className = `ccu-toast ccu-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ccu-toast-show'));
    setTimeout(() => {
      toast.classList.remove('ccu-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Find the actual text input area inside CodeMirror or Monaco
  function getInputElement() {
    // Monaco uses textareas
    let el = document.querySelector('.monaco-editor textarea');
    if (el) return el;

    // CodeMirror 6 uses a hidden div with contenteditable
    el = document.querySelector('.cm-content');
    if (el) return el;

    // CodeMirror 5 uses a textarea
    el = document.querySelector('.CodeMirror textarea');
    if (el) return el;

    // Fallback for basic textareas
    return document.querySelector('textarea');
  }

  // This simulates a real human pasting by using the browser's native DataTransfer
  function simulatePaste(text) {
    const inputEl = getInputElement();
    if (!inputEl) {
      showToast('Could not find editor input area.', 'error');
      return false;
    }

    inputEl.focus();

    try {
      // 1. Create a fake clipboard data object
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      // 2. Create the paste event
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      // 3. Fire the event
      inputEl.dispatchEvent(pasteEvent);
      return true;
    } catch (e) {
      console.error('[CCU] Event simulation failed:', e);
      showToast('Paste simulation failed.', 'error');
      return false;
    }
  }

  async function pasteCode() {
    try {
      let clipboardText;
      try { 
        clipboardText = await navigator.clipboard.readText(); 
      } catch (clipErr) { 
        showToast('Clipboard access denied. Use the popup to paste manually.', 'error'); 
        return; 
      }

      if (!clipboardText || clipboardText.trim().length === 0) {
        showToast('Clipboard is empty.', 'warn');
        return;
      }

      const success = simulatePaste(clipboardText);
      if (success) {
        showToast(`✓ Code pasted successfully!`, 'success');
      }

    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function copyCode() {
    const inputEl = getInputElement();
    if (!inputEl) return showToast('No editor found.', 'warn');
    
    try {
      let code = '';
      // For CodeMirror 6 (contenteditable div)
      if (inputEl.classList.contains('cm-content')) {
        code = inputEl.innerText;
      } else {
        // For textareas
        code = inputEl.value;
      }

      if (code) {
        await navigator.clipboard.writeText(code);
        showToast('✓ Code copied!', 'success');
      } else {
        showToast('Editor is empty.', 'warn');
      }
    } catch (err) {
      showToast('Copy failed.', 'error');
    }
  }

  async function clearEditor() {
    const inputEl = getInputElement();
    if (!inputEl) return showToast('No editor found.', 'warn');

    inputEl.focus();
    try {
      // Select all text
      if (inputEl.classList.contains('cm-content')) {
        document.execCommand('selectAll', false, null);
      } else {
        inputEl.select();
      }
      // Simulate pressing Backspace or Delete
      document.execCommand('delete', false, null);
      
      // Also try dispatching input event
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('✓ Editor cleared', 'success');
    } catch(e) {
      showToast('Could not clear editor.', 'warn');
    }
  }

  async function saveSolution() {
    const inputEl = getInputElement();
    if (!inputEl) return showToast('No editor found.', 'warn');
    
    let code = inputEl.classList.contains('cm-content') ? inputEl.innerText : inputEl.value;
    if (!code) return showToast('No code to save.', 'warn');

    const problemTitle = document.querySelector('h1, .problem-name')?.textContent?.trim() || document.title;
    
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_SOLUTION', url: window.location.href, code: code,
        language: 'unknown', problemTitle
      }, resolve);
    });
    showToast('✓ Solution saved locally', 'success');
  }

  function createToolbar() {
    if (document.getElementById('ccu-toolbar')) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'ccu-toolbar';
    toolbar.innerHTML = `
      <div class="ccu-toolbar-header" id="ccu-drag-handle">
        <span class="ccu-toolbar-logo">⌨️ CCU</span>
        <button class="ccu-btn-toggle" id="ccu-toggle">▾</button>
      </div>
      <div class="ccu-toolbar-body" id="ccu-toolbar-body">
        <button class="ccu-btn" id="ccu-paste">📋 Paste</button>
        <button class="ccu-btn" id="ccu-copy">📄 Copy</button>
        <button class="ccu-btn" id="ccu-clear">🗑️ Clear</button>
        <button class="ccu-btn" id="ccu-save">💾 Save</button>
      </div>
    `;
    document.body.appendChild(toolbar);

    // Drag logic
    const header = document.getElementById('ccu-drag-handle');
    let isDragging = false, offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
      if (e.target.id === 'ccu-toggle') return;
      isDragging = true;
      const rect = toolbar.getBoundingClientRect();
      offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
      toolbar.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = Math.max(0, Math.min(window.innerWidth - toolbar.offsetWidth, e.clientX - offsetX));
      const y = Math.max(0, Math.min(window.innerHeight - toolbar.offsetHeight, e.clientY - offsetY));
      toolbar.style.left = x + 'px'; toolbar.style.top = y + 'px';
      toolbar.style.right = 'auto'; toolbar.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { isDragging = false; toolbar.style.transition = ''; });

    const toggleBtn = document.getElementById('ccu-toggle');
    const body = document.getElementById('ccu-toolbar-body');
    toggleBtn.addEventListener('click', () => {
      const collapsed = body.style.display === 'none';
      body.style.display = collapsed ? 'flex' : 'none';
      toggleBtn.textContent = collapsed ? '▾' : '▸';
    });

    document.getElementById('ccu-paste').addEventListener('click', pasteCode);
    document.getElementById('ccu-copy').addEventListener('click', copyCode);
    document.getElementById('ccu-clear').addEventListener('click', clearEditor);
    document.getElementById('ccu-save').addEventListener('click', saveSolution);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'paste-code') { pasteCode(); sendResponse({ ok: true }); }
    else if (message.type === 'copy-code') { copyCode(); sendResponse({ ok: true }); }
    else if (message.type === 'save-solution') { saveSolution(); sendResponse({ ok: true }); }
    else if (message.type === 'GET_EDITOR_STATUS') { sendResponse({ editorType: 'visible', url: window.location.href }); }
    else if (message.type === 'PASTE_FROM_POPUP') { 
      const success = simulatePaste(message.code);
      sendResponse({ success: success }); 
    }
  });

  function init() {
    const isEditorPage = window.location.href.includes('/problems/') ||
                         window.location.href.includes('/learn/') ||
                         document.querySelector('.monaco-editor, .CodeMirror, .ace_editor, .cm-editor');
    if (isEditorPage && !document.getElementById('ccu-toolbar')) {
      createToolbar();
      console.log('[CCU] Simple Event Simulation Initialized.');
    }
  }

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) { lastUrl = window.location.href; setTimeout(init, 1500); }
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 1000);
  else window.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
})();