import React from 'react';
import { BookOpen, Sparkles, Brain, School, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import yodaImage from '../assets/yoda.webp';

const YodaPage = () => {
  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-cyan-700 hover:text-cyan-900 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Sentinels</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-8 lg:p-12 mb-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/3 flex justify-center mb-8 md:mb-0">
              <img 
                src={yodaImage} 
                alt="Master Yoda" 
                className="h-64 object-contain rounded-full bg-green-800/50 p-2 border-4 border-green-600/30" 
              />
            </div>
            
            <div className="md:w-2/3 md:pl-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Master <span className="text-yellow-300">Yoda</span>
              </h1>
              <p className="text-green-100 text-lg mb-4">
                Education Sentinel
              </p>
              <p className="text-green-100 mb-8">
                "Learn to recognize misinformation, you must. Through knowledge and wisdom, protect yourself, you will. 
                Powerful tools I offer, to train your mind in the ways of critical thinking, hmm."
              </p>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="text-yellow-300 font-medium mb-2">Yoda's Wisdom</h3>
                <p className="text-green-100 italic">
                  "Fear leads to doubt. Doubt leads to vulnerability. Vulnerability leads to misinformation."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Tools Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Educational Tools</h2>
            <div className="h-0.5 flex-grow ml-6 bg-gradient-to-r from-green-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ToolCard 
              title="Misinformation Identification Training"
              description="Interactive exercises to help you identify common patterns of misinformation. Train your eye to spot deceptive content across various media."
              icon={<Brain className="w-6 h-6 text-green-600" />}
              buttonText="Start Training"
            />
            
            <ToolCard 
              title="Source Evaluation Game"
              description="A fun, interactive game that teaches you how to evaluate the credibility of different information sources. Earn points as you master this critical skill."
              icon={<Sparkles className="w-6 h-6 text-green-600" />}
              buttonText="Play Game"
            />
            
            <ToolCard 
              title="Critical Thinking Curriculum"
              description="A structured learning path designed to enhance your critical thinking skills. Complete lessons and earn certificates as you progress."
              icon={<School className="w-6 h-6 text-green-600" />}
              buttonText="Start Learning"
            />
            
            <ToolCard 
              title="Digital Literacy Resources"
              description="Comprehensive guides and resources to improve your digital literacy skills. Learn to navigate the digital world safely and critically."
              icon={<BookOpen className="w-6 h-6 text-green-600" />}
              buttonText="Access Resources"
            />
          </div>
        </div>
        
        {/* Quote Section */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-8 mb-16">
          <blockquote className="text-xl text-center text-gray-800 italic">
            "Always in motion, the future of information is. Learn to distinguish truth from deception, you must."
          </blockquote>
          <div className="text-center mt-4 text-green-700 font-medium">Master Yoda</div>
        </div>
        
        {/* About Yoda's Approach */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Yoda's Approach</h2>
            <div className="h-0.5 flex-grow ml-6 bg-gradient-to-r from-green-200 to-transparent"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-6">
            <p className="text-gray-700 mb-4">
              Master Yoda believes that the best defense against misinformation is education and practice. 
              Rather than simply telling you what is true or false, he focuses on teaching you the skills to 
              determine truth for yourself.
            </p>
            <p className="text-gray-700 mb-4">
              His educational approach combines ancient wisdom with modern understanding of information literacy, 
              creating a unique and effective training program for people of all ages and backgrounds.
            </p>
            <p className="text-gray-700">
              Through interactive exercises, games, and thoughtful guidance, Yoda helps you develop the "information 
              force sensitivity" needed to navigate today's complex media landscape.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolCard = ({ title, description, icon, buttonText }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full hover:-translate-y-1 transition-transform duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-3 rounded-lg mr-4">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <button className="bg-gradient-to-r from-green-600 to-green-800 text-white font-medium py-2 px-4 rounded-md hover:from-green-700 hover:to-green-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default YodaPage;