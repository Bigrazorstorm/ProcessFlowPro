import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  FileText, 
  GitMerge,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    activeWorkflows: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    // TODO: Fetch real stats from API
    setStats({
      activeClients: 12,
      activeWorkflows: 45,
      completedTasks: 128,
      pendingTasks: 24,
    });
  }, []);

  const statCards = [
    {
      title: 'Aktive Mandanten',
      value: stats.activeClients,
      icon: Building2,
      trend: '+2',
      trendUp: true,
      description: 'gegen�ber letztem Monat'
    },
    {
      title: 'Laufende Workflows',
      value: stats.activeWorkflows,
      icon: GitMerge,
      trend: '+15%',
      trendUp: true,
      description: 'gegen�ber letztem Monat'
    },
    {
      title: 'Erledigte Aufgaben',
      value: stats.completedTasks,
      icon: FileText,
      trend: '+5%',
      trendUp: true,
      description: 'diese Woche'
    },
    {
      title: 'Offene Aufgaben',
      value: stats.pendingTasks,
      icon: Activity,
      trend: '-2',
      trendUp: false,
      description: 'seit gestern'
    },
  ];

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
          <Button variant="outline">Bericht exportieren</Button>
          <Button>Neuer Workflow</Button>
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
                    {stat.trend}
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
            <CardTitle>Aktuelle Workflows</CardTitle>
            <CardDescription>Die zuletzt aktualisierten Workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GitMerge className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Jahresabschluss 2023</p>
                      <p className="text-sm text-muted-foreground">Mandant GmbH & Co. KG</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">In Bearbeitung</p>
                    <p className="text-xs text-muted-foreground">Vor 2 Stunden</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anstehende Aufgaben</CardTitle>
            <CardDescription>Ihre n�chsten To-Dos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Belege anfordern</p>
                    <p className="text-sm text-muted-foreground">Steuererkl�rung M�ller</p>
                  </div>
                  <Button variant="ghost" size="sm">Erledigen</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
