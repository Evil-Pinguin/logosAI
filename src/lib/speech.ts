/**
 * Web Speech API хелпер для озвучки текстов на русском языке.
 * Скорость reduzена до ~0.85 для комфортного логопедического восприятия детей.
 */

let voicesCache: SpeechSynthesisVoice[] = []
let voicesReady = false

function refreshVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  voicesCache = window.speechSynthesis.getVoices()
  voicesReady = true
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = refreshVoices
  refreshVoices()
}

/**
 * Находит pierwszy доступный русский голос (ru-RU / ru).
 */
function getRussianVoice(): SpeechSynthesisVoice | undefined {
  if (!voicesReady) refreshVoices()
  return (
    voicesCache.find((v) => v.lang.startsWith('ru-RU')) ||
    voicesCache.find((v) => v.lang.startsWith('ru')) ||
    undefined
  )
}

/**
 * Озвучивает текст через Web Speech API.
 * - Язык: русский
 * - Скорость: 0.85 (немного медленнее стандартной)
 */
export function speak(text: string): void {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return

  // Останавливаем текущее воспроизведение
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.rate = 0.85
  utterance.pitch = 1
  utterance.volume = 1

  const ruVoice = getRussianVoice()
  if (ruVoice) {
    utterance.voice = ruVoice
  }

  window.speechSynthesis.speak(utterance)
}

/**
 * Отменяет всё текущее воспроизведение речи.
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
