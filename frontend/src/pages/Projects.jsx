import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI } from '../services/api'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Users,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const Projects = () => {
  const { user: currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchProjects()
  }, [currentPage, statusFilter, priorityFilter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
      }
      
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter

      const response = await projectsAPI.getProjects(params)
      setProjects(response.data.data.projects)
      setTotalPages(response.data.data.pages)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.deleteProject(projectId)
        setProjects(projects.filter(p => p._id !== projectId))
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const ProjectCard = ({ project }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link
                to={`/projects/${project._id}`}
                className="hover:text-blue-600"
              >
                {project.title}
              </Link>
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {project.members?.length || 0} members
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2 ml-4">
            <div className="flex items-center space-x-2">
              <span className={`status-badge status-${project.status.replace('-', '')}`}>
                {project.status}
              </span>
              <span className={`priority-badge priority-${project.priority}`}>
                {project.priority}
              </span>
            </div>
            
            {currentUser?.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/projects/${project._id}/edit`}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit project"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(project._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your projects and track progress
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Link
            to="/projects/new"
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
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
                placeholder="Search projects..."
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
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="form-input"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setPriorityFilter('')
                setCurrentPage(1)
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner h-8 w-8"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter || priorityFilter
              ? 'No projects found'
              : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter || priorityFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started'}
          </p>
          {!searchTerm && !statusFilter && !priorityFilter && currentUser?.role === 'admin' && (
            <Link
              to="/projects/new"
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredProjects.length > 0 && totalPages > 1 && (
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

export default Projects
