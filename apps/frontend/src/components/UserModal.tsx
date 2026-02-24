import { useState, useEffect } from 'react';
import { CreateUserDto, UpdateUserDto } from '../hooks/useUsers';

interface UserModalProps {
  user: any | null;
  users: any[];
  onClose: () => void;
  onSave: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  loading: boolean;
}

export default function UserModal({ user, users, onClose, onSave, loading }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'accountant',
    capacityPointsLimit: 100,
    isActive: true,
    primarySubstituteId: '',
    secondarySubstituteId: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        capacityPointsLimit: user.capacityPointsLimit,
        isActive: user.isActive,
        primarySubstituteId: user.primarySubstituteId || '',
        secondarySubstituteId: user.secondarySubstituteId || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      name: formData.name,
      role: formData.role,
      capacityPointsLimit: formData.capacityPointsLimit,
      isActive: formData.isActive,
      primarySubstituteId: formData.primarySubstituteId || null,
      secondarySubstituteId: formData.secondarySubstituteId || null,
    };

    if (!user) {
      data.email = formData.email;
      data.password = formData.password;
    }

    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {user ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email (nur bei Erstellung) */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Password (nur bei Erstellung) */}
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="trainee">Azubi</option>
              <option value="accountant">Buchhalter</option>
              <option value="senior">Senior</option>
              <option value="owner">Inhaber</option>
            </select>
          </div>

          {/* Capacity Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapazitätspunkte
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.capacityPointsLimit}
              onChange={(e) => setFormData({ ...formData, capacityPointsLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Primary Substitute */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primäre Vertretung
            </label>
            <select
              value={formData.primarySubstituteId}
              onChange={(e) => setFormData({ ...formData, primarySubstituteId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Keine</option>
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Secondary Substitute */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sekundäre Vertretung
            </label>
            <select
              value={formData.secondarySubstituteId}
              onChange={(e) => setFormData({ ...formData, secondarySubstituteId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Keine</option>
              {users
                .filter((u) => u.id !== user?.id && u.id !== formData.primarySubstituteId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Benutzer ist aktiv
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {user ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
