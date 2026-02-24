import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTemplates, WorkflowTemplate, TemplateStep, CreateStepDto, UpdateStepDto } from '../hooks/useTemplates';
import StepModal from '../components/StepModal';

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, loading, addStep, updateStep, deleteStep } = useTemplates();
  
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TemplateStep | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const found = templates.find((t) => t.id === id);
      if (found) {
        setTemplate(found);
      }
    }
  }, [id, templates]);

  const handleAddStep = () => {
    setSelectedStep(null);
    setIsStepModalOpen(true);
  };

  const handleEditStep = (step: TemplateStep) => {
    setSelectedStep(step);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = async (data: CreateStepDto | UpdateStepDto) => {
    if (!template) return;
    
    if (selectedStep) {
      await updateStep(template.id, selectedStep.id, data as UpdateStepDto);
    } else {
      await addStep(template.id, data as CreateStepDto);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!template) return;

    if (deleteConfirm !== stepId) {
      setDeleteConfirm(stepId);
      return;
    }

    try {
      await deleteStep(template.id, stepId);
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStepTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'Aufgabe',
      approval: 'Freigabe',
      decision: 'Entscheidung',
      notification: 'Benachrichtigung',
    };
    return labels[type] || type;
  };

  const getStepTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      task: 'bg-blue-100 text-blue-800',
      approval: 'bg-green-100 text-green-800',
      decision: 'bg-yellow-100 text-yellow-800',
      notification: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      trainee: 'Trainee',
      accountant: 'Sachbearbeiter',
      senior: 'Senior',
      owner: 'Inhaber',
    };
    return role ? labels[role] || role : 'Nicht zugewiesen';
  };

  if (loading && !template) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Template...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!template) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Template nicht gefunden
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/templates')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-gray-600 mt-1">
                {template.steps.length} Steps definiert
              </p>
            </div>
          </div>
          <button
            onClick={handleAddStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Step hinzufügen
          </button>
        </div>

        {/* Template Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Branche</h3>
              <p className="mt-1 text-lg text-gray-900">{template.industry || 'Nicht festgelegt'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 text-sm font-semibold rounded-full ${
                    template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {template.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Erstellt am</h3>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(template.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          {template.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Beschreibung</h3>
              <p className="text-gray-900">{template.description}</p>
            </div>
          )}
        </div>

        {/* Steps List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Workflow-Steps</h2>
            <p className="text-sm text-gray-600 mt-1">
              Definieren Sie die einzelnen Schritte des Workflows
            </p>
          </div>

          {template.steps.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Steps definiert</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fügen Sie den ersten Step zu diesem Template hinzu
              </p>
              <button
                onClick={handleAddStep}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ersten Step erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {template.steps.map((step, index) => (
                <div key={step.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStepTypeBadge(step.type)}`}>
                              {getStepTypeLabel(step.type)}
                            </span>
                            {step.assignedRole && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                {getRoleLabel(step.assignedRole)}
                              </span>
                            )}
                            {step.blocksNext && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                Blockiert nächste Steps
                              </span>
                            )}
                            {step.estimationAllowed && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                Schätzung erlaubt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {step.description && (
                        <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                      )}

                      {/* Checklist Preview */}
                      {step.checklist && step.checklist.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Checkliste ({step.checklist.length} Punkte):
                          </p>
                          <ul className="text-sm text-gray-600 space-y-0.5">
                            {step.checklist.slice(0, 2).map((item: any, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-gray-400">•</span>
                                {item.text}
                                {item.required && <span className="text-red-500">*</span>}
                              </li>
                            ))}
                            {step.checklist.length > 2 && (
                              <li className="text-xs text-gray-400">
                                +{step.checklist.length - 2} weitere...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Deadline Rule Preview */}
                      {step.deadlineRule && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700">
                            Deadline-Regel:{' '}
                            <span className="font-normal text-gray-600">
                              {step.deadlineRule.type === 'relative' && `${step.deadlineRule.value} ${step.deadlineRule.unit}`}
                              {step.deadlineRule.type === 'calendar' && 'Kalenderbasiert'}
                              {step.deadlineRule.type === 'fixed_day' && `Fester Tag: ${step.deadlineRule.value}`}
                              {step.deadlineRule.type === 'legal' && 'Gesetzliche Frist'}
                              {step.deadlineRule.type === 'dependent' && 'Abhängig von anderem Step'}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEditStep(step)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className={`px-3 py-1.5 text-sm rounded-md ${
                            deleteConfirm === step.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {deleteConfirm === step.id ? 'Bestätigen?' : 'Löschen'}
                        </button>
                        {deleteConfirm === step.id && (
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Abbrechen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <StepModal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        onSave={handleSaveStep}
        step={selectedStep}
      />
    </Layout>
  );
}
