/**
 * NaviDocs ROI Calculator Framework
 * Yacht Maintenance & Documentation Management System
 *
 * This module provides a comprehensive ROI calculation engine for measuring
 * the financial impact of implementing NaviDocs in yacht management operations.
 *
 * @module roi-calculator
 * @version 2.0.0
 */

/**
 * Input Schema Definition
 * Defines the structure and requirements for ROI calculator inputs
 */
const INPUT_SCHEMA = {
  investmentInputs: {
    softwareLicenseCost: { type: 'number', description: 'Annual software license cost (EUR)', default: 5000 },
    implementationCost: { type: 'number', description: 'One-time implementation setup cost (EUR)', default: 3000 },
    trainingCost: { type: 'number', description: 'Staff training cost (EUR)', default: 2000 },
    hardwareCost: { type: 'number', description: 'Hardware/camera installation cost (EUR)', default: 8000 },
  },

  savingMetrics: {
    timePerWeekHours: { type: 'number', description: 'Hours saved per week on data entry & search', default: 15 },
    laborHourlyCost: { type: 'number', description: 'Average hourly cost of staff (EUR)', default: 40 },
    maintenanceCostReduction: { type: 'number', description: 'Monthly maintenance cost reduction from proactive alerts (EUR)', default: 800 },
    insuranceSavings: { type: 'number', description: 'Annual insurance claim avoidance (EUR)', default: 3000 },
    taxOptimizationSavings: { type: 'number', description: 'Annual tax exit optimization savings (EUR)', default: 2500 },
    charterRevenueLift: { type: 'number', description: 'Monthly additional charter revenue from better scheduling (EUR)', default: 1500 },
  },

  inventoryMetrics: {
    currentInventoryValue: { type: 'number', description: 'Current inventory value (EUR)', default: 200000 },
    recoveryRatePercent: { type: 'number', description: 'Percentage of inventory value recovered at resale', default: 35 },
    resaleDurationMonths: { type: 'number', description: 'Months to achieve full resale value recovery', default: 18 },
  },

  assumptions: {
    discountRate: { type: 'number', description: 'Discount rate for NPV calculation (0-1)', default: 0.1 },
    inflationRate: { type: 'number', description: 'Annual inflation rate (0-1)', default: 0.02 },
    implementationMonths: { type: 'number', description: 'Months to complete implementation', default: 2 },
    forecastYears: { type: 'number', description: 'Years for financial forecasts', default: 3 },
  }
};

/**
 * ROI Calculator Class
 * Manages all calculation logic for financial projections
 */
class ROICalculator {
  constructor(inputs = {}) {
    this.inputs = this.validateAndMergeInputs(inputs);
    this.calculations = null;
    this.sensitivity = null;
  }

  /**
   * Validate and merge inputs with schema defaults
   */
  validateAndMergeInputs(inputs) {
    const merged = {};

    // Helper function to extract defaults from schema
    const extractDefaults = (schemaObj) => {
      const result = {};
      Object.entries(schemaObj).forEach(([key, def]) => {
        result[key] = def.default || 0;
      });
      return result;
    };

    // Merge investment inputs
    merged.investmentInputs = {
      ...extractDefaults(INPUT_SCHEMA.investmentInputs),
      ...inputs.investmentInputs || {}
    };

    // Merge saving metrics
    merged.savingMetrics = {
      ...extractDefaults(INPUT_SCHEMA.savingMetrics),
      ...inputs.savingMetrics || {}
    };

    // Merge inventory metrics
    merged.inventoryMetrics = {
      ...extractDefaults(INPUT_SCHEMA.inventoryMetrics),
      ...inputs.inventoryMetrics || {}
    };

    // Merge assumptions
    merged.assumptions = {
      ...extractDefaults(INPUT_SCHEMA.assumptions),
      ...inputs.assumptions || {}
    };

    return merged;
  }

