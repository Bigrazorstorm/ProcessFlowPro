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
  checklistItems: any[];
  tips?: string[];
  errors?: string[];
  deadlineRule?: any;
}

interface WorkflowStep {
  id: string;
  templateStepId: string;
  status: WorkflowStepStatus;
  assignedUserId?: string;
  estimationValue?: number;
  dueDate?: string;
  completedAt?: string;
  checklistProgress: any[];
  templateStep?: TemplateStep;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface Client {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
}

export function InstanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInstance, getProgress, startStep, completeStep, updateStepStatus, addComment, getComments } = useInstances();
  
  const [instance, setInstance] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<{ [key: string]: Attachment[] }>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  
  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hasScrolled = useRef(false);

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

      // Load client and template details
      const [clientRes, templateRes] = await Promise.all([
        api.get<Client>(`/clients/${instanceData.clientId}`),
        api.get<Template>(`/workflow-templates/${instanceData.templateId}`),
      ]);

      setClient(clientRes.data);
      setTemplate(templateRes.data);

      // Load template step details for each workflow step
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

  // Auto-scroll to current step after load
  useEffect(() => {
    if (!instance || !instance.steps || hasScrolled.current) return;
    
    // Find the first step that is IN_PROGRESS or the first OPEN step
    const currentStepIndex = instance.steps.findIndex(
      (step: WorkflowStep) => step.status === WorkflowStepStatus.IN_PROGRESS || step.status === WorkflowStepStatus.OPEN
    );
    
    if (currentStepIndex > 0) {
      // Delay scroll to allow UI to render
      const timer = setTimeout(() => {
        const stepId = instance.steps[currentStepIndex].id;
        const element = stepRefs.current[stepId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Auto-expand the current step
          setExpandedSteps(prev => new Set([...prev, stepId]));
        }
        hasScrolled.current = true;
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [instance]);

  const handleStartStep = async (stepId: string) => {
    try {
      await startStep(stepId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    try {
      await completeStep(stepId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSkipStep = async (stepId: string) => {
    const reason = prompt('Grund für das Überspringen:');
    if (!reason) return;
    
    try {
      await updateStepStatus(stepId, WorkflowStepStatus.SKIPPED, reason);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShiftStep = async (stepId: string) => {
    // Shift to next month - using SHIFTED status
    try {
      await updateStepStatus(stepId, WorkflowStepStatus.SHIFTED, 'Automatisch in nächsten Monat verschoben');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectStep = async (stepId: string) => {
    const reason = prompt('Grund für die Ablehnung:');
    if (!reason) return;
    
    try {
      await updateStepStatus(stepId, WorkflowStepStatus.REJECTED, reason);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
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
          alert(err.message);
        }
      }
    }
  };

  const handleAddComment = async (stepId: string) => {
    if (!commentText.trim()) return;
    
    try {
      const newComment = await addComment(stepId, commentText);
      setComments({
        ...comments,
        [stepId]: [...(comments[stepId] || []), newComment],
      });
      setCommentText('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (stepId: string, files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploadingFiles(prev => new Set([...prev, stepId]));
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      const response = await api.post<Attachment[]>(
        `/workflow-execution/steps/${stepId}/attachments`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      setAttachments(prev => ({
        ...prev,
        [stepId]: [...(prev[stepId] || []), ...response.data]
      }));
    } catch (err: any) {
      alert(err.message || 'Fehler beim Hochladen der Datei');
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/workflow-execution/attachments/${attachment.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Herunterladen der Datei');
    }
  };

  const loadAttachments = async (stepId: string) => {
    if (attachments[stepId]) return;
    
    try {
      const response = await api.get<Attachment[]>(`/workflow-execution/steps/${stepId}/attachments`);
      setAttachments(prev => ({ ...prev, [stepId]: response.data }));
    } catch (err: any) {
      console.error('Error loading attachments:', err);
    }
  };

  const getStatusBadgeClass = (status: WorkflowStepStatus) => {
    switch (status) {
      case WorkflowStepStatus.OPEN:
        return 'bg-gray-100 text-gray-800';
      case WorkflowStepStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case WorkflowStepStatus.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case WorkflowStepStatus.DONE:
        return 'bg-green-100 text-green-800';
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

  const getStatusLabel = (status: WorkflowStepStatus) => {
    switch (status) {
      case WorkflowStepStatus.OPEN:
        return 'Offen';
      case WorkflowStepStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case WorkflowStepStatus.PENDING_APPROVAL:
        return 'Wartet auf Freigabe';
      case WorkflowStepStatus.DONE:
        return 'Erledigt';
      case WorkflowStepStatus.SHIFTED:
        return 'Verschoben';
      case WorkflowStepStatus.SKIPPED:
        return 'Übersprungen';
      case WorkflowStepStatus.REJECTED:
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getStepCardClass = (status: WorkflowStepStatus) => {
    switch (status) {
      case WorkflowStepStatus.DONE:
        return 'bg-gray-50 border-gray-200';
      case WorkflowStepStatus.SHIFTED:
        return 'bg-orange-50 border-orange-200';
      case WorkflowStepStatus.REJECTED:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getInstanceStatusBadgeClass = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case WorkflowInstanceStatus.DELAYED:
        return 'bg-yellow-100 text-yellow-800';
      case WorkflowInstanceStatus.CRITICAL:
        return 'bg-red-100 text-red-800';
      case WorkflowInstanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case WorkflowInstanceStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      task: 'bg-blue-100 text-blue-800',
      approval: 'bg-green-100 text-green-800',
      decision: 'bg-yellow-100 text-yellow-800',
      notification: 'bg-purple-100 text-purple-800',
    };
    
    const labels: { [key: string]: string } = {
      task: 'Aufgabe',
      approval: 'Freigabe',
      decision: 'Entscheidung',
      notification: 'Benachrichtigung',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || colors.task}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const labels: { [key: string]: string } = {
      trainee: 'Trainee',
      accountant: 'Sachbearbeiter',
      senior: 'Senior',
      owner: 'Inhaber',
    };

    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {labels[role] || role}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Laden...</div>
        </div>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/workflows')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/workflows')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zu Workflow-Instanzen
        </button>
      </div>

      {/* Instance Info Card */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client?.name}</h1>
            <p className="text-gray-600 mt-1">{template?.name}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getInstanceStatusBadgeClass(instance.status)}`}>
                {instance.status}
              </span>
              <span className="text-sm text-gray-600">
                Periode: {instance.periodMonth}/{instance.periodYear}
              </span>
              <span className="text-sm text-gray-600">
                Erstellt: {new Date(instance.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fortschritt</span>
              <span className="text-sm text-gray-600">
                {progress.completedSteps}/{progress.totalSteps} Schritte ({progress.percentComplete}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>In Bearbeitung: {progress.inProgressSteps}</span>
              <span>Blockiert: {progress.blockedSteps}</span>
            </div>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Workflow-Schritte</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {instance.steps.map((step: WorkflowStep, index: number) => {
            const isExpanded = expandedSteps.has(step.id);
            const isDone = step.status === WorkflowStepStatus.DONE;
            
            return (
              <div 
                key={step.id} 
                ref={(el) => { stepRefs.current[step.id] = el; }}
                className={`border-l-4 ${isDone ? 'border-l-green-500' : step.status === WorkflowStepStatus.IN_PROGRESS ? 'border-l-blue-500' : 'border-l-gray-300'} ${getStepCardClass(step.status)}`}
              >
                {/* Step Header - Always Visible */}
                <button
                  onClick={() => handleToggleStep(step.id)}
                  className="w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    {isDone ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step.status === WorkflowStepStatus.IN_PROGRESS 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Step Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold ${isDone ? 'text-gray-500' : 'text-gray-900'}`}>
                        {step.templateStep?.name || 'Schritt ' + (index + 1)}
                      </h3>
                      {isDone && (
                        <span className="text-green-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(step.status)}`}>
                        {getStatusLabel(step.status)}
                      </span>
                      {step.templateStep?.type && getStepTypeBadge(step.templateStep.type)}
                      {step.templateStep?.role && getRoleBadge(step.templateStep.role)}
                      {step.dueDate && (
                        <span className="text-xs text-gray-500">
                          Fällig: {new Date(step.dueDate).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Step Details - Collapsible */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-14">
                    {step.templateStep?.description && (
                      <p className="text-gray-600 mt-2 mb-4">{step.templateStep.description}</p>
                    )}

                    {/* Tips */}
                    {step.templateStep?.tips && step.templateStep.tips.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Tipps:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {step.templateStep.tips.map((tip, idx) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Errors/Warnings */}
                    {step.templateStep?.errors && step.templateStep.errors.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-medium text-red-800 mb-1">Wichtige Hinweise:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {step.templateStep.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Checklist */}
                    {step.templateStep?.checklistItems && step.templateStep.checklistItems.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Checkliste:</h4>
                        <ul className="space-y-1">
                          {step.templateStep.checklistItems.map((item: any, idx: number) => (
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

                    {/* Completed Date */}
                    {step.completedAt && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Abgeschlossen:</span> {new Date(step.completedAt).toLocaleDateString('de-DE')}
                      </p>
                    )}

                    {/* Attachments Section */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Anhänge</h4>
                        <label className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 cursor-pointer">
                          {uploadingFiles.has(step.id) ? 'Hochladen...' : 'Datei hinzufügen'}
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              loadAttachments(step.id);
                              handleFileUpload(step.id, e.target.files!);
                            }}
                            disabled={uploadingFiles.has(step.id)}
                          />
                        </label>
                      </div>
                      
                      {attachments[step.id] && attachments[step.id].length > 0 ? (
                        <div className="space-y-2">
                          {attachments[step.id].map((attachment) => (
                            <div 
                              key={attachment.id} 
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                            >
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                              >
                                {getFileIcon(attachment.mimeType)}
                                <span className="truncate max-w-xs">{attachment.filename}</span>
                                <span className="text-xs text-gray-500">({formatFileSize(attachment.fileSize)})</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Keine Anhänge vorhanden</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      {step.status === WorkflowStepStatus.OPEN && (
                        <button
                          onClick={() => handleStartStep(step.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Starten
                        </button>
                      )}

                      {step.status === WorkflowStepStatus.IN_PROGRESS && (
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Abschließen
                        </button>
                      )}

                      {(step.status === WorkflowStepStatus.OPEN || step.status === WorkflowStepStatus.IN_PROGRESS) && (
                        <>
                          <button
                            onClick={() => handleShiftStep(step.id)}
                            className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                            title="In nächsten Monat verschieben"
                          >
                            Verschieben
                          </button>
                          <button
                            onClick={() => handleRejectStep(step.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Ablehnen
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleToggleComments(step.id)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      >
                        Kommentare ({comments[step.id]?.length || 0})
                      </button>
                    </div>

                    {/* Comments Section */}
                    {activeComments === step.id && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Kommentare:</h4>
                        
                        {comments[step.id] && comments[step.id].length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {comments[step.id].map((comment: any) => (
                              <div key={comment.id} className="bg-gray-50 rounded p-3">
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}