-- ============================================================
-- Phoenix Portal RH — Authentification sécurisée + rôles
-- À exécuter une seule fois dans le SQL Editor Supabase
-- (https://supabase.com/dashboard/project/tlwvevrvtnpvykpfqkxy/sql/new)
-- ============================================================

-- ============================================================
-- 1. Table des emails autorisés (whitelist gérée par admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authorized_emails (
  email TEXT PRIMARY KEY,
  added_by TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Profils utilisateurs (rôle admin ou rh)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'rh' CHECK (role IN ('admin', 'rh')),
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Fonctions utilitaires
-- ============================================================

-- Vérifie publiquement si un email est dans la whitelist (sans exposer la liste)
CREATE OR REPLACE FUNCTION public.is_email_authorized(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM authorized_emails WHERE email = LOWER(p_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_email_authorized TO anon, authenticated;

-- Vérifie si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- ============================================================
-- 4. Trigger : création automatique du profil au signup
-- (refuse les emails non autorisés)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  -- Refuse si l'email n'est pas dans la whitelist
  IF NOT EXISTS (
    SELECT 1 FROM authorized_emails WHERE email = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Email non autorisé pour Phoenix Portal RH';
  END IF;

  -- Le tout premier utilisateur OU tamsir@mikaty.com devient admin
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. RLS — profils
-- ============================================================
DROP POLICY IF EXISTS "user reads own profile" ON public.profiles;
CREATE POLICY "user reads own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "admin reads all profiles" ON public.profiles;
CREATE POLICY "admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin updates profiles" ON public.profiles;
CREATE POLICY "admin updates profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 6. RLS — emails autorisés (admin uniquement)
-- ============================================================
DROP POLICY IF EXISTS "admin manages emails" ON public.authorized_emails;
CREATE POLICY "admin manages emails" ON public.authorized_emails
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 7. Durcissement RLS des tables custom_sites / custom_agents
-- (auth requise — plus de lecture/écriture publique)
-- ============================================================
DROP POLICY IF EXISTS "read custom_sites" ON public.custom_sites;
DROP POLICY IF EXISTS "insert custom_sites" ON public.custom_sites;
DROP POLICY IF EXISTS "delete custom_sites" ON public.custom_sites;

CREATE POLICY "auth reads custom_sites" ON public.custom_sites
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth inserts custom_sites" ON public.custom_sites
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth deletes custom_sites" ON public.custom_sites
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "read custom_agents" ON public.custom_agents;
DROP POLICY IF EXISTS "insert custom_agents" ON public.custom_agents;
DROP POLICY IF EXISTS "delete custom_agents" ON public.custom_agents;

CREATE POLICY "auth reads custom_agents" ON public.custom_agents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth inserts custom_agents" ON public.custom_agents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth deletes custom_agents" ON public.custom_agents
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 8. Email admin initial (à modifier si besoin)
-- ============================================================
INSERT INTO public.authorized_emails (email, added_by, notes)
VALUES ('contact.tamsir@gmail.com', 'system', 'Admin initial')
ON CONFLICT (email) DO NOTHING;
