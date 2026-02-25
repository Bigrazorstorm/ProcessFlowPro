import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  GitMerge,
  CalendarDays,
  Bell,
  BarChart3,
  LogOut,
  Settings,
  Check,
  Info,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  Zap,
  FolderOpen,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500 shrink-0" />;
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mandanten', href: '/clients', icon: Building2 },
    { name: 'Workflow Templates', href: '/templates', icon: FileText },
    { name: 'Workflows', href: '/workflows', icon: GitMerge },
    { name: 'Kalender', href: '/calendar', icon: CalendarDays },
    { name: 'Teamkalender', href: '/team-calendar', icon: CalendarRange },
    { name: 'Benachrichtigungen', href: '/notifications', icon: Bell },
    { name: 'Berichte', href: '/reports', icon: BarChart3 },
    { name: 'Workflow-Trigger', href: '/workflow-triggers', icon: Zap },
    { name: 'Dokumente', href: '/documents', icon: FolderOpen },
    { name: 'KI-Unterstützung', href: '/ai-insights', icon: Brain },
    { name: 'Team-Chat', href: '/chat', icon: MessageSquare },
  ];

  const adminNavigation = [{ name: 'Benutzer', href: '/users', icon: Users }];

  const showAdminNav = user?.role === 'owner' || user?.role === 'senior';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r flex flex-col z-10">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>ProcessFlow Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {showAdminNav && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Administration
              </h3>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center px-8">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Benachrichtigungen</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto py-0.5 px-2"
                      onClick={() => markAllAsRead()}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Alle lesen
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {recentNotifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Keine Benachrichtigungen</div>
                ) : (
                  recentNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{notification.message}</p>
                      </div>
                      {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center justify-center text-sm text-primary cursor-pointer"
                  onClick={() => navigate('/notifications')}
                >
                  Alle Benachrichtigungen anzeigen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
