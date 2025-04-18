import { Link } from 'react-router-dom';
import { Shield, Search, BookOpen, BarChart2, Scale } from 'lucide-react';
import batmanSilhouette from '../assets/batman.png';
import sherlockSilhouette from '../assets/sher.png';
import yodaSilhouette from '../assets/yoda.webp';
import visionSilhouette from '../assets/vision.png';
import debateSilhouette from '../assets/debate.png';

const HomePage = () => {
  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-700 to-cyan-900 rounded-2xl p-8 lg:p-12 mb-16 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your <span className="text-orange-300">Sentinel</span>
            </h1>
            <p className="text-cyan-100 text-lg md:text-xl mb-8">
              Our team of legendary detectives is here to help you uncover the truth.
              Each sentinel has their own special abilities to assist you.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/batman" className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-medium py-2 px-4 rounded-md hover:from-cyan-700 hover:to-cyan-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2">
                <Shield size={18} />
                <span>Meet Our Sentinels</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sentinels Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Choose Your Sentinel</h2>
            <div className="h-0.5 flex-grow ml-6 bg-gradient-to-r from-cyan-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <SentinelCard 
              name="Batman"
              role="YouTube Fact Checker"
              description="Batman specializes in analyzing YouTube videos for misinformation. His detective skills help identify misleading content."
              icon={<Shield className="w-6 h-6 text-cyan-500" />}
              color="from-blue-500 to-blue-700"
              imageSrc={batmanSilhouette}
              link="/batman"
            />
            
            <SentinelCard 
              name="Sherlock Holmes"
              role="Text Fact Checker"
              description="With his legendary deductive reasoning, Sherlock analyzes text and audio to separate fact from fiction."
              icon={<Search className="w-6 h-6 text-cyan-500" />}
              color="from-indigo-500 to-purple-700"
              imageSrc={sherlockSilhouette}
              link="/sherlock"
            />

            <SentinelCard 
              name="Yoda"
              role="Education Sentinel"
              description="Learn about misinformation, you will. Through interactive games and software, he teaches you his ways."
              icon={<BookOpen className="w-6 h-6 text-cyan-500" />}
              color="from-green-500 to-green-700"
              imageSrc={yodaSilhouette}
              link="/yoda"
            />
            
            <SentinelCard 
              name="Vision"
              role="Misinformation Dashboard"
              description="Vision provides analytics on misinformation trends, showing patterns and helping predict emerging threats."
              icon={<BarChart2 className="w-6 h-6 text-cyan-500" />}
              color="from-purple-500 to-purple-700"
              imageSrc={visionSilhouette}
              link="/vision"
            />
            
            <SentinelCard 
              name="Debate Chamber"
              role="Test Your Arguments"
              description="Challenge your critical thinking in our AI-powered debate arena. Defend your views on controversial topics."
              icon={<Scale className="w-6 h-6 text-cyan-500" />}
              color="from-orange-500 to-orange-700"
              imageSrc={debateSilhouette}
              link="/debate"
            />
          </div>
        </div>
        
        {/* Featured Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Featured Tools</h2>
            <div className="h-0.5 flex-grow ml-6 bg-gradient-to-r from-cyan-200 to-transparent"></div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 md:p-8 border border-orange-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-orange-500 to-orange-700 rounded-full flex items-center justify-center shadow-md">
                  <Scale size={40} className="text-white" />
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">New: Debate Chamber</h3>
                <p className="text-gray-600 mb-4">
                  Test your critical thinking skills in our AI-powered debate arena. Challenge your views on 
                  controversial topics and learn the art of constructing sound arguments based on evidence.
                </p>
                <Link 
                  to="/debate" 
                  className="inline-block bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium py-2 px-4 rounded-md hover:from-orange-600 hover:to-orange-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Enter the Debate Chamber
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">How It Works</h2>
            <div className="h-0.5 flex-grow ml-6 bg-gradient-to-r from-cyan-200 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-cyan-700 font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Choose Your Sentinel</h3>
              <p className="text-gray-600">
                Select the sentinel with the capabilities that best match your needs. Each has unique specialties.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-cyan-700 font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Submit Content for Analysis</h3>
              <p className="text-gray-600">
                Provide the content you want to verify—text, URLs, or audio recordings—to your chosen sentinel.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-cyan-700 font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Review Detailed Analysis</h3>
              <p className="text-gray-600">
                Receive a comprehensive fact-check with sources, trust scores, and explanations to guide your understanding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SentinelCard = ({ name, role, description, color, imageSrc, link }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full hover:-translate-y-1 transition-transform duration-300">
      <div className={`relative h-48 bg-gradient-to-r ${color} overflow-hidden flex items-center justify-center`}>
        <img src={imageSrc} alt={name} className="h-40 object-contain" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{name}</h3>
        <p className="text-cyan-600 font-medium text-sm mb-3">{role}</p>
        <p className="text-gray-600 mb-5">{description}</p>
        
        <Link to={link} className="bg-gradient-to-r from-cyan-600 to-cyan-800 text-white font-medium py-2 px-4 rounded-md hover:from-cyan-700 hover:to-cyan-900 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full flex items-center justify-center gap-2">
          <span>Choose {name}</span>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
