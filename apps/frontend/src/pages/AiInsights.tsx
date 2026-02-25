import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lightbulb,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

interface AiSuggestion {
  id: string;
  type: 'warning' | 'info' | 'success' | 'recommendation';
  category: 'capacity' | 'deadline' | 'workflow' | 'anomaly';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionPath?: string;
}

interface CapacityForecast {
  userId: string;
  userName: string;
  currentLoad: number;
  forecastedLoad: number;
  status: 'overloaded' | 'optimal' | 'underutilized';
  openTasks: number;
  overdueTasks: number;
}

interface AiInsightsDto {
  suggestions: AiSuggestion[];
  capacityForecasts: CapacityForecast[];
  riskScore: number;
  generatedAt: string;
}

const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
  recommendation: <Lightbulb className="w-5 h-5 text-purple-500 shrink-0" />,
};

const SUGGESTION_BG: Record<string, string> = {
  warning: 'border-yellow-200 bg-yellow-50/50',
  info: 'border-blue-200 bg-blue-50/50',
  success: 'border-green-200 bg-green-50/50',
  recommendation: 'border-purple-200 bg-purple-50/50',
};

const PRIORITY_BADGES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

const CATEGORY_LABELS: Record<string, string> = {
  capacity: 'Kapazität',
  deadline: 'Frist',
  workflow: 'Workflow',
  anomaly: 'Anomalie',
};

const RiskGauge = ({ score }: { score: number }) => {
  const color = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-yellow-600' : 'text-green-600';
  const bgColor = score >= 70 ? 'bg-red-100' : score >= 40 ? 'bg-yellow-100' : 'bg-green-100';
  const label = score >= 70 ? 'Hoch' : score >= 40 ? 'Mittel' : 'Niedrig';

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${bgColor}`}>
      <span className={`text-5xl font-bold ${color}`}>{score}</span>
      <span className={`text-sm font-medium mt-1 ${color}`}>Risiko: {label}</span>
    </div>
  );
};

const CapacityBar = ({ current, limit }: { current: number; limit: number }) => {
  const pct = Math.min(100, Math.round((current / Math.max(limit, 1)) * 100));
  const barColor = pct > 100 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
};

const CapacityIcon = ({ status }: { status: CapacityForecast['status'] }) => {
  if (status === 'overloaded') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (status === 'underutilized') return <TrendingDown className="w-4 h-4 text-blue-500" />;
  return <Minus className="w-4 h-4 text-green-500" />;
};

export default function AiInsights() {
  const [insights, setInsights] = useState<AiInsightsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadInsights = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await api.get<AiInsightsDto>('/ai-suggestions');
      setInsights(response.data);
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            KI-Unterstützung
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligente Analyse, Workflow-Vorschläge und Kapazitäts-Vorhersage
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadInsights(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">KI analysiert Ihre Daten…</p>
          </div>
        </div>
      ) : !insights ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Brain className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Keine Daten verfügbar.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Risk Score + Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gesamtrisiko-Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RiskGauge score={insights.riskScore} />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Generiert:{' '}
                  {new Date(insights.generatedAt).toLocaleString('de-DE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hinweise gesamt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['warning', 'recommendation', 'info', 'success'].map((type) => {
                    const count = insights.suggestions.filter((s) => s.type === type).length;
                    if (count === 0) return null;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {SUGGESTION_ICONS[type]}
                          <span className="text-sm capitalize">
                            {type === 'warning'
                              ? 'Warnungen'
                              : type === 'recommendation'
                              ? 'Empfehlungen'
                              : type === 'info'
                              ? 'Hinweise'
                              : 'Positiv'}
                          </span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                  {insights.suggestions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Keine Hinweise.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Kapazitäts-Übersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-red-600">
                      <TrendingUp className="w-3 h-3" /> Überlastet
                    </span>
                    <span className="font-medium">
                      {insights.capacityForecasts.filter((f) => f.status === 'overloaded').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <Minus className="w-3 h-3" /> Optimal
                    </span>
                    <span className="font-medium">
                      {insights.capacityForecasts.filter((f) => f.status === 'optimal').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-blue-600">
                      <TrendingDown className="w-3 h-3" /> Freie Kapazität
                    </span>
                    <span className="font-medium">
                      {insights.capacityForecasts.filter((f) => f.status === 'underutilized').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          {insights.suggestions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Empfehlungen & Hinweise</h2>
              <div className="space-y-3">
                {insights.suggestions.map((s) => (
                  <Card key={s.id} className={`border ${SUGGESTION_BG[s.type]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {SUGGESTION_ICONS[s.type]}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{s.title}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGES[s.priority]}`}
                            >
                              {PRIORITY_LABELS[s.priority]}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[s.category]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{s.description}</p>
                          {s.actionLabel && s.actionPath && (
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 h-auto mt-1 text-primary"
                              onClick={() => navigate(s.actionPath!)}
                            >
                              {s.actionLabel} →
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {insights.suggestions.length === 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Alles im grünen Bereich!</p>
                  <p className="text-xs text-muted-foreground">
                    Aktuell keine Warnungen oder Empfehlungen. Ihr Team arbeitet optimal.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Capacity Forecasts */}
          {insights.capacityForecasts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Kapazitäts-Vorhersage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.capacityForecasts.map((forecast) => (
                  <Card key={forecast.userId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm truncate">{forecast.userName}</span>
                        <CapacityIcon status={forecast.status} />
                      </div>
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Auslastung</span>
                          <span>
                            {forecast.openTasks} Aufgaben
                          </span>
                        </div>
                        <CapacityBar current={forecast.openTasks} limit={Math.max(forecast.openTasks, forecast.forecastedLoad, 1)} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-medium ${
                            forecast.status === 'overloaded'
                              ? 'text-red-600'
                              : forecast.status === 'underutilized'
                              ? 'text-blue-600'
                              : 'text-green-600'
                          }`}
                        >
                          {forecast.status === 'overloaded'
                            ? 'Überlastet'
                            : forecast.status === 'underutilized'
                            ? 'Unterausgelastet'
                            : 'Optimal'}
                        </span>
                        {forecast.overdueTasks > 0 && (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {forecast.overdueTasks} überfällig
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
