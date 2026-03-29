// src/helpers/sdkHelper.js
import { waitForElement } from '../utils/domWatcher.js';
import { subsidiaryData } from '../utils/country.js';

export const initSubsidiaryLookup = () => {
    console.log("VN SDK: Initializing Subsidiary Lookup...");

    const fieldId = 'customfield_19102-val';

    // Check if data exists
    if (typeof subsidiaryData === 'undefined') {
        console.error("VN SDK ERROR: subsidiaryData object is missing! Make sure it is defined above this function.");
    }

    // 1. Create/Ensure Tooltip exists in DOM
    let tooltip = document.querySelector('.vn-subsidiary-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'vn-subsidiary-tooltip';
        document.body.appendChild(tooltip);
        console.log("VN SDK: Tooltip element created and added to body.");
    }

    const showTooltip = (e) => {
        try {
            console.log("--- HOVER DETECTED ---");
            const target = e.currentTarget;
            const rawText = target.innerText || "";

            // Match 3-6 uppercase letters
            const match = rawText.match(/\b([A-Z][A-Za-z0-9\-\s]{2,15})\b/);
            const code = match ? match[1] : null;

            console.log("Target Text:", rawText.replace(/\n/g, ' [newline] '));
            console.log("Matched Code:", code);

            if (code && subsidiaryData[code]) {
                const data = subsidiaryData[code];
                tooltip.innerHTML = `
                    <div style="border-bottom: 1px solid #5e6c84; margin-bottom: 8px; padding-bottom: 5px;">
                        <strong style="color: #4c9aff; font-size: 14px;">${code}</strong>
                    </div>
                    <div class="vn-tooltip-row"><strong>Country:</strong> ${data.country}</div>
                    <div class="vn-tooltip-row"><strong>Site:</strong> ${data.siteCode}</div>
                    <div class="vn-tooltip-row"><strong>Region:</strong> ${data.region}</div>
                    <div class="vn-tooltip-row"><strong>RHQ:</strong> ${data.rhq}</div>
                `;

                const rect = target.getBoundingClientRect();
                tooltip.style.display = 'block';
                tooltip.style.position = 'fixed';
                tooltip.style.top = `${rect.top - 25}px`;
                tooltip.style.left = `${rect.right + 60}px`;
                tooltip.style.zIndex = '999999';
                console.log("Tooltip displayed successfully.");
            } else {
                console.log(`No data mapping found for: "${code}"`);
            }
        } catch (err) {
            console.error("VN SDK Tooltip Crash:", err);
        }
    };

    // 2. Attach using your existing helper
    waitForElement(`#${fieldId}`, (el) => {
        // 1. Get the text and find the code (e.g., "TSE")
        const rawText = el.innerText;
        const match = rawText.match(/\b([A-Z]{3,6})\b/);

        if (match) {
            const code = match[1];
            // 2. Wrap only the code in our new span, keeping the rest of the HTML (like the edit icon)
            // We use replace to target ONLY the first instance of the code
            el.innerHTML = el.innerHTML.replace(code, `<span class="vn-sub-highlight">${code}</span>`);
        }

        // 3. Keep your existing event listeners exactly the same
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', () => tooltip.style.display = 'none');
        el.style.cursor = 'help';
    });
};

