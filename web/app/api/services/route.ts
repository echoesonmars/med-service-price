import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseInt(searchParams.get("minPrice") || "0");
    const maxPrice = parseInt(searchParams.get("maxPrice") || "0");
    const sortBy = searchParams.get("sortBy") || "relevance"; // relevance | price_asc | price_desc | rating
    const city = searchParams.get("city") || "Шымкент";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const useSemanticSearch = searchParams.get("semantic") === "true";

    // If semantic search is enabled and there's a query, call the backend API
    if (useSemanticSearch && q) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const backendParams = new URLSearchParams();
        backendParams.set("q", q);
        if (city) backendParams.set("city", city);
        if (category && category !== "all") backendParams.set("category", category);
        if (minPrice > 0) backendParams.set("price_min", minPrice.toString());
        if (maxPrice > 0) backendParams.set("price_max", maxPrice.toString());
        backendParams.set("sort", sortBy);
        backendParams.set("limit", limit.toString());
        backendParams.set("page", Math.floor(offset / limit + 1).toString());

        const backendResponse = await fetch(
          `${backendUrl}/api/v1/services/search?${backendParams.toString()}`,
          { next: { revalidate: 60 } }
        );

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          
          interface BackendService {
            id: string;
            title: string;
            category: string;
            price: number;
            old_price: number | null;
            clinic: {
              id: string;
              name: string;
              address: string;
              city: string;
              rating: number;
              review_count: number;
              lat: number;
              lng: number;
              phone: string | null;
              website: string | null;
              work_hours: string | null;
            };
          }
          
          // Transform backend response to frontend format
          const results = (backendData.services as BackendService[]).map((service) => ({
            id: service.id,
            title: service.title,
            category: service.category,
            price: formatPrice(service.price),
            priceRaw: service.price,
            oldPrice: service.old_price ? formatPrice(service.old_price) : null,
            oldPriceRaw: service.old_price,
            clinic: service.clinic.name,
            clinicId: service.clinic.id,
            address: service.clinic.address,
            city: service.clinic.city,
            metro: extractDistrict(service.clinic.address),
            distance: "",
            rating: service.clinic.rating.toFixed(1),
            reviewsCount: formatReviews(service.clinic.review_count),
            badge: categoryLabel(service.category),
            lat: service.clinic.lat,
            lng: service.clinic.lng,
            phone: service.clinic.phone,
            website: service.clinic.website,
            workHours: service.clinic.work_hours,
            isSemanticMatch: true,
          }));

          // Get categories from results
          const categoryCounts = new Map<string, number>();
          results.forEach((r) => {
            categoryCounts.set(r.category, (categoryCounts.get(r.category) || 0) + 1);
          });

          return NextResponse.json({
            results,
            total: backendData.total,
            limit: backendData.limit,
            offset: (backendData.page - 1) * backendData.limit,
            categories: Array.from(categoryCounts.entries()).map(([cat, count]) => ({
              value: cat,
              label: categoryLabel(cat),
              count,
            })),
            semantic: true,
          });
        }
      } catch (error) {
        console.error("Backend semantic search failed, falling back to local search:", error);
        // Fall through to local Prisma search
      }
    }

    // Build where conditions for local Prisma search
    type ServiceWhereInput = NonNullable<Parameters<typeof prisma.service.findMany>[0]>['where'];
    const whereConditions: ServiceWhereInput = {
      clinic: {
        city: city,
      },
    };

    // Text search: match against service title or clinic name
    if (q) {
      whereConditions.OR = [
        { title: { contains: q } },
        { clinic: { name: { contains: q } } },
        { clinic: { address: { contains: q } } },
        { category: { contains: q } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      whereConditions.category = category;
    }

    // Price range filter
    if (minPrice > 0) {
      whereConditions.price = { ...((whereConditions.price as object) || {}), gte: minPrice };
    }
    if (maxPrice > 0) {
      whereConditions.price = { ...((whereConditions.price as object) || {}), lte: maxPrice };
    }

    // Determine sort order
    type ServiceOrderBy = NonNullable<Parameters<typeof prisma.service.findMany>[0]>['orderBy'];
    let orderBy: ServiceOrderBy;
    switch (sortBy) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { clinic: { rating: "desc" } };
        break;
      default:
        orderBy = { updatedAt: "desc" };
    }

    // Execute query
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: whereConditions,
        include: {
          clinic: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.service.count({ where: whereConditions }),
    ]);

    // Transform to frontend-friendly format
    const results = services.map((service) => ({
      id: service.id,
      title: service.title,
      category: service.category,
      price: formatPrice(service.price),
      priceRaw: service.price,
      oldPrice: service.oldPrice ? formatPrice(service.oldPrice) : null,
      oldPriceRaw: service.oldPrice,
      clinic: service.clinic.name,
      clinicId: service.clinic.id,
      address: service.clinic.address,
      city: service.clinic.city,
      metro: extractDistrict(service.clinic.address),
      distance: "",  // calculated client-side from user coords
      rating: service.clinic.rating.toFixed(1),
      reviewsCount: formatReviews(service.clinic.reviewCount),
      badge: categoryLabel(service.category),
      lat: service.clinic.lat,
      lng: service.clinic.lng,
      phone: service.clinic.phone,
      website: service.clinic.website,
      workHours: service.clinic.workHours,
    }));

    // Get available categories for filter UI
    const categories = await prisma.service.groupBy({
      by: ["category"],
      _count: { category: true },
      where: q ? {
        OR: [
          { title: { contains: q } },
          { clinic: { name: { contains: q } } },
        ],
      } : undefined,
    });

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      categories: categories.map((c) => ({
        value: c.category,
        label: categoryLabel(c.category),
        count: c._count.category,
      })),
    });
  } catch (error) {
    console.error("Services API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper functions
function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₸";
}

function formatReviews(count: number): string {
  if (count === 0) return "Нет отзывов";
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${count} отзывов`;
  if (lastOne === 1) return `${count} отзыв`;
  if (lastOne >= 2 && lastOne <= 4) return `${count} отзыва`;
  return `${count} отзывов`;
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
    физиотерапия: "Физиотерапия",
  };
  return labels[category] || category;
}

function extractDistrict(address: string): string {
  // Extract district or neighborhood from address
  const match = address.match(/(мкр\.\s*[^,]+|р-н\s*[^,]+|ул\.\s*[^,]+)/i);
  return match ? match[1] : address.split(",")[0];
}
