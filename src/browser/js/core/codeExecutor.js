/**
 * Code Executor
 * Handles execution of custom JavaScript code in the game context
 */

const codeExecutor = {
    /**
     * Execute code from the textarea
     */
    evalCode: function() {
        const textArea = document.getElementById('textBoxToEval');
        if (!textArea) {
            console.error('Textarea not found');
            return;
        }

        const jsCode = textArea.value;
        console.log('Evaluating: ' + jsCode);
        
        try {
            // Create a safe execution context with access to game objects
            const result = this.executeInContext(jsCode);
            console.log('Returned: ' + result);
            this.showExecutionResult('Success: ' + result);
        } catch (error) {
            console.error('Code execution error:', error);
            this.showExecutionResult('Error: ' + error.message);
        }
    },

    /**
     * Execute code in a safe context with access to game objects
     * @param {string} code - JavaScript code to execute
     * @returns {*} Result of code execution
     */
    executeInContext: function(code) {
        // Create a context with access to game objects
        const context = {
            // Game state
            selq: gameState.selq,
            gridDots: gameState.QGridDots,
            playerPathDots: gameState.QDots,
            gameTriangles: gameState.gameTris,
            
            // Game functions
            fillGridByFunc: this.fillGridByFunc.bind(this),
            AddColoredDots: this.AddColoredDots.bind(this),
            gridDotsNear: this.gridDotsNear.bind(this),
            
            // Utility functions
            Q: (a, b, c, d) => new Quadray(a, b, c, d).dedup(),
            console: console,
            
            // Constants
            ROOT2: Math.SQRT2,
            S3: Math.sqrt(9 / 8)
        };

        // Execute the code in the context
        const func = new Function(...Object.keys(context), code);
        return func(...Object.values(context));
    },

    /**
     * Fill grid by function - ported from original code
     * @param {Quadray} centerQ - Center quadray
     * @param {number} hops - Number of hops outward
     * @param {Function} func - Function to determine if quadray should be filled
     * @returns {string} Result message
     */
    fillGridByFunc: function(centerQ, hops, func) {
        const gridQuadrays = this.gridDotsNear(centerQ, hops);
        let countOctYes = 0;
        let countOctNo = 0;
        let countTetZYes = 0;
        let countTetZNo = 0;
        let countTetCYes = 0;
        let countTetCNo = 0;

        for (let q of gridQuadrays) {
            if (func(q)) {
                gameState.toggleOctahedronAt(q);
                countOctYes++;
            } else {
                countOctNo++;
            }
            if (func(q)) {
                gameState.toggleTetrahedronZAt(q);
                countTetZYes++;
            } else {
                countTetZNo++;
            }
            if (func(q)) {
                gameState.toggleTetrahedronCAt(q);
                countTetCYes++;
            } else {
                countTetCNo++;
            }
        }

        return `fillGridByFunc matched ${countOctYes}/${countTetZYes}/${countTetCYes} of ${countOctYes + countOctNo}/${countTetZYes + countTetZNo}/${countTetCYes + countTetCNo} octahedrons/tetrahedronZs/tetrahedronCs`;
    },

    /**
     * Add colored dots - ported from original code
     * @param {Array} quadrays - Array of quadrays
     * @param {string} color - Color for the dots
     */
    AddColoredDots: function(quadrays, color) {
        for (let q of quadrays) {
            q.color = color;
            gameState.addDot(q);
        }
    },

    /**
     * Get grid dots near a center point - ported from original code
     * @param {Quadray} center - Center quadray
     * @param {number} hops - Number of hops outward
     * @returns {Array} Array of quadrays
     */
    gridDotsNear: function(center, hops) {
        const set = new Set();
        set.add(center);
        const directions = Object.values(CoreDirections);
        
        for (let h = 1; h <= hops; h++) {
            const setList = [...set.keys()];
            for (let q of setList) {
                for (let qDirection of directions) {
                    const q2 = q.add(qDirection);
                    set.add(q2);
                }
                if (set.size > 1000000) {
                    throw new Error('Too big, set.size=' + set.size);
                }
            }
        }
        return [...set];
    },

    /**
     * Show execution result in UI
     * @param {string} message - Result message
     */
    showExecutionResult: function(message) {
        // Find or create result element
        let resultEl = document.getElementById('codeExecutionResult');
        if (!resultEl) {
            resultEl = document.createElement('div');
            resultEl.id = 'codeExecutionResult';
            resultEl.className = 'code-execution-result';
            const codeSection = document.querySelector('.control-section:last-child');
            if (codeSection) {
                codeSection.appendChild(resultEl);
            }
        }
        resultEl.textContent = message;
        resultEl.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            resultEl.style.display = 'none';
        }, 5000);
    },

    /**
     * Load example code into textarea
     * @param {string} exampleName - Name of example to load
     */
    loadExample: function(exampleName) {
        const textArea = document.getElementById('textBoxToEval');
        if (!textArea) return;

        const examples = {
            'fillGrid': `fillGridByFunc(selq, 5, q=>{
    return q.toCartesian()[0]==0
});`,
            'randomFill': `fillGridByFunc(selq, 8, q=>{
    return Math.random()<.3;
});`,
            'negativeX': `fillGridByFunc(selq, 8, q=>{
    return q.toCartesian()[0]<0
});`,
            'addColoredDots': `AddColoredDots(gridDotsNear(selq,5),'green');`
        };

        if (examples[exampleName]) {
            textArea.value = examples[exampleName];
        }
    }
}; 