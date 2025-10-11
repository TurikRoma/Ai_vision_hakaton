import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small
import torchvision.transforms as transforms
from ultralytics import YOLO
import asyncio
import time
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class ModelPipeline:
    def __init__(self):
        self.models = {}
        self.device = torch.device('cpu')
        print(f"Using device: {self.device}")
        
        # Конфигурация моделей
        self.model_configs = {
            'yolo': {
                'path': os.path.join(BASE_DIR, 'model.pt'),
                'type': 'yolo'
            },
            'mobilenet_skin': {
                'path': os.path.join(BASE_DIR, 'mobilenet_skin.pth'),
                'num_classes': 3,
                'class_names': ['acne', 'freckles', 'healthy']
            },
            'mobilenet_age': {
                'path': os.path.join(BASE_DIR, 'mobilenet_age.pth'), 
                'num_classes': 6,
                'class_names': ['adult', 'baby', 'child', 'middle', 'pensioner', 'teenage']
            },
            'mobilenet_eyes_darkcircles': {
                'path': os.path.join(BASE_DIR, 'mobilenet_darkcircles.pth'),
                'num_classes': 3, 
                'class_names': ['darkcircles', 'healthy', 'light_darkcircles']
            },
            'mobilenet_eyes_pupils': {
                'path': os.path.join(BASE_DIR, 'mobilenet_eyes_pupils.pth'),
                'num_classes': 3,
                'class_names': ['conjunctivitis', 'healthy', 'yellowness']
            },
            'mobilenet_general': {
                'path': os.path.join(BASE_DIR, 'mobilenet_general.pth'),
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

pipeline = ModelPipeline()

def get_pipeline() -> ModelPipeline:
    return pipeline
