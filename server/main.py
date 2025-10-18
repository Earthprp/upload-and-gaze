from fastapi import FastAPI
from pydantic import BaseModel
from transformers import Owlv2Processor, Owlv2ForObjectDetection
import torch, requests, io, base64, cv2, numpy as np
from PIL import Image

app = FastAPI()

# ---------- โหลดโมเดล ----------
print("🔄 Loading OWLv2 model...")
processor = Owlv2Processor.from_pretrained("google/owlv2-base-patch16-ensemble")
model = Owlv2ForObjectDetection.from_pretrained("google/owlv2-base-patch16-ensemble")
print("✅ Model loaded successfully!")

# ---------- Request Schema ----------
class ImageInput(BaseModel):
    image_url: str
    prompts: str  # เช่น "acne, dark spot, wrinkle"

# ---------- API ----------
@app.post("/run-owlv2")
async def run_owlv2(input: ImageInput):
    try:
        # 1️⃣ แปลง prompt string → list
        prompt_list = [p.strip() for p in input.prompts.split(",")]

        # 2️⃣ โหลดภาพจาก URL
        img_bytes = requests.get(input.image_url).content
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # 3️⃣ เตรียม input ให้โมเดล
        inputs = processor(text=prompt_list, images=image, return_tensors="pt")

        # 4️⃣ รันโมเดล
        with torch.no_grad():
            outputs = model(**inputs)

        # 5️⃣ Post-process → กรองกรอบมั่นใจ
        target_sizes = torch.Tensor([image.size[::-1]])
        results = processor.post_process_object_detection(
            outputs=outputs, target_sizes=target_sizes
        )[0]

        np_image = np.array(image)
        detections = []

        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            conf = float(score)
            if conf < 0.3:
                continue
            lbl = prompt_list[label] if label < len(prompt_list) else str(label)
            b = [int(i) for i in box.tolist()]
            detections.append({"label": lbl, "confidence": round(conf, 3), "box": b})
            cv2.rectangle(np_image, (b[0], b[1]), (b[2], b[3]), (0, 255, 0), 2)
            cv2.putText(np_image, f"{lbl} {conf:.2f}", (b[0], b[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        # 6️⃣ แปลงภาพ Annotated → Base64
        _, buffer = cv2.imencode(".jpg", cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR))
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "status": "success",
            "detections": detections,
            "annotated_image": f"data:image/jpeg;base64,{img_base64}"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
