/**
 * Undo/Redo System for TotallyNormal
 * Tracks material property changes and seamless tiling operations
 */
class UndoRedoManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50; // Keep last 50 actions
        
        console.log('✅ Undo/Redo Manager initialized');
    }
    
    /**
     * Save current state to history
     * @param {Object} state - The state to save
     * @param {string} actionName - Description of the action
     */
    saveState(state, actionName = 'Change') {
        // Remove any states after current index (if we undid and then made a new change)
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Add new state with timestamp
        this.history.push({
            state: JSON.parse(JSON.stringify(state)), // Deep copy
            actionName: actionName,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
        
        console.log(`💾 Saved state: ${actionName} (${this.currentIndex + 1}/${this.history.length})`);
        
        // Update UI button states
        this.updateButtonStates();
    }
    
    /**
     * Undo to previous state
     * @returns {Object|null} The previous state or null if at beginning
     */
    undo() {
        if (!this.canUndo()) {
            console.warn('⚠️ Cannot undo: at beginning of history');
            return null;
        }
        
        this.currentIndex--;
        const state = this.history[this.currentIndex].state;
        const actionName = this.history[this.currentIndex].actionName;
        
        console.log(`↩️ Undo: ${actionName} (${this.currentIndex + 1}/${this.history.length})`);
        
        this.updateButtonStates();
        return JSON.parse(JSON.stringify(state)); // Return deep copy
    }
    
    /**
     * Redo to next state
     * @returns {Object|null} The next state or null if at end
     */
    redo() {
        if (!this.canRedo()) {
            console.warn('⚠️ Cannot redo: at end of history');
            return null;
        }
        
        this.currentIndex++;
        const state = this.history[this.currentIndex].state;
        const actionName = this.history[this.currentIndex].actionName;
        
        console.log(`↪️ Redo: ${actionName} (${this.currentIndex + 1}/${this.history.length})`);
        
        this.updateButtonStates();
        return JSON.parse(JSON.stringify(state)); // Return deep copy
    }
    
    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex > 0;
    }
    
    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        console.log('🗑️ History cleared');
        this.updateButtonStates();
    }
    
    /**
     * Get current state
     * @returns {Object|null}
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return JSON.parse(JSON.stringify(this.history[this.currentIndex].state));
        }
        return null;
    }
    
    /**
     * Get history info for debugging
     * @returns {Object}
     */
    getHistoryInfo() {
        return {
            total: this.history.length,
            current: this.currentIndex + 1,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            actions: this.history.map((h, i) => ({
                index: i,
                action: h.actionName,
                current: i === this.currentIndex
            }))
        };
    }
    
    /**
     * Update undo/redo button states in UI
     */
    updateButtonStates() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() 
                ? `Undo: ${this.history[this.currentIndex - 1]?.actionName || 'Previous action'}`
                : 'Nothing to undo';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() 
                ? `Redo: ${this.history[this.currentIndex + 1]?.actionName || 'Next action'}`
                : 'Nothing to redo';
        }
    }
}

// Export for use in other modules
window.UndoRedoManager = UndoRedoManager;
