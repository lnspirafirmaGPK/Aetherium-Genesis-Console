import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { DependencyGraph } from './components/DependencyGraph';
import { LightPulseSimulator, STATE_CONFIG } from './components/LightPulseSimulator';
import { Toolbar } from './components/Toolbar';
import { AgentPanel } from './components/AgentPanel';
import { ImageGenesis } from './components/ImageGenesis';
import { ImageAnalysis } from './components/ImageAnalysis';
import { Chatbot } from './components/Chatbot';
import { DataFabricView } from './components/DataFabricView';
import { AetherCanvas } from './components/AetherCanvas';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ModelConfigModal } from './components/ModelConfigModal';
import { UserProfilePanel } from './components/UserProfilePanel';
import { EconomicFabricView } from './components/EconomicFabricView';
import { Notification as NotificationComponent } from './components/Notification';
import type { CodeFile, AnalysisResult, RefactoringTask, LightPulseState, DevLightParams, ModelConfig, Notification } from './types';
import { AnalysisEngine } from './services/analysisEngine';
import { RefactoringEngine } from './services/refactoringEngine';
import { MOCK_FILE_SYSTEM, ARCHITECT_EMAIL } from './constants';
import { useLocalization } from './contexts/LocalizationContext';
import { AetherBus } from './services/aetherBus';
import { CloseIcon, CodeIcon, GitHubIcon, SpinnerIcon, CheckCircleIcon, GitBranchIcon, SparklesIcon } from './components/icons';
import type { TranslationKey } from './localization';

