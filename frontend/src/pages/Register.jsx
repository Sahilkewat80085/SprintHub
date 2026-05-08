import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      role: 'employee'
    }
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // Pass name, email, password, AND role
      const result = await registerUser(data.name, data.email, data.password, data.role)
      if (result.success) {
        navigate('/dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 shadow-inner">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Join SprintHub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your role and start managing projects
          </p>
        </div>
        <form className="mt-8 space-y-5 bg-white p-8 rounded-2xl shadow-xl border border-gray-100" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name too short' },
                  })}
                  type="text"
                  className={`form-input !pl-10 focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                  type="email"
                  className={`form-input !pl-10 focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Role Selection Dropdown */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1">
                Account Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('role', { required: 'Please select a role' })}
                  className="form-input !pl-10 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="employee">Employee (Task Execution)</option>
                  <option value="admin">Admin (Project Management)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 italic">
                * Admins can create projects and tasks. Employees can only update status.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input !pl-10 pr-10 focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 flex items-center justify-center shadow-lg shadow-blue-200 transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner h-4 w-4 border-white mr-2"></div>
                  Setting up...
                </div>
              ) : (
                'Create Workspace Account'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Already have an account? <span className="underline">Sign in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
