import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Bot, X, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AiFinancialAssistant: React.FC = () => {
  const { stats, transactions, goals, liabilities, budgets } = useFinance();
  const { formatCurrency } = useInternationalization();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m your AI financial assistant. How can I help you with your finances today?',
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate AI response based on user message
    const aiResponse = generateAiResponse(message);
    
    // Add AI response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const generateAiResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI financial assistant. I can help you understand your finances, provide insights, and answer questions about your financial situation. What would you like to know?";
    }
    
    // Check for financial summary request
    if (lowerMessage.includes('summary') || lowerMessage.includes('overview') || lowerMessage.includes('how am i doing')) {
      const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
      return `Here's a summary of your finances:\n\n• Net Worth: ${formatCurrency(netWorth)}\n• Monthly Income: ${formatCurrency(stats.monthlyIncome)}\n• Monthly Expenses: ${formatCurrency(stats.monthlyExpenses)}\n• Total Savings: ${formatCurrency(stats.totalSavings)}\n• Total Debt: ${formatCurrency(stats.totalLiabilities)}\n\nYou have ${goals.length} active goals and ${budgets.length} budget categories set up.`;
    }
    
    // Check for savings advice
    if (lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('emergency fund')) {
      return "Here are some savings tips:\n\n1. Aim to save at least 20% of your income\n2. Build an emergency fund covering 3-6 months of expenses\n3. Automate your savings with recurring transfers\n4. Consider high-yield savings accounts for better returns\n5. Review and cut unnecessary subscriptions";
    }
    
    // Check for debt advice
    if (lowerMessage.includes('debt') || lowerMessage.includes('loan') || lowerMessage.includes('credit card')) {
      return "Here's advice for managing debt:\n\n1. Focus on high-interest debt first (avalanche method)\n2. Or pay smallest balances first for quick wins (snowball method)\n3. Consider debt consolidation for multiple high-interest debts\n4. Avoid taking on new debt while paying off existing ones\n5. Make more than minimum payments when possible";
    }
    
    // Check for budget advice
    if (lowerMessage.includes('budget') || lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return "Here are budgeting tips:\n\n1. Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n2. Track all expenses to identify spending patterns\n3. Use the envelope method for discretionary spending\n4. Review and adjust your budget monthly\n5. Plan for irregular expenses like car maintenance";
    }
    
    // Check for investment advice
    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('retirement')) {
      return "Here's some investment guidance:\n\n1. Start with retirement accounts like 401(k) or IRA\n2. Consider index funds for diversification\n3. Invest regularly regardless of market conditions\n4. Maintain an age-appropriate asset allocation\n5. Reinvest dividends for compound growth\n\nRemember: This is general advice, not personalized investment recommendations.";
    }
    
    // Check for goal setting advice
    if (lowerMessage.includes('goal') || lowerMessage.includes('target') || lowerMessage.includes('plan')) {
      return "Tips for setting financial goals:\n\n1. Make goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound)\n2. Prioritize goals based on importance and timeline\n3. Break large goals into smaller milestones\n4. Automate contributions toward your goals\n5. Celebrate progress to stay motivated";
    }
    
    // Default response
    return "I'm here to help with your financial questions. You can ask me about your financial summary, savings strategies, debt management, budgeting tips, investment basics, or goal setting. What would you like to know more about?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi there! I\'m your AI financial assistant. How can I help you with your finances today?',
        timestamp: new Date()
      }
    ]);
  };

  // Suggested questions
  const suggestedQuestions = [
    "How am I doing financially?",
    "How can I save more money?",
    "What's the best way to pay off debt?",
    "How should I budget my money?",
    "Give me investment tips"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-primary-600 text-white scale-0 opacity-0' : 'bg-primary-500 text-white scale-100 opacity-100'
        }`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-0 right-0 z-40 w-full sm:w-96 transition-all duration-300 transform ${
        isOpen 
          ? isMinimized 
            ? 'translate-y-[calc(100%-3rem)] sm:translate-y-[calc(100%-3rem)] sm:right-4'
            : 'translate-y-0 sm:right-4 sm:bottom-4 sm:rounded-2xl'
          : 'translate-y-full sm:translate-y-full sm:right-4'
      }`}>
        {/* Header */}
        <div className="bg-primary-600 text-white p-3 flex items-center justify-between sm:rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-primary-200" />
            <div>
              <h3 className="font-medium">Financial Assistant</h3>
              <p className="text-xs text-primary-200">Powered by AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {isOpen && !isMinimized && (
              <button 
                onClick={clearChat}
                className="p-1.5 hover:bg-primary-500 rounded-lg transition-colors"
                title="Clear chat"
              >
                <X size={16} />
              </button>
            )}
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-primary-500 rounded-lg transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-primary-500 rounded-lg transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        {!isMinimized && (
          <div className="bg-black/90 backdrop-blur-md h-96 overflow-y-auto p-4 flex flex-col space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl p-3 text-gray-200 max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMessage(question);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        {!isMinimized && (
          <div className="bg-gray-900 p-3 border-t border-gray-800 flex items-center space-x-2 sm:rounded-b-2xl">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your finances..."
                className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <Sparkles size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400" />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
              className="p-2 rounded-full"
              size="sm"
            >
              <Send size={18} />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};