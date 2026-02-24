import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  capacityPointsLimit: number;
  isActive: boolean;
  primarySubstituteId?: string;
  secondarySubstituteId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  capacityPointsLimit?: number;
}

export interface UpdateUserDto {
  name?: string;
  role?: string;
  capacityPointsLimit?: number;
  isActive?: boolean;
  primarySubstituteId?: string | null;
  secondarySubstituteId?: string | null;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Users load error:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: CreateUserDto) => {
    try {
      const response = await api.post('/users', data);
      setUsers([...users, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Erstellen des Benutzers');
    }
  };

  const updateUser = async (id: string, data: UpdateUserDto) => {
    try {
      const response = await api.patch(`/users/${id}`, data);
      setUsers(users.map((u) => (u.id === id ? response.data : u)));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren des Benutzers');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen des Benutzers');
    }
  };

  return {
    users,
    loading,
    error,
    reload: loadUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
