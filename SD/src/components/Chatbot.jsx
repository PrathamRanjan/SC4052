import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, ChevronUp, ChevronDown } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am Sentinel AI. Ask me anything about misinformation, fact-checking, or how to evaluate sources.' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Backend server URL
  const BACKEND_URL = 'http://localhost:5003';
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    
    setInputValue('');
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.response) {
        setMessages(prev => [...prev, data.response]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        }]);
        console.error('Error in chatbot response:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot Button */}
      <button
        onClick={toggleChatbot}
        className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-transform duration-300 transform hover:-translate-y-1 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
      
      {/* Chatbot Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 p-3 text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-medium">Sentinel AI</h3>
                <p className="text-xs text-cyan-100">Ask me about misinformation</p>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-80">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`rounded-lg p-2.5 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-gray-200 p-2 flex">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white px-3 py-2 rounded-r-md"
              disabled={isLoading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;