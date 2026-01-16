
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { AetherBus } from '../services/aetherBus';
import { SendIcon, AgentIcon, SpinnerIcon } from './icons';

export const Chatbot: React.FC = () => {
    const { t } = useLocalization();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const chat = useMemo(() => {
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                setError("API_KEY is not configured.");
                return null;
            }
            const ai = new GoogleGenAI({ apiKey });
            return ai.chats.create({
                model: 'gemini-3-pro-preview',
            });
        } catch (e) {
            console.error(e);
            setError(t('chatbotError'));
            return null;
        }
    }, [t]);
    
    useEffect(() => {
        if (!messages.length) {
             setMessages([{ role: 'model', content: t('chatbotWelcome') }]);
        }
    }, [t, messages.length]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        AetherBus.getInstance().publish('WISDOM_FETCH_START', {});

        try {
            const response = await chat.sendMessage({ message: userMessage.content });
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
            console.error(e);
            setError(t('chatbotError'));
        } finally {
            setIsLoading(false);
            AetherBus.getInstance().publish('WISDOM_FETCH_END', {});
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 text-sm">
            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                           <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                             <AgentIcon className="w-5 h-5 text-cyan-400" />
                           </div>
                        )}
                        <div className={`max-w-xs md:max-w-md lg:max-w-sm xl:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                             <SpinnerIcon className="w-5 h-5 text-cyan-400 animate-spin" />
                           </div>
                        <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-gray-700 text-gray-400">
                           <p>{t('chatbotThinking')}</p>
                        </div>
                    </div>
                )}
                 {error && (
                    <div className="p-2 text-center text-red-400 bg-red-900/50 rounded-md">
                        {error}
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-1">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chatbotPlaceholder')}
                        className="flex-grow bg-transparent p-2 focus:outline-none resize-none text-gray-200 max-h-32"
                        rows={1}
                        disabled={isLoading || !chat}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !chat}
                        className="p-2 rounded-full text-gray-400 hover:bg-cyan-600 hover:text-white disabled:hover:bg-transparent disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                        title={t('chatbotSend')}
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
