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
        this.currentGeometry = 'sphere';
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight = null;
        
        // Geometries
        this.sphereGeometry = null;
        this.planeGeometry = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('3D container not found:', containerId);
            return false;
        }

        try {
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0d0d1e);

            // Camera setup
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            this.camera.position.set(0, 0, 3);

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true 
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1;
            
            this.container.appendChild(this.renderer.domElement);

            // Lighting setup
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
        // Create both sphere and plane geometries
        this.sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
        this.planeGeometry = new THREE.PlaneGeometry(2, 2, 64, 64);
        
        // Create basic material (will be replaced when textures are loaded)
        this.material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.0,
            side: THREE.DoubleSide // Enable double-sided rendering
        });

        // Start with sphere geometry
        this.mesh = new THREE.Mesh(this.sphereGeometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    setupControls() {
        // Simple mouse controls for rotation
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            const deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    toRadians(deltaMove.y * 0.5),
                    toRadians(deltaMove.x * 0.5),
                    0,
                    'XYZ'
                ));

            this.mesh.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.mesh.quaternion);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Mouse wheel for zoom
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.camera.position.z += e.deltaY * zoomSpeed * 0.01;
            this.camera.position.z = Math.max(1.5, Math.min(10, this.camera.position.z));
        });

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

    resetCamera() {
        if (this.camera && this.mesh) {
            if (this.currentGeometry === 'plane') {
                this.camera.position.set(0, 0, 2);
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
            // Optional: slow auto-rotation
            if (this.mesh) {
                this.mesh.rotation.y += 0.005;
            }
            
            this.renderer.render(this.scene, this.camera);
        }
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
