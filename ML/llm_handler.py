from openai import AsyncOpenAI
from dotenv import load_dotenv
load_dotenv() 

CLIENT = AsyncOpenAI(
    api_key="sk-RhHJlk2AXoYLcBjwQTxaGm7R8ynjQ8r7",
    base_url="https://openai.api.proxyapi.ru/v1",
)

async def llm_response(analysis_results: str) -> str:
    
    instr = f'''Ты - опытный медицинский консультант. Проанализируй результаты диагностики кожи и общего состояния человека.

        ИНСТРУКЦИИ ДЛЯ АНАЛИЗА:

        1. ОБЩИЙ АНАЛИЗ:
        - Сделай общий вывод о состоянии здоровья человека на основе всех данных
        - Укажи сильные и проблемные зоны

        2. АНАЛИЗ УСТАЛОСТИ (по темным кругам):
        - light_darkcircles: легкая усталость (20-40%)
        - darkcircles: значительная усталость (50-70%)
        - healthy: отсутствие усталости (0-10%)

        3. ОСОБЕННОСТИ МОДЕЛЕЙ:
        - К mobilenet_general (edema/healthy) относись лояльнее - модель может быть строгой
        - К mobilenet_skin (acne/freckles/healthy) относись немного лояльнее - за acne иногда определяются родинки
        - К mobilenet_eyes_pupils и mobilenet_age относись стандартно

        4. РЕКОМЕНДАЦИИ:
        - Дай конкретные рекомендации по улучшению состояния
        - Предложи профилактические меры
        - Укажи, когда стоит обратиться к специалисту

        ФОРМАТ ОТВЕТА:
        - Общая оценка состояния
        - Уровень усталости (в процентах)
        - Детальный анализ по каждой категории
        - Рекомендации

        Также отдельно выведи эти параметры как для диаграммы состояния пользователя. НЕ ПОВТОРЯЙ С УВЕРЕННОСТЬЮ!
        {{"tireness": <процент>, "eyes_health": <процент>, "swelling": <процент>, "eyes_darkircles": <процент>, "skin_health": <процент>, "acne": <процент>}}

        Ответ дай на русском языке в дружелюбном тоне.
        '''

    chat_completion = await CLIENT.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "system", "content": instr},
            {"role": "user", "content": analysis_results}
        ]
    )
    return chat_completion.choices[0].message.content
