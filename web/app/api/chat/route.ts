import { google } from "@ai-sdk/google";
import { streamText, tool, toUIMessageStream, createUIMessageStreamResponse, isStepCount, convertToModelMessages } from "ai";
import { z } from "zod";

const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google(modelName),
      messages: await convertToModelMessages(messages),
      stopWhen: isStepCount(5),
      system: `Вы — интеллектуальный медицинский ассистент MedServicePrice.
Ваша задача — помочь пользователю понять, какие исследования или к каким врачам ему стоит обратиться на основе описанных им симптомов.
Если пользователь описывает симптомы или спрашивает о конкретной медицинской услуге (например, МРТ, УЗИ, анализы, прием врача), вы ОБЯЗАТЕЛЬНО должны вызвать инструмент 'search_clinics_by_symptom' для поиска предложений в клиниках.
После вызова инструмента и получения результатов, кратко прокомментируйте рекомендации и скажите, что пользователь может кликнуть на карточки ниже, чтобы увидеть их на карте.
Отвечайте на русском языке, вежливо и профессионально. Не ставьте эмодзи в тексте.
Город: Шымкент, Казахстан.`,
      tools: {
        search_clinics_by_symptom: tool({
          description: "Поиск медицинских услуг, анализов и клиник по симптомам или названию услуги в базе данных MedServicePrice.",
          inputSchema: z.object({
            query: z.string().describe("Поисковый запрос (например: 'болит голова', 'мрт', 'узи органов брюшной полости', 'анализ крови')"),
          }),
          execute: async ({ query }) => {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8000";
            
            // Try searching via backend API
            try {
              const backendParams = new URLSearchParams();
              backendParams.set("q", query);
              backendParams.set("limit", "6");
              backendParams.set("sort", "relevance");

              const response = await fetch(`${backendUrl}/api/v1/services/search?${backendParams.toString()}`);
              
              if (response.ok) {
                const data = await response.json();
                if (data.services && data.services.length > 0) {
                  return formatResults(data.services);
                }
              }
              
              // If no direct match, try keyword-based fallback
              const keywords = extractKeywords(query.toLowerCase());
              if (keywords.length > 0) {
                const fallbackParams = new URLSearchParams();
                fallbackParams.set("q", keywords.join(" "));
                fallbackParams.set("limit", "6");
                fallbackParams.set("sort", "price_asc");
                
                const fallbackResponse = await fetch(`${backendUrl}/api/v1/services/search?${fallbackParams.toString()}`);
                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json();
                  return formatResults(fallbackData.services || []);
                }
              }
            } catch (err) {
              console.error("Error calling backend search API from chat route:", err);
            }

            return [];
          },
        }),
      },
    });

    return createUIMessageStreamResponse({ 
      stream: toUIMessageStream({ stream: result.stream }) 
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Extract medical keywords from natural language query
function extractKeywords(query: string): string[] {
  const keywordMap: Record<string, string[]> = {
    "голов": ["мрт", "головн"],
    "спин": ["мрт", "позвоноч", "поясн"],
    "поясн": ["мрт", "поясн"],
    "сердц": ["экг", "кардиолог", "эхо"],
    "серд": ["экг", "кардиолог"],
    "живот": ["узи", "брюшн", "гастро"],
    "кров": ["анализ", "кров"],
    "зрен": ["офтальмолог", "глаз"],
    "глаз": ["офтальмолог", "глаз"],
    "зуб": ["стоматолог", "зуб"],
    "ухо": ["лор", "отит"],
    "нос": ["лор", "синус"],
    "горл": ["лор", "горл"],
    "кож": ["дерматолог", "кож"],
    "щитовид": ["узи", "щитовид", "эндокринолог"],
    "почк": ["узи", "почк", "нефролог"],
    "суста": ["мрт", "ревматолог", "суста"],
    "давлен": ["кардиолог", "экг"],
    "аллерг": ["аллерголог", "иммуноглобулин"],
    "беремен": ["узи", "акушер", "гинеколог"],
    "женск": ["гинеколог"],
    "мужск": ["уролог"],
  };

  const matches: string[] = [];
  for (const [trigger, keywords] of Object.entries(keywordMap)) {
    if (query.includes(trigger)) {
      matches.push(...keywords);
    }
  }

  // If no keyword matches, return the original words
  if (matches.length === 0) {
    return query.split(/\s+/).filter(w => w.length > 2);
  }

  return [...new Set(matches)];
}

// Format database results to match frontend ServiceItem shape
function formatResults(services: Array<any>) {
  return services.map(s => ({
    id: s.id,
    title: s.title,
    price: formatPrice(s.price),
    oldPrice: s.old_price ? formatPrice(s.old_price) : "",
    clinic: s.clinic.name,
    address: s.clinic.address,
    metro: s.clinic.address.split(",")[0],
    distance: "",
    rating: s.clinic.rating ? s.clinic.rating.toFixed(1) : "0.0",
    reviewsCount: `${s.clinic.review_count} отзывов`,
    badge: categoryLabel(s.category),
    lat: s.clinic.lat,
    lng: s.clinic.lng,
    workHours: s.clinic.work_hours || s.clinic.workHours,
  }));
}

function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₸";
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    анализы: "Анализы",
    узи: "УЗИ",
    мрт: "МРТ",
    кт: "КТ",
    прием_врача: "Приём врача",
    диагностика: "Диагностика",
    стоматология: "Стоматология",
    лаборатория: "Лаборатория",
    рентген: "Рентген",
    экг: "ЭКГ",
  };
  return labels[category] || category;
}
