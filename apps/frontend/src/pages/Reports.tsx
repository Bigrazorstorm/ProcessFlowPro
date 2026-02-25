import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  GitMerge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Trash2,
  Bell,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';

interface DashboardMetrics {
  totalClients: number;
  activeWorkflows: number;
  completedToday: number;
  overdueSteps: number;
  pendingApprovals: number;
  teamUtilization: number;
}

interface UserWorkload {
  userId: string;
  userName: string;
  assignedSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  overdueSteps: number;
  utilizationPercent: number;
}

interface WorkflowMetrics {
  templateId: string;
  templateName: string;
  totalInstancesCreated: number;
  averageCompletionTime: number;
  successRate: number;
  averageStepsCompleted: number;
}

interface SavedReport {
  id: string;
  name: string;
  type: string;
  timeRange: string;
  savedAt: string;
}

interface ScheduledReport {
  scheduleId: string;
  type: string;
  format: string;
  frequency: string;
  recipientEmail: string;
  nextRun: string;
  createdAt: string;
}

const SAVED_REPORTS_KEY = 'pfp_saved_reports';
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const REPORT_TYPES = [
  {
    type: 'WORKFLOW_SUMMARY',
    title: 'Workflow-Zusammenfassung',
    desc: 'Übersicht aller Workflows und deren Status',
    icon: GitMerge,
  },
  {
    type: 'CLIENT_PERFORMANCE',
    title: 'Mandanten-Performance',
    desc: 'Analyse der Bearbeitungszeiten pro Mandant',
    icon: Users,
  },
  { type: 'USER_WORKLOAD', title: 'Team-Auslastung', desc: 'Kapazitätsauslastung aller Mitarbeiter', icon: TrendingUp },
  { type: 'DEADLINE_COMPLIANCE', title: 'Fristen-Einhaltung', desc: 'Auswertung der Fristeneinhaltung', icon: Clock },
  { type: 'TEMPLATE_ANALYTICS', title: 'Template-Analyse', desc: 'Performance der Workflow-Templates', icon: Filter },
  { type: 'FINANCIAL_SUMMARY', title: 'Finanz-Zusammenfassung', desc: 'Finanzkennzahlen und KPIs', icon: BarChart3 },
];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
};

