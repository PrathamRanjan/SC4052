import { useState, useEffect } from 'react';
import { ArrowLeft, Gavel, MessageSquare, AlertTriangle, Lightbulb, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
// Import attorney images
import harveySpecter from '../assets/harvey.png';
import saulGoodman from '../assets/saul.png';

const API_BASE_URL = 'https://techfest-backend-4334b5c7ec3d.herokuapp.com'; // Change this to your actual API URL

const CourtroomPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debateInput, setDebateInput] = useState('');
  const [debateResults, setDebateResults] = useState({
    harvey: [],
    saul: []
  });
  const [sessionId, setSessionId] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);

  // Function to start a new debate
  // Add proper CORS headers handling in your backend if needed
// In the frontend, let's modify the polling mechanism:

const startDebate = async () => {
  if (!debateInput) return;
  
  setIsAnalyzing(true);
  setError(null);
  
  try {
    console.log("Starting debate...");
    const response = await fetch(`${API_BASE_URL}/api/start_debate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic: debateInput }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to start debate');
    }
    
    const data = await response.json();
    console.log("Session created:", data);
    setSessionId(data.session_id);
    
    // Start polling right away
    setTimeout(() => pollForRound(data.session_id), 2000);
  } catch (err) {
    console.error('Error starting debate:', err);
    setError(`Error starting debate: ${err.message}`);
    setIsAnalyzing(false);
  }
};

const formatArguments = (argumentText) => {
  if (!argumentText) return [];
  
  // Your backend seems to return formatted arguments with "##" headings
  // Extract these sections and convert them to an array of points
  const sections = argumentText.split(/##\s+/);
  
  // Filter out empty sections and format each point
  const points = sections
    .filter(section => section.trim().length > 0)
    .map(section => {
      // Get the first line as a header, rest as content
      const lines = section.split('\n');
      const header = lines[0].trim();
      
      if (header.startsWith('CLAIM') || 
          header.startsWith('COUNTER-CLAIM') || 
          header.startsWith('EVIDENCE') || 
          header.startsWith('CONCLUSION')) {
        // Return everything after the header
        return section.substring(header.length).trim();
      }
      
      return section.trim();
    })
    .filter(point => point.length > 0);
  
  // Return at most 4 points
  return points.slice(0, 4);
};

// Also update the pollForRound function to correctly handle the response format
const pollForRound = async (sessionIdParam) => {
  const activeSessionId = sessionIdParam || sessionId;
  
  if (!activeSessionId) {
    console.error("No session ID available for polling");
    setError("Session ID not found. Please try again.");
    setIsAnalyzing(false);
    return;
  }
  
  try {
    console.log("Polling for round with session ID:", activeSessionId);
    const response = await fetch(`${API_BASE_URL}/api/get_round?session_id=${activeSessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch debate round: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received round data:", data);
    
    // Format the arguments for display
    const harveyPoints = formatArguments(data.pro_argument);
    const saulPoints = formatArguments(data.con_argument);
    
    console.log("Formatted Harvey points:", harveyPoints);
    console.log("Formatted Saul points:", saulPoints);
    
    setDebateResults({
      harvey: harveyPoints.length > 0 ? harveyPoints : ["No arguments available"],
      saul: saulPoints.length > 0 ? saulPoints : ["No arguments available"]
    });
    
    setCurrentRound(data.round || 1);
    setIsCompleted(data.completed || false);
    
    setIsAnalyzing(false);
    setShowResults(true);
    
    // If the debate is completed, get the summary
    if (data.completed) {
      fetchSummary(activeSessionId);
    }
  } catch (err) {
    console.error('Error fetching debate round:', err);
    
    // If it's a network or server error, try again after a short delay
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
      console.log("Network error, retrying in 3 seconds...");
      setTimeout(() => pollForRound(activeSessionId), 3000);
      return;
    }
    
    setError(`Error fetching debate round: ${err.message}`);
    setIsAnalyzing(false);
  }
};
  
  // Function to submit user feedback
  const submitFeedback = async () => {
    if (!sessionId || !feedback) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          feedback: feedback 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      // Clear the feedback input
      setFeedback('');
      
      // Poll for the next round
      pollForRound();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(`Error submitting feedback: ${err.message}`);
      setIsAnalyzing(false);
    }
  };
  
  // Function to fetch debate summary
  const fetchSummary = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_summary?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch debate summary');
      }
      
      const data = await response.json();
      setSummary(data.summary || 'No summary available');
    } catch (err) {
      console.error('Error fetching summary:', err);
      // Don't set error - this is not critical
    }
  };
  
  
  // Reset the form and start a new debate
  const resetForm = () => {
    setShowResults(false);
    setIsAnalyzing(false);
    setDebateInput('');
    setDebateResults({
      harvey: [],
      saul: []
    });
    setSessionId(null);
    setCurrentRound(0);
    setIsCompleted(false);
    setSummary('');
    setFeedback('');
    setError(null);
  };

  // Example topics for quick selection
  const exampleTopics = [
    "Is social media beneficial for society?",
    "Should artificial intelligence be regulated?",
    "Is remote work better than working in an office?",
    "Should college education be free?"
  ];

  const selectExample = (example) => {
    setDebateInput(example);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startDebate();
  };

  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-purple-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">The Courtroom</h1>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Debate Arena</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - Sentinel Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-6 sticky top-24">
              <div className="w-20 h-20 mx-auto bg-gradient-to-b from-purple-600 to-purple-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Scale size={32} className="text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">The Courtroom</h2>
              <p className="text-center text-purple-600 font-medium text-sm mb-4">Perspectives Debate</p>
              
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                    <img src={harveySpecter} alt="Harvey Specter" className="w-16 h-16 object-cover" />
                  </div>
                  <p className="text-xs font-medium text-gray-800">Harvey Specter</p>
                </div>
                
                <div className="flex-shrink-0 text-gray-400">VS</div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                    <img src={saulGoodman} alt="Saul Goodman" className="w-16 h-16 object-cover" />
                  </div>
                  <p className="text-xs font-medium text-gray-800">Saul Goodman</p>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Gavel size={16} />
                  <span>How The Courtroom Helps You</span>
                </h3>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span>See multiple perspectives on complex issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span>Understand nuanced arguments from both sides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span>Explore the grey areas between opposing viewpoints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span>Make more informed decisions with balanced information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            {!isAnalyzing && !showResults ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">Courtroom Debate</h2>
                  <p className="opacity-90">Enter a topic or statement to hear arguments from both sides</p>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="debate-input" className="block text-sm font-medium text-gray-700 mb-1">
                        Topic or Statement
                      </label>
                      <textarea
                        id="debate-input"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-all duration-300 resize-none"
                        placeholder="Enter a topic, question, or statement you want analyzed from multiple perspectives..."
                        rows={4}
                        value={debateInput}
                        onChange={(e) => setDebateInput(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-medium py-2 px-4 rounded-md hover:from-purple-700 hover:to-purple-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
                    >
                      <Gavel size={18} />
                      Start Debate
                    </button>
                  </form>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Try these examples:</h3>
                    <div className="flex flex-wrap gap-2">
                      {exampleTopics.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => selectExample(example)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-full transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-purple-50 border border-purple-100 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>How to Use The Courtroom</span>
                    </h3>
                    <ol className="text-sm text-purple-700 space-y-1 list-decimal pl-5">
                      <li>Enter a topic, question, or statement you want to explore</li>
                      <li>Click "Start Debate" to begin the analysis</li>
                      <li>Harvey Specter will present arguments from one perspective</li>
                      <li>Saul Goodman will counter with alternative viewpoints</li>
                      <li>Consider both sides to form your own nuanced opinion</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gradient-to-b from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-gray-800">Preparing Arguments</h3>
                <p className="mt-2 text-gray-600 max-w-md text-center">
                  Our attorneys are preparing their arguments for this topic. This may take a moment...
                </p>
                
                <div className="mt-8 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full animate-pulse w-[60%]"></div>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Debate Results</h2>
                    <p className="opacity-90 text-sm">Multiple perspectives on your topic</p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="bg-white/20 hover:bg-white/30 text-white font-medium py-1.5 px-3 rounded-md transition-colors text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    New Debate
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Topic</h3>
                    <p className="text-gray-700">{debateInput}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Harvey Specter Arguments */}
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-blue-600 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src={harveySpecter} alt="Harvey Specter" className="w-10 h-10 object-cover" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">Harvey Specter</h3>
                          <p className="text-blue-100 text-xs">Corporate Attorney</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50">
                        <h4 className="font-medium text-blue-900 mb-3">Key Arguments</h4>
                        <div className="space-y-3">
                          {debateResults.harvey.map((point, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 text-sm">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Saul Goodman Arguments */}
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-red-600 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src={saulGoodman} alt="Saul Goodman" className="w-10 h-10 object-cover" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">Saul Goodman</h3>
                          <p className="text-red-100 text-xs">Criminal Defense Lawyer</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-red-50">
                        <h4 className="font-medium text-red-900 mb-3">Key Arguments</h4>
                        <div className="space-y-3">
                          {debateResults.saul.map((point, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 text-sm">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isCompleted ? (
                    <div className="mb-6 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Judgment</h3>
                      <p className="text-gray-600 mb-3">
                        As the judge, provide your feedback on these arguments. Your insights will guide the next round of debate.
                      </p>
                      <div className="flex space-x-3">
                        <textarea
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition-all"
                          placeholder="Enter your feedback on both arguments..."
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                        ></textarea>
                        <button
                          onClick={submitFeedback}
                          disabled={!feedback}
                          className={`px-4 py-2 rounded-md font-medium text-white ${
                            !feedback
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          Submit
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Type "exit" to end the debate early.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6 border-t border-b border-gray-100 py-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Scale size={18} className="text-purple-600" />
                        <span>Balanced Perspective</span>
                      </h3>
                      <div className="bg-purple-50 border border-purple-100 rounded-md p-4">
                        <p className="text-gray-700">
                          {summary || "This topic has valid perspectives on both sides. Harvey emphasizes evidence-based reasoning and established precedents, while Saul highlights contextual factors and alternative interpretations. The truth likely contains elements from both viewpoints, and the most balanced approach would consider the strengths of each argument."}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Considerations</h3>
                      <div className="space-y-3">
                        <ConsiderationItem 
                          title="Consider the source of information"
                          description="Both sides may cite sources that favor their position. Evaluate the credibility of sources used in each argument."
                        />
                        
                        <ConsiderationItem 
                          title="Look for common ground"
                          description="Despite their differences, both perspectives often share some fundamental agreements that can serve as a starting point."
                        />
                        
                        <ConsiderationItem 
                          title="Context matters"
                          description="What's true in one context may not apply universally. Consider how different circumstances might affect each argument."
                        />
                        
                        <ConsiderationItem 
                          title="Watch for logical fallacies"
                          description="Both sides may employ rhetorical techniques that sound convincing but don't actually support their conclusion."
                        />
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <span>Download Harvey's Brief</span>
                      </button>
                      
                      <button className="bg-gradient-to-r from-red-600 to-red-800 text-white font-medium py-2 px-4 rounded-md hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <span>Download Saul's Brief</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsiderationItem = ({ title, description }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-purple-100 p-2 rounded-full flex-shrink-0 mt-0.5">
        <Lightbulb size={16} className="text-purple-700" />
      </div>
      <div>
        <h4 className="font-medium text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default CourtroomPage;