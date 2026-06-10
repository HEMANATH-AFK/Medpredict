import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import {
  Activity, TrendingUp, Heart, AlertTriangle, ArrowRight, History,
  User, FlaskConical, CheckCircle, AlertCircle, Info, ChevronDown,
  ChevronUp, Stethoscope, Target, BarChart2, Calendar, Thermometer,
  RotateCcw
} from 'lucide-react'
import { analyticsApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import { RippleButton } from '@hemanath-afk/afk-motion'

// ── Constants ─────────────────────────────────────────────────────────────────
const SEV_COLORS = { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444', Emergency: '#EF4444' }
const DIS_COLORS = {
  'Common Cold': '#3B82F6', 'Influenza': '#6366F1', 'COVID-19': '#F97316',
  'Migraine': '#8B5CF6', 'Gastroenteritis': '#F59E0B', 'Food Poisoning': '#EAB308',
  'Hypertension': '#EC4899', 'Diabetes Risk': '#14B8A6',
  'Heart Disease Risk': '#EF4444', 'Healthy': '#10B981'
}

// ── Lab Reference Ranges ──────────────────────────────────────────────────────
const LAB_FIELDS = [
  {
    id: 'hba1c', label: 'HbA1c', unit: '%', placeholder: 'e.g. 5.4', icon: '🩸',
    ranges: [
      { label: 'Normal', max: 5.7, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Pre-diabetic', max: 6.5, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Diabetic', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'Reflects avg blood sugar over ~3 months. Below 5.7% is normal.'
  },
  {
    id: 'glucose', label: 'Fasting Glucose', unit: 'mg/dL', placeholder: 'e.g. 90', icon: '💉',
    ranges: [
      { label: 'Normal', max: 100, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Pre-diabetic', max: 126, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Diabetic', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'Measured after 8h fast. Under 100 mg/dL is optimal.'
  },
  {
    id: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', placeholder: 'e.g. 185', icon: '🫀',
    ranges: [
      { label: 'Optimal', max: 200, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Borderline', max: 240, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'High Risk', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'Below 200 mg/dL is desirable. Above 240 is high risk.'
  },
  {
    id: 'hdl', label: 'HDL (Good Cholesterol)', unit: 'mg/dL', placeholder: 'e.g. 55', icon: '🟢',
    ranges: [
      { label: 'High Risk', max: 40, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
      { label: 'Borderline', max: 60, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Optimal', max: 999, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
    ],
    tip: 'Higher HDL is better. Above 60 is protective; below 40 is a risk factor.'
  },
  {
    id: 'ldl', label: 'LDL (Bad Cholesterol)', unit: 'mg/dL', placeholder: 'e.g. 120', icon: '🔴',
    ranges: [
      { label: 'Optimal', max: 100, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Borderline', max: 160, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'High Risk', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'LDL below 100 mg/dL is optimal. Above 160 increases cardiovascular risk.'
  },
  {
    id: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', placeholder: 'e.g. 140', icon: '🧪',
    ranges: [
      { label: 'Normal', max: 150, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Borderline', max: 200, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'High', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'Under 150 mg/dL is normal. High levels increase heart disease risk.'
  },
  {
    id: 'systolic_bp', label: 'Systolic Blood Pressure', unit: 'mmHg', placeholder: 'e.g. 118', icon: '💓',
    ranges: [
      { label: 'Normal', max: 120, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Elevated', max: 140, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Hypertension', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: 'The top BP number. Under 120 mmHg is optimal; above 140 is hypertension.'
  },
  {
    id: 'bmi', label: 'BMI', unit: 'kg/m²', placeholder: 'e.g. 22.5', icon: '⚖️',
    ranges: [
      { label: 'Underweight', max: 18.5, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Normal', max: 25, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { label: 'Overweight', max: 30, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
      { label: 'Obese', max: 999, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    ],
    tip: '18.5–24.9 is normal. Under 18.5 is underweight; over 30 is obese.'
  },
]

function getLabStatus(fieldId, rawValue) {
  const field = LAB_FIELDS.find(f => f.id === fieldId)
  if (!field || rawValue === '' || isNaN(parseFloat(rawValue))) return null
  const v = parseFloat(rawValue)
  return field.ranges.find(r => v < r.max) || field.ranges[field.ranges.length - 1]
}

function computeHealthScore(labValues) {
  let total = 0, count = 0
  for (const f of LAB_FIELDS) {
    const v = labValues[f.id]
    if (!v || isNaN(parseFloat(v))) continue
    const s = getLabStatus(f.id, v)
    if (!s) continue
    total += s.color === '#10B981' ? 100 : s.color === '#F59E0B' ? 55 : 10
    count++
  }
  return count === 0 ? null : Math.round(total / count)
}

// ── Small Components ──────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, color, icon: Icon, cls }) {
  return (
    <div className={`card-solid ${cls}`} style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {Icon && (
          <div style={{ width: 34, height: 34, backgroundColor: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} color={color} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 800, color, lineHeight: 1.1 }}>
        {value ?? '—'}
      </div>
      {subtitle && <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.3rem', fontWeight: 500 }}>{subtitle}</div>}
    </div>
  )
}

function LabResultRow({ field, value }) {
  const status = getLabStatus(field.id, value)
  const [tip, setTip] = useState(false)
  if (!status || value === '') return null

  return (
    <div style={{ padding: '0.85rem 1rem', backgroundColor: status.bg, border: `1px solid ${status.border}`, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.95rem' }}>{field.icon}</span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{field.label}</span>
          <button onClick={() => setTip(!tip)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            <Info size={12} color="#94A3B8" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.05rem', fontWeight: 800, color: status.color }}>
            {parseFloat(value)} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>{field.unit}</span>
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, backgroundColor: `${status.color}20`, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>
      {tip && <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.4rem', lineHeight: 1.5 }}>ℹ️ {field.tip}</p>}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]         = useState(null)
  const [loading, setLoad]      = useState(true)
  const [labOpen, setLabOpen]   = useState(false)
  const [labValues, setLabValues] = useState(LAB_FIELDS.reduce((a, f) => ({ ...a, [f.id]: '' }), {}))
  const [labDone, setLabDone]   = useState(false)
  const { user }                = useAuthStore()

  useEffect(() => {
    analyticsApi.dashboard()
      .then(r => { setData(r.data); setLoad(false) })
      .catch(() => setLoad(false))
  }, [])

  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748B', fontWeight: 500 }}>Loading dashboard...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const sev      = data?.latest_severity || 'Low'
  const sevColor = SEV_COLORS[sev] || '#2563EB'
  const riskTrend = (data?.risk_trend || []).map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: t.score, disease: t.disease, severity: t.severity,
    fill: SEV_COLORS[t.severity] || '#2563EB'
  }))
  const distBar = Object.entries(data?.disease_distribution || {})
    .map(([d, count]) => ({ name: d, count, fill: DIS_COLORS[d] || '#2563EB' }))
    .sort((a, b) => b.count - a.count)

  const filledCount = Object.values(labValues).filter(v => v !== '').length
  const healthScore = computeHealthScore(labValues)
  const scoreColor  = healthScore == null ? '#64748B' : healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444'
  const scoreName   = healthScore == null ? '' : healthScore >= 80 ? '✅ Good' : healthScore >= 50 ? '⚠️ Moderate Risk' : '❗ High Risk'

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* ── Header ── */}
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.1rem' }}>
              My Health Dashboard
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>Monitor your triage history, risk trends, and lab health indicators.</p>
          </div>
          <Link to="/assessment" style={{ textDecoration: 'none' }}>
            <RippleButton className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Activity size={16} /> New Triage Assessment
            </RippleButton>
          </Link>
        </div>

        {/* ── Patient Profile Card ── */}
        <div className="card-solid anim-fade-up-1" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 60, height: 60, backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.15rem' }}>
              {user?.email?.split('@')[0] || 'Patient'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>{user?.email}</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { icon: BarChart2, label: 'Assessments', value: data?.total_assessments || 0, color: '#2563EB' },
              { icon: Target,    label: 'Risk Status',  value: data?.latest_severity || 'N/A', color: sevColor },
              { icon: Calendar,  label: 'Last Check',   value: data?.total_assessments ? 'Recent' : 'None', color: '#14B8A6' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ width: 32, height: 32, backgroundColor: `${color}12`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.3rem' }}>
                  <Icon size={15} color={color} />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.05rem', color }}>{value}</div>
                <div style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>

          <Link to="/history" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
            <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <History size={14} /> Full History
            </button>
          </Link>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.1rem', marginBottom: '1.5rem' }}>
          <KPICard title="Total Assessments" value={data?.total_assessments || 0}    subtitle="Triage sessions done"          color="#2563EB" icon={Activity}      cls="anim-fade-up-2" />
          <KPICard title="Latest Risk Score"  value={data?.latest_risk_score != null ? `${data.latest_risk_score.toFixed(0)}%` : '—'} subtitle={data?.latest_severity ? `${data.latest_severity} Priority` : 'No sessions'} color={sevColor} icon={TrendingUp} cls="anim-fade-up-3" />
          <KPICard title="Current Priority"   value={data?.latest_severity || '—'}    subtitle="Clinical triage class"         color={sevColor} icon={AlertTriangle} cls="anim-fade-up-4" />
          <KPICard title="Top Risk Factor"    value={data?.top_risk_factor || 'None'} subtitle="Most weighted in last session"  color="#14B8A6"  icon={Heart}         cls="anim-fade-up-5" />
        </div>

        {/* ── Charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Risk Trend */}
          <div className="card-solid anim-fade-up-4" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem' }}>Risk Score Timeline</h3>
            <p style={{ color: '#64748B', fontSize: '0.77rem', marginBottom: '1.25rem' }}>Triage risk across your last 10 assessments.</p>
            {riskTrend.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={riskTrend} margin={{ right: 20, left: 0, top: 10, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#E2E8F0" />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} stroke="#E2E8F0" tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.8rem' }}
                      formatter={(v, n, p) => [`${Number(v).toFixed(0)}% – ${p.payload.severity}`, p.payload.disease]}
                    />
                    <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5}
                      dot={(p) => <circle key={p.index} cx={p.cx} cy={p.cy} r={5} fill={p.payload.fill} stroke="#fff" strokeWidth={1.5} />}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2E8F0', borderRadius: 8 }}>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center' }}>Complete an assessment<br />to see risk trends here.</p>
              </div>
            )}
          </div>

          {/* Condition Distribution */}
          <div className="card-solid anim-fade-up-5" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem' }}>Condition Distribution</h3>
            <p style={{ color: '#64748B', fontSize: '0.77rem', marginBottom: '1.25rem' }}>Frequency of diagnosed conditions across all sessions.</p>
            {distBar.length > 0 ? (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distBar} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#E2E8F0" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 600 }} stroke="#E2E8F0" width={112} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.8rem' }} formatter={v => [`${v} time${v !== 1 ? 's' : ''}`, 'Diagnosed']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={13}>
                      {distBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2E8F0', borderRadius: 8 }}>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center' }}>Condition breakdown will appear<br />after assessments.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── CHECK YOUR HEALTH — Lab Report Section ── */}
        <div className="card-solid anim-fade-up-5" style={{ backgroundColor: '#FFFFFF', marginBottom: '1.5rem', overflow: 'hidden' }}>

          {/* Collapsible Header */}
          <button
            onClick={() => setLabOpen(o => !o)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: labOpen ? '1px solid #E2E8F0' : 'none', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, backgroundColor: 'rgba(20,184,166,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(20,184,166,0.2)', flexShrink: 0 }}>
                <FlaskConical size={22} color="#14B8A6" />
              </div>
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.15rem' }}>
                  🔬 Check Your Lab Report Health
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Enter blood panel values to understand your metabolic &amp; cardiovascular health.
                  {filledCount > 0 && <span style={{ color: '#14B8A6', fontWeight: 600 }}> {filledCount} value{filledCount > 1 ? 's' : ''} entered.</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {healthScore && labDone && (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, backgroundColor: `${scoreColor}15`, color: scoreColor }}>
                  Score: {healthScore}/100
                </span>
              )}
              {labOpen ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
            </div>
          </button>

          {/* Expandable Body */}
          {labOpen && (
            <div style={{ padding: '2rem' }}>
              {/* Info Banner */}
              <div style={{ padding: '0.85rem 1.1rem', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, marginBottom: '1.75rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <Info size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.5, margin: 0 }}>
                  Enter values from your recent blood panel. All analysis is done locally — your data is never sent anywhere. Fill as many or as few fields as you have available.
                </p>
              </div>

              {/* Input Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {LAB_FIELDS.map(f => (
                  <div key={f.id}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                      {f.icon} {f.label} <span style={{ color: '#94A3B8', fontWeight: 400 }}>({f.unit})</span>
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder={f.placeholder}
                      value={labValues[f.id]}
                      step="0.1"
                      onChange={e => setLabValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                      style={{ fontSize: '0.88rem' }}
                    />
                    {/* Live status indicator */}
                    {labValues[f.id] !== '' && (() => {
                      const s = getLabStatus(f.id, labValues[f.id])
                      return s ? (
                        <span style={{ fontSize: '0.7rem', color: s.color, fontWeight: 700, marginTop: '0.2rem', display: 'block' }}>
                          ● {s.label}
                        </span>
                      ) : null
                    })()}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: labDone && filledCount > 0 ? '2rem' : 0 }}>
                <RippleButton
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  onClick={() => { if (!filledCount) return; setLabDone(true) }}
                >
                  <FlaskConical size={15} /> Analyze My Lab Results
                </RippleButton>
                {filledCount > 0 && (
                  <button
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                    onClick={() => { setLabValues(LAB_FIELDS.reduce((a, f) => ({ ...a, [f.id]: '' }), {})); setLabDone(false) }}
                  >
                    <RotateCcw size={13} /> Clear All
                  </button>
                )}
              </div>

              {/* Results Panel */}
              {labDone && filledCount > 0 && (
                <>
                  {/* Health Score Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '3.5rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                        {healthScore}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.3rem' }}>Health Score /100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.15rem', fontWeight: 800, color: scoreColor, marginBottom: '0.4rem' }}>
                        {scoreName} Health Profile
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
                        Based on <strong>{filledCount}</strong> lab value{filledCount > 1 ? 's' : ''} analyzed against clinical reference ranges.
                        {healthScore < 60 && ' Please consult a healthcare provider.'}
                      </p>
                    </div>
                    {/* Status tally */}
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      {[
                        { label: 'Normal', color: '#10B981', Icon: CheckCircle },
                        { label: 'Borderline', color: '#F59E0B', Icon: AlertCircle },
                        { label: 'High Risk', color: '#EF4444', Icon: AlertTriangle },
                      ].map(({ label, color, Icon }) => {
                        const n = LAB_FIELDS.filter(f => getLabStatus(f.id, labValues[f.id])?.color === color).length
                        return (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <Icon size={18} color={color} style={{ margin: '0 auto 0.2rem' }} />
                            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.3rem', fontWeight: 800, color }}>{n}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Thermometer size={15} color="#2563EB" /> Detailed Lab Breakdown
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {LAB_FIELDS.filter(f => labValues[f.id] !== '').map(f => (
                      <LabResultRow key={f.id} field={f} value={labValues[f.id]} />
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: '1.5rem', padding: '1.1rem 1.25rem', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E40AF', marginBottom: '0.15rem' }}>Want an AI-powered symptom prediction?</h4>
                      <p style={{ fontSize: '0.78rem', color: '#3B82F6' }}>Run a full triage assessment for differential diagnosis and SHAP explanations.</p>
                    </div>
                    <Link to="/assessment" style={{ textDecoration: 'none' }}>
                      <RippleButton className="btn-primary" style={{ gap: '0.4rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                        <Stethoscope size={14} /> Start Triage Assessment
                      </RippleButton>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Link to="/assessment" style={{ textDecoration: 'none' }}>
            <div className="card-solid anim-fade-up-6" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <Activity size={16} color="#2563EB" /> Start Triage Assessment
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.79rem' }}>AI diagnosis from your symptom profile.</p>
              </div>
              <ArrowRight size={16} color="#CBD5E1" />
            </div>
          </Link>

          <Link to="/history" style={{ textDecoration: 'none' }}>
            <div className="card-solid anim-fade-up-6" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(20,184,166,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <History size={16} color="#14B8A6" /> Browse History Logs
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.79rem' }}>View, compare, and download past assessments.</p>
              </div>
              <ArrowRight size={16} color="#CBD5E1" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}
