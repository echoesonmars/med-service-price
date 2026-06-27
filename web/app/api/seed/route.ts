import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper functions
/** Calculate price with minor randomization */
function randomizePrice(basePrice: number): number {
  const variation = (Math.random() * 0.2 - 0.1); // +/- 10%
  let finalPrice = basePrice * (1 + variation);
  finalPrice = Math.round(finalPrice / 500) * 500;
  return finalPrice;
}

function randPrice(min: number, max: number): number {
  const raw = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.round(raw / 500) * 500;
}

/** ~30% chance to generate an oldPrice (10-25% higher) */
function maybeOldPrice(price: number): number | null {
  if (Math.random() < 0.3) {
    const multiplier = 1.1 + Math.random() * 0.15; // 10-25% higher
    return Math.round((price * multiplier) / 500) * 500;
  }
  return null;
}

/** Pick a random subset of items from an array */
function pickRandom<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function getCategoriesForClinic(clinicName: string): string[] {
  if (clinicName.includes('Стоматолог') || clinicName.includes('White Smile') || clinicName.includes('Тіс')) {
    return ['стоматология', 'диагностика'];
  }
  if (clinicName.includes('Лаборатория') || clinicName.includes('InVitro') || clinicName.includes('KDL') || clinicName.includes('Олекс')) {
    return ['анализы', 'лаборатория'];
  }
  if (clinicName.includes('Томограф')) {
    return ['мрт', 'кт', 'диагностика'];
  }
  if (clinicName.includes('Диагностический') || clinicName.includes('ЮгМед')) {
    return ['анализы', 'узи', 'мрт', 'кт', 'диагностика', 'лаборатория'];
  }
  return ['анализы', 'узи', 'мрт', 'кт', 'прием_врача', 'диагностика', 'лаборатория', 'стоматология'];
}

function getServiceCountRange(clinicName: string): [number, number] {
  if (clinicName.includes('Стоматолог') || clinicName.includes('White Smile') || clinicName.includes('Тіс')) return [8, 15];
  if (clinicName.includes('Лаборатория') || clinicName.includes('InVitro') || clinicName.includes('KDL') || clinicName.includes('Олекс')) return [20, 35];
  if (clinicName.includes('Томограф')) return [15, 24];
  if (clinicName.includes('Диагностический') || clinicName.includes('ЮгМед')) return [30, 50];
  if (clinicName.includes('Многопрофильная') || clinicName.includes('МедЭлит') || clinicName.includes('Президент')) return [40, 60];
  return [25, 45];
}

