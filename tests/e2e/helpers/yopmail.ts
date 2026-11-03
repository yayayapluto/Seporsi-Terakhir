/** Poll inbox Yopmail via fetch, kembalikan magic-link Supabase pertama. */
export async function getMagicLink(
  localPart: string,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<string> {
  const timeoutMs = opts?.timeoutMs ?? 90_000;
  const intervalMs = opts?.intervalMs ?? 5_000;
  const linkRe =
    /https?:\/\/[^\s"']*(supabase\.co[^\s"']*verify[^\s"']*|\/auth\/callback[^\s"']*|\/auth\/v1\/verify[^\s"']*)/;
  const deadline = Date.now() + timeoutMs;
  let lastBody = "";
  for (;;) {
    const res = await fetch(
      `https://yopmail.com/en/inbox?login=${encodeURIComponent(localPart)}&p=1&d=&ctrl=`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://yopmail.com/en/",
        },
        redirect: "follow",
      },
    );
    lastBody = await res.text();
    if (!res.ok || lastBody.length < 500) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    const m = lastBody.match(linkRe);
    if (m) return m[0].replaceAll("&amp;", "&");
    if (Date.now() > deadline) break;
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, intervalMs);
    await promise;
  }
  throw new Error(`magic-link tidak tiba untuk ${localPart}: ${lastBody.slice(-500)}`);
}
