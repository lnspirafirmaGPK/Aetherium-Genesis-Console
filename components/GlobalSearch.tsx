
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CodeFile, SearchableModule, AppTab } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { SearchIcon } from './icons';

interface GlobalSearchProps {
    modules: SearchableModule[];
    files: CodeFile[];
    onNavigateToModule: (tab: AppTab | 'aether-canvas') => void;
    onSelectFile: (file: CodeFile) => void;
}

const MOCK_DOCS = [
    { name: "Getting Started with Firma IDE", description: "Learn the basics of code analysis and visualization.", icon: "📖" },
    { name: "Understanding the Aether Bus", description: "The core event-driven architecture of the console.", icon: "📖" },
    { name: "Economic Fabric Principles", description: "Explore the tier-based economic model.", icon: "📖" },
];

type SearchResult = 
    | { type: 'module', item: SearchableModule }
    | { type: 'file', item: CodeFile }
    | { type: 'doc', item: { name: string; description: string; icon: string; } };

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ modules, files, onNavigateToModule, onSelectFile }) => {
    const { t } = useLocalization();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);

    const allSearchableItems = useMemo(() => [
        ...modules.map(m => ({ type: 'module' as const, item: m, name: m.name.toLowerCase() })),
        ...files.map(f => ({ type: 'file' as const, item: f, name: f.path.toLowerCase() })),
        ...MOCK_DOCS.map(d => ({ type: 'doc' as const, item: d, name: d.name.toLowerCase() })),
    ], [modules, files]);

    useEffect(() => {
        if (query.length > 1) {
            const lowerCaseQuery = query.toLowerCase();
            const filtered = allSearchableItems
                .filter(item => item.name.includes(lowerCaseQuery))
                .slice(0, 10); // Limit results
            setResults(filtered);
        } else {
            setResults([]);
        }
        setActiveIndex(-1);
    }, [query, allSearchableItems]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    handleSelect(results[activeIndex]);
                }
                break;
            case 'Escape':
                setIsFocused(false);
                break;
        }
    };

    const handleSelect = (result: SearchResult) => {
        setQuery('');
        setResults([]);
        setIsFocused(false);
        
        switch (result.type) {
            case 'module':
                onNavigateToModule(result.item.tab);
                break;
            case 'file':
                onSelectFile(result.item);
                break;
            case 'doc':
                // In a real app, this would navigate to a documentation page
                alert(`Navigating to documentation for: "${result.item.name}"`);
                break;
        }
    };
    
    const renderResult = (result: SearchResult, index: number) => {
        let icon, title, description, category;
        switch(result.type) {
            case 'module':
                icon = result.item.icon;
                title = result.item.name;
                description = result.item.description;
                category = "Module";
                break;
            case 'file':
                icon = '📄';
                title = result.item.path.split('/').pop() || result.item.path;
                description = result.item.path;
                category = "File";
                break;
            case 'doc':
                icon = result.item.icon;
                title = result.item.name;
                description = result.item.description;
                category = "Docs";
                break;
        }

        return (
            <li 
                key={`${result.type}-${title}-${index}`}
                onClick={() => handleSelect(result)}
                className={`p-3 flex items-center gap-3 cursor-pointer rounded-lg ${activeIndex === index ? 'bg-cyan-600/30' : 'hover:bg-gray-700/50'}`}
            >
                <div className="text-2xl">{icon}</div>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-gray-100 truncate">{title}</p>
                    <p className="text-xs text-gray-400 truncate">{description}</p>
                </div>
                <span className="text-xs font-semibold text-cyan-400 bg-gray-700 px-2 py-1 rounded-full">{category}</span>
            </li>
        )
    }

    return (
        <div className="relative w-full" ref={searchRef} onKeyDown={handleKeyDown}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search modules, files, and docs..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
            </div>

            {isFocused && query.length > 1 && (
                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {results.length > 0 ? (
                        <ul className="p-2 max-h-96 overflow-y-auto">
                            {results.map(renderResult)}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-gray-500">No results found.</p>
                    )}
                </div>
            )}
        </div>
    );
};
