import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export interface Client {
  id: string;
  name: string;
  address?: string;
  taxNumber?: string;
  companyNumber?: string;
  industry?: string;
  employeeCount: number;
  reliabilityFactor: number;
  primaryUserId?: string;
  secondaryUserId?: string;
  specialties: string[];
  contacts: ContactPerson[];
  taxAdvisorContact?: TaxAdvisorContact;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPerson {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface TaxAdvisorContact {
  name: string;
  firm?: string;
  email?: string;
  phone?: string;
}

export interface CreateClientDto {
  name: string;
  address?: string;
  taxNumber?: string;
  companyNumber?: string;
  industry?: string;
  employeeCount?: number;
  reliabilityFactor?: number;
  primaryUserId?: string;
  secondaryUserId?: string;
  specialties?: string[];
  contacts?: ContactPerson[];
  taxAdvisorContact?: TaxAdvisorContact;
}

export interface UpdateClientDto {
  name?: string;
  address?: string;
  taxNumber?: string;
  companyNumber?: string;
  industry?: string;
  employeeCount?: number;
  reliabilityFactor?: number;
  primaryUserId?: string | null;
  secondaryUserId?: string | null;
  specialties?: string[];
  contacts?: ContactPerson[];
  taxAdvisorContact?: TaxAdvisorContact;
  isActive?: boolean;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Client[]>('/clients');
      setClients(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Mandanten');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const createClient = async (data: CreateClientDto): Promise<Client> => {
    try {
      const response = await api.post<Client>('/clients', data);
      setClients([...clients, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Erstellen des Mandanten');
    }
  };

  const updateClient = async (id: string, data: UpdateClientDto): Promise<Client> => {
    try {
      const response = await api.patch<Client>(`/clients/${id}`, data);
      setClients(clients.map((c) => (c.id === id ? response.data : c)));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren des Mandanten');
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter((c) => c.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen des Mandanten');
    }
  };

  const reload = () => {
    loadClients();
  };

  return {
    clients,
    loading,
    error,
    reload,
    createClient,
    updateClient,
    deleteClient,
  };
}
