import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTemplates, WorkflowTemplate, TemplateStep, CreateStepDto, UpdateStepDto } from '../hooks/useTemplates';
import StepModal from '../components/StepModal';

interface SortableStepProps {
  step: TemplateStep;
  index: number;
  onEdit: (step: TemplateStep) => void;
  onDelete: (stepId: string) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (stepId: string | null) => void;
  getStepTypeBadge: (type: string) => string;
  getStepTypeLabel: (type: string) => string;
  getRoleLabel: (role?: string) => string;
}

function SortableStep({
  step,
  index,
  onEdit,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  getStepTypeBadge,
  getStepTypeLabel,
  getRoleLabel,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-6 hover:bg-gray-50 transition-colors ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          title="Ziehen zum Sortieren"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

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
              onClick={() => onEdit(step)}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
            >
              Bearbeiten
            </button>
            <button
              onClick={() => onDelete(step.id)}
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
  );
}

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, loading, addStep, updateStep, deleteStep, reorderSteps } = useTemplates();
  
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TemplateStep | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      const found = templates.find((t) => t.id === id);
      if (found) {
        // Sort steps by order
        const sortedSteps = [...found.steps].sort((a, b) => a.order - b.order);
        setTemplate({ ...found, steps: sortedSteps });
      }
    }
  }, [id, templates]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !template || active.id === over.id) {
      return;
    }

    const oldIndex = template.steps.findIndex((s) => s.id === active.id);
    const newIndex = template.steps.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSteps = arrayMove(template.steps, oldIndex, newIndex);
      
      // Update local state immediately for smooth UI
      setTemplate({ ...template, steps: newSteps });
      setIsReordering(true);

      try {
        // Update order property for each step
        const stepIds = newSteps.map((s) => s.id);
        await reorderSteps(template.id, stepIds);
      } catch (error: any) {
        alert(error.message);
        // Reload on error to restore correct order
        window.location.reload();
      } finally {
        setIsReordering(false);
      }
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Template nicht gefunden
      </div>
    );
  }

  return (
    <>
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

        {/* Steps List with Drag-and-Drop */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Workflow-Steps</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ziehen Sie die Steps per Drag & Drop, um die Reihenfolge zu ändern
                </p>
              </div>
              {isReordering && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Sortieren...
                </div>
              )}
            </div>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={template.steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-200">
                  {template.steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      index={index}
                      onEdit={handleEditStep}
                      onDelete={handleDeleteStep}
                      deleteConfirm={deleteConfirm}
                      setDeleteConfirm={setDeleteConfirm}
                      getStepTypeBadge={getStepTypeBadge}
                      getStepTypeLabel={getStepTypeLabel}
                      getRoleLabel={getRoleLabel}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <StepModal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        onSave={handleSaveStep}
        step={selectedStep}
      />
    </>
  );
}
