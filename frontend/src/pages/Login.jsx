import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { FadeUp, RippleButton } from '@hemanath-afk/afk-motion'

export default function Login() {
  const [showPwd, setShowPwd] = useState(false)
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true); setServerErr('')
    try {
      const res  = await authApi.login(data)
      const { access_token, refresh_token } = res.data
      const payload = JSON.parse(atob(access_token.split('.')[1]))
      login({ email: payload.email, role: payload.role, id: payload.sub }, access_token, refresh_token)
      navigate('/dashboard')
    } catch (err) {
      setServerErr(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--background)' }}>
      <FadeUp style={{ width: '100%', maxWidth: 440 }}>
        <div className="card-solid" style={{ padding: '2.5rem', backgroundColor: 'var(--surface)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, backgroundColor: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="white" />
              </div>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>MedPredict AI</span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Welcome back</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to your triage dashboard</p>
          </div>

          {serverErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: '1.2rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} /> {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label className="label" htmlFor="email-login"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Email</label>
              <input id="email-login" type="email" className="input-field"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="pwd-login"><Lock size={13} style={{ display: 'inline', marginRight: 4 }} />Password</label>
              <div style={{ position: 'relative' }}>
                <input id="pwd-login" type={showPwd ? 'text' : 'password'} className="input-field"
                  placeholder="••••••••" style={{ paddingRight: '2.8rem' }}
                  {...register('password', { required: 'Password is required' })} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <RippleButton type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </RippleButton>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to home</Link>
          </p>
        </div>
      </FadeUp>
    </div>
  )
}
