// Physical and chemical constants for thermodynamic calculations
const CONSTANTS = {
    // Universal constants
    R_UNIVERSAL: 8314.46, // Universal gas constant (J/kmol·K)
    R_SPECIFIC_AIR: 287.0, // Specific gas constant for air (J/kg·K)
    
    // Standard conditions
    STANDARD_TEMP: 273.15, // K (0°C)
    STANDARD_PRESSURE: 101325, // Pa (1 atm)
    
    // Air composition (% vol)
    AIR_COMPOSITION: {
        N2: 79.0,
        O2: 21.0,
        AR: 0.93,
        CO2: 0.04,
        OTHER: 0.03
    },
    
    // Molecular weights (kg/kmol)
    MOLECULAR_WEIGHTS: {
        CH4: 16.043,
        C2H6: 30.070,
        C3H8: 44.097,
        C4H10: 58.123,
        CO2: 44.010,
        H2O: 18.015,
        O2: 31.999,
        N2: 28.014,
        AR: 39.948,
        AIR: 28.96
    },
    
    // Heating values at 25°C (MJ/kg)
    HEATING_VALUES: {
        CH4: { LHV: 50.02, HHV: 55.53 },
        C2H6: { LHV: 47.79, HHV: 51.90 },
        C3H8: { LHV: 46.35, HHV: 50.35 },
        C4H10: { LHV: 45.75, HHV: 49.51 },
        H2: { LHV: 120.0, HHV: 142.0 }
    },
    
    // Formation enthalpies at 25°C (kJ/mol)
    FORMATION_ENTHALPIES: {
        CH4: -74.85,
        C2H6: -84.68,
        C3H8: -103.85,
        C4H10: -126.15,
        CO2: -393.52,
        H2O_GAS: -241.83,
        H2O_LIQUID: -285.84
    },
    
    // Heat capacity coefficients (Cp = a + bT + cT² + dT³)
    // Temperature range: 298-2000K, Cp in J/mol·K
    CP_COEFFICIENTS: {
        CH4: { a: 19.89, b: 5.024e-2, c: 1.269e-5, d: -11.01e-9 },
        C2H6: { a: 6.90, b: 17.27e-2, c: -6.406e-5, d: 7.285e-9 },
        C3H8: { a: -4.04, b: 30.48e-2, c: -15.72e-5, d: 31.74e-9 },
        C4H10: { a: 9.487, b: 40.99e-2, c: -16.91e-5, d: 24.72e-9 },
        CO2: { a: 22.26, b: 5.981e-2, c: -3.501e-5, d: 7.469e-9 },
        H2O: { a: 32.24, b: 0.1923e-2, c: 1.055e-5, d: -3.595e-9 },
        O2: { a: 25.48, b: 1.520e-2, c: -0.7155e-5, d: 1.312e-9 },
        N2: { a: 28.90, b: -0.1571e-2, c: 0.8081e-5, d: -2.873e-9 },
        AIR: { a: 28.11, b: 0.1967e-2, c: 0.4802e-5, d: -1.966e-9 }
    },
    
    // Conversion factors
    CONVERSIONS: {
        C_TO_K: 273.15,
        BAR_TO_PA: 100000,
        MJ_TO_J: 1000000,
        KW_TO_W: 1000,
        HOUR_TO_SEC: 3600
    }
};

// Export for use in other modules
window.CONSTANTS = CONSTANTS;