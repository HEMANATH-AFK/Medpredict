import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Sliders, TrendingDown, TrendingUp, RefreshCw, ArrowLeft, Activity, CheckCircle } from 'lucide-react'
import { predictApi } from '../api/client'
import Navbar from '../components/layout/Navbar'
import { FadeUp, RippleButton } from '@hemanath-afk/afk-motion'

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
      console.error(err)
      setFetching(false)
      navigate('/dashboard')
    })
  }, [id, navigate])

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
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading simulator...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!original) return null

  const origRisk = original.result || simResult?.original_risk
  const delta = simResult?.delta_probability
  const hasSimulated = simResult !== null

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <FadeUp>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <Link to={`/results/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} /> Back to Results
              </Link>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={26} color="var(--primary)" />
                Symptom Simulator
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.1rem' }}>
                Run delta clinical simulations by shifting severity and follow-up values.
              </p>
            </div>
            <RippleButton className="btn-primary" onClick={runSimulation} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear' }} /> : <Activity size={16} />}
              {loading ? 'Simulating...' : 'Compute Delta Risk'}
            </RippleButton>
          </div>
        </FadeUp>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Categorized Sliders */}
            {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
              <FadeUp key={category}>
                <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    {category}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {symptoms.map(sym => {
                      const val = symptomMods[sym] ?? 0
                      const isOriginallyChecked = original.features?.symptoms?.[sym]?.severity > 0
                      
                      return (
                        <div key={sym} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 0.5fr', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{sym}</span>
                            {isOriginallyChecked && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>Active in Triage</span>
                            )}
                          </div>
                          
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={val}
                            onChange={(e) => handleSymptomSliderChange(sym, e.target.value)}
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                          />
                          
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: val > 0 ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'right' }}>
                            {val === 0 ? 'Off' : `Lvl ${val}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </FadeUp>
            ))}

            {/* Dynamic Follow-Ups Toggles (if any exist in original request) */}
            {Object.keys(followupMods).length > 0 && (
              <FadeUp>
                <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    Triggered Clinical Indicators
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
              </FadeUp>
            )}
          </div>

          {/* Results Side Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1rem' }}>
            
            {/* Original Condition Risk */}
            <FadeUp delay={100}>
              <div className="card-solid" style={{ padding: '1.5rem', backgroundColor: 'var(--surface)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Triage Risk Baseline
                </span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: DIS_COLORS[original.result?.primary_class] || '#2563EB', marginTop: '0.25rem' }}>
                  {original.result?.primary_class}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span className={`badge badge-${(original.result?.severity || 'low').toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                    {original.result?.severity} Risk
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Risk Index: <strong>{original.result?.risk_score?.toFixed(0)}%</strong>
                  </span>
                </div>
              </div>
            </FadeUp>

            {/* Simulated Risk */}
            {hasSimulated ? (
              <FadeUp delay={150}>
                <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: SEV_BG[simResult.simulated_risk?.severity], border: `1px solid ${SEV_COLORS[simResult.simulated_risk?.severity]}40` }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Simulated Projection
                  </span>
                  
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: SEV_COLORS[simResult.simulated_risk?.severity], marginTop: '0.25rem' }}>
                    {simResult.simulated_risk?.severity} Priority
                  </h3>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      New Risk Score: {simResult.simulated_risk?.score?.toFixed(0)}%
                    </span>
                  </div>

                  {/* Delta indicator badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    backgroundColor: delta < 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${delta < 0 ? '#10B981' : '#EF4444'}40`,
                    color: delta < 0 ? '#10B981' : '#EF4444',
                    marginBottom: '1rem'
                  }}>
                    {delta < 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
                    {delta < 0 ? '' : '+'}{(delta * 100).toFixed(0)}% change in risk
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    {simResult.message}
                  </p>
                </div>
              </FadeUp>
            ) : (
              <FadeUp delay={150}>
                <div className="card-solid" style={{ padding: '2.5rem 1.5rem', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: 200, borderStyle: 'dashed' }}>
                  <Sliders size={30} color="var(--text-muted)" />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
                    Adjust symptom intensity ranges on the left panel, then click <strong>Compute Delta Risk</strong> to observe clinical risk trends.
                  </p>
                </div>
              </FadeUp>
            )}

            <RippleButton className="btn-primary" onClick={runSimulation} disabled={loading} style={{ padding: '0.85rem', width: '100%', justifyContent: 'center', fontWeight: 700 }}>
              {loading ? 'Re-Computing Clinical Vectors...' : 'Run Simulation'}
            </RippleButton>

          </div>
        </div>

      </div>
    </div>
  )
}
