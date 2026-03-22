// src/utils/domWatcher.js

/**
 * High-performance watcher for Jira's dynamic UI
 * @param {string} selector - The element to wait for
 * @param {function} callback - Function to run when found
 */
export const waitForElement = (selector, callback) => {
    // 1. Check if it's already there (fast path)
    const existingEl = document.querySelector(selector);
    if (existingEl) {
        callback(existingEl);
        return;
    }

    // 2. Otherwise, watch for it to appear
    const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
            obs.disconnect(); // Stop watching once found
            callback(el);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};