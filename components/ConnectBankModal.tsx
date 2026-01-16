import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, BanknotesIcon, SpinnerIcon, CheckCircleIcon } from './icons';

interface ConnectBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success';

export const ConnectBankModal: React.FC<ConnectBankModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useLocalization();
    const [status, setStatus] = useState<ConnectionStatus>('idle');

    if (!isOpen) {
        return null;
    }

    const handleConnect = () => {
        setStatus('connecting');
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onSuccess();
                onClose();
                setStatus('idle');
            }, 1000);
        }, 1500);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-bank-title"
        >
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 id="connect-bank-title" className="font-semibold text-lg text-gray-200 flex items-center">
                        <BanknotesIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('connectBankTitle')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {status === 'idle' && <p className="text-gray-300">{t('connectBankMessage')}</p>}
                    {status === 'connecting' && (
                        <div className="flex flex-col items-center justify-center h-24">
                            <SpinnerIcon className="w-8 h-8 animate-spin text-cyan-400" />
                            <p className="mt-3 text-gray-400">{t('connecting')}</p>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="flex flex-col items-center justify-center h-24">
                            <CheckCircleIcon className="w-10 h-10 text-green-400" />
                            <p className="mt-3 text-gray-300 font-semibold">{t('notifBankConnectedTitle')}</p>
                        </div>
                    )}
                </div>
                {status === 'idle' && (
                    <div className="p-4 bg-gray-900/50 flex justify-end space-x-3 rounded-b-lg">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleConnect}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md transition-colors"
                        >
                            {t('connectAndAuthorize')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
