import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { predictApi } from '../api/client'
import { usePredictionStore } from '../store/predictionStore'
import Navbar from '../components/layout/Navbar'
import { FadeUp, RippleButton, HoverTilt } from '@hemanath-afk/afk-motion'

const STEPS = ['Demographics', 'Symptom Details', 'Follow-Up Questions', 'Review & Submit']

const SYMPTOMS_LIST = [
  "Fever", "Cough", "Sneezing", "Sore Throat", "Headache", "Body Pain",
  "Fatigue", "Dizziness", "Nausea", "Vomiting", "Diarrhea", "Chest Pain",
  "Shortness of Breath", "Stomach Pain", "Chills", "Loss of Taste", "Loss of Smell"
]

export default function Assessment() {
  const [step, setStep] = useState(0)
  
  // Demographics
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState('male')
  
  // Primary Symptoms checklist & state
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [symptomDetails, setSymptomDetails] = useState(
    SYMPTOMS_LIST.reduce((acc, sym) => {
      acc[sym] = { severity: 1, duration: '1', frequency: 1 }
      return acc;
    }, {})
  )

  // Dynamic follow-ups
  const [followupQuestions, setFollowupQuestions] = useState([])
  const [followupAnswers, setFollowupAnswers] = useState({})
  const [fetchingQuestions, setFetchingQuestions] = useState(false)

  // App-wide state
  const [loading, setLoad] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setResult } = usePredictionStore()

  // Reset or initialize details when symptoms checked
  const toggleSymptom = (sym) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    )
  }

  const handleDetailChange = (sym, field, value) => {
    setSymptomDetails(prev => ({
      ...prev,
      [sym]: {
        ...prev[sym],
        [field]: value
      }
    }))
  }

  // Fetch dynamic follow-ups when moving to step 2
  useEffect(() => {
    if (step === 2) {
      const fetchQuestions = async () => {
        setFetchingQuestions(true)
        setError('')
        try {
          // Construct current symptoms payload
          const symptomsPayload = {}
          SYMPTOMS_LIST.forEach(sym => {
            if (selectedSymptoms.includes(sym)) {
              symptomsPayload[sym] = {
                severity: parseInt(symptomDetails[sym].severity),
                duration: parseFloat(symptomDetails[sym].duration),
                frequency: parseInt(symptomDetails[sym].frequency)
              }
            } else {
              symptomsPayload[sym] = { severity: 0, duration: 0.0, frequency: 0 }
            }
          })

          const res = await predictApi.questions({
            age: parseFloat(age),
            gender,
            symptoms: symptomsPayload
          })

          setFollowupQuestions(res.data.questions)
          
          // Pre-populate default answers if empty
          const initialAnswers = {}
          res.data.questions.forEach(q => {
            if (q.type === 'boolean') {
              initialAnswers[q.id] = false
            } else if (q.type === 'choice') {
              initialAnswers[q.id] = q.options ? q.options[0] : ''
            } else if (q.type === 'numeric') {
              initialAnswers[q.id] = q.id === 'temp_value' ? 98.6 : 0
            }
          })
          setFollowupAnswers(initialAnswers)
        } catch (err) {
          setError('Failed to fetch dynamic questions from AI engine.')
        } finally {
          setFetchingQuestions(false)
        }
      }
      fetchQuestions()
    }
  }, [step, selectedSymptoms, age, gender])

  const handleFollowupChange = (id, val) => {
    setFollowupAnswers(prev => ({
      ...prev,
      [id]: val
    }))
  }

  const onNext = () => {
    setStep(s => s + 1)
  }

  const onBack = () => {
    setStep(s => s - 1)
  }

  const onSubmit = async () => {
    setLoad(true)
    setError('')
    try {
      // Build final predict payload
      const symptomsPayload = {}
      SYMPTOMS_LIST.forEach(sym => {
        if (selectedSymptoms.includes(sym)) {
          symptomsPayload[sym] = {
            severity: parseInt(symptomDetails[sym].severity),
            duration: parseFloat(symptomDetails[sym].duration),
            frequency: parseInt(symptomDetails[sym].frequency)
          }
        } else {
          symptomsPayload[sym] = { severity: 0, duration: 0.0, frequency: 0 }
        }
      })

      // Clean choice answers: mapping UI option back to lower key (like "Sharp pain" -> "sharp")
      const cleanedAnswers = { ...followupAnswers }
      if (cleanedAnswers["chest_pain_type"]) {
        const t = cleanedAnswers["chest_pain_type"].toLowerCase()
        if (t.includes("sharp")) cleanedAnswers["chest_pain_type"] = "sharp"
        else if (t.includes("dull")) cleanedAnswers["chest_pain_type"] = "dull"
        else if (t.includes("pressure")) cleanedAnswers["chest_pain_type"] = "pressure"
      }
      if (cleanedAnswers["chest_pain_activity"]) {
        const a = cleanedAnswers["chest_pain_activity"].toLowerCase()
        if (a.includes("exertion")) cleanedAnswers["chest_pain_activity"] = "exertion"
        else if (a.includes("rest")) cleanedAnswers["chest_pain_activity"] = "rest"
        else if (a.includes("constant")) cleanedAnswers["chest_pain_activity"] = "constant"
      }

      const res = await predictApi.predict({
        age: parseFloat(age),
        gender,
        symptoms: symptomsPayload,
        follow_up_answers: cleanedAnswers
      })
      
      setResult(res.data)
      navigate(`/results/${res.data.prediction_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Check your inputs.')
      setLoad(false)
    }
  }

  const renderFrequencyLabel = (freqVal) => {
    if (freqVal === 1) return 'Rare'
    if (freqVal === 2) return 'Intermittent'
    if (freqVal === 3) return 'Constant'
    return 'None'
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 800 }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'inactive'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.72rem', color: i === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 60, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', margin: '0 0.5rem', marginBottom: '1rem', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <FadeUp>
          <div className="card-solid" style={{ padding: '2.5rem', backgroundColor: 'var(--surface)' }}>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: '1.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* STEP 0: Demographics & Initial Symptoms */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>1. Demographic Data & Core Symptoms</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>Please enter your demographics and select all symptoms you are currently experiencing.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div>
                    <label className="label" htmlFor="age-input">Age</label>
                    <input id="age-input" type="number" className="input-field" value={age} onChange={(e) => setAge(e.target.value)} min={1} max={120} />
                  </div>
                  <div>
                    <label className="label" htmlFor="gender-input">Biological Sex</label>
                    <select id="gender-input" className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <label className="label" style={{ marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Select Active Symptoms</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
                  {SYMPTOMS_LIST.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym)
                    return (
                      <div 
                        key={sym} 
                        onClick={() => toggleSymptom(sym)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                          background: isChecked ? 'rgba(37,99,235,0.04)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} // Handled by div onClick
                          style={{ accentColor: 'var(--primary)' }} 
                        />
                        <span style={{ fontSize: '0.88rem', color: isChecked ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isChecked ? 600 : 400 }}>{sym}</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <RippleButton className="btn-primary" onClick={onNext}>
                    Continue <ChevronRight size={16} />
                  </RippleButton>
                </div>
              </div>
            )}

            {/* STEP 1: Symptom Details */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>2. Symptom Severity, Duration & Frequency</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>Define the severity (1-5), duration in days, and frequency for each checked symptom.</p>

                {selectedSymptoms.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8, marginBottom: '2.5rem' }}>
                    <HelpCircle size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem', display: 'inline' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>No symptoms selected</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You will be evaluated as asymptomatic / Healthy.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {selectedSymptoms.map((sym) => {
                      const details = symptomDetails[sym]
                      return (
                        <div key={sym} className="card-solid" style={{ padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                            {sym}
                          </h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <label className="label">Severity Level</label>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{details.severity} / 5</span>
                              </div>
                              <input 
                                type="range" 
                                min={1} 
                                max={5} 
                                value={details.severity} 
                                onChange={(e) => handleDetailChange(sym, 'severity', parseInt(e.target.value))} 
                              />
                            </div>

                            <div>
                              <label className="label">Duration (Days)</label>
                              <input 
                                type="number" 
                                className="input-field" 
                                value={details.duration} 
                                min={1} 
                                max={365} 
                                placeholder="Days"
                                onChange={(e) => handleDetailChange(sym, 'duration', e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="label">Frequency</label>
                              <select 
                                className="input-field" 
                                value={details.frequency} 
                                onChange={(e) => handleDetailChange(sym, 'frequency', parseInt(e.target.value))}
                              >
                                <option value={1}>Rare</option>
                                <option value={2}>Intermittent</option>
                                <option value={3}>Constant</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  <RippleButton className="btn-primary" onClick={onNext} style={{ flex: 2, justifyContent: 'center' }}>
                    Continue <ChevronRight size={16} />
                  </RippleButton>
                </div>
              </div>
            )}

            {/* STEP 2: Dynamic Follow-Up Questions */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>3. AI Dynamic Follow-Up</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>Please answer these clinical screening questions generated specifically based on your inputs.</p>

                {fetchingQuestions ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(37,99,235,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>AI engine generating questions…</p>
                  </div>
                ) : followupQuestions.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8, marginBottom: '2.5rem' }}>
                    <CheckCircle size={36} color="var(--success)" style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>No follow-up questions needed</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>The core symptoms provide sufficient context for prediction.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {followupQuestions.map((q) => (
                      <div key={q.id} className="card-solid" style={{ padding: '1.25rem 1.5rem', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                        <label className="label" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                          {q.text}
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--primary)', backgroundColor: 'rgba(37,99,235,0.06)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                            Trigger: {q.symptom_trigger}
                          </span>
                        </label>

                        {q.type === 'boolean' && (
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                              <input 
                                type="radio" 
                                name={q.id} 
                                checked={followupAnswers[q.id] === true} 
                                onChange={() => handleFollowupChange(q.id, true)} 
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              Yes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                              <input 
                                type="radio" 
                                name={q.id} 
                                checked={followupAnswers[q.id] === false} 
                                onChange={() => handleFollowupChange(q.id, false)} 
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              No
                            </label>
                          </div>
                        )}

                        {q.type === 'choice' && (
                          <select 
                            className="input-field" 
                            value={followupAnswers[q.id] || ''} 
                            onChange={(e) => handleFollowupChange(q.id, e.target.value)}
                          >
                            {q.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {q.type === 'numeric' && (
                          <input 
                            type="number" 
                            step="any" 
                            className="input-field" 
                            value={followupAnswers[q.id] ?? ''} 
                            onChange={(e) => handleFollowupChange(q.id, parseFloat(e.target.value) || 0)} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  <RippleButton className="btn-primary" onClick={onNext} disabled={fetchingQuestions} style={{ flex: 2, justifyContent: 'center' }}>
                    Continue <ChevronRight size={16} />
                  </RippleButton>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Submit */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>4. Review & Submit</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>Please review all symptoms and follow-up answers before submitting to the prediction engine.</p>

                {/* Demographics summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="card-solid" style={{ padding: '0.75rem 1.25rem', boxShadow: 'none' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Age</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{age} years</div>
                  </div>
                  <div className="card-solid" style={{ padding: '0.75rem 1.25rem', boxShadow: 'none' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biological Sex</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{gender}</div>
                  </div>
                </div>

                {/* Symptoms Summary */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Selected Symptoms</h4>
                  {selectedSymptoms.length === 0 ? (
                    <div className="card-solid" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem', boxShadow: 'none' }}>No symptoms selected.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedSymptoms.map(sym => {
                        const s = symptomDetails[sym]
                        return (
                          <div key={sym} className="card-solid" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'none' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{sym}</span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Severity: <strong style={{ color: 'var(--primary)' }}>{s.severity}</strong> · Duration: <strong>{s.duration}d</strong> · Frequency: <strong>{renderFrequencyLabel(s.frequency)}</strong>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Follow Ups Summary */}
                {followupQuestions.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Follow-Up Answers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {followupQuestions.map(q => {
                        const ans = followupAnswers[q.id]
                        let displayAns = ans === true ? 'Yes' : ans === false ? 'No' : String(ans ?? 'N/A')
                        return (
                          <div key={q.id} className="card-solid" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', boxShadow: 'none' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.text}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary)' }}>{displayAns}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  
                  <RippleButton className="btn-primary" onClick={onSubmit} disabled={loading} style={{ flex: 2, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Analyzing Symptoms…
                      </span>
                    ) : (
                      <><Activity size={16} /> Run Disease Prediction</>
                    )}
                  </RippleButton>
                </div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
