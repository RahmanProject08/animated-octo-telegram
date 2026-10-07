import asyncio
import time
from typing import Dict, Any
from fastapi import FastAPI, Query

app = FastAPI(title="AI Async Serverless API")


async def predict_model_rf(text: str) -> Dict[str, Any]:
    """
    Simulasi Model A: Random Forest (RF)
    Delay simulasi: 0.3 detik
    """
    await asyncio.sleep(0.3)
    prediction = "BAHAYA" if "bahaya" in text.lower() or "threat" in text.lower() else "AMAN"
    confidence = 0.94 if prediction == "BAHAYA" else 0.88
    return {
        "model": "Random Forest (RF)",
        "prediction": prediction,
        "confidence": confidence
    }


async def predict_model_svm(text: str) -> Dict[str, Any]:
    """
    Simulasi Model B: Support Vector Machine (SVM)
    Delay simulasi: 0.5 detik
    """
    await asyncio.sleep(0.5)
    prediction = "BAHAYA" if "bahaya" in text.lower() or "threat" in text.lower() else "AMAN"
    confidence = 0.91 if prediction == "BAHAYA" else 0.85
    return {
        "model": "Support Vector Machine (SVM)",
        "prediction": prediction,
        "confidence": confidence
    }


@app.get("/api/proses_ai")
async def proses_ai(input: str = Query(..., description="Data teks input")):
    """
    Endpoint pemrosesan AI menggunakan asyncio.gather()
    untuk mengeksekusi kedua model secara asynchronous dan paralel.
    """
    start_time = time.time()

    # Eksekusi paralel kedua model AI
    res_rf, res_svm = await asyncio.gather(
        predict_model_rf(input),
        predict_model_svm(input)
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
