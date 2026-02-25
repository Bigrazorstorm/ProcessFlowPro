import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../lib/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface TeamTask {
  id: string;
  stepName: string;
  clientName: string;
  workflowName: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
}

const MEMBER_DOT_COLORS = [
  'bg-blue-400',
  'bg-purple-400',
  'bg-green-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-teal-400',
];

export default function TeamCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon,...
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const loadTeamMembers = useCallback(async () => {
    try {
      const response = await api.get<TeamMember[]>('/users');
      setTeamMembers(response.data.filter((u) => u.role !== undefined));
    } catch {
      setTeamMembers([]);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<TeamTask[]>('/dashboard/upcoming-deadlines', {
        params: { days: 60 },
      });
      setTasks(response.data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
    loadTasks();
  }, [loadTeamMembers, loadTasks]);

  const previousWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const nextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getTasksForMemberAndDay = (memberId: string, day: Date): TeamTask[] => {
    return tasks.filter((t) => {
      if (t.assignedUserId !== memberId) return false;
      const d = new Date(t.dueDate);
      return (
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear()
      );
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done' || status === 'completed') {
      return <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />;
    }
    if (status === 'critical' || status === 'overdue') {
      return <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />;
    }
    return <Clock className="w-3 h-3 text-blue-500 shrink-0" />;
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'critical':
      case 'overdue':
        return 'bg-red-50 border border-red-200';
      case 'delayed':
        return 'bg-orange-50 border border-orange-200';
      case 'done':
      case 'completed':
        return 'bg-green-50 border border-green-200';
      default:
        return 'bg-blue-50 border border-blue-200';
    }
  };

  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const formatWeekRange = () => {
    const end = weekDays[6];
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = currentWeekStart.toLocaleDateString('de-DE', opts);
    const endStr = end.toLocaleDateString('de-DE', { ...opts, year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  const getMemberWorkload = (memberId: string): number => {
    return tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return (
        t.assignedUserId === memberId &&
        d >= currentWeekStart &&
        d <= weekDays[6]
      );
    }).length;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teamkalender</h1>
          <p className="text-muted-foreground mt-1">
            Wochenübersicht aller Teammitglieder und ihre Aufgaben
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium ml-2 min-w-[160px]">{formatWeekRange()}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
        {teamMembers.slice(0, 6).map((member, i) => (
          <div key={member.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${MEMBER_DOT_COLORS[i % MEMBER_DOT_COLORS.length]}`} />
            <span>{member.name}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : teamMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p>Keine Teammitglieder gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground w-36 border-b border-r">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Mitarbeiter
                  </div>
                </th>
                {weekDays.map((day, i) => {
                  const isToday =
                    day.getDate() === today.getDate() &&
                    day.getMonth() === today.getMonth() &&
                    day.getFullYear() === today.getFullYear();
                  return (
                    <th
                      key={i}
                      className={`p-3 text-center text-sm font-medium border-b border-r last:border-r-0 min-w-[110px] ${
                        isToday ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div>{dayNames[i]}</div>
                      <div
                        className={`text-base font-bold mt-0.5 ${
                          isToday ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {day.getDate()}.{day.getMonth() + 1}.
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const workload = getMemberWorkload(member.id);

                return (
                  <tr key={member.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    {/* Member cell */}
                    <td className="p-3 border-r align-top">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground leading-tight">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        {workload > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                            {workload} Aufgabe{workload !== 1 ? 'n' : ''}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Day cells */}
                    {weekDays.map((day, dayIdx) => {
                      const dayTasks = getTasksForMemberAndDay(member.id, day);
                      const isToday =
                        day.getDate() === today.getDate() &&
                        day.getMonth() === today.getMonth() &&
                        day.getFullYear() === today.getFullYear();

                      return (
                        <td
                          key={dayIdx}
                          className={`p-1.5 border-r last:border-r-0 align-top min-h-[80px] ${
                            isToday ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="space-y-1 min-h-[60px]">
                            {dayTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`text-xs rounded px-1.5 py-1 space-y-0.5 ${getStatusBg(task.status)}`}
                                title={`${task.stepName} – ${task.clientName} (${task.workflowName})`}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(task.status)}
                                  <span className="font-medium truncate max-w-[80px] block">
                                    {task.stepName}
                                  </span>
                                </div>
                                <p className="text-muted-foreground truncate max-w-[90px] pl-4">
                                  {task.clientName}
                                </p>
                              </div>
                            ))}
                            {dayTasks.length === 0 && (
                              <div className="text-xs text-muted-foreground/30 text-center pt-3">—</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {teamMembers.slice(0, 4).map((member, i) => {
          const weekTasks = tasks.filter((t) => {
            const d = new Date(t.dueDate);
            return (
              t.assignedUserId === member.id &&
              d >= currentWeekStart &&
              d <= weekDays[6]
            );
          });
          const overdue = weekTasks.filter(
            (t) => t.status === 'overdue' || t.status === 'critical',
          ).length;

          return (
            <Card key={member.id} className="relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${MEMBER_DOT_COLORS[i % MEMBER_DOT_COLORS.length]}`}
              />
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">{member.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weekTasks.length}</div>
                <p className="text-xs text-muted-foreground">Aufgaben diese Woche</p>
                {overdue > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    {overdue} überfällig
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
