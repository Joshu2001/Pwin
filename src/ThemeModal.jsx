import React, { useState } from 'react';
import { Palette, X, Check, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';
import { getTranslation } from './translations.js';

const ThemeModal = ({ onClose }) => {
  const { accentColor, setAccentColor, themeId, setThemeId, closeThemeModal, showThemeModal } = useTheme();
  const [localColor, setLocalColor] = useState(accentColor || '#9333ea');
  const selectedLanguage = (typeof window !== 'undefined') ? window.localStorage.getItem('regaarder_language') || 'English' : 'English';
  
  if (!showThemeModal) return null;

  const themes = [
    { id: 'Light', title: getTranslation('Light', selectedLanguage), description: getTranslation('Bright and clean', selectedLanguage), Icon: Sun },
    { id: 'Dark', title: getTranslation('Dark', selectedLanguage), description: getTranslation('Low-light friendly', selectedLanguage), Icon: Moon },
    { id: 'System', title: getTranslation('System', selectedLanguage), description: getTranslation('Follow device settings', selectedLanguage), Icon: Monitor },
  ];

  const presetColors = [
    '#ca8a04',
    '#a95bf3',
    '#dc2626',
    '#db2777',
    '#9333ea',
    '#c084fc',
    '#0891b2',
    '#059669',
    '#65a30d',
    '#84cc16',
    '#eab308',
    '#f59e0b'
  ];

  const apply = () => {
    setAccentColor(localColor);
    closeThemeModal();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => closeThemeModal()}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-2">
          <Palette size={24} className="mr-2" style={{ color: 'var(--color-gold)' }} />
          <h3 className="text-xl font-bold text-gray-900">{getTranslation('Choose Your Theme', selectedLanguage)}</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">{getTranslation('Select how Regaarder looks on your device', selectedLanguage)}</p>

        <div className="space-y-3 mb-6">
          {themes.map((t) => (
            <button key={t.id} onClick={() => setThemeId(t.id)} className={`w-full p-3 rounded-xl border ${themeId===t.id? 'border-gray-300':'border-transparent'} text-left flex items-center justify-between`} type="button">
              <div className="flex items-center">
                <t.Icon size={20} className="mr-3" />
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.description}</div>
                </div>
              </div>
              {themeId===t.id && <Check size={18} />}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{getTranslation('Accent Color', selectedLanguage)}</div>
              <div className="text-sm text-gray-600">{getTranslation("Customize the app's highlight color", selectedLanguage)}</div>
            </div>
            <button onClick={() => {}} className="w-12 h-12 rounded-lg hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: localColor }} type="button"></button>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-6 gap-3">
            {presetColors.map((c) => (
              <button key={c} onClick={() => setLocalColor(c)} className={`w-full aspect-square rounded-xl ${localColor===c ? 'ring-2 ring-gray-900 ring-offset-2' : 'hover:scale-105'}`} style={{ backgroundColor: c }} type="button"></button>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <input name="localColor" value={localColor} onChange={(e)=>setLocalColor(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
          <button onClick={apply} style={{ backgroundColor: localColor }} className="px-4 py-2 text-black rounded-lg" type="button">{getTranslation('Apply', selectedLanguage)}</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;
