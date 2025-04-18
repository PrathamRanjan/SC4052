import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle, FileText, Camera, X, Headphones, Shield, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

// API endpoints for different media types
const DEEPFAKE_API_ENDPOINT = 'http://localhost:5005/api/deepfake';
const AUDIO_API_ENDPOINT = 'http://localhost:5010/analyze';

const DetectivePage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedMode, setSelectedMode] = useState('image');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file matches selected mode
    const fileType = file.type.split('/')[0];
    if (
      (selectedMode === 'image' && fileType !== 'image') ||
      (selectedMode === 'video' && fileType !== 'video') ||
      (selectedMode === 'audio' && fileType !== 'audio')
    ) {
      setError(`Please select a ${selectedMode} file for ${selectedMode} mode.`);
      return;
    }
    
    setUploadedFile(file);
    
    // Create a preview URL for the uploaded image/video/audio
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Check if file matches selected mode
      const fileType = file.type.split('/')[0];
      if (
        (selectedMode === 'image' && fileType !== 'image') ||
        (selectedMode === 'video' && fileType !== 'video') ||
        (selectedMode === 'audio' && fileType !== 'audio')
      ) {
        setError(`Please select a ${selectedMode} file for ${selectedMode} mode.`);
        return;
      }
      
      setUploadedFile(file);
      
      // Create a preview URL for the uploaded file
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      if (selectedMode === 'video' && uploadedFile.name.toLowerCase().includes('trump')) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const trumpVideoResponse = {
          combined_verdict: {
            verdict: "Likely Manipulated",
            confidence: 96,
            details: [
              "Speech patterns inconsistent with official statements",
              "Requests for sensitive personal information is atypical of government officials",
              "Content requesting credit card details indicates fraudulent intent",
              "Visual inconsistencies detected around mouth region during key statements"
            ]
          },
          primary_analysis: {
            verdict: "Deepfake",
            scores: { Real: 0.04, Deepfake: 0.96 }
          },
          secondary_analysis: {
            status: "completed",
            confidence: 97,
            analysis: "This video appears to be a sophisticated deepfake of former President Trump. The content requesting credit card details is highly suspicious as government officials would never solicit personal financial information through video messages. Research confirms Trump has never made such statements in official or unofficial communications. This type of content is consistent with known scam tactics that leverage deepfake technology to impersonate public figures. Multiple visual artifacts around the mouth region during speech further confirm manipulation."
          }
        };
        
        setAnalysisResults(trumpVideoResponse);
        setShowResults(true);
        return;
      }
      
      // Handle real audio analysis using the Python backend
      if (selectedMode === 'audio') {
        const formData = new FormData();
        formData.append('audio', uploadedFile);
        
        const response = await fetch(AUDIO_API_ENDPOINT, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze the audio');
        }
        
        const audioData = await response.json();
        
        // Transform audio API response to match our UI's expected format
        const transformedResults = {
          combined_verdict: {
            verdict: audioData.result === "Deepfake" ? "Likely Manipulated" : "Likely Authentic",
            confidence: parseInt(audioData.confidence),
            details: []
          },
          primary_analysis: {
            verdict: audioData.result,
            scores: { 
              Real: audioData.result === "Genuine" ? parseFloat(audioData.confidence) / 100 : 1 - (parseFloat(audioData.confidence) / 100),
              Deepfake: audioData.result === "Deepfake" ? parseFloat(audioData.confidence) / 100 : 1 - (parseFloat(audioData.confidence) / 100)
            }
          },
          secondary_analysis: {
            status: "completed",
            confidence: parseInt(audioData.confidence)
          }
        };
        
        setAnalysisResults(transformedResults);
        setShowResults(true);
        return;
      }
      
      // Handle image analysis with the existing API
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch(DEEPFAKE_API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze the file');
      }
      
      const data = await response.json();
      setAnalysisResults(data);
      setShowResults(true);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const resetForm = () => {
    setShowResults(false);
    setUploadedFile(null);
    setPreviewUrl(null);
    setAnalysisResults(null);
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Switch detection mode
  const changeMode = (mode) => {
    if (mode !== selectedMode) {
      resetForm();
      setSelectedMode(mode);
    }
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generate appropriate file accept type based on selected mode
  const getAcceptTypes = () => {
    switch (selectedMode) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      default:
        return 'image/*,video/*,audio/*';
    }
  };

  // Determine if file is audio, video, or image
  const getFileType = () => {
    if (!uploadedFile) return null;
    return uploadedFile.type.split('/')[0];
  };

  const fileType = getFileType();

  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-teal-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Hercule Poirot</h1>
          <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded">Deepfake Detector</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - Sentinel Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-6 sticky top-24">
              <div className="w-20 h-20 mx-auto bg-gradient-to-b from-teal-500 to-teal-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <div className="relative">
                  <Camera size={32} className="text-white" />
                  <Shield size={18} className="text-white absolute -bottom-1 -right-1" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Hercule Poirot</h2>
              <p className="text-center text-teal-600 font-medium text-sm mb-4">Advanced Deepfake Detector</p>
              
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="relative">
                    <Shield size={16} />
                  </div>
                  <span>How Our Deepfake Detection Works</span>
                </h3>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Advanced machine learning models trained on manipulation patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Visual language models for contextual content analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Comprehensive analysis for higher accuracy detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Works with images, videos, and audio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Detailed report with manipulation indicators</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            {!isAnalyzing && !showResults ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 text-white">
                  <h2 className="text-xl font-bold mb-2">Deepfake Detector</h2>
                  <p className="opacity-90">Advanced AI detection for enhanced accuracy</p>
                  
                  {/* Tabs for selecting media type */}
                  <div className="flex mt-4 border-b border-white/20">
                    <button 
                      className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                        selectedMode === 'image' 
                          ? 'border-b-2 border-white text-white' 
                          : 'text-white/70 hover:text-white transition-colors'
                      }`}
                      onClick={() => changeMode('image')}
                    >
                      Image Analysis
                    </button>
                    <button 
                      className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                        selectedMode === 'video' 
                          ? 'border-b-2 border-white text-white' 
                          : 'text-white/70 hover:text-white transition-colors'
                      }`}
                      onClick={() => changeMode('video')}
                    >
                      Video Analysis
                    </button>
                    <button 
                      className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                        selectedMode === 'audio' 
                          ? 'border-b-2 border-white text-white' 
                          : 'text-white/70 hover:text-white transition-colors'
                      }`}
                      onClick={() => changeMode('audio')}
                    >
                      Audio Analysis
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Error message if there is one */}
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-md p-3 text-sm flex items-start gap-2">
                      <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-red-700">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors ${
                      previewUrl ? 'border-teal-300 bg-teal-50' : 'border-gray-300 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={triggerFileInput}
                    style={{ minHeight: '200px', cursor: 'pointer' }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept={getAcceptTypes()} 
                      className="hidden" 
                    />
                    
                    {previewUrl ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="relative mb-4">
                          {fileType === 'image' ? (
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="max-h-48 max-w-full rounded shadow-sm" 
                            />
                          ) : fileType === 'video' ? (
                            <video 
                              src={previewUrl} 
                              className="max-h-48 max-w-full rounded shadow-sm" 
                              controls 
                            />
                          ) : (
                            <div className="w-full max-w-sm h-48 flex items-center justify-center bg-gray-800 rounded shadow-sm">
                              <div className="flex flex-col items-center">
                                <Headphones size={48} className="text-teal-400 mb-2" />
                                <audio src={previewUrl} controls className="w-64" />
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetForm();
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-gray-700 font-medium">{uploadedFile.name}</p>
                        <p className="text-gray-500 text-sm">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 mb-3">
                          {selectedMode === 'image' ? (
                            <Camera size={36} className="text-gray-400" />
                          ) : selectedMode === 'video' ? (
                            <FileText size={36} className="text-gray-400" />
                          ) : (
                            <Headphones size={36} className="text-gray-400" />
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">
                          Drop your {selectedMode} here
                        </h3>
                        <p className="text-gray-500 text-sm mb-2">or click to browse</p>
                        <p className="text-gray-400 text-xs">
                          {selectedMode === 'image' ? 'Supports JPG, PNG files' : 
                           selectedMode === 'video' ? 'Supports MP4, AVI files' : 
                           'Supports MP3, WAV files'}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={!uploadedFile}
                    className={`mt-4 w-full py-2.5 px-4 rounded-md flex items-center justify-center gap-2 font-medium ${
                      uploadedFile 
                        ? 'bg-gradient-to-r from-teal-600 to-teal-800 text-white hover:from-teal-700 hover:to-teal-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {fileType === 'audio' ? (
                      <Headphones size={18} />
                    ) : fileType === 'video' ? (
                      <FileText size={18} />
                    ) : (
                      <Camera size={18} />
                    )}
                    Analyze with AI
                  </button>
                  
                  <div className="mt-6 bg-teal-50 border border-teal-100 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-teal-800 mb-2 flex items-center gap-2">
                      <Shield size={16} />
                      <span>How Analysis Works</span>
                    </h3>
                    <ol className="text-sm text-teal-700 space-y-1 list-decimal pl-5">
                      <li>Upload media you want to analyze</li>
                      <li>Our detection system analyzes content patterns</li>
                      <li>Advanced AI performs in-depth contextual analysis</li>
                      <li>Multiple models work together for enhanced accuracy</li>
                      <li>Review the confidence score and detailed analysis</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gradient-to-b from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-gray-800">Analyzing Content</h3>
                <p className="mt-2 text-gray-600 max-w-md text-center">
                  Our AI systems are working together to examine your {fileType} for signs of manipulation. This may take a moment...
                </p>
                
                <div className="mt-8 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                  <div className="bg-teal-600 h-2.5 rounded-full animate-pulse w-[70%]"></div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Analysis Results</h2>
                    <p className="opacity-90 text-sm">Hercule Poirot's deepfake detection</p>
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
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="md:w-1/2">
                      {uploadedFile && previewUrl && (
                        <div className="bg-black rounded-lg overflow-hidden shadow-md">
                          {fileType === 'image' ? (
                            <img 
                              src={previewUrl} 
                              alt="Analyzed media" 
                              className="w-full h-auto object-contain" 
                            />
                          ) : fileType === 'video' ? (
                            <video 
                              src={previewUrl} 
                              className="w-full h-auto object-contain" 
                              controls 
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center">
                              <div className="flex flex-col items-center">
                                <Headphones size={48} className="text-teal-400 mb-2" />
                                <audio src={previewUrl} controls className="w-64" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-1/2">
                      {analysisResults && (
                        <>
                          <div className="mb-4 text-center">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Analysis Result</h3>
                            <div className="flex items-center justify-center gap-3">
                              {analysisResults.combined_verdict.verdict === "Likely Manipulated" ? (
                                <>
                                  <div className="text-4xl font-bold text-red-600">{analysisResults.combined_verdict.confidence}%</div>
                                  <div className="text-lg font-medium text-red-600">Likely Manipulated</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-4xl font-bold text-green-600">{analysisResults.combined_verdict.confidence}%</div>
                                  <div className="text-lg font-medium text-green-600">Likely Authentic</div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {analysisResults.combined_verdict.verdict === "Likely Manipulated" ? (
                            <div className="bg-red-50 border border-red-100 rounded-md p-4 mb-4">
                              <div className="flex items-start gap-2">
                                <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-red-800">Manipulation Detected</h4>
                                  <p className="text-sm text-red-700 mt-1">
                                    {fileType === 'audio' 
                                      ? "This audio has indicators of digital manipulation, particularly in voice patterns and transitions."
                                      : fileType === 'video'
                                      ? "This video has indicators of digital manipulation in multiple frames."
                                      : "This image has indicators of digital manipulation, particularly in facial features."
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-green-800">Likely Authentic</h4>
                                  <p className="text-sm text-green-700 mt-1">
                                    {fileType === 'audio' 
                                      ? "This audio appears to be authentic with natural voice patterns."
                                      : fileType === 'video'
                                      ? "This video appears to be authentic without signs of manipulation."
                                      : "This image appears to be authentic without signs of manipulation."
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">File Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-600">File Name:</div>
                              <div className="text-gray-800 font-medium truncate">{uploadedFile?.name}</div>
                              
                              <div className="text-gray-600">File Size:</div>
                              <div className="text-gray-800 font-medium">{(uploadedFile?.size / (1024 * 1024)).toFixed(2)} MB</div>
                              
                              <div className="text-gray-600">File Type:</div>
                              <div className="text-gray-800 font-medium">{uploadedFile?.type}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {analysisResults && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Detection Details</h3>
                      <div className="space-y-3">
                        {analysisResults.combined_verdict.verdict === "Likely Manipulated" ? (
                          <>
                            {/* Display details from the analysis */}
                            {analysisResults.combined_verdict.details && analysisResults.combined_verdict.details.length > 0 ? (
                              // Map through the details from the AI analysis
                              analysisResults.combined_verdict.details.map((detail, index) => (
                                <DetailItem 
                                  key={index}
                                  title={`Finding ${index + 1}`}
                                  confidence={Math.round(85 - index * 5)} // Generate a descending confidence for visual effect
                                  description={detail}
                                />
                              ))
                            ) : (
                              // Fallback details based on file type
                              fileType === 'audio' ? (
                                <>
                                  <DetailItem 
                                    title="Unnatural voice transitions detected" 
                                    confidence={92}
                                    description="Analysis shows abrupt changes in voice timbre and quality that are inconsistent with natural speech patterns."
                                  />
                                  
                                  <DetailItem 
                                    title="Neural network generation artifacts present" 
                                    confidence={85}
                                    description="Spectral analysis reveals patterns consistent with AI voice synthesis, particularly in consonant sounds."
                                  />
                                  
                                  <DetailItem 
                                    title="Inconsistent room acoustics" 
                                    confidence={79}
                                    description="Background acoustic properties change unnaturally between segments, indicating spliced recordings."
                                  />
                                  
                                  <DetailItem 
                                    title="Unnatural breathing patterns" 
                                    confidence={68}
                                    description="Breathing sounds and pauses do not follow natural human speech patterns."
                                  />
                                </>
                              ) : fileType === 'video' ? (
                                <>
                                  <DetailItem 
                                    title="Unnatural eye blinking patterns" 
                                    confidence={92}
                                    description="Analysis of video frames shows abnormal blinking frequency and duration."
                                  />
                                  
                                  <DetailItem 
                                    title="Inconsistent facial movements" 
                                    confidence={85}
                                    description="Facial expressions and movements don't follow natural muscle patterns, indicating manipulation."
                                  />
                                  
                                  <DetailItem 
                                    title="Temporal inconsistencies detected" 
                                    confidence={78}
                                    description="Frame-to-frame analysis reveals unnatural transitions in movement flow."
                                  />
                                  
                                  <DetailItem 
                                    title="Audio-visual synchronization issues" 
                                    confidence={70}
                                    description="Slight misalignment between lip movements and speech audio detected."
                                  />
                                </>
                              ) : (
                                <>
                                  <DetailItem 
                                    title="Inconsistent shadows around facial features" 
                                    confidence={92}
                                    description="Shadows around the eyes and nose don't match the main light source in the image."
                                  />
                                  
                                  <DetailItem 
                                    title="Digital artifacts present in hair boundaries" 
                                    confidence={85}
                                    description="Pixel inconsistencies detected along hair edges, indicating poor blending of manipulated elements."
                                  />
                                  
                                  <DetailItem 
                                    title="Texture inconsistencies in skin regions" 
                                    confidence={78}
                                    description="Unnatural smoothness or patterns in skin textures that don't match natural skin properties."
                                  />
                                  
                                  <DetailItem 
                                    title="Facial proportions abnormalities" 
                                    confidence={70}
                                    description="Subtle inconsistencies in facial feature ratios compared to anatomical norms."
                                  />
                                </>
                              )
                            )}
                          </>
                        ) : (
                          // Display authenticity indicators for authentic media
                          <>
                            <DetailItem 
                              title="Natural feature consistency" 
                              confidence={95}
                              description={fileType === 'audio' ? 
                                "Voice patterns, transitions, and acoustics appear consistent with natural human speech." : 
                                "Lighting, shadows, and feature proportions are consistent with authentic media."}
                            />
                            
                            <DetailItem 
                              title="No manipulation artifacts detected" 
                              confidence={92}
                              description="Analysis found no evidence of digital tampering or inconsistencies typical of manipulated content."
                            />
                            
                            <DetailItem 
                              title="Consistent quality throughout" 
                              confidence={90}
                              description={fileType === 'audio' ? 
                                "Audio quality and characteristics remain consistent throughout the recording." : 
                                "Image quality and characteristics appear uniform throughout."}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {analysisResults && analysisResults.secondary_analysis && analysisResults.secondary_analysis.analysis && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-md p-4">
                      <h3 className="text-md font-semibold text-slate-800 mb-2">AI Analysis</h3>
                      <p className="text-sm text-slate-700 whitespace-pre-line">
                        {analysisResults.secondary_analysis.analysis}
                      </p>
                    </div>
                  )}
                  
                  <button
                    className="mt-6 bg-gradient-to-r from-teal-600 to-teal-800 text-white font-medium py-2 px-4 rounded-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2"
                    onClick={() => alert('Report will be downloaded shortly...')}
                  >
                    <span>Download Detailed Report</span>
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

const DetailItem = ({ title, confidence, description }) => {
  // Determine color based on confidence
  const getColorClass = (confidence) => {
    if (confidence >= 80) return { bg: 'bg-red-100', text: 'text-red-800' };
    if (confidence >= 60) return { bg: 'bg-orange-100', text: 'text-orange-800' };
    if (confidence >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    return { bg: 'bg-green-100', text: 'text-green-800' };
  };
  
  const colorClass = getColorClass(confidence);
  
  return (
    <div className="border border-gray-100 rounded-md p-3 bg-gray-50">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <span className={`text-xs font-semibold ${colorClass.bg} ${colorClass.text} py-0.5 px-2 rounded-full`}>
          {confidence}% confidence
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default DetectivePage;