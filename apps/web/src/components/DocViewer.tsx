import { useState } from 'react';
import type { DocumentRecord, ChecklistItem } from '@vendorhub/shared';
import { ImageOff, ZoomIn, ZoomOut, Maximize2, CheckCircle2, AlertTriangle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { fileUrl } from '@/api/client';

const ICON = { pass: CheckCircle2, flag: AlertTriangle, fail: XCircle, pending: AlertTriangle };
const COLOR = { pass: 'text-pass', flag: 'text-flag', fail: 'text-fail', pending: 'text-muted' };

export const isPdf = (doc: DocumentRecord) => doc.mimeType === 'application/pdf';

/** Inline PDF: the browser's own viewer in an iframe, with an escape hatch to open it in a tab. */
export function PdfFrame({ doc, token, className = '', style }: { doc: DocumentRecord; token?: string; className?: string; style?: React.CSSProperties }) {
  const url = fileUrl(doc.id, token);
  return (
    <div className={`flex flex-col ${className}`} style={style}>
      <iframe src={`${url}${url.includes('?') ? '&' : '?'}view=inline#toolbar=0`} title={doc.fileName} className="min-h-[70vh] w-full flex-1 rounded-lg bg-white" />
      <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 self-end text-[11px] text-teal underline"><ExternalLink size={11} /> Open in new tab</a>
    </div>
  );
}

/** Vertical filmstrip of documents on the left, the selected page fitted to the screen on the right. */
export function DocViewer({ docs, slots, token }: { docs: DocumentRecord[]; slots: ChecklistItem[]; token?: string }) {
  const ordered = slots.map((s) => ({ slot: s, doc: docs.find((d) => d.slotId === s.id) })).filter((x) => x.doc) as { slot: ChecklistItem; doc: DocumentRecord }[];
  const [active, setActive] = useState(ordered[0]?.slot.id);
  const [zoom, setZoom] = useState(1);
  const cur = ordered.find((x) => x.slot.id === active) ?? ordered[0];
  const pdf = cur ? isPdf(cur.doc) : false;
  return (
    <div className="card sticky top-20 flex overflow-hidden" style={{ maxHeight: 'calc(100vh - 6.5rem)' }}>
      <aside className="flex w-28 shrink-0 flex-col gap-1.5 overflow-y-auto border-e border-greige bg-greige/40 p-2" aria-label="Documents">
        {ordered.map(({ slot, doc }) => {
          const I = ICON[doc.level];
          return (
            <button key={slot.id} onClick={() => setActive(slot.id)} className={`rounded-xl p-1.5 text-start transition ${cur?.slot.id === slot.id ? 'bg-white shadow-soft ring-1 ring-gold' : 'hover:bg-white/70'}`} aria-label={`Show ${slot.label}`} aria-pressed={cur?.slot.id === slot.id}>
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-white">
                {isPdf(doc) ? <FileText className="text-muted" aria-hidden="true" /> : <img src={fileUrl(doc.id, token)} alt="" className="h-full w-full object-cover object-top" loading="lazy" />}
                <I size={14} className={`absolute right-1 top-1 rounded-full bg-white ${COLOR[doc.level]}`} aria-hidden="true" />
              </div>
              <div className={`mt-1 line-clamp-2 text-[10px] leading-tight ${cur?.slot.id === slot.id ? 'text-ink' : 'text-body'}`}>{slot.label}</div>
            </button>
          );
        })}
        {ordered.length === 0 && <div className="p-2 text-[10px] text-muted">No documents yet</div>}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-greige px-4 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{cur?.slot.label ?? 'Document'}</div>
            <div className="truncate text-[11px] text-muted">{cur?.doc.fileName}{cur ? ` · v${cur.doc.version}` : ''}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted">
            {!pdf && (
              <>
                <button className="rounded p-1 hover:bg-greige disabled:opacity-40" onClick={() => setZoom((z) => Math.max(1, z - 0.25))} aria-label="Zoom out" disabled={zoom <= 1}><ZoomOut size={14} /></button>
                <span className="w-10 text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
                <button className="rounded p-1 hover:bg-greige" onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))} aria-label="Zoom in"><ZoomIn size={14} /></button>
              </>
            )}
            {cur && <a className="ms-1 rounded p-1 hover:bg-greige" href={fileUrl(cur.doc.id, token)} target="_blank" rel="noreferrer" aria-label="Open full size in a new tab"><Maximize2 size={14} /></a>}
          </div>
        </div>
        <div className={`flex-1 bg-greige/60 p-3 ${zoom > 1 && !pdf ? 'overflow-auto' : 'overflow-hidden'}`}>
          {cur ? (
            pdf ? (
              <PdfFrame doc={cur.doc} token={token} className="h-full" style={{ height: 'calc(100vh - 12.5rem)' }} />
            ) : (
              <img src={fileUrl(cur.doc.id, token)} alt={cur.doc.fileName} className="mx-auto block rounded-lg bg-white shadow-soft" style={zoom > 1 ? { width: `${zoom * 100}%`, maxWidth: 'none' } : { maxHeight: 'calc(100vh - 12.5rem)', width: 'auto', maxWidth: '100%' }} />
            )
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-muted"><ImageOff aria-hidden="true" /><span className="mt-2 text-sm">No documents yet</span></div>
          )}
        </div>
      </div>
    </div>
  );
}
