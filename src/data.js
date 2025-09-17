export const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[“”"’,!?.:;()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const DAYS = {
  day1: [
    { korChunks: ["큰 저택이 있다"], eng: "There is a big mansion" },
    { korChunks: ["부엌 안에", "구멍이 있다"], eng: "There is a hole in the kitchen" },
    { korChunks: ["쥐 가족이", "거기에 산다"], eng: "A mouse family lives there" },
    { korChunks: ["그들은", "항상 배가 고프다"], eng: "They are always hungry" },
    { korChunks: ["고양이가", "부엌에 산다"], eng: "A cat lives in the kitchen" },
  ],
  day2: [
    { korChunks: ["그들은", "구멍 밖을", "본다"], eng: "They look outside the hole" },
    { korChunks: ["고양이는", "식탁 근처에서", "자고 있다"], eng: "The cat is asleep near the table" },
    { korChunks: ["오빠 쥐는", "조용히", "구멍 밖으로", "몰래 나온다"], eng: "Brother Mouse quietly sneaks out of the hole" },
  ],
  day3: [
    { korChunks: ["그는", "재빨리", "구멍 안으로", "달려간다"], eng: "He runs into the hole quickly" },
    { korChunks: ["그 저녁에,", "오빠 쥐와 여동생 쥐는", "가족에게", "무슨 일이 일어났는지", "말한다"], eng: "That evening, Brother Mouse and Sister Mouse tell the family what happened" },
  ],
  day4: [
    { korChunks: ["아빠 쥐는", "그의 서랍으로", "간다"], eng: "Daddy Mouse goes to his drawer" },
    { korChunks: ["그는", "긴 밧줄 하나를", "꺼낸다"], eng: "He gets a long rope" },
  ],
};

export const DAY_LIST = [
  { key: "day1", label: "Day 1" },
  { key: "day2", label: "Day 2" },
  { key: "day3", label: "Day 3" },
  { key: "day4", label: "Day 4" },
];
