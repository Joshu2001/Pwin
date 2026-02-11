import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Pencil, MoreHorizontal } from 'lucide-react';
import { getTranslation } from '../translations.js';

/**
 * SharedBottomBar - Centralized footer navigation component
 * Used across all pages to ensure consistent styling and behavior
 * Includes proper safe area handling for Android/iOS system navigation
 */
const SharedBottomBar = ({ selectedLanguage = 'English', activeTabOverride = null }) => {
    const navigate = useNavigate();
    // Map lowercase tab keys to capitalized names
    const tabKeyToName = {
        'home': 'Home',
        'requests': 'Requests',
        'ideas': 'Ideas',
        'more': 'More'
    };
    
    const [activeTab, setActiveTab] = useState(activeTabOverride || 'Home');

    // Sync with App.jsx's tab state via custom event
    useEffect(() => {
        const handleTabChange = (e) => {
            if (e.detail && e.detail.tab) {
                const capitalizedTab = tabKeyToName[e.detail.tab] || e.detail.tab;
                setActiveTab(capitalizedTab);
            }
        };
        
        // Listen for tab changes from App.jsx
        window.addEventListener('footerTabChanged', handleTabChange);
        
        // Also check current global state
        if (window.currentFooterTab) {
            const capitalizedTab = tabKeyToName[window.currentFooterTab] || window.currentFooterTab;
            setActiveTab(capitalizedTab);
        }
        
        return () => {
            window.removeEventListener('footerTabChanged', handleTabChange);
        };
    }, []);

    // Update activeTab if override prop changes
    useEffect(() => {
        if (activeTabOverride) {
            setActiveTab(activeTabOverride);
        }
    }, [activeTabOverride]);

    const tabs = [
        { name: 'Home', icon: Home },
        { name: 'Requests', icon: FileText },
        { name: 'Ideas', icon: Pencil },
        { name: 'More', icon: MoreHorizontal },
    ];

    const inactiveColor = 'rgb(107 114 128)';

    const switchTab = (tabName) => {
        const tabMap = {
            'Home': 'home',
            'Requests': 'requests',
            'Ideas': 'ideas',
            'More': 'more'
        };
        const tabKey = tabMap[tabName];
        if (tabKey) {
            navigate(`/${tabKey}`);
        }
        if (window.setFooterTab) {
            window.setFooterTab(tabKey);
        }
        setActiveTab(tabName);
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
            style={{
                paddingTop: '10px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                minHeight: '70px'
            }}
        >
            <div className="w-full flex justify-around items-center px-2">
                {tabs.map((tab) => {
                    const isSelected = tab.name === activeTab;
                    const Icon = tab.icon;

                    const activeColorStyle = isSelected
                        ? { color: 'var(--color-gold)' }
                        : { color: inactiveColor };

                    const textWeight = isSelected ? 'font-semibold' : 'font-normal';

                    return (
                        <div
                            key={tab.name}
                            className={`relative flex flex-col items-center justify-center flex-1 focus:outline-none`}
                        >
                            <button
                                className="flex flex-col items-center w-full py-1"
                                style={{ minHeight: '48px' }}
                                onClick={() => {
                                    switchTab(tab.name);
                                }}
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-full mb-0.5">
                                    <Icon
                                        size={24}
                                        strokeWidth={isSelected ? 2 : 1.5}
                                        style={activeColorStyle}
                                    />
                                </div>
                                <span className={`text-xs leading-tight ${textWeight}`} style={activeColorStyle}>
                                    {getTranslation(tab.name, selectedLanguage)}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SharedBottomBar;
