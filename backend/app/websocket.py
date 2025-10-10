# --- ФАЙЛ: app/websocket.py (ВЕРСИЯ БЕЗ АУТЕНТИФИКАЦИИ - НЕБЕЗОПАСНО!) ---

from fastapi import WebSocket, WebSocketDisconnect, Query, status
from typing import Dict
import json

from app.db.models import User

# ВНИМАНИЕ: В этой версии отсутствует какая-либо аутентификация.
# Любой пользователь, знающий user_id, может подключиться к WebSocket.
# Это серьезная уязвимость. ИСПОЛЬЗОВАТЬ ТОЛЬКО В ИЗОЛИРОВАННОЙ ТЕСТОВОЙ СРЕДЕ.

class ConnectionManager:
    """
    Менеджер WebSocket соединений.
    Управляет активными соединениями пользователей.
    """
    def __init__(self):
        # Словарь для хранения активных соединений: {user_id: websocket}
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Подключение нового клиента"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"Пользователь {user_id} подключился к WebSocket")

    def disconnect(self, user_id: int):
        """Отключение клиента"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        print(f"Пользователь {user_id} отключился от WebSocket")

    async def send_personal_message(self, message: dict, user_id: int):
        """Отправка персонального сообщения конкретному пользователю"""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_text(json.dumps(message, ensure_ascii=False))
                print(f"Сообщение отправлено пользователю {user_id}: {message}")
            except Exception as e:
                print(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
                self.disconnect(user_id)
    
# Глобальный экземпляр менеджера соединений
connection_manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, user_id: int = Query(...)):
    """
    WebSocket эндпоинт. Подключение напрямую по user_id без аутентификации.
    ВНИМАНИЕ: ЭТО НЕБЕЗОПАСНО.
    """
    # Подключаем пользователя напрямую по ID
    await connection_manager.connect(websocket, user_id)

    try:
        # Держим соединение открытым и слушаем сообщения (например, для ping-pong)
        while True:
            data = await websocket.receive_text()
            # Можно оставить простую логику для поддержания соединения
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # В будущем здесь можно обрабатывать другие сообщения от клиента
                print(f"Получено сообщение от пользователя {user_id}: {data}")

    except WebSocketDisconnect:
        # Клиент отключился
        connection_manager.disconnect(user_id)
    except Exception as e:
        # Любая другая ошибка
        print(f"Критическая ошибка WebSocket для пользователя {user_id}: {e}")
        connection_manager.disconnect(user_id)
