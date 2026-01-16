
import React, { useState, useRef, useEffect } from 'react';
import type { CodeFile, AnalysisResult } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { ExpandIcon, CloseIcon } from './icons';

interface CodeEditorProps {
    file: CodeFile | null;
    analysisResult: AnalysisResult | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, analysisResult }) => {
    const { t } = useLocalization();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isModalOpen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setIsModalOpen(false);
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            setTimeout(() => closeButtonRef.current?.focus(), 0);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isModalOpen]);

    const getHighlightedContent = () => {
        if (!file || !analysisResult) return file?.content;

        const deadSymbolsInFile = analysisResult.deadCodeSymbols
            .filter(ds => ds.path === file.path)
            .map(ds => ds.symbolName);
        
        let content = file.content;

        deadSymbolsInFile.forEach(symbolName => {
            const regex = new RegExp(`(export\\s+(?:const|let|var|function|class)\\s+)(${symbolName})`, 'g');
            content = content.replace(regex, `$1<span class="highlight-span bg-yellow-800/50 text-yellow-300 rounded px-1" title="Dead Code: This symbol is exported but never used.">${symbolName}</span>`);
        });

        const circularDepFiles = analysisResult.circularDependencyFiles.flat();
        if (circularDepFiles.includes(file.path)) {
            analysisResult.dependencies.forEach(dep => {
                if (dep.from === file.path && circularDepFiles.includes(dep.to)) {
                     const importPath = dep.to.replace('src/', '').replace('.ts','');
                     const regex = new RegExp(`(import\\s+.*?from\\s+['"].*?${importPath}.*?['"])`, 'g');
                     content = content.replace(regex, `<span class="highlight-span bg-red-800/50 text-red-300 rounded px-1" title="Circular Dependency: This import is part of a cycle.">$1</span>`);
                }
            });
        }
        
        return content;
    };

    if (!file) {
        return (
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
                <p className="text-gray-500">{t('selectFilePrompt')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-900 flex flex-col overflow-hidden">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-mono text-gray-400">{file.path}</h3>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                    title="View full content"
                >
                    <ExpandIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                <pre><code dangerouslySetInnerHTML={{ __html: getHighlightedContent() || '' }} /></pre>
            </div>

            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] flex flex-col">
                        <div className="p-3 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h3 id="modal-title" className="font-mono text-gray-300">{file.path}</h3>
                            <button 
                                ref={closeButtonRef}
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                            <pre><code>{file.content}</code></pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};