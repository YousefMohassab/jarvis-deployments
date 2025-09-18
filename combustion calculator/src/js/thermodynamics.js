// Thermodynamic property calculations
class ThermodynamicsCalculator {
    constructor() {
        this.fuel = null;
        this.combustion = null;
        this.properties = {};
    }
    
    // Initialize with fuel and combustion data
    initialize(fuel, combustionResults, operatingConditions) {
        this.fuel = fuel;
        this.combustion = combustionResults;
        this.operatingConditions = operatingConditions;
        
        this.calculateThermodynamicProperties();
        return this;
    }
    
    // Calculate all thermodynamic properties
    calculateThermodynamicProperties() {
        this.properties = {
            heatingValues: this.fuel.calculateHeatingValues(),
            heatReleased: this.calculateHeatReleased(),
            flueGasProperties: this.calculateFlueGasProperties(),
            enthalpyBalance: this.calculateEnthalpyBalance(),
            entropy: this.calculateEntropyChanges()
        };
        
        return this.properties;
    }
    
    // Calculate total heat released
    calculateHeatReleased() {
        const heatingValues = this.fuel.calculateHeatingValues();
        const fuelFlow = this.combustion.flowRates.fuel; // kg/h
        
        return {
            lhvBasis: (heatingValues.LHV * fuelFlow) / CONSTANTS.CONVERSIONS.HOUR_TO_SEC / 1000, // MW
            hhvBasis: (heatingValues.HHV * fuelFlow) / CONSTANTS.CONVERSIONS.HOUR_TO_SEC / 1000  // MW
        };
    }
    
    // Calculate flue gas thermodynamic properties
    calculateFlueGasProperties() {
        const stackTemp = this.operatingConditions.stackTemp;
        const pressure = this.operatingConditions.pressure;
        
        return {
            temperature: stackTemp,
            pressure: pressure,
            density: this.calculateFlueGasDensity(stackTemp, pressure),
            specificHeat: this.calculateFlueGasSpecificHeat(stackTemp),
            enthalpy: this.calculateFlueGasEnthalpy(stackTemp),
            molarMass: this.calculateFlueGasMolarMass()
        };
    }
    
    // Calculate flue gas density
    calculateFlueGasDensity(temperature, pressure) {
        const tempK = temperature + CONSTANTS.CONVERSIONS.C_TO_K;
        const pressurePa = pressure * CONSTANTS.CONVERSIONS.BAR_TO_PA;
        const molarMass = this.calculateFlueGasMolarMass();
        
        return (pressurePa * molarMass) / (CONSTANTS.R_UNIVERSAL * tempK);
    }
    
    // Calculate flue gas molar mass
    calculateFlueGasMolarMass() {
        const comp = this.combustion.flueGasComposition;
        
        const molarMass = (comp.CO2 / 100) * CONSTANTS.MOLECULAR_WEIGHTS.CO2 +
                         (comp.O2 / 100) * CONSTANTS.MOLECULAR_WEIGHTS.O2 +
                         (comp.N2 / 100) * CONSTANTS.MOLECULAR_WEIGHTS.N2 +
                         (comp.H2O / 100) * CONSTANTS.MOLECULAR_WEIGHTS.H2O;
        
        return molarMass;
    }
    
    // Calculate flue gas specific heat capacity
    calculateFlueGasSpecificHeat(temperature) {
        const tempK = temperature + CONSTANTS.CONVERSIONS.C_TO_K;
        const comp = this.combustion.flueGasComposition;
        
        let cpTotal = 0;
        let totalMass = 0;
        
        // CO2 contribution
        const co2Fraction = comp.CO2 / 100;
        const cpCO2 = this.calculateComponentCp('CO2', tempK);
        cpTotal += co2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.CO2 * cpCO2;
        totalMass += co2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.CO2;
        
        // O2 contribution
        const o2Fraction = comp.O2 / 100;
        const cpO2 = this.calculateComponentCp('O2', tempK);
        cpTotal += o2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.O2 * cpO2;
        totalMass += o2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.O2;
        
        // N2 contribution
        const n2Fraction = comp.N2 / 100;
        const cpN2 = this.calculateComponentCp('N2', tempK);
        cpTotal += n2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.N2 * cpN2;
        totalMass += n2Fraction * CONSTANTS.MOLECULAR_WEIGHTS.N2;
        
        // H2O contribution
        const h2oFraction = comp.H2O / 100;
        const cpH2O = this.calculateComponentCp('H2O', tempK);
        cpTotal += h2oFraction * CONSTANTS.MOLECULAR_WEIGHTS.H2O * cpH2O;
        totalMass += h2oFraction * CONSTANTS.MOLECULAR_WEIGHTS.H2O;
        
        return totalMass > 0 ? (cpTotal * 1000) / totalMass : 1000; // J/kg·K
    }
    
