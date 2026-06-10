import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Activity, Download, Sliders, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, User, Thermometer, Brain, Heart,
  ChevronRight, Info, Stethoscope, Apple, Dumbbell, Eye, FileText,
  ShieldAlert, ArrowLeft, BarChart2
} from 'lucide-react'
import { predictApi, reportApi } from '../api/client'
import { usePredictionStore } from '../store/predictionStore'
import Navbar from '../components/layout/Navbar'
import { RippleButton } from '@hemanath-afk/afk-motion'

// ── Constants ────────────────────────────────────────────────────────────────
const DIS_COLORS = {
  'Common Cold': '#3B82F6', 'Influenza': '#6366F1', 'COVID-19': '#F97316',
  'Migraine': '#8B5CF6', 'Gastroenteritis': '#F59E0B', 'Food Poisoning': '#EAB308',
  'Hypertension': '#EC4899', 'Diabetes Risk': '#14B8A6',
  'Heart Disease Risk': '#EF4444', 'Healthy': '#10B981'
}

const SEV_META = {
  Low:       { color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0', label: 'Low Priority', icon: '🟢' },
  Medium:    { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', label: 'Medium Priority', icon: '🟡' },
  High:      { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'High Priority', icon: '🔴' },
  Emergency: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Emergency', icon: '🚨' },
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RiskGauge({ score = 0, severity = 'Low' }) {
  const meta = SEV_META[severity] || SEV_META.Low
  const clamp = Math.min(100, Math.max(0, score))
  const r = 56, cx = 70, cy = 70
  const circ = 2 * Math.PI * r
  const arc = (circ * 0.75)
  const dashOffset = arc - (arc * clamp) / 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={140} height={100} viewBox="0 0 140 100">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke="#E2E8F0" strokeWidth={10}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(-225 ${cx} ${cy})`}
        />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke={meta.color} strokeWidth={10}
          strokeDasharray={`${arc - dashOffset} ${circ}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(-225 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="'Outfit',sans-serif" fontWeight={800} fontSize={22} fill={meta.color}>
          {Math.round(clamp)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#64748B" fontWeight={600}>
          RISK SCORE
        </text>
      </svg>
      <span style={{
        fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 20,
        backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`
      }}>
        {meta.icon} {meta.label}
      </span>
    </div>
  )
}

function SectionCard({ title, subtitle, icon: Icon, iconColor = '#2563EB', children, delay = 0 }) {
  return (
    <div className={`card-solid anim-fade-up-${delay}`} style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '0.9rem', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ width: 36, height: 36, backgroundColor: `${iconColor}12`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${iconColor}20` }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.1rem' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Results() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { current, setResult } = usePredictionStore()
  const [prediction, setPrediction] = useState(current?.prediction_id === id ? current : null)
  const [loading, setLoading]       = useState(!prediction)
  const [downloading, setDl]        = useState(false)

  useEffect(() => {
    if (prediction) return
    predictApi.getOne(id)
      .then(res  => { setPrediction(res.data); setResult(res.data) })
      .catch(()  => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Loading ──
  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748B', fontWeight: 500 }}>Loading your triage results...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (!prediction) return null

  const {
    primary_class, top_diseases = [], risk = {}, shap, recommendations = {},
    created_at, features = {}, model_version
  } = prediction

  const sev    = risk?.severity || 'Low'
  const meta   = SEV_META[sev] || SEV_META.Low
  const disColor = DIS_COLORS[primary_class] || '#2563EB'

  // chart data
  const probData = (top_diseases || []).map(d => ({
    name:  d.disease,
    value: Math.round((d.probability || 0) * 100),
    fill:  DIS_COLORS[d.disease] || '#2563EB',
    confidence: d.confidence_score || 'N/A'
  }))

  const shapData = ((shap?.contributions || []))
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
    .slice(0, 8)
    .map(c => ({
      name:  c.feature?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.abs(c.shap * 100),
      fill:  c.direction === 'positive' ? '#EF4444' : '#10B981',
      dir:   c.direction
    }))

  const activeSymptoms = Object.entries(features?.symptoms || {})
    .filter(([, v]) => v?.severity > 0)
    .sort((a, b) => b[1].severity - a[1].severity)

  const handleDownload = async () => {
    setDl(true)
    try {
      await reportApi.download(id)
    } catch { /* silent fail */ } finally { setDl(false) }
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* ── Header Bar ── */}
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Link to="/history" style={{ color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <ArrowLeft size={14} /> Back to History
              </Link>
              <span style={{ color: '#E2E8F0' }}>·</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Session Complete</span>
            </div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>
              Triage Results
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.83rem' }}>
              <Clock size={13} />
              Analyzed on {created_at ? new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
              <span style={{ color: '#E2E8F0' }}>·</span>
              <span style={{ color: '#64748B' }}>Model {model_version || 'v1.0.0'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={handleDownload} disabled={downloading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', fontSize: '0.88rem', opacity: downloading ? 0.7 : 1 }}>
              <FileText size={15} /> {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <Link to={`/whatif/${id}`} style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', fontSize: '0.88rem', fontWeight: 700 }}>
                <Sliders size={15} /> What-If Simulator
              </RippleButton>
            </Link>
          </div>
        </div>

        {/* ── PRIMARY RESULT BANNER ── */}
        <div className="anim-fade-up-1" style={{ padding: '2rem', borderRadius: 16, backgroundColor: meta.bg, border: `2px solid ${meta.border}`, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 64, height: 64, backgroundColor: `${disColor}15`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${disColor}30` }}>
              <Stethoscope size={30} color={disColor} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                🎯 Primary Clinical Indication
              </div>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', fontWeight: 900, color: disColor, lineHeight: 1.15, margin: 0 }}>
                {primary_class || 'Healthy'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: 20, backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                  {meta.icon} {meta.label}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                  Based on {activeSymptoms.length} active symptom{activeSymptoms.length !== 1 ? 's' : ''} + {Object.keys(features?.follow_up_answers || {}).length} follow-up responses
                </span>
              </div>
            </div>
          </div>
          <RiskGauge score={risk?.score || 0} severity={sev} />
        </div>

        {/* ── ROW 1: Differential Diagnosis + SHAP Chart ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Differential Diagnosis */}
          <SectionCard title="Differential Diagnosis" subtitle="Top disease likelihoods from ensemble model" icon={BarChart2} iconColor="#2563EB" delay={2}>
            {probData.length > 0 ? (
              <>
                {probData.map((d, i) => (
                  <div key={d.name} style={{ marginBottom: i < probData.length - 1 ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: d.fill, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: '0.88rem', color: '#0F172A' }}>
                          {i === 0 && '🎯 '}{d.name}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 800, color: d.fill }}>
                        {d.value}%
                      </span>
                    </div>
                    <div style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${d.value}%`, height: '100%', backgroundColor: d.fill, borderRadius: 5, animation: 'progress-fill 0.8s ease both' }} />
                    </div>
                    {i === 0 && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748B' }}>
                        Confidence: <strong>{typeof d.confidence === 'number' ? `${(d.confidence * 100).toFixed(0)}%` : d.confidence}</strong>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.76rem', color: '#94A3B8' }}>
                  Multi-class ensemble · Random Forest · Gradient Boosting
                </div>
              </>
            ) : (
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No probability data available</p>
            )}
          </SectionCard>

          {/* SHAP Contributions */}
          <SectionCard title="Clinical Risk Drivers (SHAP)" subtitle="Feature importance from explainable AI analysis" icon={Brain} iconColor="#8B5CF6" delay={3}>
            {shapData.length > 0 ? (
              <>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={shapData} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5 }}>
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} stroke="#E2E8F0" tickFormatter={v => `${v.toFixed(0)}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 500 }} stroke="#E2E8F0" width={105} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.8rem' }}
                        formatter={(v, n, p) => [`${v.toFixed(1)} impact`, p.payload.dir === 'positive' ? '⬆ Increases Risk' : '⬇ Reduces Risk']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                        {shapData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.73rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} /> Increases risk
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#10B981', display: 'inline-block' }} /> Reduces risk
                  </span>
                </div>
              </>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: 8 }}>
                <Brain size={28} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>SHAP explainability not available for this prediction.</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── ROW 2: Symptom Profile + Follow-Up Answers ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Reported Symptoms */}
          <SectionCard title="Reported Symptom Profile" subtitle={`${activeSymptoms.length} active symptoms analyzed`} icon={Thermometer} iconColor="#F97316" delay={4}>
            {activeSymptoms.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {activeSymptoms.map(([sym, detail]) => {
                  const sev = detail?.severity || 0
                  const sevColor = sev >= 4 ? '#EF4444' : sev >= 3 ? '#F97316' : sev >= 2 ? '#F59E0B' : '#10B981'
                  return (
                    <div key={sym} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>{sym}</span>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.72rem', color: '#64748B' }}>
                          {detail?.duration > 0 && <span>Duration: <strong>{detail.duration}d</strong></span>}
                          {detail?.frequency > 0 && <span>Frequency: <strong>{['', 'Rare', 'Intermittent', 'Constant'][detail.frequency] || detail.frequency}</strong></span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {[1,2,3,4,5].map(d => (
                          <div key={d} style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: d <= sev ? sevColor : '#E2E8F0' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sevColor, minWidth: 30, textAlign: 'right' }}>{sev}/5</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No active symptoms recorded.</p>
            )}

            {/* Patient Info */}
            {(features?.age || features?.gender) && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 0.85rem', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                <User size={14} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#1E40AF', fontWeight: 600 }}>
                  Patient: {features.age && `${features.age} yrs`}{features.gender && ` · ${features.gender}`}
                </span>
              </div>
            )}
          </SectionCard>

          {/* Follow-Up Answers */}
          <SectionCard title="Clinical Follow-Up Responses" subtitle="Answers that refined the AI prediction" icon={Info} iconColor="#14B8A6" delay={5}>
            {Object.keys(features?.follow_up_answers || {}).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {Object.entries(features.follow_up_answers).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.8rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', padding: '0.15rem 0.55rem', backgroundColor: '#E2E8F0', borderRadius: 6 }}>
                      {String(val === true ? 'Yes' : val === false ? 'No' : val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: 8 }}>
                <Info size={24} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>No follow-up responses recorded for this session.</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── ROW 3: Recommendations ── */}
        {recommendations && (
          <div className="anim-fade-up-5" style={{ marginBottom: '1.25rem' }}>
            <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', paddingBottom: '0.9rem', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ width: 36, height: 36, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} color="#10B981" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Personalized Care Recommendations</h3>
                  <p style={{ fontSize: '0.76rem', color: '#64748B' }}>AI-generated guidance based on your triage profile</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {/* Diet */}
                {recommendations.diet?.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <Apple size={16} color="#16A34A" />
                      <strong style={{ fontSize: '0.85rem', color: '#166534' }}>Diet & Nutrition</strong>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {recommendations.diet.slice(0, 4).map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#166534', alignItems: 'flex-start' }}>
                          <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 2 }} color="#16A34A" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exercise */}
                {recommendations.exercise?.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <Dumbbell size={16} color="#2563EB" />
                      <strong style={{ fontSize: '0.85rem', color: '#1E40AF' }}>Exercise & Activity</strong>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {recommendations.exercise.slice(0, 4).map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#1E40AF', alignItems: 'flex-start' }}>
                          <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 2 }} color="#2563EB" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lifestyle */}
                {recommendations.lifestyle?.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#FAF5FF', borderRadius: 10, border: '1px solid #DDD6FE' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <TrendingUp size={16} color="#7C3AED" />
                      <strong style={{ fontSize: '0.85rem', color: '#4C1D95' }}>Lifestyle Changes</strong>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {recommendations.lifestyle.slice(0, 4).map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#4C1D95', alignItems: 'flex-start' }}>
                          <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 2 }} color="#7C3AED" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monitoring */}
                {recommendations.monitoring?.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <Eye size={16} color="#D97706" />
                      <strong style={{ fontSize: '0.85rem', color: '#92400E' }}>Monitoring Checklist</strong>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {recommendations.monitoring.slice(0, 4).map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#92400E', alignItems: 'flex-start' }}>
                          <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 2 }} color="#D97706" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Follow-Up Note */}
              {recommendations.followup && (
                <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <ShieldAlert size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#B91C1C', display: 'block', marginBottom: '0.2rem' }}>⚠️ Medical Follow-Up Recommended</strong>
                    <p style={{ fontSize: '0.82rem', color: '#7F1D1D', lineHeight: 1.5, margin: 0 }}>{recommendations.followup}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="anim-fade-up-6" style={{ padding: '1rem 1.25rem', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.5, margin: 0 }}>
            <strong>Medical Disclaimer:</strong> MedPredict AI provides educational health insights only. This is not a substitute for professional medical diagnosis or treatment. Always consult a qualified healthcare provider for serious or persistent symptoms.
          </p>
        </div>

      </div>
    </div>
  )
}
