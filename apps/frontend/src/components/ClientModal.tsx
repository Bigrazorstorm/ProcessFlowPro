import React, { useState, useEffect } from 'react';
import { Client, CreateClientDto, UpdateClientDto, ContactPerson, TaxAdvisorContact } from '../hooks/useClients';
import { useUsers } from '../hooks/useUsers';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateClientDto | UpdateClientDto) => Promise<void>;
  client?: Client | null;
}

const INDUSTRIES = [
  'Dienstleistung',
  'Handel',
  'Handwerk',
  'Industrie',
  'IT/Software',
  'Gesundheitswesen',
  'Gastronomie',
  'Immobilien',
  'Freie Berufe',
  'Non-Profit',
  'Sonstige',
];

const SPECIALTIES = [
  'Lohnbuchhaltung',
  'Finanzbuchhaltung',
  'Jahresabschluss',
  'Steuerberatung',
  'Betriebswirtschaftliche Beratung',
  'Unternehmensgründung',
  'Controlling',
];

export default function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const { users } = useUsers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    taxNumber: '',
    companyNumber: '',
    industry: '',
    employeeCount: 1,
    reliabilityFactor: 1.0,
    primaryUserId: '',
    secondaryUserId: '',
    specialties: [] as string[],
    contacts: [] as ContactPerson[],
    taxAdvisorContact: undefined as TaxAdvisorContact | undefined,
    isActive: true,
  });

  const [newContact, setNewContact] = useState<ContactPerson>({ name: '', role: '', email: '', phone: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        address: client.address || '',
        taxNumber: client.taxNumber || '',
        companyNumber: client.companyNumber || '',
        industry: client.industry || '',
        employeeCount: client.employeeCount,
        reliabilityFactor: client.reliabilityFactor,
        primaryUserId: client.primaryUserId || '',
        secondaryUserId: client.secondaryUserId || '',
        specialties: client.specialties || [],
        contacts: client.contacts || [],
        taxAdvisorContact: client.taxAdvisorContact,
        isActive: client.isActive,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        taxNumber: '',
        companyNumber: '',
        industry: '',
        employeeCount: 1,
        reliabilityFactor: 1.0,
        primaryUserId: '',
        secondaryUserId: '',
        specialties: [],
        contacts: [],
        taxAdvisorContact: undefined,
        isActive: true,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        primaryUserId: formData.primaryUserId || undefined,
        secondaryUserId: formData.secondaryUserId || undefined,
      };
      await onSave(data);
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    if (formData.specialties.includes(specialty)) {
      setFormData({ ...formData, specialties: formData.specialties.filter((s) => s !== specialty) });
    } else {
      setFormData({ ...formData, specialties: [...formData.specialties, specialty] });
    }
  };

  const handleAddContact = () => {
    if (newContact.name.trim()) {
      setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
      setNewContact({ name: '', role: '', email: '', phone: '' });
      setShowContactForm(false);
    }
  };

  const handleRemoveContact = (index: number) => {
    setFormData({ ...formData, contacts: formData.contacts.filter((_, i) => i !== index) });
  };

  const availableUsers = users.filter((u) => u.isActive);
  const secondaryUsers = availableUsers.filter((u) => u.id !== formData.primaryUserId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {client ? 'Mandant bearbeiten' : 'Neuer Mandant'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grunddaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Grunddaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branche
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Bitte wählen</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Steuernummer
                </label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handelsregisternr.
                </label>
                <input
                  type="text"
                  value={formData.companyNumber}
                  onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mitarbeiteranzahl
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bearbeiter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Bearbeiter</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primärer Bearbeiter
                </label>
                <select
                  value={formData.primaryUserId}
                  onChange={(e) => setFormData({ ...formData, primaryUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nicht zugewiesen</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sekundärer Bearbeiter
                </label>
                <select
                  value={formData.secondaryUserId}
                  onChange={(e) => setFormData({ ...formData, secondaryUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.primaryUserId}
                >
                  <option value="">Nicht zugewiesen</option>
                  {secondaryUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zuverlässigkeitsfaktor (0.1 - 2.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="2.0"
                value={formData.reliabilityFactor}
                onChange={(e) => setFormData({ ...formData, reliabilityFactor: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Faktor für Deadline-Puffer (1.0 = normal, &lt;1.0 = zuverlässig, &gt;1.0 = kritisch)
              </p>
            </div>
          </div>

          {/* Leistungsbereiche */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Leistungsbereiche</h3>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.specialties.includes(specialty)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Kontaktpersonen */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Kontaktpersonen</h3>
              <button
                type="button"
                onClick={() => setShowContactForm(!showContactForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Kontakt hinzufügen
              </button>
            </div>

            {showContactForm && (
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Rolle"
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="E-Mail"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Hinzufügen
                </button>
              </div>
            )}

            {formData.contacts.length > 0 && (
              <div className="space-y-2">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">
                        {contact.role && `${contact.role} • `}
                        {contact.email && `${contact.email} • `}
                        {contact.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          {client && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Mandant ist aktiv
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {client ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
