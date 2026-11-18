# Testing Documentation — CodeChef Clipboard Unlock

## Test Matrix

### ✅ Core Functionality

| # | Test Case | Steps | Expected | Status |
|---|-----------|-------|----------|--------|
| 1 | Paste simple code | Copy "hello world" program → Alt+Shift+V on CodeChef | Code appears in editor | Manual |
| 2 | Paste large C++ program | Copy ~500 line C++ program → Alt+Shift+V | Full code inserted, no truncation | Manual |
| 3 | Paste Python with indentation | Copy Python code with tabs/spaces → Paste | Indentation preserved exactly | Manual |
| 4 | Paste code with special chars | Copy code containing `<`, `>`, `&`, `"`, backticks | All characters preserved | Manual |
| 5 | Paste multiline with blank lines | Copy code with empty lines between functions | Blank lines preserved | Manual |
| 6 | Copy from editor | Write code in editor → Alt+Shift+C | Code copied to clipboard | Manual |
| 7 | Clear editor | Have code in editor → Click Clear | Editor becomes empty | Manual |
| 8 | Save solution | Paste code → Alt+Shift+S | Solution saved, appears in popup | Manual |
| 9 | Load saved solution | Open popup → Saved Solutions → Load | Code loaded into editor | Manual |
| 10 | Delete saved solution | Open popup → Saved Solutions → Delete | Solution removed | Manual |

### ✅ Editor Detection

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 11 | Monaco Editor (CodeChef default) | Detected as "monaco", paste via executeEdits | Manual |
| 12 | CodeMirror 6 (if CodeChef switches) | Detected, paste via dispatch | Fallback ready |
| 13 | CodeMirror 5 | Detected, paste via setValue | Fallback ready |
| 14 | Ace Editor | Detected, paste via setValue | Fallback ready |
| 15 | No editor on page | Yellow status dot, "Loading..." message | Manual |

### ✅ Clipboard Handling

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 16 | Clipboard has text | Green dot, character count shown | Manual |
| 17 | Clipboard is empty | "Empty" label, paste shows warning | Manual |
| 18 | Clipboard permission denied | Yellow dot, manual fallback textarea shown | Manual |
| 19 | Manual fallback paste | Paste in textarea → Click Insert → code in editor | Manual |

### ✅ UI / Toolbar

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 20 | Toolbar appears on problem page | Floating toolbar visible bottom-right | Manual |
| 21 | Toolbar draggable | Click header + drag → toolbar moves | Manual |
| 22 | Toolbar collapsible | Click ▾ → buttons hide, click ▸ → buttons show | Manual |
| 23 | Toolbar on non-problem page | Toolbar does NOT appear | Manual |
| 24 | Toast notifications | Paste → green "Pasted" toast appears top-right | Manual |
| 25 | Popup shows correct status | Open popup on CodeChef → green dots for site/editor | Manual |

### ✅ Keyboard Shortcuts

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 26 | Alt+Shift+V | Paste code from clipboard | Manual |
| 27 | Alt+Shift+C | Copy code from editor | Manual |
| 28 | Alt+Shift+S | Save current solution | Manual |
| 29 | Shortcuts don't interfere with typing | Type normally in editor — no conflicts | Manual |

### ✅ Edge Cases

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 30 | Editor loads slowly | Extension waits 1s, re-inits on SPA navigation | Manual |
| 31 | SPA page navigation | Navigate between problems without refresh → toolbar re-inits | Manual |
| 32 | Multiple pastes | Paste twice → no duplicate content (replaces full range) | Manual |
| 33 | Very large code (10K+ lines) | Extension handles without freezing | Manual |
| 34 | Extension on non-CodeChef site | No toolbar, popup shows "Not CodeChef" | Manual |

### ✅ Security

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 35 | No eval() used | Grep codebase for eval — none found | ✅ Verified |
| 36 | No external network calls | Grep for fetch/XMLHttpRequest — none in extension code | ✅ Verified |
| 37 | No auto-submit | Extension never clicks Submit button | ✅ Verified |
| 38 | No auto-execute | Pasted code is never evaluated | ✅ Verified |
| 39 | Local storage only | All data in chrome.storage.local | ✅ Verified |

## Known Limitations

1. **Contest pages with anti-cheat**: During rated contests, CodeChef may add extra anti-cheat layers that could block programmatic editor access. This extension is designed for practice problems.

2. **Clipboard permission**: Some browser configurations block `navigator.clipboard.readText()` even with the `clipboardRead` permission. The manual fallback textarea covers this case.

3. **Editor not exposed globally**: If CodeChef bundles Monaco in a way that doesn't expose `window.monaco`, the page-bridge script may not find the editor instance. The bridge tries multiple detection methods.

4. **First load delay**: The editor takes time to mount after page load. The extension waits 1 second before initializing and re-checks on DOM changes.

## How to Run Manual Tests

1. Load the extension unpacked in Chrome
2. Go to any CodeChef problem (e.g., `https://www.codechef.com/problems/TEST`)
3. Open the code editor tab
4. Run through each test case in the matrix above
5. Check the browser console (F12) for `[CCU]` logs if anything fails
