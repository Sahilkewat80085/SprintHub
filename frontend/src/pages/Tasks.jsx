import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasksAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
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
  MessageSquare,
  X,
  Save,
  Activity
} from 'lucide-react'

const Tasks = () => {
  const { user: currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Status Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    statusMessage: ''
  })
  const [updating, setUpdating] = useState(false)

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
      toast.error('Failed to load tasks')
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
        toast.success('Task deleted')
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.error('Failed to delete task')
      }
    }
  }

  const openStatusModal = (task) => {
    setSelectedTask(task)
    setUpdateFormData({
      status: task.status,
      statusMessage: task.statusMessage || ''
    })
    setIsModalOpen(true)
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    try {
      setUpdating(true)
      const response = await tasksAPI.updateTaskStatus(selectedTask._id, updateFormData)
      if (response.data.success) {
        setTasks(tasks.map(t => 
          t._id === selectedTask._id ? { ...t, status: updateFormData.status, statusMessage: updateFormData.statusMessage } : t
        ))
        toast.success('Status updated')
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const title = task.title || ''
    const desc = task.description || ''
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         desc.toLowerCase().includes(searchTerm.toLowerCase())
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

  const isUserAssigned = (task) => {
    if (!task.assignedTo || !currentUser) return false;
    
    // Check if it's an object (populated) or a string (UUID)
    const assignedId = typeof task.assignedTo === 'object' 
      ? (task.assignedTo._id || task.assignedTo.id) 
      : task.assignedTo;
      
    const currentUserId = currentUser._id || currentUser.id;
    
    return assignedId === currentUserId;
  }

  const TaskCard = ({ task }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {task.description}
            </p>
            
            {task.statusMessage && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4 border border-blue-100 flex items-start">
                <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
                <div>
                  <span className="font-bold block text-xs uppercase tracking-wider mb-1">Latest Progress Report</span>
                  {task.statusMessage}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
              {task.projectId && (
                <div className="flex items-center">
                  <span className="font-medium mr-1 text-gray-400">Project:</span>
                  <span className="text-gray-700">{task.projectId.title || 'General'}</span>
                </div>
              )}
              {task.assignedTo && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {typeof task.assignedTo === 'object' ? task.assignedTo.name : 'Assigned User'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-3 ml-4">
            <span className={`status-badge status-${task.status.replace('-', '')} flex items-center shadow-sm`}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status}</span>
            </span>
            
            <div className="flex items-center space-x-2">
              {/* Button visible if Admin OR if the current user is the assignee */}
              {(currentUser?.role === 'admin' || isUserAssigned(task)) && (
                <button
                  onClick={() => openStatusModal(task)}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all shadow-sm"
                >
                  <Activity className="h-3 w-3 mr-1.5 text-blue-600" />
                  Update Status
                </button>
              )}
              
              {currentUser?.role === 'admin' && (
                <>
                  <Link
                    to={`/tasks/${task._id}/edit`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit task"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
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
            {currentUser?.role === 'admin' 
              ? 'Manage and assign tasks across all projects'
              : 'Track your assigned tasks and update status'}
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Link
            to="/tasks/new"
            className="btn btn-primary flex items-center shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        )}
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
                className="form-input pl-10 focus:ring-2 focus:ring-blue-500 transition-all"
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
              className="btn btn-secondary flex items-center justify-center"
            >
              <X className="h-4 w-4 mr-1" />
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
        <div className="text-center py-12 card bg-white">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-50 mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter || projectFilter
              ? 'No tasks found'
              : 'No tasks assigned to you'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-xs mx-auto">
            {searchTerm || statusFilter || projectFilter
              ? 'Try adjusting your search terms or filters.'
              : 'When admin assigns you a task, it will appear here for you to work on.'}
          </p>
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
          <div className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Update Task Status
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pending', 'in-progress', 'completed'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUpdateFormData(prev => ({ ...prev, status: s }))}
                      className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                        updateFormData.status === s 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      } capitalize`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status Message / Update</label>
                <textarea
                  className="form-input w-full min-h-[100px] text-sm focus:ring-blue-500"
                  placeholder="Tell the admin what you've accomplished..."
                  value={updateFormData.statusMessage}
                  onChange={(e) => setUpdateFormData(prev => ({ ...prev, statusMessage: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary px-6 py-2 flex items-center shadow-md shadow-blue-200"
                >
                  {updating ? (
                    <div className="spinner h-4 w-4 border-white"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Update
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
