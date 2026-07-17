import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,4,14,0.78)] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-[380px] bg-gradient-to-b from-navy-700 to-navy-800 border border-navy-600 rounded-2xl p-7 shadow-2xl animate-in">
        {children}
      </div>
    </div>
  );
}
