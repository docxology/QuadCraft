/**
 * Save/Load Controller
 * Handles saving and loading game state to/from localStorage and files
 */

const saveLoadController = {
    /**
     * Save current game state to localStorage
     * @param {string} name - Save slot name (1-9)
     */
    quicksave: function(name) {
        console.log('quicksave ' + name);
        const json = gameState.getStateJson();
        console.log(json);
        localStorage.setItem('quadcraft.quicksave.' + name, json);
        this.updateSaveLoadStatus('Saved to slot ' + name);
    },

    /**
     * Load game state from localStorage
     * @param {string} name - Save slot name (1-9)
     */
    quickload: function(name) {
        console.log('quickload ' + name);
        const json = localStorage.getItem('quadcraft.quicksave.' + name);
        console.log(json);
        if (json) {
            gameState.loadFromJson(json);
            this.updateSaveLoadStatus('Loaded from slot ' + name);
        } else {
            this.updateSaveLoadStatus('No save found in slot ' + name);
        }
    },

    /**
     * Delete all quicksaves from localStorage
     */
    deleteQuickSaves: function() {
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith('quadcraft.quicksave.')) {
                localStorage.removeItem(key);
                console.log('Deleted localStorage cookie: ' + key);
                i--; // Adjust index since keys shift after removal
            }
        }
        this.updateSaveLoadStatus('All quicksaves deleted');
    },

    /**
     * Save game state to a file
     */
    saveFile: function() {
        console.log('save file clicked');
        const filename = prompt('Filename?', 'quadcraft_quadgrid_' + this.getTimestamp() + '.json');
        if (filename) {
            const json = gameState.getStateJson();
            this.downloadFile(filename, 'application/json', json);
            this.updateSaveLoadStatus('Saved to file: ' + filename);
        }
    },

    /**
     * Handle file input change for loading
     * @param {Event} event - File input change event
     */
    openFile: function(event) {
        console.log('openFileInputClicked, event=', event);
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const json = e.target.result;
            gameState.loadFromJson(json);
            this.updateSaveLoadStatus('Loaded from file: ' + file.name);
        };
        reader.readAsText(file);
    },

    /**
     * Download a file with given content
     * @param {string} fileName - Name of file to download
     * @param {string} contentType - MIME type
     * @param {string} text - File content
     */
    downloadFile: function(fileName, contentType, text) {
        const blob = new Blob([text], { type: contentType });
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = fileName;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    },

    /**
     * Get current timestamp for filename
     * @returns {string} Timestamp string
     */
    getTimestamp: function() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    },

    /**
     * Update save/load status display
     * @param {string} message - Status message
     */
    updateSaveLoadStatus: function(message) {
        // Find or create status element
        let statusEl = document.getElementById('saveLoadStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'saveLoadStatus';
            statusEl.className = 'save-load-status';
            const saveLoadDiv = document.querySelector('.save-controls');
            if (saveLoadDiv) {
                saveLoadDiv.appendChild(statusEl);
            }
        }
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}; 