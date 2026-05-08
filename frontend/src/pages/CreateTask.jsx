import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { tasksAPI, projectsAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, User as UserIcon, Layout } from 'lucide-react'

const CreateTask = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('projectId') || ''
  
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    projectId: initialProjectId,
    assignedTo: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        projectsAPI.getProjects({ limit: 100 }),
        authAPI.getAllUsers()
      ])
      
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data.projects)
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load form data')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.projectId) {
      toast.error('Please select a project')
      return
    }

    try {
      setLoading(true)
      const response = await tasksAPI.createTask(formData)
      if (response.data.success) {
        toast.success('Task created successfully')
        // Redirect back to the project details if we came from there
        if (initialProjectId) {
          navigate(`/projects/${initialProjectId}`)
        } else {
          navigate('/tasks')
        }
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-body space-y-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Layout className="h-4 w-4 mr-1 text-gray-400" />
                Target Project
              </label>
              <select
                name="projectId"
                required
                value={formData.projectId}
                onChange={handleChange}
                className="form-input bg-gray-50"
              >
                <option value="">Select a project...</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                name="title"
                required
                minLength={3}
                maxLength={100}
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Implement login API"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Detailed explanation of the task..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center px-8 py-2.5 shadow-md hover:shadow-lg transition-shadow"
          >
            {loading ? (
              <div className="spinner h-5 w-5 mr-2 border-white"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Create Task
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateTask
