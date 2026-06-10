import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Sliders, ChevronLeft, ChevronRight, History as HistoryIcon, PlusCircle } from 'lucide-react'
import { predictApi } from '../api/client'
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

export default function History() {
  const [data, setData] = useState({ predictions: [], total: 0, page: 1, limit: 10 })
  const [page, setPage] = useState(1)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    setLoad(true)
    predictApi.history(page)
      .then(res => {
        setData(res.data)
        setLoad(false)
      })
      .catch((err) => {
        console.error(err)
        setLoad(false)
      })
  }, [page])

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <FadeUp>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HistoryIcon size={26} color="var(--primary)" />
                Assessment History
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.1rem' }}>
                Browse and check all of your past medical triage assessments.
              </p>
            </div>
            <Link to="/assessment" style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <PlusCircle size={16} />
                New Triage Check
              </RippleButton>
            </Link>
          </div>
        </FadeUp>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Retrieving assessment logs...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.predictions.length === 0 ? (
          <FadeUp delay={100}>
            <div className="card-solid" style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <FileText size={48} color="var(--text-muted)" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>No History Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>You have not completed any triage check-ups yet.</p>
              </div>
              <Link to="/assessment" style={{ textDecoration: 'none' }}>
                <RippleButton className="btn-primary">Run First Symptom Check</RippleButton>
              </Link>
            </div>
          </FadeUp>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {data.predictions.map((p, index) => {
                const sev = p.result?.severity || 'Low'
                const dis = p.result?.primary_class || 'Unknown'
                const score = p.result?.risk_score ?? 0
                const date = new Date(p.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <FadeUp key={p._id} delay={index * 50}>
                    <div className="card-solid" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--surface)', flexWrap: 'wrap', transition: 'all 0.2s' }}>
                      
                      {/* Condition marker */}
                      <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: DIS_COLORS[dis] || '#2563EB', flexShrink: 0 }} />

                      {/* Primary diagnosis and date */}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: DIS_COLORS[dis] || '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                          {dis}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {date}
                        </span>
                      </div>

                      {/* Risk score */}
                      <div style={{ minWidth: 80, textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: SEV_COLORS[sev] || '#0F172A', display: 'block', lineHeight: 1.1 }}>
                          {score.toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          Risk Index
                        </span>
                      </div>

                      {/* Badge status */}
                      <span className={`badge badge-${sev.toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
                        {sev} Priority
                      </span>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/results/${p._id}`} style={{ textDecoration: 'none' }}>
                          <button className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={14} />
                            View
                          </button>
                        </Link>
                        
                        <Link to={`/whatif/${p._id}`} style={{ textDecoration: 'none' }}>
                          <button className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Sliders size={14} />
                            Simulate
                          </button>
                        </Link>
                      </div>

                    </div>
                  </FadeUp>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <FadeUp delay={300}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setPage(p => p - 1)} 
                    disabled={page <= 1}
                    style={{ padding: '0.5rem 0.85rem', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Page {page} of {totalPages}
                  </span>
                  
                  <button 
                    className="btn-secondary" 
                    onClick={() => setPage(p => p + 1)} 
                    disabled={page >= totalPages}
                    style={{ padding: '0.5rem 0.85rem', opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </FadeUp>
            )}
          </>
        )}

      </div>
    </div>
  )
}
