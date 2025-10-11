import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os 

def load_custom_model(num_classes):

    model = models.mobilenet_v3_small(weights=None) 
    model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, num_classes)
    return model

NUM_CLASSES = 3
PATH_TO_WEIGHTS = 'mobilenet_skin.pth'
CLASS_NAMES = ['acne', 'freckles', 'healthy']

model = load_custom_model(num_classes=NUM_CLASSES)
DEVICE = torch.device("cpu")

try:
    state_dict = torch.load(PATH_TO_WEIGHTS, map_location=DEVICE)
    model.load_state_dict(state_dict)
    print(f"Веса успешно загружены из {PATH_TO_WEIGHTS}")
except Exception as e:
    print(f"Критическая ошибка при загрузке весов. Проверьте путь и архитектуру.")
    print(f"Ошибка: {e}")
    # Выход, если загрузка не удалась
    exit() 

# Перенос модели на устройство и установка режима eval (ОДИН РАЗ)
model.to(DEVICE)
model.eval()

# 2.2 Определение предобработки (ОДИН РАЗ)
preprocess = transforms.Compose([
    transforms.Resize(256), 
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225])
])

def classify_image_path(image_path: str):

    if not os.path.exists(image_path):
        print(f"Ошибка: Файл изображения не найден: {image_path}")
        return

    # Открытие изображения
    try:
        image = Image.open(image_path).convert('RGB')
    except Exception as e:
        print(f"Ошибка при открытии изображения: {e}")
        return

    # Предобработка
    input_tensor = preprocess(image)
    input_batch = input_tensor.unsqueeze(0) 

    # Перенос только входного тензора на устройство модели
    input_batch = input_batch.to(DEVICE)

    # Предсказание
    with torch.no_grad():
        output = model(input_batch)

    # Получение вероятностей
    probabilities = torch.nn.functional.softmax(output[0], dim=0)
    top_p, top_class_idx = probabilities.topk(1, dim=0)

    predicted_class = CLASS_NAMES[top_class_idx.item()]
    confidence = top_p.item()

    all_probabilities = {CLASS_NAMES[i]: probabilities[i].item() for i in range(NUM_CLASSES)}

    print("----------------------------------------")
    print(f"Загруженное изображение: {image_path}")
    print(f"Предсказанный класс: {predicted_class}")
    print(f"Уверенность (вероятность): {confidence:.4f}")
    print("\nПолные вероятности:")
    for name, prob in all_probabilities.items():
        print(f"  {name}: {prob:.4f}")
    print("----------------------------------------")
    
    return predicted_class, confidence, all_probabilities

if __name__ == "__main__":
    print(f"Модель MobileNetV3 Small готова на {DEVICE}.")
    
   # ПРИМЕР: Классификация одного файла
    image_file_1 = 'photo_2025-10-10_19-34-35.jpg' 
    classify_image_path(image_file_1)
    
    image_file_2 = 'photo_2025-10-11_16-34-25.jpg' 
    classify_image_path(image_file_2)

    image_file_3 = 'photo_2025-10-11_17-17-23.jpg' 
    classify_image_path(image_file_3)

    image_file_4 = 'photo_2025-10-10_14-29-51.jpg' 
    classify_image_path(image_file_4)

    image_file_5 = 'photo_2025-10-09_16-17-47.jpg'
    classify_image_path(image_file_5)
    
    image_file_6 = 'photo_2_2025-10-11_13-22-51.jpg'
    classify_image_path(image_file_6)
