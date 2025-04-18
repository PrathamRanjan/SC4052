import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, RotateCcw, Award, Save } from 'lucide-react';

const GameStyleCourtroom = () => {
  const [gameState, setGameState] = useState('topic-selection'); // 'topic-selection', 'debating', 'judgment'
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debateTime, setDebateTime] = useState(300); // 5 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [setJudgmentInProgress] = useState(false);
  const [finalJudgment, setFinalJudgment] = useState(null);

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  
  // Backend server URL
  const BACKEND_URL = 'http://localhost:5003';
  
  // Predefined debate topics
  const debateTopics = [
    "Are social media companies responsible for misinformation on their platforms?",
    "Should AI-generated content require mandatory disclosure?",
    "Is complete online privacy a right or a privilege?",
    "Should there be stricter regulation of news media to combat misinformation?"
  ];
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Timer logic
  useEffect(() => {
    if (isTimerRunning && debateTime > 0) {
      timerRef.current = setTimeout(() => {
        setDebateTime(debateTime - 1);
      }, 1000);
    } else if (debateTime === 0 && gameState === 'debating') {
      // Debate time ended
      setIsTimerRunning(false);
      setGameState('judgment');
      
      // Add system message about time being up
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'TIME UP! The judge is now reviewing the arguments...',
        timestamp: new Date().toISOString()
      }]);
      
      // Call the judgment API
      judgeDebate();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, debateTime, gameState]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const selectTopic = (selectedTopic) => {
    setTopic(selectedTopic);
    startDebate(selectedTopic);
  };
  
  const handleCustomTopicChange = (e) => {
    setCustomTopic(e.target.value);
  };
  
  const submitCustomTopic = (e) => {
    e.preventDefault();
    if (customTopic.trim()) {
      setTopic(customTopic);
      startDebate(customTopic);
    }
  };
  
  const startDebate = async (selectedTopic) => {
    setIsLoading(true);
    
    try {
      // Call the debate start API
      const response = await fetch(`${BACKEND_URL}/api/debate/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: selectedTopic
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGameState('debating');
        setIsTimerRunning(true);
        
        // Initialize the debate with system message and AI first message
        setMessages([
          {
            role: 'system',
            content: `DEBATE STARTED: "${selectedTopic}"`,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: data.opening_statement,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        throw new Error(data.error || 'Failed to start debate');
      }
    } catch (error) {
      console.error('Error starting debate:', error);
      // Display error to user
      alert(`Failed to start debate: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || gameState === 'judgment') return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Call the debate response API
      const response = await fetch(`${BACKEND_URL}/api/debate/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: topic,
          messages: messages.concat(userMessage)
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const aiResponse = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting debate response:', error);
      // Add error message to the chat
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: Failed to get response. ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const judgeDebate = async () => {
    setJudgmentInProgress(true);
    
    try {
      // Call the debate judge API
      const response = await fetch(`${BACKEND_URL}/api/debate/judge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: topic,
          messages: messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Store the judgment and add it to messages
        setFinalJudgment(data.judgment);
        
        setMessages(prev => [...prev, {
          role: 'judge',
          content: data.judgment.reasoning,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.error || 'Failed to judge debate');
      }
    } catch (error) {
      console.error('Error judging debate:', error);
      // Add error message to the chat
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: Failed to judge debate. ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setJudgmentInProgress(false);
    }
  };
  
  const resetDebate = () => {
    setGameState('topic-selection');
    setTopic('');
    setCustomTopic('');
    setMessages([]);
    setInputValue('');
    setDebateTime(300);
    setIsTimerRunning(false);
    setFinalJudgment(null);
  };
  
  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-orange-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Courtroom Debate</h1>
          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">Beta</span>
        </div>
        
        {/* Topic Selection Screen */}
        {gameState === 'topic-selection' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select Debate Topic</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose a Topic:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {debateTopics.map((debateTopic, index) => (
                  <button
                    key={index}
                    onClick={() => selectTopic(debateTopic)}
                    className="text-left p-4 border border-gray-200 rounded-md hover:bg-orange-50 hover:border-orange-200 transition-colors"
                    disabled={isLoading}
                  >
                    <span className="font-medium text-gray-800">{debateTopic}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Your Own:</h3>
              <form onSubmit={submitCustomTopic} className="flex gap-4">
                <input
                  type="text"
                  value={customTopic}
                  onChange={handleCustomTopicChange}
                  placeholder="Enter a debate topic..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!customTopic.trim() || isLoading}
                  className="bg-orange-500 text-white font-medium py-2 px-6 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Start
                </button>
              </form>
            </div>
          </div>
        )}
        
        {/* Courtroom Game Interface */}
        {gameState !== 'topic-selection' && (
          <div className="flex flex-col">
            {/* Courtroom Scene */}
            <div className="relative border-4 border-gray-800 bg-[#113366] h-[65vh] overflow-hidden">
              {/* Timer & Topic */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center bg-black bg-opacity-70 p-2 z-10">
                <div className="text-white font-pixel">Topic: {topic}</div>
                <div className="text-white font-pixel">Time: {formatTime(debateTime)}</div>
              </div>
              
              {/* This is where you'll place your pixelated courtroom scene */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  {/* Placeholder - you'll replace this with your pixel art */}
                  <p>[Your pixel courtroom scene will go here]</p>
                  <p>This area is for your custom pixel art assets</p>
                </div>
              </div>
              
              {/* Text Box Overlay - at the bottom of screen */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 border-t-2 border-gray-600 p-4">
                {/* Latest message from each side */}
                {gameState === 'debating' && (
                  <div className="text-white mb-2 font-pixel">
                    {messages.filter(m => m.role === 'user').slice(-1)[0]?.content ? (
                      <div className="mb-2">
                        <span className="text-yellow-300">YOU:</span> {messages.filter(m => m.role === 'user').slice(-1)[0]?.content}
                      </div>
                    ) : null}
                    {messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content ? (
                      <div>
                        <span className="text-cyan-300">OPPONENT:</span> {messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content}
                      </div>
                    ) : null}
                  </div>
                )}
                
                {/* Judge's ruling */}
                {gameState === 'judgment' && (
                  <div className="text-white mb-2 font-pixel">
                    <span className="text-amber-300">JUDGE:</span> {messages.filter(m => m.role === 'judge').slice(-1)[0]?.content || "Deliberating..."}
                  </div>
                )}
                
                {/* Input field */}
                {gameState === 'debating' && (
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      placeholder="Make your argument..."
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      disabled={isLoading || !inputValue.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
                
                {/* Replay button when game is over */}
                {gameState === 'judgment' && messages.some(m => m.role === 'judge') && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={resetDebate}
                      className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      New Debate
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Debate Transcript */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Debate Transcript</h2>
                <button
                  onClick={resetDebate}
                  className="text-sm text-gray-600 hover:text-orange-600 flex items-center gap-1"
                >
                  <RotateCcw size={14} />
                  New Debate
                </button>
              </div>
              
              <div className="h-48 overflow-y-auto p-2 border border-gray-200 rounded">
                {messages.map((message, index) => {
                  if (message.role === 'system') {
                    return (
                      <div key={index} className="text-center text-sm text-gray-500 my-2 border-b border-t border-gray-200 py-1">
                        {message.content}
                      </div>
                    );
                  } else if (message.role === 'judge') {
                    return (
                      <div key={index} className="my-2 p-2 bg-amber-50 border-l-4 border-amber-500 text-sm">
                        <span className="font-bold text-amber-800">JUDGE:</span> {message.content}
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="my-2">
                        <span className={`font-bold ${message.role === 'user' ? 'text-orange-700' : 'text-blue-700'}`}>
                          {message.role === 'user' ? 'YOU:' : 'OPPONENT:'}
                        </span>{' '}
                        <span className="text-sm">{message.content}</span>
                      </div>
                    );
                  }
                })}
                {isLoading && (
                  <div className="my-2">
                    <span className="font-bold text-blue-700">OPPONENT:</span>{' '}
                    <span className="text-sm">
                      <span className="inline-block w-2 h-2 bg-blue-700 rounded-full animate-pulse mr-1"></span>
                      <span className="inline-block w-2 h-2 bg-blue-700 rounded-full animate-pulse mr-1" style={{ animationDelay: '0.2s' }}></span>
                      <span className="inline-block w-2 h-2 bg-blue-700 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Final Judgment Card */}
              {finalJudgment && (
                <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Award size={20} className="text-amber-600" />
                    Final Judgment
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-center">
                        <h4 className="font-medium text-gray-500 text-sm mb-1">Your Score</h4>
                        <div className="text-3xl font-bold text-gray-800">{finalJudgment.userScore}</div>
                        {finalJudgment.winner === 'user' && (
                          <div className="mt-2 text-xs bg-green-100 text-green-800 rounded-full py-1 px-3 inline-block">
                            Winner
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-center">
                        <h4 className="font-medium text-gray-500 text-sm mb-1">AI Score</h4>
                        <div className="text-3xl font-bold text-gray-800">{finalJudgment.aiScore}</div>
                        {finalJudgment.winner === 'ai' && (
                          <div className="mt-2 text-xs bg-green-100 text-green-800 rounded-full py-1 px-3 inline-block">
                            Winner
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Feedback for Improvement:</h4>
                    <p className="text-sm text-gray-600">{finalJudgment.improvements}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStyleCourtroom;