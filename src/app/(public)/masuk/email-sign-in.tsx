"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

type Values = z.infer<typeof schema>;

export function EmailSignIn({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const supabase = createClient();
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword(values)
        : await supabase.auth.signUp(values);
    if (error) {
      setFormError(
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : "Gagal. Coba lagi.",
      );
      return;
    }
    router.push(next?.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          {...register("password")}
          className="h-11 rounded-lg border bg-card px-3 text-sm"
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-[#256640] disabled:opacity-70"
      >
        {isSubmitting ? "Memproses…" : mode === "in" ? "Masuk dengan Email" : "Daftar dengan Email"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setFormError(null);
        }}
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
      </button>
    </form>
  );
}
