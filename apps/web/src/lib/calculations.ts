/**
 * Rate Calculation Formula Engine (Frontend)
 * Based on the Google Sheet formula structure
 */

export interface CalculationInput {
  // From Purchase Rates
  buyingBestLandingRate: number;
  costPercentage: number;
  incAmount: number;
  otherCost: number;
  cutCost: number;
  freightCost: number;

  // From Product Master
  quantity: number;
  unitsPerCarton: number;
  cbmPerBox: number;
  gstPercentage: number;

  // From Haulage
  totalHaulage: number;

  // From Enquiry/Shipment
  totalShipmentCBM: number;

  // From Currency
  exchangeRate: number;

  // From User Input
  marginPercentage: number;
}

export interface CalculationResult {
  // Step 1: Basic calculations
  costAmount: number;
  totalRateBase: number;
  gstAmount: number;

  // Step 2: CBM calculations
  totalCartons: number;
  itemCBM: number;
  haulageAllocated: number;
  haulagePerUnit: number;

  // Step 3: Freight allocation
  freightAllocated: number;
  freightPerUnit: number;
  cbmCostPerBox: number;

  // Step 4: Landing cost
  otherCostPerUnit: number;
  landingCostPerUnit: number;

  // Step 5: Final rate
  finalRateINR: number;
  finalRateWithMargin: number;

  // Step 6: Currency converted
  finalRateInCurrency: number;

  // Step 7: Carton rates
  ratePerCarton: number;
  ratePerCartonFinal: number;

  // Additional
  perCbmWithoutCost: number;
  rateWithCutCost: number;
}

