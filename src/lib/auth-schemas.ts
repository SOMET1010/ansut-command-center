import { z } from "zod";

/**
 * Schémas Zod partagés pour les formulaires d'authentification.
 * Messages courts, en français, compréhensibles par l'utilisateur final.
 */

const email = z
  .string({ required_error: "L'e-mail est obligatoire." })
  .trim()
  .min(1, "L'e-mail est obligatoire.")
  .email("Format d'e-mail invalide.")
  .max(255, "L'e-mail ne peut pas dépasser 255 caractères.");

const passwordLogin = z
  .string({ required_error: "Le mot de passe est obligatoire." })
  .min(1, "Le mot de passe est obligatoire.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");

const passwordStrong = z
  .string({ required_error: "Le mot de passe est obligatoire." })
  .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");

const fullName = z
  .string({ required_error: "Le nom complet est obligatoire." })
  .trim()
  .min(2, "Le nom complet doit contenir au moins 2 caractères.")
  .max(100, "Le nom complet ne peut pas dépasser 100 caractères.");

export const loginSchema = z.object({
  email,
  password: passwordLogin,
});

export const signupSchema = z.object({
  fullName,
  email,
  password: passwordStrong,
});

export const resetPasswordSchema = z
  .object({
    password: passwordStrong,
    confirm: z.string().min(1, "La confirmation est obligatoire."),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Normalise une ZodError en map { champ: premier message }.
 */
export function zodFieldErrors<T extends z.ZodTypeAny>(
  err: z.ZodError<z.infer<T>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
