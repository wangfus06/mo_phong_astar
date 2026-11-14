import React, { useEffect, useRef, useState } from 'react';
import { Grip, X } from 'lucide-react';

interface PanelDialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'wide' | 'regular';
  icon?: React.ReactNode;
  placement?: 'center' | 'left';
  modal?: boolean;
}

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
type PanelRect = { x: number; y: number; width: number; height: number | null };
type PointerAction = { type: 'drag'; startX: number; startY: number; originX: number; originY: number } | { type: 'resize'; startX: number; startY: number; rect: DOMRect };

export const PanelDialog: React.FC<PanelDialogProps> = ({
  title,
  description,
  onClose,
  children,
  size = 'wide',
  icon,
  placement = 'center',
  modal = true,
}) => {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const pointerAction = useRef<PointerAction | null>(null);
  const [panelRect, setPanelRect] = useState<PanelRect>(() => ({
    x: 20,
    y: 84,
    width: typeof window === 'undefined' ? (size === 'wide' ? 448 : 384) : Math.min(size === 'wide' ? 448 : 384, window.innerWidth - 24),
    height: null,
  }));
  closeRef.current = onClose;

  useEffect(() => {
    if (placement !== 'left') return;
    const handlePointerMove = (event: PointerEvent) => {
      const action = pointerAction.current;
      if (!action) return;
      if (action.type === 'drag') {
        const maxX = Math.max(0, window.innerWidth - panelRect.width);
        const maxY = Math.max(0, window.innerHeight - 96);
        setPanelRect(rect => ({
          ...rect,
          x: Math.min(maxX, Math.max(0, action.originX + event.clientX - action.startX)),
          y: Math.min(maxY, Math.max(8, action.originY + event.clientY - action.startY)),
        }));
      } else {
        const maxWidth = Math.max(280, window.innerWidth - action.rect.left - 12);
        const maxHeight = Math.max(220, window.innerHeight - action.rect.top - 12);
        setPanelRect(rect => ({
          ...rect,
          width: Math.min(maxWidth, Math.max(280, action.rect.width + event.clientX - action.startX)),
          height: Math.min(maxHeight, Math.max(220, action.rect.height + event.clientY - action.startY)),
        }));
      }
    };
    const stopPointerAction = () => { pointerAction.current = null; };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopPointerAction);
    window.addEventListener('pointercancel', stopPointerAction);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopPointerAction);
      window.removeEventListener('pointercancel', stopPointerAction);
    };
  }, [placement, panelRect.width]);

  const beginDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (placement !== 'left' || (event.target as HTMLElement).closest('button')) return;
    pointerAction.current = { type: 'drag', startX: event.clientX, startY: event.clientY, originX: panelRect.x, originY: panelRect.y };
  };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerAction.current = { type: 'resize', startX: event.clientX, startY: event.clientY, rect };
  };

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
    (firstFocusable || dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (!modal || event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (modal) document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [modal]);

  return (
    <div
      className={placement === 'left'
        ? 'pointer-events-none fixed inset-0 z-40'
        : 'fixed inset-0 z-40 flex items-end justify-center bg-slate-900/15 p-0 backdrop-blur-[1px] sm:items-center sm:p-5'}
      onMouseDown={event => { if (modal && event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal={modal || undefined}
        aria-labelledby="panel-dialog-title"
        aria-describedby={description ? 'panel-dialog-description' : undefined}
        tabIndex={-1}
        className={`pointer-events-auto flex w-full flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl outline-none ${placement === 'left' ? 'max-h-full rounded-2xl' : `${size === 'wide' ? 'max-w-4xl' : 'max-w-xl'} max-h-[78dvh] rounded-t-2xl sm:max-h-[76dvh] sm:rounded-2xl`}`}
        style={placement === 'left' ? { position: 'absolute', left: panelRect.x, top: panelRect.y, width: panelRect.width, height: panelRect.height ?? undefined, maxHeight: `calc(100dvh - ${panelRect.y + 12}px)` } : undefined}
        onMouseDown={event => event.stopPropagation()}
      >
        <header onPointerDown={beginDrag} className={`flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white ${placement === 'left' ? 'cursor-grab touch-none px-4 py-3 active:cursor-grabbing' : 'px-4 py-3.5 sm:px-6 sm:py-4'}`}>
          <div className="flex min-w-0 items-center gap-3">
            {icon && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">{icon}</div>}
            <div className="min-w-0">
              <h2 id="panel-dialog-title" className="text-base font-bold leading-tight text-slate-900 sm:text-lg">{title}</h2>
              {description && <p id="panel-dialog-description" className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng hộp thoại" className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${placement === 'left' ? 'p-3' : 'p-3 sm:p-5'}`}>{children}</div>
        {placement === 'left' && <button type="button" aria-label="Äá»•i kÃ­ch thÆ°á»›c há»™p thoáº¡i" title="Kéo để đổi kích thước" onPointerDown={beginResize} className="absolute bottom-0 right-0 z-10 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center rounded-tl-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Grip className="h-3.5 w-3.5" /></button>}
      </section>
    </div>
  );
};
