"""Reports router — generate and stream PDF reports."""

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from bson import ObjectId
from datetime import datetime, timezone

from app.dependencies import get_current_user
from app.db.mongo import predictions_col
from app.services import report_service

router = APIRouter(prefix="/report", tags=["Reports"])


@router.get("/{prediction_id}/download")
async def download_report(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    col  = predictions_col()
    pred = await col.find_one({"_id": ObjectId(prediction_id)})
    if not pred:
        raise HTTPException(404, "Prediction not found")

    # Patients can only download their own reports
    if (current_user["role"] == "patient"
            and str(pred["user_id"]) != str(current_user["_id"])):
        raise HTTPException(403, "Access denied")

    # Serialize for report generation
    pred_data = {
        "prediction_id": str(pred["_id"]),
        "primary_class": pred["result"]["primary_class"],
        "probabilities": pred["result"]["probabilities"],
        "risk": {
            "score":    pred["result"]["risk_score"],
            "severity": pred["result"]["severity"],
        },
        "shap":            pred.get("shap", {}),
        "recommendations": pred.get("recommendations", {}),
        "model_version":   pred["result"].get("model_version", "v1.0.0"),
        "created_at":      pred.get("created_at", datetime.now(timezone.utc)),
    }

    pdf_bytes = report_service.generate_report(pred_data)

    filename = f"medpredict_report_{prediction_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
