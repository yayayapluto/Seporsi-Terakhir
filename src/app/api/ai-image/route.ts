import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import {
  AI_IMAGE_DAILY_QUOTA,
  AI_IMAGE_DEFAULT_MODEL,
  AI_IMAGE_ENABLED,
  AI_IMAGE_MODELS,
  AI_IMAGE_SIZE,
  buildMenuPrompt,
  buildPlaceholderSvg,
  buildPollinationsUrl,
  HF_MODEL_IDS,
  hashPrompt,
  isRetriableStatus,
} from "@/lib/domain/ai-image";
import { BUCKET_BY_KIND } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const Body = z.object({
  menuName: z.string().min(1).max(80),
  model: z.enum(AI_IMAGE_MODELS).default(AI_IMAGE_DEFAULT_MODEL),
});

type NodeResult =
  | { ok: true; bytes: ArrayBuffer; contentType: string }
  | { ok: false; retryable: boolean };

// Gate Pollinations: >=16 detik antar panggilan; antrian maks 2 penunggu.
const POLLINATIONS_GAP_MS = 16_000;
let lastPollinationsAt = 0;
let pollinationsWaiters = 0;

async function pollinationsGate(): Promise<boolean> {
  const now = Date.now();
  const wait = Math.max(0, POLLINATIONS_GAP_MS - (now - lastPollinationsAt));
  if (wait === 0) return true;
  if (pollinationsWaiters >= 2) return false;
  pollinationsWaiters++;
  try {
    await new Promise((r) => setTimeout(r, wait));
    lastPollinationsAt = Date.now();
    return true;
  } finally {
    pollinationsWaiters--;
  }
}

// Circuit breaker in-memory: 5 gagal beruntun dalam 10 menit -> cooldown 10 mnt.
const breaker = new Map<string, { fails: number; coolingUntil: number }>();

function breakerOpen(provider: string): boolean {
  const b = breaker.get(provider);
  if (!b) return false;
  if (b.coolingUntil > Date.now()) return true;
  if (b.coolingUntil > 0 && b.coolingUntil <= Date.now()) {
    b.coolingUntil = 0;
    b.fails = 0;
  }
  return false;
}

function breakerFail(provider: string) {
  const b = breaker.get(provider) ?? { fails: 0, coolingUntil: 0 };
  b.fails++;
  if (b.fails >= 5) b.coolingUntil = Date.now() + 10 * 60_000;
  breaker.set(provider, b);
}

function breakerOk(provider: string) {
  breaker.delete(provider);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tryHuggingFace(
  prompt: string,
  model: keyof typeof HF_MODEL_IDS,
): Promise<NodeResult> {
  const token = process.env.HF_TOKEN;
  if (!token) return { ok: false, retryable: false };
  if (breakerOpen("hf")) return { ok: false, retryable: false };

  const modelId = HF_MODEL_IDS[model];
  const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 40_000);
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "image/*",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              width: AI_IMAGE_SIZE.w,
              height: AI_IMAGE_SIZE.h,
              num_inference_steps: model === "flux" ? 4 : 30,
              guidance_scale: 7.5,
            },
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch {
      breakerFail("hf");
      if (attempt >= 2) return { ok: false, retryable: true };
      await sleep(1_000);
      continue;
    }

    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.startsWith("image/")) {
      breakerOk("hf");
      return { ok: true, bytes: await res.arrayBuffer(), contentType: ct };
    }
    const bodyText = await res.text().catch(() => "");
    const status = res.status;
    // JSON error: rate_limit / estimated_time -> tunggu lalu coba lagi.
    const estimated = Number(/"estimated_time"\s*:\s*([0-9.]+)/.exec(bodyText)?.[1] ?? 0);
    const retryable = isRetriableStatus(status) || (status === 503 && estimated > 0);
    breakerFail("hf");
    if (!retryable || attempt >= 2) return { ok: false, retryable };
    await sleep(Math.min(Math.max(estimated * 1_000, 2_000), 12_000));
  }
  return { ok: false, retryable: true };
}

