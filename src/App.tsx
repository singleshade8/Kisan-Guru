import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Camera, 
  Share2, 
  Languages, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Info,
  Loader2,
  LayoutDashboard,
  Search,
  Droplets,
  CloudRain,
  Thermometer,
  ArrowRight,
  History,
  Home,
  Wind,
  Star,
  Trash2,
  MessageCircle,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { translations, Language } from './lib/translations';
import { WeatherWidget } from './components/WeatherWidget';
import { VoiceInput } from './components/VoiceInput';
import { cn } from './lib/utils';

import { predictCrop, checkSuitability, detectDisease, chatWithGemini } from '../api/gemini';

type Tab = 'home' | 'dashboard' | 'disease' | 'suitability' | 'chat';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'hi');
  const [soil, setSoil] = useState('red');
  const [weather, setWeather] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [disease, setDisease] = useState<any>(null);
  const [suitability, setSuitability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [suitabilityLoading, setSuitabilityLoading] = useState(false);
  const [activeCrops, setActiveCrops] = useState<any[]>(() => JSON.parse(localStorage.getItem('activeCrops') || '[]'));
  const [suitabilityInput, setSuitabilityInput] = useState('');
  const [suitabilitySoil, setSuitabilitySoil] = useState('red');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    // Auto weather based on location
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const w = {
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          rain: data.current.rain,
          city: "Coimbatore"
        };
        setWeather(w);
        localStorage.setItem('lastWeather', JSON.stringify(w));
      } catch (e) {
        console.error("Weather error", e);
      }
    }, () => {
      const cached = localStorage.getItem('lastWeather');
      if (cached) setWeather(JSON.parse(cached));
      else setWeather({ temp: 28, humidity: 65, rain: 2, city: "Coimbatore" });
    });
  }, []);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const getAdvice = async () => {
    if (!weather) return;
    setLoading(true);
    setError(null);
    try {
      const data = await predictCrop(
        soil,
        weather.temp,
        weather.humidity,
        weather.rain,
        lang
      );
      setPrediction(data);
      localStorage.setItem('lastPrediction', JSON.stringify(data));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#fbbf24', '#ffffff']
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkSuitabilityAction = async () => {
    if (!weather || !suitabilityInput) return;
    setSuitabilityLoading(true);
    setError(null);
    try {
      const data = await checkSuitability(
        suitabilityInput,
        suitabilitySoil,
        weather.temp,
        weather.humidity,
        weather.rain,
        lang
      );
      setSuitability(data);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setSuitabilityLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const response = await chatWithGemini(userMsg, history, lang);
      setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    } catch (e) {
      console.error(e);
      setError("Chat error occurred");
    } finally {
      setChatLoading(false);
    }
  };

  const startFarming = (crop: any) => {
    const newCrop = {
      ...crop,
      id: Math.random().toString(36).substr(2, 9),
      startDate: new Date().toISOString(),
      duration: 3, // Default 3 months
      progress: Math.floor(Math.random() * 40) + 10,
      profit_history: [
        { month: 'Jan', profit: 1000 },
        { month: 'Feb', profit: 2500 },
        { month: 'Mar', profit: 4000 },
        { month: 'Apr', profit: 6500 },
      ],
      history: [
        { day: 1, growth: 0 },
        { day: 10, growth: 5 },
        { day: 20, growth: 15 },
        { day: 30, growth: 25 },
      ]
    };
    const updated = [...activeCrops, newCrop];
    setActiveCrops(updated);
    localStorage.setItem('activeCrops', JSON.stringify(updated));
    setActiveTab('dashboard');
  };

  const stopFarming = (id: string) => {
    const updated = activeCrops.filter(c => c.id !== id);
    setActiveCrops(updated);
    localStorage.setItem('activeCrops', JSON.stringify(updated));
  };

  const handleVoiceResult = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('लाल') || lowerText.includes('red') || lowerText.includes('சிவப்பு')) setSoil('red');
    else if (lowerText.includes('काली') || lowerText.includes('black') || lowerText.includes('கருப்பு')) setSoil('black');
    else if (lowerText.includes('रेतीली') || lowerText.includes('sandy') || lowerText.includes('மணல்')) setSoil('sandy');
    else if (lowerText.includes('चिकनी') || lowerText.includes('clay') || lowerText.includes('களிமண்')) setSoil('clay');
    
    getAdvice();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDiseaseLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const data = await detectDisease(base64, lang);
        setDisease(data);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "An unknown error occurred");
      } finally {
        setDiseaseLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const shareToWhatsApp = (rec: any) => {
    const text = `${t.crop_result}: ${rec.crop}\n${t.profit}: ${rec.profit}\n${t.reason}: ${rec.reason}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getIrrigationAdvice = () => {
    if (!weather) return null;
    if (weather.humidity < 40) return "Increase watering - Low humidity";
    if (weather.humidity > 80) return "Reduce watering - High humidity";
    return "Normal irrigation needed";
  };

  const getWeatherAlerts = () => {
    if (!weather) return [];
    const alerts = [];
    if (weather.rain > 5) alerts.push("Heavy Rain Alert");
    if (weather.temp > 38) alerts.push("Heatwave Warning");
    return alerts;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900 font-sans pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-green-700 p-2 rounded-2xl shadow-lg shadow-green-100">
              <Sprout size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">
                {t.title}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-700 opacity-70">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {(['hi', 'en', 'ta'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2",
                  lang === l ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {activeTab === 'home' && (
          <>
            <WeatherWidget data={weather} labels={t} />
            
            {/* Smart Assistant Alerts */}
            <div className="space-y-2">
              {getWeatherAlerts().map((alert, i) => (
                <div key={i} className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-red-700 font-bold animate-bounce">
                  <AlertCircle size={18} />
                  {alert}
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center gap-2 text-blue-700 font-bold">
                <Droplets size={18} />
                {getIrrigationAdvice()}
              </div>
            </div>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-green-50">
              <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-green-600 rounded-full" />
                {t.soil}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {['red', 'black', 'sandy', 'clay'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSoil(s)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left font-bold",
                      soil === s ? "bg-green-50 border-green-600 text-green-800 shadow-inner" : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {(t as any)[s]}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-4 items-center">
              <VoiceInput onResult={(text) => { setSoil('red'); getAdvice(); }} lang={lang} label={t.voice_btn} />
              <button
                onClick={getAdvice}
                disabled={loading}
                className="w-full bg-green-700 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-green-200 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <TrendingUp size={24} />}
                {t.advice_btn}
              </button>
              {error && (
                <div className="w-full bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-700 font-medium">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div className="flex flex-col">
                    <span className="font-bold">Error:</span>
                    <span className="text-sm opacity-90">{error}</span>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {prediction && prediction.recommendations && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h3 className="text-xl font-black text-gray-800 px-2">{t.top_3}</h3>
                  {prediction.recommendations.map((rec: any, i: number) => (
                    <div key={i} className={cn(
                      "bg-white p-6 rounded-3xl shadow-lg border-2 relative overflow-hidden",
                      i === prediction.best_crop_index ? "border-green-500" : "border-gray-100"
                    )}>
                      {i === prediction.best_crop_index && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl font-bold text-xs uppercase">
                          {t.best_choice}
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-2xl font-black text-gray-800">{rec.crop}</h4>
                          <p className="text-sm text-green-600 font-bold">{rec.confidence} {t.confidence}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-bold uppercase">{t.profit}</p>
                          <p className="text-lg font-black text-green-700">{rec.profit}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{t.yield}</p>
                          <p className="text-sm font-bold">{rec.yield}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{t.cost}</p>
                          <p className="text-sm font-bold">{rec.cost}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => startFarming(rec)}
                        className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100"
                      >
                        {t.start_farming} <ArrowRight size={18} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {activeCrops.length > 0 ? (
              <div className="space-y-12">
                {activeCrops.length > 1 && (
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="text-indigo-700" size={20} />
                      </div>
                      <h3 className="text-lg font-black text-gray-900">Total Portfolio Growth</h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { month: 'Jan', total: activeCrops.reduce((acc, c) => acc + (c.profit_history?.[0]?.profit || 0), 0) },
                          { month: 'Feb', total: activeCrops.reduce((acc, c) => acc + (c.profit_history?.[1]?.profit || 0), 0) },
                          { month: 'Mar', total: activeCrops.reduce((acc, c) => acc + (c.profit_history?.[2]?.profit || 0), 0) },
                          { month: 'Apr', total: activeCrops.reduce((acc, c) => acc + (c.profit_history?.[3]?.profit || 0), 0) },
                        ]}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                          <XAxis dataKey="month" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                              fontWeight: 'bold'
                            }} 
                          />
                          <Area type="monotone" dataKey="total" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeCrops.map((crop) => (
                  <div key={crop.id} className="space-y-6">
                    <div className="bg-green-700 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-green-900/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                      <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1 opacity-80">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t.active_crop}</p>
                          </div>
                          <h2 className="text-4xl font-black tracking-tight">{crop.crop}</h2>
                        </div>
                        <button 
                          onClick={() => stopFarming(crop.id)}
                          className="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-lg p-3 rounded-2xl border border-white/20 transition-colors group/del"
                        >
                          <Trash2 size={24} className="text-white group-hover/del:scale-110 transition-transform" />
                        </button>
                      </div>
                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                          <span>{t.growth}</span>
                          <span>{crop.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden p-1 border border-white/10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${crop.progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="bg-white h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="text-green-700" size={20} />
                          </div>
                          <h3 className="text-lg font-black text-gray-900">{t.growth}</h3>
                        </div>
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={crop.history || []}>
                              <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                              <XAxis dataKey="day" hide />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                  fontWeight: 'bold'
                                }} 
                              />
                              <Area type="monotone" dataKey="growth" stroke="#15803d" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={4} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="text-blue-700" size={20} />
                          </div>
                          <h3 className="text-lg font-black text-gray-900">Profit Growth</h3>
                        </div>
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={crop.profit_history || []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                              <XAxis dataKey="month" hide />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                  fontWeight: 'bold'
                                }} 
                              />
                              <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={4} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 group hover:border-green-200 transition-colors overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
                            <TrendingUp size={12} className="text-green-700" />
                          </div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.market_price}</p>
                        </div>
                        <p className="text-xl font-black text-gray-900 tracking-tight wrap-break-word">{crop.market_price}</p>
                      </div>
                      <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 group hover:border-green-200 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
                            <Search size={12} className="text-green-700" />
                          </div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.sustainability}</p>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={cn(
                                i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"
                              )} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-100 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <History size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">{t.active_crop} Not Found</p>
                <button onClick={() => setActiveTab('home')} className="mt-6 bg-green-700 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-100 active:scale-95 transition-all">
                  Start Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-green-700 p-6 text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">{t.chat}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Online Assistant</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sprout size={24} className="text-green-600" />
                  </div>
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">How can I help you today?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl font-bold text-sm",
                    msg.role === 'user' ? "bg-green-700 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="animate-spin text-green-700" size={16} />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.chat_placeholder}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-green-600 transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-green-700 text-white p-3 rounded-xl shadow-lg shadow-green-100 disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suitability' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                  <Search className="text-green-700" size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900">{t.sustainability}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={suitabilityInput}
                    onChange={(e) => setSuitabilityInput(e.target.value)}
                    placeholder={t.enter_crop}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold focus:border-green-500 focus:bg-white outline-none transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['red', 'black', 'sandy', 'clay'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSuitabilitySoil(s)}
                      className={cn(
                        "p-4 rounded-2xl border-2 font-black transition-all text-xs uppercase tracking-wider",
                        suitabilitySoil === s 
                          ? "bg-green-700 border-green-700 text-white shadow-lg shadow-green-100" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      {(t as any)[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={checkSuitabilityAction}
                disabled={suitabilityLoading}
                className="w-full mt-8 bg-green-700 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-100 hover:bg-green-800 transition-all active:scale-95"
              >
                {suitabilityLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                {t.check_btn}
              </button>
            </div>

            <AnimatePresence>
              {suitability && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(
                  "p-8 rounded-[2.5rem] border-2 shadow-xl",
                  suitability.suitable ? "bg-white border-green-500/20 shadow-green-900/5" : "bg-white border-red-500/20 shadow-red-900/5"
                )}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", suitability.suitable ? "bg-green-100" : "bg-red-100")}>
                        {suitability.suitable ? <CheckCircle2 className="text-green-700" size={24} /> : <AlertCircle className="text-red-700" size={24} />}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">{suitability.suitable ? (t as any).suitable : (t as any).not_suitable}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</span>
                      <span className="text-3xl font-black text-green-700 leading-none">{suitability.overall_score}<span className="text-sm text-gray-300">/10</span></span>
                    </div>
                  </div>
                  
                  <p className="font-medium text-gray-600 leading-relaxed mb-8 text-lg italic border-l-4 border-green-500 pl-4">"{suitability.reason}"</p>
                  
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Sustainability Factors</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <FactorScore label={t.soil} score={suitability.factors?.soil} />
                      <FactorScore label={t.temp} score={suitability.factors?.temperature} />
                      <FactorScore label={t.humidity} score={suitability.factors?.humidity} />
                      <FactorScore label={t.rain} score={suitability.factors?.rainfall} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'disease' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Camera className="text-orange-600" size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900">{t.disease_title}</h2>
              </div>
              
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={diseaseLoading}
                className="w-full border-4 border-dashed border-orange-100 p-12 rounded-4xl flex flex-col items-center gap-4 hover:bg-orange-50/50 hover:border-orange-200 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-b from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                {diseaseLoading ? (
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <Loader2 className="animate-spin text-orange-500" size={48} />
                    <p className="font-black text-orange-800 uppercase tracking-widest text-[10px] animate-pulse">Analyzing Plant...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="bg-orange-100 p-6 rounded-3xl shadow-lg shadow-orange-100 group-hover:scale-110 transition-transform duration-500">
                      <Camera className="text-orange-600" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-gray-900 text-lg mb-1">{t.upload_prompt}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Supports JPG, PNG</p>
                    </div>
                  </div>
                )}
              </button>

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-widest mb-1">Error</span>
                    <span className="text-sm font-bold opacity-90">{error}</span>
                  </div>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {disease && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-xl shadow-orange-900/5"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Diagnosis Result</p>
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 tracking-tight">{disease.disease}</h4>
                    </div>
                    <div className="bg-orange-100 px-4 py-2 rounded-2xl">
                      <span className="text-orange-800 text-sm font-black">{disease.confidence}</span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-xl shrink-0">
                        <Info className="text-orange-600" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">{t.remedy}</p>
                        <p className="text-gray-800 font-bold leading-relaxed">{disease.remedy}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-4xl px-6 py-3 flex justify-between items-center">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} label={t.weather} />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label={t.dashboard} />
          <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageCircle size={22} />} label={t.chat} />
          <NavButton active={activeTab === 'suitability'} onClick={() => setActiveTab('suitability')} icon={<Search size={22} />} label={t.suitability} />
          <NavButton active={activeTab === 'disease'} onClick={() => setActiveTab('disease')} icon={<Camera size={22} />} label={t.disease_title} />
        </div>
      </nav>
    </div>
  );
}

function FactorScore({ label, score }: { label: string, score?: number }) {
  if (score === undefined) return null;
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-bold uppercase text-gray-400 w-24">{label}:</span>
      <div className="flex-1 flex gap-1">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={cn("flex-1 h-2 rounded-full", i < score ? "bg-green-500" : "bg-gray-200")} />
        ))}
      </div>
      <span className="text-xs font-black text-gray-600 w-4">{score}</span>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all relative py-1", active ? "text-green-700" : "text-gray-400 hover:text-gray-600")}>
      {active && (
        <motion.div layoutId="nav-pill" className="absolute -top-1 w-1 h-1 bg-green-700 rounded-full" />
      )}
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest hidden md:block">{label}</span>
    </button>
  );
}
