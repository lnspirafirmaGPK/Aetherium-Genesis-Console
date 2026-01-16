import React, { useState, useMemo } from 'react';
import type { Tier, TierId, FeeCalculationParams, UserEconomicProfile, ArchitectAccount, TransactionEntry, Notification, AiUsageLog } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { CurrencyDollarIcon, KeyIcon, ScaleIcon, UserCircleIcon, EyeIcon, ArchiveBoxIcon, CpuChipIcon, GlobeAltIcon, SparklesIcon, BanknotesIcon, ArrowUpOnSquareIcon, ClipboardDocumentListIcon } from './icons';
import { ConnectBankModal } from './ConnectBankModal';
import { ArchitectPayoutModal } from './ArchitectPayoutModal';
import { AetherBus } from '../services/aetherBus';
import type { TranslationKey } from '../localization';

const TIERS: Tier[] = [
    { id: 'tier1', nameKey: 'tier1Name', mechanismKey: 'tier1Mechanism', descriptionKey: 'tier1Desc', baseCost: 0 },
    { id: 'tier2', nameKey: 'tier2Name', mechanismKey: 'tier2Mechanism', descriptionKey: 'tier2Desc', baseCost: 15 },
    { id: 'tier3', nameKey: 'tier3Name', mechanismKey: 'tier3Mechanism', descriptionKey: 'tier3Desc', baseCost: 45 },
    { id: 'tier4', nameKey: 'tier4Name', mechanismKey: 'tier4Mechanism', descriptionKey: 'tier4Desc', baseCost: 120 },
    { id: 'tier5', nameKey: 'tier5Name', mechanismKey: 'tier5Mechanism', descriptionKey: 'tier5Desc', baseCost: 350 },
];

const TIER_ICONS: Record<TierId, React.ReactNode> = {
    tier1: <EyeIcon className="w-6 h-6" />,
    tier2: <ArchiveBoxIcon className="w-6 h-6" />,
    tier3: <CpuChipIcon className="w-6 h-6" />,
    tier4: <GlobeAltIcon className="w-6 h-6" />,
    tier5: <SparklesIcon className="w-6 h-6" />,
};

const USAGE_SAMPLES: { action: TranslationKey, complexity: number }[] = [
    { action: 'usageActionChat', complexity: 0.1 },
    { action: 'usageActionRefactor', complexity: 1.5 },
    { action: 'usageActionGenesis', complexity: 2.5 },
];

interface EconomicFabricViewProps {
    addNotification: (title: TranslationKey, message: TranslationKey, type: Notification['type'], data?: string) => void;
    userEmail: string;
}

