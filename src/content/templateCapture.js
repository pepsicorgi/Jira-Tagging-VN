import { getVNCrData, saveVNCrData } from '../utils/storage.js';

/**
 * Main function to trigger the Template Capture Flow
 */
export async function initCaptureFlow() {
    const iframe = document.querySelector('#mce_0_ifr');
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;

    let rawContent = "";

    if (doc && doc.body) {
        // If the body has actual tags, use our new cleaner
        if (doc.body.children.length > 0 || doc.body.innerHTML.includes('<br>')) {
            rawContent = cleanJiraHtmlForStorage(doc.body.innerHTML);
        } else {
            // Fallback for simple text
            rawContent = doc.body.innerText || doc.body.textContent;
        }
    } else {
        const textarea = document.querySelector('#comment');
        rawContent = textarea ? textarea.value : "";
    }

    if (!rawContent || rawContent.trim() === "") {
        alert("⚠️ Please write your template in the Jira comment box first!");
        return;
    }

    showSaveModal(rawContent);
}

/**
 * Converts Jira's live HTML (with blue links) back into our generic tags
 */
function cleanJiraHtmlForStorage(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Handle Mentions (Keep this)
    tempDiv.querySelectorAll('.user-hover').forEach(link => {
        const rel = link.getAttribute('rel');
        link.replaceWith(rel === 'tagging.d2c@samsung.com' ? '[[@D2C]]' : '[[@Reporter]]');
    });

    // 2. FORCE DOUBLE NEWLINES ON PARAGRAPHS
    // Since the log shows <p>Line</p><p>Line</p>, we turn every </p> into \n\n
    tempDiv.querySelectorAll('p, div').forEach(block => {
        // If the block is NOT the last one, add double newlines
        // If it is the last one, just a single newline is fine
        if (block.nextSibling) {
            block.after('\n\n');
        } else {
            block.after('\n');
        }
    });

    // 3. Handle explicit <br> tags
    tempDiv.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

    // 4. Extract and Clean
    let text = tempDiv.textContent;

    // Final Cleanup: 
    // - Replace 3+ newlines with exactly 2 to prevent "runaway" white space
    // - Trim start/end
    return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Displays the UI to select Name, Tab, and Category
 */
async function showSaveModal(content) {
    const data = await getVNCrData();
    const tabs = Object.keys(data);

    // Create Modal Element
    const modal = document.createElement('div');
    modal.id = 'vn-cr-save-modal';
    modal.innerHTML = `
    <div class="vn-cr-modal-content">
        <div class="vn-cr-modal-header">
            <h3>Save New Template</h3>
            <span class="vn-cr-modal-close">×</span>
        </div>
        <div class="vn-cr-modal-form">
            <div class="vn-form-group">
                <label>Template Name</label>
                <input type="text" id="modal-name" placeholder="e.g., Developer Access Request">
            </div>
            
            <div class="vn-form-group">
                <label>Save to Tab</label>
                <select id="modal-tab">
                    ${tabs.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>

            <div id="modal-cat-section" class="vn-form-group">
                <label>Label (Optional)</label>
                <input type="text" id="modal-category" placeholder="e.g., GA, AA, On hold...">
            </div>
        </div>

        <div class="vn-cr-modal-actions">
            <button id="modal-cancel" class="vn-cr-btn-secondary">Cancel</button>
            <button id="modal-save" class="vn-cr-btn-primary">Save Template</button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    // --- DOM Logic ---
    const tabSelect = modal.querySelector('#modal-tab');
    const catSection = modal.querySelector('#modal-cat-section');
    const nameInput = modal.querySelector('#modal-name');

    // Focus the name input automatically
    nameInput.focus();

    // --- Button Actions ---

    // Close Modal
    const closeModal = () => modal.remove();
    modal.querySelector('.vn-cr-modal-close').onclick = closeModal;
    modal.querySelector('#modal-cancel').onclick = closeModal;

    // Save Logic
    modal.querySelector('#modal-save').onclick = async () => {
    const name = nameInput.value.trim();
    const category = modal.querySelector('#modal-category').value.trim(); // Get the value

    if (!name) {
        nameInput.style.borderColor = 'red';
        return;
    }

    const newEntry = {
        id: `custom-${Date.now()}`,
        name: name,
        category: category || null, // Store it!
        value: content
    };

    const targetTab = modal.querySelector('#modal-tab').value;
    data[targetTab].push(newEntry);
    
    await saveVNCrData(data);
    
    // Optional: showSuccessToast("✅ Template Saved!");
    modal.remove();
    window.dispatchEvent(new CustomEvent('vnCrDataUpdated'));
};

    // Close on background click
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}