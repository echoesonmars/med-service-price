-- Add iTeka online pharmacies for major cities
INSERT INTO clinics (id, name, address, website, city, lat, lng) VALUES
  (gen_random_uuid()::text, 'iTeka Аптеки', 'Онлайн аптека iTeka, Алматы', 'https://i-teka.kz/almaty/medicamentsalphabetically', 'Алматы', 43.2220, 76.8512),
  (gen_random_uuid()::text, 'iTeka Аптеки', 'Онлайн аптека iTeka, Астана', 'https://i-teka.kz/astana/medicamentsalphabetically', 'Астана', 51.1694, 71.4491),
  (gen_random_uuid()::text, 'iTeka Аптеки', 'Онлайн аптека iTeka, Шымкент', 'https://i-teka.kz/shymkent/medicamentsalphabetically', 'Шымкент', 42.3417, 69.5901),
  (gen_random_uuid()::text, 'iTeka Аптеки', 'Онлайн аптека iTeka, Караганда', 'https://i-teka.kz/karaganda/medicamentsalphabetically', 'Караганда', 49.8047, 73.1094),
  (gen_random_uuid()::text, 'iTeka Аптеки', 'Онлайн аптека iTeka, Актобе', 'https://i-teka.kz/aktobe/medicamentsalphabetically', 'Актобе', 50.2797, 57.2070);
