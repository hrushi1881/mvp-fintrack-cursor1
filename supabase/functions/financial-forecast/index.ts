import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Function to calculate compound interest
function calculateCompoundInterest(principal: number, rate: number, time: number, compoundingFrequency: number = 12) {
  const r = rate / 100;
  const n = compoundingFrequency;
  const t = time;
  return principal * Math.pow(1 + r / n, n * t);
}

// Function to calculate loan amortization
function calculateLoanPayoff(principal: number, rate: number, monthlyPayment: number) {
  const monthlyRate = rate / 100 / 12;
  let balance = principal;
  let months = 0;
  let totalInterest = 0;
  
  while (balance > 0 && months < 1200) { // Cap at 100 years to prevent infinite loops
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    
    balance -= principalPayment;
    totalInterest += interestPayment;
    months++;
    
    if (principalPayment <= 0) break; // In case payment is too small to cover interest
  }
  
  return { months, totalInterest, totalPaid: principal + totalInterest };
}

// Function to generate financial forecast
function generateFinancialForecast(financialData: any) {
  const {
    income,
    expenses,
    savings,
    liabilities,
    goals,
    savingsRate,
    timeHorizon = 5, // Default to 5 years
  } = financialData;

  const monthlyIncome = income.monthly || 0;
  const monthlyExpenses = expenses.monthly || 0;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const currentSavings = savings.current || 0;
  const currentDebt = liabilities.total || 0;
  
  // Calculate forecast for different time periods
  const forecast = {
    summary: {
      currentNetWorth: currentSavings - currentDebt,
      monthlySavings,
      savingsRate: savingsRate || (monthlySavings / monthlyIncome) * 100,
    },
    shortTerm: { // 1 year
      savings: currentSavings + (monthlySavings * 12),
      netWorth: 0,
      debtRemaining: 0,
      goalProgress: {},
    },
    mediumTerm: { // 5 years
      savings: 0,
      netWorth: 0,
      debtRemaining: 0,
      goalProgress: {},
    },
    longTerm: { // 10 years
      savings: 0,
      netWorth: 0,
      debtRemaining: 0,
      goalProgress: {},
    },
    retirementProjection: {
      age65Savings: 0,
      monthlyRetirementIncome: 0,
      yearsOfRetirementCovered: 0,
    },
    scenarios: {
      conservative: { netWorth: 0, savings: 0 },
      moderate: { netWorth: 0, savings: 0 },
      aggressive: { netWorth: 0, savings: 0 },
    },
    recommendations: [],
  };

  // Calculate debt payoff
  let remainingDebt = currentDebt;
  const monthlyDebtPayments = liabilities.monthlyPayment || 0;
  
  // Short term (1 year) debt calculation
  const shortTermDebtPaid = Math.min(monthlyDebtPayments * 12, currentDebt);
  forecast.shortTerm.debtRemaining = Math.max(0, currentDebt - shortTermDebtPaid);
  
  // Medium term (5 years) debt calculation
  const mediumTermDebtPaid = Math.min(monthlyDebtPayments * 60, currentDebt);
  forecast.mediumTerm.debtRemaining = Math.max(0, currentDebt - mediumTermDebtPaid);
  
  // Long term (10 years) debt calculation
  const longTermDebtPaid = Math.min(monthlyDebtPayments * 120, currentDebt);
  forecast.longTerm.debtRemaining = Math.max(0, currentDebt - longTermDebtPaid);

  // Calculate savings growth with compound interest
  const conservativeRate = 3; // 3% annual return
  const moderateRate = 6; // 6% annual return
  const aggressiveRate = 9; // 9% annual return
  
  // Short term savings (1 year)
  const shortTermSavings = currentSavings + (monthlySavings * 12);
  forecast.shortTerm.savings = shortTermSavings;
  forecast.shortTerm.netWorth = shortTermSavings - forecast.shortTerm.debtRemaining;
  
  // Medium term savings (5 years)
  const mediumTermBaseSavings = currentSavings + (monthlySavings * 60);
  const mediumTermInterest = calculateCompoundInterest(currentSavings, moderateRate, 5) - currentSavings;
  forecast.mediumTerm.savings = mediumTermBaseSavings + mediumTermInterest;
  forecast.mediumTerm.netWorth = forecast.mediumTerm.savings - forecast.mediumTerm.debtRemaining;
  
  // Long term savings (10 years)
  const longTermBaseSavings = currentSavings + (monthlySavings * 120);
  const longTermInterest = calculateCompoundInterest(currentSavings, moderateRate, 10) - currentSavings;
  forecast.longTerm.savings = longTermBaseSavings + longTermInterest;
  forecast.longTerm.netWorth = forecast.longTerm.savings - forecast.longTerm.debtRemaining;

  // Calculate scenarios with different investment returns
  forecast.scenarios.conservative.savings = calculateCompoundInterest(currentSavings, conservativeRate, timeHorizon) + 
                                           (monthlySavings * 12 * timeHorizon * (1 + conservativeRate/200 * timeHorizon));
  forecast.scenarios.conservative.netWorth = forecast.scenarios.conservative.savings - 
                                            (timeHorizon <= 1 ? forecast.shortTerm.debtRemaining : 
                                             timeHorizon <= 5 ? forecast.mediumTerm.debtRemaining : 
                                             forecast.longTerm.debtRemaining);
  
  forecast.scenarios.moderate.savings = calculateCompoundInterest(currentSavings, moderateRate, timeHorizon) + 
                                       (monthlySavings * 12 * timeHorizon * (1 + moderateRate/200 * timeHorizon));
  forecast.scenarios.moderate.netWorth = forecast.scenarios.moderate.savings - 
                                        (timeHorizon <= 1 ? forecast.shortTerm.debtRemaining : 
                                         timeHorizon <= 5 ? forecast.mediumTerm.debtRemaining : 
                                         forecast.longTerm.debtRemaining);
  
  forecast.scenarios.aggressive.savings = calculateCompoundInterest(currentSavings, aggressiveRate, timeHorizon) + 
                                         (monthlySavings * 12 * timeHorizon * (1 + aggressiveRate/200 * timeHorizon));
  forecast.scenarios.aggressive.netWorth = forecast.scenarios.aggressive.savings - 
                                          (timeHorizon <= 1 ? forecast.shortTerm.debtRemaining : 
                                           timeHorizon <= 5 ? forecast.mediumTerm.debtRemaining : 
                                           forecast.longTerm.debtRemaining);

  // Calculate retirement projection
  // Assuming the user is 30 years old and will retire at 65
  const yearsToRetirement = 35;
  const retirementSavings = calculateCompoundInterest(currentSavings, moderateRate, yearsToRetirement) + 
                           (monthlySavings * 12 * yearsToRetirement * (1 + moderateRate/200 * yearsToRetirement));
  
  forecast.retirementProjection.age65Savings = retirementSavings;
  // Using the 4% rule for sustainable withdrawal
  forecast.retirementProjection.monthlyRetirementIncome = (retirementSavings * 0.04) / 12;
  // How many years this would last (assuming 4% withdrawal and no additional growth)
  forecast.retirementProjection.yearsOfRetirementCovered = retirementSavings / (forecast.retirementProjection.monthlyRetirementIncome * 12);

  // Goal progress forecasting
  if (goals && goals.length > 0) {
    goals.forEach((goal: any) => {
      const { id, title, targetAmount, currentAmount, targetDate } = goal;
      
      // Calculate months until target date
      const targetDateObj = new Date(targetDate);
      const currentDate = new Date();
      const monthsUntilTarget = (targetDateObj.getFullYear() - currentDate.getFullYear()) * 12 + 
                               (targetDateObj.getMonth() - currentDate.getMonth());
      
      if (monthsUntilTarget <= 0) {
        // Goal is already due
        forecast.shortTerm.goalProgress[id] = {
          title,
          projectedAmount: currentAmount,
          percentageComplete: (currentAmount / targetAmount) * 100,
          willReachTarget: currentAmount >= targetAmount,
        };
      } else {
        // Calculate how much will be saved towards this goal
        // Assuming equal distribution of savings across active goals
        const activeGoals = goals.filter((g: any) => new Date(g.targetDate) > currentDate).length;
        const monthlyGoalContribution = monthlySavings / activeGoals;
        
        // Short term projection (up to 12 months)
        const shortTermMonths = Math.min(12, monthsUntilTarget);
        const shortTermProjection = currentAmount + (monthlyGoalContribution * shortTermMonths);
        forecast.shortTerm.goalProgress[id] = {
          title,
          projectedAmount: shortTermProjection,
          percentageComplete: (shortTermProjection / targetAmount) * 100,
          willReachTarget: shortTermProjection >= targetAmount,
          monthlyContributionNeeded: monthsUntilTarget > 0 ? (targetAmount - currentAmount) / monthsUntilTarget : 0,
        };
        
        // Medium term projection (up to 5 years)
        if (monthsUntilTarget > 12 && monthsUntilTarget <= 60) {
          const mediumTermProjection = currentAmount + (monthlyGoalContribution * monthsUntilTarget);
          forecast.mediumTerm.goalProgress[id] = {
            title,
            projectedAmount: mediumTermProjection,
            percentageComplete: (mediumTermProjection / targetAmount) * 100,
            willReachTarget: mediumTermProjection >= targetAmount,
            monthlyContributionNeeded: (targetAmount - currentAmount) / monthsUntilTarget,
          };
        }
        
        // Long term projection (beyond 5 years)
        if (monthsUntilTarget > 60) {
          const longTermProjection = currentAmount + (monthlyGoalContribution * monthsUntilTarget);
          // Add some compound interest for long-term goals
          const interestGain = calculateCompoundInterest(currentAmount, moderateRate, monthsUntilTarget/12) - currentAmount;
          const longTermWithInterest = longTermProjection + interestGain;
          
          forecast.longTerm.goalProgress[id] = {
            title,
            projectedAmount: longTermWithInterest,
            percentageComplete: (longTermWithInterest / targetAmount) * 100,
            willReachTarget: longTermWithInterest >= targetAmount,
            monthlyContributionNeeded: (targetAmount - currentAmount) / monthsUntilTarget,
          };
        }
      }
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  // Savings rate recommendation
  if (forecast.summary.savingsRate < 15) {
    recommendations.push({
      type: "critical",
      title: "Increase Your Savings Rate",
      description: "Your current savings rate is below 15%. Aim to save at least 20% of your income for long-term financial health.",
      action: "Review your budget to find areas where you can reduce expenses."
    });
  } else if (forecast.summary.savingsRate < 20) {
    recommendations.push({
      type: "warning",
      title: "Boost Your Savings",
      description: "Your savings rate is good but could be better. Try to increase it to at least 20% for optimal financial growth.",
      action: "Look for ways to increase income or further reduce expenses."
    });
  } else {
    recommendations.push({
      type: "positive",
      title: "Excellent Savings Rate",
      description: `Your savings rate of ${forecast.summary.savingsRate.toFixed(1)}% is excellent. Keep up the good work!`,
      action: "Consider investing more aggressively for long-term growth."
    });
  }
  
  // Debt recommendation
  if (currentDebt > monthlyIncome * 6) {
    recommendations.push({
      type: "critical",
      title: "High Debt Load",
      description: "Your debt is more than 6 months of your income. Focus on debt reduction as a priority.",
      action: "Consider the debt avalanche method (paying highest interest first) to reduce interest costs."
    });
  } else if (currentDebt > 0) {
    recommendations.push({
      type: "warning",
      title: "Debt Reduction Strategy",
      description: "Continue paying down your debt while building savings.",
      action: "Make at least the minimum payments on all debts, and put extra toward the highest interest debt."
    });
  }
  
  // Retirement recommendation
  if (forecast.retirementProjection.monthlyRetirementIncome < monthlyExpenses) {
    recommendations.push({
      type: "warning",
      title: "Retirement Savings Gap",
      description: "Your projected retirement income may not cover your current expenses.",
      action: "Increase retirement contributions or consider additional investment vehicles."
    });
  }
  
  // Investment recommendation
  if (currentSavings > monthlyExpenses * 6 && forecast.scenarios.conservative.savings === forecast.scenarios.moderate.savings) {
    recommendations.push({
      type: "opportunity",
      title: "Investment Opportunity",
      description: "You have sufficient emergency savings. Consider investing more for better long-term returns.",
      action: "Look into index funds or other diversified investment options."
    });
  }
  
  forecast.recommendations = recommendations;

  return forecast;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { financialData } = await req.json();

    if (!financialData) {
      return new Response(
        JSON.stringify({ error: "Financial data is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate financial forecast
    const forecast = generateFinancialForecast(financialData);

    return new Response(
      JSON.stringify(forecast),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});