// Gas property database and calculation functions
const GAS_DATA = {
    // Typical natural gas compositions
    TYPICAL_COMPOSITIONS: {
        'Pipeline Natural Gas': {
            CH4: 95.0, C2H6: 3.0, C3H8: 1.0, C4H10: 0.5, CO2: 0.5
        },
        'High Methane': {
            CH4: 98.0, C2H6: 1.0, C3H8: 0.5, C4H10: 0.2, CO2: 0.3
        },
        'Low BTU': {
            CH4: 85.0, C2H6: 8.0, C3H8: 4.0, C4H10: 2.0, CO2: 1.0
        }
    },
    
    // Combustion reaction coefficients
    // CₓHᵧ + (x + y/4)O₂ → xCO₂ + (y/2)H₂O
    COMBUSTION_COEFFICIENTS: {
        CH4: { C: 1, H: 4, O2_req: 2, CO2_prod: 1, H2O_prod: 2 },
        C2H6: { C: 2, H: 6, O2_req: 3.5, CO2_prod: 2, H2O_prod: 3 },
        C3H8: { C: 3, H: 8, O2_req: 5, CO2_prod: 3, H2O_prod: 4 },
        C4H10: { C: 4, H: 10, O2_req: 6.5, CO2_prod: 4, H2O_prod: 5 }
    },
    
    // NOx formation temperature thresholds (°C)
    NOX_THRESHOLDS: {
        THERMAL_NOX_THRESHOLD: 1300,
        PROMPT_NOX_THRESHOLD: 800
    }
};

// Calculate gas properties based on composition
class GasProperties {
    constructor() {
        this.composition = {};
        this.molarMass = 0;
        this.density = 0;
    }
    
    // Set gas composition and calculate derived properties
    setComposition(comp) {
        // Normalize composition to 100%
        const total = Object.values(comp).reduce((sum, val) => sum + val, 0);
        this.composition = {};
        
        for (const [component, fraction] of Object.entries(comp)) {
            this.composition[component] = (fraction / total) * 100;
        }
        
        this.calculateMolarMass();
        return this;
    }
    
    // Calculate average molecular weight
    calculateMolarMass() {
        let totalMass = 0;
        let totalMoles = 0;
        
        for (const [component, moleFraction] of Object.entries(this.composition)) {
            if (CONSTANTS.MOLECULAR_WEIGHTS[component]) {
                const moles = moleFraction / 100;
                totalMoles += moles;
                totalMass += moles * CONSTANTS.MOLECULAR_WEIGHTS[component];
            }
        }
        
        this.molarMass = totalMass / totalMoles;
        return this.molarMass;
    }
    
    // Calculate gas density at given conditions
    calculateDensity(temperature, pressure) {
        // Using ideal gas law: ρ = PM/(RT)
        const tempK = temperature + CONSTANTS.CONVERSIONS.C_TO_K;
        const pressurePa = pressure * CONSTANTS.CONVERSIONS.BAR_TO_PA;
        
        this.density = (pressurePa * this.molarMass) / (CONSTANTS.R_UNIVERSAL * tempK);
        return this.density;
    }
    
    // Calculate heating values (LHV and HHV)
    calculateHeatingValues() {
        let lhv = 0;
        let hhv = 0;
        let totalMass = 0;
        
        for (const [component, moleFraction] of Object.entries(this.composition)) {
            if (CONSTANTS.HEATING_VALUES[component]) {
                const mass = (moleFraction / 100) * CONSTANTS.MOLECULAR_WEIGHTS[component];
                totalMass += mass;
                
                lhv += mass * CONSTANTS.HEATING_VALUES[component].LHV;
                hhv += mass * CONSTANTS.HEATING_VALUES[component].HHV;
            }
        }
        
        return {
            LHV: lhv / totalMass,
            HHV: hhv / totalMass
        };
    }
    
    // Calculate specific heat capacity at given temperature
    calculateSpecificHeat(temperature) {
        const tempK = temperature + CONSTANTS.CONVERSIONS.C_TO_K;
        let cpTotal = 0;
        let totalMoles = 0;
        
        for (const [component, moleFraction] of Object.entries(this.composition)) {
            if (CONSTANTS.CP_COEFFICIENTS[component]) {
                const coeff = CONSTANTS.CP_COEFFICIENTS[component];
                const moles = moleFraction / 100;
                
                // Calculate Cp using polynomial equation
                const cp = coeff.a + coeff.b * tempK + 
                          coeff.c * Math.pow(tempK, 2) + 
                          coeff.d * Math.pow(tempK, 3);
                
                cpTotal += moles * cp;
                totalMoles += moles;
            }
        }
        
        // Convert from J/mol·K to J/kg·K
        const cpMolar = cpTotal / totalMoles;
        return (cpMolar * 1000) / this.molarMass; // J/kg·K
    }
    
    // Get stoichiometric oxygen requirement
    getStoichiometricOxygen() {
        let oxygenRequired = 0;
        
        for (const [component, moleFraction] of Object.entries(this.composition)) {
            if (GAS_DATA.COMBUSTION_COEFFICIENTS[component]) {
                const coeff = GAS_DATA.COMBUSTION_COEFFICIENTS[component];
                oxygenRequired += (moleFraction / 100) * coeff.O2_req;
            }
        }
        
        return oxygenRequired;
    }
    
    // Get stoichiometric air requirement
    getStoichiometricAir() {
        const oxygenRequired = this.getStoichiometricOxygen();
        // Air contains 21% oxygen by volume
        return oxygenRequired / 0.21;
    }
    
    // Calculate products of combustion
    getCombustionProducts() {
        let co2Produced = 0;
        let h2oProduced = 0;
        
        for (const [component, moleFraction] of Object.entries(this.composition)) {
            if (GAS_DATA.COMBUSTION_COEFFICIENTS[component]) {
                const coeff = GAS_DATA.COMBUSTION_COEFFICIENTS[component];
                co2Produced += (moleFraction / 100) * coeff.CO2_prod;
                h2oProduced += (moleFraction / 100) * coeff.H2O_prod;
            }
        }
        
        return {
            CO2: co2Produced,
            H2O: h2oProduced
        };
    }
}

// Export for use in other modules
window.GAS_DATA = GAS_DATA;
window.GasProperties = GasProperties;