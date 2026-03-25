import { waitForElement } from '../utils/domWatcher.js';
import { getVNCrData, saveVNCrData } from '../utils/storage.js';

// 1. State tracker for the active tab
let vnCrActiveTab = '3rd Party Tag';
let isSearchOpen = false; // Track if search bar is visible

export function initCommentFeature() {
    const tabListSelector = '#comment-wiki-edit .aui-navgroup-primary ul.aui-nav';

    waitForElement(tabListSelector, (tabGroup) => {
        if (document.querySelector('#vn-cr-li')) return;

        // 1. Create the LI container
        const li = document.createElement('li');
        li.id = 'vn-cr-li';
        li.style.display = 'inline-flex';
        li.style.alignItems = 'center';
        li.style.marginLeft = '5px';

        // 2. Create the Button Group (Templates + Save)
        li.innerHTML = `
            <button id="vn-cr-btn" type="button" class="aui-button" 
                style="border-top-right-radius:0; border-bottom-right-radius:0; margin-right:0;">
                Templates
            </button>
            <button id="vn-cr-save-btn" type="button" class="aui-button" title="Save current as template" 
                style="border-top-left-radius:0; border-bottom-left-radius:0; border-left:1px solid #dfe1e6; padding: 0 8px; margin-left:0; font-weight:bold;">
                +
            </button>
        `;

        tabGroup.appendChild(li);

        const btn = li.querySelector('#vn-cr-btn');
        const saveBtn = li.querySelector('#vn-cr-save-btn');

        // 3. Create Dropdown Container (Hidden by default)
        const menu = document.createElement('div');
        menu.id = 'vn-cr-menu';
        menu.className = 'vn-cr-dropdown';
        menu.style.display = 'none';
        document.body.appendChild(menu);

        // --- ACTION: OPEN DROPDOWN (Existing Logic) ---
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'flex';

            if (isVisible) {
                menu.style.display = 'none';
            } else {
                await renderMenuContent(menu);

                const rect = btn.getBoundingClientRect();

                // Use 'bottom' instead of 'top' for the calculation
                menu.style.left = `${rect.left + window.scrollX}px`;

                // We calculate the distance from the TOP of the viewport to the TOP of the button
                // Then subtract that from the total height to pin it to the bottom.
                // Easier way: Use bottom-up positioning
                const bottomOffset = window.innerHeight - rect.top + 8;

                menu.style.bottom = `${bottomOffset + window.scrollY}px`;
                menu.style.top = 'auto'; // Reset top so bottom takes precedence
                menu.style.display = 'flex';
            }
        });

        // --- ACTION: SAVE CURRENT (New Logic) ---
        saveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Close menu if open
            menu.style.display = 'none';

            // Dynamic import for the capture feature
            const src = chrome.runtime.getURL('src/content/templateCapture.js');
            const { initCaptureFlow } = await import(src);
            initCaptureFlow();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    });
}

