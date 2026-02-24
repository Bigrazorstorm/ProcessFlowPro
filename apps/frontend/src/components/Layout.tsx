import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mandanten', href: '/clients', icon: Building2 },
    { name: 'Workflow Templates', href: '/templates', icon: FileText },
    { name: 'Workflows', href: '/workflows', icon: GitMerge },
    { name: 'Kalender', href: '/calendar', icon: CalendarDays },
    { name: 'Benachrichtigungen', href: '/notifications', icon: Bell },
    { name: 'Berichte', href: '/reports', icon: BarChart3 },
  ];

  const adminNavigation = [
    { name: 'Benutzer', href: '/users', icon: Users },
  ];

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
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground" 
            onClick={logout}
          >
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
