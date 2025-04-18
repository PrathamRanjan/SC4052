import { useState } from 'react';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, Youtube, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const BatmanPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [factChecks, setFactChecks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [trustScore, setTrustScore] = useState(0);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [transcript, setTranscript] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    
    setIsAnalyzing(true);
    setErrorMessage('');
    
    try {
      // Call the backend to process the YouTube video (server1.py)
      const response = await fetch('http://localhost:5001/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: youtubeUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }
      
      const data = await response.json();
      console.log("Response from Batman API:", data);
      
      // Extract video ID for thumbnail
      const videoId = extractVideoId(youtubeUrl);
      if (videoId) {
        setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
      }
      
      // Set video title if available
      if (data.video_info && data.video_info.title) {
        setVideoTitle(data.video_info.title);
      } else {
        setVideoTitle("Analyzed YouTube Video");
      }
      
      // Set trust score if available
      if (data.video_info && typeof data.video_info.trust_score === 'number') {
        setTrustScore(data.video_info.trust_score);
      } else if (data.analysis_summary && typeof data.analysis_summary.trust_score === 'number') {
        setTrustScore(data.analysis_summary.trust_score);
      } else {
        // Calculate trust score based on verified claims if available
        const trueCount = (data.verified_claims || []).filter(c => c.result === 'TRUE').length;
        const totalClaims = (data.verified_claims || []).length || 1;
        const calculatedScore = ((trueCount / totalClaims) * 10).toFixed(1);
        setTrustScore(calculatedScore);
      }
      
      // Save transcript if available
      if (data.analysis_summary && data.analysis_summary.transcript) {
        setTranscript(data.analysis_summary.transcript);
      }
      
      // Process the verified claims for frontend display
      if (data.verified_claims && data.verified_claims.length > 0) {
        const processedChecks = data.verified_claims.map(item => ({
          claim: item.claim,
          assessment: mapResultToAssessment(item.result),
          explanation: generateExplanation(item.claim, item.result),
          type: mapResultToType(item.result),
          detailed_analysis: item.detailed_analysis || "",
          sourceNames: item.source_names || [],
          sourceLinks: item.source_links || []
        }));
        
        setFactChecks(processedChecks);
      } else {
        // Fallback if no claims were found
        setFactChecks([{
          claim: "No specific factual claims were identified in this video.",
          assessment: "UNVERIFIED",
          explanation: "Batman was unable to isolate specific factual claims for verification.",
          type: "partial",
          sourceNames: [],
          sourceLinks: []
        }]);
      }
      
      setIsAnalyzing(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing video:', error);
      setErrorMessage(error.message || "Error analyzing video");
      setIsAnalyzing(false);
    }
  };
  
  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    try {
      // Simplified robust regex for YouTube ID extraction
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Error extracting YouTube ID:", e);
      return null;
    }
  };
  
  // Map backend result to frontend assessment terminology
  const mapResultToAssessment = (result) => {
    switch (result) {
      case 'TRUE': return 'ACCURATE';
      case 'FALSE': return 'FALSE';
      case 'UNVERIFIED': return 'UNVERIFIED';
      default: return 'UNVERIFIED';
    }
  };
  
  // Map backend result to frontend type for styling
  const mapResultToType = (result) => {
    switch (result) {
      case 'TRUE': return 'true';
      case 'FALSE': return 'false';
      case 'UNVERIFIED': return 'partial';
      default: return 'partial';
    }
  };
  
  // Generate explanation text based on claim and result for better UX
  const generateExplanation = (claim, result) => {
    switch (result) {
      case 'TRUE':
        return `Batman's analysis confirms this claim is accurate based on current factual evidence.`;
      case 'FALSE':
        return `Batman's investigation reveals this claim contradicts established facts and evidence.`;
      case 'UNVERIFIED':
        return `Batman cannot conclusively verify this claim with available evidence. More investigation needed.`;
      default:
        return 'Requires further investigation.';
    }
  };
  
  const resetForm = () => {
    setShowResults(false);
    setYoutubeUrl('');
    setFactChecks([]);
    setErrorMessage('');
    setVideoThumbnail(null);
    setVideoTitle('');
    setTranscript('');
  };

  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-cyan-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Batman</h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">YouTube Fact Checker</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - Sentinel Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-6 sticky top-24">
              <div className="w-20 h-20 mx-auto bg-gradient-to-b from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Youtube size={32} className="text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Batman</h2>
              <p className="text-center text-cyan-600 font-medium text-sm mb-4">YouTube Fact Checker</p>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Search size={16} />
                  <span>How Batman Helps You</span>
                </h3>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Analyzes YouTube videos for factual accuracy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Identifies misleading claims in video content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Provides detailed analysis with evidence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Offers a trust score based on content analysis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            {!isAnalyzing && !showResults ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">YouTube Fact Checker</h2>
                  <p className="opacity-90">Enter a YouTube URL to analyze the content for factual accuracy</p>
                </div>
                
                <div className="p-6">
                  {errorMessage && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start gap-2">
                      <X size={18} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Error</h3>
                        <p className="text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-1">
                        YouTube Video URL
                      </label>
                      <div className="flex">
                        <input
                          id="youtube-url"
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500 transition-all duration-300"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-medium py-2 px-4 rounded-md hover:from-cyan-700 hover:to-cyan-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      Analyze Video
                    </button>
                  </form>
                  
                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>How to Use Batman's Analysis</span>
                    </h3>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal pl-5">
                      <li>Paste a full YouTube URL in the field above</li>
                      <li>Click "Analyze Video" to start the fact-checking process</li>
                      <li>Review the detailed analysis and fact check report</li>
                      <li>Use the trust score to evaluate the content's reliability</li>
                    </ol>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span>Recent Analyses</span>
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="text-sm font-medium text-gray-800 mb-1 truncate">How AI Will Change Everything</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Today, 2:45 PM</span>
                          <span className="text-xs font-semibold bg-green-100 text-green-800 py-0.5 px-2 rounded-full">8.4/10</span>
                        </div>
                      </div>
                      
                      <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="text-sm font-medium text-gray-800 mb-1 truncate">The Truth About Quantum Computing</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Yesterday, 11:20 AM</span>
                          <span className="text-xs font-semibold bg-red-100 text-red-800 py-0.5 px-2 rounded-full">2.1/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-gray-800">Analyzing Video Content</h3>
                <p className="mt-2 text-gray-600 max-w-md text-center">
                  Batman is using his detective skills to analyze the video content for factual accuracy. This may take a moment...
                </p>
                
                <div className="mt-8 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-[45%]"></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Analysis Results</h2>
                    <p className="opacity-90 text-sm">Batman's fact-checking report</p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="bg-white/20 hover:bg-white/30 text-white font-medium py-1.5 px-3 rounded-md transition-colors text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                </div>
                
                <div className="p-6">
                  {/* Video Preview */}
                  {videoThumbnail && (
                    <div className="mb-6 overflow-hidden rounded-lg shadow-sm border border-gray-200">
                      <div className="relative pt-[56.25%] bg-black">
                        <img 
                          src={videoThumbnail} 
                          alt={videoTitle} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                          <div className="text-white p-4">
                            <h3 className="font-medium text-lg">{videoTitle}</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                
                  <div className="mb-6 flex flex-col items-center">
                    <div className="text-center mb-2">
                      <span className="text-xs font-semibold text-gray-500">TRUST SCORE</span>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="text-4xl font-bold text-blue-600">{trustScore}</div>
                        <div className="text-gray-400 font-medium">/10</div>
                      </div>
                    </div>
                    
                    <div className="w-full max-w-sm bg-gray-200 rounded-full h-3 mt-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${Math.min(trustScore * 10, 100)}%` }}
                      ></div>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      {trustScore > 7 
                        ? "This video contains mostly factual and accurate information. Batman deems it trustworthy." 
                        : trustScore > 4 
                        ? "This video contains some factual information but also includes misleading claims or unverified statements." 
                        : "This video contains numerous inaccuracies and misleading claims. Exercise caution when considering this content."}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Batman's Summary</h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-md p-4 text-gray-700">
                      <p>
                        Batman has analyzed this video using advanced detective techniques and AI to identify factual claims.
                        {trustScore > 7 
                          ? " The content appears to be well-researched and presents information that aligns with current evidence and factual sources." 
                          : trustScore > 4 
                          ? " While some information is accurate, the video contains claims that require context or are not fully supported by evidence."
                          : " The investigation reveals significant issues with factual accuracy. Many claims contradict established evidence or lack proper context."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Transcript Preview */}
                  {transcript && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Video Transcript</h3>
                        <button className="text-xs text-blue-600 hover:underline">View Full Transcript</button>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-md p-4 text-gray-700 text-sm max-h-40 overflow-y-auto">
                        <p>{transcript}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Fact Check Report</h3>
                    <div className="space-y-3">
                      {factChecks.length > 0 ? (
                        factChecks.map((check, index) => (
                          <div 
                            key={index} 
                            className={`border rounded-md p-3 ${
                              check.type === 'true' ? 'border-green-100 bg-green-50' :
                              check.type === 'partial' ? 'border-yellow-100 bg-yellow-50' :
                              'border-red-100 bg-red-50'
                            }`}
                          >
                            <div className="flex gap-2">
                              {check.type === 'true' ? (
                                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                              ) : check.type === 'partial' ? (
                                <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                              ) : (
                                <X size={20} className="text-red-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{check.claim}</p>
                                <span className={`inline-block mt-1 text-xs font-semibold py-0.5 px-2 rounded-full ${
                                  check.type === 'true' ? 'bg-green-100 text-green-800' :
                                  check.type === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {check.assessment}
                                </span>
                                <p className="text-sm mt-1 text-gray-700">{check.explanation}</p>
                                
                                {/* Detailed Analysis */}
                                {check.detailed_analysis && (
                                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md text-xs text-gray-700">
                                    <p className="font-medium mb-1">Detailed Analysis:</p>
                                    <p>{check.detailed_analysis}</p>
                                  </div>
                                )}
                                
                                {/* Sources */}
                                {check.sourceNames && check.sourceNames.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Sources:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {check.sourceNames.map((name, idx) => (
                                        <a 
                                          key={idx}
                                          href={check.sourceLinks[idx] || "#"}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-xs bg-white bg-opacity-50 text-blue-700 py-0.5 px-2 rounded hover:bg-white transition-colors"
                                        >
                                          {name}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No specific claims were identified in this video.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Sources</h3>
                    <ul className="space-y-1">
                      {[...new Set(factChecks.flatMap(check => check.sourceNames || []))].map((sourceName, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="min-w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                          <a href="#" className="text-blue-600 hover:underline text-sm">{sourceName}</a>
                        </li>
                      ))}
                      {/* Add some fallback sources if no sources were found */}
                      {factChecks.flatMap(check => check.sourceNames || []).length === 0 && (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="min-w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                            <a href="#" className="text-blue-600 hover:underline text-sm">Batcomputer Analysis Database</a>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="min-w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                            <a href="#" className="text-blue-600 hover:underline text-sm">Gotham City Research Archives</a>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="min-w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                            <a href="#" className="text-blue-600 hover:underline text-sm">Wayne Enterprises Fact Repository</a>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <button
                    className="mt-6 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-medium py-2 px-4 rounded-md hover:from-cyan-700 hover:to-cyan-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
                  >
                    <span>Download Full Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatmanPage;