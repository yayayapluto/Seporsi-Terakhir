"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resolveNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  confirm: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function EmailSignIn({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    if (mode === "up" && values.password !== (values.confirm ?? "")) {
      setFormError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    const supabase = createClient();
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword(values)
        : await supabase.auth.signUp({ email: values.email, password: values.password });
    if (error) {
      console.error("[masuk] sign-in gagal:", error.message);
      setFormError(
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : `Gagal (${error.message}). Coba lagi.`,
      );
      return;
    }
    router.push(resolveNext(next, "/"));
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
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            {...register("password")}
            className="h-11 w-full rounded-lg border bg-card px-3 pr-11 text-sm"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {mode === "up" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="confirm" className="text-sm font-medium">
            Konfirmasi kata sandi
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirm")}
            className="h-11 w-full rounded-lg border bg-card px-3 text-sm"
          />
        </div>
      )}
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
