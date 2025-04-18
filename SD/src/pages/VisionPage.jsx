import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, BarChart2, PieChart, TrendingUp, Filter, 
  Download, RefreshCw, Calendar, ChevronDown, AlertTriangle,
  Eye, Share2
} from 'lucide-react';

const VisionPage = () => {
  const [timeRange] = useState('30 days');
  const [category] = useState('All Categories');
  
  const misinfoStats = {
    totalReports: 14257,
    avgTrustScore: 4.2,
    topCategories: [
      { name: 'Health & Medicine', percentage: 34 },
      { name: 'Politics', percentage: 28 },
      { name: 'Science & Tech', percentage: 19 },
      { name: 'Economy', percentage: 12 },
      { name: 'Environment', percentage: 7 }
    ],
    monthlyTrends: [
      { month: 'Jan', count: 850 },
      { month: 'Feb', count: 920 },
      { month: 'Mar', count: 1100 },
      { month: 'Apr', count: 1250 },
      { month: 'May', count: 1080 },
      { month: 'Jun', count: 1540 },
      { month: 'Jul', count: 1720 },
      { month: 'Aug', count: 1920 },
      { month: 'Sep', count: 1820 },
      { month: 'Oct', count: 2050 },
      { month: 'Nov', count: 2120 },
      { month: 'Dec', count: 1760 }
    ],
    commonMisconceptions: [
      { claim: "5G networks cause health problems", frequency: 2840, trustScore: 2.1 },
      { claim: "Climate change is a hoax", frequency: 2350, trustScore: 1.5 },
      { claim: "Vaccines contain microchips", frequency: 1980, trustScore: 1.2 },
      { claim: "The Earth is flat", frequency: 1870, trustScore: 0.8 },
      { claim: "Drinking bleach cures diseases", frequency: 1520, trustScore: 0.5 }
    ],
    sourceDistribution: [
      { source: "Social Media", percentage: 45 },
      { source: "Blogs & Forums", percentage: 27 },
      { source: "Messaging Apps", percentage: 16 },
      { source: "News Websites", percentage: 8 },
      { source: "Other", percentage: 4 }
    ],
    demographicData: [
      { age: "18-24", susceptibility: 65 },
      { age: "25-34", susceptibility: 58 },
      { age: "35-44", susceptibility: 42 },
      { age: "45-54", susceptibility: 48 },
      { age: "55-64", susceptibility: 67 },
      { age: "65+", susceptibility: 72 }
    ],
    recentSearches: [
      "is coronavirus man-made",
      "do vaccines cause autism",
      "5g towers radiation danger",
      "election fraud evidence",
      "flat earth proof",
      "climate change fake news",
      "covid microchip tracking",
      "facebook data collection",
      "is ai dangerous",
      "moon landing fake"
    ]
  };
  
  return (
    <div className="pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-500 hover:text-purple-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Vision</h1>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">Misinformation Dashboard</span>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-3 text-sm">
                <Calendar size={16} className="text-gray-500" />
                <span>Last {timeRange}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-3 text-sm">
                <Filter size={16} className="text-gray-500" />
                <span>{category}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-50 transition-colors">
              <RefreshCw size={16} className="text-gray-600" />
            </button>
            <button className="bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-50 transition-colors">
              <Download size={16} className="text-gray-600" />
            </button>
            <button className="bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-50 transition-colors">
              <Share2 size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Reports" 
            value={misinfoStats.totalReports.toLocaleString()} 
            trend="+12.7%" 
            trendDirection="up" 
            icon={<AlertTriangle size={20} className="text-red-500" />}
          />
          <StatCard 
            title="Avg Trust Score" 
            value={misinfoStats.avgTrustScore.toFixed(1) + "/10"} 
            trend="-0.8" 
            trendDirection="down" 
            icon={<Eye size={20} className="text-purple-500" />}
          />
          <StatCard 
            title="Top Category" 
            value="Health & Medicine" 
            trend="+5.4%" 
            trendDirection="up" 
            icon={<PieChart size={20} className="text-blue-500" />}
          />
          <StatCard 
            title="Verification Rate" 
            value="93.2%" 
            trend="+2.1%" 
            trendDirection="up" 
            icon={<BarChart2 size={20} className="text-green-500" />}
          />
        </div>
        
        {/* Main Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Misinformation by Category */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Misinformation by Category</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View Details</button>
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Placeholder for chart - in a real app you'd use a charting library */}
              <div className="w-full">
                {misinfoStats.topCategories.map((category, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{category.name}</span>
                      <span>{category.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${category.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Monthly Trends */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Monthly Trends</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View Details</button>
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Placeholder for line chart */}
              <div className="w-full h-full flex items-end justify-between">
                {misinfoStats.monthlyTrends.map((item, index) => {
                  const heightPercentage = (item.count / 2200) * 100; // Normalize to the max value
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-6 bg-purple-500 rounded-t-sm" 
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      <span className="text-xs mt-1 text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Most Common Misconceptions */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Common Misconceptions</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Score</th>
                  </tr>
                </thead>
                <tbody>
                  {misinfoStats.commonMisconceptions.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-3">{item.claim}</td>
                      <td className="py-3 px-3">{item.frequency.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.trustScore < 3 ? 'bg-red-100 text-red-800' : 
                          item.trustScore < 7 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.trustScore.toFixed(1)}/10
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Source Distribution */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Misinformation Sources</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View Details</button>
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Simple representation of a pie chart */}
              <div className="relative w-48 h-48">
                {misinfoStats.sourceDistribution.map((source, index) => {
                  // This is a very simplified way to show a pie chart
                  // In a real app, you'd use a charting library
                  const rotation = index > 0 
                    ? misinfoStats.sourceDistribution
                        .slice(0, index)
                        .reduce((sum, item) => sum + item.percentage, 0)
                    : 0;
                  
                  const colors = [
                    'bg-purple-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-red-500'
                  ];
                  
                  return (
                    <div 
                      key={index}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div 
                        className={`${colors[index % colors.length]} w-full h-full absolute`}
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotation + source.percentage / 2) * 3.6 * Math.PI / 180)}% ${50 - 50 * Math.sin((rotation + source.percentage / 2) * 3.6 * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotation + source.percentage) * 3.6 * Math.PI / 180)}% ${50 - 50 * Math.sin((rotation + source.percentage) * 3.6 * Math.PI / 180)}%)`
                        }}
                      ></div>
                    </div>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white w-24 h-24 rounded-full"></div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="ml-8">
                {misinfoStats.sourceDistribution.map((source, index) => {
                  const colors = [
                    'bg-purple-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-red-500'
                  ];
                  
                  return (
                    <div key={index} className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-sm ${colors[index % colors.length]} mr-2`}></div>
                      <span className="text-sm">{source.name} ({source.percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demographic Susceptibility */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Demographic Susceptibility</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View Report</button>
            </div>
            <div className="h-64 flex items-center justify-center">
              {/* Simple bar chart representation */}
              <div className="w-full h-full flex items-end justify-between px-4">
                {misinfoStats.demographicData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 bg-purple-500 rounded-t-sm" 
                      style={{ height: `${item.susceptibility}%` }}
                    ></div>
                    <span className="text-xs mt-1 text-gray-500">{item.age}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Search Trends */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Search Trends</h2>
              <button className="text-sm text-purple-600 hover:text-purple-800">View All</button>
            </div>
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2">
                {misinfoStats.recentSearches.map((search, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1.5 rounded-full"
                  >
                    {search}
                  </span>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Trending Topics</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <TrendingUp size={16} className="text-red-500 mr-2" />
                    <span className="text-sm">COVID-19 misinformation</span>
                    <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">+42%</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp size={16} className="text-red-500 mr-2" />
                    <span className="text-sm">AI-generated fake content</span>
                    <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">+38%</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp size={16} className="text-red-500 mr-2" />
                    <span className="text-sm">Environmental misinformation</span>
                    <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">+23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, trendDirection, icon }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
        <div className="bg-purple-100 p-2 rounded-md">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`flex items-center ${
          trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trendDirection === 'up' ? (
            <TrendingUp size={14} className="mr-1" />
          ) : (
            <TrendingUp size={14} className="mr-1 transform rotate-180" />
          )}
          <span className="text-xs font-medium">{trend}</span>
        </div>
        <span className="text-xs text-gray-500 ml-2">vs. previous period</span>
      </div>
    </div>
  );
};

export default VisionPage;