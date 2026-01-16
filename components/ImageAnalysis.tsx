
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useLocalization } from '../contexts/LocalizationContext';
// FIX: Import `CloseIcon` to resolve reference error.
import { ImageIcon, SpinnerIcon, DocumentScannerIcon, CloseIcon } from './icons';

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve({ mimeType: file.type, data: base64Data });
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

export const ImageAnalysis: React.FC = () => {
    const { t } = useLocalization();
    const [image, setImage] = useState<{ url: string; mimeType: string; data: string } | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setError(null);
            setAnalysisResult('');
            const { mimeType, data } = await fileToBase64(file);
            setImage({ url: URL.createObjectURL(file), mimeType, data });
        } else {
            setError('Please upload a valid image file.');
        }
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!image) {
            setError(t('noImageUploaded'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = {
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                },
            };
            const textPart = { text: prompt || "Describe this image in detail." };
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [imagePart, textPart] },
            });
            
            setAnalysisResult(response.text);

        } catch (e: any) {
            console.error(e);
            setError(e.message || t('imageGenerationError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full text-sm bg-gray-800 p-4 space-y-4">
            <input
                type="file"
                id="imageUpload"
                className="hidden"
                accept="image/*"
                onChange={onFileSelect}
            />
            
            <div className="flex-grow flex flex-col space-y-4">
                {!image ? (
                    <label htmlFor="imageUpload" className="w-full h-full cursor-pointer">
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={`flex flex-col items-center justify-center h-full border-2 border-dashed rounded-md transition-colors ${isDragging ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 hover:border-cyan-500'}`}
                        >
                            <ImageIcon className="w-16 h-16 text-gray-500 mb-2" />
                            <p className="text-gray-400 font-semibold">{t('dropOrClick')}</p>
                        </div>
                    </label>
                ) : (
                    <div className="relative w-full h-48 bg-gray-900 rounded-md flex items-center justify-center">
                        <img src={image.url} alt="Upload preview" className="max-h-full max-w-full object-contain rounded-md" />
                         <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/80">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('analysisPlaceholder')}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-gray-200"
                    rows={3}
                    disabled={isLoading || !image}
                />

                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !image}
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                            {t('analyzing')}
                        </>
                    ) : (
                        <>
                            <DocumentScannerIcon className="w-5 h-5 mr-2" />
                            {t('analyze')}
                        </>
                    )}
                </button>
            </div>
            
            {(analysisResult || error) && (
                <div className="flex-shrink-0 mt-4 p-3 bg-gray-900 rounded-md border border-gray-700 max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-gray-300 mb-2">{t('analysisResultTitle')}</h4>
                    {error && (
                        <div className="p-2 text-red-400 bg-red-900/30 rounded">
                            <p><strong>{t('error')}:</strong> {error}</p>
                        </div>
                    )}
                    {analysisResult && (
                        <pre className="text-gray-300 whitespace-pre-wrap font-sans">{analysisResult}</pre>
                    )}
                </div>
            )}
        </div>
    );
};