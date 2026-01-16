import React, { useState, useMemo } from 'react';
import type { Tier, TierId, FeeCalculationParams, UserEconomicProfile } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { CurrencyDollarIcon, KeyIcon, ScaleIcon, UserCircleIcon, EyeIcon, ArchiveBoxIcon, CpuChipIcon, GlobeAltIcon, SparklesIcon } from './icons';

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

export const EconomicFabricView: React.FC = () => {
    const { t } = useLocalization();
    // FIX: Added missing properties `isBankConnected` and `isSuspended` to the initial state to conform to the `UserEconomicProfile` type.
    const [userProfile, setUserProfile] = useState<UserEconomicProfile>({ tier: 'tier1', goldenKey: true, isBankConnected: false, isSuspended: false });
    const [feeParams, setFeeParams] = useState<FeeCalculationParams>({
        usageFactor: 1.0,
        honestyDiscount: 0.2,
        marketAdjustment: 5,
    });

    const selectedTier = TIERS.find(t => t.id === userProfile.tier) ?? TIERS[0];
    
    const finalFee = useMemo(() => {
        if (userProfile.goldenKey) return 0;
        const { baseCost } = selectedTier;
        const { usageFactor, honestyDiscount, marketAdjustment } = feeParams;
        return Math.max(0, (baseCost * usageFactor) * (1 - honestyDiscount) + marketAdjustment);
    }, [selectedTier, feeParams, userProfile.goldenKey]);

    return (
        <div className="p-4 space-y-4 text-sm flex flex-col h-full overflow-y-auto">
            {/* User Profile & Golden Key */}
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                    <UserCircleIcon className="w-5 h-5 mr-2" />
                    {t('userEconomicProfile')}
                </h3>
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-gray-400">{t('currentTier')}: </span>
                        <span className="font-semibold text-gray-100">{t(selectedTier.nameKey)}</span>
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
                            onClick={() => setUserProfile(p => ({ ...p, tier: tier.id }))}
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

            {/* Fee Calculator & Fund Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                        <ScaleIcon className="w-5 h-5 mr-2" />
                        {t('integrityAnalyzer')}
                    </h3>
                    <div className="space-y-3">
                       <Slider label={t('usageFactor')} value={feeParams.usageFactor} onChange={e => setFeeParams(p => ({ ...p, usageFactor: +e.target.value }))} min={0.5} max={2} step={0.1} displayFormat={v => `${v.toFixed(1)}x`} />
                       <Slider label={t('honestyDiscount')} value={feeParams.honestyDiscount} onChange={e => setFeeParams(p => ({ ...p, honestyDiscount: +e.target.value }))} min={0} max={0.5} step={0.05} displayFormat={v => `${(v * 100).toFixed(0)}%`} />
                       <Slider label={t('marketAdjustment')} value={feeParams.marketAdjustment} onChange={e => setFeeParams(p => ({ ...p, marketAdjustment: +e.target.value }))} min={-20} max={50} step={1} displayFormat={v => `$${v.toFixed(2)}`} />

                        <div className="pt-3 border-t border-gray-700/50 text-center">
                            <p className="text-gray-400">{t('finalFee')}</p>
                            <p className={`font-mono text-3xl font-bold ${userProfile.goldenKey ? 'text-yellow-400' : 'text-green-400'}`}>
                                ${finalFee.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
                 <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <h3 className="text-md font-semibold text-cyan-400 flex items-center mb-3">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                        {t('integrationFundManagement')}
                    </h3>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex justify-between"><span>{t('fundApiCredits')}</span><span className="font-mono">60%</span></li>
                        <li className="flex justify-between"><span>{t('fundInfrastructure')}</span><span className="font-mono">25%</span></li>
                        <li className="flex justify-between"><span>{t('fundRsiLoop')}</span><span className="font-mono">15%</span></li>
                    </ul>
                     <p className="text-xs text-gray-500 mt-4">{t('complianceNote')}</p>
                </div>
            </div>
        </div>
    );
};