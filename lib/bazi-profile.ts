export type PillarKey = "year" | "month" | "day" | "hour";

export interface FourPillar {
  stem: string;
  branch: string;
  tenGod?: string;
  hiddenStems: Array<{ stem: string; qiType: string; tenGod: string }>;
  naYin?: string;
  diShi?: string;
  shenSha: string[];
  kongWang: { isKong: boolean };
}

export interface BaziData {
  schemaVersion?: number;
  engine?: { name: string; version: string };
  input?: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    birthMinute: number;
    birthPlace?: string;
  };
  year: string;
  month: string;
  day: string;
  hour: string;
  dayMaster: { gan: string; zhi: string; wuxing: string };
  genderLabel: string;
  wuxing: Record<string, number>;
  lunarDate?: { year: string; month: string; day: string };
  bodyStrength?: string;
  xiYongShen?: { xi: string[]; ji: string[] };
  assessment?: { warning: string };
  chart?: {
    fourPillars: Record<PillarKey, FourPillar>;
    relations: Array<{ description: string }>;
    taiYuan?: string;
    mingGong?: string;
    trueSolarTimeInfo?: {
      originalTime?: string;
      trueSolarTime?: string;
      longitude?: number;
      correctionMinutes?: number;
    };
  };
  dayun?: {
    startAge: number;
    startAgeDetail: string;
    list: Array<{
      startYear: number;
      startAge: number;
      ganZhi: string;
      tenGod: string;
      branchTenGod?: string;
      naYin?: string;
      diShi?: string;
      shenSha?: string[];
      hiddenStems?: Array<{ stem: string; tenGod: string }>;
      liunianList?: Array<{ year: number; ganZhi: string; tenGod: string }>;
    }>;
  };
}

export interface ProfileRecord {
  id: string;
  name: string | null;
  gender: string;
  birthDateTime: string;
  birthLocation?: string | null;
  isPrimary: boolean;
  baziPillar: string;
  type: string;
  bazi?: BaziData;
}

export function parseBazi(profile: ProfileRecord): BaziData | null {
  if (profile.bazi) return profile.bazi;
  try {
    return JSON.parse(profile.baziPillar) as BaziData;
  } catch {
    return null;
  }
}

export function getCurrentDayun(bazi: BaziData, year = new Date().getFullYear()) {
  const list = bazi.dayun?.list ?? [];
  return [...list].reverse().find((item) => item.startYear <= year) ?? list[0];
}
