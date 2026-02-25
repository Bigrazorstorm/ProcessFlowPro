import React, { useState, useEffect } from 'react';
import { TemplateStep, WorkflowStepType, CreateStepDto, UpdateStepDto, ChecklistItem } from '../hooks/useTemplates';

interface StepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateStepDto | UpdateStepDto) => Promise<void>;
  step?: TemplateStep | null;
}

const STEP_TYPES = [
  { value: WorkflowStepType.TASK, label: 'Aufgabe' },
  { value: WorkflowStepType.APPROVAL, label: 'Freigabe' },
  { value: WorkflowStepType.DECISION, label: 'Entscheidung' },
  { value: WorkflowStepType.NOTIFICATION, label: 'Benachrichtigung' },
];

const ROLES = [
  { value: 'trainee', label: 'Trainee' },
  { value: 'accountant', label: 'Sachbearbeiter' },
  { value: 'senior', label: 'Senior' },
  { value: 'owner', label: 'Inhaber' },
];

export default function StepModal({ isOpen, onClose, onSave, step }: StepModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: WorkflowStepType.TASK,
    name: '',
    description: '',
    tips: '',
    assignedRole: '',
    estimationAllowed: false,
    blocksNext: false,
    checklist: [] as ChecklistItem[],
    errors: [] as string[],
  });

  const [newChecklistItem, setNewChecklistItem] = useState({ text: '', required: false });
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  
  const [newError, setNewError] = useState('');
  const [showErrorForm, setShowErrorForm] = useState(false);

  useEffect(() => {
    if (step) {
      setFormData({
        type: step.type,
        name: step.name,
        description: step.description || '',
        tips: step.tips || '',
        assignedRole: step.assignedRole || '',
        estimationAllowed: step.estimationAllowed,
        blocksNext: step.blocksNext,
        checklist: step.checklist || [],
        errors: step.errors || [],
      });
    } else {
      setFormData({
        type: WorkflowStepType.TASK,
        name: '',
        description: '',
        tips: '',
        assignedRole: '',
        estimationAllowed: false,
        blocksNext: false,
        checklist: [],
        errors: [],
      });
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        assignedRole: formData.assignedRole || undefined,
        description: formData.description || undefined,
        tips: formData.tips || undefined,
      };
      await onSave(data);
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.text.trim()) {
      const item: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.text,
        required: newChecklistItem.required,
      };
      setFormData({ ...formData, checklist: [...formData.checklist, item] });
      setNewChecklistItem({ text: '', required: false });
      setShowChecklistForm(false);
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData({ ...formData, checklist: formData.checklist.filter((item) => item.id !== id) });
  };

  const handleAddError = () => {
    if (newError.trim()) {
      setFormData({ ...formData, errors: [...formData.errors, newError] });
      setNewError('');
      setShowErrorForm(false);
    }
  };

  const handleRemoveError = (index: number) => {
    setFormData({ ...formData, errors: formData.errors.filter((_, i) => i !== index) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {step ? 'Step bearbeiten' : 'Neuen Step hinzufügen'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step-Typ *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkflowStepType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {STEP_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zugewiesene Rolle
              </label>
              <select
                value={formData.assignedRole}
                onChange={(e) => setFormData({ ...formData, assignedRole: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Automatisch zuweisen</option>
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step-Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Lohndaten erfassen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Beschreiben Sie, was in diesem Step zu tun ist..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Checkliste</label>
              <button
                type="button"
                onClick={() => setShowChecklistForm(!showChecklistForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Punkt hinzufügen
              </button>
            </div>

            {showChecklistForm && (
              <div className="bg-gray-50 p-3 rounded-md space-y-2 mb-3">
                <input
                  type="text"
                  placeholder="Checklistenpunkt"
                  value={newChecklistItem.text}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newChecklistItem.required}
                      onChange={(e) =>
                        setNewChecklistItem({ ...newChecklistItem, required: e.target.checked })
                      }
                      className="mr-2 h-4 w-4 text-blue-600 rounded"
                    />
                    Pflichtfeld
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}

            {formData.checklist.length > 0 && (
              <div className="space-y-2">
                {formData.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-900">{item.text}</span>
                      {item.required && <span className="text-red-500 text-xs">*Pflicht</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipps & Hinweise
            </label>
            <textarea
              value={formData.tips}
              onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              rows={2}
              placeholder="Hilfreiche Tipps für die Bearbeitung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Common Errors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Häufige Fehler</label>
              <button
                type="button"
                onClick={() => setShowErrorForm(!showErrorForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Fehler hinzufügen
              </button>
            </div>

            {showErrorForm && (
              <div className="bg-gray-50 p-3 rounded-md flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Fehlerbeschreibung"
                  value={newError}
                  onChange={(e) => setNewError(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddError}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Hinzufügen
                </button>
              </div>
            )}

            {formData.errors.length > 0 && (
              <div className="space-y-2">
                {formData.errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-red-50 p-2 rounded-md"
                  >
                    <span className="text-sm text-red-800">{error}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveError(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="blocksNext"
                checked={formData.blocksNext}
                onChange={(e) => setFormData({ ...formData, blocksNext: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="blocksNext" className="ml-2 block text-sm text-gray-900">
                Blockiert nachfolgende Steps (muss abgeschlossen sein)
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {step ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
