import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInstances, WorkflowInstanceStatus } from '../hooks/useInstances';
import { CreateInstanceModal } from '../components/CreateInstanceModal';

interface Client {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
}

export function Instances() {
  const { instances, loading, error } = useInstances();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load clients and templates for filters
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [clientsRes, templatesRes] = await Promise.all([
          fetch('/api/clients').then(r => r.json()),
          fetch('/api/workflow-templates').then(r => r.json()),
        ]);
        setClients(clientsRes);
        setTemplates(templatesRes);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const getStatusBadgeClass = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case WorkflowInstanceStatus.DELAYED:
        return 'bg-yellow-100 text-yellow-800';
      case WorkflowInstanceStatus.CRITICAL:
        return 'bg-red-100 text-red-800';
      case WorkflowInstanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case WorkflowInstanceStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: WorkflowInstanceStatus) => {
    switch (status) {
      case WorkflowInstanceStatus.ACTIVE:
        return 'Aktiv';
      case WorkflowInstanceStatus.DELAYED:
        return 'Verzögert';
      case WorkflowInstanceStatus.CRITICAL:
        return 'Kritisch';
      case WorkflowInstanceStatus.COMPLETED:
        return 'Abgeschlossen';
      case WorkflowInstanceStatus.ARCHIVED:
        return 'Archiviert';
      default:
        return status;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unbekannt';
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unbekannt';
  };

  const getStepProgress = (instance: any) => {
    if (!instance.steps || instance.steps.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = instance.steps.filter((s: any) => s.status === 'done').length;
    const total = instance.steps.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  };

  const filteredInstances = instances.filter(instance => {
    const matchesStatus = filterStatus === 'all' || instance.status === filterStatus;
    const matchesClient = filterClient === 'all' || instance.clientId === filterClient;
    const clientName = getClientName(instance.clientId).toLowerCase();
    const templateName = getTemplateName(instance.templateId).toLowerCase();
    const matchesSearch = searchTerm === '' || 
      clientName.includes(searchTerm.toLowerCase()) ||
      templateName.includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesClient && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Laden...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workflow-Instanzen</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Neue Instanz
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suche
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mandant oder Template..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status</option>
              <option value={WorkflowInstanceStatus.ACTIVE}>Aktiv</option>
              <option value={WorkflowInstanceStatus.DELAYED}>Verzögert</option>
              <option value={WorkflowInstanceStatus.CRITICAL}>Kritisch</option>
              <option value={WorkflowInstanceStatus.COMPLETED}>Abgeschlossen</option>
              <option value={WorkflowInstanceStatus.ARCHIVED}>Archiviert</option>
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mandant
            </label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Mandanten</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instance List */}
      {filteredInstances.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Instanzen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie eine neue Workflow-Instanz.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Neue Instanz
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mandant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fortschritt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstances.map((instance) => {
                const progress = getStepProgress(instance);
                return (
                  <tr key={instance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getClientName(instance.clientId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getTemplateName(instance.templateId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {instance.periodMonth}/{instance.periodYear}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(instance.status)}`}>
                        {getStatusLabel(instance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/workflows/${instance.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateInstanceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
