import React, { useEffect, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { CloseIcon, UserCircleIcon, FileIcon, CheckCircleIcon, ImageIcon, DocumentScannerIcon } from './icons';

interface UserProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    filesManaged: number;
    protocolsExecuted: number;
    imagesSynthesized: number; // Mocked data
    analysesPerformed: number; // Mocked data
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string }> = ({ icon, label, value }) => (
    <div className="bg-gray-900/70 p-4 rounded-lg flex items-center space-x-4">
        <div className="flex-shrink-0 text-cyan-400">{icon}</div>
        <div>
            <div className="text-sm text-gray-400">{label}</div>
            <div className="text-2xl font-bold text-gray-100">{value}</div>
        </div>
    </div>
);


export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
    isOpen,
    onClose,
    userEmail,
    filesManaged,
    protocolsExecuted,
    imagesSynthesized,
    analysesPerformed,
}) => {
    const { t } = useLocalization();
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            setTimeout(() => closeButtonRef.current?.focus(), 0);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-profile-title"
        >
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 id="user-profile-title" className="font-semibold text-lg text-gray-200 flex items-center">
                        <UserCircleIcon className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('userProfile')}
                    </h3>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                             <UserCircleIcon className="w-8 h-8 text-cyan-300" />
                        </div>
                        <div>
                             <p className="font-semibold text-gray-100">{t('user')}</p>
                             <p className="text-sm text-gray-400">{userEmail}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">{t('firmaContribution')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatCard icon={<FileIcon className="w-8 h-8"/>} label={t('filesManaged')} value={filesManaged} />
                            <StatCard icon={<CheckCircleIcon className="w-8 h-8"/>} label={t('protocolsExecuted')} value={protocolsExecuted} />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">{t('genesisCreations')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <StatCard icon={<ImageIcon className="w-8 h-8"/>} label={t('imagesSynthesized')} value={imagesSynthesized} />
                           <StatCard icon={<DocumentScannerIcon className="w-8 h-8"/>} label={t('analysesPerformed')} value={analysesPerformed} />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900/50 flex justify-end rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
                    >
                        {t('logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};
