import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { sleep } from "bun";

export const emojiToCodePoint = (emoji: string) => {
  return Array.from(
    emoji.indexOf(String.fromCharCode(0x200d)) < 0
      ? emoji.replace(/\uFE0F/g, "")
      : emoji
  )
    .map((char) => char.codePointAt(0)!.toString(16))
    .join("-");
};

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export async function axiosR(config: AxiosRequestConfig, retries = MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await axios(config);
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const wait = RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(wait + Math.floor(Math.random() * 200));
    }
  }
}
