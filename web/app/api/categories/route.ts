import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.service.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

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
      categories.map((c) => ({
        value: c.category,
        label: labels[c.category] || c.category,
        count: c._count.category,
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
