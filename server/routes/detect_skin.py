import requests, base64, cv2, numpy as np, tempfile
from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()

SUPABASE_URL = "https://osrllaipwynrlesawskb.supabase.co"  
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcmxsYWlwd3lucmxlc2F3c2tiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYyMDE4NSwiZXhwIjoyMDc2MTk2MTg1fQ.r2hqyJg3iJOrgTFDW1uaaYknV0hthrAWJEVc06cQOTg"  # ❗ใช้ service_role key เท่านั้น (ไม่ใช่ anon key)
BUCKET_NAME = "skin_image"

ROBOFLOW_API_KEY = "3RqEjC3ikzU12QhHwRur"
MODEL_ID = "skin-detection-pfmbg/2"

def load_image_from_supabase(file_path: str):
    """โหลดภาพจาก Supabase Storage โดยตรง"""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_path}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}"}
    res = requests.get(url, headers=headers)

    if res.status_code != 200:
        raise Exception(f"Failed to fetch image from Supabase ({res.status_code}): {res.text}")

    return res.content  # bytes


@router.post("/detect-skin")
async def detect_skin(
    file_path: str = Form(...),
    threshold: float = Form(0.03)
):
    # โหลดภาพจาก Supabase
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_path}"
    image_bytes = requests.get(public_url).content
    # ส่งเข้า Roboflow
    url = f"https://detect.roboflow.com/{MODEL_ID}?api_key={ROBOFLOW_API_KEY}&confidence={threshold}"
    response = requests.post(url, files={"file": image_bytes})
    result = response.json()

    # วาดกรอบบนรูป
    preds = result.get("predictions", [])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    for p in preds:
        x, y, w, h = int(p["x"]), int(p["y"]), int(p["width"]), int(p["height"])
        x1, y1, x2, y2 = x - w//2, y - h//2, x + w//2, y + h//2
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 3)
        label = f"{p['class']} ({p['confidence']:.2f})"
        cv2.putText(img, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    _, buffer = cv2.imencode(".jpg", img)
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "status": "success",
        "predictions": preds,
        "annotated_image_base64": f"data:image/jpeg;base64,{img_base64}",
    }
