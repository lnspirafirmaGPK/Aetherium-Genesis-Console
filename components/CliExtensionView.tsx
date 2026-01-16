import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { CommandLineIcon, FileIcon, LinkIcon, SpinnerIcon } from './icons';

type ExtensionFile = 'manifest' | 'context' | 'command';
type ServerStatus = 'Stopped' | 'Starting' | 'Running' | 'Error';

const FILE_CONTENT: Record<ExtensionFile, { name: string, path: string, content: string, lang: string }> = {
    manifest: {
        name: 'gemini-extension.json',
        path: 'gemini-extension.json',
        lang: 'json',
        content: `{
  "name": "my-first-extension",
  "version": "1.0.0",
  "mcpServers": {
    "nodeServer": {
      "command": "node",
      "args": ["\${extensionPath}/dist/example.js"],
      "cwd": "\${extensionPath}"
    }
  }
}`
    },
    context: {
        name: 'GEMINI.md',
        path: 'GEMINI.md',
        lang: 'markdown',
        content: `# Instructions
You are an expert developer. When using the fetch_posts tool, briefly summarize the top 3 posts.`
    },
    command: {
        name: 'grep-code.toml',
        path: 'commands/fs/grep-code.toml',
        lang: 'toml',
        content: `prompt = """
Please summarize the findings for the pattern \`{{args}}\`.

Search Results:
!{grep -r {{args}} .}
"""`
    }
};

const SIMULATED_GREP_OUTPUT = `
src/api/client.ts:1: import { getAuthToken } from '../services/auth.ts';
src/api/client.ts:3: export class ApiClient {
src/services/auth.ts:1: import { ApiClient } from '../api/client.ts'; // Oh no! Circular dependency
src/services/auth.ts:7: const client = new ApiClient(); 
src/components/UserProfile.tsx:1: import { ApiClient } from '../api/client.ts';
src/components/UserProfile.tsx:4: const client = new ApiClient();
src/components/Settings.tsx:1: import { ApiClient } from '../api/client.ts';
src/components/Settings.tsx:4: const client = new ApiClient();
`;

