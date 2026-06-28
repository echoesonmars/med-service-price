import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8000";
    const backendResponse = await fetch(`${backendUrl}/api/v1/categories`, {
      next: { revalidate: 60 }
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`);
    }

    const categoriesData = await backendResponse.json();

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
      физиотерапия: "Физиотерапия",
    };

    return NextResponse.json(
      categoriesData.map((c: { category: string; count: number }) => ({
        value: c.category,
        label: labels[c.category] || c.category,
        count: c.count,
      })),
    );
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
