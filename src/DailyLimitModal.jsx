import { X, Lock } from 'lucide-react';
import { getTranslation } from './translations.js';

export default function DailyLimitModal({ isOpen, onClose, onUpgrade, onClaimFree, selectedLanguage }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Lock size={32} className="text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
          {getTranslation('Daily Claim Limit Reached', selectedLanguage)}
        </h2>

        {/* Body Text */}
        <p className="text-gray-600 text-sm text-center mb-6">
          {getTranslation("You've reached your daily limit for paid requests. This limit helps maintain quality and fair access for all creators.", selectedLanguage)}
        </p>

        {/* Primary CTA - Upgrade */}
        <button
          onClick={onUpgrade}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors"
        >
          {getTranslation('Upgrade', selectedLanguage)}
        </button>

        {/* Secondary CTA - Claim Free Request */}
        <button
          onClick={onClaimFree}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
        >
          {getTranslation('Claim a Free Request', selectedLanguage)}
        </button>
      </div>
    </div>
  );
}
