// Input validation and error handling
class InputValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validationRules = this.initializeValidationRules();
    }
    
    // Initialize validation rules
    initializeValidationRules() {
        return {
            composition: {
                min: 0,
                max: 100,
                totalMin: 95,
                totalMax: 105,
                requiredComponents: ['CH4']
            },
            temperature: {
                fuel: { min: -50, max: 200 },
                air: { min: -50, max: 500 },
                stack: { min: 50, max: 2000 }
            },
            pressure: {
                min: 0.1,
                max: 100
            },
            excessAir: {
                min: 0,
                max: 500,
                warning: { min: 5, max: 100 }
            },
            fuelFlow: {
                min: 0.1,
                max: 10000
            },
            heatLoss: {
                min: 0,
                max: 50,
                warning: { max: 20 }
            }
        };
    }
    
    // Validate all inputs
    validateInputs(inputs) {
        this.errors = [];
        this.warnings = [];
        
        this.validateComposition(inputs.composition);
        this.validateTemperatures(inputs.temperatures);
        this.validatePressure(inputs.pressure);
        this.validateExcessAir(inputs.excessAir);
        this.validateFuelFlow(inputs.fuelFlow);
        this.validateHeatLoss(inputs.heatLoss);
        this.validatePhysicalConsistency(inputs);
        
        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }
    
    // Validate fuel composition
    validateComposition(composition) {
        let total = 0;
        let hasMainComponent = false;
        
        for (const [component, value] of Object.entries(composition)) {
            // Check individual component ranges
            if (value < this.validationRules.composition.min) {
                this.errors.push(`${component} cannot be negative`);
            }
            
            if (value > this.validationRules.composition.max) {
                this.errors.push(`${component} cannot exceed 100%`);
            }
            
            // Check for required components
            if (component === 'CH4' && value > 0) {
                hasMainComponent = true;
            }
            
            if (component === 'CH4' && value < 50) {
                this.warnings.push('Methane content below 50% may affect calculation accuracy');
            }
            
            total += value;
        }
        
        // Check total composition
        if (total < this.validationRules.composition.totalMin) {
            this.errors.push(`Total composition is ${total.toFixed(1)}% - should be close to 100%`);
        }
        
        if (total > this.validationRules.composition.totalMax) {
            this.errors.push(`Total composition is ${total.toFixed(1)}% - should be close to 100%`);
        }
        
        if (!hasMainComponent) {
            this.errors.push('Methane (CH4) must be present in the fuel');
        }
    }
    
    // Validate temperature inputs
    validateTemperatures(temperatures) {
        const { fuel, air, stack } = temperatures;
        const rules = this.validationRules.temperature;
        
        // Fuel temperature
        if (fuel < rules.fuel.min || fuel > rules.fuel.max) {
            this.errors.push(`Fuel temperature must be between ${rules.fuel.min}°C and ${rules.fuel.max}°C`);
        }
        
        // Air temperature
        if (air < rules.air.min || air > rules.air.max) {
            this.errors.push(`Air temperature must be between ${rules.air.min}°C and ${rules.air.max}°C`);
        }
        
        // Stack temperature
        if (stack < rules.stack.min || stack > rules.stack.max) {
            this.errors.push(`Stack temperature must be between ${rules.stack.min}°C and ${rules.stack.max}°C`);
        }
        
        // Physical consistency checks
        if (stack <= Math.max(fuel, air)) {
            this.warnings.push('Stack temperature should be higher than fuel and air temperatures');
        }
        
        if (Math.abs(fuel - air) > 100) {
            this.warnings.push('Large temperature difference between fuel and air may affect calculations');
        }
    }
    
    // Validate pressure
    validatePressure(pressure) {
        const rules = this.validationRules.pressure;
        
        if (pressure < rules.min || pressure > rules.max) {
            this.errors.push(`Pressure must be between ${rules.min} and ${rules.max} bar`);
        }
        
        if (pressure < 0.9 || pressure > 1.2) {
            this.warnings.push('Pressure significantly different from atmospheric may affect accuracy');
        }
    }
    
    // Validate excess air
    validateExcessAir(excessAir) {
        const rules = this.validationRules.excessAir;
        
        if (excessAir < rules.min || excessAir > rules.max) {
            this.errors.push(`Excess air must be between ${rules.min}% and ${rules.max}%`);
        }
        
        if (excessAir < rules.warning.min) {
            this.warnings.push('Very low excess air may cause incomplete combustion');
        }
        
        if (excessAir > rules.warning.max) {
            this.warnings.push('High excess air will reduce efficiency');
        }
    }
    
    // Validate fuel flow rate
    validateFuelFlow(fuelFlow) {
        const rules = this.validationRules.fuelFlow;
        
        if (fuelFlow < rules.min || fuelFlow > rules.max) {
            this.errors.push(`Fuel flow rate must be between ${rules.min} and ${rules.max} kg/h`);
        }
        
        if (fuelFlow > 1000) {
            this.warnings.push('High fuel flow rate - verify industrial scale application');
        }
    }
    
    // Validate heat loss
    validateHeatLoss(heatLoss) {
        const rules = this.validationRules.heatLoss;
        
        if (heatLoss < rules.min || heatLoss > rules.max) {
            this.errors.push(`Heat loss must be between ${rules.min}% and ${rules.max}%`);
        }
        
        if (heatLoss > rules.warning.max) {
            this.warnings.push('High heat loss indicates poor insulation or design issues');
        }
    }
    
    // Validate physical consistency between inputs
    validatePhysicalConsistency(inputs) {
        const { temperatures, pressure, excessAir } = inputs;
        
        // Check if stack temperature is reasonable given excess air
        const minStackTemp = Math.max(temperatures.fuel, temperatures.air) + 50;
        if (temperatures.stack < minStackTemp) {
            this.warnings.push('Stack temperature may be too low for stable combustion');
        }
        
        // High excess air should correlate with higher stack temperature
        if (excessAir > 50 && temperatures.stack < 200) {
            this.warnings.push('High excess air typically results in higher stack temperature');
        }
        
        // Low excess air with high stack temperature
        if (excessAir < 10 && temperatures.stack > 500) {
            this.warnings.push('Low excess air with high stack temperature may indicate heat transfer issues');
        }
    }
    
    // Sanitize and format inputs
    sanitizeInputs(rawInputs) {
        const sanitized = {};
        
        // Composition - ensure numeric and within bounds
        sanitized.composition = {};
        const compComponents = ['CH4', 'C2H6', 'C3H8', 'C4H10', 'CO2'];
        
        for (const component of compComponents) {
            let value = parseFloat(rawInputs[component.toLowerCase()]) || 0;
            value = Math.max(0, Math.min(100, value));
            sanitized.composition[component] = value;
        }
        
        // Temperatures
        sanitized.temperatures = {
            fuel: this.sanitizeNumber(rawInputs.fuelTemp, -50, 200, 25),
            air: this.sanitizeNumber(rawInputs.airTemp, -50, 500, 25),
            stack: this.sanitizeNumber(rawInputs.stackTemp, 50, 2000, 150)
        };
        
        // Other parameters
        sanitized.pressure = this.sanitizeNumber(rawInputs.pressure, 0.1, 100, 1.013);
        sanitized.excessAir = this.sanitizeNumber(rawInputs.excessAir, 0, 500, 20);
        sanitized.fuelFlow = this.sanitizeNumber(rawInputs.fuelFlow, 0.1, 10000, 100);
        sanitized.heatLoss = this.sanitizeNumber(rawInputs.heatLoss, 0, 50, 5);
        
        return sanitized;
    }
    
    // Sanitize individual numeric value
    sanitizeNumber(value, min, max, defaultValue) {
        const parsed = parseFloat(value);
        
        if (isNaN(parsed)) {
            return defaultValue;
        }
        
        return Math.max(min, Math.min(max, parsed));
    }
    
    // Get validation status
    getValidationStatus() {
        return {
            hasErrors: this.errors.length > 0,
            hasWarnings: this.warnings.length > 0,
            errorCount: this.errors.length,
            warningCount: this.warnings.length
        };
    }
    
    // Format error messages for display
    formatErrorMessages() {
        const messages = [];
        
        if (this.errors.length > 0) {
            messages.push({
                type: 'error',
                title: 'Validation Errors:',
                items: this.errors
            });
        }
        
        if (this.warnings.length > 0) {
            messages.push({
                type: 'warning',
                title: 'Warnings:',
                items: this.warnings
            });
        }
        
        return messages;
    }
    
    // Check if inputs are within reasonable engineering ranges
    checkEngineeringReasonableness(inputs) {
        const issues = [];
        
        // Check for typical natural gas composition
        if (inputs.composition.CH4 < 80) {
            issues.push('Low methane content - verify fuel analysis');
        }
        
        // Check for realistic excess air levels
        if (inputs.excessAir < 5) {
            issues.push('Very low excess air may cause CO emissions');
        }
        
        if (inputs.excessAir > 100) {
            issues.push('Very high excess air will significantly reduce efficiency');
        }
        
        // Check stack temperature reasonableness
        const tempRise = inputs.temperatures.stack - Math.max(inputs.temperatures.fuel, inputs.temperatures.air);
        if (tempRise < 50) {
            issues.push('Low temperature rise suggests poor combustion or excessive heat transfer');
        }
        
        if (tempRise > 1000) {
            issues.push('High temperature rise suggests insufficient heat transfer or very high firing rate');
        }
        
        return issues;
    }
}

// Export for use in other modules
window.InputValidator = InputValidator;