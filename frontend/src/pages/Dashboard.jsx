import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { projectsAPI, tasksAPI } from '../services/api'
import {
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    projects: { totalProjects: 0, activeProjects: 0, completedProjects: 0 },
    tasks: { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 },
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [projectStats, taskStats, projectsRes, tasksRes] = await Promise.all([
        projectsAPI.getProjectStats(),
        tasksAPI.getTaskStats(),
        projectsAPI.getProjects({ limit: 5 }),
        tasksAPI.getTasks({ limit: 5 }),
      ])

      setStats({
        projects: projectStats.data.data.stats,
        tasks: taskStats.data.data.stats,
      })
      setRecentProjects(projectsRes.data.data.projects)
      setRecentTasks(tasksRes.data.data.tasks)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
    }

    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Here's an overview of your projects and tasks.
          </p>
        </div>
        {user?.role?.toLowerCase() === 'admin' && (
          <div className="flex space-x-3">
            <Link
              to="/projects/new"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.projects.totalProjects}
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={stats.projects.activeProjects}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Tasks"
          value={stats.tasks.totalTasks}
          icon={CheckSquare}
          color="purple"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.tasks.pendingTasks}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No projects yet. Create your first project!
              </p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <Link
                        to={`/projects/${project._id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.description.substring(0, 50)}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`status-badge status-${project.status.replace(
                          '-',
                          ''
                        )}`}
                      >
                        {project.status}
                      </span>
                      <span
                        className={`priority-badge priority-${project.priority}`}
                      >
                        {project.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No tasks yet. Create your first task!
              </p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.projectId?.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`status-badge status-${task.status.replace(
                          '-',
                          ''
                        )}`}
                      >
                        {task.status}
                      </span>
                      {task.assignedTo && (
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">
                              {task.assignedTo.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
