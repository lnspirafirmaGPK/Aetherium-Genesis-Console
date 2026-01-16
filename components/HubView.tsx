import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import {
    CodeIcon,
    AgentIcon,
    GitBranchIcon,
    CpuChipIcon,
    ImageIcon,
    DocumentScannerIcon,
    ChatIcon,
    DatabaseStackIcon,
    CurrencyDollarIcon,
    UserCircleIcon,
} from './icons';

type AppTab = 'agent' | 'graph' | 'aether' | 'genesis' | 'analysis' | 'chat' | 'fabric' | 'economicFabric';

interface HubViewProps {
    userEmail: string;
    onNavigate: (view: 'ide', tab?: AppTab | 'profile') => void;
}

const ModuleCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 text-left w-full h-full flex flex-col items-start
                   transform transition-all duration-300 hover:scale-105 hover:bg-gray-700/80 hover:border-cyan-400/50 shadow-lg hover:shadow-cyan-500/10"
    >
        <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-lg bg-gray-900 text-cyan-400">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 flex-grow">{description}</p>
    </button>
);

export const HubView: React.FC<HubViewProps> = ({ userEmail, onNavigate }) => {
    const { t } = useLocalization();

    const modules = [
        { id: 'ide', icon: <CodeIcon className="w-7 h-7" />, title: t('firmaIDE'), description: t('firmaIDEDesc'), onClick: () => onNavigate('ide') },
        { id: 'agent', icon: <AgentIcon className="w-7 h-7" />, title: t('aiAgent'), description: t('aiAgentDesc'), onClick: () => onNavigate('ide', 'agent') },
        { id: 'graph', icon: <GitBranchIcon className="w-7 h-7" />, title: t('dependencyGraph'), description: t('dependencyGraphDesc'), onClick: () => onNavigate('ide', 'graph') },
        { id: 'aether', icon: <CpuChipIcon className="w-7 h-7" />, title: t('aetherInterface'), description: t('aetherInterfaceDesc'), onClick: () => onNavigate('ide', 'aether') },
        { id: 'genesis', icon: <ImageIcon className="w-7 h-7" />, title: t('imageGenesis'), description: t('imageGenesisDesc'), onClick: () => onNavigate('ide', 'genesis') },
        { id: 'analysis', icon: <DocumentScannerIcon className="w-7 h-7" />, title: t('imageAnalysis'), description: t('imageAnalysisDesc'), onClick: () => onNavigate('ide', 'analysis') },
        { id: 'chat', icon: <ChatIcon className="w-7 h-7" />, title: t('chatbot'), description: t('chatbotDesc'), onClick: () => onNavigate('ide', 'chat') },
        { id: 'fabric', icon: <DatabaseStackIcon className="w-7 h-7" />, title: t('dataFabric'), description: t('dataFabricDesc'), onClick: () => onNavigate('ide', 'fabric') },
        { id: 'economicFabric', icon: <CurrencyDollarIcon className="w-7 h-7" />, title: t('economicFabric'), description: t('economicFabricDesc'), onClick: () => onNavigate('ide', 'economicFabric') },
        { id: 'profile', icon: <UserCircleIcon className="w-7 h-7" />, title: t('userProfile'), description: t('userProfileDesc'), onClick: () => onNavigate('ide', 'profile') },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans p-8 overflow-y-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-cyan-400 mb-2">{t('hubWelcomeTitle')}</h1>
                <p className="text-lg text-gray-400">{t('hubWelcomeUser')}, <span className="font-semibold text-gray-200">{userEmail}</span></p>
            </header>
            <main className="flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {modules.map(module => (
                        <ModuleCard
                            key={module.id}
                            icon={module.icon}
                            title={module.title}
                            description={module.description}
                            onClick={module.onClick}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};
