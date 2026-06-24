# Phoenix Portal RH — Documentation de livraison

## 🎯 Ce que c'est

Portail web interne pour le service RH de **Phoenix Sénégal** :
- Cartographie des **471 sites** et **1933 agents** Phoenix
- Affectations agent → site visibles d'un coup d'œil
- Recherche d'agents et de sites
- Export PDF de 4 états (sites, agents, détail site, agents éloignés)
- Données partagées via Supabase (cloud)

**Lien actuel :** https://phoenix-portal-delta.vercel.app

## 🧱 Stack technique

| Couche | Outil |
|---|---|
| Frontend | Next.js 14 (React 18, App Router) + TypeScript |
| Styling | Tailwind CSS 3 |
| Cartographie | Leaflet 1.9 + react-leaflet + leaflet.markercluster |
| Fond de carte | OpenStreetMap via CartoDB (gratuit, pas de clé API) |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Hébergement | Vercel |
| Export PDF | jsPDF + jspdf-autotable |
| Auth (actuelle) | Cookie + mot de passe partagé en dur (temporaire) |
| Auth (prête à activer) | Supabase Auth — magic link / OTP par email + whitelist d'admins (code archivé dans `_archive/`) |

## 📁 Arborescence du projet

```
.
├── app/                    # Routes Next.js (App Router)
│   ├── dashboard/          # Tableau de bord principal (carte + sidebar)
│   ├── login/              # Page de connexion
│   ├── layout.tsx          # Layout global (metadata, fonts, etc.)
│   └── page.tsx            # Redirection vers login ou dashboard
├── components/             # Composants React
│   ├── DashboardClient.tsx # Composant client principal (état UI)
│   ├── MapView.tsx         # Carte interactive Leaflet
│   ├── SitePanel.tsx       # Panneau latéral droit
│   ├── AddItemModal.tsx    # Modal d'ajout site/agent
│   └── ExportMenu.tsx      # Menu d'export PDF
├── lib/                    # Logique métier + données
│   ├── sites.ts            # 471 sites Phoenix (généré depuis Excel)
│   ├── agents.json         # 1933 agents (généré depuis Excel)
│   ├── agents.ts           # Type Agent + chargement
│   ├── data.ts             # Re-export sites + agents
│   ├── geo.ts              # Calcul de distance (Haversine)
│   ├── storage.ts          # Persistance Supabase + localStorage
│   ├── supabase.ts         # Client Supabase navigateur
│   ├── supabase/           # Clients SSR (server/client/middleware)
│   ├── pdfExport.ts        # Génération des 4 PDF
│   └── auth.ts             # Auth simple temporaire
├── supabase/               # Schémas SQL à exécuter
│   ├── schema.sql          # Tables custom_sites + custom_agents
│   ├── auth_schema.sql     # (futur) Tables auth + whitelist
│   └── auth_fix_admin_email.sql
├── public/                 # Assets statiques (logo Phoenix)
├── _archive/               # Code d'auth sécurisée (à réactiver)
└── package.json
```

## 🚀 Mise en route locale

```bash
npm install
cp .env.example .env.local   # Renseigner les clés Supabase
npm run dev                  # http://localhost:3000
```

## 🌐 Déploiement

Configuré sur **Vercel** avec déploiement automatique à chaque push sur la branche `main`.

Variables d'environnement requises (déjà configurées sur Vercel) :
- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_KEY` : clé publique (publishable key)

## 🔐 Auth en production

**Actuellement** : 1 compte partagé `rh@phoenix.sn` / `phoenix2026` (cookie 8h).

**À activer pour la production** : Supabase Auth avec whitelist d'admins + OTP par email.
Voir `_archive/README.md` pour la procédure de réactivation.

## 📊 Sources des données

- **Sites** : Excel `Liste_Sites_PHOENIX_09062026.xlsx` (435 sites + 36 sites détectés via le fichier d'affectations agents)
- **Agents** : Excel `11062026_Liste_des_agents_CDDCDI_Phoenix_avec_leurs_Sites.xlsx`
- **Géocodage** : automatique via dictionnaire de quartiers + recherche web pour les sites précis.

86% des agents et 78% des sites sont géocodés précisément. Les 22% restants sont placés à Dakar Plateau par défaut avec un indicateur ⚠.

## 📞 Pour toute question

Tamsir — `contact.tamsir@gmail.com`
