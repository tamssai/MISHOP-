-- ============================================================
-- Phoenix Portal — change l'email admin initial
-- À exécuter UNIQUEMENT si tu as déjà fait tourner auth_schema.sql
-- avant le changement d'email (tamsir@mikaty.com → contact.tamsir@gmail.com)
-- ============================================================

-- 1. Met à jour le trigger de création d'utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM authorized_emails WHERE email = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Email non autorisé pour Phoenix Portal RH';
  END IF;

  is_first := NOT EXISTS (SELECT 1 FROM profiles);

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    CASE
      WHEN LOWER(NEW.email) = 'contact.tamsir@gmail.com' THEN 'admin'
      WHEN is_first THEN 'admin'
      ELSE 'rh'
    END
  );
  RETURN NEW;
END;
$$;

-- 2. Retire l'ancien email autorisé
DELETE FROM public.authorized_emails WHERE email = 'tamsir@mikaty.com';

-- 3. Ajoute le nouveau
INSERT INTO public.authorized_emails (email, added_by, notes)
VALUES ('contact.tamsir@gmail.com', 'system', 'Admin initial')
ON CONFLICT (email) DO NOTHING;

-- 4. Si un compte avait déjà été créé avec l'ancien email, on lui retire son rôle admin
-- (et on lui retire l'accès via le profil — facultatif)
UPDATE public.profiles
SET role = 'rh'
WHERE email = 'tamsir@mikaty.com';
