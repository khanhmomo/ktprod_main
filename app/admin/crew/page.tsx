'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiUser } from 'react-icons/fi';

interface CrewMember {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'crew';
  permissions: string[];
  phone?: string;
  specialties?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function CrewManagement() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'crew' as 'super_admin' | 'crew',
    phone: '',
    specialties: [] as string[]
  });

  useEffect(() => {
    fetchCrew();
  }, []);

  const fetchCrew = async () => {
    try {
      console.log('Fetching crew members...');
      const response = await fetch('/api/admin/crew', {
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        // API returns crew array directly, not wrapped in { crew: [] }
        setCrew(Array.isArray(data) ? data : (data.crew || []));
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setCrew([]);
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
      setCrew([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting crew member:', formData);
    console.log('Editing member:', editingMember);
    
    try {
      const url = editingMember ? `/api/admin/crew/${editingMember._id}` : '/api/admin/crew';
      const method = editingMember ? 'PUT' : 'POST';
      
      console.log('Using URL:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        const updatedMember = await response.json();
        
        if (editingMember) {
          // Update existing crew member
          setCrew(crew.map(member => 
            member._id === editingMember._id ? updatedMember : member
          ));
          console.log('Crew member updated successfully');
        } else {
          // Add new crew member
          setCrew([...crew, updatedMember]);
          console.log('New crew member created successfully');
        }
        
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          role: 'crew',
          phone: '',
          specialties: []
        });
        setEditingMember(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save crew member'}`);
      }
    } catch (error) {
      console.error('Error saving crew member:', error);
      alert('Error saving crew member. Please try again.');
    }
  };

  const handleEdit = (member: CrewMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      specialties: member.specialties || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crew member?')) return;
    
    try {
      const response = await fetch(`/api/admin/crew/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setCrew(crew.filter(member => member._id !== id));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete crew member'}`);
      }
    } catch (error) {
      console.error('Error deleting crew member:', error);
      alert('Error deleting crew member. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Crew Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your photography crew members and their permissions.
            </p>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Crew Members</h2>
              <p className="text-sm text-gray-500">
                {crew.length} {crew.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingMember(null);
                setFormData({
                  name: '',
                  email: '',
                  role: 'crew',
                  phone: '',
                  specialties: []
                });
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <FiPlus className="mr-2" />
              Add Crew Member
            </button>
          </div>

          {/* Crew List */}
          <div className="mt-6 bg-white shadow rounded-lg">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading crew members...</p>
              </div>
            ) : crew?.length === 0 ? (
              <div className="text-center py-12">
                <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No crew members</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first crew member.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <FiPlus className="mr-2 h-4 w-4" />
                    Add Crew Member
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crew Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specialties
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {crew?.map((member) => (
                      <tr key={member._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <FiUser className="text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {member.role === 'super_admin' ? 'Super Admin' : 'Crew'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {member.phone && (
                              <div className="flex items-center">
                                <FiPhone className="mr-1 h-4 w-4" />
                                {member.phone}
                              </div>
                            )}
                            <div className="flex items-center">
                              <FiMail className="mr-1 h-4 w-4" />
                              {member.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.specialties && member.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.specialties.map((specialty, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No specialties</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(member)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDelete(member._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMember ? 'Edit Crew Member' : 'Add Crew Member'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'crew' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="crew">Crew</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialties (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.specialties.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g., Photography, Videography, Editing"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  {editingMember ? 'Update' : 'Create'} Crew Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
