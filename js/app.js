class LiveNormalApp {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.stream = null;
        this.currentMaterial = null;
        this.version = null;
        
        this.init();
    }

    async init() {
        await this.loadVersion();
        this.setupElements();
        this.setupEventListeners();
        this.showSection('capture');
        this.displayVersionInfo();
        this.updateHistoryDisplay();
    }

    setupElements() {
        // Video and canvas elements
        this.video = document.getElementById('videoPreview');
        this.canvas = document.getElementById('captureCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.capturedImage = document.getElementById('capturedImage');
        
        // Overlays
        this.cameraOverlay = document.getElementById('cameraOverlay');
        this.previewOverlay = document.getElementById('previewOverlay');
        
        // Buttons and controls
        this.startCameraBtn = document.getElementById('startCameraBtn');
        this.captureBtn = document.getElementById('captureBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imageUpload = document.getElementById('imageUpload');
        this.imageUrlInput = document.getElementById('imageUrlInput');
        this.loadUrlBtn = document.getElementById('loadUrlBtn');
        this.retakeBtn = document.getElementById('retakeBtn');
        this.processBtn = document.getElementById('processBtn');
        this.newMaterialBtn = document.getElementById('newMaterialBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        // this.saveToDriveBtn = document.getElementById('saveToDriveBtn'); // Google Drive feature paused
        
        // Status and modals
        this.status = document.getElementById('status');
        this.loadingModal = document.getElementById('loadingModal');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.progressFill = document.getElementById('progressFill');
        
        // Google Drive modal elements - PAUSED
        // this.driveModal = document.getElementById('driveModal');
        // this.projectNameInput = document.getElementById('projectName');
        // this.confirmSaveDriveBtn = document.getElementById('confirmSaveDrive');
        // this.closeDriveModalBtn = document.getElementById('closeDriveModal');
        // this.driveContent = document.getElementById('driveContent');
        // this.driveProgress = document.getElementById('driveProgress');
        // this.driveProgressText = document.getElementById('driveProgressText');
        // this.driveProgressFill = document.getElementById('driveProgressFill');
        
        // Navigation
        this.navButtons = document.querySelectorAll('.nav-btn');
        
        // Material preview elements
        this.materialPreview = document.getElementById('materialPreview');
        this.noMaterial = document.getElementById('noMaterial');
        this.materialName = document.getElementById('materialName');
        this.materialDate = document.getElementById('materialDate');
        
        // Texture preview elements
        this.textureElements = {
            albedo: document.getElementById('albedoPreview'),
            normal: document.getElementById('normalPreview'),
            height: document.getElementById('heightPreview'),
            metallic: document.getElementById('metallicPreview'),
            occlusion: document.getElementById('occlusionPreview'),
            roughness: document.getElementById('roughnessPreview')
        };
        
        // Download buttons
        this.downloadButtons = document.querySelectorAll('.download-btn');
        
        // 3D Viewer controls
        this.roughnessSlider = document.getElementById('roughnessSlider');
        this.metallicSlider = document.getElementById('metallicSlider');
        this.normalIntensity = document.getElementById('normalIntensity');
        this.aoIntensity = document.getElementById('aoIntensity');
        this.displacementScale = document.getElementById('displacementScale');
        this.resetCameraBtn = document.getElementById('resetCameraBtn');
        
        // Geometry toggle buttons
        this.sphereBtn = document.getElementById('sphereBtn');
        this.planeBtn = document.getElementById('planeBtn');
        
        // Material history elements
        this.materialHistory = document.getElementById('materialHistory');
        this.historyGrid = document.getElementById('historyGrid');
        this.historyCount = document.getElementById('historyCount');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Mobile capture button
        this.mobileCaptureArea = document.getElementById('mobileCaptureArea');
        this.mobileCaptureBtn = document.getElementById('mobileCaptureBtn');
        
        // Resolution selector
        this.resolutionSelect = document.getElementById('resolutionSelect');
        
        // Slider value displays
        this.roughnessValue = document.getElementById('roughnessValue');
        this.metallicValue = document.getElementById('metallicValue');
        this.normalValue = document.getElementById('normalValue');
        this.aoValue = document.getElementById('aoValue');
        this.displacementValue = document.getElementById('displacementValue');
        
        // Current captured image state
        this.capturedImageBlob = null;
        
        // Material history data (localStorage)
        this.materialHistoryData = this.loadMaterialHistory();
    }

    async loadVersion() {
        try {
            const response = await fetch('./version.json?t=' + Date.now()); // Cache bust
            this.version = await response.json();
            console.log(`🚀 TotallyNormal v${this.version.version} (${this.version.buildDate})`);
        } catch (error) {
            console.warn('Could not load version info:', error);
            this.version = { version: 'unknown', buildDate: 'unknown' };
        }
    }

    displayVersionInfo() {
        // Add version to footer or header
        const versionDisplay = document.createElement('div');
        versionDisplay.className = 'version-info';
        versionDisplay.innerHTML = `
            <span>v${this.version.version}</span>
            <span class="build-date">${this.version.buildDate}</span>
        `;
        
        // Add to header or create version indicator
        const header = document.querySelector('.header .container');
        if (header) {
            header.appendChild(versionDisplay);
        }
        
        // Check for version mismatches with texture generator
        // setTimeout(() => this.checkVersionConsistency(), 1000); // Disabled to prevent false positives
    }

    checkVersionConsistency() {
        if (window.textureGenerator && window.textureGenerator.version) {
            const textureGenVersion = window.textureGenerator.version;
            const appVersion = this.version.version;
            
            if (textureGenVersion !== appVersion) {
                console.warn(`⚠️ Version mismatch detected:`);
                console.warn(`   App: v${appVersion}`);
                console.warn(`   TextureGenerator: v${textureGenVersion}`);
                console.warn(`   Cache clear may be required`);
                
                // Show user notification for version mismatch
                this.showVersionMismatchWarning(appVersion, textureGenVersion);
            } else {
                console.log(`✅ Version consistency check passed: v${appVersion}`);
            }
        }
    }

    showVersionMismatchWarning(appVersion, textureVersion) {
        const warning = document.createElement('div');
        warning.className = 'version-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Version mismatch detected. Please clear your browser cache for optimal performance.</span>
                <button onclick="this.parentElement.parentElement.remove()" class="close-warning">×</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 10000);
    }

    setupEventListeners() {
        // Navigation
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
                this.setActiveNavButton(btn);
            });
        });

        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.handleCaptureButtonClick());
        this.uploadBtn.addEventListener('click', () => this.imageUpload.click());
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.loadUrlBtn.addEventListener('click', () => this.handleUrlLoad());
        this.imageUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUrlLoad();
            }
        });
        
        // Preview controls
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        this.processBtn.addEventListener('click', () => this.processCurrentImage());
        
        // Material controls
        this.newMaterialBtn.addEventListener('click', () => this.createNewMaterial());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllTextures());
        // this.saveToDriveBtn.addEventListener('click', () => this.showDriveSaveDialog()); // Google Drive feature paused
        
        // Google Drive modal controls - PAUSED
        // this.confirmSaveDriveBtn.addEventListener('click', () => this.saveToDrive());
        // this.closeDriveModalBtn.addEventListener('click', () => this.closeDriveModal());
        
        // Individual texture downloads
        this.downloadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const textureType = btn.dataset.texture;
                this.downloadTexture(textureType);
            });
        });
        
        // 3D Viewer controls
        this.roughnessSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.materialViewer3D?.updateRoughness(value);
            if (this.roughnessValue) this.roughnessValue.textContent = value.toFixed(2);
        });
        
        this.metallicSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.materialViewer3D?.updateMetalness(value);
            if (this.metallicValue) this.metallicValue.textContent = value.toFixed(2);
        });
        
        this.normalIntensity?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.materialViewer3D?.updateNormalIntensity(value);
            if (this.normalValue) this.normalValue.textContent = value.toFixed(1);
        });
        
        this.aoIntensity?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.materialViewer3D?.updateAOIntensity(value);
            if (this.aoValue) this.aoValue.textContent = value.toFixed(1);
        });
        
        this.displacementScale?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.materialViewer3D?.updateDisplacementScale(value);
            if (this.displacementValue) this.displacementValue.textContent = value.toFixed(2);
        });
        
        // Geometry toggle buttons
        this.sphereBtn?.addEventListener('click', () => {
            window.materialViewer3D?.switchGeometry('sphere');
            this.setActiveGeometryButton('sphere');
        });
        
        this.planeBtn?.addEventListener('click', () => {
            window.materialViewer3D?.switchGeometry('plane');
            this.setActiveGeometryButton('plane');
        });
        
        // Material history controls
        this.clearHistoryBtn?.addEventListener('click', () => this.clearMaterialHistory());
        
        // Mobile capture button
        this.mobileCaptureBtn?.addEventListener('click', () => this.handleCaptureButtonClick());
        
        this.resetCameraBtn?.addEventListener('click', () => {
            window.materialViewer3D?.resetCamera();
        });
        
        // Modal controls
        document.getElementById('closeErrorBtn').addEventListener('click', () => this.hideModal('errorModal'));
        
        // Click outside modal to close
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.hideModal('errorModal');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isVideoActive()) {
                e.preventDefault();
                this.capturePhoto();
            }
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Initialize 3D viewer when materials section is shown
        if (sectionId === 'materials' && !window.materialViewer3D.isInitialized) {
            setTimeout(() => {
                window.materialViewer3D.init('threejs-container');
            }, 100);
        }
        
        // Update page title
        const titles = {
            capture: 'Capture - TotallyNormal',
            materials: 'Materials - TotallyNormal',
            about: 'About - TotallyNormal'
        };
        document.title = titles[sectionId] || 'TotallyNormal - PBR Material Generator';
    }

    setActiveNavButton(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    async startCamera() {
        try {
            this.updateStatus('Requesting camera access...');
            
            // Stop existing stream if any
            if (this.stream) {
                this.stopCamera();
            }
            
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            this.video.onloadedmetadata = () => {
                this.setupCanvas();
                this.updateStatus('Camera ready! Click the capture button or press Space to take a photo');
                this.startCameraBtn.textContent = 'Stop Camera';
                this.startCameraBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
                this.captureBtn.style.display = 'block';
                
                // Show mobile capture button on mobile devices
                if (this.isMobileDevice()) {
                    this.showMobileCaptureButton();
                }
            };
            
        } catch (error) {
            console.error('Camera error:', error);
            let errorMsg = 'Could not access camera. ';
            
            if (error.name === 'NotAllowedError') {
                errorMsg += 'Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMsg += 'No camera found on this device.';
            } else {
                errorMsg += 'Please check your camera permissions.';
            }
            
            this.showError(errorMsg);
            this.updateStatus('Camera access failed. Try uploading an image instead.');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            this.startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> Start Camera';
            this.captureBtn.style.display = 'none';
            this.updateStatus('Camera stopped. Click "Start Camera" to begin again or upload an image.');
            
            // Hide mobile capture button
            this.hideMobileCaptureButton();
        }
    }

    handleCaptureButtonClick() {
        // If camera is not active, start it first
        if (!this.isVideoActive()) {
            this.startCamera();
        } else {
            // Camera is active, capture photo
            this.capturePhoto();
        }
    }

    setupCanvas() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }

    capturePhoto() {
        if (!this.isVideoActive()) {
            this.showError('Camera is not active. Please start the camera first.');
            return;
        }
        
        try {
            // Draw video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert to blob and show preview
            this.canvas.toBlob((blob) => {
                this.capturedImageBlob = blob;
                this.showCapturePreview(blob);
            }, 'image/jpeg', 0.9);
            
        } catch (error) {
            console.error('Capture error:', error);
            this.showError('Failed to capture photo. Please try again.');
        }
    }

    showCapturePreview(blob) {
        const imageUrl = URL.createObjectURL(blob);
        this.capturedImage.src = imageUrl;
        
        // Hide video and camera overlay
        this.video.style.display = 'none';
        this.cameraOverlay.style.display = 'none';
        
        // Show captured image and preview overlay
        this.capturedImage.style.display = 'block';
        this.previewOverlay.style.display = 'flex';
        
        this.updateStatus('Photo captured! Click "Generate PBR" to create materials or "Retake" to try again.');
    }

    retakePhoto() {
        // Hide preview elements
        this.capturedImage.style.display = 'none';
        this.previewOverlay.style.display = 'none';
        
        // Show camera elements
        this.video.style.display = 'block';
        this.cameraOverlay.style.display = 'flex';
        
        // Clean up
        if (this.capturedImage.src) {
            URL.revokeObjectURL(this.capturedImage.src);
        }
        this.capturedImageBlob = null;
        
        this.updateStatus('Camera ready! Click the capture button or press Space to take a photo');
    }

    async processCurrentImage() {
        if (!this.capturedImageBlob) {
            this.showError('No image to process. Please capture or upload an image first.');
            return;
        }
        
        await this.processImage(this.capturedImageBlob);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            this.showError('Image file is too large. Please select a smaller image.');
            return;
        }
        
        // Store the uploaded file and show preview
        this.capturedImageBlob = file;
        this.showUploadedImagePreview(file);
    }

    showUploadedImagePreview(file) {
        const imageUrl = URL.createObjectURL(file);
        this.capturedImage.src = imageUrl;
        
        // Hide video and camera overlay
        this.video.style.display = 'none';
        this.cameraOverlay.style.display = 'none';
        
        // Show captured image and preview overlay
        this.capturedImage.style.display = 'block';
        this.previewOverlay.style.display = 'flex';
        
        this.updateStatus('Image uploaded! Click "Generate PBR" to create materials or upload a different image.');
    }

    async handleUrlLoad() {
        const url = this.imageUrlInput?.value?.trim();
        if (!url) {
            this.showError('Please enter a valid image URL.');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (error) {
            this.showError('Please enter a valid URL.');
            return;
        }

        // Check if URL appears to be an image
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const urlLower = url.toLowerCase();
        const hasImageExtension = imageExtensions.some(ext => urlLower.includes(ext));
        
        if (!hasImageExtension && !url.includes('data:image/')) {
            const proceed = confirm('This URL may not be an image. Do you want to try loading it anyway?');
            if (!proceed) return;
        }

        try {
            this.updateStatus('Loading image from URL...');
            
            // Create an image element to test if the URL is valid
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for cross-origin images
            
            img.onload = () => {
                // Convert the image to a blob
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        this.capturedImageBlob = blob;
                        this.showUploadedImagePreview(blob);
                        this.imageUrlInput.value = ''; // Clear the input
                    } else {
                        this.showError('Failed to process the image from URL.');
                    }
                }, 'image/jpeg', 0.9);
            };
            
            img.onerror = () => {
                this.showError('Failed to load image from URL. Please check the URL and try again.');
                this.updateStatus('URL load failed. Try uploading an image file instead.');
            };
            
            img.src = url;
            
        } catch (error) {
            console.error('URL load error:', error);
            this.showError('Failed to load image from URL. Please try again.');
        }
    }

    async processImage(imageSource) {
        // Prevent multiple simultaneous processing
        if (this._isProcessingImage) {
            console.warn('⚠️ Image processing already in progress');
            return;
        }
        
        this._isProcessingImage = true;
        
        try {
            this.showModal('loadingModal');
            this.updateProgress(0);
            
            // Get selected resolution
            const selectedResolution = parseInt(this.resolutionSelect?.value || '512');
            console.log(`🎯 Processing with resolution: ${selectedResolution}x${selectedResolution}`);
            
            // Create image element from source
            const img = new Image();
            const imageUrl = URL.createObjectURL(imageSource);
            
            img.onload = async () => {
                try {
                    // Generate PBR textures with progress updates and selected resolution
                    this.updateProgress(20);
                    await this.delay(100); // Small delay for UI update
                    
                    const textures = await window.textureGenerator.generatePBRTextures(img, selectedResolution);
                    
                    this.updateProgress(90);
                    await this.delay(100);
                    
                    // Store current material
                    this.currentMaterial = {
                        id: Date.now(),
                        name: `Material_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`,
                        date: new Date().toISOString(),
                        resolution: selectedResolution,
                        textures: textures
                    };
                    
                    // Add to history immediately
                    this.addToMaterialHistory(this.currentMaterial);
                    
                    this.updateProgress(100);
                    await this.delay(200);
                    
                    // Show results (don't add to history again)
                    this.displayMaterial(null, false);
                    this.hideModal('loadingModal');
                    this.showSection('materials');
                    this.setActiveNavButton(document.querySelector('[data-section="materials"]'));
                    
                    URL.revokeObjectURL(imageUrl);
                    this._isProcessingImage = false;
                    
                } catch (error) {
                    console.error('Texture generation error:', error);
                    this.hideModal('loadingModal');
                    this.showError(`Failed to generate PBR textures: ${error.message || 'Unknown error'}`);
                    URL.revokeObjectURL(imageUrl);
                    this._isProcessingImage = false;
                }
            };
            
            img.onerror = () => {
                this.hideModal('loadingModal');
                this.showError('Failed to load the image. Please try again.');
                URL.revokeObjectURL(imageUrl);
                this._isProcessingImage = false;
            };
            
            img.src = imageUrl;
            
        } catch (error) {
            console.error('Image processing error:', error);
            this.hideModal('loadingModal');
            this.showError('Failed to process the image. Please try again.');
            this._isProcessingImage = false;
        }
    }

    displayMaterial(material = null, addToHistory = true) {
        // Use provided material or current material
        const materialToDisplay = material || this.currentMaterial;
        if (!materialToDisplay) return;
        
        // If a new material is provided, set it as current and optionally add to history
        if (material && material !== this.currentMaterial) {
            this.currentMaterial = material;
            if (addToHistory) {
                this.addToMaterialHistory(material);
            }
        }
        
        // Update material info
        this.materialName.textContent = materialToDisplay.name;
        const dateSpan = this.materialDate.querySelector('span');
        if (dateSpan) {
            const date = materialToDisplay.date ? new Date(materialToDisplay.date) : (materialToDisplay.created || new Date());
            dateSpan.textContent = date.toLocaleString();
        }
        
        // Update texture previews
        Object.entries(materialToDisplay.textures).forEach(([type, dataUrl]) => {
            if (this.textureElements[type]) {
                this.textureElements[type].src = dataUrl;
                this.textureElements[type].alt = `${type} texture`;
            }
        });
        
        // Show material preview, hide no-material message
        this.materialPreview.style.display = 'block';
        this.noMaterial.style.display = 'none';
        
        // Initialize 3D viewer if not already done
        if (!window.materialViewer3D.isInitialized) {
            window.materialViewer3D.init('threejs-container');
        }
        
        // Load textures into 3D viewer
        if (window.materialViewer3D && window.materialViewer3D.isInitialized) {
            window.materialViewer3D.loadMaterial(materialToDisplay.textures);
        }
        
        // Add fade-in animation
        this.materialPreview.classList.add('fade-in');
        
        console.log('✅ Material displayed:', materialToDisplay.name);
    }

    downloadTexture(textureType) {
        if (!this.currentMaterial || !this.currentMaterial.textures[textureType]) {
            this.showError('Texture not available for download.');
            return;
        }
        
        const link = document.createElement('a');
        link.href = this.currentMaterial.textures[textureType];
        link.download = `${this.currentMaterial.name}_${textureType}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async downloadAllTextures() {
        if (!this.currentMaterial) {
            this.showError('No material available for download.');
            return;
        }
        
        try {
            this.showModal('loadingModal');
            this.updateProgress(0);
            
            const zip = new JSZip();
            const folder = zip.folder(this.currentMaterial.name);
            
            let progress = 0;
            const totalTextures = Object.keys(this.currentMaterial.textures).length;
            
            // Add each texture to the zip
            for (const [type, dataUrl] of Object.entries(this.currentMaterial.textures)) {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                folder.file(`${this.currentMaterial.name}_${type}.jpg`, blob);
                
                progress++;
                this.updateProgress((progress / totalTextures) * 80);
            }
            
            // Add material info file
            const materialInfo = {
                name: this.currentMaterial.name,
                created: this.currentMaterial.created.toISOString(),
                generator: 'Live Normal Web',
                textures: Object.keys(this.currentMaterial.textures)
            };
            
            folder.file('material_info.json', JSON.stringify(materialInfo, null, 2));
            
            this.updateProgress(90);
            
            // Generate and download zip
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            this.updateProgress(100);
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${this.currentMaterial.name}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            this.hideModal('loadingModal');
            
        } catch (error) {
            console.error('Download error:', error);
            this.hideModal('loadingModal');
            this.showError('Failed to create download package. Please try downloading textures individually.');
        }
    }

    createNewMaterial() {
        this.currentMaterial = null;
        this.materialPreview.style.display = 'none';
        this.noMaterial.style.display = 'block';
        
        // Reset capture state
        this.retakePhoto();
        
        this.showSection('capture');
        this.setActiveNavButton(document.querySelector('[data-section="capture"]'));
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isVideoActive() {
        return this.stream && this.video.srcObject && !this.video.paused;
    }

    updateStatus(message) {
        this.status.innerHTML = `<p>${message}</p>`;
    }

    updateProgress(percent) {
        if (this.progressFill) {
            this.progressFill.style.width = `${percent}%`;
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
        if (modalId === 'loadingModal') {
            this.updateProgress(0);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.showModal('errorModal');
    }

    // Google Drive functionality
    // Google Drive functionality - PAUSED
    /*
    showDriveSaveDialog() {
        if (!this.currentMaterial) {
            this.showError('No material to save. Please generate textures first.');
            return;
        }

        // Generate default project name based on current date
        const now = new Date();
        const defaultName = `PBR Material ${now.toLocaleDateString().replace(/\//g, '-')}`;
        this.projectNameInput.value = defaultName;
        
        // Show the modal
        this.showModal('driveModal');
    }
    
    closeDriveModal() {
        this.hideModal('driveModal');
        this.driveContent.style.display = 'block';
        this.driveProgress.style.display = 'none';
    }
    
    async saveToDrive() {
        const projectName = this.projectNameInput.value.trim();
        
        if (!projectName) {
            alert('Please enter a project name');
            return;
        }
        
        if (!this.currentMaterial) {
            this.showError('No material to save');
            return;
        }
        
        try {
            // Show progress
            this.driveContent.style.display = 'none';
            this.driveProgress.style.display = 'block';
            this.updateDriveProgress(0, 'Initializing Google Drive...');
            
            // Initialize Google Drive if not already done
            if (!window.driveManager) {
                throw new Error('Google Drive manager not initialized');
            }
            
            this.updateDriveProgress(20, 'Authenticating with Google...');
            
            // Get original image data
            let originalImage = null;
            if (this.capturedImageData) {
                originalImage = this.capturedImageData;
            }
            
            this.updateDriveProgress(40, 'Preparing files...');
            
            // Save to Google Drive
            const result = await window.driveManager.savePBRProject(
                projectName,
                originalImage,
                this.currentMaterial.textures
            );
            
            this.updateDriveProgress(100, 'Upload complete!');
            
            // Show success message
            setTimeout(() => {
                this.closeDriveModal();
                
                if (result.folderUrl) {
                    // Show success with link to Google Drive
                    const successModal = document.createElement('div');
                    successModal.className = 'modal';
                    successModal.innerHTML = `
                        <div class="modal-content">
                            <i class="fas fa-check-circle success-icon"></i>
                            <h3>Saved to Google Drive!</h3>
                            <p>Your PBR project "<strong>${projectName}</strong>" has been saved successfully.</p>
                            <div class="button-group">
                                <a href="${result.folderUrl}" target="_blank" class="btn btn-primary">
                                    <i class="fab fa-google-drive"></i>
                                    View in Drive
                                </a>
                                <button onclick="document.body.removeChild(this.closest('.modal'))" class="btn btn-secondary">
                                    Close
                                </button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(successModal);
                } else {
                    // Demo mode message
                    alert('Project files downloaded successfully! (Demo Mode)');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Failed to save to Google Drive:', error);
            this.updateDriveProgress(0, 'Upload failed');
            
            setTimeout(() => {
                this.closeDriveModal();
                this.showError(`Failed to save to Google Drive: ${error.message}`);
            }, 2000);
        }
    }
    
    updateDriveProgress(percent, message) {
        this.driveProgressFill.style.width = `${percent}%`;
        this.driveProgressText.textContent = message;
    }
    */ // End Google Drive functionality

    // Mobile UI Methods
    isMobileDevice() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    showMobileCaptureButton() {
        if (this.mobileCaptureArea) {
            this.mobileCaptureArea.style.display = 'block';
            // Add mobile mode class to camera container
            const cameraContainer = document.querySelector('.camera-container');
            if (cameraContainer) {
                cameraContainer.classList.add('mobile-mode');
            }
        }
    }
    
    hideMobileCaptureButton() {
        if (this.mobileCaptureArea) {
            this.mobileCaptureArea.style.display = 'none';
            // Remove mobile mode class
            const cameraContainer = document.querySelector('.camera-container');
            if (cameraContainer) {
                cameraContainer.classList.remove('mobile-mode');
            }
        }
    }

    // Geometry Toggle Methods
    setActiveGeometryButton(geometryType) {
        // Remove active class from all geometry buttons
        if (this.sphereBtn) this.sphereBtn.classList.remove('active');
        if (this.planeBtn) this.planeBtn.classList.remove('active');
        
        // Add active class to selected button
        if (geometryType === 'sphere' && this.sphereBtn) {
            this.sphereBtn.classList.add('active');
        } else if (geometryType === 'plane' && this.planeBtn) {
            this.planeBtn.classList.add('active');
        }
    }

    // Material History Methods
    loadMaterialHistory() {
        try {
            const history = localStorage.getItem('totallyNormalHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.warn('Failed to load material history:', error);
            return [];
        }
    }
    
    saveMaterialHistory() {
        try {
            localStorage.setItem('totallyNormalHistory', JSON.stringify(this.materialHistoryData));
        } catch (error) {
            console.warn('Failed to save material history:', error);
        }
    }
    
    addToMaterialHistory(material) {
        const historyItem = {
            id: Date.now() + Math.random(), // Unique ID
            name: material.name || 'Material',
            date: material.date || new Date().toISOString(),
            thumbnail: material.textures.albedo || material.textures.normal, // Use albedo or normal as thumbnail
            textures: { ...material.textures } // Copy all textures
        };
        
        // Add to beginning of array
        this.materialHistoryData.unshift(historyItem);
        
        // Limit history to 20 items
        if (this.materialHistoryData.length > 20) {
            this.materialHistoryData = this.materialHistoryData.slice(0, 20);
        }
        
        this.saveMaterialHistory();
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        if (!this.historyGrid || !this.historyCount) return;
        
        // Show/hide history section
        if (this.materialHistoryData.length > 0) {
            this.materialHistory.style.display = 'block';
            this.historyCount.textContent = `${this.materialHistoryData.length} material${this.materialHistoryData.length === 1 ? '' : 's'} saved`;
            
            // Generate history grid HTML
            this.historyGrid.innerHTML = this.materialHistoryData.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <img src="${item.thumbnail}" alt="${item.name}" class="history-thumbnail">
                    <div class="history-info">
                        <div class="history-name">${item.name}</div>
                        <div class="history-date">${this.formatDate(item.date)}</div>
                    </div>
                    <button class="history-delete" onclick="event.stopPropagation(); window.liveNormalApp.removeFromHistory('${item.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            // Add click listeners to history items
            this.historyGrid.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    this.loadMaterialFromHistory(id);
                });
            });
        } else {
            this.materialHistory.style.display = 'none';
        }
    }
    
    loadMaterialFromHistory(id) {
        const historyItem = this.materialHistoryData.find(item => item.id == id);
        if (!historyItem) return;
        
        // Create material object
        const material = {
            name: historyItem.name,
            date: historyItem.date,
            textures: historyItem.textures
        };
        
        // Load the material
        this.currentMaterial = material;
        this.displayMaterial(material);
        
        // Switch to materials section
        this.showSection('materials');
        this.setActiveNavButton(document.querySelector('[data-section="materials"]'));
    }
    
    removeFromHistory(id) {
        this.materialHistoryData = this.materialHistoryData.filter(item => item.id != id);
        this.saveMaterialHistory();
        this.updateHistoryDisplay();
    }
    
    clearMaterialHistory() {
        if (confirm('Are you sure you want to clear all material history? This cannot be undone.')) {
            this.materialHistoryData = [];
            this.saveMaterialHistory();
            this.updateHistoryDisplay();
        }
    }
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Unknown date';
        }
    }

    // Cleanup method
    destroy() {
        this.stopCamera();
        
        // Clean up any object URLs
        if (this.currentMaterial) {
            Object.values(this.currentMaterial.textures).forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.liveNormalApp = new LiveNormalApp();
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed');
            });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.liveNormalApp) {
        window.liveNormalApp.destroy();
    }
});
