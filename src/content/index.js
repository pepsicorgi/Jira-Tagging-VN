(async () => {
    // We use dynamic imports to load our modules in the content script context
    const src1 = chrome.runtime.getURL('src/content/commentTemplate.js');
    const src2 = chrome.runtime.getURL('src/content/aemShopButtons.js');

    const { initCommentFeature } = await import(src1);
    const { initAemShopFeature } = await import(src2);

    // Run them!
    initCommentFeature();
    initAemShopFeature();

    console.log('🚀 VN Tag Team: System Modularized & Active');
})();