const Slider: React.FC<{ label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min: number, max: number, step: number, displayFormat: (val: number) => string }> = 
({ label, value, onChange, min, max, step, displayFormat }) => (
    <div>
        <label className="flex justify-between items-center text-sm text-gray-400">
            <span>{label}</span>
            <span className="font-mono text-cyan-300">{displayFormat(value)}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

export const EconomicFabricView: React.FC<EconomicFabricViewProps> = ({ addNotification, userEmail }) => {
    const { t } = useLocalization();
    const [userProfile, setUserProfile] = useState<UserEconomicProfile>({ tier: 'tier1', goldenKey: false, isBankConnected: false, isSuspended: false });
    const [feeParams, setFeeParams] = useState<FeeCalculationParams>({ honestyScore: 0.8, marketAdjustment: 5 });
    const [aiUsageLog, setAiUsageLog] = useState<AiUsageLog[]>([]);

    const [isConnectBankModalOpen, setConnectBankModalOpen] = useState(false);
    const [isArchitectPayoutModalOpen, setArchitectPayoutModalOpen] = useState(false);
    const [architectAccount, setArchitectAccount] = useState<ArchitectAccount | null>(null);
    const [grossRevenue, setGrossRevenue] = useState(2500); // Simulated starting revenue
    const [transactionLedger, setTransactionLedger] = useState<TransactionEntry[]>([]);
    
    const isArchitect = userEmail === 'lnspirafirma@gmail.com';

    const selectedTier = TIERS.find(t => t.id === userProfile.tier) ?? TIERS[0];
    
    const usageFactor = useMemo(() => {
        return 1 + aiUsageLog.reduce((acc, log) => acc + log.complexity, 0);
    }, [aiUsageLog]);

    const finalFee = useMemo(() => {
        if (userProfile.goldenKey) return 0;
        const { baseCost } = selectedTier;
        const { honestyScore, marketAdjustment } = feeParams;
        // formula: final_fee = (base * usage_factor) * (1 - honesty_discount) ± market_adjustment
        const honestyDiscount = 1 - honestyScore;
        const calculatedFee = (baseCost * usageFactor) * (1 - honestyDiscount) + marketAdjustment;
        return Math.max(0, calculatedFee);
    }, [selectedTier, feeParams, userProfile.goldenKey, usageFactor]);

    const operatingCosts = useMemo(() => grossRevenue * 0.35, [grossRevenue]);
    const rsiFundAllocation = useMemo(() => grossRevenue * 0.15, [grossRevenue]);
    const netSurplus = useMemo(() => grossRevenue - operatingCosts - rsiFundAllocation, [grossRevenue, operatingCosts, rsiFundAllocation]);

    const handleConnectSuccess = () => {
        setUserProfile(p => ({ ...p, isBankConnected: true, isSuspended: false }));
        addNotification('notifBankConnectedTitle', 'notifBankConnectedMessage', 'success');
    };

    const handleSimulateBilling = () => {
        if (!userProfile.isBankConnected) {
            addNotification('notifBillingNotConnectedTitle', 'notifBillingNotConnectedMessage', 'info');
            return;
        }
        
        const paymentSuccess = Math.random() > 0.1; // 90% success rate
        if (paymentSuccess) {
            setGrossRevenue(prev => prev + finalFee);
            setUserProfile(p => ({ ...p, isSuspended: false }));
            setAiUsageLog([]); // Clear usage log after billing
            addNotification('notifBillingSuccessTitle', 'notifBillingSuccessMessage', 'success');
        } else {
            setUserProfile(p => ({ ...p, isSuspended: true }));
            addNotification('notifBillingFailedTitle', 'notifBillingFailedMessage', 'error');
            AetherBus.getInstance().publish('TIER_SUSPENSION_TRIGGERED', {});
        }
    };
    
    const handleSaveArchitectAccount = (account: ArchitectAccount) => {
        setArchitectAccount(account);
        addNotification('notifPayoutConfiguredTitle', 'notifPayoutConfiguredMessage', 'success');
    };

    const handleInitiateTransfer = () => {
        if (netSurplus <= 0 || !architectAccount) return;

        const newEntry: TransactionEntry = {
            id: `txn-${Date.now()}`,
            timestamp: Date.now(),
            amount: netSurplus,
            destination: architectAccount.accountNumber,
        };

        setTransactionLedger(prev => [newEntry, ...prev]);
        setGrossRevenue(prev => prev - netSurplus);
        addNotification('notifTransferSuccessTitle', 'notifTransferSuccessMessage', 'success', `$${netSurplus.toFixed(2)}`);
    };

    const simulateNewUsage = () => {
        const sample = USAGE_SAMPLES[Math.floor(Math.random() * USAGE_SAMPLES.length)];
        const newLog: AiUsageLog = {
            id: `usage-${Date.now()}`,
            ...sample,
            timestamp: Date.now(),
        };
        setAiUsageLog(prev => [newLog, ...prev]);
    };

    return (
        <div className="p-4 space-y-4 text-sm flex flex-col h-full overflow-y-auto">
            {/* User Profile & Golden Key */}
            <div className={`p-4 bg-gray-900/50 rounded-lg border ${userProfile.isSuspended ? 'border-red-500/50' : 'border-gray-700/50'}`}>
                <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                    <UserCircleIcon className="w-5 h-5 mr-2" />
                    {t('userEconomicProfile')}
                </h3>
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-gray-400">{t('currentTier')}: </span>
                        <span className="font-semibold text-gray-100">{t(selectedTier.nameKey)}</span>
                         {userProfile.isSuspended && <span className="ml-2 text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">{t('tierSuspended')}</span>}
                    </div>
                    <label className="flex items-center cursor-pointer">
                         <KeyIcon className="w-5 h-5 mr-2 text-yellow-400" />
                        <span className="font-semibold text-xs text-yellow-300 mr-3">{t('goldenKeyActive')}</span>
                        <div className="relative">
                            <input type="checkbox" checked={userProfile.goldenKey} onChange={() => setUserProfile(p => ({ ...p, goldenKey: !p.goldenKey }))} className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Tier Selection */}
            <div>
                <h3 className="text-md font-semibold text-gray-300 mb-2">{t('cognitiveTieringArchitecture')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TIERS.map(tier => (
                        <button
                            key={tier.id}
                            onClick={() => setUserProfile(p => ({ ...p, tier: tier.id, isSuspended: false }))}
                            className={`p-3 bg-gray-900/70 rounded-lg border-2 text-left transition-all duration-200
                                ${userProfile.tier === tier.id ? 'border-cyan-400 shadow-lg shadow-cyan-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                        >
                            <div className="flex items-center mb-2 text-cyan-300">
                                {TIER_ICONS[tier.id]}
                                <h4 className="font-bold ml-2">{t(tier.nameKey)}</h4>
                            </div>
                            <p className="text-xs text-gray-500 font-mono mb-2">{t(tier.mechanismKey)}</p>
                            <p className="text-xs text-gray-400">{t(tier.descriptionKey)}</p>
                            <p className="text-right mt-2 font-mono text-lg font-bold text-gray-200">
                                {tier.baseCost > 0 ? `$${tier.baseCost}` : t('tierFree')}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 {/* Dynamic Fee Calculator */}
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 flex flex-col space-y-3">
                    <h3 className="text-md font-semibold text-cyan-400 flex items-center">
                        <ScaleIcon className="w-5 h-5 mr-2" />
                        {t('dynamicFeeCalculator')}
                    </h3>
                    <Slider label={t('honestyScore')} value={feeParams.honestyScore} onChange={e => setFeeParams(p => ({ ...p, honestyScore: +e.target.value }))} min={0} max={1} step={0.01} displayFormat={v => `${(v * 100).toFixed(0)}%`} />
                    <Slider label={t('marketAdjustment')} value={feeParams.marketAdjustment} onChange={e => setFeeParams(p => ({ ...p, marketAdjustment: +e.target.value }))} min={-20} max={50} step={1} displayFormat={v => `$${v.toFixed(2)}`} />
                    <div className="pt-3 border-t border-gray-700/50">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-gray-300">{t('aiUsageLedger')}</h4>
                            <button onClick={simulateNewUsage} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded">{t('simulateUsage')}</button>
                        </div>
                        <div className="bg-gray-800/50 rounded mt-2 p-2 h-24 overflow-y-auto text-xs space-y-1">
                            {aiUsageLog.length === 0 ? <p className="text-gray-500 text-center pt-4">{t('noUsage')}</p> :
                                aiUsageLog.map(log => (
                                    <div key={log.id} className="flex justify-between items-center bg-gray-700/40 p-1 rounded">
                                        <span>{t(log.action)}</span>
                                        <span className="font-mono text-yellow-400">+{log.complexity.toFixed(2)}</span>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="flex justify-between text-xs font-semibold mt-1">
                            <span>{t('totalComplexity')} ({t('usageFactor')}):</span>
                            <span className="font-mono text-cyan-300">{usageFactor.toFixed(2)}x</span>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-gray-700/50 text-center mt-auto">
                        <p className="text-gray-400">{t('finalFee')}</p>
                        <p className={`font-mono text-3xl font-bold ${userProfile.goldenKey ? 'text-yellow-400' : 'text-green-400'}`}>
                            ${finalFee.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                        <BanknotesIcon className="w-5 h-5 mr-2" />
                        {t('financialSovereignty')}
                    </h3>
                    <div className="space-y-3">
                        <div>
                             <p className="text-gray-400">{t('accountConnected')}: <span className={userProfile.isBankConnected ? 'text-green-400 font-semibold' : 'text-gray-500'}>{userProfile.isBankConnected ? 'Yes' : 'No'}</span></p>
                             <button onClick={() => setConnectBankModalOpen(true)} className="w-full mt-2 text-sm text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">{userProfile.isBankConnected ? t('manageConnection') : t('connectAccount')}</button>
                        </div>
                        <div className="pt-3 border-t border-gray-700/50">
                             <p className="text-gray-400 mb-2">{t('billingCycle')}</p>
                             <button onClick={handleSimulateBilling} className="w-full text-sm text-center py-2 bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors">{t('simulateBilling')}</button>
                             {userProfile.isSuspended && <p className="text-xs text-red-400 mt-2">{t('paymentFailedMessage')}</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            {isArchitect && (
                <div className="p-4 bg-gray-900/50 rounded-lg border border-cyan-500/20 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                            <ArrowUpOnSquareIcon className="w-5 h-5 mr-2" />
                            {t('architecturalRoyalty')}
                        </h3>
                        {architectAccount ? (
                            <div className="text-gray-300">
                                <p><span className="font-semibold">{architectAccount.bankName}</span> - {architectAccount.accountHolder}</p>
                                <p className="font-mono text-sm">{architectAccount.accountNumber}</p>
                                <button onClick={() => setArchitectPayoutModalOpen(true)} className="w-full mt-2 text-xs text-center py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">{t('managePayout')}</button>
                            </div>
                        ) : (
                            <button onClick={() => setArchitectPayoutModalOpen(true)} className="w-full text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">{t('configurePayoutAccount')}</button>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                            <h4 className="font-semibold text-cyan-300 mb-2">{t('surplusValueFlow')}</h4>
                            <ul className="space-y-1 text-gray-300 text-xs">
                                <li className="flex justify-between"><span>{t('grossRevenue')}</span><span className="font-mono text-green-400">+ ${grossRevenue.toFixed(2)}</span></li>
                                <li className="flex justify-between"><span>{t('operatingCosts')}</span><span className="font-mono text-red-400">- ${operatingCosts.toFixed(2)}</span></li>
                                <li className="flex justify-between"><span>{t('rsiFundAllocation')}</span><span className="font-mono text-yellow-400">- ${rsiFundAllocation.toFixed(2)}</span></li>
                                <li className="flex justify-between border-t border-dashed border-gray-600 mt-1 pt-1 font-bold"><span>{t('netSurplus')}</span><span className="font-mono text-cyan-400">${netSurplus.toFixed(2)}</span></li>
                            </ul>
                            <button onClick={handleInitiateTransfer} disabled={netSurplus <= 0 || !architectAccount} className="w-full mt-3 text-sm text-center py-2 bg-green-700 hover:bg-green-600 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50">{t('initiateSurplusTransfer')}</button>
                            {!architectAccount && <p className="text-xs text-center mt-1 text-gray-500">{t('payoutAccountNotConfigured')}</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                           <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                           {t('transactionLedger')}
                        </h3>
                        <div className="bg-gray-800/50 rounded-lg p-2 h-64 overflow-y-auto">
                            {transactionLedger.length === 0 ? (
                                <p className="text-center text-gray-500 pt-8">{t('noTransactions')}</p>
                            ) : (
                                <ul className="space-y-2">
                                    {transactionLedger.map(tx => (
                                        <li key={tx.id} className="p-2 bg-gray-700/50 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-green-400">${tx.amount.toFixed(2)}</span>
                                                <span className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono">To: {tx.destination}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConnectBankModal 
                isOpen={isConnectBankModalOpen}
                onClose={() => setConnectBankModalOpen(false)}
                onSuccess={handleConnectSuccess}
            />
            <ArchitectPayoutModal
                isOpen={isArchitectPayoutModalOpen}
                onClose={() => setArchitectPayoutModalOpen(false)}
                onSave={handleSaveArchitectAccount}
            />
        </div>
    );
};