export default function Reports() {
  const [timeRange, setTimeRange] = useState('month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [userWorkload, setUserWorkload] = useState<UserWorkload[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    type: 'WORKFLOW_SUMMARY',
    format: 'PDF',
    frequency: 'monthly',
    recipientEmail: '',
  });
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadData();
    loadSavedReports();
    loadScheduledReports();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, workloadRes, workflowRes] = await Promise.allSettled([
        api.get<DashboardMetrics>('/dashboard/metrics'),
        api.get<UserWorkload[]>('/dashboard/workload'),
        api.get<WorkflowMetrics[]>('/dashboard/workflows'),
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
      if (workloadRes.status === 'fulfilled') setUserWorkload(workloadRes.value.data);
      if (workflowRes.status === 'fulfilled') setWorkflowMetrics(workflowRes.value.data);
    } catch {
      // Errors handled per-request above
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReports = () => {
    try {
      const stored = localStorage.getItem(SAVED_REPORTS_KEY);
      setSavedReports(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedReports([]);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const response = await api.get<ScheduledReport[]>('/reports/schedules');
      setScheduledReports(Array.isArray(response.data) ? response.data : []);
    } catch {
      setScheduledReports([]);
    }
  };

  const handleScheduleReport = async () => {
    if (!scheduleForm.recipientEmail) {
      alert('Bitte geben Sie eine E-Mail-Adresse an.');
      return;
    }
    try {
      setScheduling(true);
      await api.post('/reports/schedule', {
        type: scheduleForm.type,
        format: scheduleForm.format,
        frequency: scheduleForm.frequency,
        recipientEmail: scheduleForm.recipientEmail,
      });
      setScheduleModalOpen(false);
      setScheduleForm({ type: 'WORKFLOW_SUMMARY', format: 'PDF', frequency: 'monthly', recipientEmail: '' });
      await loadScheduledReports();
    } catch {
      alert('Automatisierter Report konnte nicht erstellt werden.');
    } finally {
      setScheduling(false);
    }
  };

  const handleDeleteScheduledReport = async (scheduleId: string) => {
    try {
      await api.delete(`/reports/schedules/${scheduleId}`);
      setScheduledReports((prev) => prev.filter((r) => r.scheduleId !== scheduleId));
    } catch {
      alert('Automatisierter Report konnte nicht gelöscht werden.');
    }
  };

  const persistSavedReports = (reports: SavedReport[]) => {
    localStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(reports));
    setSavedReports(reports);
  };

  const saveReport = (reportType: string) => {
    const reportMeta = REPORT_TYPES.find((r) => r.type === reportType);
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportMeta?.title ?? reportType,
      type: reportType,
      timeRange,
      savedAt: new Date().toISOString(),
    };
    persistSavedReports([newReport, ...savedReports]);
  };

  const deleteSavedReport = (id: string) => {
    persistSavedReports(savedReports.filter((r) => r.id !== id));
  };

  const runSavedReport = (report: SavedReport) => {
    setTimeRange(report.timeRange);
    handleExport('pdf', report.type);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv', reportType?: string) => {
    try {
      setExporting(true);
      await api.post('/reports/generate', {
        type: reportType ?? 'WORKFLOW_SUMMARY',
        format: format.toUpperCase(),
        timeRange,
      });
      alert(
        `Export als ${format.toUpperCase()} wurde gestartet. Sie erhalten eine Benachrichtigung, sobald der Bericht bereit ist.`,
      );
    } catch {
      alert('Export konnte nicht gestartet werden.');
    } finally {
      setExporting(false);
    }
  };

  const workflowStatusData = metrics
    ? [
        { name: 'Aktiv', value: metrics.activeWorkflows, color: '#6366f1' },
        { name: 'Abgeschlossen heute', value: metrics.completedToday, color: '#22c55e' },
        { name: 'Überfällig', value: metrics.overdueSteps, color: '#ef4444' },
        { name: 'Ausstehend', value: metrics.pendingApprovals, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
    : [];

  const userWorkloadChartData = userWorkload.slice(0, 8).map((u) => ({
    name: u.userName.split(' ')[0],
    Zugewiesen: u.assignedSteps,
    'In Arbeit': u.inProgressSteps,
    Abgeschlossen: u.completedSteps,
    Überfällig: u.overdueSteps,
  }));

  const workflowCompletionData = workflowMetrics.slice(0, 6).map((w) => ({
    name: w.templateName.length > 15 ? w.templateName.slice(0, 15) + '…' : w.templateName,
    Erfolgsrate: Math.round(w.successRate),
    'Ø Tage': Math.round(w.averageCompletionTime),
  }));

  const statCards = [
    {
      title: 'Aktive Workflows',
      value: metrics?.activeWorkflows ?? '–',
      icon: GitMerge,
      description: 'Laufende Workflows',
    },
    {
      title: 'Heute abgeschlossen',
      value: metrics?.completedToday ?? '–',
      icon: CheckCircle2,
      description: 'Steps abgeschlossen',
    },
    {
      title: 'Auslastung Team',
      value: metrics ? `${Math.round(metrics.teamUtilization)}%` : '–',
      icon: TrendingUp,
      description: 'Durchschnittliche Auslastung',
    },
    {
      title: 'Überfällige Steps',
      value: metrics?.overdueSteps ?? '–',
      icon: AlertTriangle,
      description: 'Fristen verpasst',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berichte & Analysen</h1>
          <p className="text-muted-foreground mt-1">Detaillierte Einblicke in Ihre Kanzleiprozesse.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Letzte 7 Tage</SelectItem>
              <SelectItem value="month">Letzter Monat</SelectItem>
              <SelectItem value="quarter">Letztes Quartal</SelectItem>
              <SelectItem value="year">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => handleExport(v as 'pdf' | 'excel' | 'csv')}>
            <SelectTrigger className="w-[160px]">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder={exporting ? 'Exportiere…' : 'Exportieren'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Als PDF</SelectItem>
              <SelectItem value="excel">Als Excel</SelectItem>
              <SelectItem value="csv">Als CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow-Status</CardTitle>
            <CardDescription>Aktuelle Verteilung der Workflow-Steps</CardDescription>
          </CardHeader>
          <CardContent>
            {workflowStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={workflowStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {workflowStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="w-8 h-8 opacity-50" />
                  <p>Keine Daten verfügbar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team-Auslastung</CardTitle>
            <CardDescription>Aufgaben pro Mitarbeiter</CardDescription>
          </CardHeader>
          <CardContent>
            {userWorkloadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userWorkloadChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Zugewiesen" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="In Arbeit" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Abgeschlossen" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Überfällig" fill={CHART_COLORS[3]} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 opacity-50" />
                  <p>Keine Mitarbeiterdaten verfügbar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {workflowCompletionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow-Templates: Erfolgsrate & Bearbeitungszeit</CardTitle>
            <CardDescription>Vergleich der Template-Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workflowCompletionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="Erfolgsrate"
                  fill={CHART_COLORS[0]}
                  radius={[2, 2, 0, 0]}
                  name="Erfolgsrate (%)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="Ø Tage"
                  fill={CHART_COLORS[4]}
                  radius={[2, 2, 0, 0]}
                  name="Ø Bearbeitungszeit (Tage)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report-Konfigurator</CardTitle>
          <CardDescription>
            Wählen Sie den gewünschten Report-Typ und generieren Sie einen detaillierten Bericht.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.type} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{report.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExport('pdf', report.type)}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Generieren
                    </Button>
                    <Button variant="ghost" size="sm" title="Report speichern" onClick={() => saveReport(report.type)}>
                      <Bookmark className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {savedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Gespeicherte Reports
            </CardTitle>
            <CardDescription>Ihre gespeicherten Report-Konfigurationen für schnellen Zugriff.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedReports.map((report) => {
                const reportMeta = REPORT_TYPES.find((r) => r.type === report.type);
                const Icon = reportMeta?.icon ?? BarChart3;
                const savedDate = new Date(report.savedAt);
                const timeRangeLabels: Record<string, string> = {
                  week: 'Letzte 7 Tage',
                  month: 'Letzter Monat',
                  quarter: 'Letztes Quartal',
                  year: 'Letztes Jahr',
                };
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {timeRangeLabels[report.timeRange] ?? report.timeRange} · Gespeichert am{' '}
                          {savedDate.toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => runSavedReport(report)}>
                        <Download className="w-3 h-3 mr-1" />
                        Ausführen
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedReport(report.id)}
                        title="Report löschen"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Automatisierte Reports
            </CardTitle>
            <CardDescription>
              Planen Sie regelmäßige Berichte, die automatisch per E-Mail zugestellt werden.
            </CardDescription>
          </div>
          <Button onClick={() => setScheduleModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer automatisierter Report
          </Button>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Bell className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-sm">Keine automatisierten Reports konfiguriert.</p>
              <p className="text-xs mt-1">
                Erstellen Sie einen neuen automatisierten Report, um regelmäßige Berichte zu erhalten.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledReports.map((report) => {
                const reportMeta = REPORT_TYPES.find((r) => r.type === report.type);
                const Icon = reportMeta?.icon ?? BarChart3;
                const nextRunDate = new Date(report.nextRun);
                return (
                  <div
                    key={report.scheduleId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {reportMeta?.title ?? report.type} · {FREQUENCY_LABELS[report.frequency] ?? report.frequency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Format: {report.format} · An: {report.recipientEmail} · Nächste Ausführung:{' '}
                          {nextRunDate.toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScheduledReport(report.scheduleId)}
                      title="Automatisierten Report löschen"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Automatisierten Report planen</DialogTitle>
            <DialogDescription>
              Konfigurieren Sie einen Report, der regelmäßig generiert und per E-Mail zugestellt wird.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Report-Typ</Label>
              <Select value={scheduleForm.type} onValueChange={(v) => setScheduleForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.type} value={r.type}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Format</Label>
              <Select value={scheduleForm.format} onValueChange={(v) => setScheduleForm((f) => ({ ...f, format: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Häufigkeit</Label>
              <Select
                value={scheduleForm.frequency}
                onValueChange={(v) => setScheduleForm((f) => ({ ...f, frequency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Quartalsweise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>E-Mail-Empfänger</Label>
              <Input
                type="email"
                placeholder="empfaenger@kanzlei.de"
                value={scheduleForm.recipientEmail}
                onChange={(e) => setScheduleForm((f) => ({ ...f, recipientEmail: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleScheduleReport} disabled={scheduling}>
              {scheduling ? 'Wird erstellt…' : 'Report planen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
