import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Users, X } from 'lucide-react'

const EditProject = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'planned',
    members: []
  })

  useEffect(() => {
    fetchProjectAndUsers()
  }, [id])

  const fetchProjectAndUsers = async () => {
    try {
      setLoading(true)
      const [projectRes, usersRes] = await Promise.all([
        projectsAPI.getProject(id),
        authAPI.getAllUsers()
      ])

      if (projectRes.data.success) {
        const project = projectRes.data.data.project
        setFormData({
          title: project.title,
          description: project.description,
          priority: project.priority,
          status: project.status,
          members: project.members || []
        })
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load project details')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMemberToggle = (userId) => {
    setFormData(prev => {
      const isMember = prev.members.includes(userId)
      if (isMember) {
        return { ...prev, members: prev.members.filter(id => id !== userId) }
      } else {
        return { ...prev, members: [...prev.members, userId] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await projectsAPI.updateProject(id, formData)
      if (response.data.success) {
        toast.success('Project updated successfully')
        navigate(`/projects/${id}`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
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
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Describe the project goal..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

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
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Manage Members</h2>
            </div>
            <div className="card-body">
              <div className="max-h-80 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No other users found</p>
                ) : (
                  users.map(user => (
                    <label 
                      key={user._id} 
                      className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.members.includes(user._id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.members.includes(user._id)}
                        onChange={() => handleMemberToggle(user._id)}
                      />
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {formData.members.includes(user._id) && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 ml-2"></div>
                      )}
                    </label>
                  ))
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  {formData.members.length} members in project
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary w-full flex items-center justify-center py-3"
            >
              {saving ? (
                <div className="spinner h-5 w-5 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="btn btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditProject
