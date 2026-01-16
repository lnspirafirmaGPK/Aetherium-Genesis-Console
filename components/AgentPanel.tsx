import React, { useState, useEffect } from 'react';
import type { RefactoringTask, GroundingResult } from '../types';
import { LightBulbIcon, CheckCircleIcon, CircularDepIcon, DeadCodeIcon, WorldIcon, WarningIcon } from './icons';
import { useLocalization } from '../contexts/LocalizationContext';
import { AetherBus } from '../services/aetherBus';
import { WisdomEngine } from '../services/wisdomEngine';
import { ConfirmationModal } from './ConfirmationModal';

interface AgentPanelProps {
    tasks: RefactoringTask[];
    isRefactoring: boolean;
    completedTasks: string[];
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ tasks, isRefactoring, completedTasks }) => {
    const [selectedTask, setSelectedTask] = useState<RefactoringTask | null>(null);
    const [wisdom, setWisdom] = useState<GroundingResult | null>(null);
    const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { t } = useLocalization();
    
    useEffect(() => {
        // If the selected task is no longer valid (e.g., completed or removed), select the next available one.
        const isSelectedTaskStale = selectedTask && (!tasks.some(t => t.id === selectedTask.id) || completedTasks.includes(selectedTask.id));

        if (isSelectedTaskStale) {
             const nextTask = tasks.find(t => !completedTasks.includes(t.id)) || null;
             setSelectedTask(nextTask);
        } else if (!selectedTask && tasks.length > 0) {
             // If no task is selected, select the first available one.
             const nextTask = tasks.find(t => !completedTasks.includes(t.id)) || null;
             setSelectedTask(nextTask);
        }

    }, [tasks, completedTasks, selectedTask]);

    useEffect(() => {
        const aetherBus = AetherBus.getInstance();
        if (selectedTask && !completedTasks.includes(selectedTask.id)) {
            const fetchWisdom = async () => {
                setIsLoadingWisdom(true);
                aetherBus.publish('WISDOM_FETCH_START', {});
                setWisdom(null);
                let topic = '';
                switch(selectedTask.type) {
                    case 'BREAK_CIRCULAR_DEPENDENCY':
                        topic = "The problems with circular dependencies in software architecture";
                        break;
                    case 'REMOVE_DEAD_CODE':
                        topic = "The importance of removing dead or unused code from a codebase";
                        break;
                    case 'SPLIT_UTILITIES':
                        topic = "Improving code cohesion by splitting large utility files";
                        break;
                    case 'REVIEW_ABSTRACTION':
                        topic = "The purpose of abstraction layers and identifying tightly coupled modules";
                        break;
                    default:
                        setIsLoadingWisdom(false);
                        aetherBus.publish('WISDOM_FETCH_END', {});
                        return;
                }
                try {
                    const result = await WisdomEngine.getExplanation(topic);
                    setWisdom(result);
                } catch (error) {
                    console.error("Failed to fetch wisdom", error);
                } finally {
                    setIsLoadingWisdom(false);
                    aetherBus.publish('WISDOM_FETCH_END', {});
                }
            };
            fetchWisdom();
        } else {
            setWisdom(null);
            setIsLoadingWisdom(false);
        }
    }, [selectedTask?.id]);

    const handleExecuteClick = () => {
        if (selectedTask) {
            setIsConfirmModalOpen(true);
        }
    };
    
    const handleSimulateImpact = () => {
        if (selectedTask) {
             AetherBus.getInstance().publish('SIMULATE_IMPACT', selectedTask);
        }
    };

    const handleConfirmExecute = () => {
        if (selectedTask) {
            AetherBus.getInstance().publish('EXECUTE_REFACTORING_PROTOCOL', selectedTask);
        }
        setIsConfirmModalOpen(false);
    };

    const getIcon = (type: RefactoringTask['type']) => {
        switch (type) {
            case 'BREAK_CIRCULAR_DEPENDENCY':
                return <CircularDepIcon className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />;
            case 'REMOVE_DEAD_CODE':
            case 'SPLIT_UTILITIES':
                return <DeadCodeIcon className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />;
            default:
                return <LightBulbIcon className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />;
        }
    };

    return (
        <div className="flex flex-col h-full text-sm bg-gray-800">
            <div className="p-2 border-b border-gray-700">
                <h3 className="text-md font-semibold text-gray-300 flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    {t('refactoringOpportunities')}
                </h3>
            </div>
            <ul className="overflow-y-auto p-2">
                {tasks.length === 0 && <li className="text-gray-500 p-2">{t('noOpportunities')}</li>}
                {tasks.map(task => (
                    <li key={task.id}>
                        <button
                            onClick={() => setSelectedTask(task)}
                            disabled={completedTasks.includes(task.id)}
                            className={`w-full text-left p-2 my-1 rounded-md flex items-center transition-colors duration-200 ${
                                completedTasks.includes(task.id)
                                    ? 'bg-green-800/30 text-gray-500 cursor-not-allowed'
                                    : selectedTask?.id === task.id
                                    ? 'bg-cyan-600/30 text-cyan-300'
                                    : 'hover:bg-gray-700'
                            }`}
                        >
                            {getIcon(task.type)}
                            <span className="flex-grow">{t(task.titleKey)}</span>
                            {completedTasks.includes(task.id) && <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="flex-grow overflow-y-auto">
            {selectedTask && !completedTasks.includes(selectedTask.id) && (
                <div className="border-t border-gray-700 p-3 bg-gray-900/50 h-full flex flex-col">
                    <h4 className="font-bold mb-2 text-gray-200">{t(selectedTask.titleKey)}</h4>
                    <p className="text-gray-400 mb-3">{t(selectedTask.descriptionKey)}</p>
                    <h5 className="font-semibold mb-1 text-gray-300">{t('agentPlan')}:</h5>
                    <ul className="list-decimal list-inside text-gray-400 space-y-1 mb-4">
                        {selectedTask.planKeys.map((stepKey, index) => <li key={index}>{t(stepKey)}</li>)}
                    </ul>
                    
                    {isLoadingWisdom && (
                        <div className="mt-4 p-2 text-center text-gray-400 text-xs animate-pulse">
                            <p>Consulting web oracle...</p>
                        </div>
                    )}
                    {wisdom?.explanation && (
                        <div className="mt-4 pt-3 border-t border-gray-700/50">
                            <h5 className="font-semibold mb-2 text-gray-300 flex items-center">
                                <WorldIcon className="w-4 h-4 mr-2 text-cyan-400" />
                                Context from the Web
                            </h5>
                            <p className="text-gray-400 text-xs whitespace-pre-wrap">{wisdom.explanation}</p>
                            {wisdom.sources.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="text-xs font-semibold text-gray-500">Sources:</h6>
                                    <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                                        {wisdom.sources.map(source => (
                                            <li key={source.uri}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline truncate block">
                                                    {source.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="mt-auto pt-4 flex gap-2">
                         <button
                            onClick={handleSimulateImpact}
                            disabled={isRefactoring}
                            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed"
                        >
                            {t('simulateImpact')}
                        </button>
                        <button
                            onClick={handleExecuteClick}
                            disabled={isRefactoring}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-wait"
                        >
                            {isRefactoring ? t('executing') : t('executeRefactor')}
                        </button>
                    </div>
                </div>
            )}
            </div>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmExecute}
                title={t('confirmActionTitle')}
                message={t('confirmExecutionMessage')}
                confirmText={t('execute')}
                cancelText={t('cancel')}
                icon={<WarningIcon className="w-6 h-6 mr-3 text-yellow-400" />}
                confirmButtonClass="bg-red-600 hover:bg-red-500"
            />
        </div>
    );
};
