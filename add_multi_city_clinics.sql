-- Add KDL Olymp for multiple cities
INSERT INTO clinics (id, name, address, website, city, lat, lng) VALUES
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Алматы', 'https://www.kdlolymp.kz/pricelist/almaty', 'Алматы', 43.2220, 76.8512),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Астана', 'https://www.kdlolymp.kz/pricelist/astana', 'Астана', 51.1694, 71.4491),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Актау', 'https://www.kdlolymp.kz/pricelist/aktau', 'Актау', 43.6510, 51.1680),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Актобе', 'https://www.kdlolymp.kz/pricelist/aktobe', 'Актобе', 50.2797, 57.2070),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Атырау', 'https://www.kdlolymp.kz/pricelist/atyrau', 'Атырау', 47.1164, 51.8830),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Караганда', 'https://www.kdlolymp.kz/pricelist/karaganda', 'Караганда', 49.8047, 73.1094),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Костанай', 'https://www.kdlolymp.kz/pricelist/kostanay', 'Костанай', 53.2144, 63.6246),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Павлодар', 'https://www.kdlolymp.kz/pricelist/pavlodar', 'Павлодар', 52.2873, 76.9674),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Петропавловск', 'https://www.kdlolymp.kz/pricelist/petropavlovsk', 'Петропавловск', 54.8665, 69.1399),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Тараз', 'https://www.kdlolymp.kz/pricelist/taraz', 'Тараз', 42.9000, 71.3660),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Уральск', 'https://www.kdlolymp.kz/pricelist/uralsk', 'Уральск', 51.2333, 51.3667),
  (gen_random_uuid()::text, 'Диагностический центр «Олимп»', 'КДЛ Олимп, Усть-Каменогорск', 'https://www.kdlolymp.kz/pricelist/ust-kamenogorsk', 'Усть-Каменогорск', 49.9480, 82.6284);

-- Add Invitro for multiple cities
INSERT INTO clinics (id, name, address, website, city, lat, lng) VALUES
  (gen_random_uuid()::text, 'Лаборатория «Invitro»', 'Invitro, Алматы', 'https://invitro.kz/analizes/', 'Алматы', 43.2220, 76.8512),
  (gen_random_uuid()::text, 'Лаборатория «Invitro»', 'Invitro, Астана', 'https://invitro.kz/analizes/', 'Астана', 51.1694, 71.4491),
  (gen_random_uuid()::text, 'Лаборатория «Invitro»', 'Invitro, Караганда', 'https://invitro.kz/analizes/', 'Караганда', 49.8047, 73.1094),
  (gen_random_uuid()::text, 'Лаборатория «Invitro»', 'Invitro, Актобе', 'https://invitro.kz/analizes/', 'Актобе', 50.2797, 57.2070),
  (gen_random_uuid()::text, 'Лаборатория «Invitro»', 'Invitro, Шымкент', 'https://invitro.kz/analizes/', 'Шымкент', 42.3417, 69.5901);
