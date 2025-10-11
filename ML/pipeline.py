import asyncio
import cv2
import torch
from PIL import Image
from pathlib import Path
import time
import re
import json

def yolo_detect_faces(self, image_path):
    """Детекция лиц с помощью YOLO"""
    print("🔍 YOLO: детекция лиц...")
    results = self.models['yolo'].predict(
        source=image_path,
        conf=0.7,
        imgsz=640,
        save=False
    )
    
    faces = []
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    for i, result in enumerate(results):
        for j, box in enumerate(result.boxes):
            if int(box.cls[0].item()) == 0:  # класс 'face'
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                confidence = box.conf[0].item()
                
                # Вырезаем лицо с запасом
                margin = 20
                h, w = image_rgb.shape[:2]
                x1 = max(0, x1 - margin)
                y1 = max(0, y1 - margin)
                x2 = min(w, x2 + margin)
                y2 = min(h, y2 + margin)
                
                face_crop = image_rgb[y1:y2, x1:x2]
                
                if face_crop.size > 0:
                    faces.append({
                        'crop': face_crop,
                        'bbox': (x1, y1, x2, y2),
                        'confidence': confidence
                    })
                    print(f"   ✅ Обнаружено лицо {len(faces)} (уверенность: {confidence:.3f})")
    
    return faces

async def process_with_mobilenet(self, model_name, face_crop):
    """Обработка вырезанного лица MobileNet моделью"""
    try:
        model_data = self.models[model_name]
        model = model_data['model']
        class_names = model_data['class_names']
        
        # Преобразуем в PIL Image и применяем трансформы
        pil_image = Image.fromarray(face_crop)
        input_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_class = torch.max(probabilities, 1)
        
        result = {
            'model': model_name,
            'predicted_class': predicted_class.item(),
            'class_name': class_names[predicted_class.item()],
            'confidence': confidence.item(),
            'all_probabilities': probabilities.cpu().numpy()[0]
        }
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка в {model_name}: {e}")
        return {
            'model': model_name,
            'error': str(e)
        }

async def process_face_pipeline(self, face_crop):
    """Обработка одного лица через весь пайплайн MobileNet моделей"""
    print("🔄 Запуск пайплайна классификации...")
    
    # Определяем порядок обработки
    pipeline_order = [
        'mobilenet_skin',
        'mobilenet_age', 
        'mobilenet_eyes_darkcircles',
        'mobilenet_eyes_pupils',
        'mobilenet_general'
    ]
    
    # Создаем задачи для параллельной обработки
    tasks = []
    for model_name in pipeline_order:
        task = self.process_with_mobilenet(model_name, face_crop)
        tasks.append(task)
    
    # Запускаем все модели параллельно
    results = await asyncio.gather(*tasks)
    
    return results

async def process_image(self, image_path):
    """Основной метод обработки изображения"""
    print(f"\n🎯 Начало обработки изображения: {Path(image_path).name}")
    start_time = time.time()
    
    # Шаг 1: Детекция лиц YOLO
    faces = self.yolo_detect_faces(image_path)
    
    if not faces:
        print("❌ Лица не обнаружены")
        return None
    
    all_results = []
    
    # Шаг 2: Обработка каждого лица через пайплайн
    for i, face in enumerate(faces):
        print(f"\n👤 Обработка лица {i+1}/{len(faces)}...")
        
        # Запускаем пайплайн для текущего лица
        face_results = await self.process_face_pipeline(face['crop'])
        
        result = {
            'face_id': i + 1,
            'bbox': face['bbox'],
            'detection_confidence': face['confidence'],
            'classification_results': face_results
        }
        
        all_results.append(result)
    
    total_time = time.time() - start_time
    print(f"\n✅ Обработка завершена за {total_time:.2f} секунд")
    
    return all_results

def print_results(self, results):
    if not results:
        return "Нет данных для анализа"
    
    analysis_text = ""
    
    for result in results:
        analysis_text += f"👤 ЛИЦО {result['face_id']}\n"
        analysis_text += f"📏 BBox: {result['bbox']}\n"
        analysis_text += f"🎯 Уверенность детекции: {result['detection_confidence']:.3f}\n\n"
        
        for classification in result['classification_results']:
            if 'error' in classification:
                analysis_text += f"❌ {classification['model']}: {classification['error']}\n"
            else:
                analysis_text += f"✅ {classification['model']}:\n"
                analysis_text += f"   🏷️  Класс: {classification['class_name']}\n"
                analysis_text += f"   📊 Уверенность: {classification['confidence']:.3f}\n"
                
                # Топ предсказания
                probs = classification['all_probabilities']
                class_names = self.models[classification['model']]['class_names']
                
                prob_indices = [(prob, idx) for idx, prob in enumerate(probs)]
                prob_indices.sort(reverse=True, key=lambda x: x[0])
                
                analysis_text += "   📈 Топ предсказания:\n"
                for prob, idx in prob_indices[:3]:
                    is_predicted = (idx == classification['predicted_class'])
                    marker = "⭐" if is_predicted else "  "
                    analysis_text += f"      {marker} {class_names[idx]}: {prob:.3f}\n"
                
                analysis_text += "\n"
        
        analysis_text += "─" * 50 + "\n\n"
    
    return analysis_text

async def parse_llm_response(self, llm_answer: str) -> dict:
    """
    Парсит ответ от LLM и извлекает текстовую часть и JSON с параметрами
    """
    try:
        # Ищем JSON в тексте (может быть в разных форматах)
        json_pattern = r'\{[^{}]*"[^"]*"[^{}]*\}'
        json_matches = re.findall(json_pattern, llm_answer)
        
        parameters = {}
        text_content = llm_answer
        
        if json_matches:
            # Берем последний найденный JSON (скорее всего самый полный)
            json_str = json_matches[-1]
            text_content = llm_answer.replace(json_str, '').strip()
            
            # Очищаем JSON от возможных лишних символов
            json_str = re.sub(r'^```json\s*|\s*```$', '', json_str).strip()
            
            try:
                parameters = json.loads(json_str)
            except json.JSONDecodeError:
                # Если не парсится, попробуем почистить еще
                json_str = re.sub(r'[\n\r\t]', '', json_str)
                parameters = json.loads(json_str)
        
        return {
            "analysis_text": text_content,
            "parameters": parameters
        }
        
    except Exception as e:
        print(f"Ошибка при парсинге ответа LLM: {e}")
        # Возвращаем весь текст как analysis_text, если не удалось распарсить
        return {
            "analysis_text": llm_answer,
            "parameters": {}
        }