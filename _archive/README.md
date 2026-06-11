# Auth sécurisée Supabase (mise de côté)

Code complet de la connexion par lien magique + page admin pour gérer les emails autorisés + middleware de protection des routes.

Mis de côté temporairement le 10 juin 2026 le temps de configurer un service SMTP (Resend) pour les emails et de finaliser les tests.

## Contenu

- `middleware.ts` → à remettre à la racine du projet
- `admin/` → à remettre dans `app/admin/`
- `auth/` → à remettre dans `app/auth/` (contient `callback/route.ts`)

## Comment réactiver

1. Déplacer les fichiers :
   ```bash
   mv _archive/middleware.ts ./middleware.ts
   mv _archive/admin app/admin
   mv _archive/auth app/auth
   ```

2. Remplacer le contenu de :
   - `lib/auth.ts` (remettre l'ancienne version avec seulement le SESSION_COOKIE)
   - `app/login/page.tsx` (version avec OTP step email/code)
   - `app/login/actions.ts` (version avec sendCode/verifyCode)
   - `app/page.tsx` (vérification via Supabase au lieu du cookie)
   - `app/dashboard/page.tsx` (vérification via Supabase + bouton Admin)

   Toutes ces versions sont récupérables dans l'historique git, commits :
   - `03eaeff` Authentification sécurisée par OTP email + rôles admin/RH + page admin
   - `f092670` Changement email admin initial
   - `9ecdd5e` Support du lien magique : route /auth/callback + UI clarifiée

3. Configurer un SMTP custom dans Supabase (Resend recommandé) pour ne plus être bloqué par la limite de 2 emails/heure.

4. Exécuter le SQL `supabase/auth_schema.sql` (et éventuellement `auth_fix_admin_email.sql`) si pas déjà fait.

## SQL conservés

Les fichiers SQL `supabase/auth_schema.sql` et `supabase/auth_fix_admin_email.sql` restent dans le dépôt, ils peuvent être exécutés à tout moment dans Supabase.

Les tables `authorized_emails` et `profiles` côté Supabase peuvent être créées maintenant sans impact sur l'app — elles seront utilisées quand on remettra la nouvelle auth.
