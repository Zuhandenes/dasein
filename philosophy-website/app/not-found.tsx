import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <div className="py-24">
      <Container size="narrow">
        <h1 className="text-3xl">Страница не найдена</h1>
        <p className="mt-4 text-muted">
          Возможно, ссылка устарела.{" "}
          <Link href="/" className="text-accent hover:underline">
            Вернуться на главную
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}