export async function GET() {
  try {// ─── Clinics ────────────────────────────────────────────────────────────────────

const clinics = [
  {
    name: 'Медицинский центр «Шымкент Мед»',
    address: 'ул. Тауке хана, 45',
    city: 'Шымкент',
    lat: 42.3167,
    lng: 69.5969,
    phone: '+7 (725) 233-11-22',
    website: 'https://shymkentmed.kz',
    rating: 4.7,
    reviewCount: 312,
    workHours: '08:00-20:00',
  },
  {
    name: 'Клиника «Гиппократ»',
    address: 'пр. Республики, 12',
    city: 'Шымкент',
    lat: 42.3200,
    lng: 69.5950,
    phone: '+7 (725) 234-55-66',
    website: 'https://gippokrat-shym.kz',
    rating: 4.5,
    reviewCount: 245,
    workHours: '08:00-21:00',
  },
  {
    name: 'Диагностический центр «Олимп»',
    address: 'ул. Байтурсынова, 78',
    city: 'Шымкент',
    lat: 42.3250,
    lng: 69.6100,
    phone: '+7 (725) 255-77-88',
    website: 'https://olymp-diagnostics.kz',
    rating: 4.8,
    reviewCount: 189,
    workHours: '07:00-22:00',
  },
  {
    name: 'Центр здоровья «Шипагер»',
    address: 'ул. Кунаева, 34',
    city: 'Шымкент',
    lat: 42.3100,
    lng: 69.5800,
    phone: '+7 (725) 244-33-22',
    website: null,
    rating: 4.3,
    reviewCount: 167,
    workHours: '09:00-19:00',
  },
  {
    name: 'Медицинский центр «Авиценна»',
    address: 'пр. Кабанбай батыра, 56',
    city: 'Шымкент',
    lat: 42.3350,
    lng: 69.6200,
    phone: '+7 (725) 266-44-55',
    website: 'https://avicenna-shymkent.kz',
    rating: 4.6,
    reviewCount: 298,
    workHours: '08:00-20:00',
  },
  {
    name: 'Клиника «MedLine»',
    address: 'ул. Желтоксан, 89',
    city: 'Шымкент',
    lat: 42.2950,
    lng: 69.5700,
    phone: '+7 (725) 277-88-99',
    website: 'https://medline-shym.kz',
    rating: 4.4,
    reviewCount: 134,
    workHours: '08:00-20:00',
  },
  {
    name: 'Лаборатория «Олекс»',
    address: 'ул. Толе би, 22',
    city: 'Шымкент',
    lat: 42.3180,
    lng: 69.5880,
    phone: '+7 (725) 288-11-33',
    website: 'https://olex-lab.kz',
    rating: 4.9,
    reviewCount: 421,
    workHours: '07:00-20:00',
  },
  {
    name: 'Клиника «Достар Мед»',
    address: 'ул. Абая, 101',
    city: 'Шымкент',
    lat: 42.3050,
    lng: 69.6050,
    phone: '+7 (725) 299-22-44',
    website: null,
    rating: 4.2,
    reviewCount: 98,
    workHours: '09:00-18:00',
  },
  {
    name: 'Городская клиника «Денсаулық»',
    address: 'пр. Аль-Фараби, 67',
    city: 'Шымкент',
    lat: 42.3400,
    lng: 69.5600,
    phone: '+7 (725) 211-55-66',
    website: 'https://densaulyk-clinic.kz',
    rating: 4.1,
    reviewCount: 156,
    workHours: 'Круглосуточно',
  },
  {
    name: 'Медицинский центр «Нұр»',
    address: 'ул. Тәуелсіздік, 145',
    city: 'Шымкент',
    lat: 42.2900,
    lng: 69.6150,
    phone: '+7 (725) 222-66-77',
    website: 'https://nur-med.kz',
    rating: 4.5,
    reviewCount: 203,
    workHours: '08:00-21:00',
  },
  {
    name: 'Стоматология «White Smile»',
    address: 'ул. Казыбек би, 55',
    city: 'Шымкент',
    lat: 42.3220,
    lng: 69.6000,
    phone: '+7 (725) 233-77-88',
    website: 'https://whitesmile-shym.kz',
    rating: 4.8,
    reviewCount: 276,
    workHours: '09:00-21:00',
  },
  {
    name: 'Центр МРТ и КТ «Томограф»',
    address: 'ул. Мадели кожа, 38',
    city: 'Шымкент',
    lat: 42.3300,
    lng: 69.5850,
    phone: '+7 (725) 244-88-99',
    website: 'https://tomograf-shym.kz',
    rating: 4.7,
    reviewCount: 189,
    workHours: 'Круглосуточно',
  },
  {
    name: 'Поликлиника «Сункар»',
    address: 'пр. Байдибек би, 112',
    city: 'Шымкент',
    lat: 42.3150,
    lng: 69.5750,
    phone: '+7 (725) 255-99-11',
    website: null,
    rating: 4.0,
    reviewCount: 87,
    workHours: '08:00-18:00',
  },
  {
    name: 'Клиника «HealthCity»',
    address: 'ул. Жангельдина, 70',
    city: 'Шымкент',
    lat: 42.3080,
    lng: 69.6300,
    phone: '+7 (725) 266-11-22',
    website: 'https://healthcity.kz',
    rating: 4.6,
    reviewCount: 215,
    workHours: '07:30-20:30',
  },
  {
    name: 'Лаборатория «InVitro Шымкент»',
    address: 'ул. Навои, 15',
    city: 'Шымкент',
    lat: 42.3190,
    lng: 69.5920,
    phone: '+7 (725) 277-22-33',
    website: 'https://invitro.kz',
    rating: 4.9,
    reviewCount: 534,
    workHours: '07:00-19:00',
  },
  {
    name: 'Медицинский центр «Асем»',
    address: 'ул. Туркестанская, 92',
    city: 'Шымкент',
    lat: 42.3360,
    lng: 69.5980,
    phone: '+7 (725) 288-33-44',
    website: null,
    rating: 4.3,
    reviewCount: 112,
    workHours: '08:00-19:00',
  },
  {
    name: 'Клиника «Сана-Мед»',
    address: 'ул. Момышулы, 48',
    city: 'Шымкент',
    lat: 42.2980,
    lng: 69.5650,
    phone: '+7 (725) 299-44-55',
    website: 'https://sana-med.kz',
    rating: 4.4,
    reviewCount: 178,
    workHours: '08:00-20:00',
  },
  {
    name: 'Центр «Президент Мед»',
    address: 'пр. Тамерлановское шоссе, 25',
    city: 'Шымкент',
    lat: 42.3420,
    lng: 69.6100,
    phone: '+7 (725) 211-66-77',
    website: 'https://president-med.kz',
    rating: 4.7,
    reviewCount: 267,
    workHours: '08:00-22:00',
  },
  {
    name: 'Клиника «Жансая»',
    address: 'ул. Бекзат Саттарханов, 63',
    city: 'Шымкент',
    lat: 42.3120,
    lng: 69.6250,
    phone: '+7 (725) 222-77-88',
    website: null,
    rating: 4.1,
    reviewCount: 95,
    workHours: '09:00-18:00',
  },
  {
    name: 'Диагностический центр «ЮгМед»',
    address: 'ул. Ибрагимова, 31',
    city: 'Шымкент',
    lat: 42.2870,
    lng: 69.5900,
    phone: '+7 (725) 233-88-99',
    website: 'https://yugmed.kz',
    rating: 4.5,
    reviewCount: 198,
    workHours: '07:30-21:00',
  },
  {
    name: 'Стоматологическая клиника «Тіс»',
    address: 'ул. Қазақстан, 17',
    city: 'Шымкент',
    lat: 42.3240,
    lng: 69.5830,
    phone: '+7 (725) 244-99-11',
    website: 'https://tis-dental.kz',
    rating: 4.6,
    reviewCount: 231,
    workHours: '09:00-20:00',
  },
  {
    name: 'Клиника «МедЭлит»',
    address: 'ул. Жібек жолы, 85',
    city: 'Шымкент',
    lat: 42.3070,
    lng: 69.5550,
    phone: '+7 (725) 255-11-22',
    website: 'https://medelit-shym.kz',
    rating: 4.8,
    reviewCount: 345,
    workHours: '08:00-21:00',
  },
  {
    name: 'Медицинский центр «Арнау»',
    address: 'пр. Қонаева, 140',
    city: 'Шымкент',
    lat: 42.3330,
    lng: 69.6350,
    phone: '+7 (725) 266-22-33',
    website: null,
    rating: 4.2,
    reviewCount: 88,
    workHours: '08:00-18:00',
  },
  {
    name: 'Центр лабораторной диагностики «KDL»',
    address: 'ул. Рыскулова, 50',
    city: 'Шымкент',
    lat: 42.3140,
    lng: 69.6020,
    phone: '+7 (725) 277-33-44',
    website: 'https://kdl.kz',
    rating: 4.7,
    reviewCount: 412,
    workHours: '07:00-18:00',
  },
  {
    name: 'Многопрофильная клиника «Отау»',
    address: 'ул. Сайрамская, 28',
    city: 'Шымкент',
    lat: 42.2930,
    lng: 69.6180,
    phone: '+7 (725) 288-44-55',
    website: 'https://otau-clinic.kz',
    rating: 4.4,
    reviewCount: 167,
    workHours: '08:00-20:00',
  },
];

// ─── Service Templates ──────────────────────────────────────────────────────────
// Each template: [title, category, priceMin, priceMax]

type ServiceTemplate = [string, string, number, number];

const serviceTemplates: ServiceTemplate[] = [
  // ── Анализы (Blood / Lab Tests) ──
  ['Общий анализ крови (ОАК)', 'анализы', 2000, 4500],
  ['Биохимический анализ крови', 'анализы', 4000, 8000],
  ['Общий анализ мочи (ОАМ)', 'анализы', 1500, 3000],
  ['Анализ крови на сахар (глюкоза)', 'анализы', 1500, 3500],
  ['Анализ на холестерин', 'анализы', 2000, 4000],
  ['Коагулограмма', 'анализы', 3500, 6500],
  ['Анализ на гормоны щитовидной железы (ТТГ)', 'анализы', 3000, 6000],
  ['Анализ на гормоны щитовидной железы (Т3, Т4)', 'анализы', 4000, 7000],
  ['Анализ на ВИЧ', 'анализы', 2500, 5000],
  ['Анализ на гепатит B', 'анализы', 2500, 5000],
  ['Анализ на гепатит C', 'анализы', 2500, 5000],
  ['Анализ на сифилис (RW)', 'анализы', 2000, 4000],
  ['Анализ крови на ферритин', 'анализы', 3000, 5500],
  ['Анализ на витамин D', 'анализы', 4500, 8000],
  ['Анализ на витамин B12', 'анализы', 3500, 6500],
  ['Анализ крови на ПСА (простат-специфический антиген)', 'анализы', 4000, 7000],
  ['Группа крови и резус-фактор', 'анализы', 2500, 5000],
  ['Анализ на аллергены (панель)', 'анализы', 5000, 12000],
  ['Анализ на С-реактивный белок (СРБ)', 'анализы', 2500, 5000],
  ['Анализ на мочевую кислоту', 'анализы', 2000, 4000],
  ['Анализ на креатинин', 'анализы', 2000, 4000],
  ['Липидный профиль (липидограмма)', 'анализы', 3500, 6500],
  ['Анализ на железо сыворотки', 'анализы', 2500, 4500],
  ['Анализ на гликированный гемоглобин (HbA1c)', 'анализы', 3500, 6500],
  ['Общий белок крови', 'анализы', 1800, 3500],

  // ── УЗИ (Ultrasound) ──
  ['УЗИ органов брюшной полости', 'узи', 5000, 12000],
  ['УЗИ почек', 'узи', 4000, 8000],
  ['УЗИ щитовидной железы', 'узи', 4000, 9000],
  ['УЗИ молочных желез', 'узи', 5000, 10000],
  ['УЗИ органов малого таза', 'узи', 5000, 12000],
  ['УЗИ предстательной железы (ТРУЗИ)', 'узи', 5500, 10000],
  ['УЗИ сердца (ЭхоКГ)', 'узи', 7000, 15000],
  ['УЗИ сосудов шеи (УЗДГ)', 'узи', 6000, 12000],
  ['УЗИ сосудов нижних конечностей', 'узи', 6000, 12000],
  ['УЗИ мочевого пузыря', 'узи', 4000, 7500],
  ['УЗИ суставов', 'узи', 5000, 10000],
  ['УЗИ при беременности (1 триместр)', 'узи', 6000, 12000],
  ['УЗИ при беременности (2-3 триместр)', 'узи', 7000, 14000],
  ['УЗИ лимфатических узлов', 'узи', 4000, 8000],
  ['УЗИ мягких тканей', 'узи', 4000, 8000],

  // ── МРТ (MRI) ──
  ['МРТ головного мозга', 'мрт', 18000, 40000],
  ['МРТ позвоночника (шейный отдел)', 'мрт', 18000, 38000],
  ['МРТ позвоночника (грудной отдел)', 'мрт', 18000, 38000],
  ['МРТ позвоночника (поясничный отдел)', 'мрт', 18000, 40000],
  ['МРТ коленного сустава', 'мрт', 18000, 35000],
  ['МРТ тазобедренного сустава', 'мрт', 18000, 38000],
  ['МРТ плечевого сустава', 'мрт', 18000, 35000],
  ['МРТ органов брюшной полости', 'мрт', 22000, 45000],
  ['МРТ органов малого таза', 'мрт', 22000, 45000],
  ['МРТ сосудов головного мозга (МР-ангиография)', 'мрт', 20000, 42000],
  ['МРТ мягких тканей', 'мрт', 18000, 35000],
  ['МРТ височно-нижнечелюстного сустава', 'мрт', 18000, 35000],
  ['МРТ всего позвоночника', 'мрт', 35000, 75000],

  // ── КТ (CT Scan) ──
  ['КТ головного мозга', 'кт', 12000, 28000],
  ['КТ грудной клетки (легких)', 'кт', 12000, 30000],
  ['КТ органов брюшной полости', 'кт', 15000, 32000],
  ['КТ позвоночника', 'кт', 14000, 30000],
  ['КТ придаточных пазух носа', 'кт', 10000, 22000],
  ['КТ почек и надпочечников', 'кт', 14000, 30000],
  ['КТ коленного сустава', 'кт', 12000, 25000],
  ['КТ тазобедренного сустава', 'кт', 13000, 28000],
  ['КТ сосудов (КТ-ангиография)', 'кт', 20000, 45000],
  ['КТ челюсти (КЛКТ, 3D)', 'кт', 8000, 18000],
  ['КТ височных костей', 'кт', 12000, 25000],

  // ── Прием врача (Doctor Visits) ──
  ['Прием терапевта', 'прием_врача', 5000, 10000],
  ['Прием кардиолога', 'прием_врача', 6000, 13000],
  ['Прием невролога', 'прием_врача', 6000, 13000],
  ['Прием гинеколога', 'прием_врача', 5500, 12000],
  ['Прием уролога', 'прием_врача', 6000, 13000],
  ['Прием эндокринолога', 'прием_врача', 6000, 13000],
  ['Прием офтальмолога', 'прием_врача', 5000, 11000],
  ['Прием оториноларинголога (ЛОР)', 'прием_врача', 5500, 12000],
  ['Прием дерматолога', 'прием_врача', 5500, 12000],
  ['Прием гастроэнтеролога', 'прием_врача', 6000, 13000],
  ['Прием ортопеда-травматолога', 'прием_врача', 6000, 13000],
  ['Прием пульмонолога', 'прием_врача', 6000, 12000],
  ['Прием аллерголога', 'прием_врача', 6000, 13000],
  ['Прием ревматолога', 'прием_врача', 7000, 14000],
  ['Прием педиатра', 'прием_врача', 5000, 10000],
  ['Прием хирурга', 'прием_врача', 6000, 13000],
  ['Прием онколога', 'прием_врача', 7000, 15000],
  ['Прием маммолога', 'прием_врача', 6000, 13000],
  ['Прием проктолога', 'прием_врача', 6500, 13000],
  ['Прием нефролога', 'прием_врача', 7000, 14000],

  // ── Диагностика (Diagnostics) ──
  ['ЭКГ (электрокардиограмма)', 'диагностика', 3000, 6000],
  ['Рентген грудной клетки', 'диагностика', 3000, 7000],
  ['Рентген позвоночника', 'диагностика', 3500, 7500],
  ['Рентген суставов', 'диагностика', 3000, 7000],
  ['Флюорография', 'диагностика', 2000, 4500],
  ['Маммография', 'диагностика', 5000, 10000],
  ['Холтер-мониторинг (суточный ЭКГ)', 'диагностика', 7000, 15000],
  ['СМАД (суточное мониторирование АД)', 'диагностика', 6000, 12000],
  ['Спирография (ФВД)', 'диагностика', 3500, 7000],
  ['Колоноскопия', 'диагностика', 15000, 35000],
  ['Гастроскопия (ФГДС)', 'диагностика', 12000, 28000],
  ['ЭЭГ (электроэнцефалография)', 'диагностика', 5000, 10000],
  ['Денситометрия (костная)', 'диагностика', 5000, 12000],
  ['Кольпоскопия', 'диагностика', 4500, 8000],
  ['Тредмил-тест (ЭКГ с нагрузкой)', 'диагностика', 7000, 14000],

  // ── Стоматология (Dentistry) ──
  ['Консультация стоматолога', 'стоматология', 2000, 5000],
  ['Профессиональная чистка зубов (ультразвук + Air Flow)', 'стоматология', 10000, 25000],
  ['Лечение кариеса (пломба, светоотверждаемая)', 'стоматология', 8000, 18000],
  ['Удаление зуба (простое)', 'стоматология', 5000, 12000],
  ['Удаление зуба мудрости (сложное)', 'стоматология', 12000, 30000],
  ['Установка коронки (металлокерамика)', 'стоматология', 25000, 55000],
  ['Установка коронки (цирконий)', 'стоматология', 45000, 90000],
  ['Виниры (за 1 зуб)', 'стоматология', 35000, 80000],
  ['Отбеливание зубов', 'стоматология', 25000, 55000],
  ['Имплантация зуба (имплант + работа)', 'стоматология', 120000, 250000],
  ['Панорамный снимок (ОПТГ)', 'стоматология', 3000, 6000],
  ['Лечение пульпита (1 канал)', 'стоматология', 12000, 25000],
  ['Установка брекетов (1 челюсть)', 'стоматология', 80000, 180000],
  ['Реставрация зуба', 'стоматология', 10000, 22000],
  ['Фторирование зубов', 'стоматология', 3000, 7000],

  // ── Лаборатория (Laboratory — specialized tests) ──
  ['ПЦР-тест на COVID-19', 'лаборатория', 3000, 7000],
  ['ПЦР на ИППП (комплекс 12)', 'лаборатория', 8000, 15000],
  ['Бакпосев мочи с антибиотикограммой', 'лаборатория', 3500, 7000],
  ['Бакпосев из зева/носа', 'лаборатория', 3000, 6000],
  ['Мазок на флору (гинекологический)', 'лаборатория', 2000, 4500],
  ['Цитологическое исследование (Пап-тест)', 'лаборатория', 3000, 6000],
  ['Спермограмма', 'лаборатория', 5000, 10000],
  ['Анализ кала на скрытую кровь', 'лаборатория', 2500, 5000],
  ['Копрограмма', 'лаборатория', 2000, 4500],
  ['Анализ на Helicobacter pylori (кровь)', 'лаборатория', 3500, 6500],
  ['Гистологическое исследование', 'лаборатория', 5000, 12000],
  ['Иммунограмма', 'лаборатория', 8000, 18000],
  ['Анализ на онкомаркеры (CA-125)', 'лаборатория', 4000, 7500],
  ['Анализ на онкомаркеры (CEA)', 'лаборатория', 4000, 7500],
  ['Анализ на онкомаркеры (AFP)', 'лаборатория', 4000, 7500],
];

// ─── End Helpers ────────────────────────────────────────────────────────────────

// ─── Main Seed ──────────────────────────────────────────────────────────────────

   // console.log('🗑️  Clearing existing data...');
  await prisma.service.deleteMany();
  await prisma.clinic.deleteMany();

   // console.log('🏥 Seeding clinics...');
  const createdClinics = await Promise.all(
    clinics.map((c) =>
      prisma.clinic.create({
        data: {
          name: c.name,
          address: c.address,
          city: c.city,
          lat: c.lat,
          lng: c.lng,
          phone: c.phone,
          website: c.website,
          rating: c.rating,
          reviewCount: c.reviewCount,
          workHours: c.workHours,
        },
      }),
    ),
  );

   // console.log(`✅ Created ${createdClinics.length} clinics`);

   // console.log('💊 Seeding services...');
  let totalServices = 0;

  for (const clinic of createdClinics) {
    const allowedCategories = getCategoriesForClinic(clinic.name);
    const [minCount, maxCount] = getServiceCountRange(clinic.name);

    // Filter templates to allowed categories
    const availableTemplates = serviceTemplates.filter((t) =>
      allowedCategories.includes(t[1]),
    );

    // Pick a random subset
    const selectedTemplates = pickRandom(availableTemplates, minCount, maxCount);

    const serviceData = selectedTemplates.map(([title, category, priceMin, priceMax]) => {
      const price = randPrice(priceMin, priceMax);
      const oldPrice = maybeOldPrice(price);
      return {
        title,
        category,
        price,
        oldPrice,
        clinicId: clinic.id,
      };
    });

    await prisma.service.createMany({ data: serviceData });
    totalServices += serviceData.length;
  }

   // console.log(`✅ Created ${totalServices} services across ${createdClinics.length} clinics`);

  // Print summary by category
  const categoryCounts = await prisma.service.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

   // console.log('\n📊 Services by category:');
  for (const cat of categoryCounts) {
     // console.log(`   ${cat.category}: ${cat._count.id}`);
  }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
