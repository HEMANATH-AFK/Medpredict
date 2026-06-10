import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Activity, TrendingUp, Heart, AlertTriangle, ArrowRight, ShieldAlert, History } from 'lucide-react'
import { analyticsApi } from '../api/client'
import Navbar from '../components/layout/Navbar'
import { FadeUp, RippleButton } from '@hemanath-afk/afk-motion'

const SEV_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Emergency: '#EF4444'
}

const DIS_COLORS = {
  'Common Cold': '#3B82F6',
  'Influenza': '#6366F1',
  'COVID-19': '#F97316',
  'Migraine': '#8B5CF6',
  'Gastroenteritis': '#F59E0B',
  'Food Poisoning': '#EAB308',
  'Hypertension': '#EC4899',
  'Diabetes Risk': '#14B8A6',
  'Heart Disease Risk': '#EF4444',
  'Healthy': '#10B981'
}

function KPICard({ title, value, subtitle, color, icon: Icon, delay }) {
  return (
    <FadeUp delay={delay}>
      <div className="card-solid" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '1.5rem', backgroundColor: 'var(--surface)', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
          {Icon && (
            <div style={{ width: 36, height: 36, backgroundColor: `${color}10`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
          )}
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: color || '#0F172A', marginTop: '0.2rem', lineHeight: 1.2 }}>
          {value ?? '—'}
        </div>
        {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</div>}
      </div>
    </FadeUp>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    analyticsApi.dashboard()
      .then(res => {
        setData(res.data)
        setLoad(false)
      })
      .catch((err) => {
        console.error(err)
        setLoad(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading dashboard analytics...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const sev = data?.latest_severity || 'Low'
  const sevColor = SEV_COLORS[sev] || '#2563EB'

  const riskTrend = (data?.risk_trend || []).map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: t.score,
    disease: t.disease,
    severity: t.severity,
    fill: SEV_COLORS[t.severity] || '#2563EB',
  }))

  const distBar = Object.entries(data?.disease_distribution || {}).map(([d, count]) => ({
    name: d,
    count,
    fill: DIS_COLORS[d] || '#2563EB'
  })).sort((a, b) => b.count - a.count)

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <FadeUp>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>My Health Dashboard</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.1rem' }}>Monitor symptom risk indicators and digital triage trends over time.</p>
            </div>
            <Link to="/assessment" style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <Activity size={16} />
                New Triage Assessment
              </RippleButton>
            </Link>
          </div>
        </FadeUp>

        {/* KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <KPICard 
            title="Assessments Done" 
            value={data?.total_assessments || 0} 
            subtitle="Triage sessions run" 
            color="#2563EB" 
            icon={Activity} 
            delay={50} 
          />
          <KPICard 
            title="Latest Risk Score" 
            value={data?.latest_risk_score !== null ? `${data.latest_risk_score.toFixed(0)}%` : '—'} 
            subtitle={data?.latest_severity ? `${data.latest_severity} Priority` : 'No checks'} 
            color={sevColor} 
            icon={TrendingUp} 
            delay={100} 
          />
          <KPICard 
            title="Latest Priority" 
            value={data?.latest_severity || '—'} 
            subtitle="Clinical classification" 
            color={sevColor} 
            icon={AlertTriangle} 
            delay={150} 
          />
          <KPICard 
            title="Dominant Risk Driver" 
            value={data?.top_risk_factor || 'None'} 
            subtitle="Most weight in last check" 
            color="#14B8A6" 
            icon={Heart} 
            delay={200} 
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Risk Score Timeline */}
          <FadeUp delay={250}>
            <div className="card-solid" style={{ padding: '2rem', backgroundColor: 'var(--surface)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Risk Score Timeline</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Triage risk index trend across the last 10 assessment entries.</p>
              
              {riskTrend.length > 0 ? (
                <div style={{ flex: 1, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTrend} margin={{ right: 20, left: 0, top: 10, bottom: 10 }}>
                      <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} stroke="var(--border)" />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} stroke="var(--border)" tickFormatter={v => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', color: '#0F172A', fontSize: '0.82rem' }}
                        formatter={(value, name, props) => [
                          `${Number(value).toFixed(0)}% (${props.payload.severity} Priority)`,
                          `Condition: ${props.payload.disease}`
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#2563EB" 
                        strokeWidth={2.5} 
                        dot={(props) => {
                          const { cx, cy, payload, index } = props;
                          return (
                            <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={payload.fill} stroke="#FFFFFF" strokeWidth={1.5} />
                          )
                        }}
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No assessments registered. Complete your first symptom check.</p>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Disease Distribution */}
          <FadeUp delay={300}>
            <div className="card-solid" style={{ padding: '2rem', backgroundColor: 'var(--surface)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Condition Distribution</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Differential frequency diagnostics count of registered outcomes.</p>
              
              {distBar.length > 0 ? (
                <div style={{ flex: 1, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distBar} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} stroke="var(--border)" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 600 }} stroke="var(--border)" width={110} />
                      <Tooltip 
                        contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', color: '#0F172A', fontSize: '0.82rem' }}
                        formatter={(value) => [`${value} times`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                        {distBar.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Differential metrics will populate after running triage assessments.</p>
                </div>
              )}
            </div>
          </FadeUp>
        </div>

        {/* Quick Actions Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          
          <FadeUp delay={350}>
            <Link to="/assessment" style={{ textDecoration: 'none' }}>
              <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--primary)" />
                    Start Triage Assessment
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Check active symptom metrics and generate clinical alerts.</p>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </Link>
          </FadeUp>

          <FadeUp delay={400}>
            <Link to="/history" style={{ textDecoration: 'none' }}>
              <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="var(--secondary)" />
                    Browse History Logs
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>View, compare and download PDFs of all past checks.</p>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            </Link>
          </FadeUp>

        </div>

      </div>
    </div>
  )
}
