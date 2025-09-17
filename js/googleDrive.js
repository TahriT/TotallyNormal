/**
 * Google Drive Integration for TotallyNormal
 * Allows users to save their PBR texture projects to Google Drive
 */

class GoogleDriveManager {
    constructor() {
        this.isSignedIn = false;
        this.gapi = null;
        this.authInstance = null;
        
        // Google API configuration
        this.clientId = ''; // Will be set from config or user input
        this.apiKey = '';   // Will be set from config or user input
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        
        console.log('📂 Google Drive Manager initialized');
    }
    
    /**
     * Load Google API and initialize authentication
     */
    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            // Load the Google API script
            if (!window.gapi) {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    this.initializeGAPI().then(resolve).catch(reject);
                };
                script.onerror = () => reject(new Error('Failed to load Google API'));
                document.head.appendChild(script);
            } else {
                this.initializeGAPI().then(resolve).catch(reject);
            }
        });
    }
    
    /**
     * Initialize Google API client
     */
    async initializeGAPI() {
        await new Promise((resolve) => {
            window.gapi.load('client:auth2', resolve);
        });
        
        // For demo purposes, we'll use a simple configuration modal
        if (!this.clientId) {
            await this.showConfigModal();
        }
        
        await window.gapi.client.init({
            apiKey: this.apiKey,
            clientId: this.clientId,
            discoveryDocs: this.discoveryDocs,
            scope: this.scopes
        });
        
        this.authInstance = window.gapi.auth2.getAuthInstance();
        this.isSignedIn = this.authInstance.isSignedIn.get();
        
        console.log('✅ Google API initialized');
    }
    
    /**
     * Show configuration modal for API keys (for demo/development)
     */
    async showConfigModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal drive-config-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>🔧 Google Drive Setup</h3>
                    <p>To use Google Drive integration, you need to set up Google API credentials.</p>
                    
                    <div class="form-group">
                        <label>Google Client ID:</label>
                        <input type="text" id="clientId" placeholder="your-client-id.googleusercontent.com" />
                        <small>Get this from <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></small>
                    </div>
                    
                    <div class="form-group">
                        <label>Google API Key:</label>
                        <input type="text" id="apiKey" placeholder="your-api-key" />
                        <small>Create an API key with Drive API access</small>
                    </div>
                    
                    <div class="button-group">
                        <button id="saveConfig" class="btn btn-primary">Save & Continue</button>
                        <button id="skipConfig" class="btn btn-secondary">Skip (Demo Mode)</button>
                    </div>
                    
                    <div class="demo-info">
                        <p><strong>Demo Mode:</strong> Files will be downloaded locally instead of saved to Drive</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('saveConfig').onclick = () => {
                this.clientId = document.getElementById('clientId').value;
                this.apiKey = document.getElementById('apiKey').value;
                
                if (this.clientId && this.apiKey) {
                    localStorage.setItem('drive_client_id', this.clientId);
                    localStorage.setItem('drive_api_key', this.apiKey);
                    console.log('📝 Google Drive credentials saved');
                } else {
                    alert('Please provide both Client ID and API Key');
                    return;
                }
                
                document.body.removeChild(modal);
                resolve();
            };
            
            document.getElementById('skipConfig').onclick = () => {
                this.clientId = 'demo-mode';
                this.apiKey = 'demo-mode';
                console.log('📝 Using demo mode (local download)');
                document.body.removeChild(modal);
                resolve();
            };
            
            // Load saved credentials
            const savedClientId = localStorage.getItem('drive_client_id');
            const savedApiKey = localStorage.getItem('drive_api_key');
            if (savedClientId) document.getElementById('clientId').value = savedClientId;
            if (savedApiKey) document.getElementById('apiKey').value = savedApiKey;
        });
    }
    
    /**
     * Sign in to Google Drive
     */
    async signIn() {
        if (this.clientId === 'demo-mode') {
            console.log('📁 Demo mode - skipping Google authentication');
            this.isSignedIn = true;
            return true;
        }
        
        try {
            if (!this.authInstance) {
                await this.loadGoogleAPI();
            }
            
            if (!this.isSignedIn) {
                await this.authInstance.signIn();
                this.isSignedIn = this.authInstance.isSignedIn.get();
            }
            
            console.log('✅ Signed in to Google Drive');
            return true;
        } catch (error) {
            console.error('❌ Google Drive sign-in failed:', error);
            return false;
        }
    }
    
    /**
     * Create a folder in Google Drive
     */
    async createFolder(name, parentId = null) {
        if (this.clientId === 'demo-mode') {
            return 'demo-folder-id';
        }
        
        const metadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        if (parentId) {
            metadata.parents = [parentId];
        }
        
        const response = await window.gapi.client.drive.files.create({
            resource: metadata
        });
        
        return response.result.id;
    }
    
    /**
     * Upload a file to Google Drive
     */
    async uploadFile(name, content, mimeType, parentId = null) {
        if (this.clientId === 'demo-mode') {
            // In demo mode, trigger local download
            this.downloadFile(name, content, mimeType);
            return 'demo-file-id';
        }
        
        const metadata = {
            name: name
        };
        
        if (parentId) {
            metadata.parents = [parentId];
        }
        
        // Convert data URL to blob
        let blob;
        if (content.startsWith('data:')) {
            const response = await fetch(content);
            blob = await response.blob();
        } else {
            blob = new Blob([content], { type: mimeType });
        }
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` }),
            body: form
        });
        
        const result = await response.json();
        return result.id;
    }
    
    /**
     * Download file locally (fallback for demo mode)
     */
    downloadFile(name, content, mimeType) {
        const link = document.createElement('a');
        
        if (content.startsWith('data:')) {
            link.href = content;
        } else {
            const blob = new Blob([content], { type: mimeType });
            link.href = URL.createObjectURL(blob);
        }
        
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📥 Downloaded: ${name}`);
    }
    
    /**
     * Save complete PBR project to Google Drive
     */
    async savePBRProject(projectName, originalImage, textures) {
        try {
            console.log(`💾 Saving PBR project: ${projectName}`);
            
            // Ensure user is signed in
            const signedIn = await this.signIn();
            if (!signedIn) {
                throw new Error('Google Drive authentication failed');
            }
            
            // Create project folder
            const folderName = `${projectName} - PBR Textures`;
            const folderId = await this.createFolder(folderName);
            console.log(`📁 Created folder: ${folderName}`);
            
            // Upload original image
            if (originalImage) {
                await this.uploadFile(
                    'original-image.jpg',
                    originalImage,
                    'image/jpeg',
                    folderId
                );
                console.log('📷 Uploaded original image');
            }
            
            // Upload all texture maps
            const textureTypes = ['albedo', 'normal', 'height', 'metallic', 'roughness', 'occlusion'];
            const uploadPromises = textureTypes.map(async (type) => {
                if (textures[type]) {
                    const filename = `${projectName}-${type}.jpg`;
                    await this.uploadFile(filename, textures[type], 'image/jpeg', folderId);
                    console.log(`🖼️ Uploaded ${type} texture`);
                }
            });
            
            await Promise.all(uploadPromises);
            
            // Create project info file
            const projectInfo = {
                name: projectName,
                created: new Date().toISOString(),
                textures: textureTypes.filter(type => textures[type]),
                generator: 'TotallyNormal PBR Generator',
                version: '1.0'
            };
            
            await this.uploadFile(
                'project-info.json',
                JSON.stringify(projectInfo, null, 2),
                'application/json',
                folderId
            );
            
            console.log('✅ PBR project saved successfully!');
            
            if (this.clientId === 'demo-mode') {
                return {
                    success: true,
                    message: 'Project downloaded locally (Demo Mode)',
                    folderId: 'demo-mode'
                };
            } else {
                return {
                    success: true,
                    message: 'Project saved to Google Drive successfully!',
                    folderId: folderId,
                    folderUrl: `https://drive.google.com/drive/folders/${folderId}`
                };
            }
            
        } catch (error) {
            console.error('❌ Failed to save PBR project:', error);
            throw error;
        }
    }
}

// Initialize global instance
window.driveManager = new GoogleDriveManager();