  /**
   * Calculate total initial investment
   */
  calculateTotalInvestment() {
    const {
      softwareLicenseCost,
      implementationCost,
      trainingCost,
      hardwareCost
    } = this.inputs.investmentInputs;

    const totalInitialCost = softwareLicenseCost + implementationCost + trainingCost + hardwareCost;
    const firstYearAnnualLicense = softwareLicenseCost;

    return {
      initialInvestment: totalInitialCost,
      firstYearAnnualLicense: firstYearAnnualLicense,
      capitalExpenditure: implementationCost + trainingCost + hardwareCost,
      operationalExpenditure: firstYearAnnualLicense
    };
  }

  /**
   * Calculate annual recurring savings
   */
  calculateAnnualSavings() {
    const {
      timePerWeekHours,
      laborHourlyCost,
      maintenanceCostReduction,
      insuranceSavings,
      taxOptimizationSavings,
      charterRevenueLift
    } = this.inputs.savingMetrics;

    // Time-based savings (52 weeks per year)
    const timeSavingsAnnual = timePerWeekHours * 52 * laborHourlyCost;

    // Maintenance cost reduction
    const maintenanceSavingsAnnual = maintenanceCostReduction * 12;

    // Insurance and tax savings
    const insuranceSavingsAnnual = insuranceSavings;
    const taxSavingsAnnual = taxOptimizationSavings;

    // Charter revenue enhancement
    const charterRevenueAnnual = charterRevenueLift * 12;

    const totalAnnualBenefit = timeSavingsAnnual + maintenanceSavingsAnnual +
                               insuranceSavingsAnnual + taxSavingsAnnual +
                               charterRevenueAnnual;

    return {
      timeSavings: timeSavingsAnnual,
      maintenanceSavings: maintenanceSavingsAnnual,
      insuranceSavings: insuranceSavingsAnnual,
      taxSavings: taxSavingsAnnual,
      charterRevenue: charterRevenueAnnual,
      totalAnnualBenefit: totalAnnualBenefit,
      breakdown: {
        'Time Savings (Data Entry & Search)': timeSavingsAnnual,
        'Maintenance Cost Reduction': maintenanceSavingsAnnual,
        'Insurance Claim Avoidance': insuranceSavingsAnnual,
        'Tax Optimization': taxSavingsAnnual,
        'Charter Revenue Lift': charterRevenueAnnual
      }
    };
  }

  /**
   * Calculate inventory value recovery benefit
   */
  calculateInventoryRecovery() {
    const {
      currentInventoryValue,
      recoveryRatePercent,
      resaleDurationMonths
    } = this.inputs.inventoryMetrics;

    const totalRecoveryValue = (currentInventoryValue * recoveryRatePercent) / 100;
    const monthlyRecoveryRate = totalRecoveryValue / resaleDurationMonths;
    const yearsToFullRecovery = resaleDurationMonths / 12;

    return {
      totalRecoveryValue: totalRecoveryValue,
      monthlyRecoveryRate: monthlyRecoveryRate,
      yearsToFullRecovery: yearsToFullRecovery,
      recoveryPercentage: recoveryRatePercent
    };
  }

  /**
   * Calculate basic ROI metric
   * ROI = (Gain - Cost) / Cost * 100%
   */
  calculateROI(yearsToCalculate = 1) {
    const investment = this.calculateTotalInvestment();
    const savings = this.calculateAnnualSavings();
    const inventory = this.calculateInventoryRecovery();

    const totalCost = investment.initialInvestment + (investment.operationalExpenditure * (yearsToCalculate - 1));
    const totalGain = savings.totalAnnualBenefit * yearsToCalculate + inventory.totalRecoveryValue;

    const roi = ((totalGain - totalCost) / totalCost) * 100;

    return {
      roi: roi,
      totalCost: totalCost,
      totalGain: totalGain,
      netBenefit: totalGain - totalCost,
      yearsToCalculate: yearsToCalculate,
      returnOnDollar: totalGain / totalCost
    };
  }

