import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { CheckCircleIcon, ShieldCheckIcon, CpuChipIcon, ClipboardDocumentListIcon, SpinnerIcon } from './icons';

const StatCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
        <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
            {icon} {title}
        </h3>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);

const Metric: React.FC<{ label: string; value: string | number; valueColor?: string; unit?: string }> = ({ label, value, valueColor = 'text-green-400', unit = '' }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400">{label}</span>
        <span className={`font-mono font-bold ${valueColor}`}>{value}{unit}</span>
    </div>
);

export const SystemAssuranceView: React.FC = () => {
    const { t } = useLocalization();
    const [stats, setStats] = useState({
        unitTests: 98,
        integrationTests: 95,
        e2eTests: 99,
        vulnerabilities: 0,
        apiLatency: 45,
        uptime: 99.9,
    });
    const [overallStatus, setOverallStatus] = useState<'nominal' | 'warning' | 'critical'>('nominal');
    
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                unitTests: Math.min(100, prev.unitTests + Math.floor(Math.random() * 3) - 1),
                integrationTests: Math.min(100, prev.integrationTests + Math.floor(Math.random() * 3) - 1),
                e2eTests: Math.min(100, prev.e2eTests + Math.floor(Math.random() * 3) - 1),
                vulnerabilities: Math.max(0, prev.vulnerabilities + (Math.random() > 0.95 ? 1 : 0)),
                apiLatency: Math.max(20, prev.apiLatency + Math.floor(Math.random() * 7) - 3),
                uptime: Math.max(99, parseFloat((prev.uptime + (Math.random() - 0.4) * 0.01).toFixed(2))),
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const { unitTests, integrationTests, vulnerabilities, apiLatency, uptime } = stats;
        if (vulnerabilities > 2 || uptime < 99.5 || apiLatency > 150) {
            setOverallStatus('critical');
        } else if (unitTests < 90 || integrationTests < 85 || apiLatency > 100) {
            setOverallStatus('warning');
        } else {
            setOverallStatus('nominal');
        }
    }, [stats]);
    
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'nominal': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'critical': return 'text-red-400';
            default: return 'text-gray-400';
        }
    }

    return (
        <div className="p-4 space-y-4 text-sm flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <h2 className="text-lg font-bold text-cyan-300">{t('systemAssuranceDashboard')}</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{t('overallSystemStatus')}:</span>
                    <span className={`font-bold text-lg ${getStatusColor(overallStatus)}`}>{t(overallStatus)}</span>
                    {overallStatus !== 'nominal' && <SpinnerIcon className="w-5 h-5 animate-spin" />}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title={t('testSuiteStatus')} icon={<CheckCircleIcon className="w-5 h-5 mr-2" />}>
                    <Metric label={t('unitTests')} value={stats.unitTests} unit=" %" />
                    <Metric label={t('integrationTests')} value={stats.integrationTests} unit=" %" />
                    <Metric label={t('e2eTests')} value={stats.e2eTests} unit=" %" />
                </StatCard>
                
                <StatCard title={t('securityScan')} icon={<ShieldCheckIcon className="w-5 h-5 mr-2" />}>
                     <Metric label={t('vulnerabilityScan')} value={stats.vulnerabilities > 0 ? `${stats.vulnerabilities} found` : t('secure')} valueColor={stats.vulnerabilities > 0 ? 'text-red-400' : 'text-green-400'} />
                     <Metric label={t('firewallStatus')} value={t('active')} />
                </StatCard>

                <StatCard title={t('performanceBenchmarks')} icon={<CpuChipIcon className="w-5 h-5 mr-2" />}>
                     <Metric label={t('apiLatency')} value={stats.apiLatency} unit=" ms" valueColor={stats.apiLatency > 100 ? 'text-yellow-400' : 'text-green-400'}/>
                     <Metric label={t('systemUptime')} value={stats.uptime} unit=" %" valueColor={stats.uptime < 99.9 ? 'text-yellow-400' : 'text-green-400'} />
                </StatCard>
                
                <StatCard title={t('complianceReport')} icon={<ClipboardDocumentListIcon className="w-5 h-5 mr-2" />}>
                     <Metric label={t('iso27001')} value={t('certified')} />
                     <Metric label={t('soc2')} value={t('compliant')} />
                </StatCard>
            </div>
        </div>
    );
};
