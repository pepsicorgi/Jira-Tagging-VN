import { waitForElement } from '../utils/domWatcher.js';

export function initCommentFeature() {
    console.log('📝 Comment Feature Loading...');
    waitForElement('#issue-comment-add', (container) => {
        try {
           console.log('Testing Comment Feature')
        } catch (error) {
            console.error('❌ Comment Feature Error:', error);
        }
    });
}