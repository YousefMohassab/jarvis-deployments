// Efficiency and performance calculations
class EfficiencyCalculator {
    constructor() {
        this.efficiencies = {};
        this.losses = {};
        this.heatBalance = {};
    }
    
    // Initialize with combustion and thermodynamic data
    initialize(fuel, combustion, thermodynamics, operatingConditions) {
        this.fuel = fuel;
        this.combustion = combustion;
        this.thermodynamics = thermodynamics;
        this.operatingConditions = operatingConditions;
        
        this.calculateEfficiencies();
        this.calculateLosses();
        this.performHeatBalance();
        
        return this;
    }
    
    // Calculate all efficiency metrics
    calculateEfficiencies() {
        this.efficiencies = {
            combustion: this.calculateCombustionEfficiency(),
            thermal: this.calculateThermalEfficiency(),
            boiler: this.calculateBoilerEfficiency(),
            carnot: this.calculateCarnotEfficiency()
        };
        
        return this.efficiencies;
    }
    
    // Calculate combustion efficiency
    calculateCombustionEfficiency() {
        // Simplified combustion efficiency based on CO2 content
        const co2Actual = this.combustion.flueGasComposition.CO2;
        const co2Theoretical = this.getTheoreticalCO2();
        
        // Combustion efficiency based on unburned fuel (simplified)
        const combustionEff = Math.min(99.5, (co2Actual / co2Theoretical) * 100);
        
        return Math.max(85, combustionEff); // Minimum realistic value
    }
    
    // Get theoretical maximum CO2 for complete combustion
    getTheoreticalCO2() {
        const products = this.fuel.getCombustionProducts();
        const stoichAir = this.fuel.getStoichiometricAir();
        
        // Calculate theoretical CO2 percentage in dry flue gas
        const co2Moles = products.CO2;
        const n2Moles = stoichAir * 0.79; // N2 from stoichiometric air
        
        return (co2Moles / (co2Moles + n2Moles)) * 100;
    }
    
    // Calculate thermal efficiency
    calculateThermalEfficiency() {
        const stackLoss = this.calculateStackLoss();
        const radiationLoss = this.operatingConditions.heatLoss || 3; // %
        const unaccountedLoss = 2; // % (typical value)
        
        const totalLosses = stackLoss + radiationLoss + unaccountedLoss;
        return Math.max(0, 100 - totalLosses);
    }
    
    // Calculate boiler efficiency (if applicable)
    calculateBoilerEfficiency() {
        // Direct method: Output/Input
        const heatInput = this.thermodynamics.heatReleased.lhvBasis; // MW
        const usefulHeat = this.calculateUsefulHeatOutput(); // MW
        
        return (usefulHeat / heatInput) * 100;
    }
    
    // Calculate Carnot efficiency (theoretical maximum)
    calculateCarnotEfficiency() {
        const hotTemp = this.combustion.adiabaticFlameTemp + CONSTANTS.CONVERSIONS.C_TO_K; // K
        const coldTemp = this.operatingConditions.airTemp + CONSTANTS.CONVERSIONS.C_TO_K; // K
        
        return ((hotTemp - coldTemp) / hotTemp) * 100;
    }
    
    // Calculate all losses
    calculateLosses() {
        this.losses = {
            stack: this.calculateStackLoss(),
            radiation: this.operatingConditions.heatLoss || 3,
            incomplete: this.calculateIncompleteCombustionLoss(),
            moisture: this.calculateMoistureLoss(),
            unaccounted: 2 // Typical value for unaccounted losses
        };
        
        return this.losses;
    }
    
    // Calculate stack loss (sensible heat in flue gas)
    calculateStackLoss() {
        const stackTemp = this.operatingConditions.stackTemp;
        const airTemp = this.operatingConditions.airTemp;
        const tempDiff = stackTemp - airTemp;
        
        if (tempDiff <= 0) return 0;
        
        // Mass flow rates
        const fuelFlow = this.combustion.flowRates.fuel; // kg/h
        const flueGasFlow = this.combustion.flowRates.flueGas; // kg/h
        
        // Heat capacity of flue gas
        const cpFlueGas = this.thermodynamics.flueGasProperties.specificHeat; // J/kg·K
        
        // Heat input (LHV basis)
        const heatingValues = this.fuel.calculateHeatingValues();
        const heatInput = heatingValues.LHV * fuelFlow * 1000; // J/h
        
        // Stack loss
        const stackHeatLoss = flueGasFlow * cpFlueGas * tempDiff; // J/h
        const stackLossPercent = (stackHeatLoss / heatInput) * 100;
        
        return Math.min(stackLossPercent, 50); // Cap at reasonable maximum
    }
    
    // Calculate loss due to incomplete combustion
    calculateIncompleteCombustionLoss() {
        const combustionEff = this.efficiencies.combustion || this.calculateCombustionEfficiency();
        return Math.max(0, 100 - combustionEff);
    }
    
