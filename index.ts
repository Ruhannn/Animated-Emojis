import { gemoji } from "gemoji";
import { copyFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const FOLDER = "./emoji";

const emojiToCodePoint = (emoji: string) => {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16))
    .join("-");
};

const getEmojiCode = (catagory: string, emojiName: string) => {
  const formatEmojiName = emojiName.toLowerCase();
  for (const e of gemoji) {
    if (catagory === e.category && formatEmojiName === e.description) {
      const emoji = e.emoji;
      const codePoint = emojiToCodePoint(
        emoji.indexOf(String.fromCharCode(0x200d)) < 0
          ? emoji.replace(/\uFE0F/g, "")
          : emoji
      );

      return codePoint;
    }
  }
};

const main = async () => {
  const catagories = await readdir(FOLDER);
  Promise.all(
    catagories.map(async (catagory) => {
      const files = await readdir(`./emoji/${catagory}`);
      for (const file of files) {
        const emojiPath = join(FOLDER, catagory, file);
        const emojiCode = getEmojiCode(
          catagory,
          file.replace(extname(emojiPath), "")
        );
        await copyFile(
          emojiPath,
          join("./emoji-with-code", `${emojiCode}${extname(emojiPath)}`)
        );
        console.log(`done-${file}`);
      }
      console.log("donee lets goo");
    })
  );
};
main();
