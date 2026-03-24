import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Scale } from 'lucide-react'
import api from '../lib/api'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name required'),
  bar_number: z.string().optional(),
  court_name: z.string().optional(),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/auth/register', data)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Scale className="h-10 w-10 text-gold" />
            <h1 className="font-serif text-4xl text-white">LegalPakistan</h1>
          </div>
          <p className="text-navy-300 text-sm font-sans">Create your advocate account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-serif text-2xl text-navy-800 mb-6 text-center">Register</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Full Name *</label>
              <input {...register('full_name')} className="input-base" placeholder="Muhammad Ali Khan" />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Email Address *</label>
              <input {...register('email')} type="email" className="input-base" placeholder="advocate@example.com" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Password *</label>
              <input {...register('password')} type="password" className="input-base" placeholder="Min 8 characters" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Bar Council Registration Number</label>
              <input {...register('bar_number')} className="input-base" placeholder="e.g. LHC-2024-001" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Primary Court</label>
              <input {...register('court_name')} className="input-base" placeholder="e.g. Lahore High Court" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
              <input {...register('phone')} className="input-base" placeholder="+92 300 1234567" />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
