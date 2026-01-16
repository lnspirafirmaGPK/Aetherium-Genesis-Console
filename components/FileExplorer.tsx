import React from 'react';
import type { CodeFile, AnalysisResult } from '../types';
import { FileIcon, DeadCodeIcon, CircularDepIcon } from './icons';
import { useLocalization } from '../contexts/LocalizationContext';

interface FileExplorerProps {
    files: CodeFile[];
    selectedFile: CodeFile | null;
    onSelectFile: (file: CodeFile) => void;
    analysisResult: AnalysisResult | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelectFile, analysisResult }) => {
    const { t } = useLocalization();
    
    const isCircularDepFile = (path: string): boolean => {
        return analysisResult?.circularDependencyFiles.flat().includes(path) ?? false;
    }

    const getHeatColor = (path: string): string => {
        const score = analysisResult?.heatScores.get(path);
        if (score === undefined) return 'bg-gray-600'; // Default if no score
        if (score > 0.7) return 'bg-red-500'; // Hot
        if (score > 0.3) return 'bg-yellow-500'; // Warm
        return 'bg-green-500'; // Cool
    };

    return (
        <div className="p-2 flex-grow overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2 p-2 text-cyan-400 border-b border-gray-700">{t('fileExplorerTitle')}</h2>
            <ul>
                {files.map(file => (
                    <li key={file.path}>
                        <button
                            onClick={() => onSelectFile(file)}
                            className={`w-full text-left p-2 my-1 rounded-md flex items-center transition-colors duration-200 ${
                                selectedFile?.path === file.path
                                    ? 'bg-cyan-600/30 text-cyan-300'
                                    : 'hover:bg-gray-700'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${getHeatColor(file.path)}`} title={`Modularity Heat: ${Math.round((analysisResult?.heatScores.get(file.path) ?? 0) * 100)}%`}></div>
                            <FileIcon className="w-5 h-5 mr-2 flex-shrink-0 text-gray-400" />
                            <span className="flex-grow truncate">{file.path}</span>
                            {analysisResult?.deadCodeFiles.includes(file.path) && (
                                <DeadCodeIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" title="File contains only dead code" />
                            )}
                             {isCircularDepFile(file.path) && (
                                <CircularDepIcon className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" title="Part of a circular dependency" />
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
