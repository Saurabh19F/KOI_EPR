import { Injectable } from '@nestjs/common';

export interface CalculationInput {
  // Product data
  quantity: number;
  unitPerCarton: number;
  cbmPerBox: number;

  // Purchase data
  buyingPrice: number;
  currencyRate: number;
  gstPercent: number;

  // Cost additions
  freightCost: number;
  otherCost: number;
  incAmount: number;
  cutCost: number;

  // Haulage
  totalHaulage: number;
  totalShipmentCbm: number;

  // Margin
  marginPercent: number;
}

export interface CalculationResult {
  // Step 1: Convert buying price to INR
  buyingPriceInr: number;

  // Step 2: Calculate cartons
  totalCartons: number;

  // Step 3: Calculate CBM
  itemCbm: number;

  // Step 4: Calculate freight allocation
  freightAllocated: number;
  freightPerUnit: number;

  // Step 5: Calculate haulage allocation
  haulageAllocated: number;
  haulagePerUnit: number;

  // Step 6: Calculate GST
  gstAmount: number;

  // Step 7: Calculate other cost per unit
  otherCostPerUnit: number;

  // Step 8: Calculate landing cost
  landingCost: number;

  // Step 9: Calculate cost amount
  costAmount: number;

  // Step 10: Calculate total rate base
  totalRateBase: number;

  // Step 11: Calculate final rate with margin
  finalRateInr: number;
  finalRateCurrency: number;

  // Breakdown
  breakdown: {
    buyingPrice: number;
    gstAmount: number;
    freightPerUnit: number;
    haulagePerUnit: number;
    otherCostPerUnit: number;
    incAmount: number;
    cutCost: number;
    marginAmount: number;
  };
}

@Injectable()
export class CalculationEngineService {

  /**
   * Calculate final rate based on ERP formula from chat discussion
   *
   * Formula Flow:
   * 1. Convert buying price to INR
   * 2. Calculate cartons = CEILING(quantity / unitPerCarton)
   * 3. Calculate item CBM = cartons * cbmPerBox
   * 4. Allocate freight cost item-wise
   * 5. Allocate haulage cost
   * 6. Calculate GST
   * 7. Calculate landing cost
   * 8. Apply margin using Profit Margin Formula
   *
   * Profit Margin Formula: Final Rate = Landing Cost / (1 - Margin %)
   */
  calculate(input: CalculationInput): CalculationResult {
    const {
      quantity,
      unitPerCarton,
      cbmPerBox,
      buyingPrice,
      currencyRate,
      gstPercent,
      freightCost,
      otherCost,
      incAmount,
      cutCost,
      totalHaulage,
      totalShipmentCbm,
      marginPercent,
    } = input;

    // Step 1: Convert buying price to INR
    const buyingPriceInr = buyingPrice * currencyRate;

    // Step 2: Calculate total cartons
    const totalCartons = Math.ceil(quantity / unitPerCarton);

    // Step 3: Calculate item CBM
    const itemCbm = totalCartons * cbmPerBox;

    // Step 4: Calculate freight allocation per unit
    let freightAllocated = 0;
    let freightPerUnit = 0;
    if (totalShipmentCbm > 0 && quantity > 0) {
      freightAllocated = freightCost * (itemCbm / totalShipmentCbm);
      freightPerUnit = freightAllocated / quantity;
    }

    // Step 5: Calculate haulage allocation per unit
    let haulageAllocated = 0;
    let haulagePerUnit = 0;
    if (totalShipmentCbm > 0 && quantity > 0) {
      haulageAllocated = totalHaulage * (itemCbm / totalShipmentCbm);
      haulagePerUnit = haulageAllocated / quantity;
    }

    // Step 6: Calculate GST amount
    const gstAmount = buyingPriceInr * (gstPercent / 100);

    // Step 7: Calculate other cost per unit
    const otherCostPerUnit = otherCost / quantity;

    // Step 8: Calculate landing cost
    const landingCost = buyingPriceInr + gstAmount + freightPerUnit + haulagePerUnit + otherCostPerUnit;

    // Step 9: Calculate cost amount (if any percentage based cost)
    // Cost Amount = buyingPrice * costPercent / 100
    const costAmount = buyingPriceInr * 0; // No cost percent in this input

    // Step 10: Calculate total rate base (before margin)
    const totalRateBase = buyingPriceInr + gstAmount + freightPerUnit + haulagePerUnit + otherCostPerUnit + incAmount - cutCost;

    // Step 11: Calculate final rate with Profit Margin Formula
    // Final Rate = Landing Cost / (1 - Margin %)
    let finalRateInr = totalRateBase;
    let marginAmount = 0;

    if (marginPercent > 0 && marginPercent < 100) {
      finalRateInr = totalRateBase / (1 - marginPercent / 100);
      marginAmount = finalRateInr - totalRateBase;
    }

    // Calculate final rate in selected currency
    const finalRateCurrency = currencyRate > 0 ? finalRateInr / currencyRate : finalRateInr;

    return {
      buyingPriceInr,
      totalCartons,
      itemCbm,
      freightAllocated,
      freightPerUnit,
      haulageAllocated,
      haulagePerUnit,
      gstAmount,
      otherCostPerUnit,
      landingCost,
      costAmount,
      totalRateBase,
      finalRateInr,
      finalRateCurrency,
      breakdown: {
        buyingPrice: buyingPriceInr,
        gstAmount,
        freightPerUnit,
        haulagePerUnit,
        otherCostPerUnit,
        incAmount,
        cutCost,
        marginAmount,
      },
    };
  }

  /**
   * Calculate rate per carton
   */
  calculateRatePerCarton(finalRateInr: number, unitsPerCase: number): number {
    return finalRateInr * unitsPerCase;
  }

  /**
   * Calculate CBM cost per box
   */
  calculateCbmCostPerBox(totalCbm: number, freightCost: number, cartons: number): number {
    if (cartons > 0) {
      return (freightCost / cartons);
    }
    return 0;
  }

  /**
   * Convert final rate to multiple currencies
   */
  convertToCurrencies(finalRateInr: number, currencyRates: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};

    for (const [currency, rate] of Object.entries(currencyRates)) {
      if (rate > 0) {
        result[currency] = finalRateInr / rate;
      }
    }

    return result;
  }

  /**
   * Validate calculation inputs
   */
  validateInput(input: CalculationInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.quantity <= 0) {
      errors.push('Order quantity must be greater than 0');
    }

    if (input.unitPerCarton <= 0) {
      errors.push('Units per carton must be greater than 0');
    }

    if (input.buyingPrice <= 0) {
      errors.push('Buying price must be greater than 0');
    }

    if (input.currencyRate <= 0) {
      errors.push('Currency rate must be greater than 0');
    }

    if (input.gstPercent < 0 || input.gstPercent > 100) {
      errors.push('GST percentage must be between 0 and 100');
    }

    if (input.marginPercent < 0 || input.marginPercent >= 100) {
      errors.push('Margin percentage must be between 0 and 99');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}