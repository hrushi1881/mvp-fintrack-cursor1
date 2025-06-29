import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// Fallback forecast generator when OpenAI is not available
function fallbackGenerateForecast(financialData: any) {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    totalSavings = 0,
    totalLiabilities = 0,
    savingsRate = 0,
    debtToIncomeRatio = 0,
    budgetUtilization = 0,
    netWorth = 0,
  } = financialData;

  // Calculate a mock health score
  let healthScore = 50; // Start with average
  
  // Adjust based on savings rate (0-20 points)
  healthScore += Math.min(savingsRate, 20);
  
  // Adjust based on debt-to-income ratio (-20 to 0 points)
  healthScore -= Math.min(debtToIncomeRatio * 50, 20);
  
  // Adjust based on budget utilization (-10 to 10 points)
  healthScore += 10 - Math.abs(budgetUtilization - 80) / 2;
  
  // Ensure score is between 0-100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Determine financial status
  let status;
  if (healthScore >= 80) status = "excellent";
  else if (healthScore >= 60) status = "good";
  else if (healthScore >= 40) status = "fair";
  else status = "needs improvement";

  // Generate recommendations based on financial data
  const recommendations = [];
  
  if (savingsRate < 20) {
    recommendations.push({
      title: "Increase Your Savings Rate",
      description: "Your current savings rate is below the recommended 20%. Try to increase your savings by reducing discretionary spending or finding additional income sources.",
      impact: "high"
    });
  }
  
  if (debtToIncomeRatio > 0.36) {
    recommendations.push({
      title: "Reduce Debt-to-Income Ratio",
      description: "Your debt-to-income ratio is above the recommended 36%. Focus on paying down high-interest debt first to improve your financial flexibility.",
      impact: "high"
    });
  }
  
  if (totalSavings < monthlyExpenses * 3) {
    recommendations.push({
      title: "Build Emergency Fund",
      description: "Your emergency fund should cover 3-6 months of expenses. Prioritize building this safety net.",
      impact: "medium"
    });
  }
  
  if (budgetUtilization > 95) {
    recommendations.push({
      title: "Review Budget Allocations",
      description: "You're using almost all of your budget, which leaves little room for unexpected expenses. Consider adjusting your budget categories or finding ways to reduce expenses.",
      impact: "medium"
    });
  }
  
  if (monthlyIncome > 0 && monthlyExpenses / monthlyIncome > 0.7) {
    recommendations.push({
      title: "Reduce Expense-to-Income Ratio",
      description: "Your expenses represent a high percentage of your income. Aim to keep this below 70% to allow for savings and financial flexibility.",
      impact: "medium"
    });
  }
  
  // Ensure we have at least 3 recommendations
  if (recommendations.length < 3) {
    recommendations.push({
      title: "Diversify Income Sources",
      description: "Consider developing additional income streams to increase financial stability and accelerate progress toward your financial goals.",
      impact: "medium"
    });
    
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Review and Optimize Investments",
        description: "Regularly review your investment portfolio to ensure it aligns with your risk tolerance and financial goals. Consider low-cost index funds for long-term growth.",
        impact: "medium"
      });
    }
  }

  // Take only the first 3 recommendations
  const topRecommendations = recommendations.slice(0, 3);

  return {
    summary: `Your financial health is ${status} with a net worth of $${netWorth.toLocaleString()} and a savings rate of ${savingsRate.toFixed(1)}%. Your debt-to-income ratio is ${(debtToIncomeRatio * 100).toFixed(1)}% and you're utilizing ${budgetUtilization.toFixed(1)}% of your budget.`,
    forecast: `Based on your current income of $${monthlyIncome.toLocaleString()} and expenses of $${monthlyExpenses.toLocaleString()} per month, you're projected to ${monthlyIncome > monthlyExpenses ? 'increase' : 'decrease'} your net worth by approximately $${Math.abs(monthlyIncome - monthlyExpenses).toLocaleString()} monthly. ${totalLiabilities > 0 ? `Your debt repayment is on track to reduce your liabilities by about $${(totalLiabilities * 0.05).toLocaleString()} in the next 6 months.` : ''} ${savingsRate > 0 ? `At your current savings rate, you'll add approximately $${(monthlyIncome * savingsRate / 100 * 6).toLocaleString()} to your savings in the next 6 months.` : ''}`,
    recommendations: topRecommendations,
    healthScore: Math.round(healthScore)
  };
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

    // Extract key financial metrics
    const {
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      totalSavings,
      totalLiabilities,
      savingsRate,
      debtToIncomeRatio,
      budgetUtilization,
      expenseBreakdown,
      incomeBreakdown,
      goals,
      liabilities,
      monthlyTrends
    } = financialData;

    try {
      // Create a prompt for the AI model
      const prompt = `
        You are a financial advisor analyzing a user's financial data. Provide a concise analysis with:
        1. A brief summary of their current financial health (2-3 sentences)
        2. A short-term financial forecast for the next 3-6 months (3-4 sentences)
        3. Three specific, actionable recommendations to improve their financial health

        Here's their financial data:
        - Net Worth: $${netWorth}
        - Monthly Income: $${monthlyIncome}
        - Monthly Expenses: $${monthlyExpenses}
        - Total Savings: $${totalSavings}
        - Total Liabilities: $${totalLiabilities}
        - Savings Rate: ${savingsRate}%
        - Debt-to-Income Ratio: ${debtToIncomeRatio}
        - Budget Utilization: ${budgetUtilization}%
        
        ${goals && goals.length > 0 ? `- Financial Goals: ${goals.map((g: any) => `${g.title} ($${g.currentAmount}/$${g.targetAmount})`).join(', ')}` : ''}
        ${liabilities && liabilities.length > 0 ? `- Liabilities: ${liabilities.map((l: any) => `${l.name} ($${l.remainingAmount} remaining)`).join(', ')}` : ''}
        
        Format your response as a JSON object with these fields:
        {
          "summary": "Current financial health summary",
          "forecast": "Short-term financial forecast",
          "recommendations": [
            {"title": "First recommendation title", "description": "Detailed explanation", "impact": "high/medium/low"},
            {"title": "Second recommendation title", "description": "Detailed explanation", "impact": "high/medium/low"},
            {"title": "Third recommendation title", "description": "Detailed explanation", "impact": "high/medium/low"}
          ],
          "healthScore": A number from 0-100 representing overall financial health
        }
      `;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor providing analysis and recommendations based on financial data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      // Parse the response
      const content = response.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(content || "{}");
      } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        parsedResponse = fallbackGenerateForecast(financialData);
      }

      return new Response(
        JSON.stringify(parsedResponse),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (openAiError) {
      console.error("OpenAI API error:", openAiError);
      console.log("Falling back to rule-based forecast");
      
      // Fallback to rule-based forecast
      const forecast = fallbackGenerateForecast(financialData);
      
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
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error.message 
      }),
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