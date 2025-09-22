class MaterialViewer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.material = null;
        this.controls = null;
        this.container = null;
        this.animationId = null;
        this.isInitialized = false;
        this.currentGeometry = 'plane'; // Default geometry - changed to plane
        this.rotationSpeed = 0.005;
        this.isRotating = false; // Always start paused
        
        // Intro animation properties
        this.isIntroAnimating = false;
        this.introStartTime = null;
        this.introDuration = 6000; // 6 seconds for slow, smooth transition
        this.introStartCameraPosition = { x: 0, y: 8, z: 2 }; // Top-down view
        this.introEndCameraPosition = { x: 0, y: 0, z: 3.5 }; // Front view
        this.introStartRotation = { x: -Math.PI/2, y: 0, z: 0 }; // Looking down
        this.introEndRotation = { x: 0, y: 0, z: 0 }; // Normal view
        
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
            this.setupControls();

            // Handle resize
            this.setupResizeHandler();

            // Start render loop
            this.animate();

            this.isInitialized = true;
            console.log('3D Material Viewer initialized successfully');
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

        // Start with cube geometry
        this.mesh = new THREE.Mesh(this.cubeGeometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    setupControls() {
        // Mouse controls for desktop
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Stop intro animation on user interaction
            if (this.isIntroAnimating) {
                this.stopIntroAnimation();
            }
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.handleRotation(e.clientX, e.clientY, previousMousePosition);
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch controls for mobile
        let isTouching = false;
        let previousTouchPosition = { x: 0, y: 0 };
        let touchStartDistance = 0;
        let initialCameraZ = this.camera.position.z;

        this.renderer.domElement.addEventListener('touchstart', (e) => {
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
        });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
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
                
                if (touchStartDistance > 0) {
                    const zoomFactor = touchStartDistance / currentDistance;
                    this.camera.position.z = Math.max(1.5, Math.min(10, initialCameraZ * zoomFactor));
                }
            }
        });

        this.renderer.domElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            isTouching = false;
            touchStartDistance = 0;
        });

        // Mouse wheel for zoom (desktop)
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.camera.position.z += e.deltaY * zoomSpeed * 0.01;
            this.camera.position.z = Math.max(1.5, Math.min(10, this.camera.position.z));
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

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            if (!this.container || !this.renderer || !this.camera) return;

            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
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

        // Create and apply new material
        const newMaterial = new THREE.MeshStandardMaterial({
            ...materialConfig,
            side: THREE.DoubleSide // Enable double-sided rendering for plane geometry
        });
        this.mesh.material.dispose(); // Clean up old material
        this.mesh.material = newMaterial;
        this.material = newMaterial;

        console.log('Material textures applied successfully');
        
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
        
        // Remove old mesh
        this.scene.remove(this.mesh);
        
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
                    
                    // Smooth camera position transition
                    this.camera.position.x = this.lerp(this.introStartCameraPosition.x, this.introEndCameraPosition.x, progress);
                    this.camera.position.y = this.lerp(this.introStartCameraPosition.y, this.introEndCameraPosition.y, progress);
                    this.camera.position.z = this.lerp(this.introStartCameraPosition.z, this.introEndCameraPosition.z, progress);
                    
                    // Smooth camera rotation
                    this.camera.rotation.x = this.lerp(this.introStartRotation.x, this.introEndRotation.x, progress);
                    
                    // Gentle Y-axis rotation for the mesh
                    if (this.mesh) {
                        this.mesh.rotation.y += 0.002; // Very subtle rotation
                        this.mesh.rotation.x = this.lerp(this.introStartRotation.x, this.introEndRotation.x, progress) * 0.3; // Subtle tilt
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

    // Start the smooth intro animation
    startIntroAnimation() {
        this.isIntroAnimating = true;
        this.introStartTime = Date.now();
        
        // Set initial camera position (top-down view)
        this.camera.position.set(this.introStartCameraPosition.x, this.introStartCameraPosition.y, this.introStartCameraPosition.z);
        this.camera.rotation.set(this.introStartRotation.x, this.introStartRotation.y, this.introStartRotation.z);
        
        console.log('🎬 Starting smooth intro animation with camera transition...');
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

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        if (this.material) {
            this.material.dispose();
        }

        this.isInitialized = false;
    }
}

// Initialize the 3D viewer
window.materialViewer3D = new MaterialViewer3D();
