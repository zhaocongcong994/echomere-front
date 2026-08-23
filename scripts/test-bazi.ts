import { getBaziProfile, getYearlyFlow } from "../lib/bazi";

const birth = new Date("1990-01-15T12:30:00+08:00");
const profile = getBaziProfile(birth, "male");

console.log("四柱:", `${profile.year} / ${profile.month} / ${profile.day} / ${profile.hour}`);
console.log("日主:", `${profile.dayMaster.gan}${profile.dayMaster.zhi} (${profile.dayMaster.wuxing})`);
console.log("性别:", profile.genderLabel);
console.log("五行:", profile.wuxing);
console.log("十神干:", profile.shishen.gan);
console.log("十神支:", profile.shishen.zhi);
console.log("纳音:", profile.nayin);

const flow = getYearlyFlow(profile, 2026);
console.log("\n2026 流年:", flow.ganZhi, flow.shiShen, flow.naYin);
