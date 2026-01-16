
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
                            <FileIcon className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400" />
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
