import asyncio
import time
from typing import Dict, Any
from fastapi import FastAPI, Query, Request

app = FastAPI(title="AI Async Serverless API")


async def predict_model_rf(text: str) -> Dict[str, Any]:
    await asyncio.sleep(0.3)
    prediction = "BAHAYA" if "bahaya" in text.lower() or "threat" in text.lower() else "AMAN"
    confidence = 0.94 if prediction == "BAHAYA" else 0.88
    return {
        "model": "Random Forest (RF)",
        "prediction": prediction,
        "confidence": confidence
    }


async def predict_model_svm(text: str) -> Dict[str, Any]:
    await asyncio.sleep(0.5)
    prediction = "BAHAYA" if "bahaya" in text.lower() or "threat" in text.lower() else "AMAN"
    confidence = 0.91 if prediction == "BAHAYA" else 0.85
    return {
        "model": "Support Vector Machine (SVM)",
        "prediction": prediction,
        "confidence": confidence
    }


@app.api_route("/{full_path:path}", methods=["GET", "POST"])
async def catch_all_proses_ai(request: Request, full_path: str = ""):
    # Ambil parameter query input
    input_text = request.query_params.get("input", "Analisis data")

    start_time = time.time()
    res_rf, res_svm = await asyncio.gather(
        predict_model_rf(input_text),
        predict_model_svm(input_text)
    )
    end_time = time.time()
    duration_seconds = round(end_time - start_time, 4)

    return {
        "status": "success",
        "duration_seconds": duration_seconds,
        "results": {
            "model_rf": res_rf,
            "model_svm": res_svm
        }
    }
