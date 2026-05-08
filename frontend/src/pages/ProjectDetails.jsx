import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsAPI, tasksAPI } from '../services/api'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Users,
  CheckSquare,
  Clock,
  PlayCircle,
  CheckCircle,
} from 'lucide-react'

const ProjectDetails = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchProjectDetails()
    fetchProjectTasks()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      const response = await projectsAPI.getProject(id)
      setProject(response.data.data.project)
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
  }

  const fetchProjectTasks = async () => {
    try {
      const response = await tasksAPI.getTasks({ projectId: id })
      setTasks(response.data.data.tasks)
    } catch (error) {
      console.error('Error fetching project tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      try {
        await projectsAPI.deleteProject(id)
        window.location.href = '/projects'
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId)
        setTasks(tasks.filter(t => t._id !== taskId))
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in-progress':
        return <PlayCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const TaskCard = ({ task }) => (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
              {task.assignedTo && (
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-blue-700">
                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {task.assignedTo.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <span className={`status-badge status-${task.status.replace('-', '')} flex items-center`}>
              {getStatusIcon(task.status)}
              <span className="ml-1">{task.status}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDeleteTask(task._id)}
                className="text-red-600 hover:text-red-800"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    )
  }

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/projects/${id}/edit`}
            className="btn btn-secondary flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeleteProject}
            className="btn btn-danger flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Project Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`status-badge status-${project.status.replace('-', '')}`}>
                    {project.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`priority-badge priority-${project.priority}`}>
                    {project.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {project.members?.length || 0} members
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Task Statistics</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{taskStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-semibold text-yellow-600">{taskStats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-semibold text-blue-600">{taskStats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{taskStats.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Tasks ({taskStats.total})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            </div>
            <div className="card-body">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No tasks yet for this project.
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
            <Link
              to={`/tasks/new?projectId=${id}`}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <CheckSquare className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">Create your first task for this project</p>
              <Link
                to={`/tasks/new?projectId=${id}`}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectDetails
