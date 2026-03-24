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
    // A. Tab Switching (Remains the same)
    container.querySelectorAll('.vn-cr-tab-link').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            vnCrActiveTab = btn.getAttribute('data-name');
            renderMenuContent(container);
        };
    });

    // B. Insert Template (Now triggers on the whole ROW)
    // Updated Insert logic to find item by ID instead of Index
    container.querySelectorAll('.vn-cr-item-row').forEach(row => {
        row.onclick = (e) => {
            e.stopPropagation();

            // Get the ID from the data attribute we set in renderMenuContent
            const idToFind = row.getAttribute('data-id');

            // Find the specific template object in the current tab's array
            const template = data[vnCrActiveTab].find(tmpl => tmpl.id === idToFind);

            if (template && template.value) {
                vnCrInsertToJira(template.value);
                document.querySelector('#vn-cr-menu').style.display = 'none';
            } else {
                console.error('❌ VN-CR: Template not found for ID:', idToFind);
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

// 4. Helper to inject text into Jira's editor
function vnCrInsertToJira(text) {
    try {
        const iframe = document.querySelector('#mce_0_ifr');
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const target = iframeDoc?.querySelector('body') || document.querySelector('#comment');

        if (target) {
            // Check if it's the rich text editor (body) or plain textarea
            if (target.tagName === 'BODY') {
                target.innerText = text;
            } else {
                target.value = text;
            }
            // Trigger input event so Jira knows the content changed
            target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } catch (err) {
        console.error('VN-CR: Insert failed', err);
    }
}