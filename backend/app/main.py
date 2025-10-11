from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small
import torchvision.transforms as transforms
from ultralytics import YOLO
import asyncio
import time

from app.api.api import api_router
from app.core.logging_config import setup_logging

setup_logging()

app = FastAPI(
    title="AI Vision Hakaton",
    openapi_url="/docs/openapi.json",
)

app.mount("/media", StaticFiles(directory="media"), name="media")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

class ModelPipeline:
    def __init__(self):
        self.models = {}
        self.device = torch.device('cpu')
        print(f"Using device: {self.device}")
        
        # Конфигурация моделей
        self.model_configs = {
            'yolo': {
                'path': 'model.pt',
                'type': 'yolo'
            },
            'mobilenet_skin': {
                'path': 'mobilenet_skin.pth',
                'num_classes': 3,
                'class_names': ['acne', 'freckles', 'healthy']
            },
            'mobilenet_age': {
                'path': 'mobilenet_age.pth', 
                'num_classes': 6,
                'class_names': ['adult', 'baby', 'child', 'middle', 'pensioner', 'teenage']
            },
            'mobilenet_eyes_darkcircles': {
                'path': 'mobilenet_darkcircles.pth',
                'num_classes': 3, 
                'class_names': ['darkcircles', 'healthy', 'light_darkcircles']
            },
            'mobilenet_eyes_pupils': {
                'path': 'mobilenet_eyes_pupils.pth',
                'num_classes': 3,
                'class_names': ['conjunctivitis', 'healthy', 'yellowness']
            },
            'mobilenet_general': {
                'path': 'mobilenet_general.pth',
                'num_classes': 2,
                'class_names': ['edema', 'healthy'] 
            }
        }
        
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])

    async def load_yolo_model(self):
        """Асинхронная загрузка YOLO модели"""
        print("🔄 Загрузка YOLO модели...")
        try:
            self.models['yolo'] = YOLO(self.model_configs['yolo']['path'])
            print("✅ YOLO модель загружена")
        except Exception as e:
            print(f"❌ Ошибка загрузки YOLO: {e}")
            raise

    async def load_mobilenet_model(self, model_name):
        """Асинхронная загрузка MobileNet модели"""
        print(f"🔄 Загрузка {model_name}...")
        try:
            config = self.model_configs[model_name]
            
            model = mobilenet_v3_small(weights=None)
            model.classifier[3] = nn.Linear(
                model.classifier[3].in_features, 
                config['num_classes']
            )
            
            # Загружаем веса
            checkpoint = torch.load(config['path'], map_location=self.device)
            if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                model.load_state_dict(checkpoint['state_dict'])
            else:
                model.load_state_dict(checkpoint)
            
            model.to(self.device)
            model.eval()
            
            self.models[model_name] = {
                'model': model,
                'class_names': config['class_names']
            }
            print(f"✅ {model_name} загружена")
            
        except Exception as e:
            print(f"❌ Ошибка загрузки {model_name}: {e}")
            raise

    async def load_all_models(self):
        """Асинхронная загрузка всех моделей"""
        print("🚀 Начало загрузки всех моделей...")
        start_time = time.time()
        
        # Создаем задачи для параллельной загрузки
        tasks = []
        tasks.append(self.load_yolo_model())
        
        mobilenet_models = [
            'mobilenet_skin', 'mobilenet_age', 'mobilenet_eyes_darkcircles',
            'mobilenet_eyes_pupils', 'mobilenet_general'
        ]
        
        for model_name in mobilenet_models:
            tasks.append(self.load_mobilenet_model(model_name))
        
        # Запускаем все задачи параллельно
        await asyncio.gather(*tasks)
        
        loading_time = time.time() - start_time
        print(f"🎉 Все модели загружены за {loading_time:.2f} секунд")
        return True

# Глобальная переменная для пайплайна
pipeline = None

@app.on_event("startup")
async def startup_event():
    """Загрузка моделей при старте приложения"""
    global pipeline
    pipeline = ModelPipeline()
    await pipeline.load_all_models()
    print("🚀 FastAPI сервер запущен с загруженными моделями")

@app.get("/health")
async def health_check():
    """Проверка статуса сервера и моделей"""
    return {
        "status": "healthy",
        "models_loaded": bool(pipeline and pipeline.models),
        "loaded_models": list(pipeline.models.keys()) if pipeline else []
    }

def get_pipeline():
    return pipeline