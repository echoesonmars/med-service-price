export interface ServiceItem {
  id?: string;
  title: string;
  category?: string;
  price: string;
  priceRaw?: number;
  oldPrice: string | null;
  oldPriceRaw?: number | null;
  clinic: string;
  clinicId?: string;
  address: string;
  metro: string;
  distance: string;
  rating: string;
  reviewsCount: string;
  badge: string;
  lat?: number;
  lng?: number;
  phone?: string | null;
  website?: string | null;
  workHours?: string | null;
}

export interface SearchResponse {
  results: ServiceItem[];
  total: number;
  limit: number;
  offset: number;
  categories: CategoryCount[];
}

export interface CategoryCount {
  value: string;
  label: string;
  count: number;
}
