import { z } from "zod";
import { services } from "@/content/services";

const bookableSlugs = services.filter((s) => s.bookable).map((s) => s.slug) as [
  string,
  ...string[],
];

export const bookingInputSchema = z.object({
  serviceSlug: z.enum(bookableSlugs),
  /** ISO-строка начала слота (UTC) */
  startsAt: z.string().datetime(),
  name: z.string().trim().min(2, "Укажите имя").max(120),
  email: z.string().trim().email("Проверьте email").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  telegram: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const availabilityQuerySchema = z.object({
  service: z.enum(bookableSlugs),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
