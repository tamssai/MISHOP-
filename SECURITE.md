# Audit de sécurité — Phoenix Portal RH

_Audit fait à la date de livraison. À refaire avant mise en production critique._

## ✅ Ce qui est sécurisé

### 1. HTTPS / TLS
- Vercel fournit automatiquement un certificat TLS valide
- Pas de connexion HTTP en clair possible
- Headers HSTS activés par défaut

### 2. Aucun secret dans le code
- Audit `grep` confirmé : aucune clé secrète, aucun mot de passe en dur autre que le compte de démo documenté
- Seules les **clés publiques** Supabase sont dans le code (préfixe `NEXT_PUBLIC_`)
- La `service_role_key` Supabase n'est PAS exposée

### 3. Variables d'environnement
- Stockées côté Vercel (chiffrées au repos)
- Jamais commit dans Git (`.gitignore` configure `.env.local`)
- `.env.example` documente les variables nécessaires sans valeur réelle

### 4. Row Level Security (RLS) sur Supabase
- Activée sur les tables `custom_sites` et `custom_agents`
- Politiques d'accès configurées

### 5. Pas d'injection SQL possible
- Toutes les requêtes utilisent les requêtes paramétrées Supabase (PostgREST)
- Aucun SQL brut depuis l'input utilisateur

### 6. Auth Cookie sécurisée (mode actuel)
- `httpOnly: true` (impossible à lire en JavaScript → anti-XSS sur le cookie)
- `sameSite: lax` (anti-CSRF basique)
- `path: /`, expiration 8h

### 7. Données sensibles côté serveur
- Le check d'auth se fait en server component (impossible de bypass en désactivant JS)
- La redirection vers `/login` est faite côté serveur

---

## ⚠️ Limitations connues — à améliorer pour la prod

### 1. ⚠️ AUTH : 1 mot de passe partagé (temporaire)
- **Risque** : si une RH quitte ou si le mot de passe fuit, il faut le changer pour tout le monde
- **Pas de traçabilité** : impossible de savoir qui a fait quoi
- **Solution prête** : Supabase Auth dans `_archive/` — connexion par code OTP par email avec whitelist d'emails autorisés par admin

### 2. ⚠️ Données en clair côté client
- Les ~470 sites et ~1900 agents sont **inclus dans le bundle JavaScript** servi au navigateur
- Toute personne **après authentification** peut voir toutes les données
- **Acceptable** pour un portail RH interne mais **inacceptable** si on doit segmenter (ex: RH région X ne voit que les sites région X)
- **Solution** : déplacer le chargement des données vers une API protégée Supabase avec RLS par utilisateur

### 3. ⚠️ Pas d'audit log
- Les ajouts de sites/agents via `+ Ajouter` ne sont pas tracés (qui, quand)
- **Solution** : créer une table `audit_log` Supabase avec triggers SQL

### 4. ⚠️ Pas de 2FA
- Authentification mono-facteur (mot de passe partagé actuellement)
- **Solution** : avec Supabase Auth + TOTP (Google Authenticator)

### 5. ⚠️ Vercel Hobby utilisé
- Le plan gratuit Vercel est officiellement pour les projets personnels
- **Solution** : passer Pro (20 $/mois) — usage commercial conforme + password protection bonus

### 6. ⚠️ Pas de rate limiting
- Aucune protection contre les tentatives de brute-force sur le login
- **Solution** : avec Supabase Auth qui a un rate limit intégré

### 7. ⚠️ Pas d'export limité par rôle
- N'importe qui peut exporter les PDF (incluant adresses domicile de 1900 agents)
- **Solution** : auth pro + rôle "lecteur" vs "exporteur"

### 8. ⚠️ RGPD / Données personnelles
- Données personnelles d'employés (nom, adresse, matricule)
- **À faire avant prod** :
  - Mention légale + politique de confidentialité
  - Information des agents sur la collecte
  - Procédure de droit d'accès / suppression
  - DPO désigné si > 250 employés
  - Conservation limitée dans le temps

---

## 🎯 Plan d'action recommandé avant déploiement prod sérieux

| Priorité | Action | Effort |
|---|---|---|
| 🔴 P0 | Réactiver Supabase Auth (whitelist + OTP) → vrai contrôle d'accès | 1 h dev |
| 🔴 P0 | Configurer un SMTP custom (Resend gratuit) pour les emails de login | 15 min config |
| 🔴 P0 | Passer Vercel Pro pour conformité commerciale | 20 $/mois |
| 🟡 P1 | Ajouter un audit log Supabase (qui modifie quoi) | 30 min |
| 🟡 P1 | Migrer les données du bundle JS vers une API Supabase protégée | 2-3 h dev |
| 🟡 P1 | Rédiger mention légale + politique RGPD | 1-2 j juridique |
| 🟢 P2 | 2FA pour les comptes admin | 1 h dev |
| 🟢 P2 | Restreindre les exports PDF par rôle | 30 min |
| 🟢 P2 | Backup automatique configuré Supabase | déjà fait sur Pro |

---

## 📋 Code archivé prêt à activer

Le dossier `_archive/` contient le code complet pour l'auth pro :
- `middleware.ts` — middleware de protection des routes
- `admin/` — page admin pour gérer la whitelist d'emails
- `auth/callback/route.ts` — callback du lien magique email

Procédure de réactivation détaillée dans `_archive/README.md`.

---

## 🔍 Conclusion

**État actuel** : MVP fonctionnel sécurisé pour usage interne contrôlé.
**État cible** : avant ouverture à >10 personnes ou usage critique, suivre le plan d'action P0 ci-dessus (~2-3 h dev + 20 $/mois Vercel).
