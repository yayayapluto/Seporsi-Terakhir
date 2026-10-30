/** Poll inbox Yopmail via fetch, kembalikan magic-link Supabase pertama. */
export async function getMagicLink(
  localPart: string,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<string> {
  const timeoutMs = opts?.timeoutMs ?? 90_000;
  const intervalMs = opts?.intervalMs ?? 5_000;
  const linkRe =
    /https?:\/\/[^\s"']*(supabase\.co[^\s"']*verify[^\s"']*|\/auth\/callback[^\s"']*)/;
  const deadline = Date.now() + timeoutMs;
  let lastBody = "";
  for (;;) {
    const res = await fetch(
      `https://yopmail.com/en/inbox?login=${encodeURIComponent(localPart)}`,
    );
    lastBody = await res.text();
    const m = lastBody.match(linkRe);
    if (m) return m[0].replaceAll("&amp;", "&");
    if (Date.now() > deadline) break;
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, intervalMs);
    await promise;
  }
  throw new Error(`magic-link tidak tiba untuk ${localPart}: ${lastBody.slice(-500)}`);
}
