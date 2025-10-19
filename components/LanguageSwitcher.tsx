import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
      <button
        onClick={() => changeLanguage('tr')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'tr'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Türkçe"
      >
        🇹🇷 TR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          i18n.language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
