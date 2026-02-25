import { useState, useEffect } from 'react';
import { useInstances, WorkflowInstanceStatus, WorkflowStepStatus } from '../hooks/useInstances';
import { CreateInstanceModal } from '../components/CreateInstanceModal';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
}

interface TemplateStep {
  id: string;
  name: string;
  type: string;
  description?: string;
  tips?: string[];
  errors?: string[];
  checklist?: any[];
  deadlineRule?: any;
}

interface WorkflowStep {
  id: string;
  templateStepId: string;
  status: WorkflowStepStatus;
  assignedUserId?: string;
  dueDate?: string;
  completedAt?: string;
  checklistProgress: any[];
  templateStep?: TemplateStep;
  attachments?: any[];
}

interface DetailInstance {
  id: string;
  clientId: string;
  templateId: string;
  status: WorkflowInstanceStatus;
  periodYear: number;
  periodMonth: number;
  steps: WorkflowStep[];
  createdAt: string;
}

export function Instances() {
  const { instances, loading, error } = useInstances();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [detailInstance, setDetailInstance] = useState<DetailInstance | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [statusChangeStep, setStatusChangeStep] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<WorkflowStepStatus | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');

  // Load clients and templates for list
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [clientsRes, templatesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/workflow-templates'),
        ]);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  // Load detail when instance is selected
  useEffect(() => {
    if (selectedInstanceId) {
      loadInstanceDetail(selectedInstanceId);
    }
  }, [selectedInstanceId]);

  const loadInstanceDetail = async (instanceId: string) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/workflow-instances/${instanceId}`);
      const instance = response.data;

      // Load template step details
      const stepsWithTemplates = await Promise.all(
        instance.steps.map(async (step: WorkflowStep) => {
          try {
            const templateRes = await api.get(`/workflow-templates/steps/${step.templateStepId}`);
            return { ...step, templateStep: templateRes.data };
          } catch {
            return step;
          }
        })
      );

      setDetailInstance({ ...instance, steps: stepsWithTemplates });
    } catch (err) {
      console.error('Error loading instance detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (stepId: string) => {
    if (!newStatus || !detailInstance) return;

    try {
      await api.patch(`/workflow-execution/steps/${stepId}/status`, {
        status: newStatus,
        reason: statusChangeReason,
      });

      // Reload detail
      await loadInstanceDetail(detailInstance.id);
      setStatusChangeStep(null);
      setNewStatus(null);
      setStatusChangeReason('');
    } catch (err: any) {
      alert(err.message || 'Fehler beim Ändern des Status');
    }
  };

  const handleAddComment = async (stepId: string) => {
    if (!commentText.trim() || !detailInstance) return;

    try {
      const response = await api.post(`/workflow-execution/steps/${stepId}/comments`, {
        text: commentText,
      });

      setComments({
        ...comments,
        [stepId]: [...(comments[stepId] || []), response.data],
      });
      setCommentText('');
    } catch (err: any) {
      alert(err.message || 'Fehler beim Hinzufügen des Kommentars');
    }
  };

  const loadComments = async (stepId: string) => {
    if (comments[stepId]) return;

    try {
      const response = await api.get(`/workflow-execution/steps/${stepId}/comments`);
      setComments(prev => ({ ...prev, [stepId]: response.data }));
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unbekannt';
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unbekannt';
  };

  const getStatusBadgeClass = (status: WorkflowInstanceStatus | WorkflowStepStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE:
      case WorkflowStepStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case WorkflowInstanceStatus.DELAYED:
        return 'bg-yellow-100 text-yellow-800';
      case WorkflowInstanceStatus.CRITICAL:
        return 'bg-red-100 text-red-800';
      case WorkflowInstanceStatus.COMPLETED:
      case WorkflowStepStatus.DONE:
        return 'bg-green-100 text-green-800';
      case WorkflowInstanceStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      case WorkflowStepStatus.OPEN:
        return 'bg-gray-100 text-gray-800';
      case WorkflowStepStatus.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case WorkflowStepStatus.SHIFTED:
        return 'bg-orange-100 text-orange-800';
      case WorkflowStepStatus.SKIPPED:
        return 'bg-purple-100 text-purple-800';
      case WorkflowStepStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: WorkflowInstanceStatus | WorkflowStepStatus) => {
    const labels: { [key: string]: string } = {
      active: 'Aktiv',
      delayed: 'Verzögert',
      critical: 'Kritisch',
      completed: 'Abgeschlossen',
      archived: 'Archiviert',
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      pending_approval: 'Wartet auf Freigabe',
      done: 'Erledigt',
      shifted: 'Verschoben',
      skipped: 'Übersprungen',
      rejected: 'Abgelehnt',
    };
    return labels[status] || status;
  };

  const getStepProgress = (instance: any) => {
    if (!instance.steps || instance.steps.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = instance.steps.filter((s: any) => s.status === 'done').length;
    const total = instance.steps.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  const filteredInstances = instances.filter(instance => {
    const matchesStatus = filterStatus === 'all' || instance.status === filterStatus;
    const clientName = getClientName(instance.clientId).toLowerCase();
    const templateName = getTemplateName(instance.templateId).toLowerCase();
    const matchesSearch = searchTerm === '' || 
      clientName.includes(searchTerm.toLowerCase()) ||
      templateName.includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Laden...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  // Detail View
  if (selectedInstanceId && detailInstance) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setSelectedInstanceId(null);
                setDetailInstance(null);
              }}
              className="text-blue-600 hover:text-blue-800 flex items-center mb-3"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zur Liste
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {getClientName(detailInstance.clientId)}
            </h1>
            <p className="text-gray-600 mt-1">{getTemplateName(detailInstance.templateId)}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(detailInstance.status)}`}>
              {getStatusLabel(detailInstance.status)}
            </span>
            <p className="text-sm text-gray-600 mt-2">
              Periode: {detailInstance.periodMonth}/{detailInstance.periodYear}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {detailInstance.steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Gesamtfortschritt</span>
              <span className="text-sm text-gray-600">
                {getStepProgress(detailInstance).completed}/{getStepProgress(detailInstance).total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${getStepProgress(detailInstance).percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps Detail View */}
        <div className="space-y-4">
          {detailLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Lädt Schritte...</div>
            </div>
          ) : detailInstance.steps.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Keine Schritte definiert</p>
            </div>
          ) : (
            detailInstance.steps.map((step, index) => (
              <div 
                key={step.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${
                  step.status === WorkflowStepStatus.DONE ? 'border-l-green-500 bg-green-50' :
                  step.status === WorkflowStepStatus.IN_PROGRESS ? 'border-l-blue-500' :
                  step.status === WorkflowStepStatus.REJECTED ? 'border-l-red-500 bg-red-50' :
                  'border-l-gray-300'
                }`}
              >
                {/* Step Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {step.templateStep?.name || `Schritt ${index + 1}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(step.status)}`}>
                              {getStatusLabel(step.status)}
                            </span>
                            {step.templateStep?.type && (
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                {step.templateStep.type === 'task' ? 'Aufgabe' :
                                 step.templateStep.type === 'approval' ? 'Freigabe' :
                                 step.templateStep.type === 'decision' ? 'Entscheidung' : 'Benachrichtigung'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {step.dueDate && (
                      <div className="text-right text-sm">
                        <p className="text-gray-600">Fällig:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(step.dueDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Details */}
                <div className="p-6 space-y-4">
                  {step.templateStep?.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Beschreibung</h4>
                      <p className="text-sm text-gray-600">{step.templateStep.description}</p>
                    </div>
                  )}

                  {/* Tips */}
                  {step.templateStep?.tips && step.templateStep.tips.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Tipps:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {step.templateStep.tips.map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Errors/Warnings */}
                  {step.templateStep?.errors && step.templateStep.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Wichtige Hinweise:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {step.templateStep.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Checklist */}
                  {step.templateStep?.checklist && step.templateStep.checklist.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Checkliste:</h4>
                      <ul className="space-y-1">
                        {step.templateStep.checklist.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {item.text}
                            {item.required && <span className="ml-1 text-red-500">*</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meta Information */}
                  {step.completedAt && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Abgeschlossen:</span> {new Date(step.completedAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                  {/* Status Change */}
                  {step.status !== WorkflowStepStatus.DONE && step.status !== WorkflowStepStatus.REJECTED && (
                    <div>
                      {statusChangeStep === step.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Neuer Status
                            </label>
                            <select
                              value={newStatus || ''}
                              onChange={(e) => setNewStatus(e.target.value as WorkflowStepStatus)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- Status auswählen --</option>
                              {step.status === WorkflowStepStatus.OPEN && (
                                <>
                                  <option value={WorkflowStepStatus.IN_PROGRESS}>In Bearbeitung</option>
                                  <option value={WorkflowStepStatus.SKIPPED}>Übersprungen</option>
                                </>
                              )}
                              {step.status === WorkflowStepStatus.IN_PROGRESS && (
                                <>
                                  <option value={WorkflowStepStatus.DONE}>Abgeschlossen</option>
                                  <option value={WorkflowStepStatus.SHIFTED}>Verschieben</option>
                                  <option value={WorkflowStepStatus.REJECTED}>Ablehnen</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Grund (optional)
                            </label>
                            <textarea
                              value={statusChangeReason}
                              onChange={(e) => setStatusChangeReason(e.target.value)}
                              placeholder="Grund für die Änderung..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(step.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                              Bestätigen
                            </button>
                            <button
                              onClick={() => {
                                setStatusChangeStep(null);
                                setNewStatus(null);
                                setStatusChangeReason('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setStatusChangeStep(step.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Status ändern
                        </button>
                      )}
                    </div>
                  )}

                  {/* Comments */}
                  <div className="border-t pt-4">
                    <button
                      onClick={() => {
                        setActiveComments(activeComments === step.id ? null : step.id);
                        if (activeComments !== step.id) loadComments(step.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 2z" />
                      </svg>
                      Kommentare ({comments[step.id]?.length || 0})
                    </button>

                    {activeComments === step.id && (
                      <div className="mt-3 space-y-3">
                        {comments[step.id] && comments[step.id].length > 0 ? (
                          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                            {comments[step.id].map((comment) => (
                              <div key={comment.id} className="bg-white border border-gray-200 rounded p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString('de-DE')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mb-3">Noch keine Kommentare</p>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Kommentar hinzufügen..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(step.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(step.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Senden
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workflow-Abrechnungsläufe</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Neuer Abrechnungslauf
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mandant oder Template..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status</option>
              <option value={WorkflowInstanceStatus.ACTIVE}>Aktiv</option>
              <option value={WorkflowInstanceStatus.DELAYED}>Verzögert</option>
              <option value={WorkflowInstanceStatus.CRITICAL}>Kritisch</option>
              <option value={WorkflowInstanceStatus.COMPLETED}>Abgeschlossen</option>
              <option value={WorkflowInstanceStatus.ARCHIVED}>Archiviert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instances List */}
      {filteredInstances.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Abrechnungsläufe</h3>
          <p className="mt-1 text-sm text-gray-500">Erstellen Sie einen neuen Abrechnungslauf.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Neuer Abrechnungslauf
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInstances.map((instance) => {
            const progress = getStepProgress(instance);
            return (
              <button
                key={instance.id}
                onClick={() => setSelectedInstanceId(instance.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getClientName(instance.clientId)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getTemplateName(instance.templateId)} • Periode {instance.periodMonth}/{instance.periodYear}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(instance.status)}`}>
                    {getStatusLabel(instance.status)}
                  </span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {progress.completed}/{progress.total}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Klicken Sie zum Bearbeiten
                </p>
              </button>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateInstanceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
