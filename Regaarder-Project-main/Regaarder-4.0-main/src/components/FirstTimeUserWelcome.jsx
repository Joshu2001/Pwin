import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Globe, ChevronDown, X, UserCircle, Video } from 'lucide-react';
import { getTranslation } from '../translations.js';

// Language Selector Button (Top Header)
export const LanguageSelector = ({ 
  selectedLanguage, 
  onLanguageSelect, 
  className = '',
  ...props 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const languages = [
    { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
    { name: 'Chinese Traditional', nativeName: '繁體中文', flag: '🇹🇼' },
    { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
    { name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  ];

  const handleLanguageChange = (lang) => {
    try {
      localStorage.setItem('regaarder_language', lang);
      if (onLanguageSelect) onLanguageSelect(lang);
    } catch (e) {
      console.warn('Failed to set language', e);
    }
    setIsDropdownOpen(false);
  };

  const currentLang = languages.find(l => l.name === selectedLanguage) || languages[0];

  return (
    <div className={`relative ${className}`} {...props}>
      <button
        className="w-11 h-11 flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors duration-200 active:bg-gray-200 active:scale-95"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title="Change language"
        aria-label="Change language"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg">{currentLang.flag}</span>
          <ChevronDown size={14} className="text-gray-700" strokeWidth={3} />
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() => handleLanguageChange(lang.name)}
              className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left ${
                selectedLanguage === lang.name ? 'bg-blue-50 border-l-3 border-blue-500' : ''
              }`}
            >
              <span className="text-lg mr-3">{lang.flag}</span>
              <span className={`font-${selectedLanguage === lang.name ? 'semibold' : 'normal'} text-gray-800`}>
                {lang.nativeName || lang.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Role Selection Modal
export const RoleSelectionModal = ({ 
  isOpen, 
  onSelectRole, 
  selectedLanguage = 'English',
  onLanguageSelect = null
}) => {
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const languages = [
    { name: 'English', nativeName: 'English', code: 'US' },
    { name: 'Español', nativeName: 'Español', code: 'ES' },
    { name: 'Chinese Traditional', nativeName: '繁體中文', code: 'TW' },
    { name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'VN' },
    { name: 'Filipino', nativeName: 'Filipino', code: 'PH' },
    { name: 'Estonian', nativeName: 'Eesti', code: 'EE' },
  ];

  const handleLanguageChange = (lang) => {
    localStorage.setItem('regaarder_language', lang);
    if (onLanguageSelect) onLanguageSelect(lang);
    setShowLanguagePicker(false);
  };

  const currentLang = languages.find(l => l.name === selectedLanguage) || languages[0];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectRole(null);
          setShowLanguagePicker(false);
        }
      }}
    >
      {/* Language Picker Modal */}
      {showLanguagePicker && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowLanguagePicker(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{getTranslation('Choose Your Language', selectedLanguage)}</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.name}
                  onClick={() => handleLanguageChange(lang.name)}
                  className={`w-full px-6 py-4 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedLanguage === lang.name
                      ? 'bg-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600">{lang.code}</div>
                      <div className={`text-base ${selectedLanguage === lang.name ? 'font-semibold text-purple-700' : 'text-gray-800'}`}>
                        {lang.nativeName}
                      </div>
                    </div>
                    {selectedLanguage === lang.name && (
                      <div className="text-purple-600 text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Role Selection Modal */}
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in scale-in duration-300 relative">
        {/* Language Button in corner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLanguagePicker(true);
          }}
          className="absolute top-4 right-4 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Change language"
        >
          <span className="text-sm font-medium text-gray-700">{currentLang.code}</span>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center mt-4">
          {getTranslation('Welcome to Regaarder', selectedLanguage)}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {getTranslation('Who are you?', selectedLanguage)}
        </p>

        <div className="flex flex-col gap-4">
          {/* User Option */}
          <button
            onClick={() => onSelectRole('user')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                {getTranslation('Continue as a User', selectedLanguage)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getTranslation('Watch, request, and discover content', selectedLanguage)}
              </div>
            </div>
          </button>

          {/* Creator Option */}
          <button
            onClick={() => onSelectRole('creator')}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-600" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 group-hover:text-purple-700">
                {getTranslation('Continue as a Creator', selectedLanguage)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getTranslation('Get paid creating what people ask for', selectedLanguage)}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Welcome Modal for Users
export const UserWelcomeModal = ({ 
  isOpen, 
  onClose, 
  selectedLanguage = 'English' 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999]"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl animate-in fade-in scale-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label="Close"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center">
          {/* Icon */}
          <div className="text-5xl mb-4 animate-bounce">🎉</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {getTranslation('Welcome to Regaarder', selectedLanguage)}
          </h2>

          {/* Content */}
          <div className="space-y-4 mb-8 text-left">
            <p className="text-gray-700 leading-relaxed">
              {getTranslation("We're thrilled to have you.", selectedLanguage)}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              {getTranslation("On Regaarder, you don't just wait for creators to upload — you request the videos you want to watch and connect directly with your favorite creators.", selectedLanguage)}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              {getTranslation('Discover content made for you. Support creators like never before.', selectedLanguage)}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
          >
            {getTranslation('Got It', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
};

// Welcome Modal for Creators
export const CreatorWelcomeModal = ({ 
  isOpen, 
  onClose, 
  selectedLanguage = 'English' 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999]"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl animate-in fade-in scale-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label="Close"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center">
          {/* Icon */}
          <div className="text-5xl mb-4 animate-bounce">🎬</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {getTranslation('Welcome to Regaarder', selectedLanguage)}
          </h2>

          {/* Content */}
          <div className="space-y-4 mb-8 text-left">
            <p className="text-gray-700 leading-relaxed">
              {getTranslation('Hundreds of content requests are already waiting.', selectedLanguage)}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              {getTranslation('Apply to become a creator, connect with fans eager for your work, and start earning immediately.', selectedLanguage)}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
          >
            {getTranslation('Got It', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
};
