# Phoenix Portal RH 🚀

Portail web interne pour le service RH de **Phoenix Sénégal** : suivi temps réel des sites et des gardiens (agents de sécurité) sur une carte.

## Fonctionnalités

- 🔐 Login simple (email / mot de passe)
- 🗺️ Carte temps réel (Leaflet + OpenStreetMap) de tous les sites Phoenix au Sénégal
- 📍 Au clic sur un site : cercle de **3 km** dessiné + liste des gardiens dans le rayon, triés par distance
- 🔄 Position des gardiens en service rafraîchie toutes les 3 secondes (simulation temps réel)

## Comptes de démo

| Email | Mot de passe |
|---|---|
| `rh@phoenix.sn` | `phoenix2026` |
| `admin@phoenix.sn` | `admin2026` |

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Leaflet + react-leaflet
- Données mockées dans `lib/data.ts`

## Démarrage local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Déploiement

Hébergé sur Vercel. Chaque push sur `main` déclenche un redéploiement automatique.
