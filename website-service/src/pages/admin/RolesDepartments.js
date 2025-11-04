import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  CogIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

const RolesDepartments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadRoles(), loadDepartments()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiService.admin.getAllRoles();
      setRoles(response.result || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setRoles([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiService.admin.getAllDepartments();
      setDepartments(response.result || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await apiService.admin.createRole(roleData);
      await loadRoles();
      setShowCreateRoleModal(false);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleCreateDepartment = async (deptData) => {
    try {
      await apiService.admin.createDepartment(deptData);
      await loadDepartments();
      setShowCreateDepartmentModal(false);
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  const handleUpdateRole = async (roleId, roleData) => {
    try {
      await apiService.admin.updateRole(roleId, roleData);
      await loadRoles();
      setShowEditRoleModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleUpdateDepartment = async (deptId, deptData) => {
    try {
      await apiService.admin.updateDepartment(deptId, deptData);
      await loadDepartments();
      setShowEditDepartmentModal(false);
      setSelectedDepartment(null);
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await apiService.admin.deleteRole(roleId);
        await loadRoles();
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await apiService.admin.deleteDepartment(deptId);
        await loadDepartments();
      } catch (error) {
        console.error('Failed to delete department:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CogIcon className="h-8 w-8 text-primary-600 mr-3" />
            Roles & Departments Management
          </h1>
          <p className="text-gray-600 mt-2">
            Configure organizational structure, roles, and permissions
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'roles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
                Roles ({roles.length})
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'departments'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
                Departments ({departments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'roles' ? (
              <div>
                {/* Roles Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">System Roles</h2>
                    <p className="text-gray-600">Manage user roles and permissions</p>
                  </div>
                  <button
                    onClick={() => setShowCreateRoleModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Role
                  </button>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <div key={role.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <ShieldCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
                            {role.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedRole(role);
                              setShowEditRoleModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-500"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          {role.userCount} users assigned
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
                              >
                                {permission.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Created: {formatDate(role.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Departments Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
                    <p className="text-gray-600">Manage organizational departments</p>
                  </div>
                  <button
                    onClick={() => setShowCreateDepartmentModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Department
                  </button>
                </div>

                {/* Departments Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {departments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 text-primary-600 mr-2" />
                            {dept.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setShowEditDepartmentModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-500"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="text-red-600 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-sm">
                            <p className="text-gray-600">Manager</p>
                            <p className="font-medium text-gray-900">{dept.managerName}</p>
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-600">Employees</p>
                            <p className="font-medium text-gray-900">{dept.userCount}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {formatDate(dept.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Roles</p>
                <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Departments</p>
                <p className="text-2xl font-semibold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {departments.reduce((sum, role) => sum + role.userCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Dept Size</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {departments.length > 0 ? Math.round(departments.reduce((sum, dept) => sum + dept.userCount, 0) / departments.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateRoleModal && (
        <CreateRoleModal
          onClose={() => setShowCreateRoleModal(false)}
          onSubmit={handleCreateRole}
        />
      )}

      {showCreateDepartmentModal && (
        <CreateDepartmentModal
          onClose={() => setShowCreateDepartmentModal(false)}
          onSubmit={handleCreateDepartment}
        />
      )}

      {showEditRoleModal && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          onClose={() => {
            setShowEditRoleModal(false);
            setSelectedRole(null);
          }}
          onSubmit={(roleData) => handleUpdateRole(selectedRole.id, roleData)}
        />
      )}

      {showEditDepartmentModal && selectedDepartment && (
        <EditDepartmentModal
          department={selectedDepartment}
          onClose={() => {
            setShowEditDepartmentModal(false);
            setSelectedDepartment(null);
          }}
          onSubmit={(deptData) => handleUpdateDepartment(selectedDepartment.id, deptData)}
        />
      )}
    </div>
  );
};

// Create Role Modal
const CreateRoleModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const availablePermissions = [
    'USER_MANAGEMENT',
    'ROLE_MANAGEMENT', 
    'DEPARTMENT_MANAGEMENT',
    'PROJECT_MANAGEMENT',
    'TEAM_MANAGEMENT',
    'TASK_ASSIGNMENT',
    'TASK_EXECUTION',
    'TIME_TRACKING',
    'REPORTS',
    'SYSTEM_CONFIG',
    'CV_ANALYSIS',
    'PROFILE_UPDATE'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Role</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {permission.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Role Modal
const EditRoleModal = ({ role, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description,
    permissions: role.permissions
  });

  const availablePermissions = [
    'USER_MANAGEMENT',
    'ROLE_MANAGEMENT', 
    'DEPARTMENT_MANAGEMENT',
    'PROJECT_MANAGEMENT',
    'TEAM_MANAGEMENT',
    'TASK_ASSIGNMENT',
    'TASK_EXECUTION',
    'TIME_TRACKING',
    'REPORTS',
    'SYSTEM_CONFIG',
    'CV_ANALYSIS',
    'PROFILE_UPDATE'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Role</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {permission.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Department Modal
const CreateDepartmentModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    budget: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: parseFloat(formData.budget) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Department</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Budget ($)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Department Modal
const EditDepartmentModal = ({ department, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: department.name,
    description: department.description,
    location: department.location,
    budget: department.budget.toString()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget: parseFloat(formData.budget) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Department</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Budget ($)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesDepartments;