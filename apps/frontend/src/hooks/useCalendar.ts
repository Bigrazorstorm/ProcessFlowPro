import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface CalendarDeadline {
  id: string;
  stepName: string;
  workflowName: string;
  clientName: string;
  dueDate: string;
  status: string;
  instanceId: string;
}

export function useCalendar(year: number, month: number) {
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<CalendarDeadline[]>('/dashboard/calendar', {
        params: { year, month },
      });
      setDeadlines(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Kalenderdaten');
      console.error('Error loading calendar deadlines:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  return { deadlines, loading, error, reload: loadDeadlines };
}
