import { useState } from 'react';
import { BarChart3, Download, Filter, Calendar as CalendarIcon, TrendingUp, Users, GitMerge, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('month');

  const stats = [
    {
      title: 'Abgeschlossene Workflows',
      value: '124',
      trend: '+12%',
      trendUp: true,
      icon: GitMerge,
    },
    {
      title: 'Durchschn. Bearbeitungszeit',
      value: '4.2 Tage',
      trend: '-8%',
      trendUp: true, // Lower is better here
      icon: Clock,
    },
    {
      title: 'Aktive Mandanten',
      value: '856',
      trend: '+5%',
      trendUp: true,
      icon: Users,
    },
    {
      title: 'Produktivität',
      value: '94%',
      trend: '+2%',
      trendUp: true,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Berichte & Analysen</h1>
          <p className="text-muted-foreground mt-1">
            Detaillierte Einblicke in Ihre Kanzleiprozesse.
          </p>
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
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
                    {stat.trend}
                  </span>
                  vs. Vorzeitraum
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Workflow-Status</CardTitle>
            <CardDescription>Verteilung der aktuellen Workflows</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-lg m-6">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 opacity-50" />
              <p>Diagramm-Platzhalter</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Bearbeitungszeiten nach Kategorie</CardTitle>
            <CardDescription>Durchschnittliche Dauer in Tagen</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-lg m-6">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 opacity-50" />
              <p>Diagramm-Platzhalter</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
