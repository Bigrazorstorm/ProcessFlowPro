import { useState, useEffect, useCallback } from 'react';
import {
  PenLine,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  FileSignature,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface SignerRecord {
  userId: string;
  userName: string;
  email?: string;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  comment?: string;
}

interface RevisionEntry {
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  comment?: string;
}

interface SignatureRequest {
  id: string;
  title: string;
  description?: string;
  documentId?: string;
  documentName?: string;
  status: 'draft' | 'pending' | 'partially_signed' | 'completed' | 'rejected' | 'cancelled';
  signers: SignerRecord[];
  requiredSignatureCount: number;
  signedCount: number;
  dueDate?: string;
  requestedBy: string;
  requestedByName: string;
  revisionHistory: RevisionEntry[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  pending: 'Ausstehend',
  partially_signed: 'Teilweise signiert',
  completed: 'Abgeschlossen',
  rejected: 'Abgelehnt',
  cancelled: 'Abgebrochen',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partially_signed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const SIGNER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const SIGNER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  signed: 'Signiert',
  rejected: 'Abgelehnt',
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'rejected':
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'partially_signed':
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <FileSignature className="w-4 h-4 text-gray-400" />;
  }
};

interface CreateFormData {
  title: string;
  description: string;
  documentName: string;
  signerIds: string;
  dueDate: string;
}

const emptyForm: CreateFormData = {
  title: '',
  description: '',
  documentName: '',
  signerIds: '',
  dueDate: '',
};

export default function Signatures() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionTarget, setActionTarget] = useState<{ id: string; type: 'sign' | 'reject' } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get<SignatureRequest[]>('/signatures', {
        params: filterStatus ? { status: filterStatus } : {},
      });
      setRequests(resp.data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError('Titel ist erforderlich.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const signerIds = form.signerIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.post('/signatures', {
        title: form.title,
        description: form.description || undefined,
        documentName: form.documentName || undefined,
        signerIds,
        dueDate: form.dueDate || undefined,
      });
      await load();
      setShowForm(false);
      setForm(emptyForm);
    } catch {
      setError('Fehler beim Erstellen. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async (id: string) => {
    try {
      await api.post(`/signatures/${id}/sign`, { comment: actionComment || undefined });
      setActionTarget(null);
      setActionComment('');
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Fehler beim Signieren');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/signatures/${id}/reject`, { comment: actionComment || undefined });
      setActionTarget(null);
      setActionComment('');
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Fehler beim Ablehnen');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Signaturanforderung wirklich abbrechen?')) return;
    try {
      await api.delete(`/signatures/${id}`);
      await load();
    } catch {
      // ignore
    }
  };

  const isSigner = (req: SignatureRequest) => req.signers.some((s) => s.userId === user?.id);
  const mySignerStatus = (req: SignatureRequest) => req.signers.find((s) => s.userId === user?.id)?.status;
  const canSign = (req: SignatureRequest) =>
    isSigner(req) &&
    mySignerStatus(req) === 'pending' &&
    req.status !== 'completed' &&
    req.status !== 'cancelled';

  const filtered = filterStatus ? requests.filter((r) => r.status === filterStatus) : requests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digitale Signaturen</h1>
          <p className="text-muted-foreground mt-1">
            Dokumente signieren, Freigabe-Workflows verwalten und Revisionssicherheit gewährleisten
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setForm(emptyForm); setError(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Signaturanforderung
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Ausstehend', status: 'pending', color: 'text-yellow-600' },
          { label: 'Teilweise signiert', status: 'partially_signed', color: 'text-blue-600' },
          { label: 'Abgeschlossen', status: 'completed', color: 'text-green-600' },
          { label: 'Abgelehnt', status: 'rejected', color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.status} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilterStatus(filterStatus === s.status ? '' : s.status)}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {requests.filter((r) => r.status === s.status).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {filterStatus && (
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus('')}>
            <X className="w-3 h-3 mr-1" />
            Filter löschen
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Neue Signaturanforderung</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Titel *</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="z.B. Jahresabschluss 2025 – Freigabe"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Beschreibung</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Optionale Beschreibung"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Dokumentname</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="z.B. Lohnabrechnung_Jan2026.pdf"
                  value={form.documentName}
                  onChange={(e) => setForm((f) => ({ ...f, documentName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fälligkeitsdatum</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Unterzeichner (Benutzer-IDs, kommagetrennt)</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="uuid1, uuid2, …"
                  value={form.signerIds}
                  onChange={(e) => setForm((f) => ({ ...f, signerIds: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Geben Sie die Benutzer-IDs der Unterzeichner ein. Leer lassen für Entwurf ohne Unterzeichner.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={saving}>
                <Check className="w-4 h-4 mr-2" />
                {saving ? 'Erstellen…' : 'Erstellen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action dialog */}
      {actionTarget && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">
              {actionTarget.type === 'sign' ? '✍️ Dokument signieren' : '❌ Anforderung ablehnen'}
            </p>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Optionaler Kommentar"
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={actionTarget.type === 'sign' ? 'default' : 'destructive'}
                onClick={() => actionTarget.type === 'sign' ? handleSign(actionTarget.id) : handleReject(actionTarget.id)}
              >
                {actionTarget.type === 'sign' ? (
                  <><PenLine className="w-3 h-3 mr-1" />Jetzt signieren</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" />Ablehnen</>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setActionTarget(null); setActionComment(''); }}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileSignature className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">
              {requests.length === 0 ? 'Noch keine Signaturanforderungen.' : 'Keine Anforderungen gefunden.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((req) => (
            <Card key={req.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <StatusIcon status={req.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{req.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                      {req.documentName && (
                        <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
                          📄 {req.documentName}
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                      <span>Von {req.requestedByName}</span>
                      <span>
                        {req.signedCount}/{req.requiredSignatureCount} Signaturen
                      </span>
                      {req.dueDate && (
                        <span className={new Date(req.dueDate) < new Date() && req.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                          Fällig: {new Date(req.dueDate).toLocaleDateString('de-DE')}
                        </span>
                      )}
                      <span>{new Date(req.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>

                    {/* Signers */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.signers.map((s) => (
                        <span
                          key={s.userId}
                          className={`text-xs px-2 py-0.5 rounded-full ${SIGNER_STATUS_COLORS[s.status]}`}
                          title={SIGNER_STATUS_LABELS[s.status]}
                        >
                          {s.status === 'signed' ? '✓' : s.status === 'rejected' ? '✗' : '…'} {s.userName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Sign / Reject buttons for current user */}
                    {canSign(req) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs"
                          onClick={() => { setActionTarget({ id: req.id, type: 'sign' }); setActionComment(''); }}
                        >
                          <PenLine className="w-3 h-3 mr-1" />
                          Signieren
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                          onClick={() => { setActionTarget({ id: req.id, type: 'reject' }); setActionComment(''); }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Ablehnen
                        </Button>
                      </>
                    )}
                    {/* Cancel (only creator, not completed) */}
                    {req.requestedBy === user?.id && req.status !== 'completed' && req.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Abbrechen"
                        onClick={() => handleCancel(req.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Expand revision history */}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Revisionsprotokoll"
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    >
                      {expandedId === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Revision history */}
                {expandedId === req.id && req.revisionHistory.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                      <History className="w-3 h-3" />
                      Revisionsprotokoll (revisionssicher)
                    </div>
                    <div className="space-y-2">
                      {req.revisionHistory.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                          <div>
                            <span className="font-medium">{entry.performedByName}</span>
                            {' '}
                            <span className="text-muted-foreground">
                              {entry.action === 'created' ? 'hat die Anforderung erstellt' :
                               entry.action === 'signed' ? 'hat das Dokument signiert' :
                               entry.action === 'rejected' ? 'hat die Anforderung abgelehnt' :
                               entry.action === 'cancelled' ? 'hat die Anforderung abgebrochen' :
                               entry.action}
                            </span>
                            {' '}
                            <span className="text-muted-foreground">
                              am {new Date(entry.timestamp).toLocaleString('de-DE')}
                            </span>
                            {entry.comment && (
                              <span className="italic text-muted-foreground"> – „{entry.comment}"</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <p className="text-sm text-muted-foreground text-right">
          {filtered.length} von {requests.length} Anforderung{requests.length !== 1 ? 'en' : ''} angezeigt
        </p>
      )}
    </div>
  );
}
