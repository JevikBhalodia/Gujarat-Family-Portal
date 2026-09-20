import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-md'
}) {
  const drawerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      drawerRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`w-full ${width} h-full bg-surface border-l border-line p-6 text-ink shadow-xl focus:outline-none flex flex-col justify-between overflow-y-auto`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <h2 id="drawer-title" className="text-lg font-bold text-ink leading-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] text-muted hover:text-ink hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Drawer;
