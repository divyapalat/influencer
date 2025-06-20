import React, { useState } from 'react';
import { Search, MapPin, Users, Heart, BarChart, UserCircle as LoaderCircle, Star } from 'lucide-react';

// Main App Component
const App = () => {
  // --- STATE MANAGEMENT ---
  // Stores the user's input for location
  const [location, setLocation] = useState('');
  // Stores the user's input for interest/niche
  const [interest, setInterest] = useState('');
  // Stores the list of influencers returned by the API
  const [influencers, setInfluencers] = useState([]);
  // Tracks the loading state during an API call
  const [isLoading, setIsLoading] = useState(false);
  // Stores any error messages
  const [error, setError] = useState(null);
  // Tracks if a search has been performed to show the initial message
  const [hasSearched, setHasSearched] = useState(false);

  // --- API CALL & DATA HANDLING ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location || !interest) {
      setError('Please enter both location and interest.');
      return;
    }

    setIsLoading(true);
    setInfluencers([]);
    setError(null);
    setHasSearched(true);

    // This prompt asks the AI to generate a structured JSON response, now including an impact score.
    const prompt = `Find the top 10 influencers based in "${location}" with a key interest in "${interest}". For each influencer, provide their full name, a realistic Instagram handle starting with '@', their location, main interest/niche, a realistic follower count (reach), and a realistic engagement rate as a percentage string (e.g., "2.5%"). Also, provide an 'impactScore' from 1 to 100, where 100 is the highest impact, calculated as a combination of their reach and engagement rate. Finally, generate a placeholder avatar image URL using 'https://placehold.co/'.`;

    // Define the expected JSON structure for the AI's response, now with impactScore.
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          handle: { type: "STRING" },
          location: { type: "STRING" },
          interest: { type: "STRING" },
          reach: { type: "NUMBER" },
          engagement: { type: "STRING" },
          impactScore: { type: "NUMBER" },
          profileImageUrl: { type: "STRING" }
        },
        required: ["name", "handle", "location", "interest", "reach", "engagement", "impactScore", "profileImageUrl"]
      }
    };
    
    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
          contents: chatHistory,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        };

        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error("Google API key is not configured. Please set VITE_GOOGLE_API_KEY in your environment variables.");
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedData = JSON.parse(jsonText);
            // Sort the influencers by the new impactScore in descending order
            const sortedData = parsedData.sort((a, b) => b.impactScore - a.impactScore);
            setInfluencers(sortedData);
        } else {
            throw new Error("No influencers found for this criteria. Try a different search.");
        }

    } catch (err) {
      console.error("API call failed:", err);
      setError(err.message || "Failed to fetch influencers. Please try again.");
      setInfluencers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HELPER FUNCTION ---
  // Formats large numbers for better readability (e.g., 1200000 -> 1.2M)
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  // --- RENDER ---
  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Influencer Finder</h1>
          <p className="text-slate-600 mt-2 text-lg">Discover top talent powered by AI</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="grid sm:grid-cols-2 gap-4 items-end">
            <div className="w-full">
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, USA"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div className="w-full">
              <label htmlFor="interest" className="block text-sm font-medium text-slate-700 mb-1">Key Interest</label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="interest"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="e.g., Fashion, Tech"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:col-span-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? <><LoaderCircle className="animate-spin mr-2" /> Searching...</> : <><Search className="mr-2" /> Find Influencers</>}
            </button>
          </form>
        </div>

        <main className="mt-12">
          {isLoading && (
            <div className="flex justify-center items-center flex-col text-center">
              <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="mt-4 text-slate-600">Generating influencer list...</p>
            </div>
          )}

          {error && (
            <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-2xl mx-auto">
              <strong className="font-bold">Oops! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!isLoading && !error && !hasSearched && (
            <div className="text-center text-slate-500"><p>Enter a location and interest to start your search.</p></div>
          )}
          
          {!isLoading && !error && hasSearched && influencers.length === 0 && (
             <div className="text-center text-slate-500"><p>No influencers found for this criteria. Please try a different search.</p></div>
          )}

          {influencers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {influencers.map((influencer, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col">
                  <div className="p-5 flex flex-col items-center text-center">
                    <img
                      src={influencer.profileImageUrl || `https://placehold.co/100x100/E2E8F0/475569?text=${influencer.name.charAt(0)}`}
                      alt={`Profile of ${influencer.name}`}
                      className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/E2E8F0/475569?text=${influencer.name.charAt(0)}`; }}
                    />
                    <h3 className="text-xl font-bold mt-4 text-slate-900">{influencer.name}</h3>
                    <p className="text-blue-500 font-medium">{influencer.handle}</p>
                    <div className="flex items-center text-slate-500 text-sm mt-2">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span>{influencer.location}</span>
                    </div>
                    {/* Impact Score Badge */}
                    <div className="mt-4 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full inline-flex items-center">
                        <Star className="w-5 h-5 mr-2 text-amber-500" />
                        <span className="font-bold text-lg">{influencer.impactScore}</span>
                        <span className="text-sm ml-1.5">/ 100 Impact</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 border-t border-slate-200 mt-auto grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reach</p>
                      <div className="flex items-center justify-center mt-1">
                        <Users className="w-4 h-4 text-slate-400 mr-1.5" />
                        <p className="text-lg font-bold text-slate-800">{formatNumber(influencer.reach)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Engagement</p>
                       <div className="flex items-center justify-center mt-1">
                        <BarChart className="w-4 h-4 text-slate-400 mr-1.5" />
                        <p className="text-lg font-bold text-slate-800">{influencer.engagement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;