import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { DocumentRecord } from '@vendorhub/shared';
import { fileUrl } from '@/api/client';
import { PdfFrame, isPdf } from './DocViewer';

/** Full-size document preview. Esc closes; focus returns to the element that opened it. */
export function DocPreview({ doc, token, onClose }: { doc: DocumentRecord; token?: string; onClose: () => void }) {
  const url = fileUrl(doc.id, token);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-4" onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-2 shadow-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={doc.fileName}>
        <button ref={closeRef} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-ink shadow" onClick={onClose} aria-label="Close preview"><X size={16} /></button>
        {isPdf(doc) ? <PdfFrame doc={doc} token={token} style={{ height: '85vh' }} /> : <img src={url} alt={doc.fileName} className="mx-auto max-h-[85vh] w-auto rounded-xl" />}
        <div className="px-3 py-2 text-xs text-muted">{doc.fileName}</div>
      </div>
    </div>
  );
}
