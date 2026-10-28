"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSafeNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email tidak valid."),
});

type Values = z.infer<typeof schema>;

const RESEND_COOLDOWN_S = 30;

function SentState({
  email,
  onChangeEmail,
  sendLink,
}: {
  email: string;
  onChangeEmail: () => void;
  sendLink: (email: string) => Promise<void>;
}) {
  const [resendError, setResendError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (sending || cooldown > 0) return;
    setResendError(null);
    setResent(false);
    setSending(true);
    try {
      await sendLink(email);
      setResent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Gagal mengirim ulang. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          Tautan masuk terkirim ke <strong>{email}</strong>. Buka email lalu ketuk tautannya.
        </span>
      </p>
      {resent && (
        <output className="text-sm font-medium text-primary">Tautan baru terkirim.</output>
      )}
      {resendError && (
        <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {resendError}
        </p>
      )}
      <Button
        type="button"
        disabled={sending || cooldown > 0}
        className="min-h-11 w-full"
        onClick={handleResend}
      >
        {sending ? "Mengirim…" : cooldown > 0 ? `Kirim ulang (${cooldown}d)` : "Kirim ulang"}
      </Button>
      <Button type="button" variant="outline" className="min-h-11 w-full" onClick={onChangeEmail}>
        Ganti email
      </Button>
    </div>
  );
}
export function EmailSignIn({ next }: { next?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function sendLink(email: string) {
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;
    const redirectTo = isSafeNext(next) ? `${callback}?next=${encodeURIComponent(next)}` : callback;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      throw new Error(
        /rate|security|too many/i.test(error.message)
          ? "Terlalu sering. Tunggu sebentar lalu coba lagi."
          : "Gagal mengirim tautan. Coba lagi.",
      );
    }
  }

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await sendLink(values.email);
      setSentTo(values.email);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengirim tautan. Coba lagi.");
    }
  }

  if (sentTo) {
    return <SentState email={sentTo} onChangeEmail={() => setSentTo(null)} sendLink={sendLink} />;
  }

  const emailError = errors.email?.message;
  const describedBy = emailError ? "email-error" : formError ? "email-form-error" : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={describedBy}
          {...register("email")}
          className="min-h-11"
        />
        {emailError && (
          <p
            id="email-error"
            role="alert"
            className="flex items-start gap-1.5 text-sm font-medium text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {emailError}
          </p>
        )}
      </div>
      {formError && (
        <p
          id="email-form-error"
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full">
        {isSubmitting ? "Mengirim…" : "Kirim tautan masuk"}
      </Button>
    </form>
  );
}
