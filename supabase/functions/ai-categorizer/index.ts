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

// Fallback categorization function when OpenAI is not available
function fallbackCategorizeTransaction(description: string) {
  const lowerDesc = description.toLowerCase();
  
  // Income categories
  if (
    lowerDesc.includes('salary') || 
    lowerDesc.includes('paycheck') || 
    lowerDesc.includes('wage') ||
    lowerDesc.includes('direct deposit')
  ) {
    return { type: 'income', category: 'Salary' };
  }
  
  if (
    lowerDesc.includes('freelance') || 
    lowerDesc.includes('contract') || 
    lowerDesc.includes('gig') ||
    lowerDesc.includes('client')
  ) {
    return { type: 'income', category: 'Freelance' };
  }
  
  if (
    lowerDesc.includes('dividend') || 
    lowerDesc.includes('interest') || 
    lowerDesc.includes('stock') ||
    lowerDesc.includes('investment return')
  ) {
    return { type: 'income', category: 'Investment' };
  }
  
  if (
    lowerDesc.includes('gift') || 
    lowerDesc.includes('present') || 
    lowerDesc.includes('bonus')
  ) {
    return { type: 'income', category: 'Gift' };
  }
  
  // Expense categories
  if (
    lowerDesc.includes('rent') || 
    lowerDesc.includes('mortgage') || 
    lowerDesc.includes('housing') ||
    lowerDesc.includes('apartment')
  ) {
    return { type: 'expense', category: 'Housing' };
  }
  
  if (
    lowerDesc.includes('grocery') || 
    lowerDesc.includes('food') || 
    lowerDesc.includes('restaurant') ||
    lowerDesc.includes('cafe') ||
    lowerDesc.includes('meal') ||
    lowerDesc.includes('dinner')
  ) {
    return { type: 'expense', category: 'Food' };
  }
  
  if (
    lowerDesc.includes('gas') || 
    lowerDesc.includes('uber') || 
    lowerDesc.includes('lyft') ||
    lowerDesc.includes('taxi') ||
    lowerDesc.includes('car') ||
    lowerDesc.includes('train') ||
    lowerDesc.includes('bus') ||
    lowerDesc.includes('transit')
  ) {
    return { type: 'expense', category: 'Transportation' };
  }
  
  if (
    lowerDesc.includes('movie') || 
    lowerDesc.includes('netflix') || 
    lowerDesc.includes('spotify') ||
    lowerDesc.includes('concert') ||
    lowerDesc.includes('theater') ||
    lowerDesc.includes('game')
  ) {
    return { type: 'expense', category: 'Entertainment' };
  }
  
  if (
    lowerDesc.includes('doctor') || 
    lowerDesc.includes('hospital') || 
    lowerDesc.includes('medical') ||
    lowerDesc.includes('pharmacy') ||
    lowerDesc.includes('health')
  ) {
    return { type: 'expense', category: 'Healthcare' };
  }
  
  if (
    lowerDesc.includes('amazon') || 
    lowerDesc.includes('walmart') || 
    lowerDesc.includes('target') ||
    lowerDesc.includes('shop') ||
    lowerDesc.includes('store') ||
    lowerDesc.includes('mall')
  ) {
    return { type: 'expense', category: 'Shopping' };
  }
  
  if (
    lowerDesc.includes('electric') || 
    lowerDesc.includes('water') || 
    lowerDesc.includes('utility') ||
    lowerDesc.includes('internet') ||
    lowerDesc.includes('phone') ||
    lowerDesc.includes('bill')
  ) {
    return { type: 'expense', category: 'Bills' };
  }
  
  // Default to expense/other if no match found
  return { type: 'expense', category: 'Other' };
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
    const { description } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Define categories
    const incomeCategories = [
      "Salary",
      "Freelance",
      "Investment",
      "Business",
      "Bonus",
      "Gift",
      "Other",
    ];

    const expenseCategories = [
      "Housing",
      "Food",
      "Transportation",
      "Entertainment",
      "Healthcare",
      "Shopping",
      "Bills",
      "Savings",
      "Other",
    ];

    try {
      // Determine if this is likely income or expense
      const transactionTypePrompt = `
        Based on the following transaction description, determine if this is most likely an income or expense transaction.
        Description: "${description}"
        Respond with only one word: "income" or "expense".
      `;

      const typeResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial assistant that categorizes transactions.",
          },
          {
            role: "user",
            content: transactionTypePrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const transactionType = typeResponse.choices[0].message.content?.trim().toLowerCase();
      const categories = transactionType === "income" ? incomeCategories : expenseCategories;

      // Categorize the transaction
      const categorizationPrompt = `
        Based on the following transaction description, categorize it into one of these categories:
        ${categories.join(", ")}
        
        Description: "${description}"
        
        Respond with only the category name, nothing else.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial assistant that categorizes transactions.",
          },
          {
            role: "user",
            content: categorizationPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 20,
      });

      const category = response.choices[0].message.content?.trim();

      return new Response(
        JSON.stringify({
          type: transactionType,
          category: category,
          confidence: 0.85, // Placeholder for confidence score
        }),
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
      console.log("Falling back to rule-based categorization");
      
      // Fallback to rule-based categorization
      const result = fallbackCategorizeTransaction(description);
      
      return new Response(
        JSON.stringify({
          type: result.type,
          category: result.category,
          confidence: 0.7, // Lower confidence for rule-based approach
          fallback: true
        }),
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