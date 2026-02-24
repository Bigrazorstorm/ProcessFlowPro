import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTemplates, WorkflowTemplate } from '../hooks/useTemplates';
import TemplateModal from '../components/TemplateModal';

export default function Templates() {
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, data);
    } else {
      await createTemplate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      setActionLoading(id);
      await deleteTemplate(id);
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchTerm === '' ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndustry = filterIndustry === '' || template.industry === filterIndustry;

    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && template.isActive) ||
      (filterActive === 'inactive' && !template.isActive);

    return matchesSearch && matchesIndustry && matchesActive;
  });

  // Get unique industries
  const industries = Array.from(new Set(templates.map((t) => t.industry).filter(Boolean)));

  const getStepTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'Aufgabe',
      approval: 'Freigabe',
      decision: 'Entscheidung',
      notification: 'Benachrichtigung',
    };
    return labels[type] || type;
  };

  if (loading && templates.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Workflow-Templates...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflow-Templates</h1>
            <p className="text-gray-600 mt-1">
              {filteredTemplates.length} von {templates.length} Templates
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neues Template
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
              <input
                type="text"
                placeholder="Name, Beschreibung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branche</label>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Alle Branchen</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Templates gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterIndustry
                ? 'Keine Templates entsprechen den Filterkriterien.'
                : 'Erstellen Sie Ihr erstes Workflow-Template.'}
            </p>
            {!searchTerm && !filterIndustry && (
              <button
                onClick={handleCreate}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Template erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                      {template.industry && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {template.industry}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {template.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {template.steps.length} Steps
                    </span>
                    <span className="text-xs">
                      {new Date(template.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>

                  {/* Steps Preview */}
                  {template.steps.length > 0 && (
                    <div className="mb-4 space-y-1">
                      {template.steps.slice(0, 3).map((step, idx) => (
                        <div key={step.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400">{idx + 1}.</span>
                          <span className="truncate">{step.name}</span>
                          <span className="text-gray-400">({getStepTypeLabel(step.type)})</span>
                        </div>
                      ))}
                      {template.steps.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{template.steps.length - 3} weitere...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      to={`/templates/${template.id}`}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-center text-sm font-medium"
                    >
                      Bearbeiten
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        deleteConfirm === template.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                      disabled={actionLoading === template.id}
                    >
                      {deleteConfirm === template.id ? 'Bestätigen?' : 'Löschen'}
                    </button>
                    {deleteConfirm === template.id && (
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                      >
                        Abbrechen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        template={selectedTemplate}
      />
    </Layout>
  );
}
