import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal: traps Tab inside, closes on Esc or backdrop click, returns focus to the opener. */
export function Modal({ title, eyebrow, onClose, children, wide = false, footer }: { title: ReactNode; eyebrow?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? box.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4" onClick={onClose}>
      <div ref={box} tabIndex={-1} className={`card flex max-h-[92vh] w-full flex-col p-6 outline-none ${wide ? 'max-w-4xl' : 'max-w-lg'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id="modal-title" className="text-2xl">{title}</h2>
          </div>
          <button className="btn-ghost -mr-2 -mt-2 p-1" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-auto">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-greige pt-4">{footer}</div>}
      </div>
    </div>
  );
}
