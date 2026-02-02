export const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Pulau Pinang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Putrajaya",
  "Labuan"
] as const;

export type MalaysiaState = (typeof MALAYSIA_STATES)[number];

export const MALAYSIA_DISTRICTS_BY_STATE = {
  Johor: [
    "Johor Bahru",
    "Iskandar Puteri",
    "Pasir Gudang",
    "Skudai",
    "Kulai",
    "Pontian",
    "Kota Tinggi",
    "Batu Pahat",
    "Muar",
    "Tangkak",
    "Kluang",
    "Segamat",
    "Mersing"
  ],
  Kedah: [
    "Alor Setar",
    "Sungai Petani",
    "Kulim",
    "Langkawi",
    "Jitra",
    "Pendang",
    "Baling",
    "Yan",
    "Sik",
    "Padang Terap",
    "Bandar Baharu",
    "Kuala Muda",
    "Kubang Pasu",
    "Pokok Sena"
  ],
  Kelantan: [
    "Kota Bharu",
    "Pasir Mas",
    "Tumpat",
    "Bachok",
    "Pasir Puteh",
    "Machang",
    "Tanah Merah",
    "Kuala Krai",
    "Gua Musang",
    "Jeli",
    "Lojing"
  ],
  Melaka: ["Ayer Keroh", "Melaka Tengah", "Alor Gajah", "Jasin"],
  "Negeri Sembilan": [
    "Seremban",
    "Senawang",
    "Nilai",
    "Port Dickson",
    "Rembau",
    "Kuala Pilah",
    "Tampin",
    "Jelebu",
    "Jempol",
    "Bahau"
  ],
  Pahang: [
    "Kuantan",
    "Bentong",
    "Temerloh",
    "Pekan",
    "Raub",
    "Cameron Highlands",
    "Jerantut",
    "Lipis",
    "Rompin",
    "Maran",
    "Bera"
  ],
  "Pulau Pinang": [
    "George Town",
    "Bayan Lepas",
    "Gelugor",
    "Air Itam",
    "Tanjung Tokong",
    "Batu Ferringhi",
    "Balik Pulau",
    "Butterworth",
    "Bukit Mertajam",
    "Seberang Perai"
  ],
  Perak: [
    "Ipoh",
    "Batu Gajah",
    "Kampar",
    "Taiping",
    "Manjung",
    "Sitiawan",
    "Lumut",
    "Teluk Intan",
    "Kuala Kangsar",
    "Seri Iskandar",
    "Parit Buntar",
    "Tapah",
    "Gerik"
  ],
  Perlis: ["Kangar", "Arau", "Kuala Perlis", "Padang Besar"],
  Sabah: [
    "Kota Kinabalu",
    "Penampang",
    "Tuaran",
    "Papar",
    "Ranau",
    "Kota Belud",
    "Kudat",
    "Beaufort",
    "Keningau",
    "Sandakan",
    "Lahad Datu",
    "Tawau",
    "Semporna"
  ],
  Sarawak: [
    "Kuching",
    "Kota Samarahan",
    "Serian",
    "Sri Aman",
    "Sarikei",
    "Sibu",
    "Mukah",
    "Kapit",
    "Bintulu",
    "Miri",
    "Limbang"
  ],
  Selangor: [
    "Shah Alam",
    "Petaling Jaya",
    "Damansara",
    "Subang Jaya",
    "Puchong",
    "Klang",
    "Kajang",
    "Bangi",
    "Ampang",
    "Cheras",
    "Rawang",
    "Cyberjaya",
    "Sepang",
    "Banting",
    "Kuala Selangor",
    "Hulu Selangor",
    "Sabak Bernam"
  ],
  Terengganu: [
    "Kuala Terengganu",
    "Kuala Nerus",
    "Kemaman",
    "Dungun",
    "Besut",
    "Marang",
    "Setiu",
    "Hulu Terengganu"
  ],
  "Kuala Lumpur": [
    "Kuala Lumpur",
    "KLCC",
    "Bangsar",
    "Bangsar South",
    "Bukit Bintang",
    "Cheras",
    "Setapak",
    "Mont Kiara",
    "Kepong",
    "Sentul",
    "Wangsa Maju",
    "Seputeh",
    "Brickfields",
    "Sri Petaling"
  ],
  Putrajaya: ["Putrajaya"],
  Labuan: ["Labuan"]
} as const satisfies Record<MalaysiaState, readonly string[]>;

export const malaysiaDistrictsForState = (state?: MalaysiaState) =>
  state ? [...MALAYSIA_DISTRICTS_BY_STATE[state]] : [];

export function formatMalaysiaLocation(state: MalaysiaState, district: string) {
  const normalizedDistrict = district.trim();
  if (!normalizedDistrict || normalizedDistrict === state) {
    return state;
  }
  return `${normalizedDistrict}, ${state}`;
}
