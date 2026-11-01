import { OTPInput, OTPInputContext } from "input-otp";
import * as React from "react";
import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex w-full items-center justify-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex w-full max-w-[240px] items-center gap-2 sm:max-w-[260px]", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "flex aspect-square flex-1 items-center justify-center rounded-[14px] border border-line bg-white text-lg font-extrabold text-[#1C2826] tabular-nums shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-colors data-[active=true]:border-[#2E7D4F] data-[active=true]:ring-2 data-[active=true]:ring-[#2E7D4F]/30",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && <div className="pointer-events-none h-5 w-px animate-pulse bg-[#1C2826]" />}
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot };
