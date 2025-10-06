/**
 * 3D Material Viewer using Three.js
 * Provides real-time material preview with PBR textures
 * Version: 1.6.2
 * 
 * Note: For local development, use port 3000 (python -m http.server 3000)
 */
class MaterialViewer3D {
    constructor() {
        this.version = '1.6.2'; // Enhanced real-time controls and blend amount updates
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.material = null;
        this.controls = null;
        this.container = null;
        this.animationId = null;
        this.isInitialized = false;
        this._resizeTimeout = null;
        this.currentGeometry = 'plane'; // Default geometry - changed to plane to match default viewer
        this.rotationSpeed = 0.005;
        this.isRotating = false; // Always start paused
        
        // Intro animation properties
        this.isIntroAnimating = false;
        this.introStartTime = null;
        this.introDuration = 4000; // 4 seconds for smooth transition
        this.hasPlayedIntro = false; // Track if intro has been shown
        
        // For plane geometry: start from behind/flipped and rotate to front
        this.introStartCameraPosition = { x: 0, y: 0, z: -3.5 }; // Behind the plane
        this.introEndCameraPosition = { x: 0, y: 0, z: 3.5 }; // Front view
        this.introStartRotation = { x: 0, y: Math.PI, z: 0 }; // Looking at back of plane
        this.introEndRotation = { x: 0, y: 0, z: 0 }; // Normal front view
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight = null;
        
        // Geometries
        this.sphereGeometry = null;
        this.planeGeometry = null;
        this.cubeGeometry = null;
    }

    init(containerId) {
        console.log('🎮 Initializing 3D Material Viewer with container:', containerId);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('🚨 3D container not found:', containerId);
            return false;
        }

        console.log('✅ Container found:', this.container);
        console.log('📏 Container dimensions:', {
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            offsetWidth: this.container.offsetWidth,
            offsetHeight: this.container.offsetHeight
        });

