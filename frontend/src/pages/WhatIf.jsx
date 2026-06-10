import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Sliders, TrendingDown, TrendingUp, RefreshCw, ArrowLeft, Activity, AlertCircle } from 'lucide-react'
import { predictApi } from '../api/client'
import Navbar from '../components/layout/Navbar'
import { RippleButton } from '@hemanath-afk/afk-motion'

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

const SYMPTOM_CATEGORIES = {
  'Respiratory & Sensory': ['Cough', 'Sneezing', 'Sore Throat', 'Shortness of Breath', 'Loss of Taste', 'Loss of Smell'],
  'Systemic & Neurological': ['Fever', 'Chills', 'Fatigue', 'Body Pain', 'Headache', 'Dizziness'],
  'Gastrointestinal': ['Nausea', 'Vomiting', 'Diarrhea', 'Stomach Pain'],
  'Cardiovascular': ['Chest Pain']
}

export default function WhatIf() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [original, setOriginal] = useState(null)
  
  // Modifications state
  const [symptomMods, setSymptomMods] = useState({})
  const [followupMods, setFollowupMods] = useState({})
  
  const [simResult, setSimResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    predictApi.getOne(id).then(res => {
      const pred = res.data
      setOriginal(pred)
      
      // Initialize symptom values
      const initSymptomMods = {}
      if (pred.features?.symptoms) {
        Object.entries(pred.features.symptoms).forEach(([sym, state]) => {
          initSymptomMods[sym] = state.severity
        })
      }
      setSymptomMods(initSymptomMods)

      // Initialize followups
      if (pred.features?.follow_up_answers) {
        setFollowupMods({ ...pred.features.follow_up_answers })
      }
      setFetching(false)
    }).catch((err) => {
      console.error('WhatIf load error:', err)
      setFetchError('Could not load the prediction. It may have expired or you may not have access.')
      setFetching(false)
      // Do NOT navigate away — show error in-page
    })
  }, [id])

  const handleSymptomSliderChange = (sym, val) => {
    setSymptomMods(prev => ({
      ...prev,
      [sym]: parseInt(val)
    }))
  }

  const handleFollowupChange = (key, val) => {
    setFollowupMods(prev => ({
      ...prev,
      [key]: val
    }))
  }

  const runSimulation = async () => {
    setLoading(true)
    try {
      // Build request body: flat symptom modifications and nested follow_up_answers
      const modifications = {
        ...symptomMods,
        follow_up_answers: followupMods
      }
      const res = await predictApi.whatif({
        base_prediction_id: id,
        modifications
      })
      setSimResult(res.data)
    } catch (e) {
      alert('Simulation failed. Please verify symptom levels.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748B', fontWeight: 500 }}>Loading What-If Simulator...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, backgroundColor: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <AlertCircle size={28} color="#EF4444" />
          </div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Simulation Unavailable</h2>
          <p style={{ color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6 }}>{fetchError}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-secondary" style={{ gap: '0.4rem' }}>
                <ArrowLeft size={15} /> Go to Dashboard
              </RippleButton>
            </Link>
            <Link to="/history" style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-primary" style={{ gap: '0.4rem' }}>View History</RippleButton>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!original) return null

  const origRisk = original.risk || simResult?.original_risk
  const delta = simResult?.delta_probability
  const hasSimulated = simResult !== null

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        
        {/* Header */}
        <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to={`/results/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem' }}>
              <ArrowLeft size={14} /> Back to Results
            </Link>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={26} color="#2563EB" />
              Symptom What-If Simulator
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Adjust symptom severity levels and see how your clinical risk profile changes.
            </p>
          </div>
          <RippleButton className="btn-primary" onClick={runSimulation} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Activity size={16} />}
            {loading ? 'Simulating...' : 'Compute Delta Risk'}
          </RippleButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Categorized Sliders */}
            {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
              <div key={category} className="card-solid" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#2563EB', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  {category}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {symptoms.map(sym => {
                    const val = symptomMods[sym] ?? 0
                    const isOriginallyChecked = original.features?.symptoms?.[sym]?.severity > 0
                    const sevColor = val >= 4 ? '#EF4444' : val >= 3 ? '#F97316' : val >= 2 ? '#F59E0B' : val >= 1 ? '#14B8A6' : '#94A3B8'
                    
                    return (
                      <div key={sym} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.8fr auto', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{sym}</span>
                          {isOriginallyChecked && (
                            <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>● Active</span>
                          )}
                        </div>
                        
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          value={val}
                          onChange={(e) => handleSymptomSliderChange(sym, e.target.value)}
                          style={{ width: '100%', accentColor: sevColor }}
                        />
                        
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: sevColor, minWidth: 38, textAlign: 'right', fontFamily: "'Outfit',sans-serif" }}>
                          {val === 0 ? 'Off' : `${val}/5`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Dynamic Follow-Ups Toggles (if any exist in original request) */}
            {Object.keys(followupMods).length > 0 && (
              <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#2563EB', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  Clinical Follow-Up Adjustments
                </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Object.entries(followupMods).map(([key, val]) => {
                      const displayKey = key.replace(/_/g, ' ')
                      
                      // Handle Boolean values
                      if (typeof val === 'boolean') {
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                              {displayKey}
                            </span>
                            <button
                              onClick={() => handleFollowupChange(key, !val)}
                              style={{
                                width: 50,
                                height: 26,
                                borderRadius: 13,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: val ? 'var(--primary)' : 'var(--border)',
                                position: 'relative',
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <div
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  backgroundColor: '#FFFFFF',
                                  position: 'absolute',
                                  top: 4,
                                  left: val ? 28 : 4,
                                  transition: 'left 0.2s'
                                }}
                              />
                            </button>
                          </div>
                        )
                      }
                      
                      // Handle numeric values (like temp_value)
                      if (typeof val === 'number') {
                        return (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.3fr', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                              {displayKey}
                            </span>
                            <input
                              type="number"
                              step="any"
                              className="input-field"
                              value={val}
                              onChange={(e) => handleFollowupChange(key, parseFloat(e.target.value) || 0)}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            />
                          </div>
                        )
                      }

                      // Handle textual values/options (like chest_pain_type)
                      return (
                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.3fr', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                            {displayKey}
                          </span>
                          <select
                            className="input-field"
                            value={val}
                            onChange={(e) => handleFollowupChange(key, e.target.value)}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            <option value="sharp">Sharp</option>
                            <option value="dull">Dull</option>
                            <option value="pressure">Pressure</option>
                            <option value="exertion">Exertion</option>
                            <option value="rest">At Rest</option>
                            <option value="constant">Constant</option>
                          </select>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Results Side Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' }}>
              
              {/* Original Condition Risk */}
              <div className="card-solid" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  📊 Triage Baseline
                </span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: DIS_COLORS[original.primary_class] || '#2563EB', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
                  {original.primary_class || '—'}
                </h3>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, backgroundColor: `${SEV_COLORS[original.risk?.severity] || '#2563EB'}15`, color: SEV_COLORS[original.risk?.severity] || '#2563EB' }}>
                    {original.risk?.severity || 'Low'} Risk
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                    Risk Score: <strong style={{ color: '#0F172A' }}>{original.risk?.score?.toFixed(0) ?? '—'}%</strong>
                  </span>
                </div>
              </div>

              {/* Simulated Risk */}
              {hasSimulated ? (
                <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: SEV_BG[simResult.simulated_risk?.severity] || '#F8FAFC', border: `1px solid ${SEV_COLORS[simResult.simulated_risk?.severity] || '#E2E8F0'}40` }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    🔬 Simulated Projection
                  </span>
                  
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: SEV_COLORS[simResult.simulated_risk?.severity], marginTop: '0.3rem' }}>
                    {simResult.simulated_risk?.severity} Priority
                  </h3>

                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 700 }}>
                      Risk Score: {simResult.simulated_risk?.score?.toFixed(0)}%
                    </span>
                  </div>

                  {/* Delta badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.85rem', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
                    backgroundColor: delta < 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${delta < 0 ? '#10B981' : '#EF4444'}40`,
                    color: delta < 0 ? '#10B981' : '#EF4444',
                    marginBottom: '0.85rem'
                  }}>
                    {delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {delta < 0 ? '' : '+'}{(delta * 100).toFixed(0)}% change in risk
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>
                    {simResult.message}
                  </p>
                </div>
              ) : (
                <div className="card-solid" style={{ padding: '2.5rem 1.5rem', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: 200, borderStyle: 'dashed' }}>
                  <Sliders size={30} color="#CBD5E1" />
                  <p style={{ color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                    Adjust severity sliders on the left, then click <strong>Compute Delta Risk</strong> to see projected changes.
                  </p>
                </div>
              )}

              <RippleButton className="btn-primary" onClick={runSimulation} disabled={loading} style={{ padding: '0.85rem', width: '100%', justifyContent: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {loading ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Activity size={15} />}
                {loading ? 'Re-Computing...' : 'Run Simulation'}
              </RippleButton>

            </div>
          </div>

      </div>
    </div>
  )
}