export const initHelpers = () => {
    const sdkPattern = /\b(z[\w\(\)\-\/\. ]*WebSDK)\b/gi;

    const injectButtons = (container) => {
        if (container.dataset.vnProcessed === "true") return;

        const keyEl = document.getElementById('key-val');
        const ticketId = keyEl ? keyEl.innerText.trim() : null;

        // Regex that ignores trailing punctuation like ) or .
        const libPattern = ticketId ? new RegExp(`\\b(${ticketId.replace('-', '-?')}[\\s_-]+\\d+[^<\\n]*)`, 'gi') : null;
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const nodesToReplace = [];
        let node;

        while (node = walker.nextNode()) {
            const matchesSDK = sdkPattern.test(node.nodeValue);
            const matchesLib = libPattern && libPattern.test(node.nodeValue);

            if (matchesSDK || matchesLib) {
                if (!node.parentElement.closest('.vn-sdk-wrapper')) {
                    nodesToReplace.push(node);
                    if (matchesLib) {
                        const parentLi = node.parentElement?.closest('li');
                        if (parentLi) parentLi.dataset.vnLibProcessed = "true";
                    }
                    continue;
                }
            }

            // Split Library Detection (Jira Link + _Date)
            const parentLi = node.parentElement?.closest('li');
            if (parentLi && !parentLi.dataset.vnLibProcessed) {
                const prevElem = node.previousSibling;
                if (prevElem && prevElem.tagName === 'A' && prevElem.classList.contains('issue-link')) {
                    const linkedTicket = prevElem.getAttribute('data-issue-key');
                    if (linkedTicket && linkedTicket.replace('-', '') === ticketId.replace('-', '')) {

                        // Capture the raw text node
                        const rawTrailing = node.nodeValue;
                        // Clean only the trailing punctuation (e.g., ")", ".", ",") but KEEP spaces and words
                        const cleanTrailing = rawTrailing.replace(/[)\s.,!]+$/, '');
                        const remainder = rawTrailing.slice(cleanTrailing.length);

                        nodesToReplace.push({
                            node,
                            type: 'LI_LIB',
                            fullValue: (linkedTicket + cleanTrailing).trim(),
                            container: parentLi,
                            matchText: cleanTrailing,
                            remainder: remainder // This holds the ")" so it stays plain text
                        });
                        parentLi.dataset.vnLibProcessed = "true";
                        continue;
                    }
                }
            }
        }

        nodesToReplace.forEach(item => {
            if (item.type === 'LI_LIB') {
                // 1. Highlight the Jira Link
                const prevElem = item.node.previousSibling;
                if (prevElem && prevElem.tagName === 'A') {
                    prevElem.classList.add('vn-highlight', 'vn-lib-text');
                }

                // 2. Create Highlight for the cleaned text
                const dateSpan = document.createElement('span');
                dateSpan.className = 'vn-highlight vn-lib-text';
                dateSpan.innerText = item.matchText;

                // 3. Create Button with the FULL cleaned string
                const btn = document.createElement('button');
                btn.className = 'vn-copy-btn';
                btn.setAttribute('data-copy', item.fullValue);
                btn.innerText = '⧉';

                // 4. Reconstruct the DOM
                const fragment = document.createDocumentFragment();
                fragment.appendChild(dateSpan);
                if (item.remainder) {
                    fragment.appendChild(document.createTextNode(item.remainder));
                }

                item.node.parentNode.replaceChild(fragment, item.node);
                // Insert button after the text/remainder
                item.container.appendChild(btn);
                return;
            }

            const textNode = item;
            const span = document.createElement('span');
            span.className = 'vn-sdk-wrapper';

            // IMPORTANT: Use textNode.nodeValue (not node.nodeValue)
            let content = textNode.nodeValue.replace(sdkPattern, (match) => {
                return `<span class="vn-highlight">${match}</span> <button class="vn-copy-btn" data-copy="${match.trim()}">⧉</button>`;
            });

            if (libPattern) {
                // Also apply the trailing punctuation cleanup for standard matches
                content = content.replace(libPattern, (match) => {
                    // Clean match for the copy attribute, but keep original for display
                    const cleanMatch = match.replace(/[)\s.,!]+$/, '').trim();
                    return `<span class="vn-highlight vn-lib-text">${match}</span> <button class="vn-copy-btn" data-copy="${cleanMatch}">⧉</button>`;
                });
            }

            span.innerHTML = content;
            textNode.parentNode.replaceChild(span, textNode);
        });

        container.dataset.vnProcessed = "true";
    };

    waitForElement('#description-val', (el) => {
        injectButtons(el);
        const observer = new MutationObserver(() => {
            const currentKey = document.getElementById('key-val')?.innerText;
            if (el.dataset.lastKey !== currentKey) {
                delete el.dataset.vnProcessed;
                el.dataset.lastKey = currentKey;
            }
            injectButtons(el);
        });
        observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
};

// --- Updated Event Listener: ONLY handles the button clicks ---
document.addEventListener('click', (e) => {
    // Only target the actual copy button
    const btn = e.target.closest('.vn-copy-btn');
    if (!btn) return;

    e.stopPropagation();
    const val = btn.getAttribute('data-copy');

    navigator.clipboard.writeText(val).then(() => {
        // Visual feedback for the button icon
        const originalText = btn.innerText;
        btn.innerText = '✓';
        btn.classList.add('vn-copied');

        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('vn-copied');
        }, 1000);
    });
}, true);