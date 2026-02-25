import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  File,
  FileSpreadsheet,
  Image,
  Download,
  Link,
  Search,
  X,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';

interface DocumentRecord {
  id: string;
  name: string;
  description?: string;
  fileType: string;
  url?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  linkedEntityName?: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
}

const FILE_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'word', label: 'Word' },
  { value: 'csv', label: 'CSV' },
  { value: 'image', label: 'Bild' },
  { value: 'other', label: 'Sonstiges' },
];

const LINKED_ENTITY_OPTIONS = [
  { value: '', label: 'Kein Bezug' },
  { value: 'client', label: 'Mandant' },
  { value: 'workflow', label: 'Workflow' },
];

const FILE_TYPE_BADGES: Record<string, string> = {
  pdf: 'bg-red-100 text-red-700',
  excel: 'bg-green-100 text-green-700',
  word: 'bg-blue-100 text-blue-700',
  csv: 'bg-yellow-100 text-yellow-700',
  image: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

const FileIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'excel':
    case 'csv':
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case 'image':
      return <Image className="w-5 h-5 text-purple-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
};

interface DocFormData {
  name: string;
  description: string;
  fileType: string;
  url: string;
  linkedEntityType: string;
  linkedEntityId: string;
  linkedEntityName: string;
}

const emptyForm: DocFormData = {
  name: '',
  description: '',
  fileType: 'pdf',
  url: '',
  linkedEntityType: '',
  linkedEntityId: '',
  linkedEntityName: '',
};

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DocFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<DocumentRecord[]>('/documents');
      setDocuments(response.data);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name ist erforderlich.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        description: form.description || undefined,
        fileType: form.fileType,
        url: form.url || undefined,
        linkedEntityType: form.linkedEntityType || undefined,
        linkedEntityId: form.linkedEntityId || undefined,
        linkedEntityName: form.linkedEntityName || undefined,
      };
      await api.post('/documents', payload);
      await loadDocuments();
      setShowForm(false);
      setForm(emptyForm);
    } catch {
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  };

  const filtered = documents.filter((d) => {
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.linkedEntityName || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || d.fileType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dokumentenverwaltung</h1>
          <p className="text-muted-foreground mt-1">
            Dokumente verwalten und mit Mandanten oder Workflows verknüpfen
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setForm(emptyForm); setError(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Dokument hinzufügen
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suchen…"
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Alle Typen</option>
          {FILE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Neues Dokument hinzufügen</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="z.B. Lohnabrechnung Januar 2026"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Dokumenttyp</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.fileType}
                  onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value }))}
                >
                  {FILE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium">Beschreibung</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Optionale Beschreibung"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium">URL / Pfad</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://… oder Dateipfad"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Verknüpfung</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.linkedEntityType}
                  onChange={(e) => setForm((f) => ({ ...f, linkedEntityType: e.target.value }))}
                >
                  {LINKED_ENTITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {form.linkedEntityType && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    {form.linkedEntityType === 'client' ? 'Mandantenname' : 'Workflow-Name'}
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Name eingeben"
                    value={form.linkedEntityName}
                    onChange={(e) => setForm((f) => ({ ...f, linkedEntityName: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Check className="w-4 h-4 mr-2" />
                {saving ? 'Speichern…' : 'Speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">
              {documents.length === 0
                ? 'Noch keine Dokumente vorhanden.'
                : 'Keine Dokumente gefunden.'}
            </p>
            {documents.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setShowForm(true); setForm(emptyForm); setError(null); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Erstes Dokument hinzufügen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileIcon type={doc.fileType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{doc.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${FILE_TYPE_BADGES[doc.fileType] || FILE_TYPE_BADGES.other}`}
                      >
                        {doc.fileType.toUpperCase()}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {doc.linkedEntityName && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Link className="w-3 h-3" />
                          {doc.linkedEntityType === 'client' ? 'Mandant' : 'Workflow'}:{' '}
                          {doc.linkedEntityName}
                        </span>
                      )}
                      {doc.uploadedByName && (
                        <span className="text-xs text-muted-foreground">
                          Hochgeladen von {doc.uploadedByName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Öffnen / Herunterladen"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Löschen"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <p className="text-sm text-muted-foreground text-right">
          {filtered.length} von {documents.length} Dokument{documents.length !== 1 ? 'en' : ''} angezeigt
        </p>
      )}
    </div>
  );
}
