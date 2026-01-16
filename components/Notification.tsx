import React, { useState, useEffect } from 'react';
import type { Notification as NotificationType } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { CheckCircleIcon, WarningIcon, EnvelopeIcon } from './icons';

interface NotificationProps {
    notification: NotificationType;
    onDismiss: (id: number) => void;
}

const ICONS: Record<NotificationType['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
    error: <WarningIcon className="w-6 h-6 text-red-400" />,
    info: <EnvelopeIcon className="w-6 h-6 text-cyan-400" />,
};

export const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
    const { t } = useLocalization();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true); // Trigger fade-in
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300); // Wait for fade-out before removing
        }, 5000);

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const messageText = notification.data
        ? t(notification.message).replace('{data}', notification.data)
        : t(notification.message);

    return (
        <div
            className={`flex items-start p-4 m-2 max-w-sm w-full bg-gray-800 border border-gray-700 shadow-lg rounded-lg transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
        >
            <div className="flex-shrink-0">
                {ICONS[notification.type]}
            </div>
            <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-100">{t(notification.title)}</p>
                <p className="mt-1 text-sm text-gray-400">{messageText}</p>
            </div>
        </div>
    );
};