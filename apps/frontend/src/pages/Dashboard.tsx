import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { 
  Building2, 
  FileText, 
  GitMerge,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, upcomingDeadlines, loading } = useDashboard();
  const navigate = useNavigate();

  const statCards = stats
    ? [
        {
          title: 'Aktive Mandanten',
          value: stats.clients.active,
          icon: Building2,
          description: `${stats.clients.total} gesamt`,
          trendUp: true,
        },
        {
          title: 'Laufende Workflows',
          value: stats.workflows.active,
          icon: GitMerge,
          description: `${stats.workflows.delayed} verzögert, ${stats.workflows.critical} kritisch`,
          trendUp: stats.workflows.critical === 0,
        },
        {
          title: 'Offene Aufgaben',
          value: stats.tasks.open,
          icon: FileText,
          description: `${stats.tasks.dueToday} heute fällig`,
          trendUp: stats.tasks.overdue === 0,
        },
        {
          title: 'Überfällige Aufgaben',
          value: stats.tasks.overdue,
          icon: Activity,
          description: `${stats.tasks.inProgress} in Bearbeitung`,
          trendUp: stats.tasks.overdue === 0,
        },
      ]
    : [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Hoch</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Mittel</Badge>;
      default:
        return <Badge variant="secondary">Niedrig</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Willkommen zurück, {user?.name}! Hier ist Ihre Übersicht.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/reports')}>Bericht exportieren</Button>
          <Button onClick={() => navigate('/workflows')}>Neuer Workflow</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span className={`flex items-center ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  </span>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Anstehende Fristen</CardTitle>
            <CardDescription>Fristen der nächsten 7 Tage</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Keine anstehenden Fristen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{deadline.stepName}</p>
                        <p className="text-xs text-muted-foreground">{deadline.clientName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getPriorityBadge(deadline.priority)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(deadline.dueDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow-Übersicht</CardTitle>
            <CardDescription>Status aller Workflows</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                {[
                  { label: 'Aktiv', value: stats.workflows.active, color: 'bg-blue-500' },
                  { label: 'Verzögert', value: stats.workflows.delayed, color: 'bg-yellow-500' },
                  { label: 'Kritisch', value: stats.workflows.critical, color: 'bg-red-500' },
                  { label: 'Abgeschlossen', value: stats.workflows.completed, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{item.label}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{
                          width: stats.workflows.total > 0
                            ? `${Math.round((item.value / stats.workflows.total) * 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <div className="w-8 text-sm font-medium text-right">{item.value}</div>
                  </div>
                ))}
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  Gesamt: {stats.workflows.total} Workflows
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <GitMerge className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Keine Daten verfügbar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
