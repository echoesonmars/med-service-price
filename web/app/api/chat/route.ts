import { google } from "@ai-sdk/google";
import { streamText, tool, toUIMessageStream, createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { mockResults } from "@/lib/mock-data";

const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google(modelName),
      messages,
      system: `Вы — интеллектуальный медицинский ассистент MedServicePrice в Шымкенте.
Ваша задача — помочь пользователю понять, какие исследования или к каким врачам ему стоит обратиться на основе описанных им симптомов.
Если пользователь описывает симптомы или спрашивает о конкретной медицинской услуге (например, МРТ, УЗИ, анализы, прием врача), вы ОБЯЗАТЕЛЬНО должны вызвать инструмент 'search_clinics_by_symptom' для поиска предложений в клиниках.
После вызова инструмента и получения результатов, кратко прокомментируйте рекомендации и скажите, что пользователь может кликнуть на карточки ниже, чтобы увидеть их на карте Шымкента.
Отвечайте на русском языке, вежливо и профессионально. Не ставьте эмодзи в тексте.`,
      tools: {
        search_clinics_by_symptom: tool({
          description: "Поиск медицинских услуг, анализов и клиник в Шымкенте по симптомам или названию услуги.",
          inputSchema: z.object({
            query: z.string().describe("Поисковый запрос (например: 'болит голова', 'мрт', 'узи органов брюшной полости', 'анализ крови')"),
          }),
          execute: async ({ query }) => {
            const lowerQuery = query.toLowerCase();
            
            // Keyword match over shared mockResults
            let filtered = mockResults.filter(item => 
              item.title.toLowerCase().includes(lowerQuery) ||
              item.clinic.toLowerCase().includes(lowerQuery) ||
              item.badge.toLowerCase().includes(lowerQuery)
            );

            // Fallbacks for common keywords if direct match is empty
            if (filtered.length === 0) {
              if (lowerQuery.includes("спин") || lowerQuery.includes("поясн")) {
                filtered = mockResults.filter(c => c.title.toLowerCase().includes("поясн") || c.title.toLowerCase().includes("мрт"));
              } else if (lowerQuery.includes("голов") || lowerQuery.includes("мозг")) {
                filtered = mockResults.filter(c => c.title.toLowerCase().includes("голов"));
              } else if (lowerQuery.includes("кров") || lowerQuery.includes("анализ")) {
                filtered = mockResults.slice(0, 2);
              } else {
                // Return default list if nothing matches
                filtered = mockResults;
              }
            }

            return filtered;
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
