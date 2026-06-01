# Readiness App — Enduraw

Application mobile-first de collecte quotidienne de l'état de forme d'un athlète d'endurance. Elle calcule un Daily Readiness Score (DRS) en croisant la charge d'entraînement objective et le ressenti subjectif recueilli via un check-in rapide.

Le profil de démonstration est Lucas, traileur, avec 5 semaines de données historiques (4 mai → 7 juin 2026).

---

## Fonctionnalités

- Check-in quotidien en 5 étapes avec sélecteur de pastilles et roue horaire pour le sommeil
- Score du jour affiché dans une jauge en arc semi-circulaire animée, colorée selon le niveau
- Analyse contextuelle en langage naturel avec recommandation d'entraînement intégrée
- Lecture du jour : 3 composantes (Charge, Forme, Bien-être) en pastilles
- Tendance 5 jours : mini-sparkline du DRS avec le point du jour mis en évidence
- Navigateur de dates : retour jour par jour dans tout l'historique
- Historique : courbe DRS sur 5 semaines, barres de charge, annotations d'états, tooltips au tap
- Design glassmorphism : cartes translucides, dégradé de fond, texture grain

---

## Stack

- React 18 + Vite 5
- Recharts pour les graphiques
- Tailwind CSS
- Aucun backend — tout est calculé côté client

---

## Démarrage

Prérequis : Node 18+

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

---

## Déploiement

Le projet est une SPA Vite statique déployée sur Vercel.

1. Importer le repo sur vercel.com
2. Laisser les réglages par défaut (build `npm run build`, output `dist`)
3. Deploy — chaque push sur `main` redéploie automatiquement

Aucune variable d'environnement nécessaire.

---

## Structure

```
src/
├── App.jsx
├── components/
│   ├── CheckIn.jsx
│   ├── PastilleSelector.jsx
│   ├── TimeWheelPicker.jsx
│   ├── DRSResult.jsx
│   ├── History.jsx
│   ├── CircularGauge.jsx
│   └── BottomNav.jsx
├── data/
│   └── lucasData.js        # données historiques de Lucas
└── utils/
    └── drs.js              # calcul du DRS
```

---

## Calcul du DRS

```
DRS = min( DRS_obj x mod , 100 )
```

Part objective :

```
DRS_obj = CTL^0.8 x exp(-ATL / CTL) / NORMALIZER x 100
```

Modulateur subjectif — moyenne pondérée des réponses du check-in :

| Composante | Poids |
|------------|-------|
| Sommeil    | 0.30  |
| Fatigue    | 0.25  |
| Douleurs   | 0.20  |
| Motivation | 0.15  |
| Stress     | 0.10  |

```
mod = clamp( 1 + 0.6 x (S_subj - 0.5) , 0.70 , 1.30 )
```

---

## États détectés

| État | Signification |
|------|---------------|
| pic_de_forme | Forme optimale, tout au vert |
| forme_montante | Le travail paie, bonne fenêtre pour pousser |
| forme_stable | Corps et données alignés |
| surcompensation | Récupération plus rapide que prévu |
| recuperation | La fatigue se dissipe |
| accumulation | La charge s'accumule, vigilance |
| fatigue_latente | Données correctes mais le corps dit autre chose |
| surmenage | Signaux clairs de surcharge, repos recommandé |