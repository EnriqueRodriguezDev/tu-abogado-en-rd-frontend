import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

export const BaseModal = ({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }: BaseModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Content */}
            <div className={`relative bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-navy-700`}>
                {/* Header */}
                <div className="px-6 py-4 bg-navy-900 flex justify-between items-center">
                    <h3 className="text-lg font-serif font-bold text-gold-500">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-navy-900/50 border-t border-gray-100 dark:border-navy-700 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const AlertModal = ({ isOpen, onClose, title, message }: AlertModalProps) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-navy-900 text-white rounded-lg font-bold hover:bg-navy-800 transition-colors"
                >
                    Entendido
                </button>
            }
        >
            <div className="flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-full shrink-0">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <p className="text-gray-600 dark:text-gray-300">{message}</p>
                </div>
            </div>
        </BaseModal>
    );
};

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isProcessing?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isProcessing = false,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'primary'
}: ConfirmDialogProps) => {
    const confirmBtnClass = variant === 'danger'
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-navy-900 hover:bg-navy-800 text-white";

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={isProcessing ? () => { } : onClose}
            title={title}
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${confirmBtnClass} disabled:opacity-50`}
                    >
                        {isProcessing && <Loader2 size={16} className="animate-spin" />}
                        {confirmText}
                    </button>
                </>
            }
        >
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </BaseModal>
    );
};