const App: React.FC = () => {
    const [files, setFiles] = useState<CodeFile[]>(MOCK_FILE_SYSTEM);
    const [selectedFile, setSelectedFile] = useState<CodeFile | null>(files.find(f => f.path === 'src/api/client.ts') || files[0] || null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'agent' | 'graph' | 'aether' | 'genesis' | 'analysis' | 'chat' | 'fabric' | 'economicFabric'>('economicFabric');
    const [staticTasks, setStaticTasks] = useState<RefactoringTask[]>([]);
    const [dynamicTasks, setDynamicTasks] = useState<RefactoringTask[]>([]);
    const { t } = useLocalization();
    const [isRefactoring, setIsRefactoring] = useState(false);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    
    // State for the Core Monitor
    const [lightPulseState, setLightPulseState] = useState<LightPulseState>('IDLE');
    const [isDevMode, setIsDevMode] = useState(false);
    const [manualState, setManualState] = useState<LightPulseState>('IDLE');
    const [devParams, setDevParams] = useState<DevLightParams>({ ...STATE_CONFIG.IDLE });
    const [isGenesisModeActive, setIsGenesisModeActive] = useState(false);
    
    // State for focused view
    const [focusedView, setFocusedView] = useState<'editor' | 'panel'>('editor');
    const [impactAnalysis, setImpactAnalysis] = useState<{ source: string[], affected: string[] } | null>(null);
    
    // State for GitHub modal
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [githubModalStep, setGithubModalStep] = useState<'form' | 'loading' | 'success'>('form');
    const [commitMessage, setCommitMessage] = useState('');
    const [repoName, setRepoName] = useState('your-username/aetherium-refactored');
    const [prTitle, setPrTitle] = useState('');
    const [prDescription, setPrDescription] = useState('');
    const [isPrConfirmModalOpen, setIsPrConfirmModalOpen] = useState(false);
    const [baseBranch, setBaseBranch] = useState('main');
    const [compareBranch, setCompareBranch] = useState('feat/ai-refactor');

    // State for AI Model Configuration
    const [isModelConfigModalOpen, setIsModelConfigModalOpen] = useState(false);
    const [modelConfig, setModelConfig] = useState<ModelConfig>({
        wisdomEngine: 'Cognito-Pro (Strategic)',
        imageGenesis: 'Visionary-XL (Imaging)',
        chatbot: 'Cognito-Pro (Strategic)',
    });
    
    // State for User Profile
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
    
    // State for Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const loggedInEmail = sessionStorage.getItem('loggedInUserEmail');
        setCurrentUserEmail(loggedInEmail || ARCHITECT_EMAIL); // Fallback to architect for dev
    }, []);

    const addNotification = useCallback((title: TranslationKey, message: TranslationKey, type: 'success' | 'error' | 'info', data?: string) => {
        const newNotification: Notification = {
            id: Date.now(),
            title,
            message,
            type,
            data,
        };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };


    const analysisEngine = useMemo(() => new AnalysisEngine(files), [files]);
    
    useEffect(() => {
        if (isDevMode) {
            setDevParams(STATE_CONFIG[manualState] || STATE_CONFIG.IDLE);
        }
    }, [manualState, isDevMode]);

    const runAnalysis = useCallback(() => {
        const result = analysisEngine.runFullAnalysis();
        setAnalysisResult(result);
        
        const newTasks: RefactoringTask[] = [];
        if (result.circularDependencies.length > 0) {
             newTasks.push({
                id: 'CIRCULAR_DEP_AUTH_CLIENT',
                type: 'BREAK_CIRCULAR_DEPENDENCY',
                titleKey: 'task_circ_dep_title',
                descriptionKey: 'task_circ_dep_desc',
                filesInvolved: result.circularDependencyFiles.flat(),
                planKeys: [
                    'task_circ_dep_plan_1',
                    'task_circ_dep_plan_2',
                    'task_circ_dep_plan_3',
                    'task_circ_dep_plan_4',
                ]
            });
        }
        if (result.deadCodeFiles.includes('src/legacy/old-utils.ts')) {
            newTasks.push({
                id: 'DEAD_CODE_OLD_UTILS',
                type: 'REMOVE_DEAD_CODE',
                titleKey: 'task_dead_code_title',
                descriptionKey: 'task_dead_code_desc',
                filesInvolved: ['src/legacy/old-utils.ts'],
                planKeys: [
                    'task_dead_code_plan_1',
                    'task_dead_code_plan_2',
                    'task_dead_code_plan_3',
                ]
            });
        }
        setStaticTasks(newTasks);
        setCompletedTasks(prev => prev.filter(taskId => newTasks.some(t => t.id === taskId)));
    }, [analysisEngine]);

    useEffect(() => {
        runAnalysis();
    }, [runAnalysis]);

    const allTasks = useMemo(() => [...staticTasks, ...dynamicTasks], [staticTasks, dynamicTasks]);

    useEffect(() => {
        const aetherBus = AetherBus.getInstance();
        
        const handleProtocolExecution = (envelope: any) => {
            if (isDevMode) return;
            const taskId = envelope.payload.targetId as string;
            const task = allTasks.find(t => t.id === taskId);
    
            if (task && !isRefactoring) {
                setIsRefactoring(true);
                setLightPulseState('EXECUTING');
    
                setTimeout(() => {
                    const newFiles = RefactoringEngine.execute(files, task);
                    aetherBus.publish('REFACTORING_COMPLETE', {
                        completedTaskId: task.id,
                        newFiles: newFiles
                    });
                }, 1500);
            }
        };

        const handleRefactoringComplete = (envelope: any) => {
            if (isDevMode) return;
            const newFiles = envelope.payload.newFirmaState as CodeFile[];
            const completedTaskId = envelope.payload.targetId as string;
            
            setLightPulseState('COMPLETE');
            setTimeout(() => setLightPulseState('IDLE'), 1200);

            setFiles(newFiles);
            setCompletedTasks(prev => [...new Set([...prev, completedTaskId])]);
            setIsRefactoring(false);
            
            // Auto-select a relevant new file after refactoring
            let fileToSelect: CodeFile | null = null;
            if (completedTaskId === 'CIRCULAR_DEP_AUTH_CLIENT') {
                 fileToSelect = newFiles.find(f => f.path === 'src/services/tokenProvider.ts');
            } else if (completedTaskId.startsWith('SPLIT_UTILITIES')) {
                 fileToSelect = newFiles.find(f => f.path === 'src/utils/formatters-date.ts');
            }
            setSelectedFile(fileToSelect || newFiles[0] || null);
        };
        
        const handleSimulateImpact = (envelope: any) => {
            const filesInvolved = envelope.payload.filesInvolved as string[];
            if (!analysisResult) return;
            
            const affected = analysisResult.dependencies
                .filter(dep => filesInvolved.includes(dep.to))
                .map(dep => dep.from);
            
            setImpactAnalysis({ source: filesInvolved, affected: [...new Set(affected)] });
            setActiveTab('graph');
            setFocusedView('panel');
            
            setTimeout(() => setImpactAnalysis(null), 5000); // Simulation lasts 5 seconds
        };
        
        const handleWisdomStart = () => !isDevMode && setLightPulseState('THINKING');
        const handleWisdomEnd = () => !isDevMode && setLightPulseState('IDLE');
        const handleTierSuspension = () => !isDevMode && setLightPulseState('NIRODHA');


        const unsubMechanic = aetherBus.subscribe('EXECUTE_REFACTORING_PROTOCOL', handleProtocolExecution);
        const unsubCore = aetherBus.subscribe('REFACTORING_COMPLETE', handleRefactoringComplete);
        const unsubWisdomStart = aetherBus.subscribe('WISDOM_FETCH_START', handleWisdomStart);
        const unsubWisdomEnd = aetherBus.subscribe('WISDOM_FETCH_END', handleWisdomEnd);
        const unsubSimulator = aetherBus.subscribe('SIMULATE_IMPACT', handleSimulateImpact);
        const unsubSuspension = aetherBus.subscribe('TIER_SUSPENSION_TRIGGERED', handleTierSuspension);
    
        return () => {
            unsubMechanic();
            unsubCore();
            unsubWisdomStart();
            unsubWisdomEnd();
            unsubSimulator();
            unsubSuspension();
        };
    }, [files, allTasks, isRefactoring, isDevMode, analysisResult]);

    const handleScan = () => {
        runAnalysis();
        handleFocusPanel('agent');
    };
    
    const handleSelectFile = (file: CodeFile) => {
        setSelectedFile(file);
        setHighlightedNode(file.path);
        AetherBus.getInstance().publish('FIRMA_NODE_SELECTED', file);
        setFocusedView('editor');
        setDynamicTasks(analysisEngine.generateDynamicTasks(file.path));
        setTimeout(() => setHighlightedNode(null), 1500);
    };

    const handleFocusPanel = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setFocusedView('panel');
    };

    const handleOpenGitHubModal = () => {
        const completedTaskTitles = completedTasks
            .map(id => allTasks.find(task => task.id === id))
            .filter(Boolean)
            .map(task => t(task!.titleKey));
        
        const description = completedTaskTitles.length > 0
            ? `feat: AI-assisted refactoring\n\nThis pull request includes the following automated refactors:\n- ${completedTaskTitles.join('\n- ')}`
            : 'chore: Aetherium Genesis code sync';
        
        setCommitMessage(description.split('\n')[0]);
        setPrTitle(completedTaskTitles.length > 0 ? t('prTitleDefault') : 'Sync Code');
        setPrDescription(description);
        setGithubModalStep('form');
        setIsGitHubModalOpen(true);
    };
    
    const handleCreatePullRequest = () => {
        setIsGitHubModalOpen(false);
        setGithubModalStep('loading');
        setTimeout(() => {
            setGithubModalStep('success');
            setIsGitHubModalOpen(true);
        }, 500);
        setTimeout(() => {
            setGithubModalStep('success');
        }, 2000);
    };

    const graphData = useMemo(() => {
        if (!analysisResult) return { nodes: [], links: [] };
        
        const nodes = files.map(f => ({
            id: f.path,
            isDead: analysisResult.deadCodeFiles.includes(f.path) ?? false,
            isCircular: analysisResult.circularDependencyFiles.flat().includes(f.path) ?? false,
            heat: analysisResult.heatScores.get(f.path) ?? 0,
        }));

        const links = analysisResult.dependencies.map(d => ({
            source: d.from,
            target: d.to,
        }));

        return { nodes, links };
    }, [files, analysisResult]);
    
    const activeState = isDevMode ? manualState : lightPulseState;
    const paramsOverride = isDevMode ? devParams : undefined;
    
    const TAB_TITLE_KEYS: Record<typeof activeTab, TranslationKey> = {
        genesis: 'imageGenesis',
        analysis: 'imageAnalysis',
        chat: 'chatbot',
        fabric: 'dataFabric',
        economicFabric: 'economicFabric',
        aether: 'aetherInterface',
        agent: 'aiAgent',
        graph: 'dependencyGraph',
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
            <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shadow-lg">
                <h1 className="text-2xl font-bold text-cyan-400">{t('appTitle')}</h1>
                <Toolbar 
                    onAnalyze={handleScan} 
                    onUpload={handleOpenGitHubModal}
                    onOpenModelConfig={() => setIsModelConfigModalOpen(true)}
                    onOpenUserProfile={() => setIsUserProfileOpen(true)}
                />
            </header>
            <main className="flex flex-1 overflow-hidden">
                <div className="bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 w-1/4 lg:w-1/5">
                   <FileExplorer 
                        files={files} 
                        selectedFile={selectedFile} 
                        onSelectFile={handleSelectFile}
                        analysisResult={analysisResult}
                    />
                </div>
                
                <div className={`flex flex-col min-w-0 flex-1 transition-all duration-300 ease-in-out ${focusedView === 'panel' ? 'hidden' : 'flex'}`}>
                    <CodeEditor file={selectedFile} analysisResult={analysisResult} />
                </div>

                <div className={`bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${focusedView === 'panel' ? 'flex-1' : 'w-[30%] 2xl:w-1/4 flex-shrink-0'}`}>
                    {focusedView === 'panel' && (
                        <div className="p-2 border-b border-gray-700 flex items-center flex-shrink-0">
                            <button 
                                onClick={() => setFocusedView('editor')} 
                                className="flex items-center p-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                                title={t('backToEditor')}
                            >
                                <CodeIcon className="w-5 h-5 mr-2" />
                                {t('backToEditor')}
                            </button>
                            <h3 className="text-md font-semibold text-cyan-400 ml-4">{t(TAB_TITLE_KEYS[activeTab])}</h3>
                        </div>
                    )}
                    
                    {focusedView === 'editor' && (
                        <div className="grid grid-cols-8 border-b border-gray-700 flex-shrink-0">
                            <button onClick={() => handleFocusPanel('genesis')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'genesis' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('imageGenesis')}</button>
                            <button onClick={() => handleFocusPanel('analysis')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'analysis' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('imageAnalysis')}</button>
                            <button onClick={() => handleFocusPanel('chat')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('chatbot')}</button>
                            <button onClick={() => handleFocusPanel('fabric')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'fabric' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('dataFabric')}</button>
                            <button onClick={() => handleFocusPanel('economicFabric')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'economicFabric' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('economicFabric')}</button>
                            <button onClick={() => handleFocusPanel('aether')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'aether' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('aetherInterface')}</button>
                            <button onClick={() => handleFocusPanel('agent')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'agent' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('aiAgent')}</button>
                            <button onClick={() => handleFocusPanel('graph')} className={`p-3 text-sm font-semibold transition-colors ${activeTab === 'graph' ? 'bg-gray-900 text-cyan-400' : 'text-gray-400 hover:bg-gray-700'}`}>{t('dependencyGraph')}</button>
                        </div>
                    )}

                    <div className="flex-grow relative overflow-y-auto">
                       {activeTab === 'genesis' && <ImageGenesis />}
                       {activeTab === 'analysis' && <ImageAnalysis />}
                       {activeTab === 'chat' && <Chatbot />}
                       {activeTab === 'fabric' && <DataFabricView files={files} analysisResult={analysisResult} completedTasks={completedTasks} onPublish={handleOpenGitHubModal} />}
                       {activeTab === 'economicFabric' && <EconomicFabricView addNotification={addNotification} userEmail={currentUserEmail} />}
                       {activeTab === 'aether' && (
                           <div className="flex flex-col h-full text-sm">
                               {isGenesisModeActive ? (
                                    <AetherCanvas onExit={() => setIsGenesisModeActive(false)} />
                               ) : (
                                   <>
                                   <div className="flex-grow relative">
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-gray-700 font-mono text-xs">{t('coreMonitorStatus')}</p>
                                        </div>
                                        <LightPulseSimulator state={activeState} devParamsOverride={paramsOverride} />
                                   </div>
                                    <div className="p-2 bg-gray-900/50 border-t border-gray-700">
                                        <div className="text-center">
                                            <h4 className="font-semibold text-cyan-400">{t('aetherInterface')}</h4>
                                            <p className="text-xs text-gray-400">Current State: <span className="font-mono text-cyan-300">{activeState}</span></p>
                                        </div>
                                        <div className="mt-2 p-2 border-t border-gray-700/50">
                                            <button 
                                                onClick={() => setIsGenesisModeActive(true)}
                                                className="w-full mb-2 flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-md transition-colors"
                                            >
                                                <SparklesIcon className="w-4 h-4 mr-2" />
                                                {t('activateGenesisProtocol')}
                                            </button>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="font-semibold text-xs text-gray-300">{t('devControls')}</span>
                                                <div className="relative">
                                                    <input type="checkbox" checked={isDevMode} onChange={() => setIsDevMode(!isDevMode)} className="sr-only peer" />
                                                    <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                                                </div>
                                            </label>
                                            {isDevMode && (
                                                <div className="mt-2 space-y-2 text-xs">
                                                    <div>
                                                        <label className="block text-gray-400">{t('devStateOverride')}</label>
                                                        <select value={manualState} onChange={e => setManualState(e.target.value as LightPulseState)} className="w-full mt-1 p-1 bg-gray-700 border border-gray-600 rounded text-white">
                                                            {(Object.keys(STATE_CONFIG) as LightPulseState[]).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 items-center">
                                                         <label className="text-gray-400">{t('devParamFrequency')}</label>
                                                         <input type="range" min="0.1" max="20" step="0.1" value={devParams.frequency} onChange={e => setDevParams(p => ({...p, frequency: +e.target.value}))} className="w-full" />
                                                         
                                                         <label className="text-gray-400">{t('devParamIntensity')}</label>
                                                         <input type="range" min="0.1" max="3" step="0.1" value={devParams.intensity} onChange={e => setDevParams(p => ({...p, intensity: +e.target.value}))} className="w-full" />
                                                         
                                                         <label className="text-gray-400">{t('devParamDecay')}</label>
                                                         <input type="range" min="0.8" max="0.99" step="0.01" value={devParams.decay} onChange={e => setDevParams(p => ({...p, decay: +e.target.value}))} className="w-full" />

                                                         <label className="text-gray-400">{t('devParamChaos')}</label>
                                                         <input type="range" min="0" max="10" step="0.1" value={devParams.chaos} onChange={e => setDevParams(p => ({...p, chaos: +e.target.value}))} className="w-full" />
                                                         
                                                         <label className="text-gray-400">{t('devParamColor')}</label>
                                                         <input type="color" value={devParams.color} onChange={e => setDevParams(p => ({...p, color: e.target.value}))} className="w-full bg-gray-700" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                   </>
                                )}
                           </div>
                       )}
                        {activeTab === 'agent' && (
                            <AgentPanel tasks={allTasks} isRefactoring={isRefactoring} completedTasks={completedTasks} />
                        )}
                        {activeTab === 'graph' && (
                            <DependencyGraph 
                                nodes={graphData.nodes} 
                                links={graphData.links}
                                highlightedNode={highlightedNode}
                                impactAnalysis={impactAnalysis}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Notification Container */}
            <div className="absolute top-20 right-0 z-50">
                {notifications.map(notification => (
                    <NotificationComponent
                        key={notification.id}
                        notification={notification}
                        onDismiss={removeNotification}
                    />
                ))}
            </div>

            {isGitHubModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="github-modal-title"
                >
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 id="github-modal-title" className="font-semibold text-lg text-gray-200 flex items-center">
                               <GitHubIcon className="w-6 h-6 mr-3 text-cyan-400" />
                               {t('githubModalTitle')}
                            </h3>
                            <button 
                                onClick={() => setIsGitHubModalOpen(false)}
                                className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {githubModalStep === 'form' && (
                                <form onSubmit={(e) => { e.preventDefault(); setIsPrConfirmModalOpen(true); }} className="space-y-6">
                                    <div>
                                        <label htmlFor="repo-name" className="block text-sm font-medium text-gray-400 mb-1">{t('repositoryName')}</label>
                                        <input
                                            type="text"
                                            id="repo-name"
                                            value={repoName}
                                            onChange={(e) => setRepoName(e.target.value)}
                                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                        />
                                    </div>

                                    <div className="border-t border-gray-700 pt-6">
                                        <h4 className="text-md font-semibold text-gray-300 mb-3">{t('commitDetails')}</h4>
                                        <div>
                                            <label htmlFor="commit-message" className="block text-sm font-medium text-gray-400 mb-1">{t('commitMessage')}</label>
                                            <input
                                                id="commit-message"
                                                value={commitMessage}
                                                onChange={(e) => setCommitMessage(e.target.value)}
                                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 pt-6">
                                        <h4 className="text-md font-semibold text-gray-300 mb-3">{t('pullRequestDetails')}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label htmlFor="base-branch" className="block text-sm font-medium text-gray-400 mb-1 flex items-center"><GitBranchIcon className="w-4 h-4 mr-2" /> {t('baseBranch')}</label>
                                                <input
                                                    id="base-branch"
                                                    value={baseBranch}
                                                    onChange={(e) => setBaseBranch(e.target.value)}
                                                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="compare-branch" className="block text-sm font-medium text-gray-400 mb-1 flex items-center"><GitBranchIcon className="w-4 h-4 mr-2" /> {t('compareBranch')}</label>
                                                <input
                                                    id="compare-branch"
                                                    value={compareBranch}
                                                    onChange={(e) => setCompareBranch(e.target.value)}
                                                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="pr-title" className="block text-sm font-medium text-gray-400 mb-1">{t('pullRequestTitle')}</label>
                                            <input
                                                id="pr-title"
                                                value={prTitle}
                                                onChange={(e) => setPrTitle(e.target.value)}
                                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label htmlFor="pr-description" className="block text-sm font-medium text-gray-400 mb-1">{t('pullRequestDescription')}</label>
                                            <textarea
                                                id="pr-description"
                                                value={prDescription}
                                                onChange={(e) => setPrDescription(e.target.value)}
                                                rows={6}
                                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200 resize-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md transition-colors"
                                        >
                                            <GitHubIcon className="w-5 h-5 mr-2" />
                                            {t('createPullRequest')}
                                        </button>
                                    </div>
                                </form>
                            )}
                            {githubModalStep === 'loading' && (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <SpinnerIcon className="w-10 h-10 animate-spin text-cyan-400" />
                                    <p className="mt-4 text-lg">{t('creatingPullRequest')}</p>
                                </div>
                            )}
                             {githubModalStep === 'success' && (
                                <div className="flex flex-col items-center justify-center h-48 text-center">
                                    <CheckCircleIcon className="w-16 h-16 text-green-400" />
                                    <h4 className="mt-4 text-xl font-bold text-gray-100">{t('pullRequestCreated')}</h4>
                                    <a 
                                      href={`https://github.com/${repoName}/pull/1`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 text-cyan-400 hover:underline"
                                    >
                                        {t('viewOnGitHub')}
                                    </a>
                                     <button
                                        onClick={() => setIsGitHubModalOpen(false)}
                                        className="mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
                                    >
                                        {t('close')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal
                isOpen={isPrConfirmModalOpen}
                onClose={() => setIsPrConfirmModalOpen(false)}
                onConfirm={() => {
                    setIsPrConfirmModalOpen(false);
                    handleCreatePullRequest();
                }}
                title={t('confirmPrTitle')}
                message={t('confirmPrMessage')}
                confirmText={t('confirm')}
                cancelText={t('cancel')}
                icon={<GitHubIcon className="w-6 h-6 mr-3 text-cyan-400" />}
                confirmButtonClass="bg-green-600 hover:bg-green-500"
            />
            <ModelConfigModal
                isOpen={isModelConfigModalOpen}
                onClose={() => setIsModelConfigModalOpen(false)}
                currentConfig={modelConfig}
                onSave={(newConfig) => {
                    setModelConfig(newConfig);
                    setIsModelConfigModalOpen(false);
                }}
            />
            <UserProfilePanel
                isOpen={isUserProfileOpen}
                onClose={() => setIsUserProfileOpen(false)}
                userEmail={currentUserEmail}
                filesManaged={files.length}
                protocolsExecuted={completedTasks.length}
                imagesSynthesized={12}
                analysesPerformed={4}
            />
        </div>
    );
};

export default App;