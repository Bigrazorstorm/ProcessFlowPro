import { useState } from 'react';
import {
  BarChart3, Download, Calendar as CalendarIcon, TrendingUp,
  Users, GitMerge, Clock, FileText, Play, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useDashboard } from '../hooks/useDashboard';
import { api } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const REPORT_TYPES = [
  { value: 'WORKFLOW_SUMMARY', label: 'Workflow-Zusammenfassung', icon: GitMerge, description: 'Überblick über alle Workflow-Instanzen und deren Status' },
  { value: 'CLIENT_PERFORMANCE', label: 'Mandanten-Performance', icon: Users, description: 'Leistungskennzahlen je Mandant' },
  { value: 'USER_WORKLOAD', label: 'Benutzer-Auslastung', icon: TrendingUp, description: 'Arbeitsbelastung und Produktivität je Benutzer' },
  { value: 'TEMPLATE_ANALYTICS', label: 'Template-Analyse', icon: FileText, description: 'Nutzungsstatistiken für Workflow-Templates' },
  { value: 'DEADLINE_COMPLIANCE', label: 'Fristenkonformität', icon: Clock, description: 'Einhaltung von Fristen und Terminen' },
];

const DATE_RANGES = [
  { value: 'week', label: 'Letzte 7 Tage' },
  { value: 'month', label: 'Letzter Monat' },
  { value: 'quarter', label: 'Letztes Quartal' },
  { value: 'year', label: 'Letztes Jahr' },
];

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
];

function getDateRange(range: string) {
  const end = new Date();
  const start = new Date();
  if (range === 'week') start.setDate(start.getDate() - 7);
  else if (range === 'month') start.setMonth(start.getMonth() - 1);
  else if (range === 'quarter') start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export default function Reports() {
  const [reportType, setReportType] = useState('WORKFLOW_SUMMARY');
  const [timeRange, setTimeRange] = useState('month');
  const [exportFormat, setExportFormat] = useState('json');
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const { stats } = useDashboard();
  const { toast } = useToast();

  const selectedType = REPORT_TYPES.find((t) => t.value === reportType);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setReportData(null);
      const dateRange = getDateRange(timeRange);
      const response = await api.post('/reports/generate', {
        type: reportType,
        dateRange,
      });
      setReportData(response.data);
      toast({ title: 'Bericht erstellt', description: 'Der Bericht wurde erfolgreich generiert.' });
    } catch (err: any) {
      toast({
        title: 'Fehler',
        description: err.response?.data?.message || 'Bericht konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const dateRange = getDateRange(timeRange);
      const response = await api.post('/reports/export', {
        type: reportType,
        format: exportFormat,
        dateRange,
      });

      // Download the result
      const dataStr = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export erfolgreich', description: `Bericht wurde als ${exportFormat.toUpperCase()} exportiert.` });
    } catch (err: any) {
      toast({
        title: 'Fehler',
        description: err.response?.data?.message || 'Export fehlgeschlagen.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const statCards = stats
    ? [
        { title: 'Aktive Workflows', value: stats.workflows.active, icon: GitMerge, sub: `${stats.workflows.total} gesamt` },
        { title: 'Offene Aufgaben', value: stats.tasks.open, icon: Clock, sub: `${stats.tasks.overdue} überfällig` },
        { title: 'Aktive Mandanten', value: stats.clients.active, icon: Users, sub: `${stats.clients.total} gesamt` },
        { title: 'Produktivität', value: `${stats.workflows.total > 0 ? Math.round((stats.workflows.completed / stats.workflows.total) * 100) : 0}%`, icon: TrendingUp, sub: `${stats.workflows.completed} abgeschlossen` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berichte & Analysen</h1>
          <p className="text-muted-foreground mt-1">Detaillierte Einblicke in Ihre Kanzleiprozesse.</p>
        </div>
      </div>

      {/* Stats overview */}
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
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Configurator */}
      <Card>
        <CardHeader>
          <CardTitle>Report-Konfigurator</CardTitle>
          <CardDescription>Erstellen und exportieren Sie individuelle Berichte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report type selection */}
          <div>
            <p className="text-sm font-medium mb-3">Berichtstyp</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    className={`text-left p-4 rounded-lg border-2 transition-colors ${
                      reportType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setReportType(type.value)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-sm font-medium mb-2">Zeitraum</p>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Zeitraum wählen" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Exportformat</p>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pb-0.5">
              <Button onClick={handleGenerate} disabled={generating}>
                <Play className="w-4 h-4 mr-2" />
                {generating ? 'Erstelle...' : 'Bericht erstellen'}
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exportiere...' : `Als ${exportFormat.toUpperCase()} exportieren`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedType?.label}</CardTitle>
              <CardDescription>
                Generiert am {new Date().toLocaleString('de-DE')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{DATE_RANGES.find((r) => r.value === timeRange)?.label}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawData((v) => !v)}
              >
                {showRawData ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showRawData ? 'Zusammenfassung' : 'Details'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showRawData ? (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            ) : (
              <ReportSummary data={reportData} type={reportType} />
            )}
          </CardContent>
        </Card>
      )}

      {!reportData && (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
          <BarChart3 className="w-8 h-8 opacity-50 mb-2" />
          <p>Wählen Sie einen Berichtstyp und klicken Sie auf "Bericht erstellen"</p>
        </div>
      )}
    </div>
  );
}

function ReportSummary({ data, type }: { data: any; type: string }) {
  if (!data) return null;

  if (type === 'WORKFLOW_SUMMARY' && data.metrics) {
    const m = data.metrics;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Gesamt Instanzen', value: m.totalInstances },
          { label: 'Aktiv', value: m.activeInstances },
          { label: 'Abgeschlossen', value: m.completedInstances },
          { label: 'Überfällig', value: m.overdueInstances },
          { label: 'Erfolgsrate', value: `${m.successRate}%` },
          { label: 'Ø Abschlusszeit', value: `${m.averageCompletionTime} Tage` },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold mt-1">{item.value ?? '-'}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'USER_WORKLOAD' && data.userMetrics) {
    return (
      <div className="space-y-3">
        {data.userMetrics.map((u: any) => (
          <div key={u.userId} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{u.userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xs text-muted-foreground">Zugewiesen</p>
                <p className="font-bold">{u.assignedSteps}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Erledigt</p>
                <p className="font-bold">{u.completedSteps}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Überfällig</p>
                <p className="font-bold text-destructive">{u.overdueSteps}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'CLIENT_PERFORMANCE' && data.clientMetrics) {
    return (
      <div className="space-y-3">
        {data.clientMetrics.map((c: any) => (
          <div key={c.clientId} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{c.clientName}</p>
              <p className="text-xs text-muted-foreground">{c.activeWorkflows} aktiv</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                <p className="font-bold">{c.completedWorkflows}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Erfolgsrate</p>
                <p className="font-bold">{c.completionRate}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: show key-value pairs
  const keys = Object.keys(data).filter((k) => !['generatedAt', 'periodStart', 'periodEnd'].includes(k));
  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key} className="flex justify-between p-2 rounded bg-muted/50">
          <span className="text-sm text-muted-foreground">{key}</span>
          <span className="text-sm font-medium">{typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key])}</span>
        </div>
      ))}
    </div>
  );
}
