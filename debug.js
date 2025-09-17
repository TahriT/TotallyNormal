// Debug utility to check texture generator status
function checkStatus() {
    console.log('=== TotallyNormal Debug Status ===');
    console.log('🎯 Processing mode:', 'Pure JavaScript');
    console.log('🎨 Texture generator ready:', !!window.textureGenerator);
    console.log('📦 Version:', window.textureGenerator?.version);
    
    if (window.textureGenerator) {
        console.log('� Debug mode:', window.textureGenerator.debugMode);
        console.log('⚡ Processing ready:', true);
    }
    
    const statusEl = document.getElementById('processingStatus');
    if (statusEl) {
        console.log('📋 Status element content:', statusEl.innerHTML);
        console.log('🎯 Status element class:', statusEl.className);
    }
    
    console.log('=== End Debug Status ===');
}

// Add to global scope for easy debugging
window.checkStatus = checkStatus;

// Auto-check status after 5 seconds
setTimeout(() => {
    console.log('🕐 Auto-checking status after 5 seconds...');
    checkStatus();
}, 5000);
