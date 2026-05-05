import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: <XCircle className="text-red-500" size={24} />,
      bg: 'bg-red-500',
      hover: 'hover:bg-red-600',
      border: 'border-red-500/20',
      text: 'text-red-500'
    },
    success: {
      icon: <CheckCircle className="text-green-500" size={24} />,
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      border: 'border-green-500/20',
      text: 'text-green-500'
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500" size={24} />,
      bg: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600',
      border: 'border-yellow-500/20',
      text: 'text-yellow-500'
    },
    info: {
      icon: <AlertTriangle className="text-blue-500" size={24} />,
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      border: 'border-blue-500/20',
      text: 'text-blue-500'
    }
  };

  const style = colors[type];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {style.icon}
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="px-6 py-6 bg-white/5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`${style.bg} ${style.hover} text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-black/20`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
