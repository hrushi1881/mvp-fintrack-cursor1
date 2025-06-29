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

// Fallback insights generator when OpenAI is not available
function fallbackGenerateInsights(financialData: any) {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    topExpenseCategories = [],
    savingsRate = 0,
    budgetUtilization = 0,
    goals = [],
    liabilities = [],
    netWorth = 0,
  } = financialData;

  const insights = [];

  // Savings rate analysis
  if (savingsRate < 10) {
    insights.push({
      title: "Improve Your Savings Rate",
      description: `Your current savings rate of ${savingsRate.toFixed(1)}% is below the recommended 20%. Consider reducing discretionary spending or finding ways to increase your income to build a stronger financial foundation.`,
      type: "warning"
    });
  } else if (savingsRate >= 20) {
    insights.push({
      title: "Excellent Savings Discipline",
      description: `Your savings rate of ${savingsRate.toFixed(1)}% is outstanding! You're well on track to achieve your financial goals. Consider investing your surplus savings for long-term growth.`,
      type: "positive"
    });
  } else {
    insights.push({
      title: "Good Savings Progress",
      description: `Your savings rate of ${savingsRate.toFixed(1)}% is solid. Try to gradually increase it to 20% or more by optimizing your spending in categories where you have flexibility.`,
      type: "info"
    });
  }

  // Budget utilization analysis
  if (budgetUtilization > 90) {
    insights.push({
      title: "Budget Strain Alert",
      description: `You're using ${budgetUtilization.toFixed(1)}% of your budget. Consider reviewing your spending patterns and identifying areas where you can cut back to avoid overspending.`,
      type: "warning"
    });
  } else if (budgetUtilization < 70) {
    insights.push({
      title: "Budget Opportunity",
      description: `You're only using ${budgetUtilization.toFixed(1)}% of your budget. This gives you flexibility to either increase savings or allocate more funds toward your financial goals.`,
      type: "positive"
    });
  }

  // Expense category analysis
  if (topExpenseCategories && topExpenseCategories.length > 0) {
    const topCategory = topExpenseCategories[0];
    if (topCategory.percentage > 40) {
      insights.push({
        title: `High Spending in ${topCategory.category}`,
        description: `${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of your expenses. Consider if this allocation aligns with your priorities and look for optimization opportunities.`,
        type: "info"
      });
    }
  }

  // Goals analysis
  if (goals && goals.length > 0) {
    const activeGoals = goals.filter((goal: any) => goal.currentAmount < goal.targetAmount);
    if (activeGoals.length > 0) {
      const totalGoalGap = activeGoals.reduce((sum: number, goal: any) => 
        sum + (goal.targetAmount - goal.currentAmount), 0);
      
      insights.push({
        title: "Goal Achievement Strategy",
        description: `You have ${activeGoals.length} active goals requiring $${totalGoalGap.toLocaleString()} total. Consider setting up automatic transfers to systematically work toward these targets.`,
        type: "info"
      });
    }
  }

  // Debt analysis
  if (liabilities && liabilities.length > 0) {
    const totalDebt = liabilities.reduce((sum: number, liability: any) => 
      sum + liability.remainingAmount, 0);
    
    if (totalDebt > monthlyIncome * 6) {
      insights.push({
        title: "Debt Management Priority",
        description: `Your total debt of $${totalDebt.toLocaleString()} is significant relative to your income. Focus on paying down high-interest debt first while maintaining minimum payments on others.`,
        type: "warning"
      });
    }
  }

  // Net worth analysis
  if (netWorth < 0) {
    insights.push({
      title: "Building Positive Net Worth",
      description: "Your net worth is currently negative. Focus on paying down debt and building an emergency fund to establish a solid financial foundation.",
      type: "warning"
    });
  } else if (netWorth > monthlyIncome * 12) {
    insights.push({
      title: "Strong Financial Position",
      description: `Your net worth of $${netWorth.toLocaleString()} shows excellent financial health. Consider diversifying your investments and planning for long-term wealth building.`,
      type: "positive"
    });
  }

  // Ensure we always return at least 3 insights
  if (insights.length < 3) {
    insights.push({
      title: "Financial Health Check",
      description: "Continue monitoring your spending patterns and regularly review your financial goals. Small, consistent improvements compound over time.",
      type: "info"
    });
    
    insights.push({
      title: "Automate Your Finances",
      description: "Set up automatic transfers for savings and bill payments to ensure consistency and reduce the risk of missed payments.",
      type: "info"
    });
    
    insights.push({
      title: "Review Your Insurance Coverage",
      description: "Regularly review your insurance policies to ensure you have adequate coverage for your needs at competitive rates.",
      type: "info"
    });
  }

  return insights.slice(0, 5); // Return maximum 5 insights
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

    try {
      // Create a prompt for the AI model
      const prompt = `
        You are a financial advisor analyzing a user's financial data. Provide 3-5 personalized insights about their financial situation.
        Each insight should have a title, a detailed description, and be categorized as "positive", "warning", or "info".
        
        Here's their financial data:
        - Monthly Income: $${financialData.monthlyIncome || 0}
        - Monthly Expenses: $${financialData.monthlyExpenses || 0}
        - Savings Rate: ${financialData.savingsRate || 0}%
        - Budget Utilization: ${financialData.budgetUtilization || 0}%
        - Net Worth: $${financialData.netWorth || 0}
        - Total Savings: $${financialData.totalSavings || 0}
        - Total Debt: $${financialData.totalLiabilities || 0}
        
        Format your response as a JSON array of insights, each with these fields:
        [
          {
            "title": "Insight title",
            "description": "Detailed explanation of the insight",
            "type": "positive/warning/info"
          }
        ]
      `;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor providing personalized insights based on financial data.",
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
      let insights;
      
      try {
        const parsedResponse = JSON.parse(content || "{}");
        insights = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.insights || [];
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        insights = fallbackGenerateInsights(financialData);
      }

      return new Response(
        JSON.stringify(insights),
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
      console.log("Falling back to rule-based insights");
      
      // Fallback to rule-based insights
      const insights = fallbackGenerateInsights(financialData);
      
      return new Response(
        JSON.stringify(insights),
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