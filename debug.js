// Debug utility to check texture generator status
function checkStatus() {
    console.log('=== TotallyNormal Debug Status ===');
    console.log('🎯 Processing mode:', 'Pure JavaScript');
    console.log('🎨 Texture generator ready:', !!window.textureGenerator);
    console.log('📦 Version:', window.textureGenerator?.version);
    
    if (window.textureGenerator) {
        console.log('🔍 Debug mode:', window.textureGenerator.debugMode);
        console.log('⚡ Processing ready:', true);
    }
    
    const statusEl = document.getElementById('processingStatus');
    if (statusEl) {
        console.log('📋 Status element content:', statusEl.innerHTML);
        console.log('🎯 Status element class:', statusEl.className);
    }
    
    console.log('=== End Debug Status ===');
}

// Enhanced debug function for image processing
function debugImageProcessing(sourceImage) {
    console.log('🖼️ DEBUG: Image Processing Analysis');
    console.log('- Source image:', sourceImage);
    
    if (sourceImage instanceof HTMLImageElement) {
        console.log('- Image dimensions:', sourceImage.width, 'x', sourceImage.height);
        console.log('- Image src length:', sourceImage.src?.length || 'No src');
        console.log('- Image complete:', sourceImage.complete);
        console.log('- Image naturalWidth:', sourceImage.naturalWidth);
        console.log('- Image naturalHeight:', sourceImage.naturalHeight);
    }
    
    if (sourceImage instanceof HTMLCanvasElement) {
        console.log('- Canvas dimensions:', sourceImage.width, 'x', sourceImage.height);
        const ctx = sourceImage.getContext('2d');
        if (ctx) {
            const imageData = ctx.getImageData(0, 0, Math.min(10, sourceImage.width), Math.min(10, sourceImage.height));
            console.log('- Canvas has data:', imageData.data.length > 0);
            console.log('- Sample pixel data:', Array.from(imageData.data.slice(0, 12)));
        }
    }
}

// Debug function for material viewer
function debugMaterialViewer() {
    console.log('🎨 DEBUG: Material Viewer Status');
    
    if (window.materialViewer) {
        console.log('- Material viewer exists:', true);
        console.log('- Current material:', window.materialViewer.currentMaterial);
        
        // Check Three.js materials
        const scene = window.materialViewer.scene;
        if (scene) {
            const mesh = scene.children.find(child => child.isMesh);
            if (mesh && mesh.material) {
                console.log('- Mesh material type:', mesh.material.type);
                console.log('- Material maps:');
                ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(mapType => {
                    const map = mesh.material[mapType];
                    if (map) {
                        console.log(`  - ${mapType}:`, map.image?.src?.substring(0, 50) + '...' || 'No image');
                    } else {
                        console.log(`  - ${mapType}: null`);
                    }
                });
            }
        }
    } else {
        console.log('- Material viewer exists:', false);
    }
}

// Debug function for texture generation
function debugTextureGeneration(baseImageData) {
    console.log('⚙️ DEBUG: Texture Generation');
    
    if (baseImageData) {
        console.log('- Base ImageData dimensions:', baseImageData.width, 'x', baseImageData.height);
        console.log('- Base ImageData length:', baseImageData.data.length);
        console.log('- First 12 pixels:', Array.from(baseImageData.data.slice(0, 12)));
        
        // Check for completely black or white images
        const data = baseImageData.data;
        let allBlack = true;
        let allWhite = true;
        let allSame = true;
        let allTransparent = true;
        const firstPixel = data[0];
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (r !== 0 || g !== 0 || b !== 0) allBlack = false;
            if (r !== 255 || g !== 255 || b !== 255) allWhite = false;
            if (r !== firstPixel) allSame = false;
            if (a !== 0) allTransparent = false;
        }
        
        console.log('- Image analysis:', {
            allBlack,
            allWhite,
            allTransparent,
            allSame: allSame && !allBlack && !allWhite,
            firstPixelValue: firstPixel,
            averageAlpha: data.filter((_, i) => i % 4 === 3).reduce((sum, a) => sum + a, 0) / (data.length / 4)
        });
        
        // Check if image data is empty/corrupted
        if (allBlack) {
            console.error('🚨 ISSUE: Image data is completely black - possible canvas/drawing issue');
        }
        if (allTransparent) {
            console.error('🚨 ISSUE: Image data is completely transparent - possible alpha channel issue');
        }
        if (data.length === 0) {
            console.error('🚨 ISSUE: Image data is completely empty - no pixel data');
        }
    } else {
        console.error('🚨 ISSUE: Base ImageData is null or undefined');
    }
}

