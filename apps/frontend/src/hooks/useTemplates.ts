import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export enum WorkflowStepType {
  TASK = 'task',
  APPROVAL = 'approval',
  DECISION = 'decision',
  NOTIFICATION = 'notification',
}

export interface TemplateStep {
  id: string;
  order: number;
  type: WorkflowStepType;
  name: string;
  description?: string;
  checklist: ChecklistItem[];
  tips?: string;
  errors: string[];
  deadlineRule?: DeadlineRule;
  assignedRole?: string;
  estimationAllowed: boolean;
  blocksNext: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface DeadlineRule {
  type: 'relative' | 'calendar' | 'fixed_day' | 'legal' | 'dependent';
  value?: number;
  unit?: string;
  referenceDate?: string;
  dependsOnStepId?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  isActive: boolean;
  steps: TemplateStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  industry?: string;
  description?: string;
  steps?: CreateStepDto[];
}

export interface CreateStepDto {
  type: WorkflowStepType;
  name: string;
  description?: string;
  checklist?: ChecklistItem[];
  tips?: string;
  errors?: string[];
  deadlineRule?: DeadlineRule;
  assignedRole?: string;
  estimationAllowed?: boolean;
  blocksNext?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  industry?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateStepDto {
  type?: WorkflowStepType;
  name?: string;
  description?: string;
  checklist?: ChecklistItem[];
  tips?: string;
  errors?: string[];
  deadlineRule?: DeadlineRule;
  assignedRole?: string | null;
  estimationAllowed?: boolean;
  blocksNext?: boolean;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<WorkflowTemplate[]>('/workflow-templates');
      setTemplates(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = async (data: CreateTemplateDto): Promise<WorkflowTemplate> => {
    try {
      const response = await api.post<WorkflowTemplate>('/workflow-templates', data);
      setTemplates([...templates, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Erstellen des Templates');
    }
  };

  const updateTemplate = async (id: string, data: UpdateTemplateDto): Promise<WorkflowTemplate> => {
    try {
      const response = await api.patch<WorkflowTemplate>(`/workflow-templates/${id}`, data);
      setTemplates(templates.map((t) => (t.id === id ? response.data : t)));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren des Templates');
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      await api.delete(`/workflow-templates/${id}`);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen des Templates');
    }
  };

  const addStep = async (templateId: string, data: CreateStepDto): Promise<TemplateStep> => {
    try {
      const response = await api.post<TemplateStep>(`/workflow-templates/${templateId}/steps`, data);
      // Reload templates to get updated step list
      await loadTemplates();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Hinzufügen des Steps');
    }
  };

  const updateStep = async (
    templateId: string,
    stepId: string,
    data: UpdateStepDto
  ): Promise<TemplateStep> => {
    try {
      const response = await api.patch<TemplateStep>(
        `/workflow-templates/${templateId}/steps/${stepId}`,
        data
      );
      // Reload templates to get updated step list
      await loadTemplates();
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren des Steps');
    }
  };

  const deleteStep = async (templateId: string, stepId: string): Promise<void> => {
    try {
      await api.delete(`/workflow-templates/${templateId}/steps/${stepId}`);
      // Reload templates to get updated step list
      await loadTemplates();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen des Steps');
    }
  };

  const reorderSteps = async (templateId: string, stepIds: string[]): Promise<void> => {
    try {
      await api.post(`/workflow-templates/${templateId}/steps/reorder`, { stepIds });
      // Reload templates to get updated order
      await loadTemplates();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Sortieren der Steps');
    }
  };

  const reload = () => {
    loadTemplates();
  };

  return {
    templates,
    loading,
    error,
    reload,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  };
}
