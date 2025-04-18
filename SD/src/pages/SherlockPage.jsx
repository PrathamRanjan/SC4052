import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, FileText, X, Mic, Square, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const SherlockPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [factChecks, setFactChecks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [trustScore, setTrustScore] = useState(0);
  
  // Real audio recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioBlobRef = useRef(null);

  // Speech-to-text state
  const [transcriptionStatus, setTranscriptionStatus] = useState('idle'); // idle, processing, completed, error
  const [transcriptionText, setTranscriptionText] = useState('');

  // Request permission to use microphone
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrorMessage(`Microphone access denied: ${err.message}`);
      return null;
    }
  };

  // Start real recording
  const startRecording = async () => {
    const stream = await requestMicrophonePermission();
    if (!stream) return;

    // Reset audio chunks
    audioChunksRef.current = [];
    
    // Create media recorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    // Set up data event handler
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    // Set up stop event handler
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioBlobRef.current = audioBlob;
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
    };
    
    // Start recording
    mediaRecorder.start();
    setIsRecording(true);
    
    // Start the duration timer
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop the media recorder
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
    }
  };

  // Format recording time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Actually download and transcribe the audio using Whisper
  const transcribeAudio = async () => {
    if (!audioBlobRef.current) {
      setErrorMessage("No audio recording available");
      return;
    }
    
    setTranscriptionStatus('processing');
    
    try {
      // Create a unique filename
      const filename = `recording_${Date.now()}.wav`;
      
      // Create a File object from the Blob
      const audioFile = new File([audioBlobRef.current], filename, { type: 'audio/wav' });
      
      // Create a FormData object and append the file
      const formData = new FormData();
      formData.append('file', audioFile);
      
      // Make a POST request to a server endpoint that will download and save the file
      const response = await fetch('http://localhost:5001/download-audio', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to download audio file");
      }
      
      // Now that the file is saved on the server, request transcription
      const transcriptionResponse = await fetch('http://localhost:5001/transcribe-audio-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: data.filename })
      });
      
      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription error: ${transcriptionResponse.status}`);
      }
      
      const transcriptionData = await transcriptionResponse.json();
      
      if (!transcriptionData.success) {
        throw new Error(transcriptionData.error || "Failed to transcribe audio");
      }
      
      // Set the transcription text
      setTranscriptionStatus('completed');
      setTranscriptionText(transcriptionData.transcript);
      setTextInput(transcriptionData.transcript); // Set as input for analysis
      
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setTranscriptionStatus('error');
      setErrorMessage(`Failed to transcribe audio: ${error.message}`);
    }
  };

  // Reset audio recording
  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setTranscriptionStatus('idle');
    setTranscriptionText('');
    audioBlobRef.current = null;
  };

  // Toggle recording panel visibility
  const toggleRecordingPanel = () => {
    setShowRecordingPanel(!showRecordingPanel);
    // If closing the panel, reset recording state
    if (showRecordingPanel) {
      if (isRecording) {
        stopRecording();
      }
      resetRecording();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textInput) return;
    
    setIsAnalyzing(true);
    setErrorMessage('');
    
    try {
      // Call the fact checking API (server2.py)
      const response = await fetch('http://localhost:5002/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze text');
      }
      
      const data = await response.json();
      
      // Calculate trust score
      if (data.analysis_summary && typeof data.analysis_summary.trust_score === 'number') {
        setTrustScore(data.analysis_summary.trust_score);
      } else {
        // Fallback if trust score isn't provided
        const trueCount = data.verified_claims.filter(c => c.result === 'TRUE').length;
        const totalClaims = data.verified_claims.length || 1;
        const calculatedScore = ((trueCount / totalClaims) * 10).toFixed(1);
        setTrustScore(calculatedScore);
      }
      
      // Process the claims for the frontend format
      const processedChecks = data.verified_claims.map(item => ({
        claim: item.claim,
        assessment: mapResultToAssessment(item.result),
        explanation: item.additional_context || generateExplanation(item.claim, item.result),
        type: mapResultToType(item.result),
        detailed_analysis: item.detailed_analysis || "",
        sourceNames: item.source_names || [],
        sourceLinks: item.source_links || []
      }));
      
      setFactChecks(processedChecks);
      setIsAnalyzing(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing text:', error);
      setErrorMessage(error.message);
      setIsAnalyzing(false);
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
  
  // Generate Sherlock-themed explanation for claims
  const generateExplanation = (claim, result) => {
    switch (result) {
      case 'TRUE':
        return `Elementary, my dear Watson! This claim holds up under scrutiny. The evidence clearly supports this statement.`;
      case 'FALSE':
        return `Upon closer investigation, I've found this claim to be demonstrably false. The facts tell a different story entirely.`;
      case 'UNVERIFIED':
        return `The game is afoot! While intriguing, this claim requires more evidence before a definitive conclusion can be drawn.`;
      default:
        return 'This matter requires further investigation.';
    }
  };
  
  const resetForm = () => {
    setShowResults(false);
    setFactChecks([]);
    setErrorMessage('');
  };

  // Example statements for quick selection
  const exampleStatements = [
    "The Earth is flat.",
    "Humans only use 10% of their brains.",
    "The Great Wall of China is visible from space.",
    "Vaccines cause autism."
  ];

  const selectExample = (example) => {
    setTextInput(example);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Clean up the audio URL
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      // Stop recording if active
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [audioURL, isRecording]);

  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Sherlock Holmes</h1>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">Text Fact Checker</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - Sentinel Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-6 sticky top-24">
              <div className="w-20 h-20 mx-auto bg-gradient-to-b from-indigo-500 to-purple-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <FileText size={32} className="text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Sherlock Holmes</h2>
              <p className="text-center text-indigo-600 font-medium text-sm mb-4">Text Fact Checker</p>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Search size={16} />
                  <span>How Sherlock Helps You</span>
                </h3>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Analyzes text for factual accuracy using deductive reasoning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Identifies misleading statements and falsehoods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Provides evidence and context for each claim</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Transcribes and fact-checks spoken content from recordings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Creates detailed reports with reliable sources</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            {!isAnalyzing && !showResults ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">Text Fact Checker</h2>
                  <p className="opacity-90">Enter text or record spoken content for Sherlock to analyze</p>
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
                
                  <div className="mb-4 flex justify-between">
                    <button 
                      onClick={toggleRecordingPanel}
                      className={`flex items-center gap-2 py-2 px-4 rounded-md transition-colors ${
                        showRecordingPanel 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {showRecordingPanel ? (
                        <>
                          <X size={16} />
                          <span>Close Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={16} />
                          <span>Record Audio</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      className="flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <Upload size={16} />
                      <span>Upload File</span>
                    </button>
                  </div>
                  
                  {/* Audio Recording Panel */}
                  {showRecordingPanel && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-md">
                      <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                        <Mic size={16} />
                        <span>Voice Recording</span>
                      </h3>
                      
                      <div className="flex flex-col items-center">
                        {!audioURL ? (
                          <div className="w-full mb-4">
                            <div className="flex justify-center mb-3">
                              <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                  isRecording 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white transition-colors`}
                              >
                                {isRecording ? <Square size={24} /> : <Mic size={24} />}
                              </button>
                            </div>
                            
                            <div className="text-center">
                              {isRecording ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-2 text-red-500 font-semibold animate-pulse">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span>Recording...</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {formatTime(recordingDuration)}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  Press the microphone button to start recording
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full mb-4">
                            <div className="bg-white p-3 rounded-md border border-gray-200 mb-3">
                              <div className="flex flex-col items-center gap-2">
                                <audio src={audioURL} controls className="w-full"></audio>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={resetRecording}
                                className="flex-1 py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
                              >
                                <X size={16} />
                                <span>Discard</span>
                              </button>
                              
                              <button
                                onClick={transcribeAudio}
                                disabled={transcriptionStatus === 'processing'}
                                className={`flex-1 py-2 px-3 text-sm ${
                                  transcriptionStatus === 'processing' 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                                } rounded-md transition-colors flex items-center justify-center gap-2`}
                              >
                                <FileText size={16} />
                                <span>{transcriptionStatus === 'processing' ? 'Transcribing...' : 'Transcribe'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Transcription Status */}
                        {transcriptionStatus !== 'idle' && (
                          <div className="w-full p-3 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">Transcription:</span>
                              {transcriptionStatus === 'processing' && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Processing...</span>
                              )}
                              {transcriptionStatus === 'completed' && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                              )}
                              {transcriptionStatus === 'error' && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Error</span>
                              )}
                            </div>
                            
                            {transcriptionStatus === 'processing' ? (
                              <div className="flex justify-center py-2">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : transcriptionStatus === 'completed' ? (
                              <p className="text-sm text-gray-700">{transcriptionText}</p>
                            ) : transcriptionStatus === 'error' ? (
                              <p className="text-sm text-red-600">Transcription failed. Please try again.</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-1">
                        Text to Verify
                      </label>
                      <textarea
                        id="text-input"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-300 resize-none"
                        placeholder="Enter statements, claims, or paragraphs you want to verify..."
                        rows={6}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium py-2 px-4 rounded-md hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      Verify Facts
                    </button>
                  </form>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Try these examples:</h3>
                    <div className="flex flex-wrap gap-2">
                      {exampleStatements.map((example, index) => (
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
                  
                  <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>How to Use Sherlock's Analysis</span>
                    </h3>
                    <ol className="text-sm text-indigo-700 space-y-1 list-decimal pl-5">
                      <li>Enter text or record audio containing statements to verify</li>
                      <li>For audio recordings, use the transcription feature</li>
                      <li>Click "Verify Facts" to start Sherlock's analysis</li>
                      <li>Review the detailed fact check for each identified claim</li>
                      <li>Use the provided sources to learn more about each topic</li>
                    </ol>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span>Recent Verifications</span>
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="text-sm font-medium text-gray-800 mb-1 truncate">"The Great Wall of China is the only human-made structure visible from space."</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">2 days ago</span>
                          <span className="text-xs font-semibold bg-red-100 text-red-800 py-0.5 px-2 rounded-full">False</span>
                        </div>
                      </div>
                      
                      <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="text-sm font-medium text-gray-800 mb-1 truncate">"The Earth's magnetic field reverses every 200,000 to 300,000 years."</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Last week</span>
                          <span className="text-xs font-semibold bg-green-100 text-green-800 py-0.5 px-2 rounded-full">True</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gradient-to-b from-indigo-500 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-gray-800">Analyzing Facts</h3>
                <p className="mt-2 text-gray-600 max-w-md text-center">
                  Sherlock Holmes is applying his legendary deductive reasoning to analyze your statements. This may take a moment...
                </p>
                
                <div className="mt-8 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse w-[60%]"></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Analysis Results</h2>
                    <p className="opacity-90 text-sm">Sherlock's fact-checking report</p>
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
                  <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Search size={18} className="text-indigo-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Sherlock's Deduction</h3>
                        <p className="text-gray-700">
                          I've analyzed the text and identified several factual claims. My analysis evaluates each claim based 
                          on current scientific consensus, reliable sources, and logical reasoning. Below are my findings.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trust Score Section */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="text-center mb-2">
                      <span className="text-xs font-semibold text-gray-500">TRUST SCORE</span>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="text-4xl font-bold text-indigo-600">{trustScore}</div>
                        <div className="text-gray-400 font-medium">/10</div>
                      </div>
                    </div>
                    
                    <div className="w-full max-w-sm bg-gray-200 rounded-full h-3 mt-2">
                      <div 
                        className="bg-indigo-600 h-3 rounded-full" 
                        style={{ width: `${Math.min(trustScore * 10, 100)}%` }}
                      ></div>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      {trustScore > 7 
                        ? "This content contains mostly factual and accurate information. Sherlock deems it trustworthy." 
                        : trustScore > 4 
                        ? "This content contains some factual information but also includes misleading claims or unverified statements." 
                        : "This content contains numerous inaccuracies and misleading claims. Exercise caution when considering this content."}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    {factChecks.map((check, index) => (
                      <div key={index} className={`border rounded-md p-4 ${
                        check.type === 'true' ? 'border-green-100 bg-green-50' :
                        check.type === 'partial' ? 'border-yellow-100 bg-yellow-50' :
                        'border-red-100 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {check.type === 'true' ? (
                              <CheckCircle size={20} className="text-green-600" />
                            ) : check.type === 'partial' ? (
                              <AlertTriangle size={20} className="text-yellow-600" />
                            ) : (
                              <X size={20} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{check.claim}</h4>
                            <div className="flex items-center gap-2 my-1.5">
                              <span className={`text-xs font-semibold py-0.5 px-2 rounded-full ${
                                check.type === 'true' ? 'bg-green-100 text-green-800' :
                                check.type === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {check.assessment}
                              </span>
                            </div>
                            <p className={`text-sm ${
                              check.type === 'true' ? 'text-green-700' :
                              check.type === 'partial' ? 'text-yellow-700' :
                              'text-red-700'
                            }`}>
                              {check.explanation}
                            </p>
                            
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
                                      className="text-xs bg-white bg-opacity-50 text-indigo-700 py-0.5 px-2 rounded hover:bg-white transition-colors"
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
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Sources</h3>
                    <ul className="space-y-1">
                      {[...new Set(factChecks.flatMap(check => check.sourceNames || []))].map((sourceName, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="min-w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                          <a href="#" className="text-indigo-600 hover:underline text-sm">{sourceName}</a>
                        </li>
                      ))}
                      {/* Add some fallback sources if no sources were found */}
                      {factChecks.flatMap(check => check.sourceNames || []).length === 0 && (
                        <>
                          <li className="flex items-start gap-2">
                            <div className="min-w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                            <a href="#" className="text-indigo-600 hover:underline text-sm">Encyclopedia Britannica</a>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="min-w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                            <a href="#" className="text-indigo-600 hover:underline text-sm">Scientific American</a>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <button
                    className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium py-2 px-4 rounded-md hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
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

export default SherlockPage;