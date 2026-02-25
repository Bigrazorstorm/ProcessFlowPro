import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInstances, WorkflowStepStatus, WorkflowInstanceStatus } from '../hooks/useInstances';
import { api } from '../lib/api';

interface TemplateStep {
  id: string;
  name: string;
  type: string;
  role: string;
  description?: string;
  tips?: string;
  checklistItems: any[];
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
}

interface Client {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  name: string;
  fileType: string;
  url?: string;
  uploadedByName?: string;
  createdAt: string;
}

export function InstanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInstance, getProgress, completeStep, shiftStepNextMonth, updateStepStatus, addComment, getComments } = useInstances();
  
  const [instance, setInstance] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [rejectModal, setRejectModal] = useState<{ stepId: string; reason: string } | null>(null);
  const [attachments, setAttachments] = useState<{ [stepId: string]: Attachment[] }>({});
  const [newAttachment, setNewAttachment] = useState<{ stepId: string; name: string; url: string; fileType: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [instanceData, progressData] = await Promise.all([
        getInstance(id),
        getProgress(id),
      ]);

      setInstance(instanceData);
      setProgress(progressData);

      const [clientRes, templateRes] = await Promise.all([
        api.get<Client>(`/clients/${instanceData.clientId}`),
        api.get<Template>(`/workflow-templates/${instanceData.templateId}`),
      ]);

      setClient(clientRes.data);
      setTemplate(templateRes.data);

      const stepsWithTemplateData = await Promise.all(
        instanceData.steps.map(async (step: WorkflowStep) => {
          try {
            const templateStepRes = await api.get(`/workflow-templates/steps/${step.templateStepId}`);
            return { ...step, templateStep: templateStepRes.data };
          } catch (err) {
            return step;
          }
        })
      );

      setInstance({ ...instanceData, steps: stepsWithTemplateData });
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Instanz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Scroll to current active step after data loads
  useEffect(() => {
    if (!instance || loading) return;
    const steps: WorkflowStep[] = instance.steps || [];
    const currentStep = steps.find(
      (s) => s.status === WorkflowStepStatus.IN_PROGRESS || s.status === WorkflowStepStatus.OPEN
    );
    if (currentStep && stepRefs.current[currentStep.id]) {
      const el = stepRefs.current[currentStep.id];
      setTimeout(() => {
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [instance, loading]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleCompleteStep = async (stepId: string) => {
    setActionLoading(stepId + '_complete');
    try {
      await completeStep(stepId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShiftStep = async (stepId: string) => {
    setActionLoading(stepId + '_shift');
    try {
      await shiftStepNextMonth(stepId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectStep = async () => {
    if (!rejectModal || !rejectModal.reason.trim()) return;
    setActionLoading(rejectModal.stepId + '_reject');
    try {
      await updateStepStatus(rejectModal.stepId, WorkflowStepStatus.REJECTED, rejectModal.reason);
      setRejectModal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleComments = async (stepId: string) => {
    if (activeComments === stepId) {
      setActiveComments(null);
    } else {
      setActiveComments(stepId);
      if (!comments[stepId]) {
        try {
          const stepComments = await getComments(stepId);
          setComments({ ...comments, [stepId]: stepComments });
        } catch (err: any) {
          console.error(err.message);
        }
      }
    }
  };

  const handleAddComment = async (stepId: string) => {
    if (!commentText.trim()) return;
    try {
      const newComment = await addComment(stepId, commentText);
      setComments({ ...comments, [stepId]: [...(comments[stepId] || []), newComment] });
      setCommentText('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const loadAttachments = async (stepId: string) => {
    try {
      const res = await api.get<Attachment[]>('/documents', {
        params: { linkedEntityType: 'workflow_step', linkedEntityId: stepId },
      });
      setAttachments((prev) => ({ ...prev, [stepId]: res.data }));
    } catch (err) {
      // ignore
    }
  };

  const handleAddAttachment = async () => {
    if (!newAttachment || !newAttachment.name.trim()) return;
    try {
      await api.post('/documents', {
        name: newAttachment.name,
        fileType: newAttachment.fileType || 'other',
        url: newAttachment.url || undefined,
        linkedEntityType: 'workflow_step',
        linkedEntityId: newAttachment.stepId,
      });
      await loadAttachments(newAttachment.stepId);
      setNewAttachment(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadgeClass = (status: WorkflowStepStatus) => {
    switch (status) {
      case WorkflowStepStatus.OPEN: return 'bg-gray-100 text-gray-700';
      case WorkflowStepStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case WorkflowStepStatus.PENDING_APPROVAL: return 'bg-yellow-100 text-yellow-800';
      case WorkflowStepStatus.DONE: return 'bg-green-100 text-green-800';
      case WorkflowStepStatus.SHIFTED: return 'bg-orange-100 text-orange-800';
      case WorkflowStepStatus.SKIPPED: return 'bg-orange-100 text-orange-800';
      case WorkflowStepStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: WorkflowStepStatus) => {
    switch (status) {
      case WorkflowStepStatus.OPEN: return 'Offen';
      case WorkflowStepStatus.IN_PROGRESS: return 'In Bearbeitung';
      case WorkflowStepStatus.PENDING_APPROVAL: return 'Wartet auf Freigabe';
      case WorkflowStepStatus.DONE: return 'Erledigt';
      case WorkflowStepStatus.SHIFTED: return 'Verschoben';
      case WorkflowStepStatus.SKIPPED: return 'Übersprungen';
      case WorkflowStepStatus.REJECTED: return 'Abgelehnt';
      default: return status;
    }
  };

  const getInstanceStatusLabel = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE: return 'Aktiv';
      case WorkflowInstanceStatus.DELAYED: return 'Verzögert';
      case WorkflowInstanceStatus.CRITICAL: return 'Kritisch';
      case WorkflowInstanceStatus.COMPLETED: return 'Abgeschlossen';
      case WorkflowInstanceStatus.ARCHIVED: return 'Archiviert';
      default: return status;
    }
  };

  const getInstanceStatusBadgeClass = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE: return 'bg-blue-100 text-blue-800';
      case WorkflowInstanceStatus.DELAYED: return 'bg-yellow-100 text-yellow-800';
      case WorkflowInstanceStatus.CRITICAL: return 'bg-red-100 text-red-800';
      case WorkflowInstanceStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case WorkflowInstanceStatus.ARCHIVED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isStepDone = (status: WorkflowStepStatus) => status === WorkflowStepStatus.DONE;
  const isStepActive = (status: WorkflowStepStatus) =>
    status === WorkflowStepStatus.OPEN || status === WorkflowStepStatus.IN_PROGRESS || status === WorkflowStepStatus.SHIFTED;

  const getFileTypeIcon = (fileType: string) => {
    if (fileType === 'pdf') return '📄';
    if (fileType === 'image') return '🖼️';
    if (fileType === 'excel') return '📊';
    if (fileType === 'word') return '📝';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-gray-600">Laden...</div>
        </div>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/workflows')} className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Instanz nicht gefunden'}</p>
        </div>
      </div>
    );
  }

  const steps: WorkflowStep[] = instance.steps || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/workflows')} className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zu Workflow-Instanzen
        </button>
      </div>

      {/* Instance Info Card */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client?.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{template?.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getInstanceStatusBadgeClass(instance.status)}`}>
                {getInstanceStatusLabel(instance.status)}
              </span>
              <span className="text-xs text-gray-500">
                Periode: {instance.periodMonth}/{instance.periodYear}
              </span>
              <span className="text-xs text-gray-500">
                Erstellt: {new Date(instance.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Fortschritt</span>
              <span className="text-xs text-gray-500">
                {progress.completedSteps}/{progress.totalSteps} ({progress.percentComplete}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>In Bearbeitung: {progress.inProgressSteps}</span>
              <span>Verschoben: {progress.blockedSteps}</span>
            </div>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step: WorkflowStep, index: number) => {
          const isDone = isStepDone(step.status);
          const isActive = isStepActive(step.status);
          const isExpanded = expandedSteps.has(step.id);

          return (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[step.id] = el; }}
              className={`rounded-lg border transition-all duration-200 ${
                isDone
                  ? 'bg-gray-50 border-gray-200 opacity-75'
                  : isActive
                  ? 'bg-white border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Collapsed header - always visible */}
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => toggleStep(step.id)}
              >
                {/* Step indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  isDone
                    ? 'bg-green-100 text-green-700'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step name and status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-sm ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {step.templateStep?.name || `Schritt ${index + 1}`}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(step.status)}`}>
                      {getStatusLabel(step.status)}
                    </span>
                    {step.dueDate && !isDone && (
                      <span className="text-xs text-gray-400">
                        Fällig: {new Date(step.dueDate).toLocaleDateString('de-DE')}
                      </span>
                    )}
                    {isDone && step.completedAt && (
                      <span className="text-xs text-green-600">
                        ✓ {new Date(step.completedAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand/collapse icon */}
                <svg
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3 space-y-3">
                    {/* Description */}
                    {step.templateStep?.description && (
                      <p className="text-sm text-gray-600">{step.templateStep.description}</p>
                    )}

                    {/* Tips */}
                    {step.templateStep?.tips && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded p-2 text-sm text-yellow-800">
                        <span className="font-medium">💡 Tipp:</span> {step.templateStep.tips}
                      </div>
                    )}

                    {/* Checklist */}
                    {step.templateStep?.checklistItems && step.templateStep.checklistItems.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Checkliste:</p>
                        <ul className="space-y-1">
                          {step.templateStep.checklistItems.map((item: any, idx: number) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600 gap-2">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {item.text}
                              {item.required && <span className="text-red-500 text-xs">*</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isDone && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={actionLoading === step.id + '_complete'}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Abschließen
                        </button>
                        <button
                          onClick={() => handleShiftStep(step.id)}
                          disabled={actionLoading === step.id + '_shift'}
                          className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Verschieben (nächster Monat)
                        </button>
                        <button
                          onClick={() => setRejectModal({ stepId: step.id, reason: '' })}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Ablehnen
                        </button>
                      </div>
                    )}

                    {/* Attachments */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-700">Anhänge</p>
                        <button
                          onClick={() => {
                            loadAttachments(step.id);
                            setNewAttachment({ stepId: step.id, name: '', url: '', fileType: 'pdf' });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Anhang hinzufügen
                        </button>
                      </div>

                      {/* Load attachments on demand */}
                      {attachments[step.id] === undefined && (
                        <button
                          onClick={() => loadAttachments(step.id)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Anhänge laden
                        </button>
                      )}

                      {attachments[step.id] && attachments[step.id].length === 0 && (
                        <p className="text-xs text-gray-400">Keine Anhänge</p>
                      )}

                      {attachments[step.id] && attachments[step.id].length > 0 && (
                        <div className="space-y-1">
                          {attachments[step.id].map((att) => (
                            <div key={att.id} className="flex items-center gap-2 text-sm">
                              <span>{getFileTypeIcon(att.fileType)}</span>
                              {att.url ? (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                  {att.name}
                                </a>
                              ) : (
                                <span className="text-gray-700 truncate">{att.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add attachment form */}
                      {newAttachment?.stepId === step.id && (
                        <div className="mt-2 bg-gray-50 rounded p-2 space-y-2">
                          <input
                            type="text"
                            placeholder="Name des Anhangs"
                            value={newAttachment.name}
                            onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="url"
                            placeholder="URL (optional)"
                            value={newAttachment.url}
                            onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <select
                            value={newAttachment.fileType}
                            onChange={(e) => setNewAttachment({ ...newAttachment, fileType: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="pdf">PDF</option>
                            <option value="image">Bild</option>
                            <option value="excel">Excel</option>
                            <option value="word">Word</option>
                            <option value="other">Sonstiges</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddAttachment}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={() => setNewAttachment(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    <div className="border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleToggleComments(step.id)}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Kommentare {comments[step.id] ? `(${comments[step.id].length})` : ''}
                      </button>

                      {activeComments === step.id && (
                        <div className="mt-2 space-y-2">
                          {comments[step.id] && comments[step.id].length > 0 ? (
                            <div className="space-y-1">
                              {comments[step.id].map((comment: any) => (
                                <div key={comment.id} className="bg-gray-50 rounded p-2">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-medium text-gray-800">{comment.userName || 'Nutzer'}</span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(comment.createdAt).toLocaleString('de-DE')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.text || comment.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Noch keine Kommentare</p>
                          )}

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Kommentar hinzufügen..."
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(step.id); }}
                            />
                            <button
                              onClick={() => handleAddComment(step.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Senden
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schritt ablehnen</h2>
            <p className="text-sm text-gray-600 mb-3">Bitte geben Sie einen Grund für die Ablehnung an:</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3}
              placeholder="Ablehnungsgrund..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-red-500 focus:border-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleRejectStep}
                disabled={!rejectModal.reason.trim() || actionLoading === rejectModal.stepId + '_reject'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
