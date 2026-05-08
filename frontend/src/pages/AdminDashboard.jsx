import React, { useState, useEffect } from 'react'
import { authAPI, projectsAPI, tasksAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Users,
  FolderOpen,
  CheckSquare,
  Trash2,
  Shield,
  TrendingUp,
  Activity,
  User,
  Clock,
  PlayCircle,
  CheckCircle,
  MessageSquare
} from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { count: 0 },
    projects: { totalProjects: 0, activeProjects: 0, completedProjects: 0, plannedProjects: 0 },
    tasks: { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 },
  })
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [usersRes, projectsRes, projectStats, taskStats, allTasksRes] = await Promise.all([
        authAPI.getAllUsers(),
        projectsAPI.getProjects({ limit: 100 }),
        projectsAPI.getProjectStats(),
        tasksAPI.getTaskStats(),
        tasksAPI.getTasks({ limit: 100 }) // Get latest tasks to monitor
      ])

      setUsers(usersRes.data.data.users)
      setProjects(projectsRes.data.data.projects)
      setAllTasks(allTasksRes.data.data.tasks)
      setStats({
        users: { count: usersRes.data.data.count },
        projects: projectStats.data.data.stats,
        tasks: taskStats.data.data.stats,
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their projects and tasks.')) {
      try {
        await authAPI.deleteUser(userId)
        setUsers(users.filter(u => u._id !== userId))
        toast.success('User deleted')
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
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
      <div className="card shadow-sm hover:shadow-md transition-shadow">
        <div className="card-body">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner h-12 w-12 border-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
            <p className="text-gray-500">Monitor all employees, projects, and mission-critical tasks.</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Workforce" value={stats.users.count} icon={Users} color="purple" />
        <StatCard title="Global Projects" value={stats.projects.totalProjects} icon={FolderOpen} color="blue" />
        <StatCard title="Live Activity" value={stats.projects.activeProjects} icon={Activity} color="green" />
        <StatCard title="Mission Tasks" value={stats.tasks.totalTasks} icon={CheckSquare} color="yellow" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Workforce Overview */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-b border-gray-100 flex items-center justify-between py-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Workforce Performance
              </h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Projects</th>
                      <th className="px-6 py-4">Active Tasks</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => {
                      const userId = user._id || user.id;
                      const userTasks = allTasks.filter(t => {
                        const assigneeId = t.assignedTo?._id || t.assignedTo?.id || t.assignedTo;
                        return assigneeId === userId;
                      });
                      const activeTasks = userTasks.filter(t => t.status !== 'completed').length;
                      
                      return (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role?.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role?.toLowerCase() === 'admin' ? 'admin' : 'employee'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {
                              // Filter projects where user is a member
                              projects.filter(p => p.members?.some(m => (m._id || m.id || m) === userId)).length
                            }
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 mr-2">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(activeTasks * 20, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-gray-700">{activeTasks}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Terminate Access"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Mission Updates */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-b border-gray-100 py-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Live Task Feed
              </h2>
            </div>
            <div className="card-body p-0">
              <div className="divide-y divide-gray-100">
                {allTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(task.status)}
                          <h4 className="font-bold text-gray-900">{task.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        {task.statusMessage && (
                          <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                            <p className="text-xs font-bold text-blue-700 flex items-center mb-1">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              UPDATE FROM {task.assignedTo?.name?.toUpperCase() || 'ASSIGNEE'}
                            </p>
                            <p className="text-sm text-blue-800 italic">"{task.statusMessage}"</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center space-x-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          <User className="h-3 w-3" />
                          <span>{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(task.updatedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Health / Summary */}
        <div className="space-y-8">
          <div className="card bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
            <div className="card-body p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Activity className="h-6 w-6 mr-2" />
                System Health
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>Task Completion</span>
                    <span>{Math.round((stats.tasks.completedTasks / (stats.tasks.totalTasks || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full" 
                      style={{ width: `${(stats.tasks.completedTasks / (stats.tasks.totalTasks || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>Active Projects</span>
                    <span>{stats.projects.activeProjects} / {stats.projects.totalProjects}</span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ width: `${(stats.projects.activeProjects / (stats.projects.totalProjects || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <button 
                onClick={fetchAdminData}
                className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all border border-white/20 backdrop-blur-sm"
              >
                Refresh Data Intelligence
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header py-5 bg-gray-50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Work Distribution</h3>
            </div>
            <div className="card-body p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Pending Operations</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {stats.tasks.pendingTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">In-Flight Progress</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {stats.tasks.inProgressTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Success Missions</span>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {stats.tasks.completedTasks}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