        try {
            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                console.error('🚨 Three.js is not loaded!');
                return false;
            }
            console.log('✅ Three.js loaded successfully');
            
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0d0d1e);
            console.log('✅ Scene created');

            // Camera setup
            let width = this.container.clientWidth;
            let height = this.container.clientHeight;
            
            // Handle zero dimensions by using fallback sizes
            if (width === 0 || height === 0) {
                console.warn('🚨 Container has zero dimensions, using fallback sizes');
                width = Math.max(width, 800); // Fallback width
                height = Math.max(height, 500); // Fallback height
                
                // Force container size
                this.container.style.width = width + 'px';
                this.container.style.height = height + 'px';
                
                console.log('🔧 Applied fallback dimensions:', { width, height });
            }
            
            this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            this.camera.position.set(0, 0, 3);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        console.log('✅ WebGL Renderer created');
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        // Enable touch action for better mobile performance
        this.renderer.domElement.style.touchAction = 'none';
        
        // Ensure canvas takes full container size
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        
        this.container.appendChild(this.renderer.domElement);
        console.log('✅ Renderer canvas added to container');            // Lighting setup
            this.setupLighting();

            // Create default geometry (sphere to showcase material)
            this.createGeometry();

            // Mouse controls (basic orbit)
            // Setup controls and resize handling (now integrated)
            this.setupControls();

            // Start render loop
            this.animate();

            this.isInitialized = true;
            console.log('3D Material Viewer initialized successfully');
            
            // Trigger initial resize after delay to ensure DOM is ready
            setTimeout(() => {
                this.handleResize();
            }, 3000);
            
            return true;

        } catch (error) {
            console.error('Failed to initialize 3D viewer:', error);
            return false;
        }
    }

    setupLighting() {
        // Ambient light for general illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);

        // Directional light for main illumination
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(5, 5, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(this.directionalLight);

        // Point light for additional highlights
        this.pointLight = new THREE.PointLight(0x00d4ff, 0.3, 10);
        this.pointLight.position.set(-3, 3, 3);
        this.scene.add(this.pointLight);
    }

    createGeometry() {
        // Create sphere, plane, and cube geometries
        this.sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
        this.planeGeometry = new THREE.PlaneGeometry(2, 2, 64, 64);
        this.cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 32, 32, 32);
        
        // Create basic material (will be replaced when textures are loaded)
        this.material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.0,
            side: THREE.DoubleSide // Enable double-sided rendering
        });

        // Start with plane geometry (default)
        this.mesh = new THREE.Mesh(this.planeGeometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    setupControls() {
        // Mouse controls for desktop
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        // Store event listener references for proper cleanup
        this._onMouseDown = (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Stop intro animation on user interaction
            if (this.isIntroAnimating) {
                this.stopIntroAnimation();
            }
        };

        this._onMouseMove = (e) => {
            if (!isDragging) return;
            this.handleRotation(e.clientX, e.clientY, previousMousePosition);
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        this._onMouseUp = () => {
            isDragging = false;
        };

        this.renderer.domElement.addEventListener('mousedown', this._onMouseDown);
        this.renderer.domElement.addEventListener('mousemove', this._onMouseMove);
        this.renderer.domElement.addEventListener('mouseup', this._onMouseUp);

        // Touch controls for mobile
        let isTouching = false;
        let previousTouchPosition = { x: 0, y: 0 };
        let touchStartDistance = 0;
        let initialCameraZ = this.camera.position.z;

        this._onTouchStart = (e) => {
            e.preventDefault();
            
            // Stop intro animation on user interaction
            if (this.isIntroAnimating) {
                this.stopIntroAnimation();
            }
            
            if (e.touches.length === 1) {
                // Single touch - rotation
                isTouching = true;
                const touch = e.touches[0];
                previousTouchPosition = { x: touch.clientX, y: touch.clientY };
            } else if (e.touches.length === 2) {
                // Two finger touch - zoom (pinch)
                isTouching = false; // Disable rotation during pinch
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                touchStartDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                initialCameraZ = this.camera.position.z;
            }
        };

        this._onTouchMove = (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && isTouching) {
                // Single touch - rotation
                const touch = e.touches[0];
                this.handleRotation(touch.clientX, touch.clientY, previousTouchPosition);
                previousTouchPosition = { x: touch.clientX, y: touch.clientY };
            } else if (e.touches.length === 2) {
                // Two finger touch - zoom (pinch)
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                const scale = currentDistance / touchStartDistance;
                const newZ = Math.max(1, Math.min(10, initialCameraZ / scale));
                this.camera.position.z = newZ;
            }
        };

        this._onTouchEnd = (e) => {
            e.preventDefault();
            isTouching = false;
        };

        this.renderer.domElement.addEventListener('touchstart', this._onTouchStart);
        this.renderer.domElement.addEventListener('touchmove', this._onTouchMove);
        this.renderer.domElement.addEventListener('touchend', this._onTouchEnd);

        // Mouse wheel for zoom (desktop)
        this._onWheel = (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.camera.position.z += e.deltaY * zoomSpeed * 0.01;
            this.camera.position.z = Math.max(1.5, Math.min(10, this.camera.position.z));
        };

        this.renderer.domElement.addEventListener('wheel', this._onWheel);
        
        // Store window resize handler reference  
        this._onWindowResize = () => this.handleResize();
        
        // Use ResizeObserver for better container responsiveness
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                let shouldResize = false;
                for (const entry of entries) {
                    if (entry.target === this.container || this.container.contains(entry.target) || entry.target.contains(this.container)) {
                        shouldResize = true;
                        break;
                    }
                }
                if (shouldResize) {
                    // Use requestAnimationFrame for smoother resize
                    if (this._resizeTimeout) {
                        cancelAnimationFrame(this._resizeTimeout);
                    }
                    this._resizeTimeout = requestAnimationFrame(() => {
                        this.handleResize();
                        this._resizeTimeout = null;
                    });
                }
            });
            
            // Observe the container and its parent containers for size changes
            this._resizeObserver.observe(this.container);
            
            // Also observe parent containers that might affect sizing
            let parent = this.container.parentElement;
            while (parent && parent !== document.body) {
                this._resizeObserver.observe(parent);
                parent = parent.parentElement;
            }
        }
        
        // Fallback to window resize for older browsers
        window.addEventListener('resize', this._onWindowResize);
        
        // Also listen to orientation changes for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100); // Small delay for orientation change
        });
    }
    
    handleResize() {
        if (!this.container || !this.renderer || !this.camera) return;

        // Get container dimensions - prioritize clientWidth/Height as they account for padding correctly
        const rect = this.container.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(this.container);
        
        // Parse CSS dimensions if available
        const cssWidth = parseFloat(computedStyle.width);
        const cssHeight = parseFloat(computedStyle.height);
        
        // Prioritize clientWidth/Height as they represent the actual content area
        // (excluding borders and scrollbars, accounting for padding correctly)
        const width = Math.max(
            this.container.clientWidth || 0,     // Best for content area
            rect.width || 0,                     // Includes borders
            cssWidth || 0,                       // CSS computed width
            this.container.offsetWidth || 0,     // Includes borders + padding
            100 // Minimum fallback
        );
        
        const height = Math.max(
            this.container.clientHeight || 0,    // Best for content area
            rect.height || 0,                    // Includes borders
            cssHeight || 0,                      // CSS computed height
            this.container.offsetHeight || 0,    // Includes borders + padding
            100 // Minimum fallback
        );

        // Only resize if dimensions actually changed
        const currentSize = this.renderer.getSize(new THREE.Vector2());
        if (Math.abs(currentSize.width - width) < 1 && Math.abs(currentSize.height - height) < 1) {
            return; // Skip unnecessary resize
        }

        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height, false);
        
        // Ensure pixel ratio is appropriate for device
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(pixelRatio);
        
        // Enhanced debugging for container sizing
        const parent = this.container.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const parentComputedStyle = parent ? window.getComputedStyle(parent) : null;
        
        console.log(`🔄 3D Viewer resized to ${width}x${height} (pixel ratio: ${pixelRatio})`);
        console.log(`📏 Container: client(${this.container.clientWidth}x${this.container.clientHeight}), rect(${rect.width}x${rect.height}), css(${cssWidth}x${cssHeight})`);
        if (parent) {
            console.log(`📦 Parent: client(${parent.clientWidth}x${parent.clientHeight}), rect(${parentRect.width}x${parentRect.height}), padding(${parentComputedStyle.paddingLeft}, ${parentComputedStyle.paddingRight})`);
        }
        
        // Force a render update
        this.render();
    }

    // Utility method to force an immediate resize check
    forceResize() {
        console.log('🔄 Force resize triggered');
        // Wait a frame for any CSS changes to apply
        requestAnimationFrame(() => {
            this.handleResize();
        });
    }

    handleRotation(currentX, currentY, previousPosition) {
        const deltaMove = {
            x: currentX - previousPosition.x,
            y: currentY - previousPosition.y
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                toRadians(deltaMove.y * 0.5),
                toRadians(deltaMove.x * 0.5),
                0,
                'XYZ'
            ));

        this.mesh.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.mesh.quaternion);

        // Helper function
        function toRadians(angle) {
            return angle * (Math.PI / 180);
        }
    }

    loadMaterial(textures) {
        if (!this.isInitialized) {
            console.warn('3D viewer not initialized');
            return;
        }

        try {
            // Create texture loader
            const loader = new THREE.TextureLoader();
            
            // Load textures
            const materialTextures = {};

            // Helper function to load texture from data URL
            const loadTextureFromDataURL = (dataUrl, callback) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    texture.offset.set(0, 0); // Start centered
                    callback(texture);
                };
                img.src = dataUrl;
            };

            let loadedCount = 0;
            const totalTextures = Object.keys(textures).length;

            // Load each texture
            Object.entries(textures).forEach(([type, dataUrl]) => {
                loadTextureFromDataURL(dataUrl, (texture) => {
                    materialTextures[type] = texture;
                    loadedCount++;

                    if (loadedCount === totalTextures) {
                        this.applyTexturesToMaterial(materialTextures);
                    }
                });
            });

        } catch (error) {
            console.error('Failed to load textures:', error);
        }
    }

    applyTexturesToMaterial(textures) {
        // Create new PBR material with loaded textures
        const materialConfig = {
            roughness: 0.5,
            metalness: 0.0
        };

        // Apply textures
        if (textures.albedo) {
            materialConfig.map = textures.albedo;
        }

        if (textures.normal) {
            materialConfig.normalMap = textures.normal;
            materialConfig.normalScale = new THREE.Vector2(1, 1);
        }

        if (textures.height) {
            materialConfig.displacementMap = textures.height;
            materialConfig.displacementScale = 0.1;
        }

        if (textures.metallic) {
            materialConfig.metalnessMap = textures.metallic;
        }

        if (textures.roughness) {
            materialConfig.roughnessMap = textures.roughness;
        }

        if (textures.occlusion) {
            materialConfig.aoMap = textures.occlusion;
            materialConfig.aoMapIntensity = 1.0;
        }

        // Dispose of old material and its textures to prevent memory leaks
        if (this.mesh.material) {
            // Dispose of old textures
            if (this.mesh.material.map) this.mesh.material.map.dispose();
            if (this.mesh.material.normalMap) this.mesh.material.normalMap.dispose();
            if (this.mesh.material.displacementMap) this.mesh.material.displacementMap.dispose();
            if (this.mesh.material.metalnessMap) this.mesh.material.metalnessMap.dispose();
            if (this.mesh.material.roughnessMap) this.mesh.material.roughnessMap.dispose();
            if (this.mesh.material.aoMap) this.mesh.material.aoMap.dispose();
            
            // Dispose of material
            this.mesh.material.dispose();
        }

        // Create and apply new material
        const newMaterial = new THREE.MeshStandardMaterial({
            ...materialConfig,
            side: THREE.DoubleSide // Enable double-sided rendering for plane geometry
        });
        
        this.mesh.material = newMaterial;
        this.material = newMaterial;

        console.log('Material textures applied successfully with proper cleanup');
        
        // Start intro animation when new material is loaded
        this.startIntroAnimation();
    }

    updateRoughness(value) {
        if (this.material) {
            this.material.roughness = value;
        }
    }

    updateMetalness(value) {
        if (this.material) {
            this.material.metalness = value;
        }
    }

    updateNormalIntensity(value) {
        if (this.material && this.material.normalScale) {
            this.material.normalScale.set(value, value);
        }
    }
    
    updateAOIntensity(value) {
        if (this.material) {
            this.material.aoMapIntensity = value;
        }
    }
    
    updateDisplacementScale(value) {
        if (this.material) {
            this.material.displacementScale = value;
        }
    }
    
    switchGeometry(geometryType) {
        if (!this.isInitialized || !this.mesh) return;
        
        this.currentGeometry = geometryType;
        const oldMaterial = this.mesh.material;
        
        // Remove old mesh and dispose of its geometry if it's not a shared one
        this.scene.remove(this.mesh);
        // Note: We don't dispose geometries here since they are shared instances
        
        // Create new mesh with different geometry
        let geometry;
        if (geometryType === 'plane') {
            geometry = this.planeGeometry;
        } else if (geometryType === 'cube') {
            geometry = this.cubeGeometry;
        } else {
            geometry = this.sphereGeometry;
        }
        
        this.mesh = new THREE.Mesh(geometry, oldMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Reset camera position for better viewing
        this.resetCamera();
        
        console.log(`Switched to ${geometryType} geometry with proper cleanup`);
    }

    // Update texture tiling/zoom for all loaded textures - zooms from center
    updateTilingZoom(zoomFactor) {
        if (this.material) {
            // Update all material textures with new repeat values and center offset
            const updateTextureRepeat = (texture) => {
                if (texture) {
                    // Set repeat for tiling
                    texture.repeat.set(zoomFactor, zoomFactor);
                    
                    // Calculate offset to keep zoom centered
                    // When zoom > 1, we see more tiles, offset centers the pattern
                    const offset = (1 - zoomFactor) * 0.5;
                    texture.offset.set(offset, offset);
                    
                    texture.needsUpdate = true;
                }
            };

            // Update each texture type
            updateTextureRepeat(this.material.map);        // Albedo
            updateTextureRepeat(this.material.normalMap);  // Normal
            updateTextureRepeat(this.material.roughnessMap); // Roughness
            updateTextureRepeat(this.material.metalnessMap); // Metallic
            updateTextureRepeat(this.material.aoMap);      // Ambient Occlusion
            updateTextureRepeat(this.material.displacementMap); // Height/Displacement

            console.log(`🔍 Updated texture tiling zoom to ${zoomFactor}x (centered)`);
        }
    }

    // Update texture offset for dynamic tiling position control
    updateTilingOffset(offsetX, offsetY) {
        if (this.material) {
            // Update all material textures with new offset values
            const updateTextureOffset = (texture) => {
                if (texture) {
                    // Get current repeat values (preserve zoom)
                    const currentRepeatX = texture.repeat.x;
                    const currentRepeatY = texture.repeat.y;
                    
                    // Calculate base offset for centering zoom
                    const baseOffsetX = (1 - currentRepeatX) * 0.5;
                    const baseOffsetY = (1 - currentRepeatY) * 0.5;
                    
                    // Add dynamic offset (scale by repeat to maintain proper offset behavior)
                    const dynamicOffsetX = offsetX * currentRepeatX;
                    const dynamicOffsetY = offsetY * currentRepeatY;
                    
                    // Set combined offset
                    texture.offset.set(
                        baseOffsetX + dynamicOffsetX, 
                        baseOffsetY + dynamicOffsetY
                    );
                    
                    texture.needsUpdate = true;
                }
            };

            // Update each texture type
            updateTextureOffset(this.material.map);        // Albedo
            updateTextureOffset(this.material.normalMap);  // Normal
            updateTextureOffset(this.material.roughnessMap); // Roughness
            updateTextureOffset(this.material.metalnessMap); // Metallic
            updateTextureOffset(this.material.aoMap);      // Ambient Occlusion
            updateTextureOffset(this.material.displacementMap); // Height/Displacement

            console.log(`🔄 Tiling offset updated: X=${offsetX.toFixed(2)}, Y=${offsetY.toFixed(2)}`);
        }
    }

    // Update tiling blend amount for real-time preview
    updateTilingBlendAmount(blendAmount) {
        if (this.material) {
            // More dramatic blend effect using multiple properties
            const updateTextureBlend = (texture) => {
                if (texture) {
                    // Scale effect based on blend amount (0.1 to 0.5)
                    const normalizedBlend = (blendAmount - 0.1) / 0.4; // 0 to 1 range
                    
                    // Adjust filtering - more dramatic difference
                    if (normalizedBlend > 0.7) {
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipmapLinearFilter;
                    } else if (normalizedBlend > 0.3) {
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipmapNearestFilter;
                    } else {
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestMipmapNearestFilter;
                    }
                    
                    // Adjust anisotropy based on blend amount for smoother/sharper appearance
                    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
                    texture.anisotropy = Math.round(normalizedBlend * maxAnisotropy);
                    
                    // Adjust wrap mode
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    
                    texture.needsUpdate = true;
                }
            };

            // Update all texture types
            updateTextureBlend(this.material.map);        // Albedo
            updateTextureBlend(this.material.normalMap);  // Normal
            updateTextureBlend(this.material.roughnessMap); // Roughness
            updateTextureBlend(this.material.metalnessMap); // Metallic
            updateTextureBlend(this.material.aoMap);      // Ambient Occlusion
            updateTextureBlend(this.material.displacementMap); // Height/Displacement

            // Also adjust material properties for more visible effect
            if (this.material.roughness !== undefined) {
                // Slightly adjust material roughness based on blend (subtle effect)
                const baseRoughness = this.material.userData?.originalRoughness || this.material.roughness;
                this.material.userData.originalRoughness = baseRoughness;
                this.material.roughness = baseRoughness + (normalizedBlend * 0.1 - 0.05);
            }

            console.log(`🌊 Tiling blend amount updated: ${(blendAmount * 100).toFixed(0)}% (anisotropy: ${Math.round((blendAmount - 0.1) / 0.4 * this.renderer.capabilities.getMaxAnisotropy())})`);
        }
    }

    resetCamera() {
        if (this.camera && this.mesh) {
            if (this.currentGeometry === 'plane') {
                this.camera.position.set(0, 0, 2);
                this.mesh.rotation.set(0, 0, 0);
            } else if (this.currentGeometry === 'cube') {
                this.camera.position.set(0, 0, 3.5);
                this.mesh.rotation.set(0, 0, 0);
            } else {
                this.camera.position.set(0, 0, 3);
                this.mesh.rotation.set(0, 0, 0);
            }
        }
    }

    // Snap to plane view instantly (for tiling preview)
    snapToPlaneView() {
        if (!this.isInitialized) return;
        
        console.log('📐 Snapping to plane view for tiling preview...');
        
        // Switch to plane geometry instantly (no animation)
        this.switchGeometry('plane');
        
        // Position camera for optimal plane viewing
        if (this.camera && this.mesh) {
            this.camera.position.set(0, 0, 2);
            this.mesh.rotation.set(0, 0, 0);
            
            // Stop any ongoing intro animation
            this.isIntroAnimating = false;
            
            console.log('✅ Snapped to plane view for seamless tiling preview');
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.renderer && this.scene && this.camera) {
            // Handle intro animation (smooth camera transition)
            if (this.isIntroAnimating) {
                const now = Date.now();
                const elapsed = now - this.introStartTime;
                
                if (elapsed < this.introDuration) {
                    // Calculate smooth progress (0 to 1) with easing
                    const rawProgress = elapsed / this.introDuration;
                    const progress = this.easeInOutCubic(rawProgress);
                    
                    // Smooth camera position transition (behind to front)
                    this.camera.position.x = this.lerp(this.introStartCameraPosition.x, this.introEndCameraPosition.x, progress);
                    this.camera.position.y = this.lerp(this.introStartCameraPosition.y, this.introEndCameraPosition.y, progress);
                    this.camera.position.z = this.lerp(this.introStartCameraPosition.z, this.introEndCameraPosition.z, progress);
                    
                    // Smooth camera rotation (from back view to front view)
                    this.camera.rotation.y = this.lerp(this.introStartRotation.y, this.introEndRotation.y, progress);
                    
                    // Gentle Y-axis rotation for the mesh during transition
                    if (this.mesh) {
                        this.mesh.rotation.y += 0.003; // Subtle rotation to show material
                    }
                } else {
                    // End intro animation - set final positions
                    this.isIntroAnimating = false;
                    this.introStartTime = null;
                    this.camera.position.set(this.introEndCameraPosition.x, this.introEndCameraPosition.y, this.introEndCameraPosition.z);
                    this.camera.rotation.set(0, 0, 0);
                    // Ensure camera looks at the mesh (front-facing)
                    if (this.mesh) {
                        this.mesh.rotation.x = 0;
                        this.mesh.rotation.y = 0; // Reset Y rotation to face forward
                        this.camera.lookAt(this.mesh.position);
                    }
                    console.log('🎬 Intro animation completed - material facing forward');
                }
            }
            // Regular rotation (manual control - removed for cleaner UI)
            else if (this.mesh && this.isRotating) {
                this.mesh.rotation.y += this.rotationSpeed;
            }
            
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Smooth easing function for intro animation
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // Linear interpolation helper
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }

    // Start the smooth intro animation (only once per session)
    startIntroAnimation() {
        // Check if intro has already been played
        if (this.hasPlayedIntro) {
            // Skip animation, go directly to final position
            this.camera.position.set(this.introEndCameraPosition.x, this.introEndCameraPosition.y, this.introEndCameraPosition.z);
            this.camera.rotation.set(this.introEndRotation.x, this.introEndRotation.y, this.introEndRotation.z);
            console.log('⏭️ Skipping intro animation - already played once');
            return;
        }
        
        this.isIntroAnimating = true;
        this.introStartTime = Date.now();
        this.hasPlayedIntro = true; // Mark as played
        
        // Set initial camera position (behind plane, reversed)
        this.camera.position.set(this.introStartCameraPosition.x, this.introStartCameraPosition.y, this.introStartCameraPosition.z);
        this.camera.rotation.set(this.introStartRotation.x, this.introStartRotation.y, this.introStartRotation.z);
        
        console.log('🎬 Starting intro animation - camera will transition from behind plane to front...');
    }

    // Stop intro animation on user interaction
    stopIntroAnimation() {
        if (this.isIntroAnimating) {
            this.isIntroAnimating = false;
            this.introStartTime = null;
            
            // Set camera to final position
            this.camera.position.set(this.introEndCameraPosition.x, this.introEndCameraPosition.y, this.introEndCameraPosition.z);
            this.camera.rotation.set(0, 0, 0);
            if (this.mesh) {
                this.mesh.rotation.x = 0;
            }
            
            console.log('🎬 Intro animation stopped by user interaction');
        }
    }

    // Toggle rotation animation
    toggleRotation() {
        this.isRotating = !this.isRotating;
        console.log(`🔄 3D rotation ${this.isRotating ? 'enabled' : 'paused'}`);
        return this.isRotating;
    }

    // Set rotation state
    setRotation(enabled) {
        this.isRotating = enabled;
        console.log(`🔄 3D rotation ${this.isRotating ? 'enabled' : 'paused'}`);
        return this.isRotating;
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up resize timeout
        if (this._resizeTimeout) {
            cancelAnimationFrame(this._resizeTimeout);
            this._resizeTimeout = null;
        }

        // Clean up Three.js resources
        if (this.scene) {
            // Dispose of all geometries
            if (this.sphereGeometry) this.sphereGeometry.dispose();
            if (this.planeGeometry) this.planeGeometry.dispose();
            if (this.cubeGeometry) this.cubeGeometry.dispose();
            
            // Dispose of materials and their textures
            if (this.material) {
                if (this.material.map) this.material.map.dispose();
                if (this.material.normalMap) this.material.normalMap.dispose();
                if (this.material.displacementMap) this.material.displacementMap.dispose();
                if (this.material.metalnessMap) this.material.metalnessMap.dispose();
                if (this.material.roughnessMap) this.material.roughnessMap.dispose();
                if (this.material.aoMap) this.material.aoMap.dispose();
                this.material.dispose();
            }
        }

        // Clean up renderer and DOM
        if (this.renderer) {
            // Remove event listeners from renderer DOM element
            if (this.renderer.domElement) {
                this.renderer.domElement.removeEventListener('mousedown', this._onMouseDown);
                this.renderer.domElement.removeEventListener('mousemove', this._onMouseMove);
                this.renderer.domElement.removeEventListener('mouseup', this._onMouseUp);
                this.renderer.domElement.removeEventListener('touchstart', this._onTouchStart);
                this.renderer.domElement.removeEventListener('touchmove', this._onTouchMove);
                this.renderer.domElement.removeEventListener('touchend', this._onTouchEnd);
                this.renderer.domElement.removeEventListener('wheel', this._onWheel);
                
                if (this.container && this.renderer.domElement.parentNode) {
                    this.container.removeChild(this.renderer.domElement);
                }
            }
            
            this.renderer.dispose();
        }
        
        // Remove window resize listener and ResizeObserver
        if (this._onWindowResize) {
            window.removeEventListener('resize', this._onWindowResize);
            window.removeEventListener('orientationchange', this._onWindowResize);
        }
        
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        this.isInitialized = false;
        console.log('3D Material Viewer disposed with full cleanup');
    }
}

// Initialize the 3D viewer
window.materialViewer3D = new MaterialViewer3D();
