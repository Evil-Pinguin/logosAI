import { serve } from 'https://deno.land/std@0.198.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { OpenAI } from 'https://esm.sh/openai@4.52.0'
import { z, ZodError } from 'https://esm.sh/zod@3.23.8'

/* ------------------------------------------------------------------ */
/* CORS                                                               */
/* ------------------------------------------------------------------ */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/* ------------------------------------------------------------------ */
/* Закрытая копия Zod-схемы (дублирует src/lib/lessonSchema.ts)       */
/* ------------------------------------------------------------------ */
const exerciseAssetSchema = z.object({
  imageUrl: z.string().url(),
  audioText: z.string().min(1).max(200),
  label: z.string().max(50).optional(),
})

const choiceExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('choice'),
  instruction: z.string().min(1),
  options: z.array(exerciseAssetSchema).min(2).max(6),
  correctAnswerIndex: z.number().int().min(0).max(5),
})

const matchExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('match'),
  instruction: z.string().min(1),
  left: z.array(exerciseAssetSchema).min(2).max(5),
  right: z.array(exerciseAssetSchema).min(2).max(5),
  pairs: z.array(
    z.object({
      leftIndex: z.number().int().min(0),
      rightIndex: z.number().int().min(0),
    }),
  ),
})

const sequenceExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('sequence'),
  instruction: z.string().min(1),
  items: z.array(exerciseAssetSchema).length(3),
  correctOrder: z.array(z.string().uuid()).length(3),
})

const excludeExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('exclude'),
  instruction: z.string().min(1),
  options: z.array(exerciseAssetSchema).length(4),
  oddOneOutIndex: z.number().int().min(0).max(3),
  reason: z.string().min(1),
})

const pecsScheduleItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(50),
  imageUrl: z.string().url(),
  audioText: z.string().min(1).max(200),
  done: z.boolean().default(false),
})

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  lexicalTheme: z.string().min(1).max(100),
  difficultyLevel: z.enum(['low', 'medium', 'high']),
  pecsSchedule: z.array(pecsScheduleItemSchema).min(1).max(8),
  exercises: z
    .array(
      z.discriminatedUnion('type', [
        choiceExerciseSchema,
        matchExerciseSchema,
        sequenceExerciseSchema,
        excludeExerciseSchema,
      ]),
    )
    .min(1)
    .max(10),
})

type LessonSchemaType = z.infer<typeof lessonSchema>

/* ------------------------------------------------------------------ */
/* Системный промпт LogosAI Agent                                     */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `
Вы — эксперт по логопедии и дефектологии (LogosAI Agent). Вы создаёте интерактивные обучающие уроки для детей с особенностями развития (РАС, ЗПР, ТНР) в стиле Duolingo/Wordwall.

ПРИНЦИПЫ ДИЗАЙНА (обязательны к соблюдению):
1. Чистый, минималистичный интерфейс без визуального шума (подходит для детей с РАС).
2. Крупные, легко кликабельные элементы управления.
3. Яркие, контрастные цвета для интерактивных элементов; белые/светлые фоны для контентных карточек.
4. Тон должен быть доброжелательным, спокойным и поддерживающим.

СТРУКТУРА ОТВЕТА (строгий JSON, БЕЗ markdown-блоков, БЕЗ комментариев):
{
  "title": "строка до 200 символов",
  "lexicalTheme": "строка до 100 символов",
  "difficultyLevel": "low | medium | high",
  "pecsSchedule": [
    { "id": "UUID", "label": "строка до 50 символов", "imageUrl": "валидный URL", "audioText": "строка до 200 символов", "done": false }
  ],
  "exercises": [
    {
      "id": "UUID",
      "type": "choice",
      "instruction": "строка",
      "options": [ { "imageUrl": "URL", "audioText": "строка", "label?": "строка" } ],
      "correctAnswerIndex": число (индекс правильного варианта)
    },
    {
      "id": "UUID",
      "type": "match",
      "instruction": "строка",
      "left": [ { "imageUrl": "URL", "audioText": "строка" } ],
      "right": [ { "imageUrl": "URL", "audioText": "строка" } ],
      "pairs": [ { "leftIndex": число, "rightIndex": число } ]
    },
    {
      "id": "UUID",
      "type": "sequence",
      "instruction": "строка",
      "items": [ { "imageUrl": "URL", "audioText": "строка", "label?": "строка" } ],
      "correctOrder": ["UUID1", "UUID2", "UUID3"]
    },
    {
      "id": "UUID",
      "type": "exclude",
      "instruction": "строка",
      "options": [ { "imageUrl": "URL", "audioText": "строка", "label?": "строка" } ],
      "oddOneOutIndex": число от 0 до 3,
      "reason": "текстовое объяснение, почему карточка лишняя"
    }
  ]
}

ТРЕБОВАНИЯ:
- Язык ответа: русский.
- Каждое упражнение содержит audioText — текст для озвучки через Web Speech API.
- imageUrl — ссылки на реальные PECS-карточки или иллюстрации.
- difficultyLevel влияет на количество вариантов и абстрактность материала (low — проще, high — сложнее).
- Выводите ТОЛЬКО чистый JSON. Если модель добавит markdown-обёртку \`\`\`json, удалите её перед парсингом.
`.trim()

