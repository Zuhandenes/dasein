import Link from "next/link";
import { clsx } from "@/lib/clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-[#661f1f]",
  outline: "border border-line bg-transparent hover:border-ink hover:bg-paper-2",
  ghost: "text-accent hover:underline underline-offset-4 px-0 py-0",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link href={href} className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}