// 2. Updated render function to show real data
async function renderMenuContent(container) {
    const data = await getVNCrData();
    const categories = Object.keys(data);

    // Get current search value before re-render
    const existingSearch = container.querySelector('#vn-cr-search-input');
    const searchTerm = existingSearch ? existingSearch.value.toLowerCase() : '';

    if (!categories.includes(vnCrActiveTab)) vnCrActiveTab = categories[0];

    // A. Filter items
    const filteredItems = data[vnCrActiveTab].filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category?.toLowerCase().includes(searchTerm);
        return nameMatch || categoryMatch;
    });


    // B. NEW SORTING LOGIC: Pinned first, then by original array order
    // We use a copy of the filtered items to avoid mutating the original data
    const sortedItems = [...filteredItems].sort((a, b) => {
        // If 'a' is pinned and 'b' isn't, move 'a' up
        if (a.isPinned && !b.isPinned) return -1;
        // If 'b' is pinned and 'a' isn't, move 'b' up
        if (!a.isPinned && b.isPinned) return 1;
        // If both are pinned or both are unpinned, keep original chronological order
        return 0;
    });
    container.innerHTML = `
        <div class="vn-cr-tabs-header">
            <div class="vn-cr-tabs-list">
                ${categories.map(cat => `
                    <button class="vn-cr-tab-link ${cat === vnCrActiveTab ? 'active' : ''}" data-name="${cat}">
                        ${cat}
                    </button>
                `).join('')}
            </div>
            <div class="vn-cr-tabs-actions">
                <button class="vn-cr-tab-search-toggle ${isSearchOpen ? 'active' : ''}" title="Search">🔍</button>
                <button class="vn-cr-tab-add" title="Add New Category">+</button>
            </div>
        </div>
        
        <div class="vn-cr-search-container" style="display: ${isSearchOpen ? 'flex' : 'none'}">
            <input type="text" id="vn-cr-search-input" placeholder="Search templates..." value="${searchTerm.replace(/"/g, '&quot;')}">
        </div>

       <div class="vn-cr-items-list">
            ${sortedItems.map((tmpl) => `
                <div class="vn-cr-item-row ${tmpl.isPinned ? 'is-pinned' : ''}" data-id="${tmpl.id}">
                    <div class="vn-cr-item-name">
                        ${tmpl.category ? `<span class="vn-cr-badge">${tmpl.category}</span> ` : ''}
                        ${tmpl.name}
                    </div>
                    <div class="vn-cr-item-actions" style="display:flex; align-items:center; gap:5px;">
                        <button class="vn-cr-item-pin" data-id="${tmpl.id}" title="${tmpl.isPinned ? 'Unpin' : 'Pin to top'}" 
                            style="background:none; border:none; cursor:pointer; font-size:14px; opacity: ${tmpl.isPinned ? '1' : '0.4'}">
                            ${tmpl.isPinned ? '📌' : '📍'}
                        </button>
                        <button class="vn-cr-item-del" data-id="${tmpl.id}">×</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div id="vn-cr-dialog-overlay" class="vn-cr-dialog-hidden">
    <div class="vn-cr-dialog-box">
        <p id="vn-cr-dialog-title"></p>
        <input type="text" id="vn-cr-dialog-input" style="display:none;" placeholder="Type here...">
        <div class="vn-cr-dialog-footer">
            <button id="vn-cr-dialog-cancel">Cancel</button>
            <button id="vn-cr-dialog-confirm">Confirm</button>
        </div>
    </div>
