import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, Shield, FileText, Sliders, Brain, Heart, Sparkles, Clock,
  ArrowRight, ShieldAlert, CheckCircle2, User, Thermometer, Stethoscope,
  BarChart2, Zap, TrendingUp, CheckCircle, Award, Globe, ChevronRight,
  FlaskConical
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { RippleButton } from '@hemanath-afk/afk-motion'

// ── Data ──────────────────────────────────────────────────────────────────────
const CONDITIONS = [
  { name: 'COVID-19',          icon: '🦠', cat: 'Viral',          sev: 'High',      bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
  { name: 'Influenza',         icon: '🤧', cat: 'Viral',          sev: 'High',      bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { name: 'Common Cold',       icon: '😷', cat: 'Viral',          sev: 'Low',       bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
  { name: 'Gastroenteritis',   icon: '🤢', cat: 'Digestive',      sev: 'Medium',    bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
  { name: 'Food Poisoning',    icon: '⚠️', cat: 'Digestive',      sev: 'Medium',    bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
  { name: 'Migraine',          icon: '🧠', cat: 'Neurological',   sev: 'Medium',    bg: '#FAF5FF', border: '#DDD6FE', text: '#6D28D9' },
  { name: 'Hypertension',      icon: '💓', cat: 'Cardiovascular', sev: 'High',      bg: '#FDF2F8', border: '#F9A8D4', text: '#BE185D' },
  { name: 'Diabetes Risk',     icon: '🩸', cat: 'Metabolic',      sev: 'High',      bg: '#F0FDFA', border: '#99F6E4', text: '#0D9488' },
  { name: 'Heart Disease Risk',icon: '❤️', cat: 'Cardiovascular', sev: 'Emergency', bg: '#FEF2F2', border: '#FECACA', text: '#EF4444' },
  { name: 'Healthy State',     icon: '✅', cat: 'General',         sev: 'Low',       bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
]

const FEATURES = [
  { icon: Brain,      title: 'AI Symptom Analysis',        desc: 'Ensemble ML model analyzes 17 clinical symptoms with dynamic severity, duration, and frequency scoring.',   accent: '#2563EB' },
  { icon: Zap,        title: 'Dynamic Follow-Up Engine',   desc: 'Clinical decision trees auto-generate targeted questions based on your reported symptom cluster.',           accent: '#6366F1' },
  { icon: Shield,     title: 'Explainable AI (SHAP)',       desc: 'Every prediction is backed by SHAP values showing exactly which symptoms drove the result.',                accent: '#14B8A6' },
  { icon: Sliders,    title: 'What-If Simulator',           desc: 'Adjust symptom severity and instantly see how your risk profile changes for informed decisions.',           accent: '#F59E0B' },
  { icon: FileText,   title: 'Clinical PDF Reports',        desc: 'Download professional medical reports with full diagnostics, SHAP breakdown, and personalized care guidance.', accent: '#10B981' },
  { icon: FlaskConical, title: 'Lab Report Health Check',  desc: 'Enter blood panel values (HbA1c, cholesterol, glucose) and get a full metabolic health status breakdown.',  accent: '#EF4444' },
]

const WORKFLOW = [
  { step: '01', icon: User,        title: 'Demographics & Symptoms',     desc: 'Enter age, sex, and select active symptoms with severity (1–5), duration, and frequency controls.' },
  { step: '02', icon: Stethoscope, title: 'Intelligent Follow-Ups',      desc: 'AI detects symptom clusters and asks targeted clinical questions — "Does chest pain spread to your arm?"' },
  { step: '03', icon: BarChart2,   title: 'Multi-Disease Prediction',    desc: 'Ensemble model returns top-3 differential diagnoses with probability scores and triage severity.' },
  { step: '04', icon: TrendingUp,  title: 'Explainable Care Pathway',    desc: 'Get SHAP risk drivers, personalized diet/lifestyle guidance, monitoring checklists, and PDF reports.' },
]

const STATS = [
  { value: '17', label: 'Symptoms Analyzed' },
  { value: '10', label: 'Disease Classes' },
  { value: '98.9%', label: 'Model F1 Score' },
  { value: '< 2s', label: 'Prediction Time' },
]

// ── Animated Triage Demo ──────────────────────────────────────────────────────
function TriageDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 3), 2800)
    return () => clearInterval(t)
  }, [])

  const steps = ['Step 1: Symptoms', 'Step 2: Follow-Up', 'Step 3: Results']

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '1.5rem', maxWidth: 420, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Triage</span>
        </div>
        <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>HIPAA · Stateless</span>
      </div>

      {/* Tab Indicator */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '0.3rem 0.4rem', textAlign: 'center', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, backgroundColor: step === i ? '#2563EB' : '#F1F5F9', color: step === i ? '#fff' : '#94A3B8', transition: 'all 0.35s ease' }}>
            {s}
          </div>
        ))}
      </div>

      {/* Content: Step 1 */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem' }}>
            {[{ l: 'Age: 42', bg: '#EFF6FF', c: '#1D4ED8' }, { l: 'Male', bg: '#F0FDF4', c: '#16A34A' }].map(({ l, bg, c }) => (
              <span key={l} style={{ padding: '0.2rem 0.6rem', backgroundColor: bg, color: c, borderRadius: 6, fontSize: '0.73rem', fontWeight: 700 }}>{l}</span>
            ))}
          </div>
          {[{ sym: 'Chest Pain', sev: 4, col: '#EF4444' }, { sym: 'Fever', sev: 3, col: '#F97316' }, { sym: 'Shortness of Breath', sev: 2, col: '#F59E0B' }].map(({ sym, sev, col }) => (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.7rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{sym}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: d <= sev ? col : '#E2E8F0' }} />)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: col }}>{sev}/5</span>
            </div>
          ))}
        </div>
      )}

      {/* Content: Step 2 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Thermometer size={11} /> Clinical Query
            </div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              Does the chest discomfort radiate to your left arm or jaw?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <span style={{ padding: '0.2rem 0.75rem', backgroundColor: '#2563EB', color: '#fff', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>Yes ✓</span>
              <span style={{ padding: '0.2rem 0.75rem', backgroundColor: '#F1F5F9', color: '#94A3B8', borderRadius: 6, fontSize: '0.72rem' }}>No</span>
            </div>
          </div>
          <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.75rem', color: '#64748B' }}>
            <strong style={{ color: '#0F172A' }}>3 more questions</strong> being evaluated by AI engine...
          </div>
        </div>
      )}

      {/* Content: Step 3 */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ padding: '0.9rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primary Indication</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#EF4444' }}>Heart Disease Risk</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', lineHeight: 1 }}>91%</div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Risk Score</div>
            </div>
          </div>
          {[
            { dis: 'Heart Disease Risk', p: 91, c: '#EF4444' },
            { dis: 'Hypertension',       p: 68, c: '#EC4899' },
            { dis: 'Influenza',          p: 24, c: '#6366F1' },
          ].map(({ dis, p, c }) => (
            <div key={dis} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.71rem', fontWeight: 600, color: '#0F172A', minWidth: 110 }}>{dis}</span>
              <div style={{ flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${p}%`, height: '100%', backgroundColor: c, borderRadius: 3, animation: 'progress-fill 0.9s ease both' }} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c, minWidth: 28 }}>{p}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{ width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
              <Activity size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>MedPredict AI</div>
              <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Clinical Decision Support</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user ? (
              <RippleButton className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.88rem' }} onClick={() => navigate('/dashboard')}>
                Enter Dashboard <ChevronRight size={14} />
              </RippleButton>
            ) : (
              <>
                <Link to="/login" style={{ padding: '0.5rem 0.9rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Sign In
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <RippleButton className="btn-primary" style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}>
                    Get Started Free
                  </RippleButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '5rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background circle accents */}
        <div style={{ position: 'absolute', top: -180, right: -180, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.05), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.05), transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>

          {/* Left */}
          <div>
            {/* Badge */}
            <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: 30, backgroundColor: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563EB', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              <Sparkles size={12} /> AI-Powered Clinical Triage
            </div>

            <h1 className="anim-fade-up-1" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#0F172A', lineHeight: 1.12, letterSpacing: '-0.025em', marginBottom: '1.25rem' }}>
              Predict Diseases<br />
              <span style={{ color: '#2563EB' }}>From Your Symptoms,</span><br />
              Not Lab Reports.
            </h1>

            <p className="anim-fade-up-2" style={{ fontSize: '1.05rem', color: '#64748B', lineHeight: 1.72, marginBottom: '2rem', maxWidth: 490 }}>
              Describe what you feel. MedPredict AI asks intelligent clinical follow-up questions and predicts possible diseases with <strong style={{ color: '#0F172A' }}>explainable AI</strong> — no blood tests required.
            </p>

            {/* CTA Buttons */}
            <div className="anim-fade-up-3" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '2.25rem' }}>
              <Link to={user ? '/assessment' : '/register'} style={{ textDecoration: 'none' }}>
                <RippleButton className="btn-primary" style={{ padding: '0.9rem 1.9rem', fontSize: '1rem', fontWeight: 700, gap: '0.5rem' }}>
                  Start Free Assessment <ArrowRight size={17} />
                </RippleButton>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ padding: '0.9rem 1.5rem', fontSize: '1rem', fontWeight: 600 }}>
                  View My History
                </button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="anim-fade-up-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
              {[
                { icon: Shield,       text: 'HIPAA-Compliant' },
                { icon: CheckCircle2, text: 'No Labs Required' },
                { icon: Zap,          text: 'Results in < 2s' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  <Icon size={14} color="#10B981" /> {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Demo */}
          <div className="anim-fade-up-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <TriageDemo />
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section style={{ borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="anim-fade-up" style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.6rem', fontWeight: 900, color: '#2563EB', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.35rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: 30, backgroundColor: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.12)', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Activity size={12} /> Care Pathway
            </div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', color: '#0F172A', marginBottom: '0.65rem', letterSpacing: '-0.02em' }}>
              How MedPredict AI Works
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.97rem', maxWidth: 480, margin: '0 auto' }}>
              A four-step clinical support workflow designed for rapid, explainable symptom triage.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '1.25rem' }}>
            {WORKFLOW.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className={`card-solid anim-fade-up-${i + 1}`} style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
                {/* Ghost step number */}
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '5rem', fontWeight: 900, color: 'rgba(37,99,235,0.04)', position: 'absolute', top: '-0.75rem', right: '0.75rem', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.04em' }}>
                  {step}
                </div>
                <div style={{ width: 44, height: 44, backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                  <Icon size={21} color="#2563EB" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: 30, backgroundColor: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.12)', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Award size={12} /> Platform Capabilities
            </div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.65rem' }}>
              Everything You Need for<br />Intelligent Health Triage
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc, accent }, i) => (
              <div key={title} className={`card-solid anim-fade-up-${(i % 5) + 1}`} style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div style={{ width: 46, height: 46, backgroundColor: `${accent}12`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}22`, marginBottom: '1.1rem' }}>
                  <Icon size={21} color={accent} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.97rem', color: '#0F172A', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conditions Grid ── */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: 30, backgroundColor: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.12)', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Globe size={12} /> Diagnostic Coverage
            </div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.65rem' }}>
              10 Clinical Condition Classes
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.97rem', maxWidth: 500, margin: '0 auto' }}>
              Trained on validated clinical profiles spanning viral, metabolic, cardiovascular, and neurological presentations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1rem' }}>
            {CONDITIONS.map(({ name, icon, cat, sev, bg, border, text }, i) => (
              <div key={name} className={`card-solid anim-fade-up-${(i % 4) + 1}`} style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '1.7rem', lineHeight: 1 }}>{icon}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, backgroundColor: bg, color: text, border: `1px solid ${border}` }}>
                    {sev}
                  </span>
                </div>
                <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.15rem' }}>{name}</h4>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div className="card-solid anim-fade-up" style={{ padding: '4rem 2.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 4, backgroundColor: '#2563EB' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 80, backgroundColor: '#2563EB' }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: 30, backgroundColor: 'rgba(37,99,235,0.07)', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              <Sparkles size={13} /> Free · No Credit Card
            </div>

            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', color: '#0F172A', marginBottom: '0.9rem', letterSpacing: '-0.02em' }}>
              Start Your Triage<br />Assessment Today
            </h2>
            <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 460, margin: '0 auto 2.25rem', lineHeight: 1.7 }}>
              Describe your symptoms, get AI-powered disease predictions with explainable insights — completely free.
            </p>

            <Link to={user ? '/assessment' : '/register'} style={{ textDecoration: 'none' }}>
              <RippleButton className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: 700, gap: '0.5rem' }}>
                Begin Assessment <ArrowRight size={18} />
              </RippleButton>
            </Link>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              {[
                { icon: Shield,       text: 'HIPAA Compliant' },
                { icon: Zap,          text: 'Instant Results' },
                { icon: CheckCircle2, text: 'No Labs Needed' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  <Icon size={14} color="#10B981" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>MedPredict AI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.6, maxWidth: 240 }}>
              AI-powered symptom triage platform for fast, explainable, evidence-based clinical decision support.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>Platform</h4>
            {[{ l: 'Start Assessment', to: user ? '/assessment' : '/register' }, { l: 'Dashboard', to: '/dashboard' }, { l: 'History', to: '/history' }].map(({ l, to }) => (
              <Link key={l} to={to} style={{ display: 'block', fontSize: '0.83rem', color: '#64748B', textDecoration: 'none', marginBottom: '0.45rem', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#2563EB'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
                {l}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>Medical Disclaimer</h4>
            <div style={{ padding: '0.8rem 1rem', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <ShieldAlert size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.73rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: '#92400E' }}>Educational Use Only.</strong> Not a substitute for professional medical diagnosis. Consult a physician for serious symptoms.
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>© 2026 MedPredict AI. All rights reserved.</p>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Built with FastAPI · React · scikit-learn · SHAP</p>
        </div>
      </footer>

    </div>
  )
}
