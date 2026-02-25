import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useCalendar } from '../hooks/useCalendar';
import { useNavigate } from 'react-router-dom';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { deadlines, loading } = useCalendar(year, month);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];

  const previousMonth = () => setCurrentDate(new Date(year, month - 2));
  const nextMonth = () => setCurrentDate(new Date(year, month));
  const goToToday = () => setCurrentDate(new Date());

  const getDeadlinesForDay = (day: number) =>
    deadlines.filter((d) => {
      const dDate = new Date(d.dueDate);
      return dDate.getDate() === day && dDate.getMonth() === month - 1 && dDate.getFullYear() === year;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const today = new Date();
  const upcomingDeadlines = deadlines
    .filter((d) => new Date(d.dueDate) >= today && d.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
        <p className="text-muted-foreground mt-1">Ihre Fristen und Aufgaben im Überblick.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {year}
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
                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-card min-h-[100px] p-2" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayDeadlines = getDeadlinesForDay(day);
                  const isToday =
                    day === today.getDate() &&
                    month - 1 === today.getMonth() &&
                    year === today.getFullYear();
                  return (
                    <div
                      key={day}
                      className={`bg-card min-h-[100px] p-2 border-t border-l border-border ${isToday ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayDeadlines.slice(0, 3).map((deadline) => (
                          <button
                            key={deadline.id}
                            className={`w-full text-xs px-2 py-1 rounded truncate text-left cursor-pointer ${getStatusColor(deadline.status)}`}
                            title={`${deadline.stepName} – ${deadline.clientName}`}
                            onClick={() => navigate(`/workflows/${deadline.instanceId}`)}
                          >
                            {deadline.stepName}
                          </button>
                        ))}
                        {dayDeadlines.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">+{dayDeadlines.length - 3} weitere</div>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anstehende Fristen</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Keine anstehenden Fristen</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((d) => {
                    const dDate = new Date(d.dueDate);
                    return (
                      <button
                        key={d.id}
                        className="w-full flex gap-3 text-left hover:bg-muted/50 rounded-lg p-1 transition-colors"
                        onClick={() => navigate(`/workflows/${d.instanceId}`)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                          <span className="text-xs font-medium">{monthNames[dDate.getMonth()].slice(0, 3)}</span>
                          <span className="text-sm font-bold">{dDate.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{d.stepName}</p>
                          <p className="text-xs text-muted-foreground truncate">{d.clientName}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Offen / Überfällig</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">In Bearbeitung</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Erledigt</span>
                </div>
              </div>
              {deadlines.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {deadlines.length} Frist{deadlines.length !== 1 ? 'en' : ''} diesen Monat
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
