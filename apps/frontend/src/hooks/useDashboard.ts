import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface DashboardStats {
  workflows: {
    total: number;
    active: number;
    delayed: number;
    critical: number;
    completed: number;
  };
  tasks: {
    total: number;
    open: number;
    inProgress: number;
    dueToday: number;
    overdue: number;
  };
  clients: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    active: number;
  };
}

interface UpcomingDeadline {
  id: string;
  workflowName: string;
  clientName: string;
  stepName: string;
  dueDate: string;
  status: string;
  priority: string;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, deadlinesResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/upcoming-deadlines', { params: { days: 7 } }),
      ]);

      setStats(statsResponse.data);
      setUpcomingDeadlines(deadlinesResponse.data);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    upcomingDeadlines,
    loading,
    error,
    reload: loadDashboardData,
  };
}