async function tryPollinations(prompt: string): Promise<NodeResult> {
  if (breakerOpen("pollinations")) return { ok: false, retryable: false };
  const allowed = await pollinationsGate();
  if (!allowed) return { ok: false, retryable: false };

  const url = buildPollinationsUrl(prompt, Math.floor(Math.random() * 1_000_000));
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25_000);
      try {
        res = await fetch(url, { signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
    } catch {
      breakerFail("pollinations");
      if (attempt >= 2) return { ok: false, retryable: true };
      await sleep(2_000);
      continue;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.startsWith("image/")) {
      breakerOk("pollinations");
      return { ok: true, bytes: await res.arrayBuffer(), contentType: ct };
    }
    if (res.status === 429 && attempt === 0) {
      await sleep(POLLINATIONS_GAP_MS);
      continue;
    }
    breakerFail("pollinations");
    const retryable = isRetriableStatus(res.status);
    if (!retryable || attempt >= 2) return { ok: false, retryable };
    await sleep(2_000);
  }
  return { ok: false, retryable: true };
}

export async function POST(req: Request) {
  if (!AI_IMAGE_ENABLED) {
    return NextResponse.json(
      { ok: false, error: "Fitur gambar AI sedang dinonaktifkan." },
      { status: 403 },
    );
  }
  const t0 = Date.now();
  const current = await requireRole("/tenant", "tenant");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Prompt tidak valid." }, { status: 400 });
  }
  const { menuName, model } = parsed.data;
  const prompt = buildMenuPrompt(menuName);
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", current.user.id)
    .maybeSingle();
  if (!tenant)
    return NextResponse.json({ ok: false, error: "Tenant tidak ditemukan." }, { status: 404 });
  const tenantId = tenant.id;
  const hash = hashPrompt(prompt, model);

  // 1. Cache.
  const { data: cached } = await supabase.rpc("get_cached_image", { p_hash: hash });
  if (typeof cached === "string" && cached) {
    return NextResponse.json({
      ok: true,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_BY_KIND.menu_photo}/${cached}`,
      provider: "cache",
      path: cached,
    });
  }

  // Kuota 3/hari/tenant.
  const { data: allowed, error: quotaErr } = await supabase.rpc("consume_ai_quota");
  if (quotaErr || allowed !== true) {
    return NextResponse.json(
      { ok: false, error: `Batas ${AI_IMAGE_DAILY_QUOTA} gambar AI per hari tercapai.` },
      { status: 429 },
    );
  }

  const tryProvider = async (
    name: string,
    fn: () => Promise<NodeResult>,
  ): Promise<{ provider: string; bytes: ArrayBuffer; contentType: string } | null> => {
    const r = await fn();
    if (r.ok) return { provider: name, bytes: r.bytes, contentType: r.contentType };
    return null;
  };

  let winner = await tryProvider("hf", () => tryHuggingFace(prompt, model));
  let provider = "hf";
  if (!winner) {
    winner = await tryProvider("pollinations", () => tryPollinations(prompt));
    provider = "pollinations";
  }

  if (winner) {
    try {
      const admin = await createAdminClient();
      const path = `${tenantId}/ai-${hash.slice(0, 8)}.jpg`;
      const ct =
        winner.contentType === "image/png"
          ? "image/png"
          : winner.contentType === "image/jpeg"
            ? "image/jpeg"
            : "image/jpeg";
      const { error: upErr } = await admin.storage
        .from(BUCKET_BY_KIND.menu_photo)
        .upload(path, winner.bytes, { contentType: ct, upsert: true });
      if (upErr) {
        // Bytes melebihi batas bucket = kegagalan node ini -> placeholder.
        throw upErr;
      }
      await supabase.rpc("save_cached_image", { p_hash: hash, p_path: path, p_model: model });
      console.log(
        JSON.stringify({
          ai_image: true,
          provider,
          ms: Date.now() - t0,
          result: "ok",
          model,
        }),
      );
      return NextResponse.json({
        ok: true,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_BY_KIND.menu_photo}/${path}`,
        provider,
        path,
      });
    } catch {
      // jatuh ke placeholder di bawah
    }
  }

  // 4. Placeholder — refund kuota, tidak ada biaya.
  await supabase.rpc("refund_ai_quota");
  console.log(
    JSON.stringify({
      ai_image: true,
      provider: "placeholder",
      ms: Date.now() - t0,
      result: "placeholder",
      model,
    }),
  );
  return NextResponse.json({
    ok: true,
    url: buildPlaceholderSvg(menuName),
    provider: "placeholder",
  });
}