    // Calculate moisture loss
    calculateMoistureLoss() {
        const h2oPercent = this.combustion.flueGasComposition.H2O;
        const stackTemp = this.operatingConditions.stackTemp;
        const refTemp = 25; // °C
        
        // Latent heat of vaporization of water at stack temperature
        const latentHeat = 2257 - 2.3 * (stackTemp - 100); // kJ/kg (approximation)
        
        // Sensible heat of water vapor
        const sensibleHeat = 2.0 * (stackTemp - refTemp); // kJ/kg (Cp of steam ≈ 2.0 kJ/kg·K)
        
        // Total heat loss with moisture
        const moistureHeatLoss = latentHeat + sensibleHeat;
        
        // Calculate as percentage of fuel heating value
        const heatingValues = this.fuel.calculateHeatingValues();
        const moistureLossPercent = (h2oPercent / 100) * (moistureHeatLoss / (heatingValues.LHV * 1000)) * 100;
        
        return Math.min(moistureLossPercent, 15); // Cap at reasonable maximum
    }
    
    // Perform complete heat balance
    performHeatBalance() {
        const heatingValues = this.fuel.calculateHeatingValues();
        const fuelFlow = this.combustion.flowRates.fuel;
        
        // Heat input
        const heatInput = {
            combustion: heatingValues.LHV * fuelFlow / 3600, // kW
            sensibleFuel: this.calculateSensibleHeatFuel(),
            sensibleAir: this.calculateSensibleHeatAir(),
            total: 0
        };
        heatInput.total = heatInput.combustion + heatInput.sensibleFuel + heatInput.sensibleAir;
        
        // Heat output/losses
        const heatOutput = {
            useful: this.calculateUsefulHeatOutput() * 1000, // kW
            stack: (this.losses.stack / 100) * heatInput.total,
            radiation: (this.losses.radiation / 100) * heatInput.total,
            moisture: (this.losses.moisture / 100) * heatInput.total,
            incomplete: (this.losses.incomplete / 100) * heatInput.total,
            unaccounted: (this.losses.unaccounted / 100) * heatInput.total,
            total: 0
        };
        
        heatOutput.total = heatOutput.useful + heatOutput.stack + 
                          heatOutput.radiation + heatOutput.moisture + 
                          heatOutput.incomplete + heatOutput.unaccounted;
        
        this.heatBalance = {
            input: heatInput,
            output: heatOutput,
            balance: Math.abs(heatInput.total - heatOutput.total) / heatInput.total * 100 // % error
        };
        
        return this.heatBalance;
    }
    
    // Calculate sensible heat of fuel
    calculateSensibleHeatFuel() {
        const fuelTemp = this.operatingConditions.fuelTemp;
        const refTemp = 25; // °C
        
        if (fuelTemp <= refTemp) return 0;
        
        const cpFuel = this.fuel.calculateSpecificHeat((fuelTemp + refTemp) / 2);
        const fuelFlow = this.combustion.flowRates.fuel;
        
        return (cpFuel * (fuelTemp - refTemp) * fuelFlow) / 3600000; // kW
    }
    
    // Calculate sensible heat of air
    calculateSensibleHeatAir() {
        const airTemp = this.operatingConditions.airTemp;
        const refTemp = 25; // °C
        
        if (airTemp <= refTemp) return 0;
        
        const airFlow = this.combustion.flowRates.air;
        const cpAir = 1005; // J/kg·K (average for air)
        
        return (cpAir * (airTemp - refTemp) * airFlow) / 3600000; // kW
    }
    
    // Calculate useful heat output
    calculateUsefulHeatOutput() {
        const heatInput = this.thermodynamics.heatReleased.lhvBasis; // MW
        const thermalEff = this.efficiencies.thermal || this.calculateThermalEfficiency();
        
        return heatInput * (thermalEff / 100); // MW
    }
    
    // Calculate specific emissions
    calculateSpecificEmissions() {
        const co2Flow = this.calculateCO2Flow(); // kg/h
        const usefulHeat = this.calculateUsefulHeatOutput(); // MW
        
        return {
            co2Specific: co2Flow / usefulHeat, // kg/MWh
            co2Total: co2Flow
        };
    }
    
    // Calculate CO2 mass flow rate
    calculateCO2Flow() {
        const flueGasFlow = this.combustion.flowRates.flueGas; // kg/h
        const co2Percent = this.combustion.flueGasComposition.CO2; // %
        const flueGasMolarMass = this.thermodynamics.flueGasProperties.molarMass;
        
        // Convert volume percentage to mass percentage
        const co2MassPercent = (co2Percent / 100) * 
                              (CONSTANTS.MOLECULAR_WEIGHTS.CO2 / flueGasMolarMass);
        
        return flueGasFlow * co2MassPercent;
    }
    
    // Get all results
    getResults() {
        return {
            efficiencies: this.efficiencies,
            losses: this.losses,
            heatBalance: this.heatBalance,
            emissions: this.calculateSpecificEmissions(),
            usefulHeatOutput: this.calculateUsefulHeatOutput()
        };
    }
}

// Export for use in other modules
window.EfficiencyCalculator = EfficiencyCalculator;