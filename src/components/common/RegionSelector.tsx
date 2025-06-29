import React, { useState } from 'react';
import { Globe, ChevronDown, Search, MapPin } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

export const RegionSelector: React.FC = () => {
  const { region, setRegion, supportedRegions } = useInternationalization();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = supportedRegions.filter(reg =>
    reg.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegionSelect = (selectedRegion: any) => {
    setRegion(selectedRegion);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCountryFlag = (countryCode: string) => {
    const flagMap: Record<string, string> = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'GB': '🇬🇧', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪',
      'NO': '🇳🇴', 'CH': '🇨🇭', 'PL': '🇵🇱', 'RU': '🇷🇺', 'JP': '🇯🇵',
      'CN': '🇨🇳', 'IN': '🇮🇳', 'AU': '🇦🇺', 'SG': '🇸🇬', 'KR': '🇰🇷',
      'TH': '🇹🇭', 'MY': '🇲🇾', 'ID': '🇮🇩', 'PH': '🇵🇭', 'VN': '🇻🇳',
      'AE': '🇦🇪', 'SA': '🇸🇦', 'IL': '🇮🇱', 'TR': '🇹🇷', 'ZA': '🇿🇦',
      'EG': '🇪🇬', 'NG': '🇳🇬', 'BR': '🇧🇷', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴'
    };
    return flagMap[countryCode] || '🌍';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-3 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10 w-full"
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="p-2 bg-white/10 rounded-lg">
            <MapPin size={18} className="text-gray-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-white text-sm">Region</p>
            <p className="text-xs text-gray-400">Date format & timezone</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCountryFlag(region.countryCode)}</span>
          <div className="text-right">
            <span className="text-sm font-medium text-white">{region.country}</span>
            <p className="text-xs text-gray-400">{region.timezone.split('/')[1]?.replace('_', ' ')}</p>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Region List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredRegions.map((reg) => (
              <button
                key={reg.countryCode}
                onClick={() => handleRegionSelect(reg)}
                className={`w-full flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors ${
                  reg.countryCode === region.countryCode ? 'bg-primary-500/20 border-l-2 border-primary-500' : ''
                }`}
              >
                <span className="text-lg">{getCountryFlag(reg.countryCode)}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      reg.countryCode === region.countryCode ? 'text-primary-400' : 'text-white'
                    }`}>
                      {reg.country}
                    </span>
                    <span className="text-xs text-gray-400">{reg.countryCode}</span>
                  </div>
                  <p className="text-xs text-gray-400">{reg.dateFormat}</p>
                  <p className="text-xs text-gray-500">{reg.timezone}</p>
                </div>
                {reg.countryCode === region.countryCode && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {filteredRegions.length === 0 && (
            <div className="p-6 text-center">
              <Globe size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No regions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};