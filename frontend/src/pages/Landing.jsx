import { Link, useNavigate } from 'react-router-dom'
import { 
  Activity, Shield, FileText, Sliders, Brain, ChevronRight, Heart, Sparkles, 
  Clock, ArrowRight, ShieldAlert, CheckCircle2, User, Thermometer, AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { FadeUp, HoverTilt, RippleButton } from '@hemanath-afk/afk-motion'

const targetConditions = [
  { name: 'COVID-19', desc: 'Acute respiratory assessment, oxygen levels triage', category: 'Viral', severity: 'High' },
  { name: 'Influenza', desc: 'Sudden onset fever, chills, respiratory distress', category: 'Viral', severity: 'High' },
  { name: 'Common Cold', desc: 'Mild upper airway symptoms, sneezing, sore throat', category: 'Viral', severity: 'Low' },
  { name: 'Gastroenteritis', desc: 'Stomach cramps, vomiting, fluid-loss triage', category: 'Digestive', severity: 'Medium' },
  { name: 'Food Poisoning', desc: 'Rapid onset stomach cramps, nausea, raw exposure', category: 'Digestive', severity: 'Medium' },
  { name: 'Migraine', desc: 'One-sided pulsating headache, light/sound sensitivity', category: 'Neurological', severity: 'Medium' },
  { name: 'Hypertension', desc: 'Screening for persistent blood pressure elevation', category: 'Cardiovascular', severity: 'High' },
  { name: 'Diabetes Risk', desc: 'Frequent urination, unexplained thirst symptoms', category: 'Metabolic', severity: 'High' },
  { name: 'Heart Disease Risk', desc: 'Chest pressure, exertion triggers, pain spreading', category: 'Cardiovascular', severity: 'Emergency' },
  { name: 'Healthy State', desc: 'Asymptomatic review, general wellness validation', category: 'General', severity: 'Low' }
]

const valueProps = [
  {
    icon: Brain,
    title: 'Dynamic Question Engine',
    desc: 'Backend decision trees automatically select tailored follow-up queries based on primary symptoms.'
  },
  {
    icon: Shield,
    title: 'Explainable AI Metrics',
    desc: 'Local SHAP values map out exactly which active symptoms contributed to your risk projection.'
  },
  {
    icon: Sliders,
    title: 'What-If Risk Simulator',
    desc: 'Simulate different recovery or symptom scenarios in real-time by shifting severity level values.'
  },
  {
    icon: FileText,
    title: 'Clinical Report Generation',
    desc: 'Instantly download PDF summaries complete with diagnostic timelines and medical guidelines.'
  },
  {
    icon: Heart,
    title: 'Adaptive Care Pathways',
    desc: 'Evidence-based lifestyle, nutrition, and monitoring guidelines linked directly to triage levels.'
  },
  {
    icon: Clock,
    title: 'Fast Stateless Triage',
    desc: 'No session storage or DB queues required. Full multi-disease prediction is run in milliseconds.'
  }
]

export default function Landing() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.8rem 1.5rem', maxWidth: 1100, margin: '0 auto', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, backgroundColor: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="white" />
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>MedPredict AI</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {user ? (
              <button className="btn-primary" style={{ padding: '0.55rem 1.25rem', borderRadius: '8px' }} onClick={() => navigate('/dashboard')}>
                Enter Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary" style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Sign In</Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <RippleButton className="btn-primary" style={{ padding: '0.55rem 1.25rem', borderRadius: '8px' }}>Get Started</RippleButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Split Layout) ─────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          
          {/* Left Text Column */}
          <div>
            <FadeUp delay={50}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.1)', marginBottom: '1.5rem' }}>
                <Sparkles size={14} /> Clinical Decision Support Engine
              </div>
            </FadeUp>

            <FadeUp delay={100}>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                AI-Driven Symptom Prediction & <span style={{ color: 'var(--primary)' }}>Triage Support</span>
              </h1>
            </FadeUp>

            <FadeUp delay={150}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                Describe your symptoms, answer intelligent follow-up questions generated dynamically by clinical logic, and instantly analyze your multi-disease risk profiles with explainable SHAP metrics.
              </p>
            </FadeUp>

            <FadeUp delay={200}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to={user ? '/assessment' : '/register'} style={{ textDecoration: 'none' }}>
                  <RippleButton className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Start Diagnostic Triage
                    <ChevronRight size={16} />
                  </RippleButton>
                </Link>
                <Link to="/login" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  View History Log
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Right Visual Widget Column (Simulated Live Triage Dashboard) */}
          <FadeUp delay={250}>
            <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulated Case Assessment</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stateless Session</span>
              </div>

              {/* Triage Inputs Mock */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '4px', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} /> Age: 42
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '4px', color: '#0F172A', fontWeight: 600 }}>
                    Sex: Male
                  </span>
                </div>

                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>ACTIVE SYMPTOMS METRICS</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.8rem', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>Fever</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Severity: 4/5 (2 days)</span>
                    </div>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.8rem', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>Chest Pain</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Severity: 3/5 (1 day)</span>
                    </div>
                  </div>
                </div>

                {/* Follow up mock */}
                <div style={{ padding: '0.75rem 1rem', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    <Thermometer size={12} /> DYNAMIC CLINICAL QUERY
                  </span>
                  <p style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                    Does the discomfort spread to your left arm or jaw?
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.75rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Yes (Triggered)</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.75rem', backgroundColor: 'white', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px' }}>No</span>
                  </div>
                </div>

                {/* Prediction Result Mock */}
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triage Indication</span>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444', fontFamily: "'Outfit', sans-serif" }}>Heart Disease Risk</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>Emergency Priority</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Prob: <strong>91%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Key Metrics & Stats Section ─────────────────────── */}
      <section style={{ padding: '3rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {[
                { value: '17', label: 'Clinical Symptoms Analyzed' },
                { value: '10', label: 'Conditions Supported' },
                { value: '98.9%', label: 'Ensemble Classification F1' },
                { value: '100%', label: 'Stateless HIPAA Architecture' }
              ].map(({ value, label }, idx) => (
                <div key={idx} style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Workflow Pathway Section ────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--background)' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Care pathway</span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                How MedPredict AI Works
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 480, margin: '0.25rem auto 0' }}>
                A structured four-step clinical support system designed to speed up symptom triage.
              </p>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', title: 'Demographics & Core Symptoms', desc: 'Input age and biological sex, then select primary symptoms from our standard checklist.' },
              { num: '02', title: 'Clinical Severity & Frequency', desc: 'Define active symptom duration, set intensity sliders (1-5), and detail frequency parameters.' },
              { num: '03', title: 'Dynamic Decision Queries', desc: 'Backend algorithms evaluate input clusters to prompt specific follow-up screening questions.' },
              { num: '04', title: 'Explainable Triage & Care', desc: 'Receive immediate diagnostic likelihoods, SHAP metrics, monitoring lists, and PDF reports.' }
            ].map(({ num, title, desc }, idx) => (
              <FadeUp key={idx} delay={idx * 100}>
                <div className="card-solid" style={{ padding: '1.75rem', backgroundColor: 'var(--surface)', height: '100%', position: 'relative' }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#E2E8F0', position: 'absolute', top: '1.25rem', right: '1.5rem', lineHeight: 1 }}>
                    {num}
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.5rem', paddingRight: '2rem' }}>
                    {title}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ───────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
                Designed for Clinical Triage Assistance
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 480, margin: '0.25rem auto 0' }}>
                Advanced tools targeting patient care support and differential diagnostics explanation.
              </p>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {valueProps.map(({ icon: Icon, title, desc }, idx) => (
              <FadeUp key={idx} delay={idx * 50}>
                <HoverTilt>
                  <div className="card-solid" style={{ padding: '2rem', backgroundColor: 'var(--surface)', height: '100%' }}>
                    <div style={{ width: 44, height: 44, backgroundColor: 'rgba(37,99,235,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <Icon size={20} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.5rem' }}>{title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </HoverTilt>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conditions Grid Section ─────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--background)' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnostic coverage</span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                10 Supported Diagnostic Classes
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 500, margin: '0.25rem auto 0' }}>
                MedPredict AI has been trained on clinical profiles spanning common viral, metabolic, and cardiovascular presentations.
              </p>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {targetConditions.map(({ name, desc, category, severity }, idx) => {
              const sevBadgeClass = 
                severity === 'Emergency' ? 'badge-emergency' : 
                severity === 'High' ? 'badge-high' : 
                severity === 'Medium' ? 'badge-medium' : 'badge-low'
              
              return (
                <FadeUp key={idx} delay={idx * 50}>
                  <div className="card-solid" style={{ padding: '1.5rem', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {category}
                        </span>
                        <span className={`badge ${sevBadgeClass}`} style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}>
                          {severity}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
                        {name}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: '1rem' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Call to Action (CTA) Section ────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <FadeUp>
            <div className="card-solid" style={{ padding: '4rem 2rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                Initiate Clinical Triage Support
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                Map symptoms, analyze prediction metrics, and download clinical PDF reports inside our stateless workspace.
              </p>
              
              <Link to={user ? '/assessment' : '/register'} style={{ textDecoration: 'none' }}>
                <RippleButton className="btn-primary" style={{ padding: '0.95rem 2.25rem', fontSize: '1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Begin Symptom Assessment
                  <ArrowRight size={18} />
                </RippleButton>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer Section ──────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '2.5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="var(--primary)" />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0F172A' }}>MedPredict AI</span>
          </div>

          <div style={{ display: 'flex', justifyCenter: 'center', gap: '1rem', color: '#B45309', backgroundColor: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.75rem 1.25rem', borderRadius: '8px', maxWidth: 700, margin: '0 auto', alignItems: 'flex-start', textAlign: 'left' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
              <strong>Clinical Support Disclaimer:</strong> MedPredict AI is an educational triage-support utility and does not constitute medical diagnosis, active prescriptions, or clinical therapy advice. In the event of serious or acute symptoms, please consult with a primary care practitioner or call your local emergency medical services immediately.
            </p>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1rem' }}>
            © 2026 MedPredict AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
