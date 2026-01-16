
import React, { useState } from 'react';
import type { CodeFile, AnalysisResult, UserRole } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { DatabaseStackIcon, ShieldCheckIcon, UserGroupIcon, SparklesIcon, CheckCircleIcon, GitHubIcon } from './icons';

interface DataFabricViewProps {
    files: CodeFile[];
    analysisResult: AnalysisResult | null;
    completedTasks: string[];
    onPublish: () => void;
}

const ROLE_ACCESS: Record<UserRole, { bronze: boolean, silver: boolean, gold: boolean }> = {
    leadDeveloper: { bronze: true, silver: true, gold: true },
    juniorDeveloper: { bronze: false, silver: true, gold: true },
    qaEngineer: { bronze: false, silver: false, gold: true },
};

const ZoneCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, isEnabled: boolean }> = ({ title, icon, children, isEnabled }) => (
    <div className={`flex-1 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 transition-opacity duration-300 ${!isEnabled ? 'opacity-40' : ''}`}>
        <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
            {icon}
            {title}
        </h3>
        <div className="space-y-3 text-sm">
            {children}
        </div>
    </div>
);

const Metric: React.FC<{ label: string; value: string | number; valueColor?: string; }> = ({ label, value, valueColor = 'text-gray-200' }) => (
    <div>
        <span className="text-gray-400">{label}:</span>
        <span className={`font-mono ml-2 ${valueColor}`}>{value}</span>
    </div>
);

export const DataFabricView: React.FC<DataFabricViewProps> = ({ files, analysisResult, completedTasks, onPublish }) => {
    const { t } = useLocalization();
    const [activeRole, setActiveRole] = useState<UserRole>('leadDeveloper');

    const issuesCount = (analysisResult?.circularDependencyFiles.length ?? 0) + (analysisResult?.deadCodeFiles.length ?? 0);
    const qualityScore = Math.max(0, 100 - issuesCount * 15); // Simple quality score calculation

    const roleAccess = ROLE_ACCESS[activeRole];

    return (
        <div className="p-4 space-y-4 text-sm flex flex-col h-full">
            <div className="flex-grow space-y-4">
                <div className="flex gap-4 items-start">
                    {/* Bronze Zone */}
                    <ZoneCard title={t('bronzeZoneTitle')} icon={<DatabaseStackIcon className="w-5 h-5 mr-2" />} isEnabled={roleAccess.bronze}>
                        <Metric label={t('sourceFiles')} value={files.length} />
                        <Metric label={t('statusSynced')} value="" valueColor="text-green-400" />
                    </ZoneCard>

                    <div className="text-cyan-400 text-2xl mt-8">&rarr;</div>

                    {/* Silver Zone */}
                    <ZoneCard title={t('silverZoneTitle')} icon={<ShieldCheckIcon className="w-5 h-5 mr-2" />} isEnabled={roleAccess.silver}>
                        <h4 className="font-semibold text-gray-300 -mb-2">{t('codeQualityAnalysis')}</h4>
                        <Metric label="Quality Score" value={`${qualityScore}%`} valueColor={qualityScore > 80 ? 'text-green-400' : 'text-yellow-400'} />
                        <Metric label={t('issuesFound')} value={issuesCount} valueColor={issuesCount > 0 ? 'text-red-400' : 'text-green-400'} />
                        <div className="pt-2 border-t border-gray-700/50">
                            <h4 className="font-semibold text-gray-300">{t('governanceChecks')}</h4>
                             <p className="flex items-center text-green-400"><CheckCircleIcon className="w-4 h-4 mr-2" />{t('securityPoliciesApplied')}</p>
                        </div>
                    </ZoneCard>
                    
                     <div className="text-cyan-400 text-2xl mt-8">&rarr;</div>

                    {/* Gold Zone */}
                    <ZoneCard title={t('goldZoneTitle')} icon={<SparklesIcon className="w-5 h-5 mr-2" />} isEnabled={roleAccess.gold}>
                        <h4 className="font-semibold text-gray-300">{t('refactoredCode')}</h4>
                        <p className="text-gray-400">{completedTasks.length} asset(s) curated.</p>
                         <button
                            onClick={onPublish}
                            className="w-full mt-2 flex items-center justify-center px-3 py-2 bg-gray-700 hover:bg-cyan-600 text-white font-semibold rounded-md transition-colors"
                         >
                            <GitHubIcon className="w-4 h-4 mr-2" />
                            {t('publishAsset')}
                        </button>
                    </ZoneCard>
                </div>
            </div>

            {/* Access Control Simulator */}
            <div className="flex-shrink-0 mt-auto p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-2">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    {t('accessControl')}
                </h3>
                <div className="flex justify-around items-center">
                    {(Object.keys(ROLE_ACCESS) as UserRole[]).map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${activeRole === role ? 'bg-cyan-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {t(role)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
