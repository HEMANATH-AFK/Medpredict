import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Download, Sliders, AlertTriangle, CheckCircle, Activity, FileText, Heart, ShieldAlert, ArrowRight, ClipboardList, HelpCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { predictApi, reportApi } from '../api/client'
import { usePredictionStore } from '../store/predictionStore'
import Navbar from '../components/layout/Navbar'
import { FadeUp, RippleButton, HoverTilt } from '@hemanath-afk/afk-motion'

const SEV_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Emergency: '#EF4444'
}

const SEV_BG = {
  Low: 'rgba(16, 185, 129, 0.05)',
  Medium: 'rgba(245, 158, 11, 0.05)',
  High: 'rgba(239, 68, 68, 0.05)',
  Emergency: 'rgba(239, 68, 68, 0.1)'
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

function RiskGauge({ score, severity }) {
  const rotation = (score / 100) * 180 - 90
  const color = SEV_COLORS[severity] || '#2563EB'
  
  return (
    <div style={{ textAlign: 'center', position: 'relative', padding: '1rem 0' }}>
      <svg width="200" height="110" viewBox="0 0 180 100" style={{ display: 'block', margin: '0 auto' }}>
        {/* Background arc */}
        <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke={color}
          strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score/100) * 235} 235`} />
        {/* Needle */}
        <line
          x1="90" y1="90"
          x2={90 + 60 * Math.cos((rotation - 90) * Math.PI / 180)}
          y2={90 + 60 * Math.sin((rotation - 90) * Math.PI / 180)}
          stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="90" cy="90" r="6" fill="#0F172A" />
      </svg>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginTop: '-0.75rem', lineHeight: 1.2 }}>
        {score.toFixed(0)}<span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>%</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Overall Risk Intensity</div>
    </div>
  )
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { current, setResult } = usePredictionStore()
  const [prediction, setPrediction] = useState(current?.prediction_id === id ? current : null)
  const [loading, setLoading] = useState(!prediction)
  const [downloading, setDl] = useState(false)

  useEffect(() => {
    if (!prediction) {
      predictApi.getOne(id).then(res => {
        setPrediction(res.data)
        setLoading(false)
      }).catch((err) => {
        console.error(err)
        setLoading(false)
        navigate('/dashboard')
      })
    }
  }, [id, prediction, navigate])

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Retrieving Clinical Analysis...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!prediction) return null

  const { primary_class, top_diseases, risk, shap, recommendations, created_at, features } = prediction

  // Format Recharts data for top diseases
  const probData = (top_diseases || []).map(d => ({
    name: d.disease,
    value: Math.round(d.probability * 100),
    confidence: d.confidence_score,
    fill: DIS_COLORS[d.disease] || '#2563EB'
  })).sort((a, b) => b.value - a.value)

  // Format Recharts data for SHAP values
  const shapData = (shap?.contributions || []).map(c => ({
    name: c.feature,
    value: c.shap,
    abs_value: Math.abs(c.shap),
    fill: c.direction === 'risk' ? '#EF4444' : '#10B981',
    direction: c.direction
  })).sort((a, b) => b.abs_value - a.abs_value)

  // Get active symptoms
  const activeSymptoms = Object.entries(features?.symptoms || {})
    .filter(([_, state]) => state.severity > 0)

  // Get follow-up answers
  const activeFollowups = Object.entries(features?.follow_up_answers || {})

  const sev = risk?.severity || 'Low'
  const sevCol = SEV_COLORS[sev]
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleDownload = async () => {
    setDl(true)
    try {
      await reportApi.download(id)
    } catch (e) {
      alert('Report PDF download failed. Please try again.')
    } finally {
      setDl(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header Actions */}
        <FadeUp viewportTrigger={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assessment Session Complete</span>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>Triage Results</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.1rem' }}>Analyzed on {formattedDate}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleDownload} disabled={downloading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} />
                {downloading ? 'Generating Report...' : 'Download Medical Report'}
              </button>
              <Link to={`/whatif/${id}`} style={{ textDecoration: 'none' }}>
                <RippleButton className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={16} />
                  Symptom Simulator (What-If)
                </RippleButton>
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Row 1: Primary Diagnosis & Risk Gauge + Disease Probabilities */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Primary Condition Details */}
          <FadeUp delay={100} viewportTrigger={false}>
            <HoverTilt>
              <div className="card-solid" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--surface)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Primary Indication</span>
                    <span className={`badge badge-${sev.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{sev} Priority</span>
                  </div>
                  
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: DIS_COLORS[primary_class] || '#2563EB', lineHeight: 1.15, marginBottom: '0.5rem' }}>
                    {primary_class}
                  </h2>
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                    {primary_class === 'Healthy' 
                      ? 'No significant acute clinical pathology detected from active symptoms.' 
                      : `Symptoms highly correspond with clinical presentations of ${primary_class}. Check below for risk drivers and clinical recommendations.`
                    }
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <RiskGauge score={risk?.score || 0} severity={sev} />
                </div>
              </div>
            </HoverTilt>
          </FadeUp>

          {/* Probability Chart */}
          <FadeUp delay={200} viewportTrigger={false}>
            <div className="card-solid" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Differential Diagnostic Support</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Top 3 disease likelihoods calculated from model confidence scores.</p>
              
              <div style={{ flex: 1, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={probData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#64748B', fontSize: 11 }} stroke="var(--border)" />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#0F172A', fontSize: 11, fontWeight: 600 }} stroke="var(--border)" width={120} />
                    <Tooltip 
                      formatter={(value, name, props) => [`${value}% Probability`, `Confidence: ${props.payload.confidence}`]}
                      contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', color: '#0F172A', fontSize: '0.85rem' }} 
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                      {probData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <span>Model Confidence: <strong>Multi-class Ensemble</strong></span>
                <span>Version: <strong>{prediction.model_version || '1.0.0'}</strong></span>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Row 2: Reported Symptom Profile + SHAP Contributions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Patient Reported Symptom Profile Details */}
          <FadeUp delay={250} viewportTrigger={false}>
            <div className="card-solid" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={18} color="var(--primary)" />
                Reported Symptom Profile
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                Patient characteristics and active symptom details collected during assessment.
              </p>

              {/* Patient Basic Info */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Age</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{features?.age || 'N/A'} years</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Sex</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', textTransform: 'capitalize' }}>{features?.gender || 'N/A'}</span>
                </div>
              </div>

              {/* Symptom Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 220, overflowY: 'auto', paddingRight: '0.25rem', flex: 1 }}>
                {activeSymptoms.length > 0 ? (
                  activeSymptoms.map(([name, state]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>{name}</span>
                      <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>Lvl: <strong style={{ color: 'var(--primary)' }}>{state.severity}</strong></span>
                        <span>{state.duration}d</span>
                        <span>{state.frequency === 1 ? 'Rare' : state.frequency === 2 ? 'Intermittent' : 'Constant'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No symptoms reported (Asymptomatic).</p>
                )}
              </div>

              {/* Active Follow-Ups Details */}
              {activeFollowups.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <HelpCircle size={14} color="var(--secondary)" />
                    Clinical Follow-up Responses
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {activeFollowups.map(([key, val]) => {
                      const displayKey = key.replace(/_/g, ' ')
                      const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)
                      return (
                        <span key={key} style={{ fontSize: '0.72rem', backgroundColor: '#EFF6FF', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize', fontWeight: 600 }}>
                          {displayKey}: <strong>{displayVal}</strong>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Explainability (SHAP Contributions) */}
          <FadeUp delay={300} viewportTrigger={false}>
            <div className="card-solid" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Clinical Risk Drivers</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Features contributing most to the AI model's prediction.
              </p>
              
              <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.78rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  Increases Likelihood
                </span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  Decreases/Protective
                </span>
              </div>

              {shapData.length > 0 ? (
                <div style={{ flex: 1, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shapData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} stroke="var(--border)" />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#0F172A', fontSize: 10, fontWeight: 500 }} stroke="var(--border)" width={120} />
                      <Tooltip
                        formatter={(value, name, props) => {
                          const val = Number(value);
                          const dirText = props.payload.direction === 'risk' ? 'Increased risk weight' : 'Protective/Reduced risk weight';
                          return [`Weight: ${val.toFixed(4)}`, dirText];
                        }}
                        contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '8px', color: '#0F172A', fontSize: '0.82rem' }}
                      />
                      <Bar dataKey="abs_value" radius={[0, 4, 4, 0]} barSize={14}>
                        {shapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No features analyzed for SHAP explainability.</p>
                </div>
              )}
            </div>
          </FadeUp>
        </div>

        {/* Row 3: Care Protocol Guidance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Recommendations Card */}
          <FadeUp delay={400} viewportTrigger={false}>
            <div className="card-solid" style={{ padding: '2rem', backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Care & Guidance Protocol</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Personalized clinical support recommendations matched to predicted severity.</p>

              {recommendations ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {[
                    { title: 'Dietary Guidance', icon: '🥗', color: '#10B981', items: recommendations.diet },
                    { title: 'Physical Activity & Rest', icon: '🏃‍♂️', color: '#2563EB', items: recommendations.exercise },
                    { title: 'Lifestyle Support', icon: '💡', color: '#14B8A6', items: recommendations.lifestyle },
                  ].map(({ title, icon, color, items }) => (
                    items && items.length > 0 && (
                      <div key={title} className="card-solid" style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', boxShadow: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{icon}</span> {title}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, position: 'relative', paddingLeft: '0.75rem' }}>
                              <span style={{ position: 'absolute', left: 0, color, fontWeight: 700 }}>•</span> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '8px', padding: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No care guidelines generated.</p>
                </div>
              )}

              {recommendations?.followup && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: `${sevCol}10`, borderLeft: `4px solid ${sevCol}`, borderRadius: '4px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>📅 Follow-up Window:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{recommendations.followup}</span>
                </div>
              )}
            </div>
          </FadeUp>
        </div>

        {/* Monitoring Plan Card */}
        {recommendations?.monitoring && recommendations.monitoring.length > 0 && (
          <FadeUp delay={450} viewportTrigger={false}>
            <div className="card-solid" style={{ padding: '2rem', marginBottom: '1.5rem', backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>📋 Vigilance & Monitoring Indicators</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>Track these critical parameters. Seek emergency attention if any red-flag conditions develop.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {recommendations.monitoring.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        )}

        {/* Medical Disclaimer */}
        <FadeUp delay={500} viewportTrigger={false}>
          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={22} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#B45309' }}>Clinical Decision Support Disclaimer</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                MedPredict AI is designed strictly for educational and triage-support purposes. It does not provide direct medical diagnoses, prescription advice, or active clinical protocols. If you are experiencing serious or sudden symptoms (such as extreme shortness of breath, severe chest pain, or sudden limb weakness), please contact your local emergency services (e.g. 911) or consult with a primary care practitioner immediately.
              </p>
            </div>
          </div>
        </FadeUp>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
          <Link to="/assessment" style={{ textDecoration: 'none' }}>
            <RippleButton className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              Start New Triage Assessment
              <ArrowRight size={16} />
            </RippleButton>
          </Link>
        </div>

      </div>
    </div>
  )
}
