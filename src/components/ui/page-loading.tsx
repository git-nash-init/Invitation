import { LogoMark } from "@/components/site/logo";
import { Spinner } from "@/components/ui/spinner";

/** What a page shows while the server is still fetching its data. */
export function PageLoading({ label = "Loading", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`grid place-items-center px-6 text-center ${fullScreen ? "paper-bg min-h-screen" : "min-h-[50vh]"}`}
    >
      <div className="grid justify-items-center gap-4">
        <LogoMark size={44} className="animate-pulse motion-reduce:animate-none" />
        <p className="flex items-center gap-2.5 text-[15px] text-text-2">
          <Spinner size={16} />
          {label}
        </p>
      </div>
    </div>
  );
}

/** A cover shown on top of an iframe until the page inside it has loaded. */
export function FrameLoading({
  visible,
  label = "Opening your invitation",
  fixed = false,
}: {
  visible: boolean;
  label?: string;
  fixed?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 z-10 grid place-items-center bg-[#fff8ee] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {visible && (
        <div className="grid justify-items-center gap-4 text-center">
          <LogoMark size={48} className="animate-pulse motion-reduce:animate-none" />
          <p className="flex items-center gap-2.5 text-[15px] text-[#6b0f2b]">
            <Spinner size={16} />
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
