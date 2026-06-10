"""
Recommendation Engine
Rule-based clinical advice per (disease, severity).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Recommendation:
    disease:    str
    severity:   str
    lifestyle:  list[str] = field(default_factory=list)
    diet:       list[str] = field(default_factory=list)
    exercise:   list[str] = field(default_factory=list)
    monitoring: list[str] = field(default_factory=list)
    followup:   str = ""


# ─── DEFAULT GENERAL GUIDELINES BY SEVERITY ──────────────────────────────────
DEFAULT_GUIDELINES = {
    "Low": {
        "lifestyle":  ["Prioritize rest and avoid strenuous activity.", "Ensure 7-8 hours of quality sleep."],
        "diet":       ["Stay well hydrated (water, herbal teas).", "Eat light, easily digestible meals."],
        "exercise":   ["Gentle walking if feeling up to it; otherwise rest."],
        "monitoring": ["Monitor body temperature and symptoms twice daily."],
        "followup":   "Self-care at home. If symptoms persist or worsen past 7 days, schedule a routine GP appointment."
    },
    "Medium": {
        "lifestyle":  ["Limit physical exertion and working hours.", "Ensure adequate bed rest."],
        "diet":       ["Maintain hydration with electrolyte-rich fluids.", "Avoid heavy, oily, or highly processed foods."],
        "exercise":   ["Avoid intense exercises; focus on absolute rest."],
        "monitoring": ["Log symptoms, severity, and temperature three times daily."],
        "followup":   "Contact a telehealth doctor or schedule a primary care clinic appointment in the next 48 hours."
    },
    "High": {
        "lifestyle":  ["Strict bed rest.", "Isolate from others if infectious symptoms are present."],
        "diet":       ["Frequent small sips of water or oral rehydration solutions.", "Nutritional broths or pureed foods as tolerated."],
        "exercise":   ["Complete cessation of physical training or activity."],
        "monitoring": ["Monitor vital signs (temperature, heart rate, breathing rate, oxygen levels) every 4 hours."],
        "followup":   "Seek medical evaluation at a clinic or call a doctor within 24 hours. Seek immediate help if symptoms spike."
    },
    "Emergency": {
        "lifestyle":  ["Do not exert yourself. Remain completely still.", "Have someone stay with you if possible."],
        "diet":       ["Do not consume any solid food or fluids until evaluated by emergency staff."],
        "exercise":   ["Strict absolute immobilization."],
        "monitoring": ["Call emergency services immediately."],
        "followup":   "Proceed to the nearest emergency department or call ambulance immediately. Do not drive yourself."
    }
}


# ─── DISEASE SPECIFIC CLINICAL GUIDELINES ─────────────────────────────────────
DISEASE_GUIDELINES = {
    "Common Cold": {
        "lifestyle": ["Use a saline nasal spray or rinse to clear congestion.", "Inhale steam or use a humidifier to soothe airways."],
        "diet": ["Warm fluids like chicken broth, warm water with honey, or herbal teas.", "High Vitamin C foods (citrus fruits, berries)."],
        "exercise": ["Rest is preferred. Light walking is acceptable if symptoms are 'above the neck'."],
        "monitoring": ["Track congestion, sore throat severity, and temperature (if low fever is suspected)."]
    },
    "Influenza": {
        "lifestyle": ["Strict bed rest to support immune function.", "Use warm compresses for body aches."],
        "diet": ["Easy-to-digest soups, broths, and electrolyte drinks.", "Avoid caffeine and alcohol, which increase dehydration."],
        "exercise": ["No exercise. Absolute rest until fever-free for 48 hours without medication."],
        "monitoring": ["Log temperature spikes and breathing difficulty closely."]
    },
    "COVID-19": {
        "lifestyle": ["Isolate at home in a ventilated room to prevent spread.", "Practice prone positioning (lying on stomach) to support breathing if tight."],
        "diet": ["Nutritious, vitamin-dense foods.", "Stay hydrated with water and oral rehydration solutions."],
        "exercise": ["Strict rest. Avoid all physical strain during active infection and 2 weeks post-recovery."],
        "monitoring": ["Check blood oxygen levels (SpO2) using a pulse oximeter. Go to ER if SpO2 drops below 92%."]
    },
    "Migraine": {
        "lifestyle": ["Rest in a dark, quiet room with minimal sensory stimulation.", "Apply a cold compress to your forehead or the back of your neck."],
        "diet": ["Avoid known triggers (aged cheeses, artificial sweeteners, caffeine excess).", "Maintain regular eating times to avoid blood sugar drops."],
        "exercise": ["Avoid all physical activity during an attack. Regular light cardio between attacks helps prevent them."],
        "monitoring": ["Keep a migraine diary tracking triggers, onset, and duration."]
    },
    "Gastroenteritis": {
        "lifestyle": ["Rest to allow the stomach and intestines to recover.", "Avoid laying completely flat right after drinking fluids."],
        "diet": ["Start with small sips of water or sports drinks, then progress to BRAT diet (bananas, rice, applesauce, toast).", "Avoid dairy and high-fat foods."],
        "exercise": ["Strict rest due to hydration depletion and weakness."],
        "monitoring": ["Monitor frequency and consistency of vomiting/diarrhea and signs of dehydration (dry mouth, dark urine)."]
    },
    "Food Poisoning": {
        "lifestyle": ["Allow the body to expel toxins; do not take anti-diarrheal meds unless instructed by a doctor.", "Rest."],
        "diet": ["Strictly clear liquids for the first 12-24 hours. Oral rehydration solutions are highly recommended.", "Avoid dairy, caffeine, and fats."],
        "exercise": ["Complete rest until symptoms subside."],
        "monitoring": ["Track vomiting frequency and temperature."]
    },
    "Hypertension": {
        "lifestyle": ["Practice deep breathing or stress reduction exercises.", "Ensure regular, high-quality sleep."],
        "diet": ["Follow a DASH diet (high in vegetables, fruits, and lean protein; low in sodium).", "Restrict sodium intake to < 1,500 mg/day."],
        "exercise": ["Engage in 30 minutes of moderate aerobic exercise (brisk walking, cycling) daily, if not currently in a crisis."],
        "monitoring": ["Measure blood pressure daily using a home monitor. Keep a log."]
    },
    "Diabetes Risk": {
        "lifestyle": ["Aim for consistent sleep cycles to optimize insulin sensitivity.", "Manage weight and reduce sedentary time."],
        "diet": ["Choose low-glycemic-index whole foods. Limit refined sugars and processed carbohydrates.", "Increase dietary fiber to 30g+ daily."],
        "exercise": ["Participate in 150 minutes of moderate aerobic activity weekly.", "Incorporate 10-minute walks after major meals."],
        "monitoring": ["Schedule a fasting blood glucose or HbA1c test with a clinical laboratory."]
    },
    "Heart Disease Risk": {
        "lifestyle": ["Practice stress reduction (meditation, breathing).", "Quit smoking and avoid secondhand smoke completely."],
        "diet": ["Eat a heart-healthy Mediterranean diet (rich in olive oil, fish, vegetables, whole grains).", "Restrict saturated fats and trans fats."],
        "exercise": ["Maintain physical activity as cleared by a cardiologist. Stop immediately if chest pain or tightness occurs."],
        "monitoring": ["Keep a log of blood pressure, heart rate, and any chest discomfort or shortness of breath."]
    },
    "Healthy": {
        "lifestyle": ["Maintain current healthy habits, sleeping 7-8 hours.", "Stay active and manage daily stress."],
        "diet": ["Eat a balanced, whole-food diet rich in vegetables, fruits, lean proteins, and healthy fats."],
        "exercise": ["Perform at least 150 minutes of moderate aerobic exercise + 2 strength sessions weekly."],
        "monitoring": ["Annual checkups and routine physical exams."]
    }
}


def get_recommendations(disease: str, severity: str) -> dict:
    """
    Produce structured clinical recommendations based on predicted disease and triage severity.
    """
    default = DEFAULT_GUIDELINES.get(severity, DEFAULT_GUIDELINES["Low"])
    disease_info = DISEASE_GUIDELINES.get(disease, {})

    # Combine general severity instructions and disease-specific instructions
    lifestyle  = list(dict.fromkeys(disease_info.get("lifestyle", []) + default["lifestyle"]))
    diet       = list(dict.fromkeys(disease_info.get("diet", []) + default["diet"]))
    exercise   = list(dict.fromkeys(disease_info.get("exercise", []) + default["exercise"]))
    monitoring = list(dict.fromkeys(disease_info.get("monitoring", []) + default["monitoring"]))
    followup   = default["followup"]

    # Special urgent overrides
    if severity == "Emergency":
        followup = "URGENT: Proceed to the nearest emergency department or call ambulance immediately."

    return {
        "disease":    disease,
        "severity":   severity,
        "lifestyle":  lifestyle[:5],  # Limit to 5 clean points
        "diet":       diet[:5],
        "exercise":   exercise[:5],
        "monitoring": monitoring[:5],
        "followup":   followup
    }
