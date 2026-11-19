import { describe, it, expect } from 'vitest';
import {
  roundTo,
  calculateRate,
  convertToCurrencies,
  calculateMargin,
  calculateCartons,
  calculateTotalCbm,
  allocateHaulage,
  formatCurrency,
  formatPercentage,
  CalculationInput,
} from './calculations';

describe('roundTo', () => {
  it('should round to specified decimal places', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
    expect(roundTo(1.5, 0)).toBe(2);
  });

  it('should handle NaN and Infinity', () => {
    expect(roundTo(NaN, 2)).toBe(0);
    expect(roundTo(Infinity, 2)).toBe(0);
    expect(roundTo(-Infinity, 2)).toBe(0);
  });

  it('should handle zero', () => {
    expect(roundTo(0, 4)).toBe(0);
  });
});

describe('calculateRate', () => {
  const baseInput: CalculationInput = {
    buyingBestLandingRate: 100,
    costPercentage: 10,
    incAmount: 5,
    otherCost: 20,
    cutCost: 3,
    freightCost: 500,
    quantity: 1000,
    unitsPerCarton: 50,
    cbmPerBox: 0.05,
    gstPercentage: 18,
    totalHaulage: 10000,
    totalShipmentCBM: 10,
    exchangeRate: 83,
    marginPercentage: 20,
  };

  it('should calculate cost amount correctly', () => {
    const result = calculateRate(baseInput);
    expect(result.costAmount).toBe(10); // 100 * 10%
  });

  it('should calculate total rate base correctly', () => {
    const result = calculateRate(baseInput);
    // 100 + 10 + 5 + 20 - 3 = 132
    expect(result.totalRateBase).toBe(132);
  });

  it('should calculate GST amount correctly', () => {
    const result = calculateRate(baseInput);
    // (100 + 10) * 18% = 19.8
    expect(result.gstAmount).toBe(19.8);
  });

  it('should calculate total cartons by ceiling division', () => {
    const result = calculateRate(baseInput);
    // ceil(1000 / 50) = 20
    expect(result.totalCartons).toBe(20);
  });

  it('should calculate item CBM correctly', () => {
    const result = calculateRate(baseInput);
    // 20 cartons * 0.05 = 1.0
    expect(result.itemCBM).toBe(1);
  });

  it('should allocate haulage based on CBM proportion', () => {
    const result = calculateRate(baseInput);
    // 10000 * (1.0 / 10) = 1000
    expect(result.haulageAllocated).toBe(1000);
    // 1000 / 1000 = 1
    expect(result.haulagePerUnit).toBe(1);
  });

  it('should allocate freight based on CBM proportion', () => {
    const result = calculateRate(baseInput);
    // 500 * (1.0 / 10) = 50
    expect(result.freightAllocated).toBe(50);
    // 50 / 1000 = 0.05
    expect(result.freightPerUnit).toBe(0.05);
  });

  it('should calculate landing cost per unit', () => {
    const result = calculateRate(baseInput);
    // 100 + 10 + 5 + 19.8 + 0.05 + 1 + 0.02 = 135.87
    expect(result.landingCostPerUnit).toBe(135.87);
  });

  it('should apply margin using divisor formula', () => {
    const result = calculateRate(baseInput);
    // landingCost / (1 - 20%) = 135.87 / 0.8 = 169.8375
    expect(result.finalRateINR).toBe(169.84);
  });

  it('should convert to foreign currency', () => {
    const result = calculateRate(baseInput);
    // finalRateINR / exchangeRate, rounded to 4 decimals
    expect(result.finalRateInCurrency).toBeCloseTo(result.finalRateINR / 83, 3);
  });

  it('should handle zero quantity safely', () => {
    const result = calculateRate({ ...baseInput, quantity: 0 });
    expect(result.totalCartons).toBe(1);
    expect(Number.isFinite(result.haulagePerUnit)).toBe(true);
  });

  it('should handle zero exchange rate safely', () => {
    const result = calculateRate({ ...baseInput, exchangeRate: 0 });
    expect(Number.isFinite(result.finalRateInCurrency)).toBe(true);
  });

  it('should handle zero CBM per box', () => {
    const result = calculateRate({ ...baseInput, cbmPerBox: 0 });
    expect(result.itemCBM).toBe(0);
    expect(result.haulageAllocated).toBe(0);
  });

  it('should cap margin at 99.99%', () => {
    const result = calculateRate({ ...baseInput, marginPercentage: 100 });
    expect(Number.isFinite(result.finalRateINR)).toBe(true);
    expect(result.finalRateINR).toBeGreaterThan(0);
  });
});

