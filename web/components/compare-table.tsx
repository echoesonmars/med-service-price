"use client";

import { useState, useEffect } from "react";
import { ServiceItem } from "@/types/search";
import { FaTimes, FaCheck, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "motion/react";

interface CompareTableProps {
  services: ServiceItem[];
  onClose: () => void;
}

export function CompareTable({ services, onClose }: CompareTableProps) {
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    // Group by service name and take up to 5 best offers
    const grouped = new Map<string, ServiceItem[]>();
    
    services.forEach(service => {
      const key = service.title.toLowerCase().trim();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(service);
    });

    // Take first group and sort by price
    const firstGroup = Array.from(grouped.values())[0] || [];
    const sorted = firstGroup
      .sort((a, b) => (a.priceRaw || 0) - (b.priceRaw || 0))
      .slice(0, 5);
    
    setSelectedServices(sorted);
  }, [services]);

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  if (selectedServices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...selectedServices.map(s => s.priceRaw || Infinity));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              Сравнение цен
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedServices[0]?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-heading font-bold text-foreground min-w-[180px] sticky left-0 bg-gray-50">
                  Параметр
                </th>
                {selectedServices.map((service, index) => (
                  <th
                    key={index}
                    className="px-4 py-4 text-center min-w-[200px] relative"
                  >
                    <button
                      onClick={() => removeService(index)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-muted-foreground transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                    <div className="text-sm font-heading font-bold text-foreground">
                      Предложение {index + 1}
                    </div>
                    {service.priceRaw === minPrice && (
                      <div className="mt-1 inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                        <FaCheck className="text-[8px]" />
                        Лучшая цена
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Clinic Name */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Клиника
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="font-heading font-bold text-foreground text-sm">
                      {service.clinic}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Цена
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="space-y-1">
                      <div className="font-didact font-extrabold text-2xl text-foreground">
                        {service.price}
                      </div>
                      {service.oldPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          {service.oldPrice}
                        </div>
                      )}
                      {service.oldPriceRaw && service.priceRaw && service.oldPriceRaw > service.priceRaw && (
                        <div className="text-xs text-green-600 font-bold">
                          Скидка {Math.round((1 - service.priceRaw / service.oldPriceRaw) * 100)}%
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Рейтинг
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <FaStar className="text-amber-500 text-sm" />
                      <span className="font-heading font-bold text-foreground">
                        {service.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({service.reviewsCount.replace(" отзывов", "").replace(" отзыва", "")})
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Address */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Адрес
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4">
                    <div className="text-sm text-foreground text-center">
                      {service.address}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Metro */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Метро
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm font-heading font-semibold text-foreground">
                        {service.metro}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Distance */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Расстояние
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                      <FaMapMarkerAlt className="text-xs" />
                      <span>{service.distance}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Work Hours */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Режим работы
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <div className="text-sm text-foreground">
                      {service.workHours || "—"}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Badge */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-white">
                  Категория
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <span className="inline-block text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent-foreground">
                      {service.badge}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Action Buttons */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm font-heading font-semibold text-muted-foreground sticky left-0 bg-gray-50">
                  
                </td>
                {selectedServices.map((service, index) => (
                  <td key={index} className="px-4 py-4 text-center">
                    <button className="w-full px-4 py-2.5 bg-accent text-white rounded-xl font-heading font-bold text-sm hover:bg-accent/90 transition-colors shadow-sm">
                      Записаться
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-xs text-muted-foreground text-center">
            Цены указаны на {new Date().toLocaleDateString("ru-RU", { 
              day: "2-digit", 
              month: "long", 
              year: "numeric" 
            })}. Актуальность цен уточняйте в клиниках.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
