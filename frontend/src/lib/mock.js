// Mock analysis generator for UI-only demo
// TODO(API): Replace this entire file with real API responses when backend is ready.

function rand(min = 0, max = 1) {
  return Math.random() * (max - min) + min
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function buildRecommendations(scores) {
  const recs = []
  const { stress, fatigue, anxiety } = scores
  const { redness, dryness, pigmentation } = scores.skin
  const { redness: eyeRed, darkCircles, scleraYellowing } = scores.eyes
  const { puffiness, pallor } = scores.general

  if (stress > 0.6 || anxiety > 0.6) recs.push('Отметьте уровень стресса. Попробуйте дыхательные упражнения 4-7-8 на 2–3 минуты.')
  if (fatigue > 0.6 || darkCircles > 0.6) recs.push('Вероятна усталость. Рекомендуется 7–9 часов сна и перерывы 5 минут каждый час.')
  if (dryness > 0.6) recs.push('Признаки сухости кожи. Увеличьте потребление воды и используйте увлажняющий крем.')
  if (redness > 0.6 || eyeRed > 0.6) recs.push('Замечены покраснения. Избегайте раздражителей и при необходимости проконсультируйтесь с врачом.')
  if (pigmentation > 0.6) recs.push('Неровный тон кожи. Используйте SPF и избегайте длительного воздействия солнца.')
  if (scleraYellowing > 0.4) recs.push('Оттенок склер может быть усиленным. При повторении обратитесь к врачу.')
  if (puffiness > 0.6) recs.push('Лёгкая отёчность. Следите за солью и режимом сна, рассмотрите мягкую лимфодренажную гимнастику.')
  if (pallor > 0.6) recs.push('Отмечается бледность. Проверьте питание и уровень железа при необходимости.')

  if (recs.length === 0) recs.push('Существенных отклонений не выявлено. Продолжайте наблюдение и поддерживайте здоровые привычки.')
  return recs
}

export function mockAnalyze(imageDataUrl) {
  return new Promise((resolve) => {
    const delay = 900 + Math.random() * 900

    const scores = {
      stress: clamp01(rand(0.1, 0.9)),
      fatigue: clamp01(rand(0.1, 0.9)),
      anxiety: clamp01(rand(0.1, 0.9)),
      skin: {
        redness: clamp01(rand(0.05, 0.85)),
        dryness: clamp01(rand(0.05, 0.85)),
        pigmentation: clamp01(rand(0.05, 0.85)),
      },
      eyes: {
        redness: clamp01(rand(0.05, 0.85)),
        darkCircles: clamp01(rand(0.05, 0.85)),
        scleraYellowing: clamp01(rand(0.0, 0.6)),
      },
      general: {
        puffiness: clamp01(rand(0.05, 0.85)),
        pallor: clamp01(rand(0.05, 0.85)),
      },
    }

    const high = (val) => (val > 0.66 ? 1 : 0)
    const medium = (val) => (val > 0.33 && val <= 0.66 ? 1 : 0)

    const summaryParts = []
    if (high(scores.fatigue)) summaryParts.push('есть признаки усталости')
    if (high(scores.stress)) summaryParts.push('повышенный стресс')
    if (high(scores.skin.dryness)) summaryParts.push('сухость кожи')
    if (high(scores.eyes.darkCircles)) summaryParts.push('тёмные круги под глазами')
    if (summaryParts.length === 0) summaryParts.push('существенных отклонений не выявлено')

    const result = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      imagePreview: imageDataUrl,
      scores,
      summary: `По фото ${summaryParts.join(', ')}.`,
      recommendations: buildRecommendations(scores),
    }

    setTimeout(() => resolve(result), delay)
  })
}
