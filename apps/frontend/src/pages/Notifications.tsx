import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Benachrichtigungen
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full px-2.5 py-0.5">
                {unreadCount} neu
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Bleiben Sie �ber wichtige Ereignisse und Updates informiert.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Alle als gelesen markieren
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Keine Benachrichtigungen vorhanden.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex gap-4 transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        title="Als gelesen markieren"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteNotification(notification.id)}
                      title="L�schen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