  /**
   * Calculate time-to-value (breakeven point)
   * Determines when cumulative benefits exceed cumulative costs
   */
  calculateTimeToValue() {
    const investment = this.calculateTotalInvestment();
    const savings = this.calculateAnnualSavings();
    const inventory = this.calculateInventoryRecovery();

    const initialCost = investment.initialInvestment;
    const monthlyBenefit = (savings.totalAnnualBenefit / 12) + inventory.monthlyRecoveryRate;

    let cumulativeBenefit = 0;
    let monthsToBreakeven = 0;

    // Find breakeven point
    for (let month = 1; month <= 240; month++) { // Up to 20 years
      cumulativeBenefit += monthlyBenefit;
      if (cumulativeBenefit >= initialCost) {
        monthsToBreakeven = month;
        break;
      }
    }

    const weeksToBreakeven = monthsToBreakeven / 4.33;
    const yearsToBreakeven = monthsToBreakeven / 12;

    return {
      monthsToBreakeven: monthsToBreakeven,
      weeksToBreakeven: weeksToBreakeven,
      yearsToBreakeven: yearsToBreakeven,
      breakeven: monthsToBreakeven <= 240 ? 'Achieved' : 'Not achieved within 20 years',
      initialInvestment: initialCost,
      monthlyBenefit: monthlyBenefit
    };
  }

  /**
   * Calculate Net Present Value (NPV) for multi-year projection
   * Discounts future cash flows to present value
   */
  calculateNPV() {
    const { discountRate, forecastYears, implementationMonths } = this.inputs.assumptions;
    const investment = this.calculateTotalInvestment();
    const savings = this.calculateAnnualSavings();
    const inventory = this.calculateInventoryRecovery();

    let npv = -investment.initialInvestment; // Initial outlay
    const implementationYears = implementationMonths / 12;

    // Year-by-year NPV calculation
    const yearlyDetails = [];

    for (let year = 1; year <= forecastYears; year++) {
      const yearsFromNow = year - implementationYears;
      const discountFactor = Math.pow(1 + discountRate, yearsFromNow);

      // Calculate annual benefit
      let annualBenefit = savings.totalAnnualBenefit;

      // Add inventory recovery benefit in early years
      if (year <= inventory.yearsToFullRecovery) {
        annualBenefit += inventory.monthlyRecoveryRate * 12;
      }

      // Subtract annual software costs (after first year)
      let annualCost = 0;
      if (year > 1) {
        annualCost = investment.operationalExpenditure;
      }

      const netAnnualCashFlow = annualBenefit - annualCost;
      const presentValue = netAnnualCashFlow / discountFactor;

      npv += presentValue;

      yearlyDetails.push({
        year: year,
        benefit: annualBenefit,
        cost: annualCost,
        netCashFlow: netAnnualCashFlow,
        discountFactor: discountFactor,
        presentValue: presentValue,
        cumulativeNPV: npv
      });
    }

    return {
      npv: npv,
      discountRate: discountRate,
      forecastYears: forecastYears,
      yearlyDetails: yearlyDetails,
      averageAnnualBenefit: npv / forecastYears,
      profitabilityIndex: (npv + investment.initialInvestment) / investment.initialInvestment
    };
  }

  /**
   * Calculate Internal Rate of Return (IRR)
   * Uses Newton-Raphson method for iterative calculation
   */
  calculateIRR() {
    const { forecastYears, implementationMonths } = this.inputs.assumptions;
    const investment = this.calculateTotalInvestment();
    const savings = this.calculateAnnualSavings();
    const inventory = this.calculateInventoryRecovery();

    const implementationYears = implementationMonths / 12;

    // Build cash flow array
    const cashFlows = [-investment.initialInvestment];

    for (let year = 1; year <= forecastYears; year++) {
      let annualBenefit = savings.totalAnnualBenefit;

      if (year <= inventory.yearsToFullRecovery) {
        annualBenefit += inventory.monthlyRecoveryRate * 12;
      }

      const annualCost = year > 1 ? investment.operationalExpenditure : 0;
      cashFlows.push(annualBenefit - annualCost);
    }

    // Newton-Raphson method to find IRR
    let irr = 0.1; // Initial guess
    let tolerance = 0.0001;
    let maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let t = 0; t < cashFlows.length; t++) {
        const discountFactor = Math.pow(1 + irr, t);
        npv += cashFlows[t] / discountFactor;
        if (t > 0) {
          dnpv -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
        }
      }

      const newIrr = irr - (npv / dnpv);

      if (Math.abs(newIrr - irr) < tolerance) {
        irr = newIrr;
        break;
      }

