import { waitForElement } from '../utils/domWatcher.js';

export function initAemShopFeature() {
    try {
        // ZONE 1: FEATURE STATE & CONFIG
        window.vnTagTeam = window.vnTagTeam || {};
        const ticketKey =
            document.querySelector('#key-val')?.textContent?.trim() ||
            'unknown_ticket';
        const getStorageKey = (ticketKey, btnLabel) => {
            const mode = (btnLabel || '').toUpperCase().includes('SHOP')
                ? 'SHOP'
                : 'AEM';
            return `vnTagTeam_${ticketKey}_${mode}`;
        };

        const savedRaw = sessionStorage.getItem(`vnTagTeam_${ticketKey}`);

        const savedData = JSON.parse(savedRaw || '[]');

        window.vnTagTeam.panelData = Array.isArray(savedData) ? savedData : [];
        const panelData = window.vnTagTeam.panelData;

        window.vnTagTeam.lastBtnLabel =
            sessionStorage.getItem(`vnTagTeam_section_${ticketKey}`) || '';

        const checklistTemplates = {
            'Date Extension Rule Checklist': [
                { checkpoint: 'Detail', item: 'Summary(Title)' },
                { checkpoint: '', item: 'Issue Type: 3rd Party Tag Request' },
                { checkpoint: '', item: 'Sub Issue Type: Date Extension Rule' },
                { checkpoint: '', item: 'Subsidiary(GTA)' },
                { checkpoint: '', item: 'Section(GTA)' },
                {
                    checkpoint: 'Description',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Target Property</span>',
                },
                { checkpoint: '', item: '<span style="color:#d32f2f; font-weight:bold;">Target Library</span>' },
                { checkpoint: '', item: 'Target Page' },
                {
                    checkpoint: '',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Current Expiration date</span>',
                },
                {
                    checkpoint: '',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Requested Expiration date</span>',
                },
                { checkpoint: '', item: 'Purpose & Goal' },
                { checkpoint: 'Library/Rule', item: 'Event - Window Loaded / Click' },
                { checkpoint: '', item: 'Query Path / Value Comparison' },
                { checkpoint: '', item: 'Condition - Date Range' },
                { checkpoint: '', item: 'Actions' },
                { checkpoint: '', item: "img has display = 'none'" },
                {
                    checkpoint: 'Comment',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Sub’s Head of Online Biz Confirmation</span>',
                },
            ],
            'New/Update Rule Checklist': [
                { checkpoint: 'Detail', item: 'Summary(Title)' },
                { checkpoint: '', item: 'Issue Type: 3rd Party Tag Request' },
                { checkpoint: '', item: 'Sub Issue Type: New/Update Rule' },
                { checkpoint: 'Description', item: 'Subsidiary(GTA)' },
                { checkpoint: '', item: 'Section(GTA)' },
                {
                    checkpoint: '',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Target Property</span>',
                },
                { checkpoint: '', item: '<span style="color:#d32f2f; font-weight:bold;">Target Library</span>' },
                { checkpoint: '', item: 'Target Page' },
                { checkpoint: '', item: 'Expiration date (to-be)', },
                { checkpoint: '', item: 'Status (to-be)' },
                { checkpoint: '', item: 'Purpose & Goal' },
                {
                    checkpoint: 'Attachment',
                    item: 'Test Result screenshot image file (without filter)</span>',
                },
                { checkpoint: '', item: 'Local Rule Monitoring Excel file' },
                { checkpoint: 'Library/Rules', item: 'Event - NOT Dom Ready' },
                { checkpoint: '', item: 'Query Path / Value Comparison' },
                { checkpoint: '', item: 'Condition - Date Range' },
                { checkpoint: '', item: 'Script - JavaScript' },
                { checkpoint: '', item: "① img has display = 'none'" },
                { checkpoint: '', item: '② Script var s' },
                { checkpoint: '', item: '③ Rule name 5 depth' },
                { checkpoint: '', item: '④ Condition GDPR with EU' },
                { checkpoint: 'Comment', item: 'Integration Result' },
                {
                    checkpoint: '',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Sub’s Head of Online Biz Confirmation Name</span>',
                },
                {
                    checkpoint: 'Issue Links',
                    item: 'Ticket Link of New Tag Approval',
                },
            ],
            'Disable Rule Checklist': [
                { checkpoint: 'Detail', item: 'Summary(Title)' },
                { checkpoint: '', item: 'Issue Type: 3rd Party Tag Request' },
                { checkpoint: '', item: 'Sub Issue Type: Disable Rule' },
                { checkpoint: 'Description', item: 'Subsidiary(GTA)' },
                { checkpoint: '', item: 'Section(GTA)' },
                {
                    checkpoint: '',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Target Property</span>',
                },
                { checkpoint: '', item: '<span style="color:#d32f2f; font-weight:bold;">Target Library</span>' },
            ],
            'New Tag Checklist': [
                { checkpoint: 'Detail', item: 'Summary(Title)' },
                { checkpoint: '', item: 'Issue Type: New Tag Request' },
                { checkpoint: '', item: 'Subsidiary(GTA)' },
                { checkpoint: '', item: 'Section(GTA)' },
                {
                    checkpoint: 'Description',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Target Property</span>',
                },
                { checkpoint: '', item: 'Target Page' },
                { checkpoint: '', item: 'Status(AS-IS)' },
                { checkpoint: '', item: 'Purpose & Goal' },
                {
                    checkpoint: 'Attachment',
                    item: 'Local Rule Monitoring Excel file',
                },
                {
                    checkpoint: 'Comment',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Sub’s Head of Online Biz Confirmation Name</span>',
                },
            ],
            'GDPR Checklist': [
                { checkpoint: 'Details', item: 'Summary(Title)' },
                { checkpoint: '', item: 'Issue Type: 3rd Party Tag Request' },
                { checkpoint: '', item: 'Subsidiary(GTA)' },
                { checkpoint: '', item: 'Section(GTA)' },
                {
                    checkpoint: 'Description',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Target Property</span>',
                },
                { checkpoint: '', item: '<span style="color:#d32f2f; font-weight:bold;">Target Library</span>' },
                { checkpoint: '', item: 'Purpose & Goal' },
                {
                    checkpoint: 'Comment',
                    item: '<span style="color:#d32f2f; font-weight:bold;">Sub’s Head of Online Biz Confirmation</span>',
                },
            ],
        };

        // ZONE 2: UI UTILITIES (Internal to this module)
        const createButton = (id, label) => {
            const li = document.createElement('li');
            li.className = 'aui-buttons pluggable-ops';
            const btn = document.createElement('button');
            btn.id = id;
            btn.className = 'aui-button vn-checklist-btn';
            btn.type = 'button';
            btn.textContent = label;
            li.appendChild(btn);
            return li;
        };

        const injectPanel = () => {
            if (document.querySelector('#vn-floating-panel')) return;

            const html = `
<div id="vn-floating-panel" class="hidden">
	<div class="vn-panel-header">
		<span class="vn-panel-title">VN Tag Team Checklist</span>
		<button class="vn-panel-close" title="Close">×</button>
	</div>
	<div class="vn-panel-body">
		<table class="vn-table aui">
			<thead>
				<tr><th>Checkpoint</th><th>Item</th><th>Result (*pass/fail)</th></tr>
			</thead>
			<tbody id="vn-checklist-table"></tbody>
		</table>
		<div class="vn-panel-footer">
			<button id="vn-create-btn" class="aui-button aui-button-primary">Create</button>
		</div>
	</div>
</div>`;

            document.body.insertAdjacentHTML('beforeend', html);

            // Gán event cho nút Close
            const panel = document.querySelector('#vn-floating-panel');
            panel.querySelector('.vn-panel-close').addEventListener('click', () => {
                panel.classList.add('hidden');
            });

            // ===== handle Create button click =====
            const createBtn = document.querySelector('#vn-create-btn');
            createBtn.addEventListener('click', () => {
                // console.log('%cVN Tag Team: Create button clicked', 'color:#1976d2');
                const currentBtnLabel = window.vnTagTeam?.lastBtnLabel || 'AEM';
                const storageKey = getStorageKey(ticketKey, currentBtnLabel);
                const summary =
                    document.querySelector('#summary-val h2')?.textContent?.trim() || '';
                const subsidiary =
                    document
                        .querySelector('#customfield_19102-val')
                        ?.textContent?.trim() || '';
                const section =
                    document
                        .querySelector('#customfield_19101-val')
                        ?.textContent?.trim() || '';

                const rows = document.querySelectorAll('#vn-checklist-table tr');
                const missing = [];

                // Step 1: tìm các ô bắt buộc nhưng trống
                rows.forEach((row, idx) => {
                    // SAFETY GUARD: Check if columns exist before reading them
                    if (!row || !row.children || row.children.length < 3) {
                        console.warn(`VN Tag Team: Skipping invalid row at index ${idx}`);
                        return; // Skip this iteration
                    }

                    const itemHTML = row.children[1].innerHTML || '';
                    const itemLabel = row.children[1].textContent.toLowerCase().trim();
                    const cell = row.children[2];

                    // === autofill các trường cố định ===
                    if (itemLabel.includes('summary') && summary)
                        cell.textContent = summary;
                    if (itemLabel.includes('subsidiary') && subsidiary)
                        cell.textContent = subsidiary;
                    // const section = window.vnTagTeam?.lastBtnLabel || '';

                    if (
                        itemLabel.includes('section') &&
                        section &&
                        !cell.textContent.trim()
                    ) {
                        cell.textContent = section;
                    }

                    // === đảm bảo panelData[idx] tồn tại ===
                    if (!panelData[idx]) {
                        panelData[idx] = {
                            checkpoint: row.children[0].textContent.trim(),
                            item: itemLabel,
                            itemHTML,
                            result: '',
                        };
                    }

                    // === cập nhật result ===
                    panelData[idx].result = cell.textContent.trim();

                    // === check xem có phải field required không ===
                    const isRequired = /<span[^>]*color:\s*#d32f2f/i.test(itemHTML);
                    const value = cell.textContent.trim();

                    if (isRequired && !value) {
                        missing.push({
                            row,
                            reqLabel: itemLabel,
                        });
                    }
                });

                // console.log(
                //   '%cVN Tag Team: autoFill updated panelData →',
                //   'color:#388e3c',
                //   panelData
                // );

                // Step 2: xử lý highlight + error message cho missing fields
                if (missing.length) {
                    missing.forEach((m, idx) => {
                        const row = m.row;
                        if (!row) return;

                        const resultCell = row.children[2];
                        // mark as having error so ::after shows placeholder text
                        resultCell.dataset.hasError = 'true';
                        resultCell.classList.add('vn-error');

                        // visual highlight
                        resultCell.style.border = '1.5px solid #d32f2f';
                        resultCell.style.position = 'relative';

                        // set the placeholder text via CSS variable (so it's easy to override)
                        resultCell.style.setProperty(
                            '--vn-error-text',
                            '"This field is required."'
                        );

                        // inject CSS once
                        if (!document.querySelector('#vn-error-style')) {
                            const style = document.createElement('style');
                            style.id = 'vn-error-style';
                            style.textContent = `
        /* inline placeholder overlay for editable td */
        td.vn-error::after {
          content: var(--vn-error-text);
          position: absolute;
          top: 50%;
          left: 8px;
          transform: translateY(-50%);
          font-size: 12px;
          font-style: italic;
          color: rgba(179, 0, 0, 0.45);
          pointer-events: none; /* allow caret + clicks through */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: calc(100% - 16px);
        }
        /* hide placeholder when dataset removed or cell has user input */
        td.vn-error[data-has-error="false"]::after,
        td.vn-error:not([data-has-error])::after {
          content: "";
        }
      `;
                            document.head.appendChild(style);
                        }

                        // When user types, clear placeholder + border
                        const clearError = () => {
                            const text = resultCell.textContent.trim();
                            if (text.length > 0) {
                                resultCell.classList.remove('vn-error');
                                resultCell.style.border = '';
                                resultCell.dataset.hasError = 'false';
                                resultCell.removeEventListener('input', clearError);
                                // update panelData if exists
                                try {
                                    const key = (row.children[1].textContent || '')
                                        .replace(/<[^>]*>/g, '')
                                        .toLowerCase()
                                        .trim();
                                    if (
                                        window.vnTagTeam &&
                                        window.vnTagTeam.panelData &&
                                        window.vnTagTeam.panelData[key]
                                    ) {
                                        window.vnTagTeam.panelData[key].result =
                                            resultCell.textContent.trim();
                                    }
                                } catch (e) {
                                    /* ignore */
                                }
                            }
                        };
                        resultCell.addEventListener('input', clearError);

                        // shake + focus the first missing field
                        if (idx === 0) {
                            resultCell.animate(
                                [
                                    { transform: 'translateX(0)' },
                                    { transform: 'translateX(-6px)' },
                                    { transform: 'translateX(6px)' },
                                    { transform: 'translateX(0)' },
                                ],
                                { duration: 300, iterations: 1 }
                            );
                            resultCell.focus();
                        }
                    });

                    console.log(
                        '%cVN Tag Team: Validation failed - missing required fields:',
                        'color:#d32f2f',
                        missing.map((m) => m.reqLabel)
                    );
                    return;
                }

                // Step 3: auto-fill "Pass" cho các field còn trống nhưng không thuộc nhóm auto-fill
                panelData.forEach((row) => {
                    const key = row.item.toLowerCase();
                    const val = row.result?.trim();
                    if (
                        !val &&
                        !/(summary|subsidiary|section|target\s*page)/i.test(key)
                    ) {
                        row.result = 'Pass';
                    }
                });

                console.log(
                    '%cVN Tag Team: Final panelData before simulate →',
                    'color:#388e3c',
                    panelData
                );
                // Save the final "Pass" values to the correct silo
                const currentKey = getStorageKey(
                    ticketKey,
                    window.vnTagTeam.lastBtnLabel
                );
                sessionStorage.setItem(currentKey, JSON.stringify(panelData));
                // Step 4: simulate click "More" > "Create sub-task"
                try {
                    simulateCreateSubTask();
                    const sourceLabel =
                        (window.vnTagTeam && window.vnTagTeam.lastBtnLabel) || 'SHOP';

                    // ⏳ delay nhẹ cho form Jira render
                    setTimeout(() => {
                        fillSubTaskSummary(sourceLabel);
                        fillSubTaskDescription();
                        fillSubTaskSubsidiary();
                    }, 2000);
                } catch (err) {
                    console.error('💥 Error while simulating Create sub-task:', err);
                }
                try {
                    sessionStorage.setItem(storageKey, JSON.stringify(panelData));
                } catch (e) {
                    console.error('Save failed', e);
                }
            });

            // console.log(
            // 	'%cVN Tag Team: Floating panel injected successfully.',
            // 	'color:#388e3c'
            // );
        };

        const enablePanelDrag = (panel) => {
            const header = panel.querySelector('.vn-panel-header');
            let offsetX,
                offsetY,
                dragging = false;
            header.addEventListener('mousedown', (e) => {
                dragging = true;
                offsetX = e.clientX - panel.offsetLeft;
                offsetY = e.clientY - panel.offsetTop;
            });
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                panel.style.left = e.clientX - offsetX + 'px';
                panel.style.top = e.clientY - offsetY + 'px';
                panel.style.right = 'auto';
            });
            document.addEventListener('mouseup', () => (dragging = false));
        };

        // ZONE 3: THE JIRA KEYBOARD GUARD (Your Kill Switch)
        // Wrapped in an IIFE to initialize once when the module loads
        (() => {
            if (window.__vnJiraKeyGuardInstalled) return;
            window.__vnJiraKeyGuardInstalled = true;

            const stopJiraStealing = (e) => {
                const active = document.activeElement;
                const isInsidePanel = active && active.closest('#vn-floating-panel');

                if (isInsidePanel) {
                    if (e.ctrlKey || e.metaKey || (e.key && e.key.startsWith('F'))) return;
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.debug('VN Tag Team: Jira shortcut intercepted:', e.key);
                }
            };

            ['keydown', 'keypress', 'keyup'].forEach((evt) => {
                window.addEventListener(evt, stopJiraStealing, true);
            });
        })();

        // ZONE 4: FORM FILLING & JIRA AUTOMATION
        // 1. The UI Generator: Creates the table rows inside your panel
        const renderChecklist = (rows, btnLabel) => {
            const body = document.querySelector('#vn-checklist-table');
            if (!body) {
                console.error(
                    '%cVN Tag Team: renderChecklist -> table body not found',
                    'color:#d32f2f'
                );
                return;
            }

            if (!rows || typeof rows.forEach !== 'function') {
                console.error(
                    '%cVN Tag Team: renderChecklist -> invalid rows provided',
                    'color:#d32f2f',
                    rows
                );
                return;
            }

            body.innerHTML = '';
            const ticketKey =
                document.querySelector('#key-val')?.textContent?.trim() ||
                'unknown_ticket';
            // 💡 NEW: Use the specific key for AEM or SHOP
            const storageKey = getStorageKey(ticketKey, btnLabel);
            const savedRaw = sessionStorage.getItem(storageKey);
            const savedData = JSON.parse(savedRaw || '[]');

            // Sync the global panelData to this specific silo
            window.vnTagTeam.panelData = Array.isArray(savedData) ? savedData : [];
            const panelData = window.vnTagTeam.panelData;

            rows.forEach((r, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
    <td contenteditable="true">${r.checkpoint || ''}</td>
    <td contenteditable="true">${r.item}</td>
    <td contenteditable="true" class="rt-textarea-cell">${r.result || ''}</td>
  `;

                body.appendChild(tr);

                const checkpointCell = tr.children[0];
                const itemCell = tr.children[1];
                const resultCell = tr.children[2];

                // khôi phục dữ liệu cũ (nếu có)
                const savedRow = Array.isArray(savedData) ? savedData[index] || {} : {};

                // Prefer savedRow.itemHTML (keeps <span style="color...">)
                if (savedRow.itemHTML) {
                    itemCell.innerHTML = savedRow.itemHTML;
                } else if (r.item) {
                    // if no saved HTML, use template r.item (may contain span)
                    itemCell.innerHTML = r.item;
                } else if (savedRow.item) {
                    itemCell.textContent = savedRow.item;
                }

                if (savedRow.checkpoint)
                    checkpointCell.textContent = savedRow.checkpoint;
                if (savedRow.result) resultCell.textContent = savedRow.result;

                // tạo object lưu — lưu cả item (text) và itemHTML (for restoring markup)
                const rowData = {
                    checkpoint: checkpointCell.textContent.trim(),
                    item: itemCell.textContent.trim(),
                    itemHTML: itemCell.innerHTML, // <--- store HTML
                    result: resultCell.textContent.trim(),
                };
                panelData.push(rowData);

                const cells = tr.querySelectorAll('td');

                cells.forEach((cell) => {
                    if (!cell.hasAttribute('tabindex'))
                        cell.setAttribute('tabindex', '0');

                    cell.addEventListener(
                        'keydown',
                        (e) => {
                            // 1. Stop propagation so Jira doesn't see the key
                            e.stopPropagation();
                            e.stopImmediatePropagation();

                            // 2. Handle the "Enter" key specifically if you are using Option 1 (multiline)
                            if (e.key === 'Enter') {
                                // If it's a single-line cell (checkpoint), maybe you want to blur or move focus?
                                // Otherwise, let it default to creating a newline.
                            }
                        },
                        true
                    );

                    cell.addEventListener(
                        'keydown',
                        (e) => {
                            // Khi đã focus trong panel thì đừng cho Jira leo lên
                            e.stopPropagation();
                        },
                        true // capture
                    );

                    cell.addEventListener('input', () => {
                        panelData[index].checkpoint = checkpointCell.textContent.trim();
                        panelData[index].item = itemCell.textContent.trim();
                        panelData[index].itemHTML = itemCell.innerHTML;
                        panelData[index].result = resultCell.innerText;

                        // 💡 NEW: Save to the specific silo
                        const storageKey = getStorageKey(ticketKey, btnLabel);
                        sessionStorage.setItem(storageKey, JSON.stringify(panelData));
                    });
                });
            });

            // console.log(
            // 	'%cVN Tag Team: renderChecklist restored session data:',
            // 	'color:#388e3c',
            // 	panelData
            // );
        };

        // 2. The Logic Mapper: Maps your checklist data to Jira fields
        const autoFill = (btnLabel) => {
            const summary =
                document.querySelector('#summary-val h2')?.textContent?.trim() || '';
            const subsidiary =
                document.querySelector('#customfield_19102-val')?.textContent?.trim() ||
                '';
            const section = window.vnTagTeam?.lastBtnLabel || '';

            const descText =
                document.querySelector('#description-val')?.innerText || '';

            const rows = document.querySelectorAll('#vn-checklist-table tr');
            const ticketKey =
                document.querySelector('#key-val')?.textContent?.trim() ||
                'unknown_ticket';
            const storageKey = getStorageKey(ticketKey, btnLabel);

            rows.forEach((row, idx) => {
                const checkpoint = row.children[0].textContent.trim();
                const item = row.children[1].textContent.trim();
                const cell = row.children[2];
                let result = cell.textContent.trim();

                if (/summary/i.test(item) && summary) result = summary;
                if (/subsidiary/i.test(item) && subsidiary) result = subsidiary;
                if (/section/i.test(item) && section) result = section;

                cell.textContent = result;

                // Ghi thẳng vào panelData mảng
                panelData[idx] = {
                    checkpoint,
                    item,
                    result,
                };
            });

            // Regex for AEM (Excludes URLs starting with 'shop')
            // This looks for samsung.com but ensures 'shop.' is not right before it.

            // ===== Regex for AEM URLs  =====
            if (/aem/i.test(btnLabel || '') && descText) {
                // 1. Updated prefix to include [ and (
                // 2. We allow samsung.com to have an optional trailing slash or content
                const aemRegex = /(?:^|\s|[\[\(])((?:https?:\/\/)?(?:www\.)?(?!shop\.samsung|samsung\.shop)samsung\.com\/[^\s)\]]*)/gi;

                let matches = [];
                let match;

                while ((match = aemRegex.exec(descText)) !== null) {
                    // match[1] captures the URL. We strip brackets in case they were included.
                    matches.push(match[1].replace(/[\[\]]/g, '').trim());
                }

                matches = [...new Set(matches)];

                if (matches.length) {
                    for (const row of rows) {
                        const label = row.children[1]?.textContent.toLowerCase();
                        if (/target\s*page/i.test(label)) {
                            const joined = matches.join('\n');
                            row.children[2].textContent = joined;

                            const idx = [...rows].indexOf(row);
                            // Ensure we are updating the correct data object
                            if (window.vnTagTeam.panelData[idx]) {
                                window.vnTagTeam.panelData[idx].result = joined;
                            }

                            try {
                                sessionStorage.setItem(
                                    storageKey,
                                    JSON.stringify(window.vnTagTeam.panelData)
                                );
                            } catch (e) {
                                console.warn('VN Tag Team: Failed to save to ' + storageKey, e);
                            }
                            break;
                        }
                    }
                }
            }

            // ===== Regex for SHOP URLs  =====
            if (/shop/i.test(btnLabel || '') && descText) {
                const shopRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:shop\.samsung\.com|samsung\.shop)[^\s)\]]*/gi;

                const rawMatches = descText.match(shopRegex) || [];
                const matches = [...new Set(rawMatches)].map(
                    (url) => url.replace(/[\[\]]/g, '').trim()
                );

                if (matches.length) {
                    for (const row of rows) {
                        const label = row.children[1]?.textContent.toLowerCase();
                        if (/target\s*page/i.test(label)) {
                            const joined = matches.join('\n');
                            row.children[2].textContent = joined;

                            const idx = [...rows].indexOf(row);
                            // Keeping consistency with your object structure
                            window.vnTagTeam.panelData[idx] = {
                                checkpoint: row.children[0].textContent.trim(),
                                item: row.children[1].textContent.trim(),
                                result: joined,
                            };

                            sessionStorage.setItem(
                                storageKey,
                                JSON.stringify(window.vnTagTeam.panelData)
                            );
                            break;
                        }
                    }
                }
            }
            // ✅ Save panelData state after autofill
            try {
                sessionStorage.setItem(
                    `vnTagTeam_${ticketKey}`,
                    JSON.stringify(panelData)
                );
                // console.log(
                // 	'%cVN Tag Team: autoFill completed & saved to sessionStorage',
                // 	'color:#388e3c',
                // 	panelData
                // );
            } catch (e) {
                console.warn('VN Tag Team: Failed to save sessionStorage', e);
            }
        };

        // 3. The Automation Trigger: Clicks the Jira buttons for the user
        const simulateCreateSubTask = () => {
            try {
                // console.log(
                // 	'%cVN Tag Team: Phase 2 – Simulating Create sub-task...',
                // 	'color:#6a1b9a'
                // );

                const moreBtn = document.querySelector('#opsbar-operations_more');
                if (!moreBtn) {
                    // console.warn(
                    // 	'%cVN Tag Team: ⚠️ More button not found.',
                    // 	'color:#d32f2f'
                    // );
                    return;
                }

                // Step 1: click "More"
                moreBtn.click();
                // console.log('%cVN Tag Team: 📂 Clicked "More" button', 'color:#1976d2');

                // Step 2: wait for dropdown to render, then click "Create sub-task"
                setTimeout(() => {
                    const createSubTaskBtn = [
                        ...document.querySelectorAll('a, button'),
                    ].find(
                        (el) => el.textContent.trim().toLowerCase() === 'create sub-task'
                    );

                    if (createSubTaskBtn) {
                        createSubTaskBtn.click();
                        // console.log(
                        // 	'%cVN Tag Team: ✅ Clicked "Create sub-task"',
                        // 	'color:#388e3c'
                        // );
                    } else {
                        console.warn(
                            '%cVN Tag Team: ⚠️ "Create sub-task" not found after menu opened.',
                            'color:#d32f2f'
                        );
                    }
                }, 600); // nếu menu render chậm, có thể tăng lên 800ms
            } catch (err) {
                console.error(
                    '%cVN Tag Team: 💥 Error simulating Create sub-task:',
                    'color:#d32f2f',
                    err
                );
            }
        };

        // 4. The Field Fillers: Specifically for Summary, Description, Subsidiary

        const fillSubTaskSummary = (btnLabel) => {
            try {
                const sourceButtonLabel = btnLabel?.toUpperCase() || 'UNKNOWN';
                const keyValEl = document.querySelector('#key-val');
                const dynamicValue2 = keyValEl?.textContent?.trim() || 'UNKNOWN-TICKET';

                // console.log(
                // 	'%cVN Tag Team: Waiting for sub-task modal...',
                // 	'color:#1976d2'
                // );
                // console.log('🔍 Looking for #summary input...');

                let retries = 0;
                const waitForSummary = setInterval(() => {
                    retries++;

                    const summaryInput =
                        document.querySelector('#summary') ||
                        document.querySelector('input[name="summary"]') ||
                        document.querySelector('input#summary-field');

                    console.log(
                        `%c[Debug] Try #${retries}:`,
                        'color:#888',
                        summaryInput ? '✅ Found summary input' : '❌ Not yet'
                    );

                    if (summaryInput) {
                        clearInterval(waitForSummary);

                        const summaryText = `[${sourceButtonLabel} Section] Checking for [${dynamicValue2}]`;

                        // Focus để Jira nhận giá trị
                        summaryInput.focus();
                        summaryInput.value = summaryText;

                        // Trigger event để AUI/React detect
                        summaryInput.dispatchEvent(new Event('input', { bubbles: true }));
                        summaryInput.dispatchEvent(new Event('change', { bubbles: true }));

                        // console.log(
                        // 	'%c📝 VN Tag Team: Filled sub-task summary successfully!',
                        // 	'color:#388e3c',
                        // 	summaryText
                        // );
                        return;
                    }

                    // Sau 20 lần (6 giây) mà chưa tìm thấy thì stop
                    if (retries > 20) {
                        clearInterval(waitForSummary);
                        console.warn(
                            '%c⚠️ VN Tag Team: Could not find #summary after waiting ~6s',
                            'color:#d32f2f'
                        );
                    }
                }, 300);
            } catch (err) {
                console.error('💥 VN Tag Team: Error filling sub-task summary', err);
            }
        };

        const fillSubTaskDescription = () => {
            try {
                let retries = 0;
                const waitForIframe = setInterval(() => {
                    retries++;

                    const iframe = document.querySelector(
                        'iframe[id^="mce_"][id$="_ifr"]'
                    );
                    const textarea = document.querySelector('#description');

                    if (!iframe && !textarea) {
                        if (retries % 5 === 0)
                            console.log(`[Debug] Try #${retries}: iframe not ready`);
                        return;
                    }

                    clearInterval(waitForIframe);

                    // 1. Get Context: Which silo are we using?
                    const ticketKey =
                        document.querySelector('#key-val')?.textContent?.trim() ||
                        'unknown_ticket';
                    const lastBtnLabel = window.vnTagTeam?.lastBtnLabel || 'AEM';
                    const storageKey = getStorageKey(ticketKey, lastBtnLabel); // Use our helper

                    // 2. Fetch fresh data directly from the Silo
                    const savedRaw = sessionStorage.getItem(storageKey);
                    const panelData = JSON.parse(savedRaw || '[]');

                    if (!panelData || panelData.length === 0) {
                        console.warn(
                            'VN Tag Team: No data found in silo to fill description'
                        );
                        return;
                    }

                    // 3. Build HTML Table
                    let htmlTable = `
                <table style="border-collapse:collapse; width:100%; font-size:13px;" border="1">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:4px; width:20%;">Checkpoint</th>
                            <th style="padding:4px; width:40%;">Item</th>
                            <th style="padding:4px; width:40%;">Result</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

                    panelData.forEach((row) => {
                        // Strip HTML from item labels for a clean Jira table
                        const itemDisplay = (row.item || '').replace(/<[^>]*>/g, '').trim();

                        // Convert newlines (\n) into <p> tags for Jira's editor
                        const formattedResult =
                            (row.result || '')
                                .split(/\n/)
                                .filter((line) => line.trim() !== '')
                                .map((line) => `<p style="margin:0;">${line}</p>`)
                                .join('') || '-';

                        htmlTable += `
                    <tr>
                        <td style="padding:4px; vertical-align:top;">${row.checkpoint || '-'}</td>
                        <td style="padding:4px; vertical-align:top;">${itemDisplay}</td>
                        <td style="padding:4px; vertical-align:top;">${formattedResult}</td>
                    </tr>
                `;
                    });

                    htmlTable += '</tbody></table>';

                    // 4. Inject into Jira Editor
                    if (iframe?.contentDocument?.body) {
                        iframe.contentDocument.body.innerHTML = htmlTable;
                    } else if (textarea) {
                        textarea.value = htmlTable;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, 400);
            } catch (err) {
                console.error(
                    '💥 VN Tag Team: Error filling sub-task description',
                    err
                );
            }
        };

        const fillSubTaskSubsidiary = () => {
            try {
                // 1. Get Context: Which silo are we using?
                const ticketKey =
                    document.querySelector('#key-val')?.textContent?.trim() ||
                    'unknown_ticket';
                const lastBtnLabel = window.vnTagTeam?.lastBtnLabel || 'AEM';
                const storageKey = getStorageKey(ticketKey, lastBtnLabel); // Use our helper

                // 2. Fetch fresh data directly from the Silo
                const savedRaw = sessionStorage.getItem(storageKey);
                const panelData = JSON.parse(savedRaw || '[]');

                // 3. Find the Subsidiary row in the specific data
                const subsidiaryRow = panelData.find((r) =>
                    /subsidiary/i.test(r.item || '')
                );
                const subsidiaryValue = subsidiaryRow?.result?.trim();

                if (!subsidiaryValue) {
                    console.warn(
                        `VN Tag Team: No Subsidiary value found in ${storageKey}`
                    );
                    return;
                }

                console.log(
                    `%cVN Tag Team: Attempting to fill Subsidiary (${subsidiaryValue}) for ${lastBtnLabel}...`,
                    'color:#1976d2'
                );

                let retries = 0;
                const waitForSelect = setInterval(() => {
                    retries++;

                    // Standard Jira custom field ID for Subsidiary
                    const selectEl = document.querySelector('#customfield_19102');

                    if (!selectEl) {
                        if (retries % 5 === 0) {
                            console.log(
                                `[Debug] Try #${retries}: Subsidiary select not ready`
                            );
                        }
                        return;
                    }

                    // 4. Match the dropdown option
                    const option = [...selectEl.options].find(
                        (opt) =>
                            opt.text.trim().toUpperCase() === subsidiaryValue.toUpperCase()
                    );

                    if (!option) {
                        console.warn(
                            'VN Tag Team: Subsidiary option not found in dropdown →',
                            subsidiaryValue
                        );
                        clearInterval(waitForSelect);
                        return;
                    }

                    // 5. Select and Trigger Events
                    selectEl.value = option.value;

                    // Trigger events so Jira's UI recognizes the change
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    selectEl.dispatchEvent(new Event('input', { bubbles: true }));

                    console.log(
                        `%c✅ VN Tag Team: Auto-selected ${subsidiaryValue} for ${lastBtnLabel} Section`,
                        'color:#388e3c'
                    );

                    clearInterval(waitForSelect);
                }, 400);
            } catch (err) {
                console.error('💥 VN Tag Team: Error filling Subsidiary dropdown', err);
            }
        };

        // 5. The Main Handler: Ties everything above together

        const handleOpenFor = (btnLabel) => {
            try {
                const type =
                    document.querySelector('#type-val')?.textContent.trim() || '';
                const subIssueEl = document.querySelector('#customfield_22300-val');
                const subIssue = subIssueEl?.textContent.trim() || '';

                // ✅ get summary to detect GDPR
                const summary =
                    document.querySelector('#summary-val')?.textContent.trim() || '';

                let selectedChecklist = null;

                if (/new tag request/i.test(type)) {
                    selectedChecklist = 'New Tag Checklist';
                } else if (/3rd party tag request/i.test(type)) {
                    if (/date extension/i.test(subIssue)) {
                        selectedChecklist = 'Date Extension Rule Checklist';
                    } else if (/disable/i.test(subIssue)) {
                        selectedChecklist = 'Disable Rule Checklist';
                    } else {
                        // ✅ New / Update Rule logic
                        if (/gdpr/i.test(summary)) {
                            selectedChecklist = 'GDPR Checklist';
                        } else {
                            selectedChecklist = 'New/Update Rule Checklist';
                        }
                    }
                }

                if (!selectedChecklist) {
                    console.error(
                        '%cVN Tag Team: handleOpenFor -> No checklist selected',
                        'color: #d32f2f',
                        { type, subIssue }
                    );
                    return alert('Checklist not found.');
                }

                const rows = checklistTemplates[selectedChecklist];
                if (!rows || !Array.isArray(rows)) {
                    console.error(
                        '%cVN Tag Team: handleOpenFor -> checklist template missing or invalid',
                        'color: #d32f2f',
                        { selectedChecklist, rows }
                    );
                    return alert(
                        'Checklist template missing. Check console for details.'
                    );
                }

                console.log(
                    '%cVN Tag Team: Opening checklist ->',
                    'color: #1976d2',
                    selectedChecklist
                );

                renderChecklist(rows, btnLabel);
                document.querySelector('.vn-panel-title').innerHTML = selectedChecklist;

                // ✅ Lưu context của nút hiện tại
                window.vnTagTeam.lastBtnLabel = btnLabel;
                sessionStorage.setItem(`vnTagTeam_section_${ticketKey}`, btnLabel);

                const panelEl = document.querySelector('#vn-floating-panel');
                panelEl.classList.remove('hidden');

                autoFill(btnLabel);

                console.log(
                    '%cVN Tag Team: after autoFill panelData ->',
                    'color:#388e3c',
                    panelData
                );

                console.log(
                    '%cVN Tag Team: sessionStorage raw ->',
                    'color:#388e3c',
                    sessionStorage.getItem(`vnTagTeam_${ticketKey}`)
                );

                // ✅ Save again after autofill to persist immediately
                const storageKey = getStorageKey(ticketKey, btnLabel);
                sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(window.vnTagTeam.panelData)
                );
            } catch (err) {
                console.error(
                    '%cVN Tag Team: handleOpenFor error',
                    'color: #d32f2f',
                    err
                );
            }
        };

        // ZONE 5: INITIALIZATION (Watchers)
        // ======================================

        // Wait for the main Jira toolbar to exist before trying to inject buttons
        waitForElement('.aui-toolbar2-primary', (toolbar) => {

            // Safety check: Don't inject twice
            if (document.querySelector('#vn-checklist-btn-aem')) return;

            const typeEl = document.querySelector('#type-val');
            const sectionEl = document.querySelector('#customfield_19101-val');

            // Check if we are on a valid ticket type
            if (!typeEl || !sectionEl) return;

            const rawType = typeEl.textContent.trim();
            const rawSection = sectionEl.textContent.trim();
            const allowedTypes = ['3rd party Tag Request', 'New Tag Request'];

            const isAllowed = allowedTypes.some(t =>
                rawType.toLowerCase().includes(t.toLowerCase())
            );

            if (isAllowed) {
                // 1. Inject UI
                if (/AEM|Both/i.test(rawSection)) {
                    toolbar.appendChild(createButton('vn-checklist-btn-aem', 'AEM'));
                }
                if (/Shop|Both/i.test(rawSection)) {
                    toolbar.appendChild(createButton('vn-checklist-btn-shop', 'SHOP'));
                }

                injectPanel();

                // 2. Setup Panel Events
                const panel = document.querySelector('#vn-floating-panel');
                if (panel) {
                    panel.querySelector('.vn-panel-close').onclick = () => panel.classList.add('hidden');
                    enablePanelDrag(panel);
                }

                // 3. Setup Button Listeners
                document.querySelector('#vn-checklist-btn-aem')?.addEventListener('click', () => handleOpenFor('AEM'));
                document.querySelector('#vn-checklist-btn-shop')?.addEventListener('click', () => handleOpenFor('SHOP'));

                console.log('%cVN Tag Team: AEM/SHOP Buttons Ready', 'color:#1976d2');
            }
        });

    } catch (e) {
        console.error('VN Tag Team: AEM/SHOP Module Critical Error', e);
    }
}