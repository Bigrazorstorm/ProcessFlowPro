import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Januar', 'Februar', 'M�rz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Dummy events
  const events = [
    { date: 5, title: 'USt-Voranmeldung', type: 'deadline' },
    { date: 10, title: 'Lohnsteuer', type: 'deadline' },
    { date: 15, title: 'Mandantengespr�ch', type: 'meeting' },
    { date: 28, title: 'Jahresabschluss', type: 'task' },
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'deadline': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground mt-1">
            Ihre Termine und Fristen im �berblick.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Termin
        </Button>
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
            <Button variant="outline">Heute</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-card min-h-[120px] p-2" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dayEvents = events.filter(e => e.date === day);
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div key={day} className={`bg-card min-h-[120px] p-2 border-t border-l border-border ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event, i) => (
                        <div 
                          key={i} 
                          className={`text-xs px-2 py-1 rounded truncate ${getEventTypeColor(event.type)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anstehende Termine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="text-xs font-medium">Okt</span>
                      <span className="text-sm font-bold">{10 + i}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Mandantengespr�ch</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        14:00 - 15:00
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <span className="text-sm">Fristen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Termine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Aufgaben</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
