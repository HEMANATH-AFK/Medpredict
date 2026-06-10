import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Activity, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { authApi } from '../api/client'
import { FadeUp, RippleButton } from '@hemanath-afk/afk-motion'

export default function Register() {
  const [serverErr, setServerErr] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const pwd = watch('password', '')

  const onSubmit = async (data) => {
    setLoading(true); setServerErr('')
    try {
      await authApi.register({ email: data.email, password: data.password, name: data.name, role: data.role || 'patient' })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setServerErr(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <FadeUp style={{ width: '100%', maxWidth: 400 }}>
        <div className="card-solid" style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface)' }}>
          <CheckCircle size={56} color="var(--success)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Account Created!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Redirecting you to login…</p>
        </div>
      </FadeUp>
    </div>
  )

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--background)' }}>
      <FadeUp style={{ width: '100%', maxWidth: 460 }}>
        <div className="card-solid" style={{ padding: '2.5rem', backgroundColor: 'var(--surface)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, backgroundColor: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="white" />
              </div>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>MedPredict AI</span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Create Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start your health journey today</p>
          </div>

          {serverErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: '1.2rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} /> {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label" htmlFor="reg-name"><User size={13} style={{ display:'inline', marginRight:4 }} />Full Name</label>
              <input id="reg-name" className="input-field" placeholder="Dr. Riya Patel"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="reg-email"><Mail size={13} style={{ display:'inline', marginRight:4 }} />Email</label>
              <input id="reg-email" type="email" className="input-field" placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label"><User size={13} style={{ display:'inline', marginRight:4 }} />Role</label>
              <select className="input-field" {...register('role')}>
                <option value="patient">Patient</option>
                <option value="clinician">Clinician</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="reg-pwd"><Lock size={13} style={{ display:'inline', marginRight:4 }} />Password</label>
              <input id="reg-pwd" type="password" className="input-field" placeholder="Min 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="reg-confirm"><Lock size={13} style={{ display:'inline', marginRight:4 }} />Confirm Password</label>
              <input id="reg-confirm" type="password" className="input-field" placeholder="Repeat password"
                {...register('confirm', { validate: v => v === pwd || 'Passwords do not match' })} />
              {errors.confirm && <p className="error-msg">{errors.confirm.message}</p>}
            </div>

            <RippleButton type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </RippleButton>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </FadeUp>
    </div>
  )
}
