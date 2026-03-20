import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/authStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Save, User } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  bar_number: z.string().optional(),
  court_name: z.string().optional(),
  phone: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
})

type FormData = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      bar_number: user?.bar_number || '',
      court_name: user?.court_name || '',
      phone: user?.phone || '',
    },
  })

  const updateProfile = useMutation({
    mutationFn: (data: FormData) => api.put('/users/me', data).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.setState({ user: data })
      toast.success('Profile updated')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Update failed')
    },
  })

  const onSubmit = (data: FormData) => {
    updateProfile.mutate(data)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-serif text-3xl text-navy-800">Settings</h1>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-navy-800 flex items-center justify-center">
            <span className="text-white font-serif text-2xl">
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <h2 className="font-serif text-xl text-navy-800">{user?.full_name}</h2>
            <p className="text-sm text-navy-500 font-sans">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Full Name *</label>
            <input {...register('full_name')} className="input-base" />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Bar Council Registration Number
            </label>
            <input {...register('bar_number')} className="input-base" placeholder="LHC-2024-001" />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Primary Court</label>
            <input {...register('court_name')} className="input-base" placeholder="Lahore High Court" />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
            <input {...register('phone')} className="input-base" placeholder="+92 300 1234567" />
          </div>

          {/* Password Change */}
          <div className="border-t border-navy-50 pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="text-sm text-gold hover:underline font-sans"
            >
              {showPasswordFields ? 'Cancel password change' : 'Change password'}
            </button>

            {showPasswordFields && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">
                    Current Password
                  </label>
                  <input
                    {...register('current_password')}
                    type="password"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">New Password</label>
                  <input {...register('new_password')} type="password" className="input-base" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* App Info */}
      <div className="card bg-navy-800 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚖️</span>
          <div>
            <h3 className="font-serif text-lg">LegalPakistan</h3>
            <p className="text-navy-300 text-xs font-sans">Version 1.0.0 · Practice Management System</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-navy-400 font-sans space-y-1">
          <p>AI Model: Claude (claude-sonnet-4-20250514)</p>
          <p>Vector Search: FAISS + Multilingual MiniLM</p>
          <p>Laws: PPC · CrPC · CPC · Constitution 1973 · Qanun-e-Shahadat</p>
        </div>
      </div>
    </div>
  )
}
