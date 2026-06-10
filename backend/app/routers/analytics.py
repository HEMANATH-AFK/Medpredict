"""Analytics router — patient dashboard + admin analytics."""

from __future__ import annotations
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timedelta, timezone

from app.dependencies import get_current_user, require_role
from app.db.mongo import predictions_col, global_shap_col

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def patient_dashboard(current_user: dict = Depends(get_current_user)):
    col     = predictions_col()
    user_id = ObjectId(current_user["_id"])

    # Total assessments
    total = await col.count_documents({"user_id": user_id})

    # Latest prediction
    latest = await col.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    latest_risk  = None
    latest_sev   = None
    top_factor   = None
    if latest:
        latest_risk = latest["result"].get("risk_score")
        latest_sev  = latest["result"].get("severity")
        shap_contribs = latest.get("shap", {}).get("contributions", [])
        if shap_contribs:
            top_factor = shap_contribs[0].get("feature")

    # Risk trend — last 10 predictions
    trend = []
    async for p in col.find(
        {"user_id": user_id},
        {"result": 1, "created_at": 1},
        sort=[("created_at", -1)],
        limit=10,
    ):
        created = p.get("created_at", datetime.now(timezone.utc))
        trend.append({
            "date":     created.isoformat() if isinstance(created, datetime) else str(created),
            "score":    p["result"].get("risk_score"),
            "severity": p["result"].get("severity"),
            "disease":  p["result"].get("primary_class"),
        })
    trend.reverse()  # chronological order

    # Disease distribution for this user
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$result.primary_class", "count": {"$sum": 1}}},
    ]
    distribution = {}
    async for doc in col.aggregate(pipeline):
        distribution[doc["_id"]] = doc["count"]

    return {
        "total_assessments":    total,
        "latest_risk_score":    latest_risk,
        "latest_severity":      latest_sev,
        "risk_trend":           trend,
        "disease_distribution": distribution,
        "top_risk_factor":      top_factor,
    }


@router.get("/admin")
async def admin_dashboard(admin: dict = Depends(require_role("admin"))):
    col = predictions_col()

    total_preds = await col.count_documents({})

    # Last 24h
    since_24h   = datetime.now(timezone.utc) - timedelta(hours=24)
    preds_today = await col.count_documents({"created_at": {"$gte": since_24h}})

    # Critical in last 7 days
    since_7d    = datetime.now(timezone.utc) - timedelta(days=7)
    critical    = await col.count_documents({
        "created_at": {"$gte": since_7d},
        "result.severity": "Emergency",
    })

    # Disease distribution last 30 days
    since_30d   = datetime.now(timezone.utc) - timedelta(days=30)
    dist_pipe   = [
        {"$match": {"created_at": {"$gte": since_30d}}},
        {"$group": {"_id": "$result.primary_class", "count": {"$sum": 1}}},
    ]
    dist = {}
    async for doc in col.aggregate(dist_pipe):
        dist[doc["_id"]] = doc["count"]

    # Severity breakdown
    sev_pipe = [
        {"$group": {"_id": "$result.severity", "count": {"$sum": 1}}},
    ]
    sev_dist = {}
    async for doc in col.aggregate(sev_pipe):
        sev_dist[doc["_id"]] = doc["count"]

    return {
        "total_predictions":   total_preds,
        "predictions_today":   preds_today,
        "critical_alerts_7d":  critical,
        "disease_distribution":dist,
        "severity_breakdown":  sev_dist,
    }


@router.get("/shap-global")
async def global_shap(admin: dict = Depends(require_role("admin"))):
    col = global_shap_col()
    doc = await col.find_one({}, sort=[("computed_at", -1)])
    if not doc:
        return {"message": "No global SHAP data yet — run training first", "data": []}
    doc["_id"] = str(doc["_id"])
    return doc