    // Calculate specific heat for individual component
    calculateComponentCp(component, tempK) {
        const coeff = CONSTANTS.CP_COEFFICIENTS[component];
        if (!coeff) return 30; // Default value J/mol·K
        
        return coeff.a + coeff.b * tempK + 
               coeff.c * Math.pow(tempK, 2) + 
               coeff.d * Math.pow(tempK, 3);
    }
    
    // Calculate flue gas enthalpy
    calculateFlueGasEnthalpy(temperature) {
        const refTemp = 25; // °C reference temperature
        const cp = this.calculateFlueGasSpecificHeat((temperature + refTemp) / 2); // Average Cp
        
        return cp * (temperature - refTemp) / 1000; // kJ/kg
    }
    
    // Calculate enthalpy balance
    calculateEnthalpyBalance() {
        const heatingValues = this.fuel.calculateHeatingValues();
        const fuelTemp = this.operatingConditions.fuelTemp;
        const airTemp = this.operatingConditions.airTemp;
        const stackTemp = this.operatingConditions.stackTemp;
        
        // Enthalpy of reactants
        const fuelEnthalpy = this.calculateFuelEnthalpy(fuelTemp);
        const airEnthalpy = this.calculateAirEnthalpy(airTemp);
        
        // Enthalpy of products
        const flueGasEnthalpy = this.calculateFlueGasEnthalpy(stackTemp);
        
        // Heat of combustion
        const heatOfCombustion = heatingValues.LHV * 1000; // kJ/kg
        
        return {
            reactants: {
                fuel: fuelEnthalpy,
                air: airEnthalpy,
                total: fuelEnthalpy + airEnthalpy
            },
            products: {
                flueGas: flueGasEnthalpy
            },
            heatOfCombustion: heatOfCombustion,
            heatAvailable: heatOfCombustion + fuelEnthalpy + airEnthalpy - flueGasEnthalpy
        };
    }
    
    // Calculate fuel enthalpy
    calculateFuelEnthalpy(temperature) {
        const refTemp = 25; // °C
        if (temperature <= refTemp) return 0;
        
        const cp = this.fuel.calculateSpecificHeat((temperature + refTemp) / 2);
        return cp * (temperature - refTemp) / 1000; // kJ/kg
    }
    
    // Calculate air enthalpy
    calculateAirEnthalpy(temperature) {
        const refTemp = 25; // °C
        if (temperature <= refTemp) return 0;
        
        const tempK = (temperature + refTemp) / 2 + CONSTANTS.CONVERSIONS.C_TO_K;
        const coeff = CONSTANTS.CP_COEFFICIENTS.AIR;
        const cpAir = coeff.a + coeff.b * tempK + 
                     coeff.c * Math.pow(tempK, 2) + 
                     coeff.d * Math.pow(tempK, 3);
        
        const cpSpecific = (cpAir * 1000) / CONSTANTS.MOLECULAR_WEIGHTS.AIR; // J/kg·K
        return cpSpecific * (temperature - refTemp) / 1000; // kJ/kg
    }
    
    // Calculate entropy changes
    calculateEntropyChanges() {
        const refTemp = 25 + CONSTANTS.CONVERSIONS.C_TO_K; // K
        const stackTempK = this.operatingConditions.stackTemp + CONSTANTS.CONVERSIONS.C_TO_K;
        
        // Simplified entropy calculation
        const cp = this.calculateFlueGasSpecificHeat(this.operatingConditions.stackTemp);
        const entropyChange = cp * Math.log(stackTempK / refTemp); // J/kg·K
        
        return {
            specificEntropy: entropyChange,
            totalEntropyGeneration: entropyChange * this.combustion.flowRates.flueGas / 3600 // J/s·K
        };
    }
    
    // Calculate NOx formation potential based on temperature
    calculateNOxPotential() {
        const flameTemp = this.combustion.adiabaticFlameTemp;
        
        let noxPpm = 0;
        
        // Thermal NOx formation (Zeldovich mechanism)
        if (flameTemp > GAS_DATA.NOX_THRESHOLDS.THERMAL_NOX_THRESHOLD) {
            const tempFactor = Math.exp((flameTemp - 1300) / 300);
            const o2Factor = Math.pow(this.combustion.flueGasComposition.O2 / 21, 0.5);
            noxPpm = 100 * tempFactor * o2Factor;
        }
        
        // Prompt NOx (Fenimore mechanism)
        if (flameTemp > GAS_DATA.NOX_THRESHOLDS.PROMPT_NOX_THRESHOLD) {
            noxPpm += 20; // Base prompt NOx
        }
        
        return Math.min(noxPpm, 500); // Cap at reasonable maximum
    }
    
    // Get all results
    getResults() {
        return {
            ...this.properties,
            noxPotential: this.calculateNOxPotential(),
            adiabaticFlameTemp: this.combustion.adiabaticFlameTemp
        };
    }
}

// Export for use in other modules
window.ThermodynamicsCalculator = ThermodynamicsCalculator;