      irr = newIrr;
    }

    return {
      irr: Math.max(0, irr) * 100, // Convert to percentage
      annualReturnRate: Math.max(0, irr) * 100,
      cashFlows: cashFlows,
      method: 'Newton-Raphson'
    };
  }

  /**
   * Run sensitivity analysis
   * Test how changes in key assumptions affect ROI
   */
  calculateSensitivityAnalysis() {
    const baseROI = this.calculateROI(3);
    const sensitivity = {};

    // Test variations in key metrics
    const variations = [-20, -10, 0, 10, 20]; // Percentage variations

    const metrics = [
      { key: 'timePerWeekHours', path: 'savingMetrics', name: 'Time Saved (hours/week)' },
      { key: 'laborHourlyCost', path: 'savingMetrics', name: 'Labor Hourly Rate' },
      { key: 'maintenanceCostReduction', path: 'savingMetrics', name: 'Maintenance Savings' },
      { key: 'softwareLicenseCost', path: 'investmentInputs', name: 'Software Cost' },
      { key: 'charterRevenueLift', path: 'savingMetrics', name: 'Charter Revenue Lift' }
    ];

    metrics.forEach(metric => {
      sensitivity[metric.name] = {};
      const originalValue = this.inputs[metric.path][metric.key];

      variations.forEach(variation => {
        const modifiedInputs = JSON.parse(JSON.stringify(this.inputs));
        modifiedInputs[metric.path][metric.key] = originalValue * (1 + variation / 100);

        const tempCalculator = new ROICalculator(modifiedInputs);
        const roi = tempCalculator.calculateROI(3);

        sensitivity[metric.name][variation] = {
          value: modifiedInputs[metric.path][metric.key],
          roi: roi.roi,
          impact: roi.roi - baseROI.roi
        };
      });
    });

    return {
      baseROI: baseROI.roi,
      sensitivity: sensitivity,
      mostImpactfulMetric: this.findMostImpactfulMetric(sensitivity)
    };
  }

  /**
   * Find which metric has the most impact on ROI
   */
  findMostImpactfulMetric(sensitivity) {
    let maxImpact = 0;
    let mostImpactful = '';

    Object.keys(sensitivity).forEach(metric => {
      const impacts = Object.values(sensitivity[metric]).map(v => Math.abs(v.impact));
      const avgImpact = impacts.reduce((a, b) => a + b) / impacts.length;

      if (avgImpact > maxImpact) {
        maxImpact = avgImpact;
        mostImpactful = metric;
      }
    });

    return { metric: mostImpactful, avgImpact: maxImpact };
  }

  /**
   * Comparison: DIY Spreadsheet vs NaviDocs vs Hiring Staff
   */
  calculateScenarioComparison() {
    const { timePerWeekHours, laborHourlyCost } = this.inputs.savingMetrics;
    const { softwareLicenseCost, implementationCost, trainingCost, hardwareCost } = this.inputs.investmentInputs;
    const roi = this.calculateROI(3);

    // Scenario 1: DIY Spreadsheet
    const diySetupCost = 500; // Time to create spreadsheet
    const diyMaintenanceCost = 800; // Annual maintenance
    const diyLostProductivity = (timePerWeekHours * 52 * laborHourlyCost) * 0.6; // 60% of time still lost
    const diyTotalCost = diySetupCost + (diyMaintenanceCost * 3) + diyLostProductivity;

    // Scenario 2: NaviDocs (our implementation)
    const navidocsInvestment = softwareLicenseCost + implementationCost + trainingCost + hardwareCost;
    const navidocsAnnualCost = softwareLicenseCost;
    const navidocsTotalCost = navidocsInvestment + (navidocsAnnualCost * 2);
    const navidocsSavings = roi.totalGain;

    // Scenario 3: Hire Full-time Staff
    const staffAnnualCost = 40000; // Full-time employee cost
    const staffOnboardingCost = 2000;
    const staffTotalCost = staffOnboardingCost + (staffAnnualCost * 3);
    const staffSavings = timePerWeekHours * 52 * laborHourlyCost * 3; // 100% of time saved

    return {
      diy: {
        scenario: 'DIY Spreadsheet',
        setupCost: diySetupCost,
        annualCost: diyMaintenanceCost,
        totalCost3Years: diyTotalCost,
        benefitsRecovered: diyLostProductivity,
        netBenefit: diyLostProductivity - diyTotalCost,
        roi: ((diyLostProductivity - diyTotalCost) / diyTotalCost * 100).toFixed(2) + '%'
      },
      navidocs: {
        scenario: 'NaviDocs Solution',
        setupCost: navidocsInvestment,
        annualCost: navidocsAnnualCost,
        totalCost3Years: navidocsTotalCost,
        benefitsRecovered: navidocsSavings,
        netBenefit: navidocsSavings - navidocsTotalCost,
        roi: roi.roi.toFixed(2) + '%'
      },
      hireStaff: {
        scenario: 'Hire Full-time Staff',
        setupCost: staffOnboardingCost,
        annualCost: staffAnnualCost,
        totalCost3Years: staffTotalCost,
        benefitsRecovered: staffSavings,
        netBenefit: staffSavings - staffTotalCost,
        roi: ((staffSavings - staffTotalCost) / staffTotalCost * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Generate comprehensive calculation results
   */
  calculate() {
    this.calculations = {
      timestamp: new Date().toISOString(),
      investment: this.calculateTotalInvestment(),
      annualSavings: this.calculateAnnualSavings(),
      inventoryRecovery: this.calculateInventoryRecovery(),
      roi: this.calculateROI(3),
      timeToValue: this.calculateTimeToValue(),
      npv: this.calculateNPV(),
      irr: this.calculateIRR(),
      scenarioComparison: this.calculateScenarioComparison(),
      sensitivity: this.calculateSensitivityAnalysis()
    };

    return this.calculations;
  }

  /**
   * Get all calculation results
   */
  getResults() {
    if (!this.calculations) {
      this.calculate();
    }
    return this.calculations;
  }
}

/**
 * Chart Generation Module
 * Provides functions to generate chart data for various visualizations
 */
class ChartGenerator {
  /**
   * Generate ROI over time line chart data
   */
  static generateROIOverTimeChart(calculator, yearsToProject = 5) {
    const { savingMetrics, investmentInputs, assumptions } = calculator.inputs;
    const investment = calculator.calculateTotalInvestment();
    const savings = calculator.calculateAnnualSavings();
    const inventory = calculator.calculateInventoryRecovery();

    const labels = [];
    const cumulativeCosts = [];
    const cumulativeBenefits = [];
    const cumulativeROI = [];

    for (let year = 0; year <= yearsToProject; year++) {
      labels.push(`Year ${year}`);

      // Cumulative costs
      const yearCost = investment.initialInvestment + (investment.operationalExpenditure * Math.max(0, year - 1));
      cumulativeCosts.push(yearCost);

      // Cumulative benefits
      const inventoryRecoveryMonths = Math.min(year * 12, inventory.yearsToFullRecovery * 12);
      const inventoryBenefit = (inventory.monthlyRecoveryRate * inventoryRecoveryMonths);
      const savingsBenefit = savings.totalAnnualBenefit * year;
      const yearBenefit = savingsBenefit + inventoryBenefit;
      cumulativeBenefits.push(yearBenefit);

      // ROI percentage
      const roi = yearCost > 0 ? ((yearBenefit - yearCost) / yearCost) * 100 : 0;
      cumulativeROI.push(roi);
    }

    return {
      type: 'line',
      labels: labels,
      datasets: [
        {
          label: 'Cumulative Costs',
          data: cumulativeCosts,
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Cumulative Benefits',
          data: cumulativeBenefits,
          borderColor: '#51CF66',
          backgroundColor: 'rgba(81, 207, 102, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'ROI %',
          data: cumulativeROI,
          borderColor: '#4C6EF5',
          backgroundColor: 'rgba(76, 110, 245, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ],
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'ROI Projection Over Time'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Amount (EUR)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'ROI %'
            }
          }
        }
      }
    };
  }

  /**
   * Generate annual savings breakdown pie chart
   */
  static generateSavingsBreakdownChart(calculator) {
    const { breakdown } = calculator.calculateAnnualSavings();

    const labels = Object.keys(breakdown);
    const data = Object.values(breakdown);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    return {
      type: 'pie',
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ],
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Annual Savings Breakdown'
          },
          legend: {
            display: true,
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / data.reduce((a, b) => a + b)) * 100).toFixed(1);
                return `${label}: EUR ${value.toFixed(0)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate cost breakdown pie chart
   */
  static generateCostBreakdownChart(calculator) {
    const { softwareLicenseCost, implementationCost, trainingCost, hardwareCost } = calculator.inputs.investmentInputs;

    const labels = ['Software License', 'Implementation', 'Training', 'Hardware'];
    const data = [softwareLicenseCost, implementationCost, trainingCost, hardwareCost];
    const colors = ['#FF6B6B', '#FFA07A', '#FFB347', '#FFA500'];

    return {
      type: 'doughnut',
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2
        }
      ],
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Initial Investment Breakdown'
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    };
  }

  /**
   * Generate feature value comparison bar chart
   */
  static generateFeatureValueChart(calculator) {
    const results = calculator.getResults();
    const annualSavings = results.annualSavings;

    const labels = [
      'Time Savings',
      'Maintenance',
      'Insurance',
      'Tax Optimization',
      'Charter Revenue'
    ];

    const data = [
      annualSavings.timeSavings,
      annualSavings.maintenanceSavings,
      annualSavings.insuranceSavings,
      annualSavings.taxSavings,
      annualSavings.charterRevenue
    ];

    const colors = ['#4C6EF5', '#51CF66', '#FFD93D', '#FF6B9D', '#A78BFA'];

    return {
      type: 'bar',
      labels: labels,
      datasets: [
        {
          label: 'Annual Value (EUR)',
          data: data,
          backgroundColor: colors,
          borderColor: '#333',
          borderWidth: 1
        }
      ],
      options: {
        responsive: true,
        indexAxis: 'x',
        plugins: {
          title: {
            display: true,
            text: 'Feature Value Comparison'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Annual Value (EUR)'
            }
          }
        }
      }
    };
  }

  /**
   * Generate scenario comparison chart
   */
  static generateScenarioComparisonChart(calculator) {
    const scenarios = calculator.calculateScenarioComparison();

    const labels = ['Setup Cost', 'Annual Cost (Avg)', 'Benefits (3yr)', 'Net Benefit (3yr)'];

    const diyData = [
      scenarios.diy.setupCost,
      scenarios.diy.annualCost,
      scenarios.diy.benefitsRecovered,
      scenarios.diy.netBenefit
    ];

    const navidocsData = [
      scenarios.navidocs.setupCost,
      scenarios.navidocs.annualCost,
      scenarios.navidocs.benefitsRecovered,
      scenarios.navidocs.netBenefit
    ];

    const staffData = [
      scenarios.hireStaff.setupCost,
      scenarios.hireStaff.annualCost,
      scenarios.hireStaff.benefitsRecovered,
      scenarios.hireStaff.netBenefit
    ];

    return {
      type: 'bar',
      labels: labels,
      datasets: [
        {
          label: 'DIY Spreadsheet',
          data: diyData,
          backgroundColor: '#FF6B6B'
        },
        {
          label: 'NaviDocs',
          data: navidocsData,
          backgroundColor: '#51CF66'
        },
        {
          label: 'Hire Staff',
          data: staffData,
          backgroundColor: '#4C6EF5'
        }
      ],
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Scenario Comparison (3-Year Horizon)'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (EUR)'
            }
          }
        }
      }
    };
  }

  /**
   * Generate sensitivity analysis heatmap data
   */
  static generateSensitivityHeatmapChart(calculator) {
    const sensitivity = calculator.calculateSensitivityAnalysis();
    const metrics = Object.keys(sensitivity.sensitivity);
    const variations = [-20, -10, 0, 10, 20];

    const heatmapData = [];
    metrics.forEach((metric, metricIdx) => {
      variations.forEach((variation, varIdx) => {
        const roi = sensitivity.sensitivity[metric][variation].roi;
        heatmapData.push({
          x: variation,
          y: metric,
          value: roi
        });
      });
    });

    return {
      type: 'bubble', // Using bubble as proxy for heatmap in most charting libraries
      data: heatmapData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sensitivity Analysis - ROI Impact'
          }
        }
      }
    };
  }
}

/**
 * Export Module
 * Handles PDF, Excel, and JSON exports
 */
class ExportManager {
  /**
   * Generate JSON export
   */
  static exportToJSON(calculator, filename = 'roi-calculation.json') {
    const results = calculator.getResults();
    const exportData = {
      exportDate: new Date().toISOString(),
      inputs: calculator.inputs,
      calculations: results,
      metadata: {
        version: '2.0.0',
        calculator: 'NaviDocs ROI Calculator',
        generatedFor: 'Yacht Management System'
      }
    };

    return {
      filename: filename,
      content: JSON.stringify(exportData, null, 2),
      mimeType: 'application/json'
    };
  }

  /**
   * Generate CSV export (for Excel compatibility)
   */
  static exportToCSV(calculator, filename = 'roi-calculation.csv') {
    const results = calculator.getResults();
    let csv = 'NaviDocs ROI Calculation Report\n';
    csv += `Generated: ${new Date().toISOString()}\n\n`;

    // Investment Summary
    csv += 'INVESTMENT SUMMARY\n';
    const investment = results.investment;
    csv += `Initial Investment,${investment.initialInvestment}\n`;
    csv += `First Year License,${investment.firstYearAnnualLicense}\n`;
    csv += `Capital Expenditure,${investment.capitalExpenditure}\n\n`;

    // Annual Savings
    csv += 'ANNUAL SAVINGS\n';
    const savings = results.annualSavings;
    Object.entries(savings.breakdown).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    csv += `Total Annual Benefit,${savings.totalAnnualBenefit}\n\n`;

    // ROI Metrics
    csv += 'KEY METRICS\n';
    csv += `3-Year ROI,%,${results.roi.roi.toFixed(2)}\n`;
    csv += `Time to Breakeven (weeks),${results.timeToValue.weeksToBreakeven.toFixed(1)}\n`;
    csv += `NPV (3 years),${results.npv.npv.toFixed(2)}\n`;
    csv += `IRR (Annual),${results.irr.annualReturnRate.toFixed(2)}\n`;

    // Sensitivity Analysis
    csv += '\nSENSITIVITY ANALYSIS - Most Impactful Metric\n';
    csv += `${results.sensitivity.mostImpactfulMetric.metric},Average Impact,${results.sensitivity.mostImpactfulMetric.avgImpact.toFixed(2)}\n`;

    return {
      filename: filename,
      content: csv,
      mimeType: 'text/csv'
    };
  }

  /**
   * Generate PDF export (requires PDF library)
   * This returns the structure; actual PDF generation requires jsPDF or similar
   */
  static exportToPDF(calculator, filename = 'roi-calculation.pdf') {
    const results = calculator.getResults();

    const pdfContent = {
      filename: filename,
      title: 'NaviDocs ROI Calculation Report',
      sections: [
        {
          title: 'Executive Summary',
          content: {
            'Investment Required': `EUR ${results.investment.initialInvestment.toFixed(2)}`,
            'Annual Savings': `EUR ${results.annualSavings.totalAnnualBenefit.toFixed(2)}`,
            '3-Year ROI': `${results.roi.roi.toFixed(2)}%`,
            'Time to Breakeven': `${results.timeToValue.weeksToBreakeven.toFixed(1)} weeks`,
            'NPV (3 years)': `EUR ${results.npv.npv.toFixed(2)}`,
            'Internal Rate of Return': `${results.irr.annualReturnRate.toFixed(2)}%`
          }
        },
        {
          title: 'Investment Breakdown',
          content: results.investment,
          chart: 'costBreakdown'
        },
        {
          title: 'Annual Savings Breakdown',
          content: results.annualSavings.breakdown,
          chart: 'savingsBreakdown'
        },
        {
          title: 'Financial Projections',
          content: results.npv,
          chart: 'roiOverTime'
        },
        {
          title: 'Scenario Comparison',
          content: results.scenarioComparison,
          chart: 'scenarioComparison'
        },
        {
          title: 'Sensitivity Analysis',
          content: results.sensitivity
        }
      ]
    };

    return {
      filename: filename,
      content: pdfContent,
      mimeType: 'application/pdf',
      requiresLibrary: 'jsPDF or similar PDF generation library'
    };
  }
}

/**
 * Unit Tests for ROI Calculator
 * Validates calculation accuracy
 */
class ROICalculatorTests {
  static runAllTests() {
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    // Test 1: Basic ROI Calculation
    try {
      const calculator = new ROICalculator();
      const roi = calculator.calculateROI(1);

      if (roi.totalCost > 0 && roi.roi > 0) {
        results.tests.push({ name: 'Basic ROI Calculation', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Basic ROI Calculation', status: 'FAILED', reason: 'Invalid ROI result' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Basic ROI Calculation', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 2: Time to Value Calculation
    try {
      const calculator = new ROICalculator();
      const ttv = calculator.calculateTimeToValue();

      if (ttv.monthsToBreakeven > 0 && ttv.monthsToBreakeven <= 240) {
        results.tests.push({ name: 'Time to Value Calculation', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Time to Value Calculation', status: 'FAILED', reason: 'Invalid breakeven point' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Time to Value Calculation', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 3: NPV Calculation
    try {
      const calculator = new ROICalculator();
      const npv = calculator.calculateNPV();

      if (typeof npv.npv === 'number' && npv.yearlyDetails.length > 0) {
        results.tests.push({ name: 'NPV Calculation', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'NPV Calculation', status: 'FAILED', reason: 'Invalid NPV structure' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'NPV Calculation', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 4: Sensitivity Analysis
    try {
      const calculator = new ROICalculator();
      const sensitivity = calculator.calculateSensitivityAnalysis();

      if (sensitivity.sensitivity && Object.keys(sensitivity.sensitivity).length > 0) {
        results.tests.push({ name: 'Sensitivity Analysis', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Sensitivity Analysis', status: 'FAILED', reason: 'Invalid sensitivity data' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Sensitivity Analysis', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 5: Custom Input Handling
    try {
      const customInputs = {
        investmentInputs: { softwareLicenseCost: 10000 },
        savingMetrics: { timePerWeekHours: 20 }
      };
      const calculator = new ROICalculator(customInputs);
      const investment = calculator.calculateTotalInvestment();

      if (investment.operationalExpenditure === 10000) {
        results.tests.push({ name: 'Custom Input Handling', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Custom Input Handling', status: 'FAILED', reason: 'Custom input not applied' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Custom Input Handling', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 6: Scenario Comparison
    try {
      const calculator = new ROICalculator();
      const scenarios = calculator.calculateScenarioComparison();

      if (scenarios.diy && scenarios.navidocs && scenarios.hireStaff) {
        results.tests.push({ name: 'Scenario Comparison', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Scenario Comparison', status: 'FAILED', reason: 'Missing scenario data' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Scenario Comparison', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    // Test 7: Chart Generation
    try {
      const calculator = new ROICalculator();
      calculator.calculate();

      const charts = [
        ChartGenerator.generateROIOverTimeChart(calculator),
        ChartGenerator.generateSavingsBreakdownChart(calculator),
        ChartGenerator.generateCostBreakdownChart(calculator),
        ChartGenerator.generateFeatureValueChart(calculator)
      ];

      if (charts.length === 4 && charts.every(c => c.type)) {
        results.tests.push({ name: 'Chart Generation', status: 'PASSED' });
        results.passed++;
      } else {
        results.tests.push({ name: 'Chart Generation', status: 'FAILED', reason: 'Invalid chart structure' });
        results.failed++;
      }
    } catch (e) {
      results.tests.push({ name: 'Chart Generation', status: 'FAILED', reason: e.message });
      results.failed++;
    }

    return results;
  }

  static printTestResults(results) {
    console.log('\n=== ROI Calculator Unit Tests ===');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}\n`);

    results.tests.forEach(test => {
      const symbol = test.status === 'PASSED' ? '✓' : '✗';
      console.log(`${symbol} ${test.name}: ${test.status}`);
      if (test.reason) {
        console.log(`  Reason: ${test.reason}`);
      }
    });
  }
}

// Module Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROICalculator,
    ChartGenerator,
    ExportManager,
    ROICalculatorTests,
    INPUT_SCHEMA
  };
}
