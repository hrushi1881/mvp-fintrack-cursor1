import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-3 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10 w-full"
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="p-2 bg-white/10 rounded-lg">
            <Globe size={18} className="text-gray-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-white text-sm">{t('language_setting')}</p>
            <p className="text-xs text-gray-400">{t('language_description')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-white">{currentLanguage.name}</span>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-xl z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                language.code === i18n.language ? 'bg-primary-500/20' : ''
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className={`font-medium ${
                language.code === i18n.language ? 'text-primary-400' : 'text-white'
              }`}>
                {language.name}
              </span>
              {language.code === i18n.language && (
                <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};