// Add to global scope for easy debugging
window.checkStatus = checkStatus;
window.debugImageProcessing = debugImageProcessing;
window.debugMaterialViewer = debugMaterialViewer;
window.debugTextureGeneration = debugTextureGeneration;

// Comprehensive debug function to run all checks
function runFullDebug() {
    console.log('🔍 === RUNNING FULL DEBUG ANALYSIS ===');
    checkStatus();
    debugMaterialViewer();
    
    // Try to debug the current material if available
    if (window.app && window.app.currentMaterial) {
        console.log('🎯 Debugging current material...');
        console.log('Current material:', window.app.currentMaterial);
    } else {
        console.log('⚠️ No current material found');
    }
    
    console.log('🔍 === DEBUG ANALYSIS COMPLETE ===');
}

// Debug function to test image upload pipeline
function debugImageUpload() {
    console.log('🧪 DEBUG: Testing Image Upload Pipeline');
    
    const fileInput = document.getElementById('imageUpload');
    if (!fileInput) {
        console.error('🚨 ISSUE: Image upload input not found');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        console.log('⚠️ No file selected in upload input');
        return;
    }
    
    const file = fileInput.files[0];
    console.log('📁 Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    });
    
    // Create test image element
    const testImg = new Image();
    testImg.onload = function() {
        console.log('🖼️ Image loaded successfully:', {
            width: testImg.width,
            height: testImg.height,
            complete: testImg.complete,
            naturalWidth: testImg.naturalWidth,
            naturalHeight: testImg.naturalHeight
        });
        
        // Test canvas drawing
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        testCanvas.width = 256;
        testCanvas.height = 256;
        
        try {
            testCtx.drawImage(testImg, 0, 0, 256, 256);
            const testImageData = testCtx.getImageData(0, 0, 256, 256);
            console.log('✅ Test canvas draw successful:', {
                dataLength: testImageData.data.length,
                firstPixels: Array.from(testImageData.data.slice(0, 12))
            });
            
            // Check if test data is empty
            const isEmpty = testImageData.data.every(value => value === 0);
            if (isEmpty) {
                console.error('🚨 ISSUE: Test canvas data is completely empty/black');
            }
        } catch (error) {
            console.error('🚨 ISSUE: Failed to draw to test canvas:', error);
        }
    };
    
    testImg.onerror = function() {
        console.error('🚨 ISSUE: Failed to load test image');
    };
    
    // Load the image
    const reader = new FileReader();
    reader.onload = function(e) {
        testImg.src = e.target.result;
    };
    reader.onerror = function() {
        console.error('🚨 ISSUE: Failed to read file');
    };
    reader.readAsDataURL(file);
}

// Debug function to toggle tiling for testing
function toggleTiling(enable = null) {
    // This is a test function to see if tiling is the issue
    console.log('🔧 DEBUG: Toggling tiling for testing...');
    
    // Find all files that might control tiling
    if (enable === null) {
        console.log('📋 Current tiling status in code:');
        console.log('- Check app.js line ~917 for enableTiling setting');
        console.log('- Use toggleTiling(false) to disable, toggleTiling(true) to enable');
        return;
    }
    
    console.log(`${enable ? '✅' : '❌'} Note: Tiling ${enable ? 'enabled' : 'disabled'} - you may need to modify app.js manually`);
    console.log('- Current setting affects new material generation');
    console.log('- Reload page after changing enableTiling in app.js');
}

window.toggleTiling = toggleTiling;

// Auto-check status after 5 seconds
setTimeout(() => {
    console.log('🕐 Auto-checking status after 5 seconds...');
    checkStatus();
}, 5000);

// Log available debug functions
console.log('🛠️ Debug functions available:');
console.log('- checkStatus() - Check app status');
console.log('- debugImageProcessing(image) - Debug image processing');
console.log('- debugMaterialViewer() - Check material viewer');
console.log('- debugTextureGeneration(imageData) - Debug texture gen');
console.log('- debugImageUpload() - Test image upload pipeline');
console.log('- toggleTiling(true/false) - Check/toggle tiling status');
console.log('- runFullDebug() - Run comprehensive debug analysis');
