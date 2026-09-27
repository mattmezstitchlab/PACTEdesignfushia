import { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BadgeCheck, Bell, CalendarClock, Check,
  ChevronRight, FileText, Landmark, Loader2, Plus, Scale, ShieldAlert,
  Sparkles, Upload, Users, X, Info, FilePlus2, Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================
// PACTE — composants d'interface partagés.
// Un seul jeu de primitives (bouton, champ, modale, badges…) : chaque
// page les réutilise, ce qui garantit une identité visuelle cohérente
// dans toute l'application (voir src/index.css pour les styles).
// ============================================================

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="loading">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-fuchsia)' }} />
      <p>{label}</p>
    </div>
  );
}

export function Empty({ icon, titre, texte, action }: { icon?: React.ReactNode; titre: string; texte: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon || <Sparkles size={20} />}</div>
      <h3>{titre}</h3>
      <p>{texte}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'outline' | 'dark' }) {
  const { variant = 'primary', className = '', ...rest } = props;
  const cls: Record<string, string> = {
    primary: 'btn-pink', ghost: 'btn-ghost', soft: 'btn-soft', danger: 'btn-danger', outline: 'btn-outline', dark: 'btn-dark',
  };
  return <button {...rest} className={`btn ${cls[variant]} ${className}`} />;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export const inputCls = 'input';
export const selectCls = 'input';

export function Modal({ titre, sousTitre, onClose, children, large }: {
  titre: string; sousTitre?: string; onClose: () => void; children: React.ReactNode; large?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`modal ${large ? 'modal-lg' : ''}`}>
        <div className="modal-head">
          <div>
            <h2 className="font-display">{titre}</h2>
            {sousTitre && <p>{sousTitre}</p>}
          </div>
          <button onClick={onClose} className="icon-button"><X className="h-5 w-5" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function BadgeSante({ sante }: { sante: string | null | undefined }) {
  if (sante === 'critique') return <span className="badge badge-red"><ShieldAlert size={11} /> Critique</span>;
  if (sante === 'attention') return <span className="badge badge-pink"><AlertTriangle size={11} /> À surveiller</span>;
  return <span className="badge badge-green"><BadgeCheck size={11} /> Saine</span>;
}

export function BadgeStatut({ statut }: { statut: string | null | undefined }) {
  const map: Record<string, string> = {
    brouillon: 'badge-neutral', actif: 'badge-green', suspendu: 'badge-pink', termine: 'badge-neutral', archive: 'badge-neutral',
  };
  const labels: Record<string, string> = { brouillon: 'Brouillon', actif: 'Actif', suspendu: 'Suspendu', termine: 'Terminé', archive: 'Archivé' };
  return <span className={`badge ${map[statut || ''] || 'badge-neutral'}`}>{labels[statut || ''] || statut || '—'}</span>;
}

export function BadgeGravite({ gravite }: { gravite: string | null | undefined }) {
  if (gravite === 'critique') return <span className="badge badge-red">Critique</span>;
  if (gravite === 'attention') return <span className="badge badge-pink">Attention</span>;
  return <span className="badge badge-neutral">Info</span>;
}

// Bandeau de prudence — affiché partout où l'app analyse, suggère ou anticipe.
export function Prudence({ compact }: { compact?: boolean }) {
  return (
    <div className={`notice ${compact ? 'notice-compact' : ''}`}>
      <Scale size={18} />
      <p>
        <strong>Information organisée, pas une décision.</strong>{' '}
        PACTE structure vos faits, clauses et preuves et signale des points de vigilance. Il ne prédit aucune
        issue judiciaire et ne remplace ni avocat, ni notaire, ni professionnel du droit — consultez-les en cas
        d'enjeu ou de doute.
      </p>
    </div>
  );
}

export function SectionTitre({ icon, titre, sous, action }: { icon?: React.ReactNode; titre: string; sous?: string; action?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div className="flex items-start gap-3">
        {icon && <div className="section-heading-icon mt-0.5">{icon}</div>}
        <div>
          <h2 className="font-display">{titre}</h2>
          {sous && <p>{sous}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);
  const el = toast ? (
    <div className={`toast ${toast.type === 'ok' ? 'toast-ok' : 'toast-err'}`}>
      {toast.type === 'ok' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {toast.msg}
    </div>
  ) : null;
  return { toastEl: el, ok: (msg: string) => setToast({ type: 'ok', msg }), err: (msg: string) => setToast({ type: 'err', msg }) };
}

export { AlertTriangle, ArrowRight, BadgeCheck, Bell, CalendarClock, Check, ChevronRight, FileText, Landmark, Plus, Scale, ShieldAlert, Sparkles, Upload, Users, Info, FilePlus2, Search };
export { Link };
