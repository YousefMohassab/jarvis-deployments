// Combustion chemistry calculations
class CombustionCalculator {
    constructor() {
        this.fuel = null;
        this.airFuelRatio = { stoichiometric: 0, actual: 0 };
        this.excessAir = 0;
        this.flueGasComposition = {};
        this.flowRates = {};
    }
    
    // Initialize with fuel composition
    initialize(fuelComposition, operatingConditions) {
        this.fuel = new GasProperties().setComposition(fuelComposition);
        this.excessAir = operatingConditions.excessAir;
        this.operatingConditions = operatingConditions;
        
        this.calculateAirFuelRatio();
        this.calculateFlowRates();
        this.calculateFlueGasComposition();
        
        return this;
    }
    
    // Calculate stoichiometric and actual air-fuel ratios
    calculateAirFuelRatio() {
        // Stoichiometric air requirement (kg air / kg fuel)
        const stoichAirMolar = this.fuel.getStoichiometricAir();
        this.airFuelRatio.stoichiometric = (stoichAirMolar * CONSTANTS.MOLECULAR_WEIGHTS.AIR) / 
                                          this.fuel.molarMass;
        
        // Actual air-fuel ratio with excess air
        this.airFuelRatio.actual = this.airFuelRatio.stoichiometric * 
                                  (1 + this.excessAir / 100);
        
        return this.airFuelRatio;
    }
    
    // Calculate mass flow rates
    calculateFlowRates() {
        const fuelFlow = this.operatingConditions.fuelFlow; // kg/h
        
        this.flowRates = {
            fuel: fuelFlow,
            air: fuelFlow * this.airFuelRatio.actual,
            oxygen: fuelFlow * this.airFuelRatio.stoichiometric * 0.232, // O2 mass fraction in air
            excessAir: fuelFlow * this.airFuelRatio.stoichiometric * (this.excessAir / 100)
        };
        
        // Calculate flue gas flow rate
        this.flowRates.flueGas = this.flowRates.fuel + this.flowRates.air;
        
        return this.flowRates;
    }
    
    // Calculate flue gas composition
    calculateFlueGasComposition() {
        const products = this.fuel.getCombustionProducts();
        const totalFuelMoles = this.flowRates.fuel / this.fuel.molarMass;
        
        // Calculate moles of each component in flue gas
        const moles = {
            CO2: totalFuelMoles * products.CO2,
            H2O: totalFuelMoles * products.H2O,
            O2: 0,
            N2: 0
        };
        
        // Oxygen in flue gas (from excess air)
        const totalAirMoles = this.flowRates.air / CONSTANTS.MOLECULAR_WEIGHTS.AIR;
        const oxygenSupplied = totalAirMoles * 0.21;
        const oxygenConsumed = totalFuelMoles * this.fuel.getStoichiometricOxygen();
        moles.O2 = oxygenSupplied - oxygenConsumed;
        
        // Nitrogen (inert, passes through)
        moles.N2 = totalAirMoles * 0.79;
        
        // Convert to volume percentages (dry basis)
        const totalMolesDry = moles.CO2 + moles.O2 + moles.N2;
        
        this.flueGasComposition = {
            CO2: (moles.CO2 / totalMolesDry) * 100,
            O2: (moles.O2 / totalMolesDry) * 100,
            N2: (moles.N2 / totalMolesDry) * 100,
            H2O: (moles.H2O / (totalMolesDry + moles.H2O)) * 100 // Wet basis
        };
        
        return this.flueGasComposition;
    }
    
    // Calculate adiabatic flame temperature
    calculateAdiabaticFlameTemperature() {
        const heatingValues = this.fuel.calculateHeatingValues();
        const heatReleased = heatingValues.LHV * CONSTANTS.CONVERSIONS.MJ_TO_J; // J/kg fuel
        
        // Initial temperature guess
        let temperature = 2000; // °C
        let iteration = 0;
        const maxIterations = 50;
        const tolerance = 1; // °C
        
        while (iteration < maxIterations) {
            // Calculate heat capacity of products at current temperature
            const cpProducts = this.calculateProductsHeatCapacity(temperature);
            
            // Calculate mass-weighted average specific heat
            const totalMass = this.flowRates.fuel + this.flowRates.air;
            const avgCp = cpProducts; // J/kg·K
            
            // Energy balance: Heat released = Heat to raise temperature
            const temperatureRise = heatReleased / avgCp;
            const newTemperature = this.operatingConditions.airTemp + temperatureRise;
            
            if (Math.abs(newTemperature - temperature) < tolerance) {
                return newTemperature;
            }
            
            temperature = newTemperature;
            iteration++;
        }
        
        return temperature;
    }
    
    // Calculate heat capacity of combustion products
    calculateProductsHeatCapacity(temperature) {
        const tempK = temperature + CONSTANTS.CONVERSIONS.C_TO_K;
        let cpTotal = 0;
        let totalMass = 0;
        
        // CO2 contribution
        const co2Mass = (this.flueGasComposition.CO2 / 100) * this.flowRates.flueGas;
        const cpCO2 = this.calculateCp('CO2', tempK);
        cpTotal += co2Mass * cpCO2;
        totalMass += co2Mass;
        
        // H2O contribution
        const h2oMass = (this.flueGasComposition.H2O / 100) * this.flowRates.flueGas;
        const cpH2O = this.calculateCp('H2O', tempK);
        cpTotal += h2oMass * cpH2O;
        totalMass += h2oMass;
        
        // O2 contribution
        const o2Mass = (this.flueGasComposition.O2 / 100) * this.flowRates.flueGas;
        const cpO2 = this.calculateCp('O2', tempK);
        cpTotal += o2Mass * cpO2;
        totalMass += o2Mass;
        
        // N2 contribution
        const n2Mass = (this.flueGasComposition.N2 / 100) * this.flowRates.flueGas;
        const cpN2 = this.calculateCp('N2', tempK);
        cpTotal += n2Mass * cpN2;
        totalMass += n2Mass;
        
        return totalMass > 0 ? cpTotal / totalMass : 1000; // J/kg·K
    }
    
    // Calculate specific heat capacity for a component
    calculateCp(component, tempK) {
        const coeff = CONSTANTS.CP_COEFFICIENTS[component];
        if (!coeff) return 1000; // Default value
        
        const cpMolar = coeff.a + coeff.b * tempK + 
                       coeff.c * Math.pow(tempK, 2) + 
                       coeff.d * Math.pow(tempK, 3);
        
        // Convert from J/mol·K to J/kg·K
        const molarMass = CONSTANTS.MOLECULAR_WEIGHTS[component] || 28;
        return (cpMolar * 1000) / molarMass;
    }
    
    // Get all results
    getResults() {
        return {
            airFuelRatio: this.airFuelRatio,
            flowRates: this.flowRates,
            flueGasComposition: this.flueGasComposition,
            adiabaticFlameTemp: this.calculateAdiabaticFlameTemperature()
        };
    }
}

// Export for use in other modules
window.CombustionCalculator = CombustionCalculator;