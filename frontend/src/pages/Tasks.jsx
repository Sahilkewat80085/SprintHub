import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasksAPI, projectsAPI } from '../services/api'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  Clock,
  PlayCircle,
} from 'lucide-react'

const Tasks = () => {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [currentPage, statusFilter, projectFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
      }
      
      if (statusFilter) params.status = statusFilter
      if (projectFilter) params.projectId = projectFilter

      const response = await tasksAPI.getTasks(params)
      setTasks(response.data.data.tasks)
      setTotalPages(response.data.data.pages)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getProjects({ limit: 100 })
      setProjects(response.data.data.projects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId)
        setTasks(tasks.filter(t => t._id !== taskId))
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateTaskStatus(taskId, newStatus)
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link
                to={`/tasks/${task._id}`}
                className="hover:text-blue-600"
              >
                {task.title}
              </Link>
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {task.description}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
              {task.projectId && (
                <div className="flex items-center">
                  <span className="font-medium">Project:</span>
                  <Link
                    to={`/projects/${task.projectId._id}`}
                    className="ml-1 text-blue-600 hover:text-blue-500"
                  >
                    {task.projectId.title}
                  </Link>
                </div>
              )}
              {task.assignedTo && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {task.assignedTo.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2 ml-4">
            <div className="flex items-center space-x-2">
              <span className={`status-badge status-${task.status.replace('-', '')} flex items-center`}>
                {getStatusIcon(task.status)}
                <span className="ml-1">{task.status}</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <Link
                to={`/tasks/${task._id}/edit`}
                className="text-blue-600 hover:text-blue-800"
                title="Edit task"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => handleDelete(task._id)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track your tasks across all projects
          </p>
        </div>
        <Link
          to="/tasks/new"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="form-input"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setProjectFilter('')
                setCurrentPage(1)
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner h-8 w-8"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter || projectFilter
              ? 'No tasks found'
              : 'No tasks yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter || projectFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first task to get started'}
          </p>
          {!searchTerm && !statusFilter && !projectFilter && (
            <Link
              to="/tasks/new"
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredTasks.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
