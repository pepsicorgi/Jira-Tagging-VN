import { waitForElement } from '../utils/domWatcher.js';
import { getVNCrData, saveVNCrData } from '../utils/storage.js';

// 1. State tracker for the active tab
let vnCrActiveTab = '3rd Party Tag';

export function initCommentFeature() {
    const tabListSelector = '#comment-wiki-edit .aui-navgroup-primary ul.aui-nav';

    waitForElement(tabListSelector, (tabGroup) => {
        if (document.querySelector('#vn-cr-li')) return;

        // 1. Create Button
        const li = document.createElement('li');
        li.id = 'vn-cr-li';
        const btn = document.createElement('button');
        btn.id = 'vn-cr-btn';
        btn.type = 'button';
        btn.className = 'aui-button';
        btn.textContent = 'Templates';
        li.appendChild(btn);
        tabGroup.appendChild(li);

        // 2. Create Dropdown Container (Hidden by default)
        const menu = document.createElement('div');
        menu.id = 'vn-cr-menu';
        menu.className = 'vn-cr-dropdown';
        menu.style.display = 'none';
        document.body.appendChild(menu); // Append to body to avoid overflow issues

        // 3. Force the dropdown to always open upwards
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'flex';

            if (isVisible) {
                menu.style.display = 'none';
            } else {
                // A. Render the content FIRST (so the menu has its items)
                await renderMenuContent(menu);

                // B. Show it as 'flex' but invisible for a split second to calculate height
                menu.style.visibility = 'hidden';
                menu.style.display = 'flex';

                // C. Calculate the position now that the browser knows the height
                const rect = btn.getBoundingClientRect();
                const menuHeight = menu.offsetHeight;

                menu.style.left = `${rect.left + window.scrollX}px`;
                menu.style.top = `${rect.top + window.scrollY - menuHeight - 8}px`;

                // D. Finally, make it visible
                menu.style.visibility = 'visible';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const isClickInsideMenu = menu.contains(e.target);
            const isClickOnTriggerBtn = btn.contains(e.target);

            if (!isClickInsideMenu && !isClickOnTriggerBtn) {
                menu.style.display = 'none';
            }
        });
    });
}

// 2. Updated render function to show real data
async function renderMenuContent(container) {
    const data = await getVNCrData();
    const categories = Object.keys(data);

    if (!categories.includes(vnCrActiveTab)) vnCrActiveTab = categories[0];

    container.innerHTML = `
        <div class="vn-cr-tabs-header">
            ${categories.map(cat => `
                <button class="vn-cr-tab-link ${cat === vnCrActiveTab ? 'active' : ''}" data-name="${cat}">
                    ${cat}
                </button>
            `).join('')}
            <button class="vn-cr-tab-add" title="Add New Category">+</button>
        </div>
        
        <div class="vn-cr-items-list">
    ${data[vnCrActiveTab].map((tmpl) => `
        <div class="vn-cr-item-row" data-id="${tmpl.id}">
            <div class="vn-cr-item-name">
                ${tmpl.category ? `<span class="vn-cr-badge">${tmpl.category}</span> ` : ''}
                ${tmpl.name}
            </div>
            <button class="vn-cr-item-del" data-id="${tmpl.id}">×</button>
        </div>
    `).join('')}
</div>

        <div class="vn-cr-add-btn-wrapper">
            <button class="vn-cr-add-new-tmpl">+ Add New Template</button>
        </div>
    `;

    setupMenuEvents(container, data);
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
    container.querySelectorAll('.vn-cr-item-del').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation(); // Prevents the row's "Insert" click from firing!
            const idx = btn.getAttribute('data-index');
            const tmplName = data[vnCrActiveTab][idx].name;

            if (confirm(`Delete template: "${tmplName}"?`)) {
                data[vnCrActiveTab].splice(idx, 1);
                await saveVNCrData(data);
                renderMenuContent(container);
            }
        };
    });

    // D. Add New Template (Sticky Button)
    container.querySelector('.vn-cr-add-new-tmpl').onclick = (e) => {
        e.stopPropagation();
        handleCreateNewTemplate(data); // We will build this function next
    };
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