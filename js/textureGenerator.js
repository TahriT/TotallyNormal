class PBRTextureGenerator {
    constructor() {
        this.version = '1.3.3'; // Version tracking
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // Debug logging
        this.debugMode = true;
        
        console.log(`✓ TextureGenerator v${this.version} initialized (Frontend-only)`);
        
        this.initializeFrontendMode();
    }

    initializeFrontendMode() {
        console.log('🔧 Frontend-only mode initialized');
        
        const statusEl = document.getElementById('processingStatus');
        if (statusEl) {
            statusEl.innerHTML = '⚡ Frontend processing ready - JavaScript algorithms enabled';
            statusEl.className = 'processing-status loaded';
        }
    }

    async generatePBRTextures(image, resolution = 512, edgeDetection = 'sobel') {
        // Prevent simultaneous generation calls
        if (this._isGenerating) {
            const error = new Error('Texture generation already in progress');
            console.error('❌ Generation in progress:', error.stack);
            throw error;
        }
        
        this._isGenerating = true;
        console.log(`🚀 Starting PBR texture generation (${resolution}x${resolution}, ${edgeDetection} edges)`);
        
        try {
            const result = await this.generateTexturesFallback(image, resolution, edgeDetection);
            this._isGenerating = false;
            return result;
        } catch (error) {
            console.error('❌ Texture generation failed:', error);
            this._isGenerating = false;
            throw new Error(`Failed to generate PBR textures: ${error.message}`);
        }
    }

    async generateTexturesFallback(image, resolution = 512, edgeDetection = 'sobel') {
        console.log(`🔧 Using JavaScript algorithms (${resolution}x${resolution}, ${edgeDetection} edge detection)`);
        
        // Use the provided resolution
        const targetSize = resolution;
        
        console.log(`📐 Processing ${targetSize}x${targetSize} image`);

        this.canvas.width = targetSize;
        this.canvas.height = targetSize;
        this.offscreenCanvas.width = targetSize;
        this.offscreenCanvas.height = targetSize;

        // Scale and crop image to square
        const sourceSize = Math.min(image.width, image.height);
        const offsetX = (image.width - sourceSize) / 2;
        const offsetY = (image.height - sourceSize) / 2;

        this.ctx.drawImage(
            image,
            offsetX, offsetY, sourceSize, sourceSize,
            0, 0, targetSize, targetSize
        );

        const baseImageData = this.ctx.getImageData(0, 0, targetSize, targetSize);

        // Generate all textures
        console.log('🎨 Generating texture maps...');
        
        const textures = {};
        
        // Albedo (base color)
        textures.albedo = this.generateAlbedoFallback(baseImageData);
        console.log('✅ Albedo generated');
        
        // Height map
        textures.height = this.generateHeightFallback(baseImageData);
        console.log('✅ Height map generated');
        
        // Normal map (with selected edge detection algorithm)
        textures.normal = this.generateNormalFallback(baseImageData, edgeDetection);
        console.log(`✅ Normal map generated using ${edgeDetection} edge detection`);
        
        // Metallic map
        textures.metallic = this.generateMetallicFallback(baseImageData);
        console.log('✅ Metallic map generated');
        
        // Roughness map
        textures.roughness = this.generateRoughnessFallback(baseImageData);
        console.log('✅ Roughness map generated');
        
        // Ambient Occlusion
        textures.occlusion = this.generateOcclusionFallback(baseImageData);
        console.log('✅ Occlusion map generated');

        console.log('🎉 All PBR textures generated successfully');
        return textures;
    }

    generateAlbedoFallback(imageData) {
        // Albedo is essentially the cleaned up base color
        const outputData = new ImageData(imageData.width, imageData.height);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            let r = imageData.data[i];
            let g = imageData.data[i + 1];
            let b = imageData.data[i + 2];
            
            // Slightly enhance saturation for better albedo
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (delta > 0) {
                const enhancement = 1.1;
                const avg = (r + g + b) / 3;
                r = Math.min(255, avg + (r - avg) * enhancement);
                g = Math.min(255, avg + (g - avg) * enhancement);
                b = Math.min(255, avg + (b - avg) * enhancement);
            }
            
            outputData.data[i] = Math.max(0, Math.min(255, r));
            outputData.data[i + 1] = Math.max(0, Math.min(255, g));
            outputData.data[i + 2] = Math.max(0, Math.min(255, b));
            outputData.data[i + 3] = 255;
        }
        
        return this.imageDataToDataUrl(outputData);
    }

    generateHeightFallback(imageData) {
        console.log('🏔️ Generating height map with optimized processing...');
        
        const width = imageData.width;
        const height = imageData.height;
        const outputData = new ImageData(width, height);
        
        // Convert to grayscale using proper luminance formula
        const grayscale = new Array(width * height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            // Improved luminance calculation
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayscale[i / 4] = gray;
        }
        
        // Apply enhancement without using spread operator (to avoid stack overflow)
        const enhanced = new Array(width * height);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                
                // Calculate local contrast
                const neighbors = [
                    grayscale[idx - width - 1], grayscale[idx - width], grayscale[idx - width + 1],
                    grayscale[idx - 1], grayscale[idx], grayscale[idx + 1],
                    grayscale[idx + width - 1], grayscale[idx + width], grayscale[idx + width + 1]
                ];
                
                // Find min/max efficiently
                let min = neighbors[0];
                let max = neighbors[0];
                for (let i = 1; i < neighbors.length; i++) {
                    if (neighbors[i] < min) min = neighbors[i];
                    if (neighbors[i] > max) max = neighbors[i];
                }
                
                const center = grayscale[idx];
                const range = max - min;
                
                // Enhance based on local contrast
                let enhanced_value = center;
                if (range > 10) { // Only enhance if there's significant local variation
                    const factor = 1.2;
                    enhanced_value = center + (center - (min + max) / 2) * factor;
                }
                
                enhanced[idx] = Math.max(0, Math.min(255, enhanced_value));
            }
        }
        
        // Fill borders
        for (let x = 0; x < width; x++) {
            enhanced[x] = enhanced[width + x]; // Top
            enhanced[(height - 1) * width + x] = enhanced[(height - 2) * width + x]; // Bottom
        }
        for (let y = 0; y < height; y++) {
            enhanced[y * width] = enhanced[y * width + 1]; // Left
            enhanced[y * width + width - 1] = enhanced[y * width + width - 2]; // Right
        }
        
        // Convert back to ImageData
        for (let i = 0; i < enhanced.length; i++) {
            const value = enhanced[i];
            const pixelIndex = i * 4;
            outputData.data[pixelIndex] = value;
            outputData.data[pixelIndex + 1] = value;
            outputData.data[pixelIndex + 2] = value;
            outputData.data[pixelIndex + 3] = 255;
        }
        
        console.log('✅ Height map processing complete');
        return this.imageDataToDataUrl(outputData);
    }

    generateNormalFallback(imageData, edgeDetection = 'sobel') {
        console.log(`🗺️ Generating normal map with ${edgeDetection} edge detection...`);
        
        const width = imageData.width;
        const height = imageData.height;
        const outputData = new ImageData(width, height);
        
        // Convert to grayscale first with improved luminance
        const heightMap = new Array(width * height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            // Better luminance conversion
            const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0; // Normalize to 0-1
            heightMap[i / 4] = gray;
        }
        
        // Calculate normals with selected edge detection algorithm
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                // Sample neighbors with boundary handling
                const getHeight = (px, py) => {
                    px = Math.max(0, Math.min(width - 1, px));
                    py = Math.max(0, Math.min(height - 1, py));
                    return heightMap[py * width + px];
                };
                
                let dx = 0, dy = 0;
                
                // Apply different edge detection algorithms
                switch (edgeDetection) {
                    case 'scharr':
                        ({ dx, dy } = this.calculateScharrGradient(getHeight, x, y));
                        break;
                    case 'prewitt':
                        ({ dx, dy } = this.calculatePrewittGradient(getHeight, x, y));
                        break;
                    case 'roberts':
                        ({ dx, dy } = this.calculateRobertsGradient(getHeight, x, y));
                        break;
                    case 'laplacian':
                        ({ dx, dy } = this.calculateLaplacianGradient(getHeight, x, y));
                        break;
                    case 'sobel':
                    default:
                        ({ dx, dy } = this.calculateSobelGradient(getHeight, x, y));
                        break;
                }
                
                // Calculate normal vector
                const strength = 2.0; // Normal map strength
                const nx = -dx * strength;
                const ny = -dy * strength;
                const nz = 1.0;
                
                // Normalize the vector
                const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
                const normalizedX = nx / length;
                const normalizedY = ny / length;
                const normalizedZ = nz / length;
                
                // Convert to 0-255 range (standard normal map encoding)
                const r = Math.round((normalizedX * 0.5 + 0.5) * 255);
                const g = Math.round((normalizedY * 0.5 + 0.5) * 255);
                const b = Math.round((normalizedZ * 0.5 + 0.5) * 255);
                
                const pixelIndex = idx * 4;
                outputData.data[pixelIndex] = Math.max(0, Math.min(255, r));
                outputData.data[pixelIndex + 1] = Math.max(0, Math.min(255, g));
                outputData.data[pixelIndex + 2] = Math.max(0, Math.min(255, b));
                outputData.data[pixelIndex + 3] = 255;
            }
        }
        
        // Validate normal map quality
        let blueSum = 0;
        for (let i = 2; i < outputData.data.length; i += 4) {
            blueSum += outputData.data[i];
        }
        const avgBlue = blueSum / (width * height);
        console.log(`📊 Normal map stats (${edgeDetection}): Average blue channel = ${avgBlue.toFixed(1)} (should be >128 for good quality)`);
        
        console.log(`✅ Normal map generation complete using ${edgeDetection} edge detection`);
        return this.imageDataToDataUrl(outputData);
    }

    // Edge Detection Algorithm Methods
    calculateSobelGradient(getHeight, x, y) {
        // Standard Sobel operators
        const tl = getHeight(x - 1, y - 1); const tc = getHeight(x, y - 1); const tr = getHeight(x + 1, y - 1);
        const ml = getHeight(x - 1, y);     /* center */                   const mr = getHeight(x + 1, y);
        const bl = getHeight(x - 1, y + 1); const bc = getHeight(x, y + 1); const br = getHeight(x + 1, y + 1);
        
        // Sobel X gradient
        const dx = (-1 * tl + 1 * tr +
                   -2 * ml + 2 * mr +
                   -1 * bl + 1 * br) / 8.0;
        
        // Sobel Y gradient  
        const dy = (-1 * tl - 2 * tc - 1 * tr +
                    1 * bl + 2 * bc + 1 * br) / 8.0;
        
        return { dx, dy };
    }

    calculateScharrGradient(getHeight, x, y) {
        // Scharr operators (improved rotation invariance)
        const tl = getHeight(x - 1, y - 1); const tc = getHeight(x, y - 1); const tr = getHeight(x + 1, y - 1);
        const ml = getHeight(x - 1, y);     /* center */                   const mr = getHeight(x + 1, y);
        const bl = getHeight(x - 1, y + 1); const bc = getHeight(x, y + 1); const br = getHeight(x + 1, y + 1);
        
        // Scharr X gradient
        const dx = (-3 * tl + 3 * tr +
                   -10 * ml + 10 * mr +
                   -3 * bl + 3 * br) / 32.0;
        
        // Scharr Y gradient
        const dy = (-3 * tl - 10 * tc - 3 * tr +
                    3 * bl + 10 * bc + 3 * br) / 32.0;
        
        return { dx, dy };
    }

    calculatePrewittGradient(getHeight, x, y) {
        // Prewitt operators (simple and fast)
        const tl = getHeight(x - 1, y - 1); const tc = getHeight(x, y - 1); const tr = getHeight(x + 1, y - 1);
        const ml = getHeight(x - 1, y);     /* center */                   const mr = getHeight(x + 1, y);
        const bl = getHeight(x - 1, y + 1); const bc = getHeight(x, y + 1); const br = getHeight(x + 1, y + 1);
        
        // Prewitt X gradient
        const dx = (-1 * tl + 1 * tr +
                   -1 * ml + 1 * mr +
                   -1 * bl + 1 * br) / 6.0;
        
        // Prewitt Y gradient
        const dy = (-1 * tl - 1 * tc - 1 * tr +
                    1 * bl + 1 * bc + 1 * br) / 6.0;
        
        return { dx, dy };
    }

    calculateRobertsGradient(getHeight, x, y) {
        // Roberts Cross-Gradient (2x2 kernel)
        const center = getHeight(x, y);
        const right = getHeight(x + 1, y);
        const below = getHeight(x, y + 1);
        const diag = getHeight(x + 1, y + 1);
        
        // Roberts cross gradients
        const dx = (diag - center) / 2.0;
        const dy = (below - right) / 2.0;
        
        return { dx, dy };
    }

    calculateLaplacianGradient(getHeight, x, y) {
        // Laplacian edge detection (converted to gradient approximation)
        const center = getHeight(x, y);
        const top = getHeight(x, y - 1);
        const bottom = getHeight(x, y + 1);
        const left = getHeight(x - 1, y);
        const right = getHeight(x + 1, y);
        
        // Laplacian kernel approximated as gradients
        const laplacian = (4 * center - top - bottom - left - right);
        
        // Convert to directional gradients
        const dx = (right - left) / 2.0 + laplacian * 0.1;
        const dy = (bottom - top) / 2.0 + laplacian * 0.1;
        
        return { dx, dy };
    }

    generateMetallicFallback(imageData) {
        const outputData = new ImageData(imageData.width, imageData.height);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            
            // Calculate luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Calculate color saturation
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max * 255;
            
            // Metallic areas tend to have:
            // - Higher luminance
            // - Lower saturation (more neutral/gray)
            // - Specific color characteristics
            
            let metallic = 0;
            
            // Base metallic from luminance and inverse saturation
            if (luminance > 100) {
                metallic = ((luminance - 100) / 155) * 255;
                metallic *= (1 - saturation / 255) * 1.5; // Favor less saturated areas
            }
            
            // Boost for grayish tones that are bright (typical metal characteristics)
            const grayishness = 255 - Math.abs(r - g) - Math.abs(g - b) - Math.abs(r - b);
            if (grayishness > 200 && luminance > 120) {
                metallic = Math.min(255, metallic + grayishness * 0.3);
            }
            
            metallic = Math.max(0, Math.min(255, metallic));
            
            outputData.data[i] = metallic;
            outputData.data[i + 1] = metallic;
            outputData.data[i + 2] = metallic;
            outputData.data[i + 3] = 255;
        }
        
        return this.imageDataToDataUrl(outputData);
    }

    generateRoughnessFallback(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const outputData = new ImageData(width, height);
        
        // Calculate local variance for roughness
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Sample 3x3 neighborhood
                let totalVariance = 0;
                let sampleCount = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const neighborIdx = (ny * width + nx) * 4;
                            const r = imageData.data[neighborIdx];
                            const g = imageData.data[neighborIdx + 1];
                            const b = imageData.data[neighborIdx + 2];
                            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                            
                            // Compare with center pixel
                            const centerR = imageData.data[idx];
                            const centerG = imageData.data[idx + 1];
                            const centerB = imageData.data[idx + 2];
                            const centerLuminance = 0.299 * centerR + 0.587 * centerG + 0.114 * centerB;
                            
                            const variance = Math.abs(luminance - centerLuminance);
                            totalVariance += variance;
                            sampleCount++;
                        }
                    }
                }
                
                let roughness = totalVariance / sampleCount;
                
                // Normalize and enhance
                roughness = Math.min(255, roughness * 3);
                
                // Invert so smooth areas are dark and rough areas are bright
                roughness = 255 - roughness;
                
                // Add base roughness level
                roughness = Math.max(roughness, 80);
                
                outputData.data[idx] = roughness;
                outputData.data[idx + 1] = roughness;
                outputData.data[idx + 2] = roughness;
                outputData.data[idx + 3] = 255;
            }
        }
        
        // Fill borders
        for (let x = 0; x < width; x++) {
            const topIdx = x * 4;
            const topInnerIdx = (width + x) * 4;
            const bottomIdx = ((height - 1) * width + x) * 4;
            const bottomInnerIdx = ((height - 2) * width + x) * 4;
            
            outputData.data[topIdx] = outputData.data[topInnerIdx];
            outputData.data[topIdx + 1] = outputData.data[topInnerIdx + 1];
            outputData.data[topIdx + 2] = outputData.data[topInnerIdx + 2];
            outputData.data[topIdx + 3] = 255;
            
            outputData.data[bottomIdx] = outputData.data[bottomInnerIdx];
            outputData.data[bottomIdx + 1] = outputData.data[bottomInnerIdx + 1];
            outputData.data[bottomIdx + 2] = outputData.data[bottomInnerIdx + 2];
            outputData.data[bottomIdx + 3] = 255;
        }
        
        for (let y = 0; y < height; y++) {
            const leftIdx = (y * width) * 4;
            const leftInnerIdx = (y * width + 1) * 4;
            const rightIdx = (y * width + width - 1) * 4;
            const rightInnerIdx = (y * width + width - 2) * 4;
            
            outputData.data[leftIdx] = outputData.data[leftInnerIdx];
            outputData.data[leftIdx + 1] = outputData.data[leftInnerIdx + 1];
            outputData.data[leftIdx + 2] = outputData.data[leftInnerIdx + 2];
            outputData.data[leftIdx + 3] = 255;
            
            outputData.data[rightIdx] = outputData.data[rightInnerIdx];
            outputData.data[rightIdx + 1] = outputData.data[rightInnerIdx + 1];
            outputData.data[rightIdx + 2] = outputData.data[rightInnerIdx + 2];
            outputData.data[rightIdx + 3] = 255;
        }
        
        return this.imageDataToDataUrl(outputData);
    }

    generateOcclusionFallback(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const outputData = new ImageData(width, height);
        
        // Simple ambient occlusion approximation
        const radius = 3;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // Sample area around pixel
                let totalLuminance = 0;
                let sampleCount = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const neighborIdx = (ny * width + nx) * 4;
                            const r = imageData.data[neighborIdx];
                            const g = imageData.data[neighborIdx + 1];
                            const b = imageData.data[neighborIdx + 2];
                            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                            
                            // Weight by distance
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const weight = Math.max(0, radius - distance);
                            
                            totalLuminance += luminance * weight;
                            sampleCount += weight;
                        }
                    }
                }
                
                let occlusion = totalLuminance / sampleCount;
                
                // Invert and enhance
                occlusion = 255 - occlusion;
                occlusion = Math.min(255, occlusion * 1.5);
                
                // Ensure minimum visibility
                occlusion = Math.max(50, occlusion);
                
                outputData.data[idx] = occlusion;
                outputData.data[idx + 1] = occlusion;
                outputData.data[idx + 2] = occlusion;
                outputData.data[idx + 3] = 255;
            }
        }
        
        return this.imageDataToDataUrl(outputData);
    }

    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : diff / max;
        let v = max;
        
        if (diff !== 0) {
            switch (max) {
                case r: h = ((g - b) / diff) % 6; break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h *= 60;
            if (h < 0) h += 360;
        }
        
        return { h, s, v };
    }

    hsvToRgb(h, s, v) {
        h /= 60;
        const c = v * s;
        const x = c * (1 - Math.abs((h % 2) - 1));
        const m = v - c;
        
        let r = 0, g = 0, b = 0;
        
        if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
        else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
        else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
        else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
        else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
        else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    imageDataToDataUrl(imageData) {
        this.offscreenCanvas.width = imageData.width;
        this.offscreenCanvas.height = imageData.height;
        this.offscreenCtx.putImageData(imageData, 0, 0);
        return this.offscreenCanvas.toDataURL('image/png');
    }
}

// Create global instance
window.textureGenerator = new PBRTextureGenerator();
