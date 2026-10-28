"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, MailCheck } from "lucide-react";
import { useState } from "react";
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

export function EmailSignIn({ next }: { next?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;
    const redirectTo = isSafeNext(next) ? `${callback}?next=${encodeURIComponent(next)}` : callback;
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setFormError(
        /rate|security|too many/i.test(error.message)
          ? "Terlalu sering. Tunggu sebentar lalu coba lagi."
          : "Gagal mengirim tautan. Coba lagi.",
      );
      return;
    }
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Tautan masuk terkirim ke <strong>{sentTo}</strong>. Buka email lalu ketuk tautannya.
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => setSentTo(null)}
        >
          Ganti email
        </Button>
      </div>
    );
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
