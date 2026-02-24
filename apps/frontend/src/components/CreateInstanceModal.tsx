import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstances } from '../hooks/useInstances';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
  isActive: boolean;
}

interface Template {
  id: string;
  name: string;
  isActive: boolean;
}

interface CreateInstanceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInstanceModal({ onClose, onSuccess }: CreateInstanceModalProps) {
  const navigate = useNavigate();
  const { createInstance } = useInstances();
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    clientId: '',
    templateId: '',
    periodMonth: currentDate.getMonth() + 1,
    periodYear: currentDate.getFullYear(),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, templatesRes] = await Promise.all([
          api.get<Client[]>('/clients'),
          api.get<Template[]>('/workflow-templates'),
        ]);
        setClients(clientsRes.data.filter(c => c.isActive));
        setTemplates(templatesRes.data.filter(t => t.isActive));
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.clientId || !formData.templateId) {
        throw new Error('Bitte wählen Sie einen Mandanten und ein Template aus');
      }

      const instance = await createInstance({
        clientId: formData.clientId,
        templateId: formData.templateId,
      });

      // Navigate to the newly created instance
      navigate(`/workflows/${instance.id}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Instanz');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Neue Workflow-Instanz erstellen
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Template auswählen...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mandant <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Mandant auswählen...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monat
              </label>
              <select
                value={formData.periodMonth}
                onChange={(e) => setFormData({ ...formData, periodMonth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jahr
              </label>
              <select
                value={formData.periodYear}
                onChange={(e) => setFormData({ ...formData, periodYear: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Die Instanz wird auf Basis des ausgewählten Templates erstellt. 
              Alle Workflow-Schritte werden automatisch angelegt.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Erstelle...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
