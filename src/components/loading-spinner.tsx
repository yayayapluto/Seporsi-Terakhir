import { Spinner } from "@/components/spinner";

/** ponytail: satu fallback global; centered + label. */
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-[#64746B] max-md:min-h-0">
      <Spinner className="size-5" />
      <span>Loading...</span>
    </div>
  );
}
