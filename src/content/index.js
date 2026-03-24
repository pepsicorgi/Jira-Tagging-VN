(async () => {
    // 1. Get URLs for all features
    const srcComment = chrome.runtime.getURL('src/content/commentTemplate.js');
    const srcAemShop = chrome.runtime.getURL('src/content/aemShopButtons.js');
    const srcCapture = chrome.runtime.getURL('src/content/templateCapture.js'); // New file

    // 2. Import them dynamically
    const { initCommentFeature } = await import(srcComment);
    const { initAemShopFeature } = await import(srcAemShop);
    const { initCaptureFlow } = await import(srcCapture);

    // 3. Initialize Features
    initCommentFeature(); // This handles the "Templates" dropdown
    initAemShopFeature(); // This handles your AEM/SHOP buttons

    console.log('🚀 VN Tag Team: All Modules (Template, Capture, AEM/SHOP) Active');
})();