</div>                            
    `;

    setupMenuEvents(container, data);

    // Auto-focus if search just opened
    if (isSearchOpen) {
        const input = container.querySelector('#vn-cr-search-input');
        input.focus();
        if (searchTerm) input.setSelectionRange(searchTerm.length, searchTerm.length);
    }
}

// 3. New function to handle interactions inside the dropdown
function setupMenuEvents(container, data) {
    // SCROLL FIX 
    const itemsList = container.querySelector('.vn-cr-items-list');
    if (itemsList) {
        itemsList.onwheel = (e) => {
            const scrollTop = itemsList.scrollTop;
            const scrollHeight = itemsList.scrollHeight;
            const height = itemsList.offsetHeight;
            const delta = e.deltaY;

            // Stop the scroll from "leaking" to the Jira page 
            // when we hit the top or bottom of our list
            if ((delta < 0 && scrollTop <= 0) || (delta > 0 && Math.ceil(scrollTop + height) >= scrollHeight)) {
                e.preventDefault();
            }
        };
    }

    // SEARCH TOGGLE
    const searchToggle = container.querySelector('.vn-cr-tab-search-toggle');
    if (searchToggle) {
        searchToggle.onclick = (e) => {
            e.stopPropagation();
            isSearchOpen = !isSearchOpen; // Flip the state
            renderMenuContent(container); // Re-render
        };
    }

    const searchInput = container.querySelector('#vn-cr-search-input');
    if (searchInput) {
        searchInput.oninput = () => renderMenuContent(container);
        searchInput.onclick = (e) => e.stopPropagation();
    }

    // PIN CLICK HANDLER 
    container.querySelectorAll('.vn-cr-item-pin').forEach(pinBtn => {
        pinBtn.onclick = async (e) => {
            e.stopPropagation(); // Stop the row from being clicked/inserted
            const idToToggle = pinBtn.getAttribute('data-id');

            // Find the item in the current tab array
            const item = data[vnCrActiveTab].find(i => i.id === idToToggle);
            if (item) {
                // Toggle the state
                item.isPinned = !item.isPinned;

                // Save to storage
                await saveVNCrData(data);

                // Re-render to see the item jump to top/bottom
                renderMenuContent(container);
            }
        };
    });


    // TAB HANDLERS
    // A. Tab Switching (Remains the same)
    container.querySelectorAll('.vn-cr-tab-link').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            vnCrActiveTab = btn.getAttribute('data-name');
            renderMenuContent(container);
        };
    });

    // B. ADD NEW TAB 
    const addTabBtn = container.querySelector('.vn-cr-tab-add');
    if (addTabBtn) {
        addTabBtn.onclick = async (e) => {
            e.stopPropagation();

            // 1. Use our beautiful Mini-Dialog with an input field
            const newTabName = await showVNActionDialog("New Category Name:", true, "primary");

            // Validation: If user clicked Cancel or entered nothing but spaces
            if (!newTabName || newTabName.trim() === "") return;

            const trimmedName = newTabName.trim();

            // 2. Check for duplicates using our Dialog instead of alert()
            if (data[trimmedName]) {
                await showVNActionDialog(`"${trimmedName}" already exists!`, false, "primary");
                return;
            }

            // 3. Add the new empty category to our data object
            data[trimmedName] = [];

            // 4. Set the new tab as the active one so they see the empty state
            vnCrActiveTab = trimmedName;

            // 5. Save to Chrome Storage & Refresh
            await saveVNCrData(data);

            console.log(`✨ Created new category: ${trimmedName}`);
            renderMenuContent(container);
        };
    }

    // C. DELETE TAB
    container.querySelectorAll('.vn-cr-tab-link').forEach(tab => {
        tab.oncontextmenu = async (e) => {
            e.preventDefault(); // Stop the native browser menu

            const tabToDelete = tab.getAttribute('data-name');

            // 1. Show the custom Red Danger dialog
            const confirmed = await showVNActionDialog(
                `Delete entire "${tabToDelete}" tab and ALL its templates?`,
                false,
                "danger"
            );

            // 2. If they cancelled, do nothing
            if (!confirmed) return;

            // 3. Perform the deletion
            delete data[tabToDelete];

            // 4. Safety check: What if we just deleted the last tab?
            const remainingTabs = Object.keys(data);
            if (remainingTabs.length > 0) {
                // If the tab we deleted was the active one, switch to the first available
                if (vnCrActiveTab === tabToDelete) {
                    vnCrActiveTab = remainingTabs[0];
                }
            } else {
                // If NO tabs left, create an empty 'General' one so the app doesn't crash
                data["General"] = [];
                vnCrActiveTab = "General";
            }

            // 5. Save and Refresh
            await saveVNCrData(data);
            console.log(`🔥 Category purged: ${tabToDelete}`);
            renderMenuContent(container);
        };
    });

    // TEMPLATE HANDLERS
    // A. Insert Template 
    container.querySelectorAll('.vn-cr-item-row').forEach(row => {
        row.onclick = async (e) => { // 1. Must be async
            e.stopPropagation();

            const idToFind = row.getAttribute('data-id');
            const template = data[vnCrActiveTab].find(tmpl => tmpl.id === idToFind);

            if (template && template.value) {
                console.log("Template clicked, processing placeholders..."); // Debug log

                // 2. MUST await the handler
                const finalValue = await handleTemplateInsertion(template.value);

                // 3. Only insert if the user didn't cancel
                if (finalValue) {
                    console.log("Placeholders resolved! Inserting...");
                    vnCrInsertToJira(finalValue);
                    document.querySelector('#vn-cr-menu').style.display = 'none';
                }
            }
        };
    });

    // B. Delete Template
    container.querySelectorAll('.vn-cr-item-del').forEach(delBtn => {
        delBtn.onclick = async (e) => {
            e.stopPropagation(); // Prevent the template from being inserted when clicking X

            const idToDelete = delBtn.getAttribute('data-id');
            // Find the closest row first, then search for the name inside it
            const row = delBtn.closest('.vn-cr-item-row');
            const templateName = row.querySelector('.vn-cr-item-name').textContent.trim();

            // Native confirmation for safety
            const confirmed = await showVNActionDialog(`Delete "${templateName}"?`, false, "danger");
            if (!confirmed) return;

            // A. Remove the item from the data object
            // We look inside the currently active tab's array
            const updatedTabItems = data[vnCrActiveTab].filter(item => item.id !== idToDelete);
            data[vnCrActiveTab] = updatedTabItems;

            // B. Save the updated object back to chrome.storage.local
            await saveVNCrData(data);

            // C. UI Reflection: Re-render the menu immediately
            console.log(`🗑️ Deleted template: ${idToDelete}`);
            renderMenuContent(container);
        };
    });
}

// 5. Placeholder Resolver: Processes [[Label|Opt1|Opt2]] before insertion
async function handleTemplateInsertion(templateValue) {
    // 1. Check for Auto-Reporter Placeholder [[@Reporter]]
    if (templateValue.includes('[[@Reporter]]')) {
        const reporter = getJiraReporterName();

        if (reporter.userId) {
            // Build the string strictly on one line to prevent extra space issues
            const mentionHtml = `<a class="user-hover" title="Follow link" contenteditable="false" tabindex="-1" href="/secure/ViewProfile.jspa?name=${encodeURIComponent(reporter.userId)}" rel="${reporter.userId}">${reporter.displayName}</a>`;

            templateValue = templateValue.replace('[[@Reporter]]', mentionHtml);
        } else {
            templateValue = templateValue.replace('[[@Reporter]]', `${reporter.displayName}`);
        }
    }
    // 2.1 Handle Fixed D2C Tagging Account
    if (templateValue.includes('[[@D2C]]')) {
        const d2cId = "tagging.d2c@samsung.com";
        const d2cName = "D2C Tagging";
        const d2cHtml = `<a class="user-hover" title="Follow link" contenteditable="false" tabindex="-1" href="/secure/ViewProfile.jspa?name=${encodeURIComponent(d2cId)}" rel="${d2cId}">${d2cName}</a>`;

        templateValue = templateValue.replace('[[@D2C]]', d2cHtml);
    }

    // 2.2 Handle Fixed Tagging Jira Support
    if (templateValue.includes('[[TAGGING JIRA SUPPORT]]')) {
        const taggingId = "tagging.jira@concentrix.com";
        const taggingName = "TAGGING JIRA SUPPORT";
        const taggingHtml = `<a class="user-hover" title="Follow link" contenteditable="false" tabindex="-1" href="/secure/ViewProfile.jspa?name=${encodeURIComponent(taggingId)}" rel="${taggingId}">${taggingName}</a>`;

        templateValue = templateValue.replace('[[TAGGING JIRA SUPPORT]]', taggingHtml);
    }

    // 3. Continue with Choice Placeholders [[Label|Opt1|...]]
    const placeholderRegex = /\[\[([^\]]+)\]\]/g;
    const match = placeholderRegex.exec(templateValue);

    if (match) {
        const parts = match[1].split('|');
        const label = parts[0];
        const options = parts.slice(1);

        // We only handle choices now. If someone forgot pipes, we ignore it.
        if (options.length > 0) {
            const choice = await showPlaceholderPicker(label, options);
            if (choice !== null) {
                const newValue = templateValue.replace(match[0], choice);
                return handleTemplateInsertion(newValue);
            }
            return null;
        }
    }
    return templateValue;
}
// 6. Updated UI for Choice Placeholders
function showPlaceholderPicker(label, options) {
    return new Promise((resolve) => {
        const menu = document.querySelector('#vn-cr-menu');

        // Save current content so we can restore it if they cancel
        const originalHTML = menu.innerHTML;

        menu.innerHTML = `
            <div class="vn-cr-picker-container">
                <div class="vn-cr-picker-label">Select ${label}:</div>
                ${options.map(opt => `
                    <button class="vn-cr-picker-option" data-value="${opt}">${opt}</button>
                `).join('')}
                <button class="vn-cr-add-new-tmpl" style="margin-top:10px; border-style:solid;">Cancel</button>
            </div>
        `;

        // Handle Choice
        menu.querySelectorAll('.vn-cr-picker-option').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                resolve(btn.dataset.value);
            };
        });

        // Handle Cancel
        menu.querySelector('.vn-cr-add-new-tmpl').onclick = (e) => {
            e.stopPropagation();
            menu.innerHTML = originalHTML; // Restore menu
            renderMenuContent(menu); // Re-bind events
            resolve(null);
        };
    });
}

function getJiraReporterName() {
    const reporterElement = document.querySelector('#reporter-val .user-hover');
    if (reporterElement) {
        return {
            userId: reporterElement.getAttribute('rel'),
            displayName: reporterElement.textContent.trim()
        };
    }
    return { userId: null, displayName: 'reporter' };
}

async function showVNActionDialog(title, isInput = false, type = "primary", defaultValue = "") {
    return new Promise((resolve) => {
        const overlay = document.getElementById('vn-cr-dialog-overlay');
        const titleEl = document.getElementById('vn-cr-dialog-title');
        const inputEl = document.getElementById('vn-cr-dialog-input');
        const confirmBtn = document.getElementById('vn-cr-dialog-confirm');
        const cancelBtn = document.getElementById('vn-cr-dialog-cancel');

        // 1. Set Content
        titleEl.textContent = title;
        inputEl.style.display = isInput ? 'block' : 'none';
        inputEl.value = defaultValue;

        // 2. Set Button Style based on Type
        if (type === "danger") {
            confirmBtn.textContent = "Delete";
            confirmBtn.style.backgroundColor = "#ff5630"; // A slightly more vibrant "Modern" Red
        } else {
            confirmBtn.textContent = "Confirm";
            confirmBtn.style.backgroundColor = "#0065ff"; // Bright Jira Blue
        }

        overlay.classList.remove('vn-cr-dialog-hidden');
        if (isInput) setTimeout(() => inputEl.focus(), 10);

        // 3. Helper to close and return value
        const close = (val) => {
            overlay.classList.add('vn-cr-dialog-hidden');
            // Clean up listeners so they don't stack up next time
            window.removeEventListener('keydown', handleKeyDown);
            resolve(val);
        };

        // 4. Keyboard Support (Enter and Escape)
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                const val = isInput ? inputEl.value : true;
                if (isInput && !val.trim()) return; // Don't allow empty tab names
                close(val);
            }
            if (e.key === 'Escape') {
                close(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // 5. Click Events
        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            const val = isInput ? inputEl.value : true;
            close(val);
        };

        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            close(null);
        };

        // Close if clicking outside the white box
        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };
    });
}

// Helper to inject text into Jira's editor
function vnCrInsertToJira(text) {
    console.log("vnCr: Attempting to insert text...", { textLength: text.length });

    const iframe = document.querySelector('#mce_0_ifr');
    const submitBtn = document.querySelector('#issue-comment-add-submit');

    // Helper to force enable the button if it exists
    const wakeUpSubmitButton = () => {
        if (submitBtn) {
            console.log("vnCr: Manually enabling the 'Add' button");
            submitBtn.removeAttribute('disabled');
            submitBtn.setAttribute('aria-disabled', 'false');
            // Some Jira versions use a CSS class for the grey look too
            submitBtn.classList.remove('disabled'); 
        }
    };

    if (iframe) {
        console.log("vnCr: Found Iframe (Rich Text Mode)");
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const editor = doc.body;

        iframe.contentWindow.focus();
        const htmlContent = text.split('\n').join('<br>');
        doc.execCommand('insertHTML', false, htmlContent + '&nbsp;');

        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        
        wakeUpSubmitButton();

        try {
            if (window.JIRA?.userHover?.init) window.JIRA.userHover.init();
        } catch (e) { console.warn("vnCr: Jira hover init failed", e); }

    } else {
        console.log("vnCr: No Iframe found. Looking for Textarea...");
        const textarea = document.querySelector('#comment');
        
        if (textarea) {
            console.log("vnCr: Found Textarea (#comment)");
            textarea.focus();
            const start = textarea.selectionStart;
            const cleanText = text.replace(/<[^>]*>?/gm, ''); 
            
            textarea.setRangeText(cleanText, start, textarea.selectionEnd, 'end');

            // Trigger events
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            wakeUpSubmitButton();
        } else {
            console.error("vnCr: Could not find any comment input field (#mce_0_ifr or #comment)");
        }
    }
}