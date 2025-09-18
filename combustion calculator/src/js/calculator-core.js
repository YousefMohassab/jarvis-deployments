// Main calculator orchestration and user interface management
class ThermodynamicsCalculatorCore {
    constructor() {
        this.validator = new InputValidator();
        this.chartUtils = new ChartUtils();
        this.results = {};
        this.isCalculating = false;
        
        this.initializeEventListeners();
        this.loadDefaultValues();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Calculate button
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.performCalculation();
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetCalculator();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Real-time validation on input change
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateSingleInput(input);
            });
        });
        
        // Preset composition selection
        this.addPresetSelectionHandlers();
    }
    
    // Load default values into form
    loadDefaultValues() {
        const defaults = {
            ch4: 95,
            c2h6: 3,
            c3h8: 1,
            c4h10: 0.5,
            co2: 0.5,
            fuelTemp: 25,
            airTemp: 25,
            pressure: 1.013,
            excessAir: 20,
            fuelFlow: 100,
            heatLoss: 5,
            stackTemp: 150
        };
        
        for (const [key, value] of Object.entries(defaults)) {
            const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) {
                element.value = value;
            }
        }
    }
    
    // Add preset composition selection handlers
    addPresetSelectionHandlers() {
        // Create preset selector if it doesn't exist
        const inputPanel = document.querySelector('.input-panel');
        const presetSelector = document.createElement('div');
        presetSelector.className = 'input-group';
        presetSelector.innerHTML = `
            <h3>Preset Compositions</h3>
            <select id="preset-selector">
                <option value="">Select a preset...</option>
                <option value="pipeline">Pipeline Natural Gas</option>
                <option value="high-methane">High Methane Gas</option>
                <option value="low-btu">Low BTU Gas</option>
            </select>
        `;
        
        inputPanel.insertBefore(presetSelector, inputPanel.firstChild.nextSibling);
        
        document.getElementById('preset-selector').addEventListener('change', (e) => {
            this.loadPresetComposition(e.target.value);
        });
    }
    
    // Load preset composition
    loadPresetComposition(presetName) {
        if (!presetName || !GAS_DATA.TYPICAL_COMPOSITIONS[presetName]) return;
        
        const composition = GAS_DATA.TYPICAL_COMPOSITIONS[presetName];
        
        document.getElementById('ch4').value = composition.CH4;
        document.getElementById('c2h6').value = composition.C2H6;
        document.getElementById('c3h8').value = composition.C3H8;
        document.getElementById('c4h10').value = composition.C4H10;
        document.getElementById('co2').value = composition.CO2;
    }
    
    // Collect input values from form
    collectInputs() {
        return {
            ch4: parseFloat(document.getElementById('ch4').value) || 0,
            c2h6: parseFloat(document.getElementById('c2h6').value) || 0,
            c3h8: parseFloat(document.getElementById('c3h8').value) || 0,
            c4h10: parseFloat(document.getElementById('c4h10').value) || 0,
            co2: parseFloat(document.getElementById('co2').value) || 0,
            fuelTemp: parseFloat(document.getElementById('fuel-temp').value) || 25,
            airTemp: parseFloat(document.getElementById('air-temp').value) || 25,
            pressure: parseFloat(document.getElementById('pressure').value) || 1.013,
            excessAir: parseFloat(document.getElementById('excess-air').value) || 20,
            fuelFlow: parseFloat(document.getElementById('fuel-flow').value) || 100,
            heatLoss: parseFloat(document.getElementById('heat-loss').value) || 5,
            stackTemp: parseFloat(document.getElementById('stack-temp').value) || 150
        };
    }
    
    // Validate single input field
    validateSingleInput(inputElement) {
        const value = parseFloat(inputElement.value);
        const id = inputElement.id;
        
        // Remove existing error styling
        inputElement.classList.remove('error', 'warning');
        
        // Basic validation
        if (isNaN(value)) {
            inputElement.classList.add('error');
            return false;
        }
        
        // Specific validations
        if (id.includes('temp') && (value < -50 || value > 2000)) {
            inputElement.classList.add('error');
            return false;
        }
        
        if (id === 'pressure' && (value < 0.1 || value > 100)) {
            inputElement.classList.add('error');
            return false;
        }
        
        if (id === 'excess-air' && (value < 0 || value > 500)) {
            inputElement.classList.add('error');
            return false;
        }
        
        // Warning conditions
        if (id === 'excess-air' && (value < 5 || value > 100)) {
            inputElement.classList.add('warning');
        }
        
        return true;
    }
    
    // Perform complete calculation
    async performCalculation() {
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showCalculationProgress(true);
        
        try {
            // Collect and validate inputs
            const rawInputs = this.collectInputs();
            const sanitizedInputs = this.validator.sanitizeInputs(rawInputs);
            
            // Validate inputs
            const validation = this.validator.validateInputs({
                composition: {
                    CH4: sanitizedInputs.composition.CH4,
                    C2H6: sanitizedInputs.composition.C2H6,
                    C3H8: sanitizedInputs.composition.C3H8,
                    C4H10: sanitizedInputs.composition.C4H10,
                    CO2: sanitizedInputs.composition.CO2
                },
                temperatures: sanitizedInputs.temperatures,
                pressure: sanitizedInputs.pressure,
                excessAir: sanitizedInputs.excessAir,
                fuelFlow: sanitizedInputs.fuelFlow,
                heatLoss: sanitizedInputs.heatLoss
            });
            
            if (!validation.isValid) {
                this.displayValidationErrors(validation);
                return;
            }
            
            // Show warnings if any
            if (validation.warnings.length > 0) {
                this.displayValidationWarnings(validation);
            }
            
            // Perform calculations
            await this.calculateResults(sanitizedInputs);
            
            // Display results
            this.displayResults();
            
            // Update charts
            this.updateCharts();
            
            this.showCalculationSuccess();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showCalculationError(error.message);
        } finally {
            this.isCalculating = false;
            this.showCalculationProgress(false);
        }
    }
    
    // Calculate all results
    async calculateResults(inputs) {
        // Initialize fuel properties
        const fuel = new GasProperties().setComposition(inputs.composition);
        
        // Operating conditions
        const operatingConditions = {
            fuelTemp: inputs.temperatures.fuel,
            airTemp: inputs.temperatures.air,
            stackTemp: inputs.temperatures.stack,
            pressure: inputs.pressure,
            excessAir: inputs.excessAir,
            fuelFlow: inputs.fuelFlow,
            heatLoss: inputs.heatLoss
        };
        
        // Combustion calculations
        const combustionCalc = new CombustionCalculator();
        const combustionResults = combustionCalc.initialize(inputs.composition, operatingConditions).getResults();
        
        // Thermodynamic calculations
        const thermodynamicsCalc = new ThermodynamicsCalculator();
        const thermodynamicsResults = thermodynamicsCalc.initialize(fuel, combustionResults, operatingConditions).getResults();
        
        // Heat transfer calculations
        const heatTransferCalc = new HeatTransferCalculator();
        const heatTransferResults = heatTransferCalc.initialize(combustionResults, thermodynamicsResults, operatingConditions).getResults();
        
        // Efficiency calculations
        const efficiencyCalc = new EfficiencyCalculator();
        const efficiencyResults = efficiencyCalc.initialize(fuel, combustionResults, thermodynamicsResults, operatingConditions).getResults();
        
        // Store results
        this.results = {
            fuel: fuel,
            combustion: combustionResults,
            thermodynamics: thermodynamicsResults,
            heatTransfer: heatTransferResults,
            efficiency: efficiencyResults,
            inputs: inputs,
            operatingConditions: operatingConditions
        };
    }
    
    // Display results in UI
    displayResults() {
        const r = this.results;
        
        // Combustion results
        document.getElementById('stoich-af-ratio').textContent = r.combustion.airFuelRatio.stoichiometric.toFixed(2);
        document.getElementById('actual-af-ratio').textContent = r.combustion.airFuelRatio.actual.toFixed(2);
        document.getElementById('air-flow-rate').textContent = r.combustion.flowRates.air.toFixed(1) + ' kg/h';
        document.getElementById('flue-gas-flow').textContent = r.combustion.flowRates.flueGas.toFixed(1) + ' kg/h';
        
        document.getElementById('flue-co2').textContent = r.combustion.flueGasComposition.CO2.toFixed(2) + ' %';
        document.getElementById('flue-o2').textContent = r.combustion.flueGasComposition.O2.toFixed(2) + ' %';
        document.getElementById('flue-n2').textContent = r.combustion.flueGasComposition.N2.toFixed(2) + ' %';
        document.getElementById('flue-h2o').textContent = r.combustion.flueGasComposition.H2O.toFixed(2) + ' %';
        
        // Thermodynamic results
        document.getElementById('lhv').textContent = r.thermodynamics.heatingValues.LHV.toFixed(2);
        document.getElementById('hhv').textContent = r.thermodynamics.heatingValues.HHV.toFixed(2);
        document.getElementById('flame-temp').textContent = r.thermodynamics.adiabaticFlameTemp.toFixed(0);
        document.getElementById('heat-released').textContent = r.thermodynamics.heatReleased.lhvBasis.toFixed(2);
        document.getElementById('cp-flue-gas').textContent = (r.thermodynamics.flueGasProperties.specificHeat / 1000).toFixed(2);
        document.getElementById('flue-gas-density').textContent = r.thermodynamics.flueGasProperties.density.toFixed(2);
        
        // Efficiency results
        document.getElementById('thermal-efficiency').textContent = r.efficiency.efficiencies.thermal.toFixed(1);
        document.getElementById('combustion-efficiency').textContent = r.efficiency.efficiencies.combustion.toFixed(1);
        document.getElementById('stack-loss').textContent = r.efficiency.losses.stack.toFixed(1);
        document.getElementById('radiation-loss').textContent = r.efficiency.losses.radiation.toFixed(1);
        document.getElementById('useful-heat').textContent = r.efficiency.usefulHeatOutput.toFixed(2);
        
        // Emissions results
        document.getElementById('co2-emissions').textContent = r.efficiency.emissions.co2Total.toFixed(1);
        document.getElementById('nox-emissions').textContent = r.thermodynamics.noxPotential.toFixed(0);
        document.getElementById('specific-co2').textContent = r.efficiency.emissions.co2Specific.toFixed(1);
    }
    
    // Update charts with new data
    updateCharts() {
        this.chartUtils.createDashboard(this.results);
    }
    
    // Display validation errors
    displayValidationErrors(validation) {
        const errorContainer = this.getOrCreateErrorContainer();
        errorContainer.innerHTML = '';
        errorContainer.className = 'validation-messages error';
        
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <h4>❌ Validation Errors:</h4>
            <ul>
                ${validation.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        errorContainer.appendChild(errorDiv);
        errorContainer.style.display = 'block';
    }
    
    // Display validation warnings
    displayValidationWarnings(validation) {
        const errorContainer = this.getOrCreateErrorContainer();
        const existingContent = errorContainer.innerHTML;
        
        const warningDiv = document.createElement('div');
        warningDiv.innerHTML = `
            <h4>⚠️ Warnings:</h4>
            <ul>
                ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
        `;
        
        if (existingContent) {
            errorContainer.appendChild(warningDiv);
        } else {
            errorContainer.innerHTML = '';
            errorContainer.className = 'validation-messages warning';
            errorContainer.appendChild(warningDiv);
            errorContainer.style.display = 'block';
        }
    }
    
    // Get or create error container
    getOrCreateErrorContainer() {
        let container = document.getElementById('validation-messages');
        if (!container) {
            container = document.createElement('div');
            container.id = 'validation-messages';
            container.className = 'validation-messages';
            
            const calculateBtn = document.getElementById('calculate-btn');
            calculateBtn.parentNode.insertBefore(container, calculateBtn);
        }
        return container;
    }
    
    // Show calculation progress
    showCalculationProgress(show) {
        const btn = document.getElementById('calculate-btn');
        if (show) {
            btn.textContent = 'Calculating...';
            btn.disabled = true;
        } else {
            btn.textContent = 'Calculate';
            btn.disabled = false;
        }
    }
    
    // Show calculation success
    showCalculationSuccess() {
        const container = this.getOrCreateErrorContainer();
        container.innerHTML = '<div class="success-message">✅ Calculation completed successfully!</div>';
        container.className = 'validation-messages success';
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }
    
    // Show calculation error
    showCalculationError(message) {
        const container = this.getOrCreateErrorContainer();
        container.innerHTML = `<div class="error-message">❌ Calculation failed: ${message}</div>`;
        container.className = 'validation-messages error';
        container.style.display = 'block';
    }
    
    // Switch result tabs
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Add active class to clicked button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }
    
    // Reset calculator to default values
    resetCalculator() {
        if (confirm('Are you sure you want to reset all inputs to default values?')) {
            this.loadDefaultValues();
            
            // Clear results
            this.clearResults();
            
            // Clear validation messages
            const container = document.getElementById('validation-messages');
            if (container) {
                container.style.display = 'none';
            }
            
            // Clear charts
            this.chartUtils.destroyAllCharts();
            
            // Reset preset selector
            document.getElementById('preset-selector').value = '';
        }
    }
    
    // Clear all result displays
    clearResults() {
        const resultElements = document.querySelectorAll('.result-item span');
        resultElements.forEach(element => {
            element.textContent = '-';
        });
    }
    
    // Export results as JSON
    exportResults() {
        if (!this.results || Object.keys(this.results).length === 0) {
            alert('No results to export. Please run a calculation first.');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            inputs: this.results.inputs,
            operatingConditions: this.results.operatingConditions,
            results: {
                combustion: this.results.combustion,
                thermodynamics: this.results.thermodynamics,
                efficiency: this.results.efficiency,
                heatTransfer: this.results.heatTransfer
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `thermodynamics-calculation-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new ThermodynamicsCalculatorCore();
    
    // Add export functionality
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Results';
    exportBtn.className = 'export-button';
    exportBtn.onclick = () => window.calculator.exportResults();
    
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.parentNode.insertBefore(exportBtn, resetBtn.nextSibling);
});