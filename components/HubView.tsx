import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { ARCHITECT_EMAIL } from '../constants';

type AppTab = 'agent' | 'graph' | 'aether' | 'genesis' | 'analysis' | 'chat' | 'fabric' | 'economicFabric';

interface HubViewProps {
    userEmail: string;
    onNavigate: (view: 'ide', tab?: AppTab | 'profile' | 'ide') => void;
}

type Role = 'architect' | 'user';

export const HubView: React.FC<HubViewProps> = ({ userEmail, onNavigate }) => {
    const { t } = useLocalization();
    const [selectedRole, setSelectedRole] = useState<Role>(userEmail === ARCHITECT_EMAIL ? 'architect' : 'user');
    
    const [vitals, setVitals] = useState({
        cpu: 35,
        memory: 60,
        latency: 12,
    });
    
    useEffect(() => {
        const interval = setInterval(() => {
            setVitals({
                cpu: Math.min(100, Math.max(20, vitals.cpu + (Math.random() - 0.5) * 4)),
                memory: Math.min(100, Math.max(40, vitals.memory + (Math.random() - 0.5) * 6)),
                latency: Math.min(50, Math.max(8, vitals.latency + (Math.random() - 0.5) * 2)),
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [vitals]);
    
    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUserEmail');
        window.location.reload();
    };
    
    const isArchitect = selectedRole === 'architect';

    return (
        <div className="gradient-bg text-slate-100 min-h-screen overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700">
                <nav className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center glow-effect">
                                <i className="fas fa-infinity text-2xl text-slate-900"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">{t('hubTitle')}</h1>
                                <p className="text-xs text-slate-400 font-semibold tracking-wider">{t('hubSubtitle')}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full border border-slate-700">
                                <i className="fas fa-user-circle text-2xl text-blue-400"></i>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{isArchitect ? t('architectName') : t('regularUserName')}</p>
                                    <p className="text-xs text-slate-400">{userEmail}</p>
                                </div>
                            </div>
                            
                            <button onClick={handleLogout} className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg font-semibold transition-all">
                                <i className="fas fa-sign-out-alt mr-2"></i>{t('logout')}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-10">
                {/* Welcome Section */}
                <section className="text-center mb-16 hero-pattern rounded-3xl p-12 border border-slate-700">
                    <h2 className="text-5xl font-extrabold mb-4 animate-float">{t('hubWelcomeTitle')}</h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                       {t('hubWelcomeMessage')}
                    </p>
                    
                    <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                        <span className="px-4 py-2 rounded-full status-online flex items-center gap-2 font-semibold">
                            <i className="fas fa-circle text-xs"></i> {t('hubStatusSystem')}
                        </span>
                        <span className="px-4 py-2 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center gap-2 font-semibold">
                            <i className="fas fa-tachometer-alt"></i> {t('hubStatusPerformance')}
                        </span>
                        <span className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center gap-2 font-semibold">
                            <i className="fas fa-bolt"></i> {t('hubStatusBus')}
                        </span>
                    </div>
                </section>

                {/* Account Picker & Main Features Grid */}
                <section className="mb-16">
                    <h3 className="text-3xl font-bold mb-8 text-center pb-4 border-b-2 border-slate-700">
                        <i className="fas fa-balance-scale mr-3 text-blue-400"></i> {t('hubRoleSelectionTitle')}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                        {/* Architect Role */}
                        <div className="lg:col-span-1">
                            <div className={`card-gradient border ${selectedRole === 'architect' ? 'border-amber-400' : 'border-slate-700'} rounded-2xl p-6 feature-card`}>
                                <h4 className="text-2xl font-bold mb-4 text-amber-400 flex items-center gap-2">
                                    <i className="fas fa-hat-cowboy-side"></i> {t('architectProfileTitle')}
                                </h4>
                                <p className="text-slate-300 mb-6 text-sm">{t('architectProfileDesc')}</p>
                                <div className="space-y-3 mb-6">
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-shield-alt text-green-400"></i> {t('architectPrivilege1')}</p>
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-code-branch text-blue-400"></i> {t('architectPrivilege2')}</p>
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-diagnoses text-purple-400"></i> {t('architectPrivilege3')}</p>
                                </div>
                                <button onClick={() => setSelectedRole('architect')} disabled={userEmail !== ARCHITECT_EMAIL} className="w-full btn-primary text-white font-bold py-3 px-6 rounded-xl glow-effect disabled:opacity-50 disabled:cursor-not-allowed">
                                    <i className="fas fa-user-check mr-2"></i> {t('architectProfileButton')}
                                </button>
                            </div>
                        </div>
                        
                        {/* Regular User Role */}
                        <div className="lg:col-span-1">
                             <div className={`card-gradient border ${selectedRole === 'user' ? 'border-cyan-400' : 'border-slate-700'} rounded-2xl p-6 feature-card`}>
                                <h4 className="text-2xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                                    <i className="fas fa-user-tie"></i> {t('userProfileTitle')}
                                </h4>
                                <p className="text-slate-300 mb-6 text-sm">{t('userProfileDescHub')}</p>
                                <div className="space-y-3 mb-6">
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-file-code text-green-400"></i> {t('userPrivilege1')}</p>
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-search text-blue-400"></i> {t('userPrivilege2')}</p>
                                    <p className="flex items-center gap-2 text-sm"><i className="fas fa-book text-yellow-400"></i> {t('userPrivilege3')}</p>
                                </div>
                                <button onClick={() => setSelectedRole('user')} className="w-full btn-secondary text-white font-bold py-3 px-6 rounded-xl glow-effect">
                                    <i className="fas fa-user-check mr-2"></i> {t('userProfileButton')}
                                </button>
                            </div>
                        </div>
                        
                        {/* System Status Summary */}
                        <div className="lg:col-span-1">
                            <div className="card-gradient border border-slate-700 rounded-2xl p-6">
                                <h4 className="text-2xl font-bold mb-4 text-pink-400 flex items-center gap-2">
                                    <i className="fas fa-heartbeat"></i> {t('hubVitalsTitle')}
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-800/70 rounded-xl p-4">
                                        <p className="text-sm font-semibold flex items-center justify-between mb-2">
                                            <span className="text-slate-300"><i className="fas fa-microchip mr-2 text-blue-400"></i>{t('hubVitalsCPU')}</span>
                                            <span className="text-green-400">{vitals.cpu.toFixed(0)}%</span>
                                        </p>
                                        <div className="w-full bg-slate-700 rounded-full h-2"><div className="progress-bar h-2 rounded-full" style={{ width: `${vitals.cpu}%` }}></div></div>
                                    </div>
                                    <div className="bg-slate-800/70 rounded-xl p-4">
                                        <p className="text-sm font-semibold flex items-center justify-between mb-2">
                                            <span className="text-slate-300"><i className="fas fa-memory mr-2 text-purple-400"></i>{t('hubVitalsMemory')}</span>
                                            <span className="text-yellow-400">{vitals.memory.toFixed(0)}%</span>
                                        </p>
                                        <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: `${vitals.memory}%` }}></div></div>
                                    </div>
                                    <div className="bg-slate-800/70 rounded-xl p-4">
                                        <p className="text-sm font-semibold flex items-center justify-between mb-2">
                                            <span className="text-slate-300"><i className="fas fa-tint mr-2 text-cyan-400"></i>{t('hubVitalsLatency')}</span>
                                            <span className="text-blue-400">{vitals.latency.toFixed(0)}ms</span>
                                        </p>
                                        <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: `${vitals.latency / 2}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h4 className="text-2xl font-semibold mb-6 text-slate-300 border-b-2 border-slate-700 pb-3"><i className="fas fa-cubes mr-2 text-teal-400"></i> {t('hubCoreFunctionsTitle')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Firma IDE */}
                        <div className="card-gradient border border-slate-700 rounded-2xl p-6 feature-card">
                            <i className="fas fa-code-branch text-5xl text-green-400 mb-4"></i>
                            <h5 className="text-xl font-bold mb-3 text-white">{t('firmaIDE')}</h5>
                            <p className="text-slate-300 text-sm mb-4">{t('hubIDEDesc')}</p>
                            <div className="mb-4 p-3 bg-slate-800/70 rounded-xl border-l-4 border-green-400"><p className="text-xs font-semibold text-slate-300"><i className="fas fa-fire mr-2 text-orange-400"></i>{t('hubIDEFeature')}</p></div>
                            <button onClick={() => onNavigate('ide', 'ide')} className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold py-2 px-4 rounded-lg transition-all"><i className="fas fa-play mr-2"></i>{t('hubLaunchIDE')}</button>
                        </div>
                        {/* AI Core & Protocols */}
                        <div className={`card-gradient border ${!isArchitect ? 'border-slate-700' : 'border-slate-700'} rounded-2xl p-6 feature-card ${!isArchitect ? 'opacity-50' : ''}`}>
                            <i className="fas fa-brain text-5xl text-yellow-400 mb-4"></i>
                            <h5 className="text-xl font-bold mb-3 text-white">{t('hubAICoreTitle')}</h5>
                            <p className="text-slate-300 text-sm mb-4">{t('hubAICoreDesc')}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2 py-1 bg-blue-900/70 text-blue-300 text-xs rounded-full font-semibold">{t('hubAICoreTag1')}</span>
                                <span className="px-2 py-1 bg-purple-900/70 text-purple-300 text-xs rounded-full font-semibold">{t('hubAICoreTag2')}</span>
                                <span className="px-2 py-1 bg-orange-900/70 text-orange-300 text-xs rounded-full font-semibold">{t('hubAICoreTag3')}</span>
                            </div>
                            <button onClick={() => onNavigate('ide', 'agent')} disabled={!isArchitect} className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:cursor-not-allowed"><i className="fas fa-cogs mr-2"></i>{t('hubOpenAIPanel')}</button>
                        </div>
                        {/* Genesis & Creation */}
                        <div className="card-gradient border border-slate-700 rounded-2xl p-6 feature-card">
                            <i className="fas fa-palette text-5xl text-pink-400 mb-4"></i>
                            <h5 className="text-xl font-bold mb-3 text-white">{t('hubGenesisTitle')}</h5>
                            <p className="text-slate-300 text-sm mb-4">{t('hubGenesisDesc')}</p>
                            <div className="flex items-center gap-2 mb-4 text-xs"><i className="fas fa-image text-blue-400"></i><span className="text-slate-300 font-semibold">Gemini-3-Pro-Image</span></div>
                            <button onClick={() => onNavigate('ide', 'genesis')} className="w-full bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white font-semibold py-2 px-4 rounded-lg transition-all"><i className="fas fa-magic mr-2"></i>{t('hubOpenCreator')}</button>
                        </div>
                        {/* Systemic & Economic */}
                        <div className={`card-gradient border ${!isArchitect ? 'border-slate-700' : 'border-slate-700'} rounded-2xl p-6 feature-card ${!isArchitect ? 'opacity-50' : ''}`}>
                            <i className="fas fa-network-wired text-5xl text-indigo-400 mb-4"></i>
                            <h5 className="text-xl font-bold mb-3 text-white">{t('hubSystemicTitle')}</h5>
                            <p className="text-slate-300 text-sm mb-4">{t('hubSystemicDesc')}</p>
                            <div className="flex items-center gap-2 mb-4 text-xs"><i className="fas fa-dollar-sign text-green-400"></i><span className="text-slate-300 font-semibold">{t('hubSystemicFeature')}</span></div>
                            <button onClick={() => onNavigate('ide', 'economicFabric')} disabled={!isArchitect} className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:cursor-not-allowed"><i className="fas fa-line-chart mr-2"></i>{t('hubOpenFabric')}</button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};