export function roundTo(value: number, decimals: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Main calculation function for a single line item
 */
export function calculateRate(input: CalculationInput): CalculationResult {
  const {
    buyingBestLandingRate,
    costPercentage,
    incAmount,
    otherCost,
    cutCost,
    freightCost,
    quantity,
    unitsPerCarton,
    cbmPerBox,
    gstPercentage,
    totalHaulage,
    totalShipmentCBM,
    exchangeRate,
    marginPercentage,
  } = input;

  // Handle edge cases
  const safeQuantity = quantity || 1;
  const safeUnitsPerCarton = unitsPerCarton || 1;
  const safeCbmPerBox = cbmPerBox || 0;
  const safeTotalShipmentCBM = totalShipmentCBM || 1;
  const safeExchangeRate = exchangeRate || 1;
  const safeMarginPercentage = Math.min(marginPercentage || 0, 99.99);

  // ========== STEP 1: Basic Cost Calculations ==========

  // Cost Amount = Buying Rate × Cost %
  const costAmount = buyingBestLandingRate * (costPercentage / 100);

  // Total Rate Base = Buying + Cost Amount + Inc + Other Cost - Cut Cost
  const totalRateBase = buyingBestLandingRate + costAmount + incAmount + otherCost - cutCost;

  // GST Amount = (Buying Rate + Cost Amount) × GST %
  const baseForGST = buyingBestLandingRate + costAmount;
  const gstAmount = baseForGST * (gstPercentage / 100);

  // ========== STEP 2: CBM and Carton Calculations ==========

  // Total Cartons = CEILING(Quantity ÷ Units Per Carton)
  const totalCartons = Math.ceil(safeQuantity / safeUnitsPerCarton);

  // Item CBM = Total Cartons × CBM
  const itemCBM = totalCartons * safeCbmPerBox;

  // Haulage Allocated = Total Haulage × (Item CBM ÷ Total Shipment CBM)
  const haulageAllocated = totalHaulage * (itemCBM / safeTotalShipmentCBM);

  // Haulage Per Unit = Haulage Allocated ÷ Quantity
  const haulagePerUnit = haulageAllocated / safeQuantity;

  // ========== STEP 3: Freight Allocation ==========

  // Freight Allocated = Total Freight × (Item CBM ÷ Total Shipment CBM)
  const freightAllocated = freightCost * (itemCBM / safeTotalShipmentCBM);

  // Freight Per Unit = Freight Allocated ÷ Quantity
  const freightPerUnit = freightAllocated / safeQuantity;

  // CBM Cost Per Box = Haulage Allocated ÷ Total Cartons
  const cbmCostPerBox = haulageAllocated / totalCartons;

  // Per 1 CBM Without Cost (for reference)
  const perCbmWithoutCost = totalCartons > 0 ? (buyingBestLandingRate * safeQuantity) / totalCartons : 0;

  // Rate With Cut Cost = Total Rate Base - Cut Cost
  const rateWithCutCost = totalRateBase - cutCost;

  // ========== STEP 4: Landing Cost Calculation ==========

  // Other Cost Per Unit = Other Cost ÷ Quantity
  const otherCostPerUnit = otherCost / safeQuantity;

  // Landing Cost Per Unit =
  // Buying Rate + Cost Amount + Inc + GST + Freight Per Unit + Haulage Per Unit + Other Cost Per Unit
  const landingCostPerUnit =
    buyingBestLandingRate +
    costAmount +
    incAmount +
    gstAmount +
    freightPerUnit +
    haulagePerUnit +
    otherCostPerUnit;

  // ========== STEP 5: Final Rate with Margin ==========

  // Final Rate INR = Landing Cost ÷ (1 - Margin %)
  // Using profit margin formula
  const marginFactor = 1 - (safeMarginPercentage / 100);
  const finalRateINR = marginFactor > 0 ? landingCostPerUnit / marginFactor : landingCostPerUnit;

  // ========== STEP 6: Currency Conversion ==========

  // Final Rate in Selected Currency = Final Rate INR ÷ Exchange Rate
  const finalRateInCurrency = finalRateINR / safeExchangeRate;

  // ========== STEP 7: Carton-based Rates ==========

  // Rate Per Carton = Rate With Cut Cost × Units Per Carton (before margin)
  const ratePerCarton = rateWithCutCost * safeUnitsPerCarton;

  // Rate Per Carton Final = Final Rate × Units Per Carton
  const ratePerCartonFinal = finalRateINR * safeUnitsPerCarton;

  return {
    // Step 1
    costAmount: roundTo(costAmount, 4),
    totalRateBase: roundTo(totalRateBase, 4),
    gstAmount: roundTo(gstAmount, 4),

    // Step 2
    totalCartons,
    itemCBM: roundTo(itemCBM, 4),
    haulageAllocated: roundTo(haulageAllocated, 2),
    haulagePerUnit: roundTo(haulagePerUnit, 4),

    // Step 3
    freightAllocated: roundTo(freightAllocated, 2),
    freightPerUnit: roundTo(freightPerUnit, 4),
    cbmCostPerBox: roundTo(cbmCostPerBox, 4),

    // Step 4
    otherCostPerUnit: roundTo(otherCostPerUnit, 4),
    landingCostPerUnit: roundTo(landingCostPerUnit, 4),

    // Step 5
    finalRateINR: roundTo(finalRateINR, 2),
    finalRateWithMargin: roundTo(finalRateINR, 2),

    // Step 6
    finalRateInCurrency: roundTo(finalRateInCurrency, 4),

    // Step 7
    ratePerCarton: roundTo(ratePerCarton, 2),
    ratePerCartonFinal: roundTo(ratePerCartonFinal, 2),

    // Additional
    perCbmWithoutCost: roundTo(perCbmWithoutCost, 4),
    rateWithCutCost: roundTo(rateWithCutCost, 4),
  };
}

/**
 * Convert rate to multiple currencies
 */
export function convertToCurrencies(
  rateInr: number,
  currencyRates: {
    gbp?: number;
    usd?: number;
    cad?: number;
    aud?: number;
    euro?: number;
  }
): {
  rateInGbp: number;
  rateInUsd: number;
  rateInCad: number;
  rateInAud: number;
  rateInEuro: number;
} {
  return {
    rateInGbp: currencyRates.gbp ? roundTo(rateInr / currencyRates.gbp, 4) : 0,
    rateInUsd: currencyRates.usd ? roundTo(rateInr / currencyRates.usd, 4) : 0,
    rateInCad: currencyRates.cad ? roundTo(rateInr / currencyRates.cad, 4) : 0,
    rateInAud: currencyRates.aud ? roundTo(rateInr / currencyRates.aud, 4) : 0,
    rateInEuro: currencyRates.euro ? roundTo(rateInr / currencyRates.euro, 4) : 0,
  };
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(landingCost: number, sellingPrice: number): {
  marginAmount: number;
  marginPercentage: number;
} {
  if (sellingPrice === 0) return { marginAmount: 0, marginPercentage: 0 };

  const marginAmount = sellingPrice - landingCost;
  const marginPercentage = (marginAmount / sellingPrice) * 100;

  return {
    marginAmount: roundTo(marginAmount, 2),
    marginPercentage: roundTo(marginPercentage, 4),
  };
}

/**
 * Calculate carton quantity from order quantity
 */
export function calculateCartons(quantity: number, unitsPerCarton: number): {
  totalCartons: number;
  remainingUnits: number;
} {
  if (!unitsPerCarton || unitsPerCarton === 0) {
    return { totalCartons: 1, remainingUnits: quantity };
  }

  const totalCartons = Math.ceil(quantity / unitsPerCarton);
  const remainingUnits = quantity % unitsPerCarton;

  return { totalCartons, remainingUnits };
}

/**
 * Calculate total CBM for item
 */
export function calculateTotalCbm(
  quantity: number,
  unitsPerCarton: number,
  cbmPerBox: number
): number {
  const { totalCartons } = calculateCartons(quantity, unitsPerCarton);
  return roundTo(totalCartons * cbmPerBox, 4);
}

/**
 * Allocate haulage to item based on CBM proportion
 */
export function allocateHaulage(
  totalHaulage: number,
  itemCbm: number,
  totalShipmentCbm: number
): {
  haulageAllocated: number;
  haulagePercentage: number;
} {
  if (!totalShipmentCbm || totalShipmentCbm === 0) {
    return { haulageAllocated: 0, haulagePercentage: 0 };
  }

  const haulagePercentage = (itemCbm / totalShipmentCbm) * 100;
  const haulageAllocated = totalHaulage * (itemCbm / totalShipmentCbm);

  return {
    haulageAllocated: roundTo(haulageAllocated, 2),
    haulagePercentage: roundTo(haulagePercentage, 2),
  };
}

/**
 * Format number for display
 */
export function formatCurrency(value: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Calculate totals for a list of items
 */
export function calculateTotals(items: Array<{
  orderQuantity: number;
  finalRateInr: number;
  buyingBestLandingRate: number;
  gstAmount: number;
  oceanFreightCost: number;
  haulageAmount: number;
  otherCost: number;
  marginAmount: number;
  marginPercentage: number;
}>): {
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalGst: number;
  totalFreight: number;
  totalHaulage: number;
  totalOtherCost: number;
  totalLandingCost: number;
  totalMargin: number;
  averageMarginPercentage: number;
} {
  return items.reduce(
    (acc, item) => ({
      totalPurchaseValue: acc.totalPurchaseValue + (item.buyingBestLandingRate * item.orderQuantity),
      totalSellingValue: acc.totalSellingValue + (item.finalRateInr * item.orderQuantity),
      totalGst: acc.totalGst + item.gstAmount,
      totalFreight: acc.totalFreight + item.oceanFreightCost,
      totalHaulage: acc.totalHaulage + item.haulageAmount,
      totalOtherCost: acc.totalOtherCost + item.otherCost,
      totalLandingCost: acc.totalLandingCost + (item.finalRateInr * item.orderQuantity),
      totalMargin: acc.totalMargin + item.marginAmount,
      averageMarginPercentage: 0, // Will be calculated after reduce
    }),
    {
      totalPurchaseValue: 0,
      totalSellingValue: 0,
      totalGst: 0,
      totalFreight: 0,
      totalHaulage: 0,
      totalOtherCost: 0,
      totalLandingCost: 0,
      totalMargin: 0,
      averageMarginPercentage: 0,
    }
  );
}

export const calculationEngine = {
  calculateRate,
  convertToCurrencies,
  calculateMargin,
  calculateCartons,
  calculateTotalCbm,
  allocateHaulage,
  formatCurrency,
  formatPercentage,
  calculateTotals,
  roundTo,
};

export default calculationEngine;