import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Zap, ToggleLeft, ToggleRight, Edit2, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

interface TriggerRule {
  id: string;
  name: string;
  event: string;
  action: string;
  notificationTitle?: string;
  notificationMessage?: string;
  isActive: boolean;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  'step.completed': 'Step abgeschlossen',
  'step.started': 'Step gestartet',
  'step.overdue': 'Step überfällig',
  'workflow.completed': 'Workflow abgeschlossen',
  'workflow.started': 'Workflow gestartet',
};

const ACTION_LABELS: Record<string, string> = {
  send_notification: 'Benachrichtigung senden',
  send_email: 'E-Mail senden',
};

const EVENT_OPTIONS = Object.entries(EVENT_LABELS);
const ACTION_OPTIONS = Object.entries(ACTION_LABELS);

interface TriggerFormData {
  name: string;
  event: string;
  action: string;
  notificationTitle: string;
  notificationMessage: string;
}

const emptyForm: TriggerFormData = {
  name: '',
  event: 'step.completed',
  action: 'send_notification',
  notificationTitle: '',
  notificationMessage: '',
};

export default function WorkflowTriggers() {
  const [triggers, setTriggers] = useState<TriggerRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TriggerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTriggers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<TriggerRule[]>('/workflow-triggers');
      setTriggers(response.data);
    } catch {
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTriggers();
  }, [loadTriggers]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (trigger: TriggerRule) => {
    setForm({
      name: trigger.name,
      event: trigger.event,
      action: trigger.action,
      notificationTitle: trigger.notificationTitle || '',
      notificationMessage: trigger.notificationMessage || '',
    });
    setEditingId(trigger.id);
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name ist erforderlich.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (editingId) {
        await api.patch(`/workflow-triggers/${editingId}`, form);
      } else {
        await api.post('/workflow-triggers', form);
      }
      await loadTriggers();
      closeForm();
    } catch {
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (trigger: TriggerRule) => {
    try {
      await api.patch(`/workflow-triggers/${trigger.id}`, { isActive: !trigger.isActive });
      setTriggers((prev) =>
        prev.map((t) => (t.id === trigger.id ? { ...t, isActive: !t.isActive } : t)),
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Trigger-Regel wirklich löschen?')) return;
    try {
      await api.delete(`/workflow-triggers/${id}`);
      setTriggers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow-Trigger</h1>
          <p className="text-muted-foreground mt-1">
            Automatische Aktionen bei Workflow-Ereignissen konfigurieren
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Trigger
        </Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              {editingId ? 'Trigger bearbeiten' : 'Neuen Trigger erstellen'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={closeForm}>
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
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="z.B. Benachrichtigung bei Step-Abschluss"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Ereignis (Event)</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.event}
                  onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))}
                >
                  {EVENT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Aktion</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.action}
                  onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                >
                  {ACTION_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Benachrichtigungs-Titel</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="z.B. Step abgeschlossen: {{stepName}}"
                  value={form.notificationTitle}
                  onChange={(e) => setForm((f) => ({ ...f, notificationTitle: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium">Nachricht</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={2}
                  placeholder="Verwende {{stepName}}, {{clientName}}, {{workflowName}} als Platzhalter"
                  value={form.notificationMessage}
                  onChange={(e) => setForm((f) => ({ ...f, notificationMessage: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Platzhalter: <code>{'{{stepName}}'}</code>, <code>{'{{clientName}}'}</code>,{' '}
                  <code>{'{{workflowName}}'}</code>
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeForm}>
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

      {/* Trigger list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : triggers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Zap className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Keine Trigger-Regeln vorhanden.</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Ersten Trigger erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => (
            <Card
              key={trigger.id}
              className={`transition-opacity ${trigger.isActive ? '' : 'opacity-60'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        trigger.isActive ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Zap
                        className={`w-5 h-5 ${trigger.isActive ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{trigger.name}</h3>
                        {!trigger.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {EVENT_LABELS[trigger.event] || trigger.event}
                        </Badge>
                        <span className="text-muted-foreground text-xs">→</span>
                        <Badge variant="outline" className="text-xs">
                          {ACTION_LABELS[trigger.action] || trigger.action}
                        </Badge>
                      </div>
                      {trigger.notificationTitle && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Titel: &quot;{trigger.notificationTitle}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={trigger.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      onClick={() => handleToggleActive(trigger)}
                    >
                      {trigger.isActive ? (
                        <ToggleRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Bearbeiten"
                      onClick={() => openEdit(trigger)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Löschen"
                      onClick={() => handleDelete(trigger.id)}
                      className="text-destructive hover:text-destructive"
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
    </div>
  );
}
