import React from 'react';
import { Sun, CloudRain, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  temp: number;
  humidity: number;
  rain: number;
  city: string;
}

interface WeatherWidgetProps {
  data: WeatherData | null;
  labels: any;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, labels }) => {
  if (!data) return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 animate-pulse h-28 flex items-center justify-center">
      <p className="text-green-800/30 font-black uppercase tracking-widest text-[10px]">Loading weather...</p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
      
      <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
        <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg shadow-yellow-100">
          <Sun className="text-white" size={28} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.15em]">{data.city}</p>
          </div>
          <p className="text-3xl font-black text-gray-900 tracking-tight">{data.temp}°C</p>
        </div>
      </div>
      
      <div className="flex gap-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="bg-blue-50 p-2 rounded-xl mb-2">
            <Droplets className="text-blue-600" size={18} />
          </div>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">{labels.humidity}</p>
          <p className="text-sm font-black text-gray-900">{data.humidity}%</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-indigo-50 p-2 rounded-xl mb-2">
            <CloudRain className="text-indigo-600" size={18} />
          </div>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">{labels.rain}</p>
          <p className="text-sm font-black text-gray-900">{data.rain}mm</p>
        </div>
      </div>
    </div>
  );
};
