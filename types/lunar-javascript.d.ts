declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYearInGanZhi(): string;
    getYearInGanZhiExact(): string;
    getYearInGanZhiByLiChun(): string;
    getYearGanByLiChun(): string;
    getYearZhiByLiChun(): string;
    getMonthInGanZhi(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getDayInGanZhiExact(): string;
    getTimeInGanZhi(): string;
    getDayGan(): string;
    getDayGanExact(): string;
    getDayZhi(): string;
    getDayZhiExact(): string;
    getBaZiShiShenGan(): string[];
    getBaZiShiShenZhi(): string[];
    getBaZiNaYin(): string[];
    getBaZiWuXing(): string[];
  }
}
