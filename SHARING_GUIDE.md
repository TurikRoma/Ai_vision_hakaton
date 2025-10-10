# 🚀 Руководство по запуску проекта AI Vision Hakaton

Этот гайд поможет запустить проект для локальной разработки и демонстрации на хакатоне.

---

## 📋 Содержание

1. [Локальный запуск (для разработки)](#часть-1-локальный-запуск-для-разработки)
2. [Docker запуск (для хакатона)](#часть-2-docker-запуск-для-хакатона)
3. [Публичный доступ через localtunnel](#часть-3-публичный-доступ-для-демонстрации)

---

## Часть 1: Локальный запуск (для разработки)

> **Сценарий:** Backend на хосте, PostgreSQL и MinIO в Docker

### Шаг 1: Настройка Backend

1. **Перейдите в папку `backend`**:

   ```bash
   cd backend
   ```

2. **Создайте файл `.env`**:

   ```bash
   # Windows
   copy .env.example .env

   # Linux/Mac
   cp .env.example .env
   ```

3. **Закомментируйте Backend в `docker-compose.yml`**:

   Убедитесь, что секция `backend:` закомментирована, чтобы он не запускался в Docker:

   ```yaml
   # backend:
   #   build:
   #     context: .
   #     dockerfile: Dockerfile
   #   ...
   ```

4. **Запустите только базы данных и хранилище**:

   ```bash
   docker-compose up -d
   ```

   Это запустит только MinIO. Если нужен PostgreSQL в Docker, раскомментируйте секцию `postgres:` в `docker-compose.yml`.

5. **Создайте виртуальное окружение и установите зависимости**:

   ```bash
   # Создание venv
   python -m venv venv

   # Активация (Windows)
   venv\Scripts\activate

   # Активация (Linux/Mac)
   source venv/bin/activate

   # Установка зависимостей
   pip install -r requirements.txt
   ```

6. **Примените миграции базы данных**:

   ```bash
   alembic upgrade head
   ```

7. **Запустите Backend**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Шаг 2: Настройка Frontend

1. **Перейдите в папку `frontend`**:

   ```bash
   cd ../frontend
   ```

2. **Установите зависимости**:

   ```bash
   npm install
   ```

3. **Создайте файл `.env.local`**:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_MINIO_URL=http://localhost:9000
   ```

4. **Запустите Frontend**:
   ```bash
   npm run dev
   ```

### ✅ Проверка локального запуска

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000/docs`
- **MinIO Console**: `http://localhost:9001` (Логин: `minioadmin`, Пароль: `minioadmin`)

---

## Часть 2: Docker запуск (для хакатона)

> **Сценарий:** Всё работает внутри Docker (Backend, PostgreSQL, MinIO)

### Шаг 1: Подготовка Backend

1. **Перейдите в папку `backend`**:

   ```bash
   cd backend
   ```

2. **Раскомментируйте Backend в `docker-compose.yml`**:

   Убедитесь, что секция `backend:` раскомментирована:

   ```yaml
   backend:
     build:
       context: .
       dockerfile: Dockerfile
     container_name: ai_vision_backend
     env_file: .env
     ports:
       - "8000:8000"
     depends_on:
       - minio
     restart: unless-stopped
     networks:
       - ai_vision_network
   ```

3. **Запустите все сервисы**:

   ```bash
   docker-compose up -d --build
   ```

   Эта команда:

   - Соберёт Docker образ Backend
   - Запустит PostgreSQL, MinIO и Backend
   - Backend автоматически применит миграции при старте

### Шаг 2: Настройка Frontend

1. **Перейдите в папку `frontend`**:

   ```bash
   cd ../frontend
   ```

2. **Установите зависимости** (если еще не установлены):

   ```bash
   npm install
   ```

3. **Создайте файл `.env.local`**:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_MINIO_URL=http://localhost:9000
   ```

4. **Запустите Frontend**:
   ```bash
   npm run dev
   ```

### ✅ Проверка Docker запуска

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000/docs`
- **MinIO Console**: `http://localhost:9001`

---

## Часть 3: Публичный доступ (для демонстрации)

> **Цель:** Сделать ваш проект доступным из интернета для демонстрации на хакатоне

### ✅ Предварительные требования

1. Проект должен работать в **полном Docker режиме** (Часть 2)
2. Все контейнеры запущены: `docker-compose ps`

### Шаг 1: Установка localtunnel

```bash
npm install -g localtunnel
```

### Шаг 2: Создание туннелей

Откройте **ТРИ РАЗНЫХ терминала** и запустите:

#### Терминал 1 - Frontend

```bash
lt --port 5173
```

Вы получите URL типа: `https://pretty-donuts-agree.loca.lt`

> ⭐ **Это главная ссылка** - делитесь ей с другими участниками хакатона!

#### Терминал 2 - Backend

```bash
lt --port 8000
```

Вы получите URL типа: `https://calm-crabs-applaud.loca.lt`

#### Терминал 3 - MinIO

```bash
lt --port 9000
```

Вы получите URL типа: `https://chubby-walls-yell.loca.lt`

**📝 Сохраните все три URL** - они понадобятся на следующем шаге!

### Шаг 3: Настройка публичных адресов

#### 1. Настройте Backend

Откройте файл `backend/.env` и добавьте публичный URL MinIO:

```env
MINIO_PUBLIC_URL=https://chubby-walls-yell.loca.lt
```

⚠️ **Важно:** URL должен быть **БЕЗ слэша** в конце!

Перезапустите Backend:

```bash
cd backend
docker-compose restart backend
```

#### 2. Настройте Frontend

Откройте файл `frontend/.env.local` и замените localhost на публичные URL:

```env
VITE_API_URL=https://calm-crabs-applaud.loca.lt
VITE_MINIO_URL=https://chubby-walls-yell.loca.lt
```

Перезапустите Frontend (Ctrl+C и снова):

```bash
npm run dev
```

### Шаг 4: Первое посещение (обход защиты localtunnel)

При первом переходе по любому `*.loca.lt` URL вы увидите предупреждение:

```
⚠️ This site is served via localtunnel.me
Click "Continue" to proceed
```

**Что делать:**

1. Откройте **Frontend URL** в браузере → нажмите "Continue"
2. Откройте **Backend URL** в новой вкладке → нажмите "Continue"
3. Откройте **MinIO URL** в новой вкладке → нажмите "Continue"

Теперь можете закрыть вкладки Backend и MinIO - они больше не нужны.

> 💡 **Совет для демонстрации:** Заранее откройте все три URL в своём браузере, чтобы при демонстрации не было задержек.

### 🎉 Готово к демонстрации!

Теперь вы можете:

- ✅ Делиться **Frontend URL** с кем угодно
- ✅ Люди смогут пользоваться вашим проектом из любой точки мира
- ✅ Все запросы будут идти через туннели на ваш локальный Docker

**⚠️ Требования во время демонстрации:**

- Компьютер должен быть включен
- Все 3 терминала с `localtunnel` должны работать
- Docker контейнеры должны быть запущены

---

## 🔧 Troubleshooting

### Проблема: "Connection refused" при запросах к MinIO

**Решение:** Убедитесь, что `MINIO_PUBLIC_URL` установлен в `backend/.env` и Backend перезапущен.

### Проблема: Frontend не может подключиться к Backend

**Решение:**

1. Проверьте, что в `frontend/.env.local` правильные HTTPS URL от localtunnel
2. Перезапустите Frontend после изменения `.env.local`
3. Откройте Backend URL в браузере и нажмите "Continue" на предупреждении

### Проблема: "Database connection error"

**Решение:**

1. Проверьте, что PostgreSQL запущен: `docker-compose ps`
2. Проверьте, что в `.env` используется `postgres` (не `localhost`) для Docker режима

### Проблема: Изображения не загружаются

**Решение:**

1. Убедитесь, что MinIO туннель работает
2. Проверьте `MINIO_PUBLIC_URL` в `backend/.env`
3. Откройте MinIO URL в браузере и нажмите "Continue"

---

## 📊 Схема архитектуры

### Локальная разработка:

```
┌─────────────────────────────────────────┐
│             Ваш компьютер                │
│                                          │
│  ┌──────────┐         ┌──────────────┐  │
│  │ Frontend │         │   Backend    │  │
│  │  :5173   │────────▶│   (venv)     │  │
│  └──────────┘         │   :8000      │  │
│                       └──────┬───────┘  │
│                              │          │
│  ┌────────────────────────────┼────────┐│
│  │ Docker                     ▼        ││
│  │  ┌──────────┐      ┌──────────┐    ││
│  │  │  MinIO   │◀─────┤ Postgres │    ││
│  │  │  :9000   │      │  :5433   │    ││
│  │  └──────────┘      └──────────┘    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Docker режим (хакатон):

```
┌─────────────────────────────────────────┐
│             Ваш компьютер                │
│                                          │
│  ┌──────────┐                            │
│  │ Frontend │                            │
│  │  :5173   │─────────┐                 │
│  └──────────┘         │                 │
│                       ▼                 │
│  ┌────────────────────────────────────┐ │
│  │ Docker Network: ai_vision_network  │ │
│  │                                    │ │
│  │  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Postgres │◀─┤   Backend    │   │ │
│  │  │  :5432   │  │   :8000      │   │ │
│  │  └──────────┘  └───────┬──────┘   │ │
│  │                        │          │ │
│  │                ┌───────▼──────┐   │ │
│  │                │    MinIO     │   │ │
│  │                │    :9000     │   │ │
│  │                └──────────────┘   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
       ▲        ▲        ▲
       │        │        │
 localhost  localhost  localhost
   :5173      :8000      :9000
```

### Публичный доступ через localtunnel:

```
        Internet (HTTPS)
              │
    ┌─────────┼──────────────┐
    │         │              │
    │  ┌──────▼──────┐       │
    │  │ loca.lt     │       │
    │  │ (Frontend)  │       │
    │  └─────────────┘       │
    │         │              │
    ├─────────┼──────────────┤
    │  ┌──────▼──────┐       │
    │  │ loca.lt     │       │
    │  │ (Backend)   │       │
    │  └─────────────┘       │
    │         │              │
    ├─────────┼──────────────┤
    │  ┌──────▼──────┐       │
    │  │ loca.lt     │       │
    │  │ (MinIO)     │       │
    │  └─────────────┘       │
    └─────────┼──────────────┘
              │
      [localhost tunnels]
              │
              ▼
    ┌─────────────────────┐
    │  Ваш Docker         │
    │  :5173 :8000 :9000  │
    └─────────────────────┘
```

---

## 🌟 Советы для успешной демонстрации

1. **Заранее протестируйте:** Запустите всё за день до хакатона
2. **Сохраните URL:** Запишите все три localtunnel URL в блокнот
3. **Проверьте соединение:** Откройте сайт с другого устройства/сети
4. **Батарея:** Убедитесь, что ноутбук подключен к зарядке
5. **Backup план:** Имейте при себе видео-демо на случай проблем с интернетом

---

**Удачи на хакатоне! 🚀**
