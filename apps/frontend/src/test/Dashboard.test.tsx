import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

const mockStats = {
  workflows: { total: 10, active: 5, delayed: 2, critical: 1, completed: 2 },
  tasks: { total: 30, open: 10, inProgress: 5, dueToday: 3, overdue: 2 },
  clients: { total: 8, active: 7 },
  users: { total: 4, active: 4 },
};

const mockDeadlines = [
  {
    id: 'deadline-1',
    workflowName: 'Lohnabrechnung',
    clientName: 'Mustermann GmbH',
    stepName: 'Daten prüfen',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    status: 'open',
    priority: 'high',
  },
];

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    stats: mockStats,
    upcomingDeadlines: mockDeadlines,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Max Mustermann', email: 'max@example.com', role: 'owner' },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard heading', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('renders welcome message with user name', () => {
    renderDashboard();
    expect(screen.getByText(/Max Mustermann/i)).toBeInTheDocument();
  });

  it('renders all four stat card titles', () => {
    renderDashboard();
    expect(screen.getByText(/Aktive Mandanten/i)).toBeInTheDocument();
    expect(screen.getByText(/Laufende Workflows/i)).toBeInTheDocument();
    expect(screen.getByText(/Offene Aufgaben/i)).toBeInTheDocument();
    expect(screen.getByText(/Überfällige Aufgaben/i)).toBeInTheDocument();
  });

  it('displays client stats description', () => {
    renderDashboard();
    // clients.total = 8 appears as "8 gesamt"
    expect(screen.getByText(/8 gesamt/i)).toBeInTheDocument();
  });

  it('renders upcoming deadline item', () => {
    renderDashboard();
    expect(screen.getByText('Daten prüfen')).toBeInTheDocument();
    expect(screen.getByText('Mustermann GmbH')).toBeInTheDocument();
  });

  it('shows Hoch badge for high priority deadline', () => {
    renderDashboard();
    expect(screen.getByText('Hoch')).toBeInTheDocument();
  });

  it('renders workflow overview section', () => {
    renderDashboard();
    expect(screen.getByText(/Workflow-Übersicht/i)).toBeInTheDocument();
    // Workflow status labels in the bar chart
    expect(screen.getByText('Verzögert')).toBeInTheDocument();
    expect(screen.getByText('Kritisch')).toBeInTheDocument();
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument();
  });

  it('shows total workflow count in overview', () => {
    renderDashboard();
    // Total workflows = 10 shown in "Gesamt: 10 Workflows"
    expect(screen.getByText(/Gesamt: 10 Workflows/i)).toBeInTheDocument();
  });

  it('renders the upcoming deadlines section header', () => {
    renderDashboard();
    expect(screen.getByText(/Anstehende Fristen/i)).toBeInTheDocument();
    expect(screen.getByText(/Fristen der nächsten 7 Tage/i)).toBeInTheDocument();
  });

  it('renders export and new workflow buttons', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /Bericht exportieren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neuer Workflow/i })).toBeInTheDocument();
  });
});
