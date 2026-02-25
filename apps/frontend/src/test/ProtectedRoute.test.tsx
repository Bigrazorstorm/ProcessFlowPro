import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Module-level state that the hoisted mock factory can close over
let mockIsAuthenticated = false;
let mockLoading = false;

vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? { id: 'u1', name: 'Test', email: 'test@example.com', role: 'owner' } : null,
    loading: mockLoading,
    isAuthenticated: mockIsAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Import after mocks are registered
// eslint-disable-next-line import/first
import ProtectedRoute from '../components/ProtectedRoute';

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Geschützter Inhalt</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is being checked', () => {
    mockIsAuthenticated = false;
    mockLoading = true;
    renderProtectedRoute();
    expect(screen.getByText(/Wird geladen/i)).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockIsAuthenticated = false;
    mockLoading = false;
    renderProtectedRoute();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children inside Layout when authenticated', () => {
    mockIsAuthenticated = true;
    mockLoading = false;
    renderProtectedRoute();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
