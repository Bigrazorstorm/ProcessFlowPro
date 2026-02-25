import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

interface CalendarDeadline {
  id: string;
  stepName: string;
  clientName: string;
  workflowName: string;
  dueDate: string;
  status: string;
  priority: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];

  const loadDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<CalendarDeadline[]>('/dashboard/upcoming-deadlines', {
        params: { days: 60 },
      });
      setDeadlines(response.data);
    } catch {
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const getDeadlinesForDay = (day: number) => {
    return deadlines.filter((d) => {
      const date = new Date(d.dueDate);
      return (
        date.getDate() === day &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Hoch</Badge>;
      case 'medium':
        return <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600">Mittel</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Niedrig</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done' || status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (status === 'critical' || status === 'overdue') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  const upcomingDeadlines = deadlines
    .filter((d) => new Date(d.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8);

  const selectedDayDeadlines = selectedDay !== null ? getDeadlinesForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground mt-1">
            Ihre Fristen und Workflow-Deadlines im Überblick.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={goToToday}>Heute</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                  <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}

                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-card min-h-[100px] p-2" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayDeadlines = getDeadlinesForDay(day);
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear();
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`bg-card min-h-[100px] p-2 border-t border-l border-border cursor-pointer transition-colors hover:bg-muted/30 ${
                        isToday ? 'bg-primary/5' : ''
                      } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
                    >
                      <div
                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                          isToday ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayDeadlines.slice(0, 2).map((deadline, i) => (
                          <div
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${getStatusColor(deadline.status)}`}
                            title={`${deadline.stepName} – ${deadline.clientName}`}
                          >
                            {deadline.stepName}
                          </div>
                        ))}
                        {dayDeadlines.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayDeadlines.length - 2} weitere
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedDay !== null ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  {selectedDay}. {monthNames[currentDate.getMonth()]}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {selectedDayDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Fristen an diesem Tag.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayDeadlines.map((deadline) => (
                      <div key={deadline.id} className="space-y-1 p-2 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deadline.status)}
                            <span className="text-sm font-medium">{deadline.stepName}</span>
                          </div>
                          {getPriorityBadge(deadline.priority)}
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{deadline.clientName}</p>
                        <p className="text-xs text-muted-foreground pl-6">{deadline.workflowName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anstehende Fristen</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine anstehenden Fristen.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline) => {
                      const date = new Date(deadline.dueDate);
                      const monthShort = monthNames[date.getMonth()].slice(0, 3);
                      return (
                        <div key={deadline.id} className="flex gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                            <span className="text-xs font-medium">{monthShort}</span>
                            <span className="text-sm font-bold">{date.getDate()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{deadline.stepName}</p>
                            <p className="text-xs text-muted-foreground truncate">{deadline.clientName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm">Kritisch / Überfällig</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-sm">Verzögert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm">In Bearbeitung</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm">Abgeschlossen</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
