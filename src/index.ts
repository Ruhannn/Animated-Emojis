import pLimit from "p-limit";
import { SingleBar, Presets } from "cli-progress";
import ora from "ora";
import { extname, join } from "path";
import { axiosR, emojiToCodePoint } from "./utils";
import type { S } from "./types";

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("Error: set TOKEN env variable. Example: TOKEN=123:ABC");
  process.exit(1);
}

const SET_NAME = "AnimatedEmojies";
const OUT_DIR = "./emoji-with-code";
const CONCURRENCY = 6;

async function main() {
  const spinner = ora({
    text: `Fetching sticker set ${SET_NAME}...`,
    hideCursor: false,
  }).start();

  const metadataRes = await axiosR({
    method: "get",
    url: `https://api.telegram.org/bot${TOKEN}/getStickerSet`,
    params: { name: SET_NAME },
    timeout: 30000,
  });

  if (!metadataRes?.data?.result) {
    spinner.fail("Failed to fetch sticker set metadata.");
    console.error(metadataRes?.data || metadataRes);
    process.exit(1);
  }

  const stickers: S[] = metadataRes.data.result.stickers || [];
  const total = stickers.length;
  spinner.succeed(`Sticker set loaded — ${total} sticker(s) found.`);

  if (total === 0) {
    console.log("Nothing to download. Exiting.");
    return;
  }

  const progress = new SingleBar(
    {
      format:
        "Downloading |{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted} | {filename}",
    },
    Presets.shades_classic
  );
  progress.start(total, 0, { filename: "—" });

  const limit = pLimit(CONCURRENCY);
  let successCount = 0;
  const failed: any = [];

  const tasks = stickers.map((sticker) =>
    limit(async () => {
      const displayName = sticker.emoji;
      try {
        const fileInfoRes = await axiosR({
          method: "get",
          url: `https://api.telegram.org/bot${TOKEN}/getFile`,
          params: { file_id: sticker.file_id },
          timeout: 20000,
        });

        const filePath = fileInfoRes?.data?.result?.file_path;
        if (!filePath) throw new Error("file_path missing");

        const dlRes = await axiosR({
          method: "get",
          url: `https://api.telegram.org/file/bot${TOKEN}/${filePath}`,
          responseType: "arraybuffer",
          timeout: 60000,
        });

        const extension = extname(filePath);
        const fileName = emojiToCodePoint(sticker.emoji);
        const outPath = join(OUT_DIR, `${fileName}${extension}`);

        await Bun.write(outPath, dlRes.data);

        successCount++;
        progress.increment(1, { filename: `${fileName}${extension}` });
      } catch (err) {
        failed.push({
          emoji: sticker.emoji,
          id: sticker.file_id,
          error: (err as Error).message || String(err),
        });
        progress.increment(1, { filename: `failed:${displayName}` });
      }
    })
  );

  await Promise.all(tasks);
  progress.stop();

  console.log("\nSummary:");
  console.log(`  Total stickers: ${total}`);
  console.log(`  Successfully downloaded: ${successCount}`);
  console.log(`  Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailures (first 10):");
    for (const f of failed.slice(0, 10)) {
      console.log(
        `  - emoji: ${f.emoji ?? "—"}, file_id: ${f.id}, reason: ${f.error}`
      );
    }
    console.log(`\nSaved files are in ./${OUT_DIR}`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll done — saved files in ./${OUT_DIR}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
