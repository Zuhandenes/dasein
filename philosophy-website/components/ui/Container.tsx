import { clsx } from "@/lib/clsx";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={clsx(
        "mx-auto w-full px-5 sm:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-5xl",
        size === "wide" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
