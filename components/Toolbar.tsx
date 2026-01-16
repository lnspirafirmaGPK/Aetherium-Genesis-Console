
import React, { useState, useRef, useEffect } from 'react';
import { AgentIcon, SettingsIcon, LanguageIcon, GitHubIcon } from './icons';
import { useLocalization } from '../contexts/LocalizationContext';

interface ToolbarProps {
    onAnalyze: () => void;
    onUpload: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAnalyze, onUpload }) => {
    const { t, setLanguage, language } = useLocalization();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={onAnalyze}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-cyan-600 rounded-md transition-colors duration-200"
                title={t('scanForRefactorsTooltip')}
            >
                <AgentIcon className="w-5 h-5 mr-2" />
                {t('scanForRefactors')}
            </button>
             <button
                onClick={onUpload}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200"
                title={t('uploadToGitHubTooltip')}
            >
                <GitHubIcon className="w-5 h-5 mr-2" />
                {t('uploadToGitHub')}
            </button>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200"
                    title={t('settings')}
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                        <div className="p-2 border-b border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-400 flex items-center">
                                <LanguageIcon className="w-4 h-4 mr-2" />
                                {t('language')}
                            </h3>
                        </div>
                        <ul className="py-1">
                            <li>
                                <button
                                    onClick={() => { setLanguage('en'); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'bg-cyan-600/30 text-cyan-300' : 'text-gray-300 hover:bg-gray-700'}`}
                                >
                                    English
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => { setLanguage('th'); setIsDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm ${language === 'th' ? 'bg-cyan-600/30 text-cyan-300' : 'text-gray-300 hover:bg-gray-700'}`}
                                >
                                    ไทย (Thai)
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