/* ------------------------------------------------------------------ */
/* Вспомогательные функции                                            */
/* ------------------------------------------------------------------ */

/**
 * Извлекает чистую JSON-строку из ответа модели, удаляя
 * markdown-обёртки \`\`\`json ... \`\`\` и прочий шум.
 */
function extractJson(text: string): string {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .replace(/^\s*```\s*/gi, '')
    .trim()

  // Если всё ещё не чистый JSON, попробуем найти объект между первой { и последней }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1)
  }
  return cleaned
}

/* ------------------------------------------------------------------ */
/* Обработчик                                                         */
/* ------------------------------------------------------------------ */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  /* ---------- Аутентификация ---------- */
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Authorization header required' }, 401)
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { headers: { Authorization: authHeader } },
  )

  const { data: { user }, error: authError } =
    await supabaseClient.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  /* ---------- Параметры запроса ---------- */
  let body: { lexical_theme?: string; difficulty_level?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { lexical_theme, difficulty_level = 'low', title = 'Новый урок' } = body
  if (!lexical_theme) {
    return json({ error: 'Поле lexical_theme обязательно' }, 400)
  }

  /* ---------- OpenAI клиент ---------- */
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    // Демо-режим без ключа — возвращаем валидный урок, чтобы приложение оставалось работоспособным
    const demoLesson: LessonSchemaType = {
      title: `${title} (демо)`,
      lexicalTheme: lexical_theme,
      difficultyLevel: difficulty_level as any,
      pecsSchedule: [
        {
          id: crypto.randomUUID(),
          label: 'Приветствие',
          imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=hello',
          audioText: 'Поздоровайтесь',
          done: false,
        },
        {
          id: crypto.randomUUID(),
          label: 'Основная часть',
          imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=lesson',
          audioText: 'Переходим к заданиям',
          done: false,
        },
        {
          id: crypto.randomUUID(),
          label: 'Завершение',
          imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=finish',
          audioText: 'Занятие завершено',
          done: false,
        },
      ],
      exercises: [
        {
          id: crypto.randomUUID(),
          type: 'choice',
          instruction: 'Где показана кошка?',
          options: [
            { imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=cat', audioText: 'Кошка', label: 'Кошка' },
            { imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=dog', audioText: 'Собака', label: 'Собака' },
            { imageUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=bird', audioText: 'Птица', label: 'Птица' },
          ],
          correctAnswerIndex: 0,
        },
      ],
    }

    const { data: inserted, error: dbError } = await supabaseClient
      .from('lessons')
      .insert({
        user_id: user.id,
        title: demoLesson.title,
        lexical_theme: demoLesson.lexicalTheme,
        difficulty_level: demoLesson.difficultyLevel,
        raw_json: demoLesson,
      })
      .select()
      .single()

    if (dbError) return json({ error: dbError.message }, 500)

    return json({ id: inserted.id, lesson: demoLesson })
  }

  const openai = new OpenAI({ apiKey: openaiApiKey })

  let userPrompt = `Сгенерируйте урок на тему "${lexical_theme}" со сложностью "${difficulty_level}". Заголовок: "${title}".`
  let lastError: unknown

  /* ---------- Попытка генерации с ретраями (до 2 повторов) ---------- */
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })

      const rawContent = completion.choices?.[0]?.message?.content
      if (!rawContent) {
        throw new Error('Пустой ответ от LLM')
      }

      const cleanedJson = extractJson(rawContent)
      const parsed: LessonSchemaType = lessonSchema.parse(JSON.parse(cleanedJson))

      /* ---------- Сохранение в Supabase ---------- */
      const { data: inserted, error: dbError } = await supabaseClient
        .from('lessons')
        .insert({
          user_id: user.id,
          title: parsed.title,
          lexical_theme: parsed.lexicalTheme,
          difficulty_level: parsed.difficultyLevel,
          raw_json: parsed,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return json({ id: inserted.id, lesson: parsed })
    } catch (err: any) {
      lastError = err

      // Если это не последняя попытка — добавляем ошибку в контекст и пробуем снова
      if (attempt < 2) {
        const validationMsg = err instanceof ZodError
          ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
          : err.message || String(err)

        userPrompt += `
ОШИБКА ВАЛИДАЦИИ ПРЕДЫДУЩЕГО ОТВЕТА: ${validationMsg}
Исправьте JSON и пришлите только валидный объект без markdown-блоков и комментариев.`
        continue
      }

      return json(
        {
          error: 'Не удалось сгенерировать валидный урок после 3 попыток',
          details: String(lastError),
        },
        500,
      )
    }
  }

  return json({ error: 'Unexpected error' }, 500)
})