describe('convertToCurrencies', () => {
  it('should convert INR rate to multiple currencies', () => {
    const result = convertToCurrencies(1000, {
      gbp: 100,
      usd: 83,
      cad: 60,
      aud: 55,
      euro: 90,
    });

    expect(result.rateInGbp).toBe(10);
    expect(result.rateInUsd).toBe(roundTo(1000 / 83, 4));
    expect(result.rateInCad).toBe(roundTo(1000 / 60, 4));
    expect(result.rateInAud).toBe(roundTo(1000 / 55, 4));
    expect(result.rateInEuro).toBe(roundTo(1000 / 90, 4));
  });

  it('should return 0 for missing currency rates', () => {
    const result = convertToCurrencies(1000, {});
    expect(result.rateInGbp).toBe(0);
    expect(result.rateInUsd).toBe(0);
  });
});

describe('calculateMargin', () => {
  it('should calculate margin amount and percentage', () => {
    const result = calculateMargin(80, 100);
    expect(result.marginAmount).toBe(20);
    expect(result.marginPercentage).toBe(20);
  });

  it('should handle zero selling price', () => {
    const result = calculateMargin(80, 0);
    expect(result.marginAmount).toBe(0);
    expect(result.marginPercentage).toBe(0);
  });

  it('should handle negative margin', () => {
    const result = calculateMargin(120, 100);
    expect(result.marginAmount).toBe(-20);
    expect(result.marginPercentage).toBe(-20);
  });
});

describe('calculateCartons', () => {
  it('should calculate cartons with ceiling', () => {
    const result = calculateCartons(105, 50);
    expect(result.totalCartons).toBe(3);
    expect(result.remainingUnits).toBe(5);
  });

  it('should handle exact division', () => {
    const result = calculateCartons(100, 50);
    expect(result.totalCartons).toBe(2);
    expect(result.remainingUnits).toBe(0);
  });

  it('should handle zero units per carton', () => {
    const result = calculateCartons(100, 0);
    expect(result.totalCartons).toBe(1);
  });
});

describe('calculateTotalCbm', () => {
  it('should calculate total CBM correctly', () => {
    const result = calculateTotalCbm(100, 50, 0.05);
    // ceil(100/50) = 2 cartons * 0.05 = 0.1
    expect(result).toBe(0.1);
  });

  it('should handle partial carton', () => {
    const result = calculateTotalCbm(75, 50, 0.05);
    // ceil(75/50) = 2 cartons * 0.05 = 0.1
    expect(result).toBe(0.1);
  });
});

describe('allocateHaulage', () => {
  it('should allocate haulage by CBM proportion', () => {
    const result = allocateHaulage(10000, 2, 10);
    expect(result.haulageAllocated).toBe(2000);
    expect(result.haulagePercentage).toBe(20);
  });

  it('should handle zero total shipment CBM', () => {
    const result = allocateHaulage(10000, 2, 0);
    expect(result.haulageAllocated).toBe(0);
    expect(result.haulagePercentage).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('should format INR with rupee symbol', () => {
    const result = formatCurrency(1234.56, 'INR');
    expect(result).toContain('₹');
    expect(result).toContain('1,234.56');
  });

  it('should format other currencies', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('USD');
  });
});

describe('formatPercentage', () => {
  it('should format with 2 decimal places and % sign', () => {
    expect(formatPercentage(25.5)).toBe('25.50%');
    expect(formatPercentage(0)).toBe('0.00%');
  });
});
