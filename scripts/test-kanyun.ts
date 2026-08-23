import fs from "node:fs";
import path from "node:path";
import { streamChat } from "../lib/llm";

async function main() {
  const system = fs.readFileSync(
    path.join(process.cwd(), "lib/prompts/kanYun.md"),
    "utf-8"
  );

  const profile = {
    year: "己巳",
    month: "丁丑",
    day: "庚辰",
    hour: "壬午",
    dayMaster: { gan: "庚", zhi: "辰", wuxing: "金" },
    genderLabel: "元男",
  };

  const yearlyFlow = {
    year: 2026,
    ganZhi: "丙午",
    shiShen: "七杀",
    naYin: "天河水",
  };

  const toolContext = `
用户主命盘：
- 四柱：${profile.year} / ${profile.month} / ${profile.day} / ${profile.hour}
- 日主：${profile.dayMaster.gan}${profile.dayMaster.zhi}（${profile.dayMaster.wuxing}）
- 性别：${profile.genderLabel}

${yearlyFlow.year} 年流年数据：
- 干支：${yearlyFlow.ganZhi}
- 十神：${yearlyFlow.shiShen}
- 纳音：${yearlyFlow.naYin}
`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: toolContext + "\n\n请分析一下我今年的年度运势。" },
  ];

  process.stdout.write("元见：");
  for await (const chunk of streamChat(messages, { temperature: 0.7 })) {
    process.stdout.write(chunk.content);
  }
  process.stdout.write("\n");
}

main();