export const CliExtensionView: React.FC = () => {
    const { t } = useLocalization();
    const [selectedFile, setSelectedFile] = useState<ExtensionFile>('manifest');
    const [isLinked, setIsLinked] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('Stopped');
    const [command, setCommand] = useState('');
    const [terminalHistory, setTerminalHistory] = useState<string[]>(['Welcome to the simulated CLI environment.']);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    const handleLinkToggle = () => {
        if (isLinked) {
            setIsLinked(false);
            setServerStatus('Stopped');
            setTerminalHistory(prev => [...prev, 'Extension unlinked. MCP Server stopped.']);
        } else {
            setServerStatus('Starting');
            setTerminalHistory(prev => [...prev, 'Linking extension...']);
            setTimeout(() => {
                setIsLinked(true);
                setServerStatus('Running');
                setTerminalHistory(prev => [...prev, 'Extension linked successfully. MCP Server is now running.']);
            }, 1500);
        }
    };

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newHistory = [...terminalHistory, `> ${command}`];
        const [cmd, ...args] = command.trim().split(' ');
        
        if (!isLinked) {
            newHistory.push('Error: Extension is not linked. Use the "Link Extension" button to enable commands.');
        } else if (cmd === '/fs:grep-code') {
            const pattern = args.join(' ');
            if (!pattern) {
                newHistory.push('Usage: /fs:grep-code "pattern"');
            } else {
                newHistory.push(`Executing: !{grep -r ${pattern} .}`);
                newHistory.push(SIMULATED_GREP_OUTPUT.replace(/ApiClient/g, pattern.replace(/"/g, '')));
                newHistory.push('...');
                setTimeout(() => {
                     setTerminalHistory(prev => [...prev, `AI Summary: The pattern "${pattern.replace(/"/g, '')}" appears frequently in API and component files, often related to client instantiation.`]);
                }, 1000);
            }
        } else if (cmd === 'clear') {
            setTerminalHistory([]);
        } 
        else {
            newHistory.push(`Command not found: ${cmd}. Available commands: /fs:grep-code, clear`);
        }
        
        setTerminalHistory(newHistory);
        setCommand('');
    };

    const renderServerStatus = () => {
        switch(serverStatus) {
            case 'Running': return <span className="text-green-400 font-bold">{serverStatus}</span>;
            case 'Starting': return <span className="text-yellow-400 font-bold">{serverStatus}...</span>;
            case 'Error': return <span className="text-red-400 font-bold">{serverStatus}</span>;
            default: return <span className="text-gray-500 font-bold">{serverStatus}</span>;
        }
    };

    return (
        <div className="flex h-full bg-gray-900 text-gray-300 text-sm">
            {/* Left Panel: File Tree */}
            <div className="w-1/4 bg-gray-800 border-r border-gray-700 p-2">
                <h3 className="text-md font-semibold text-cyan-400 mb-2 p-1">{t('cliExtensionFiles')}</h3>
                <ul>
                    {Object.entries(FILE_CONTENT).map(([key, file]) => (
                        <li key={key}>
                            <button
                                onClick={() => setSelectedFile(key as ExtensionFile)}
                                className={`w-full text-left p-2 my-1 rounded-md flex items-center transition-colors duration-200 ${selectedFile === key ? 'bg-cyan-600/30 text-cyan-300' : 'hover:bg-gray-700'}`}
                            >
                                <FileIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{file.path}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Middle Panel: File Content & Terminal */}
            <div className="w-1/2 flex flex-col">
                <div className="flex-1 p-4 bg-gray-900 overflow-auto">
                     <pre><code className={`language-${FILE_CONTENT[selectedFile].lang}`}>{FILE_CONTENT[selectedFile].content}</code></pre>
                </div>
                <div className="h-1/2 bg-black flex flex-col border-t-2 border-cyan-500/50">
                    <div className="flex-grow p-2 overflow-y-auto font-mono text-xs">
                        {terminalHistory.map((line, i) => <div key={i} className={line.startsWith('>') ? 'text-cyan-300' : ''}>{line}</div>)}
                        <div ref={terminalEndRef} />
                    </div>
                    <form onSubmit={handleCommandSubmit} className="flex items-center p-1 border-t border-gray-700">
                        <span className="px-2 text-cyan-300">{'>'}</span>
                        <input 
                            type="text"
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            disabled={!isLinked}
                            placeholder={isLinked ? 'Type a command, e.g. /fs:grep-code "ApiClient"' : t('cliLinkFirst')}
                            className="w-full bg-transparent focus:outline-none font-mono"
                        />
                    </form>
                </div>
            </div>

            {/* Right Panel: Controls */}
            <div className="w-1/4 bg-gray-800 border-l border-gray-700 p-4 space-y-4">
                <h3 className="text-md font-semibold text-cyan-400">{t('cliExtensionControl')}</h3>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                    <h4 className="font-bold text-gray-200">{FILE_CONTENT.manifest.name}</h4>
                    <p className="text-xs text-gray-400">Version: 1.0.0</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                    <h4 className="font-semibold text-gray-300 mb-2">{t('cliMcpServer')}</h4>
                    <div className="flex items-center justify-between">
                         <span>Status: {renderServerStatus()}</span>
                         <button onClick={handleLinkToggle} className={`px-3 py-1 text-xs font-bold rounded-full flex items-center transition-colors ${isLinked ? 'bg-red-800/80 hover:bg-red-700/80' : 'bg-green-800/80 hover:bg-green-700/80'}`}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            {isLinked ? t('cliUnlink') : t('cliLink')}
                         </button>
                    </div>
                </div>
                 <div className="p-3 bg-gray-900/50 rounded-lg">
                    <h4 className="font-semibold text-gray-300 mb-2">{t('cliSlashCommands')}</h4>
                    <div className="p-2 bg-gray-700/50 rounded-md">
                        <p className="font-mono text-cyan-300">/fs:grep-code</p>
                        <p className="text-xs text-gray-400 mt-1">{t('cliGrepDesc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
