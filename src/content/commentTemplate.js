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
                menu.style.visibility = 'hidden';
                menu.style.display = 'flex';

                const rect = btn.getBoundingClientRect();
                const menuHeight = menu.offsetHeight;

                // Position it above the button
                menu.style.left = `${rect.left + window.scrollX}px`;
                menu.style.top = `${rect.top + window.scrollY - menuHeight - 8}px`;
                menu.style.visibility = 'visible';
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

    // Filter items
    const filteredItems = data[vnCrActiveTab].filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category?.toLowerCase().includes(searchTerm);
        return nameMatch || categoryMatch;
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
            ${filteredItems.map((tmpl) => `
                <div class="vn-cr-item-row" data-id="${tmpl.id}">
                    <div class="vn-cr-item-name">
                        ${tmpl.category ? `<span class="vn-cr-badge">${tmpl.category}</span> ` : ''}
                        ${tmpl.name}
                    </div>
                    <button class="vn-cr-item-del" data-id="${tmpl.id}">×</button>
                </div>
            `).join('')}
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
    // --- SCROLL FIX HERE ---
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
    // --- END SCROLL FIX ---

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

    // A. Tab Switching (Remains the same)
    container.querySelectorAll('.vn-cr-tab-link').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            vnCrActiveTab = btn.getAttribute('data-name');
            renderMenuContent(container);
        };
    });

    // B. Insert Template (Now triggers on the whole ROW)
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

    // C. Delete Template (stopPropagation is CRITICAL here)
    container.querySelectorAll('.vn-cr-item-del').forEach(delBtn => {
        delBtn.onclick = async (e) => {
            e.stopPropagation(); // Prevent the template from being inserted when clicking X

            const idToDelete = delBtn.getAttribute('data-id');
            const templateName = delBtn.parentElement.querySelector('.vn-cr-item-name').textContent.trim();

            // Native confirmation for safety
            if (!confirm(`Are you sure you want to delete "${templateName}"?`)) {
                return;
            }

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

    // // D. Add New Template (Sticky Button)
    // container.querySelector('.vn-cr-add-new-tmpl').onclick = (e) => {
    //     e.stopPropagation();
    //     handleCreateNewTemplate(data); // We will build this function next
    // };
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
    // 2. Handle Fixed D2C Tagging Account
    if (templateValue.includes('[[@D2C]]')) {
        const d2cId = "tagging.d2c@samsung.com";
        const d2cName = "D2C Tagging";
        const d2cHtml = `<a class="user-hover" title="Follow link" contenteditable="false" tabindex="-1" href="/secure/ViewProfile.jspa?name=${encodeURIComponent(d2cId)}" rel="${d2cId}">${d2cName}</a>`;

        templateValue = templateValue.replace('[[@D2C]]', d2cHtml);
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
// Helper to inject text into Jira's editor
function vnCrInsertToJira(text) {
    const iframe = document.querySelector('#mce_0_ifr');
    if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const editor = doc.body;

        iframe.contentWindow.focus();

        // 1. Convert newlines to <br> for the rest of the message
        const htmlContent = text.split('\n').join('<br>');

        // 2. Use insertHTML to place the live <a> tag
        doc.execCommand('insertHTML', false, htmlContent + '&nbsp;');

        // 3. Trigger change events
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        // 4. TRIGGER JIRA HOVER RELOAD
        // This tells Jira: "Search the page for new .user-hover links and activate them"
        try {
            if (window.JIRA && window.JIRA.userHover && window.JIRA.userHover.init) {
                window.JIRA.userHover.init();
            } else if (window.AJS && window.AJS.InlineDialog) {
                // Older Jira versions sometimes use this
                window.AJS.trigger('contentRetrieved');
            }
        } catch (e) {
            console.log("Jira hover re-init skipped", e);
        }

    } else {
        const textarea = document.querySelector('#comment');
        if (textarea) {
            const start = textarea.selectionStart;
            textarea.setRangeText(text.replace(/<[^>]*>?/gm, ''), start, textarea.selectionEnd, 'end');
        }
    }
}