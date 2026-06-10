import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Activity, LayoutDashboard, History, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assessment', label: 'New Assessment', icon: Activity },
  { to: '/history',    label: 'History',   icon: History },
]

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.5rem' }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'0.6rem', textDecoration:'none' }}>
          <div style={{ width:34, height:34, backgroundColor:'var(--primary)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.2rem', color: 'var(--text-primary)' }}>MedPredict AI</span>
        </Link>

        {/* Desktop links */}
        {user && (
          <div style={{ display:'flex', gap:'0.25rem', alignItems:'center' }}>
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link key={to} to={to} style={{
                  display:'flex', alignItems:'center', gap:'0.4rem',
                  padding:'0.5rem 0.9rem', borderRadius:6, textDecoration:'none',
                  fontSize:'0.88rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                  transition:'all 0.2s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <Icon size={15} /> {label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ width:32, height:32, backgroundColor:'var(--primary)', color: 'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700 }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <button className="btn-secondary" onClick={handleLogout} style={{ padding:'0.4rem 0.8rem', gap:'0.35rem', fontSize:'0.82rem', borderRadius: 6 }}>
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ padding:'0.4rem 0.8rem', fontSize:'0.85rem' }}>Sign In</Link>
              <Link to="/register" className="btn-primary" style={{ padding:'0.4rem 0.8rem', fontSize:'0.85rem' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
