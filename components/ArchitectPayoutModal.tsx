import React, { useState } from 'react';
import type { ArchitectAccount } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, ArrowUpOnSquareIcon } from './icons';

interface ArchitectPayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: ArchitectAccount) => void;
}

export const ArchitectPayoutModal: React.FC<ArchitectPayoutModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useLocalization();
    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        if (bankName && accountHolder && accountNumber) {
            onSave({
                bankName,
                accountHolder,
                accountNumber: `**** **** **** ${accountNumber.slice(-4)}`, // Mask for display
            });
            onClose();
        }
    };
    
    const isFormValid = bankName && accountHolder && accountNumber.length > 4;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payout-modal-title"
        >
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 id="payout-modal-title" className="font-semibold text-lg text-gray-200 flex items-center">
                        <ArrowUpOnSquareIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('payoutModalTitle')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-400">{t('payoutModalDescription')}</p>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="bank-name" className="block text-sm font-medium text-gray-400 mb-1">{t('bankName')}</label>
                            <input
                                type="text"
                                id="bank-name"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                            />
                        </div>
                        <div>
                            <label htmlFor="account-holder" className="block text-sm font-medium text-gray-400 mb-1">{t('accountHolder')}</label>
                            <input
                                type="text"
                                id="account-holder"
                                value={accountHolder}
                                onChange={(e) => setAccountHolder(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                            />
                        </div>
                        <div>
                            <label htmlFor="account-number" className="block text-sm font-medium text-gray-400 mb-1">{t('accountNumber')}</label>
                            <input
                                type="text"
                                id="account-number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-200"
                            />
                        </div>
                    </form>
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
                        disabled={!isFormValid}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
