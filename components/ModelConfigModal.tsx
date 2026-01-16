
import React, { useState, useEffect } from 'react';
import type { ModelConfig } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, CpuChipIcon } from './icons';

interface ModelConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newConfig: ModelConfig) => void;
    currentConfig: ModelConfig;
}

const ALL_MODELS = {
    strategic: 'Cognito-Pro (Strategic)',
    fast: 'Aether-7B (Fast)',
    imaging: 'Visionary-XL (Imaging)',
};

const SYSTEM_OPTIONS = {
    wisdomEngine: [ALL_MODELS.strategic, ALL_MODELS.fast],
    imageGenesis: [ALL_MODELS.imaging],
    chatbot: [ALL_MODELS.strategic, ALL_MODELS.fast],
};

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ isOpen, onClose, onSave, currentConfig }) => {
    const { t } = useLocalization();
    const [localConfig, setLocalConfig] = useState<ModelConfig>(currentConfig);

    useEffect(() => {
        setLocalConfig(currentConfig);
    }, [currentConfig, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(localConfig);
    };

    const handleSelectChange = (system: keyof ModelConfig, value: string) => {
        setLocalConfig(prev => ({ ...prev, [system]: value }));
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="model-config-title"
        >
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 id="model-config-title" className="font-semibold text-lg text-gray-200 flex items-center">
                        <CpuChipIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('modelConfigTitle')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-400">{t('modelConfigDescription')}</p>
                    <div className="space-y-4">
                        {Object.entries(SYSTEM_OPTIONS).map(([system, models]) => (
                            <div key={system}>
                                <label htmlFor={`model-select-${system}`} className="block text-md font-medium text-gray-300 mb-1">
                                    {t(system as keyof typeof en)}
                                </label>
                                <select
                                    id={`model-select-${system}`}
                                    value={localConfig[system as keyof ModelConfig]}
                                    onChange={(e) => handleSelectChange(system as keyof ModelConfig, e.target.value)}
                                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                                >
                                    {models.map(model => (
                                        <option key={model} value={model}>
                                            {model.includes('Strategic') ? t('modelStrategic') : model.includes('Fast') ? t('modelFast') : t('modelImaging')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 flex justify-end space-x-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md transition-colors"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
