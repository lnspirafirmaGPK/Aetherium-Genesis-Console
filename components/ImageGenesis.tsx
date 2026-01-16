import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useLocalization } from '../contexts/LocalizationContext';
import type { AspectRatio } from '../types';
import { ImageIcon, SpinnerIcon } from './icons';

// Make window.aistudio available
// FIX: Define a global `AIStudio` interface to resolve conflicting type declarations for `window.aistudio`.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];

export const ImageGenesis: React.FC = () => {
    const { t } = useLocalization();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [checkingApiKey, setCheckingApiKey] = useState(true);

    const checkApiKey = useCallback(async () => {
        setCheckingApiKey(true);
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } else {
            console.warn("window.aistudio not found. Assuming API key is available via environment.");
            setApiKeySelected(true);
        }
        setCheckingApiKey(false);
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError(t('promptRequiredError'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio },
                },
            });
            
            let foundImage = false;
            for (const part of response.candidates?.[0]?.content?.parts ?? []) {
                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    setImageUrl(`data:${part.inlineData.mimeType};base64,${base64Data}`);
                    foundImage = true;
                    break;
                }
            }

            if (!foundImage) {
                throw new Error(t('noImageGeneratedError'));
            }

        } catch (e: any) {
            console.error(e);
            let errorMessage = e.message || t('imageGenerationError');
            if (e.message?.includes('Requested entity was not found')) {
                errorMessage = t('apiKeyInvalidError');
                setApiKeySelected(false);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingApiKey) {
        return (
            <div className="flex items-center justify-center h-full">
                <SpinnerIcon className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (!apiKeySelected) {
        return (
            <div className="p-6 flex flex-col items-center justify-center text-center h-full bg-gray-900/50">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{t('apiKeyRequiredTitle')}</h3>
                <p className="text-gray-400 mb-4 max-w-sm">{t('apiKeyRequiredDescription')}</p>
                <button
                    onClick={handleSelectKey}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-colors"
                >
                    {t('selectApiKey')}
                </button>
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 text-sm text-gray-500 hover:text-cyan-400 underline"
                >
                    {t('billingInfo')}
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full text-sm bg-gray-800 p-4 space-y-4">
            <div className="flex-shrink-0">
                <label htmlFor="prompt" className="block font-semibold text-gray-300 mb-2">{t('prompt')}</label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('promptPlaceholder')}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-gray-200"
                    rows={4}
                    disabled={isLoading}
                />
            </div>
            <div className="flex-shrink-0">
                <label htmlFor="aspect-ratio" className="block font-semibold text-gray-300 mb-2">{t('aspectRatio')}</label>
                <select
                    id="aspect-ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                    disabled={isLoading}
                >
                    {ASPECT_RATIOS.map(ratio => (
                        <option key={ratio} value={ratio}>{ratio}</option>
                    ))}
                </select>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-wait"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                            {t('generating')}
                        </>
                    ) : (
                       t('generateImage')
                    )}
                </button>
            </div>
            <div className="flex-grow bg-gray-900 rounded-md flex items-center justify-center overflow-hidden relative">
                {isLoading && (
                    <div className="text-gray-400 flex flex-col items-center">
                         <SpinnerIcon className="w-8 h-8 animate-spin text-cyan-400" />
                         <p className="mt-2">{t('generating')}</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 text-red-400 text-center">
                        <p><strong>{t('error')}</strong></p>
                        <p>{error}</p>
                    </div>
                )}
                {imageUrl && !isLoading && (
                    <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain" />
                )}
                {!isLoading && !error && !imageUrl && (
                    <div className="text-gray-600 flex flex-col items-center text-center p-4">
                        <ImageIcon className="w-16 h-16" />
                        <p className="mt-2">{t('imagePreviewArea')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};