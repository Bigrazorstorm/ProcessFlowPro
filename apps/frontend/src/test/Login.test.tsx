import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock the AuthContext
const mockLogin = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /ProcessFlow Pro/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('allows typing in the email field', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/E-Mail/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('allows typing in the password field', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByLabelText(/Passwort/i);
    await user.type(passwordInput, 'secret123');
    expect(passwordInput).toHaveValue('secret123');
  });

  it('shows loading state while logging in', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/E-Mail/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/Passwort/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    expect(screen.getByRole('button', { name: /Wird angemeldet/i })).toBeDisabled();
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/E-Mail/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/Passwort/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Unauthorized'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/E-Mail/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/Passwort/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ungültige E-Mail oder Passwort/i)).toBeInTheDocument();
    });
  });

  it('fills demo credentials on demo button click', async () => {
    const user = userEvent.setup();
    renderLogin();

    const demoButton = screen.getByRole('button', { name: /owner@example\.com/i });
    await user.click(demoButton);

    expect(screen.getByLabelText(/E-Mail/i)).toHaveValue('owner@example.com');
    expect(screen.getByLabelText(/Passwort/i)).toHaveValue('password123');
  });
});
