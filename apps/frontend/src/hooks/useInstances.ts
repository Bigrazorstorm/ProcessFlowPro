import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export enum WorkflowInstanceStatus {
  ACTIVE = 'active',
  DELAYED = 'delayed',
  CRITICAL = 'critical',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum WorkflowStepStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_APPROVAL = 'pending_approval',
  DONE = 'done',
  SHIFTED = 'shifted',
  SKIPPED = 'skipped',
  REJECTED = 'rejected',
}

export interface WorkflowStep {
  id: string;
  templateStepId: string;
  status: WorkflowStepStatus;
  assignedUserId?: string;
  estimationValue?: number;
  dueDate?: string;
  completedAt?: string;
  checklistProgress: any[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  id: string;
  clientId: string;
  templateId: string;
  status: WorkflowInstanceStatus;
  periodYear: number;
  periodMonth: number;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstanceDto {
  templateId: string;
  clientId: string;
  status?: WorkflowInstanceStatus;
}

export interface StepComment {
  id: string;
  stepId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface WorkflowProgress {
  instanceId: string;
  totalSteps: number;
  completedSteps: number;
  blockedSteps: number;
  inProgressSteps: number;
  percentComplete: number;
  steps: any[];
}

export function useInstances() {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstances = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<WorkflowInstance[]>('/workflow-instances', {
        params: { page, limit },
      });
      setInstances(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Workflow-Instanzen');
      console.error('Error loading instances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const createInstance = async (data: CreateInstanceDto): Promise<WorkflowInstance> => {
    try {
      const response = await api.post<WorkflowInstance>('/workflow-instances', data);
      setInstances([response.data, ...instances]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Erstellen der Instanz');
    }
  };

  const getInstance = async (id: string): Promise<WorkflowInstance> => {
    try {
      const response = await api.get<WorkflowInstance>(`/workflow-instances/${id}`);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Laden der Instanz');
    }
  };

  const getProgress = async (instanceId: string): Promise<WorkflowProgress> => {
    try {
      const response = await api.get<WorkflowProgress>(
        `/workflow-execution/instances/${instanceId}/progress`
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Laden des Progress');
    }
  };

  const startStep = async (stepId: string): Promise<WorkflowStep> => {
    try {
      const response = await api.post<WorkflowStep>(`/workflow-execution/steps/${stepId}/start`);
      await loadInstances(); // Reload to reflect changes
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Starten des Steps');
    }
  };

  const completeStep = async (stepId: string): Promise<WorkflowStep> => {
    try {
      const response = await api.post<WorkflowStep>(
        `/workflow-execution/steps/${stepId}/complete`,
        {}
      );
      await loadInstances(); // Reload to reflect changes
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Abschließen des Steps');
    }
  };

  const updateStepStatus = async (
    stepId: string,
    status: WorkflowStepStatus,
    reason?: string
  ): Promise<WorkflowStep> => {
    try {
      const response = await api.patch<WorkflowStep>(
        `/workflow-execution/steps/${stepId}/status`,
        { status, reason }
      );
      await loadInstances(); // Reload to reflect changes
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren des Status');
    }
  };

  const addComment = async (stepId: string, text: string): Promise<StepComment> => {
    try {
      const response = await api.post<StepComment>(
        `/workflow-execution/steps/${stepId}/comments`,
        { text }
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Hinzufügen des Kommentars');
    }
  };

  const getComments = async (stepId: string): Promise<StepComment[]> => {
    try {
      const response = await api.get<StepComment[]>(
        `/workflow-execution/steps/${stepId}/comments`
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Laden der Kommentare');
    }
  };

  const reload = () => {
    loadInstances();
  };

  return {
    instances,
    loading,
    error,
    reload,
    createInstance,
    getInstance,
    getProgress,
    startStep,
    completeStep,
    updateStepStatus,
    addComment,
    getComments,
  };
}
