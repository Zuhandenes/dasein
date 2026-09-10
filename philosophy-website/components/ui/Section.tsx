import { clsx } from "@/lib/clsx";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function Section({
  id,
  children,
  className,
  tone = "paper",
  size = "default",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "paper-2";
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <section
      id={id}
      className={clsx(
        "py-16 sm:py-24 scroll-mt-20",
        tone === "paper-2" && "bg-paper-2",
        className,
      )}
    >
      <Container size={size}>
        <Reveal>{children}</Reveal>
      </Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow?: string;
  title: string;
  className?: string;
}) {
  return (
    <header className={clsx("mb-10 sm:mb-14", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl text-balance">{title}</h2>
    </header>
  );
}
