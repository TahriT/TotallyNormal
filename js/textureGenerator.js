class PBRTextureGenerator {
    constructor() {
        this.version = '1.4.8'; // Version tracking - Radial pattern-based seamless tiling for organic appearance
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

    async generatePBRTextures(image, resolution = 512, edgeDetection = 'sobel', enableTiling = true) {
        // Prevent simultaneous generation calls
        if (this._isGenerating) {
            const error = new Error('Texture generation already in progress');
            console.error('❌ Generation in progress:', error.stack);
            throw error;
        }
        
        this._isGenerating = true;
        console.log(`🚀 Starting PBR texture generation (${resolution}x${resolution}, ${edgeDetection} edges, tiling: ${enableTiling})`);
        
        try {
            const result = await this.generateTexturesFallback(image, resolution, edgeDetection, enableTiling);
            this._isGenerating = false;
            return result;
        } catch (error) {
            console.error('❌ Texture generation failed:', error);
            this._isGenerating = false;
            throw new Error(`Failed to generate PBR textures: ${error.message}`);
        }
    }

    async generateTexturesFallback(image, resolution = 512, edgeDetection = 'sobel', enableTiling = true) {
        console.log(`🔧 Using JavaScript algorithms (${resolution}x${resolution}, ${edgeDetection} edge detection, tiling: ${enableTiling})`);
        
        // Debug: Check input image
        if (window.debugImageProcessing) {
            window.debugImageProcessing(image);
        }
        
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

        console.log('🖼️ Drawing to canvas:', {
            imageWidth: image.width,
            imageHeight: image.height,
            sourceSize,
            offsetX,
            offsetY,
            targetSize,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height
        });

        // Clear canvas before drawing
        this.ctx.clearRect(0, 0, targetSize, targetSize);
        
        this.ctx.drawImage(
            image,
            offsetX, offsetY, sourceSize, sourceSize,
            0, 0, targetSize, targetSize
        );

        console.log('✅ Image drawn to canvas successfully');

        const baseImageData = this.ctx.getImageData(0, 0, targetSize, targetSize);
        console.log('📸 Base image data extracted:', baseImageData);
        
        // Debug: Analyze base image data
        if (window.debugTextureGeneration) {
            window.debugTextureGeneration(baseImageData);
        }

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

        // Apply seamless tiling if enabled
        let tilingInfo = null;
        if (enableTiling) {
            console.log('🔄 Applying seamless tiling to all textures... (enableTiling=true)');
            tilingInfo = {};
            
            // Apply tiling to each texture type (async processing)
            const textureTypes = Object.keys(textures);
            for (const textureType of textureTypes) {
                console.log(`🔄 Processing tiling for texture type: ${textureType}`);
                try {
                    const tiledResult = await this.applyTilingToTexture(textures[textureType], targetSize);
                    textures[textureType] = tiledResult.dataUrl;
                    tilingInfo[textureType] = tiledResult.modifications;
                    console.log(`✅ Tiling completed for ${textureType}`);
                } catch (error) {
                    console.error(`🚨 Tiling failed for ${textureType}:`, error);
                    // Keep original texture on failure
                    tilingInfo[textureType] = { error: error.message };
                }
            }
            
            console.log('✅ Seamless tiling applied to all textures');
        } else {
            console.log('⚠️ Tiling DISABLED - textures will be used as-is (enableTiling=false)');
        }

        console.log('🎉 All PBR textures generated successfully');
        
        return {
            textures: textures,
            tilingInfo: tilingInfo,
            settings: {
                resolution: targetSize,
                edgeDetection: edgeDetection,
                tilingEnabled: enableTiling
            }
        };
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
        console.log('🔄 Converting ImageData to Data URL:', {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length
        });
        
        this.offscreenCanvas.width = imageData.width;
        this.offscreenCanvas.height = imageData.height;
        this.offscreenCtx.putImageData(imageData, 0, 0);
        const dataUrl = this.offscreenCanvas.toDataURL('image/png');
        
        // Check if data URL is valid
        const isValid = dataUrl && dataUrl.length > 50 && dataUrl.startsWith('data:image');
        console.log(`🖼️ Generated data URL: ${dataUrl.substring(0, 50)}... (length: ${dataUrl.length}, valid: ${isValid})`);
        
        if (!isValid) {
            console.error('🚨 ISSUE: Generated invalid or empty data URL');
        }
        
        return dataUrl;
    }

    // Correct Seamless Tiling Algorithm - blend actual edges that will connect
    makeSeamless(imageData) {
        console.log('🔄 Applying correct seamless tiling algorithm...');
        console.log('📊 Input imageData:', {
            width: imageData.width,
            height: imageData.height,
            dataLength: imageData.data.length,
            firstPixels: Array.from(imageData.data.slice(0, 12))
        });
        
        const width = imageData.width;
        const height = imageData.height;
        const data = new Uint8ClampedArray(imageData.data);
        
        // Check if input data is valid before processing
        let hasNonZeroPixels = false;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
                hasNonZeroPixels = true;
                break;
            }
        }
        
        if (!hasNonZeroPixels) {
            console.error('🚨 ISSUE: Input image data is completely black before tiling');
            return {
                imageData: imageData,
                modifications: {
                    edgeBlending: false,
                    error: 'Input data was completely black'
                }
            };
        }
        
        // Calculate aggressive blend width for gradient blending
        const minBlendWidth = 8; // Minimum blend zone
        const maxBlendWidth = Math.floor(Math.min(width, height) * 0.15); // 15% of smaller dimension
        const blendWidth = Math.max(minBlendWidth, Math.min(maxBlendWidth, 32)); // Clamp between 8-32 pixels
        
        console.log('🔧 Aggressive gradient tiling parameters:', { 
            blendWidth, 
            imageDimensions: `${width}x${height}`,
            method: 'gradient-edge-blending'
        });
        
        // Apply aggressive gradient blending
        this.blendOpposingEdges(data, width, height, blendWidth);
        
        // Create new image data
        const seamlessImageData = new ImageData(data, width, height);
        
        console.log(`✅ Aggressive gradient tiling applied with ${blendWidth}px blend zones`);
        
        return {
            imageData: seamlessImageData,
            modifications: {
                edgeBlending: true,
                blendWidth: blendWidth,
                method: 'gradient-edge-blending'
            }
        };
    }
    
    // Radial pattern-based seamless tiling - creates organic, natural-looking patterns
    blendOpposingEdges(data, width, height, blendWidth) {
        console.log(`� Creating seamless tiling with radial pattern blending (${blendWidth}px zones)...`);
        
        // Calculate center coordinates for radial distance calculations
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
        
        // Create a copy of original data for reference
        const originalData = new Uint8ClampedArray(data);
        
        // Step 1: Create edge averaging map
        const edgeColors = this.calculateEdgeAverages(originalData, width, height);
        
        // Step 2: Apply radial pattern blending across entire image
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate distances and blend weights using radial falloff
                const blendWeights = this.calculateRadialBlendWeights(x, y, width, height, blendWidth, centerX, centerY);
                
                // Get original pixel
                const originalPixel = [
                    originalData[index],
                    originalData[index + 1],
                    originalData[index + 2]
                ];
                
                // Get edge-matched colors for this position
                const matchedColors = this.getPositionMatchedColors(x, y, width, height, edgeColors, originalPixel);
                
                // Apply radial pattern blending
                for (let c = 0; c < 3; c++) {
                    const original = originalPixel[c];
                    const matched = matchedColors[c];
                    
                    // Use radial weight for organic pattern creation
                    const blended = original * (1 - blendWeights.edgeInfluence) + matched * blendWeights.edgeInfluence;
                    data[index + c] = Math.round(blended);
                }
            }
        }
        
        // Step 3: Ensure perfect edge matching for seamless wrapping
        this.enforceEdgeMatching(data, width, height, edgeColors);
        
        console.log('✅ Radial pattern tiling applied - organic seamless transitions created');
        
        // Debug: Inspect tiling alignment
        this.inspectTilingAlignment(data, width, height);
    }
    
    // Debug function to inspect tiling alignment by creating a 2x2 tile grid
    inspectTilingAlignment(data, width, height) {
        console.log('🔍 Inspecting tiling alignment...');
        
        // Create a 2x2 tiled version for inspection
        const tiledWidth = width * 2;
        const tiledHeight = height * 2;
        const tiledData = new Uint8ClampedArray(tiledWidth * tiledHeight * 4);
        
        // Copy original tile to all 4 quadrants
        for (let tileY = 0; tileY < 2; tileY++) {
            for (let tileX = 0; tileX < 2; tileX++) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const srcIndex = (y * width + x) * 4;
                        const dstX = tileX * width + x;
                        const dstY = tileY * height + y;
                        const dstIndex = (dstY * tiledWidth + dstX) * 4;
                        
                        for (let c = 0; c < 4; c++) {
                            tiledData[dstIndex + c] = data[srcIndex + c];
                        }
                    }
                }
            }
        }
        
        // Check edge alignment
        const misalignments = this.checkEdgeAlignment(tiledData, tiledWidth, tiledHeight, width, height);
        
        if (misalignments.length > 0) {
            console.warn('🚨 Tiling misalignments detected:', misalignments);
        } else {
            console.log('✅ Perfect tiling alignment confirmed');
        }
        
        return misalignments;
    }
    
    // Check if edges align properly in a tiled pattern
    checkEdgeAlignment(tiledData, tiledWidth, tiledHeight, originalWidth, originalHeight) {
        const misalignments = [];
        const tolerance = 2; // Allow small color differences
        
        // Check horizontal seam at the middle
        const midY = originalHeight;
        for (let x = 0; x < tiledWidth; x++) {
            const topIndex = ((midY - 1) * tiledWidth + x) * 4;
            const bottomIndex = (midY * tiledWidth + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                const diff = Math.abs(tiledData[topIndex + c] - tiledData[bottomIndex + c]);
                if (diff > tolerance) {
                    misalignments.push({
                        type: 'horizontal',
                        position: { x, y: midY },
                        channel: c,
                        topValue: tiledData[topIndex + c],
                        bottomValue: tiledData[bottomIndex + c],
                        difference: diff
                    });
                }
            }
        }
        
        // Check vertical seam at the middle
        const midX = originalWidth;
        for (let y = 0; y < tiledHeight; y++) {
            const leftIndex = (y * tiledWidth + (midX - 1)) * 4;
            const rightIndex = (y * tiledWidth + midX) * 4;
            
            for (let c = 0; c < 3; c++) {
                const diff = Math.abs(tiledData[leftIndex + c] - tiledData[rightIndex + c]);
                if (diff > tolerance) {
                    misalignments.push({
                        type: 'vertical',
                        position: { x: midX, y },
                        channel: c,
                        leftValue: tiledData[leftIndex + c],
                        rightValue: tiledData[rightIndex + c],
                        difference: diff
                    });
                }
            }
        }
        
        return misalignments;
    }
    
    // Calculate simple edge averages
    calculateEdgeAveragesSimple(data, width, height) {
        const edges = { top: [], bottom: [], left: [], right: [] };
        
        // Collect edge pixels
        for (let x = 0; x < width; x++) {
            const topIdx = (0 * width + x) * 4;
            const bottomIdx = ((height - 1) * width + x) * 4;
            edges.top.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
            edges.bottom.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
        }
        
        for (let y = 0; y < height; y++) {
            const leftIdx = (y * width + 0) * 4;
            const rightIdx = (y * width + (width - 1)) * 4;
            edges.left.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
            edges.right.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
        }
        
        return edges;
    }
    
    // Apply improved edge interference with better radial blending
    applyImprovedEdgeInterference(data, originalData, width, height, blendWidth, edgeAverages) {
        const blendZone = Math.max(blendWidth, Math.min(width, height) * 0.2); // At least 20% of image
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // Calculate distances to edges
                const distToLeft = x;
                const distToRight = width - 1 - x;
                const distToTop = y;
                const distToBottom = height - 1 - y;
                
                // Determine if we're in a blend zone
                const inLeftZone = distToLeft < blendZone;
                const inRightZone = distToRight < blendZone;
                const inTopZone = distToTop < blendZone;
                const inBottomZone = distToBottom < blendZone;
                
                if (inLeftZone || inRightZone || inTopZone || inBottomZone) {
                    // Calculate blend weights based on distance
                    const leftWeight = inLeftZone ? 1 - (distToLeft / blendZone) : 0;
                    const rightWeight = inRightZone ? 1 - (distToRight / blendZone) : 0;
                    const topWeight = inTopZone ? 1 - (distToTop / blendZone) : 0;
                    const bottomWeight = inBottomZone ? 1 - (distToBottom / blendZone) : 0;
                    
                    // Get opposing edge colors
                    const leftColor = edgeAverages.right[y];   // Left edge should match right edge
                    const rightColor = edgeAverages.left[y];   // Right edge should match left edge
                    const topColor = edgeAverages.bottom[x];   // Top edge should match bottom edge
                    const bottomColor = edgeAverages.top[x];   // Bottom edge should match top edge
                    
                    // Get original pixel
                    const original = [originalData[idx], originalData[idx + 1], originalData[idx + 2]];
                    
                    // Blend with opposing edges
                    let blended = [...original];
                    
                    if (leftWeight > 0) {
                        for (let c = 0; c < 3; c++) {
                            blended[c] = blended[c] * (1 - leftWeight) + leftColor[c] * leftWeight;
                        }
                    }
                    
                    if (rightWeight > 0) {
                        for (let c = 0; c < 3; c++) {
                            blended[c] = blended[c] * (1 - rightWeight) + rightColor[c] * rightWeight;
                        }
                    }
                    
                    if (topWeight > 0) {
                        for (let c = 0; c < 3; c++) {
                            blended[c] = blended[c] * (1 - topWeight) + topColor[c] * topWeight;
                        }
                    }
                    
                    if (bottomWeight > 0) {
                        for (let c = 0; c < 3; c++) {
                            blended[c] = blended[c] * (1 - bottomWeight) + bottomColor[c] * bottomWeight;
                        }
                    }
                    
                    // Apply blended result
                    for (let c = 0; c < 3; c++) {
                        data[idx + c] = Math.round(blended[c]);
                    }
                }
            }
        }
    }
    
    // Force perfect edge pixel matching
    forceEdgeMatching(data, width, height, edgeAverages) {
        // Make left and right edges identical
        for (let y = 0; y < height; y++) {
            const avgColor = this.averageColors([edgeAverages.left[y], edgeAverages.right[y]]);
            
            const leftIdx = (y * width + 0) * 4;
            const rightIdx = (y * width + (width - 1)) * 4;
            
            for (let c = 0; c < 3; c++) {
                data[leftIdx + c] = avgColor[c];
                data[rightIdx + c] = avgColor[c];
            }
        }
        
        // Make top and bottom edges identical
        for (let x = 0; x < width; x++) {
            const avgColor = this.averageColors([edgeAverages.top[x], edgeAverages.bottom[x]]);
            
            const topIdx = (0 * width + x) * 4;
            const bottomIdx = ((height - 1) * width + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                data[topIdx + c] = avgColor[c];
                data[bottomIdx + c] = avgColor[c];
            }
        }
        
        // Fix corners to average of all edge colors at that position
        const cornerAvg = this.averageColors([
            edgeAverages.top[0], edgeAverages.top[width - 1],
            edgeAverages.bottom[0], edgeAverages.bottom[width - 1],
            edgeAverages.left[0], edgeAverages.left[height - 1],
            edgeAverages.right[0], edgeAverages.right[height - 1]
        ]);
        
        const corners = [
            (0 * width + 0) * 4,                              // Top-left
            (0 * width + (width - 1)) * 4,                    // Top-right
            ((height - 1) * width + 0) * 4,                  // Bottom-left
            ((height - 1) * width + (width - 1)) * 4         // Bottom-right
        ];
        
        corners.forEach(cornerIdx => {
            for (let c = 0; c < 3; c++) {
                data[cornerIdx + c] = cornerAvg[c];
            }
        });
    }
    
    // Calculate edge averages for seamless matching
    calculateEdgeAverages(data, width, height) {
        const edgeColors = {
            top: [],
            bottom: [],
            left: [],
            right: [],
            corners: {}
        };
        
        // Collect edge colors
        for (let x = 0; x < width; x++) {
            const topIndex = (0 * width + x) * 4;
            const bottomIndex = ((height - 1) * width + x) * 4;
            edgeColors.top.push([data[topIndex], data[topIndex + 1], data[topIndex + 2]]);
            edgeColors.bottom.push([data[bottomIndex], data[bottomIndex + 1], data[bottomIndex + 2]]);
        }
        
        for (let y = 0; y < height; y++) {
            const leftIndex = (y * width + 0) * 4;
            const rightIndex = (y * width + (width - 1)) * 4;
            edgeColors.left.push([data[leftIndex], data[leftIndex + 1], data[leftIndex + 2]]);
            edgeColors.right.push([data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]]);
        }
        
        // Calculate corner averages
        edgeColors.corners.topLeft = this.averageColors([edgeColors.top[0], edgeColors.left[0]]);
        edgeColors.corners.topRight = this.averageColors([edgeColors.top[width - 1], edgeColors.right[0]]);
        edgeColors.corners.bottomLeft = this.averageColors([edgeColors.bottom[0], edgeColors.left[height - 1]]);
        edgeColors.corners.bottomRight = this.averageColors([edgeColors.bottom[width - 1], edgeColors.right[height - 1]]);
        
        return edgeColors;
    }
    
    // Calculate radial blend weights for organic pattern creation
    calculateRadialBlendWeights(x, y, width, height, blendWidth, centerX, centerY) {
        // Distance from edges (0 = at edge, 1 = far from edge)
        const distFromLeft = Math.min(1, x / blendWidth);
        const distFromRight = Math.min(1, (width - 1 - x) / blendWidth);
        const distFromTop = Math.min(1, y / blendWidth);
        const distFromBottom = Math.min(1, (height - 1 - y) / blendWidth);
        
        // Minimum distance to any edge (how close to boundary)
        const edgeDistance = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);
        
        // Radial distance from center (normalized)
        const radialDist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxRadialDist = Math.sqrt(centerX ** 2 + centerY ** 2);
        const normalizedRadial = radialDist / maxRadialDist;
        
        // Create organic pattern influence using multiple curves
        const radialCurve = 1 - Math.cos(normalizedRadial * Math.PI * 0.5); // Cosine falloff
        const edgeCurve = 1 - Math.pow(edgeDistance, 2); // Quadratic falloff from edges
        
        // Combine influences for natural pattern
        const edgeInfluence = Math.max(0, Math.min(1, edgeCurve * 0.7 + radialCurve * 0.3));
        
        return {
            edgeInfluence,
            edgeDistance,
            radialDistance: normalizedRadial
        };
    }
    
    // Get position-matched colors based on wrapping logic
    getPositionMatchedColors(x, y, width, height, edgeColors, originalPixel) {
        // Calculate opposite coordinates for wrapping
        const oppositeX = width - 1 - x;
        const oppositeY = height - 1 - y;
        
        // Determine which edges this pixel should match when wrapping
        let matchedColor = [originalPixel[0], originalPixel[1], originalPixel[2]];
        
        // Near edges: blend with opposite edge colors
        const isNearLeftEdge = x < width * 0.25;
        const isNearRightEdge = x > width * 0.75;
        const isNearTopEdge = y < height * 0.25;
        const isNearBottomEdge = y > height * 0.75;
        
        const colors = [];
        if (isNearLeftEdge) colors.push(edgeColors.right[y]);
        if (isNearRightEdge) colors.push(edgeColors.left[y]);
        if (isNearTopEdge) colors.push(edgeColors.bottom[x]);
        if (isNearBottomEdge) colors.push(edgeColors.top[x]);
        
        // Corner handling
        if ((isNearLeftEdge && isNearTopEdge)) colors.push(edgeColors.corners.bottomRight);
        if ((isNearRightEdge && isNearTopEdge)) colors.push(edgeColors.corners.bottomLeft);
        if ((isNearLeftEdge && isNearBottomEdge)) colors.push(edgeColors.corners.topRight);
        if ((isNearRightEdge && isNearBottomEdge)) colors.push(edgeColors.corners.topLeft);
        
        if (colors.length > 0) {
            colors.push(originalPixel); // Include original for blending
            matchedColor = this.averageColors(colors);
        }
        
        return matchedColor;
    }
    
    // Average multiple colors together
    averageColors(colors) {
        if (colors.length === 0) return [0, 0, 0];
        
        let r = 0, g = 0, b = 0;
        for (const color of colors) {
            r += color[0];
            g += color[1];
            b += color[2];
        }
        
        return [
            Math.round(r / colors.length),
            Math.round(g / colors.length),
            Math.round(b / colors.length)
        ];
    }
    
    // Ensure perfect edge matching for seamless wrapping
    enforceEdgeMatching(data, width, height, edgeColors) {
        console.log('🎯 Enforcing perfect edge matching to eliminate seams...');
        
        // Step 1: Calculate unified corner color that satisfies all edge constraints
        const unifiedCornerColor = this.calculateUnifiedCornerColor(edgeColors, width, height);
        
        // Step 2: Make horizontal edges identical with proper corner integration
        for (let y = 0; y < height; y++) {
            let avgColor;
            
            // Special handling for corner rows
            if (y === 0 || y === height - 1) {
                // Use unified corner color for corner pixels
                avgColor = unifiedCornerColor;
            } else {
                // Regular edge averaging for non-corner rows
                avgColor = this.averageColors([edgeColors.left[y], edgeColors.right[y]]);
            }
            
            const leftIndex = (y * width + 0) * 4;
            const rightIndex = (y * width + (width - 1)) * 4;
            
            for (let c = 0; c < 3; c++) {
                data[leftIndex + c] = avgColor[c];
                data[rightIndex + c] = avgColor[c];
            }
        }
        
        // Step 3: Make vertical edges identical with proper corner integration
        for (let x = 0; x < width; x++) {
            let avgColor;
            
            // Special handling for corner columns
            if (x === 0 || x === width - 1) {
                // Use unified corner color for corner pixels
                avgColor = unifiedCornerColor;
            } else {
                // Regular edge averaging for non-corner columns
                avgColor = this.averageColors([edgeColors.top[x], edgeColors.bottom[x]]);
            }
            
            const topIndex = (0 * width + x) * 4;
            const bottomIndex = ((height - 1) * width + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                data[topIndex + c] = avgColor[c];
                data[bottomIndex + c] = avgColor[c];
            }
        }
        
        // Step 4: Explicitly set all corner pixels to unified color
        this.setUnifiedCornerPixels(data, width, height, unifiedCornerColor);
        
        console.log('✅ Perfect edge matching enforced - seams eliminated');
    }
    
    // Calculate a single unified corner color that works for all corners
    calculateUnifiedCornerColor(edgeColors, width, height) {
        // Collect all corner-relevant colors
        const cornerColors = [
            edgeColors.corners.topLeft,
            edgeColors.corners.topRight, 
            edgeColors.corners.bottomLeft,
            edgeColors.corners.bottomRight,
            // Also include edge colors that affect corners
            edgeColors.top[0],           // Top-left edge
            edgeColors.top[width - 1],   // Top-right edge  
            edgeColors.bottom[0],        // Bottom-left edge
            edgeColors.bottom[width - 1], // Bottom-right edge
            edgeColors.left[0],          // Left-top edge
            edgeColors.left[height - 1], // Left-bottom edge
            edgeColors.right[0],         // Right-top edge
            edgeColors.right[height - 1] // Right-bottom edge
        ];
        
        return this.averageColors(cornerColors);
    }
    
    // Set all corner pixels to the unified corner color
    setUnifiedCornerPixels(data, width, height, unifiedColor) {
        const corners = [
            { x: 0, y: 0 },                    // Top-left
            { x: width - 1, y: 0 },            // Top-right  
            { x: 0, y: height - 1 },           // Bottom-left
            { x: width - 1, y: height - 1 }    // Bottom-right
        ];
        
        corners.forEach(corner => {
            const index = (corner.y * width + corner.x) * 4;
            for (let c = 0; c < 3; c++) {
                data[index + c] = unifiedColor[c];
            }
        });
        
        console.log('🎯 All corner pixels set to unified color for seamless wrapping');
    }
    
    // Fix corner pixels to satisfy both horizontal and vertical edge constraints
    fixCornerPixels(data, width, height) {
        console.log('� Fixing corner pixels for seamless edge matching...');
        
        // Get the edge colors that corners need to match
        const topEdgeColor = [data[0], data[1], data[2]]; // Top-left = top edge
        const bottomEdgeColor = [data[(height - 1) * width * 4], data[(height - 1) * width * 4 + 1], data[(height - 1) * width * 4 + 2]]; // Bottom-left = bottom edge
        const leftEdgeColor = [data[0], data[1], data[2]]; // Top-left = left edge  
        const rightEdgeColor = [data[(width - 1) * 4], data[(width - 1) * 4 + 1], data[(width - 1) * 4 + 2]]; // Top-right = right edge
        
        // All four corners should be the same color - average of all edge colors
        const cornerColor = [
            Math.round((topEdgeColor[0] + bottomEdgeColor[0] + leftEdgeColor[0] + rightEdgeColor[0]) / 4),
            Math.round((topEdgeColor[1] + bottomEdgeColor[1] + leftEdgeColor[1] + rightEdgeColor[1]) / 4),
            Math.round((topEdgeColor[2] + bottomEdgeColor[2] + leftEdgeColor[2] + rightEdgeColor[2]) / 4)
        ];
        
        // Set all four corners to the same color
        const corners = [
            0,                                    // Top-left
            (width - 1) * 4,                     // Top-right  
            (height - 1) * width * 4,           // Bottom-left
            ((height - 1) * width + (width - 1)) * 4  // Bottom-right
        ];
        
        corners.forEach(cornerIndex => {
            data[cornerIndex] = cornerColor[0];
            data[cornerIndex + 1] = cornerColor[1];
            data[cornerIndex + 2] = cornerColor[2];
        });
        
        console.log('✅ Corner pixels fixed for seamless wrapping');
    }

    async applyTilingToTexture(dataUrl, targetSize) {
        console.log('🔄 Applying tiling to texture...', { targetSize, dataUrlLength: dataUrl.length });
        
        // Create a temporary image to get ImageData
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = targetSize;
        tempCanvas.height = targetSize;
        
        // Create image from data URL and wait for it to load
        const img = new Image();
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    console.log('🖼️ Image loaded for tiling, dimensions:', { width: img.width, height: img.height });
                    
                    // Draw image to canvas
                    tempCtx.drawImage(img, 0, 0, targetSize, targetSize);
                    const imageData = tempCtx.getImageData(0, 0, targetSize, targetSize);
                    
                    console.log('📊 ImageData extracted for tiling:', {
                        width: imageData.width,
                        height: imageData.height,
                        dataLength: imageData.data.length,
                        hasData: imageData.data.some(val => val > 0)
                    });
                    
                    // Apply seamless tiling
                    const tilingResult = this.makeSeamless(imageData);
                    
                    // Convert back to data URL
                    tempCanvas.width = targetSize;
                    tempCanvas.height = targetSize;
                    tempCtx.putImageData(tilingResult.imageData, 0, 0);
                    
                    const resultDataUrl = tempCanvas.toDataURL('image/png');
                    console.log('✅ Tiling applied, result data URL length:', resultDataUrl.length);
                    
                    // Clean up temporary canvas to prevent memory leaks
                    tempCanvas.width = 0;
                    tempCanvas.height = 0;
                    
                    resolve({
                        dataUrl: resultDataUrl,
                        modifications: tilingResult.modifications
                    });
                } catch (error) {
                    console.error('🚨 Error applying tiling:', error);
                    // Clean up on error too
                    tempCanvas.width = 0;
                    tempCanvas.height = 0;
                    reject(error);
                }
            };
            
            img.onerror = (error) => {
                console.error('🚨 Failed to load image for tiling:', error);
                // Clean up on error
                tempCanvas.width = 0;
                tempCanvas.height = 0;
                reject(new Error('Failed to load image for tiling'));
            };
            
            img.src = dataUrl;
        });
    }
}

// Create global instance
window.textureGenerator = new PBRTextureGenerator();
