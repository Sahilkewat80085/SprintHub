import React, { useState, useEffect } from 'react'
import { authAPI, projectsAPI, tasksAPI } from '../services/api'
import {
  Users,
  FolderOpen,
  CheckSquare,
  Trash2,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { count: 0 },
    projects: { totalProjects: 0, activeProjects: 0, completedProjects: 0 },
    tasks: { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 },
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [usersRes, projectStats, taskStats] = await Promise.all([
        authAPI.getAllUsers(),
        projectsAPI.getProjectStats(),
        tasksAPI.getTaskStats(),
      ])

      setUsers(usersRes.data.data.users)
      setStats({
        users: { count: usersRes.data.data.count },
        projects: projectStats.data.data.stats,
        tasks: taskStats.data.data.stats,
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their projects and tasks.')) {
      try {
        await authAPI.deleteUser(userId)
        setUsers(users.filter(u => u._id !== userId))
        setStats(prev => ({
          ...prev,
          users: { count: prev.users.count - 1 }
        }))
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
      red: 'bg-red-50 text-red-600',
    }

    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {trend && (
                  <div className={`flex items-center text-sm ${
                    trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const UserCard = ({ user }) => (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{user.name}</h4>
              <p className="text-sm text-gray-600">{user.email}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDeleteUser(user._id)}
              className="text-red-600 hover:text-red-800"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              System overview and user management
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users.count}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Projects"
          value={stats.projects.totalProjects}
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={stats.projects.activeProjects}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Tasks"
          value={stats.tasks.totalTasks}
          icon={CheckSquare}
          color="yellow"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Project Statistics</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Projects</span>
                <span className="font-semibold">{stats.projects.totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="font-semibold text-green-600">{stats.projects.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Projects</span>
                <span className="font-semibold text-blue-600">{stats.projects.completedProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Planned Projects</span>
                <span className="font-semibold text-yellow-600">{stats.projects.plannedProjects}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Task Statistics</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold">{stats.tasks.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Tasks</span>
                <span className="font-semibold text-yellow-600">{stats.tasks.pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">{stats.tasks.inProgressTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Tasks</span>
                <span className="font-semibold text-green-600">{stats.tasks.completedTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600">
            Total users: {users.length}
          </p>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
