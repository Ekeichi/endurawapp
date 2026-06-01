# Enduraw — Readiness App

Application mobile-first qui calcule un **DRS (Daily Readiness Score)** : un indicateur quotidien de l'état de forme d'un athlète d'endurance, croisant la **charge d'entraînement objective** (CTL / ATL) et le **ressenti subjectif** recueilli via un check-in rapide.

Le profil de démonstration est **Lucas**, traileur, avec 5 semaines de données historiques (4 mai → 7 juin 2026).

---

## ✨ Fonctionnalités

- **Check-in quotidien** en 5 étapes (bien-être physique, jambes, sommeil, stress, motivation) avec sélecteur de pastilles et roues horaires pour le sommeil.
- **Score du jour** présenté dans une jauge en arc semi-circulaire animée, colorée selon le niveau (rouge → vert).
- **Analyse** en langage naturel, incluant une recommandation d'entraînement intégrée (« Séance normale », « Privilégie une séance légère », « Repose-toi »…).
- **Lecture du jour** : 3 composantes (Charge, Forme, Bien-être) en pastilles lecture seule.
- **Tendance 5 jours** : mini-sparkline du DRS avec le point du jour mis en évidence.
- **Navigateur de date** : on peut remonter jour par jour dans tout l'historique (7 juin → 4 mai). Le jour courant (8 juin) reste en attente tant que le check-in n'est pas complété.
- **Historique** : courbe du DRS sur 5 semaines, barres de TSS, badges d'état, tooltips au tap, delta hebdomadaire et insight.
- Design **glassmorphism** (cartes translucides, dégradé de fond, grain).

---

## 🛠 Stack technique

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [Recharts](https://recharts.org/) pour les graphiques de l'historique
- [Tailwind CSS](https://tailwindcss.com/) (présent ; le style est majoritairement en inline pour le contrôle fin)
- Aucun backend — tout est calculé côté client à partir des données locales.

---

## 🚀 Démarrage

Prérequis : Node 18+.

```bash
npm install      # installe les dépendances
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # build de production -> dist/
npm run preview  # prévisualise le build
```

---

## ☁️ Déploiement (Vercel)

Le projet est une SPA Vite statique, détectée automatiquement par Vercel :

1. Importer le repo sur [vercel.com](https://vercel.com) → **Add New Project**.
2. Laisser les réglages par défaut (Build `npm run build`, Output `dist`).
3. **Deploy**. Chaque push sur `main` redéploie automatiquement.

Aucune variable d'environnement nécessaire.

---

## 📂 Structure

```
src/
├── App.jsx                  # routing par état (checkin / result / history)
├── main.jsx
├── index.css                # fond, grain, animations
├── components/
│   ├── CheckIn.jsx          # questionnaire 5 étapes
│   ├── PastilleSelector.jsx # sélecteur de pastilles
│   ├── TimeWheelPicker.jsx  # roues horaires (sommeil)
│   ├── DRSResult.jsx        # page Score (jauge, analyse, lecture, tendance, navigateur)
│   ├── History.jsx          # page Historique (courbe, TSS, tooltips)
│   ├── CircularGauge.jsx
│   └── BottomNav.jsx        # navigation basse (Check-in / Score / Historique)
├── data/
│   └── lucasData.js         # données historiques + profil athlète
└── utils/
    └── drs.js               # moteur de calcul du DRS
```

---

## 🧮 Le score DRS

Le score combine une part **objective** (charge d'entraînement) et un **modulateur subjectif** :

```
DRS = min( DRS_obj × mod , 100 )
```

**Part objective** — à partir de la charge chronique (CTL) et aiguë (ATL) :

```
DRS_obj = CTL^0.8 × exp(−ATL / CTL) / NORMALIZER × 100
```

**Ressenti subjectif** (`S_subj`, normalisé 0–1) — moyenne pondérée des réponses du check-in :

| Composante | Poids |
|------------|-------|
| Sommeil    | 0.30  |
| Fatigue    | 0.25  |
| Douleurs   | 0.20  |
| Motivation | 0.15  |
| Stress     | 0.10  |

```
mod = clamp( 1 + 0.6 × (S_subj − 0.5) , 0.70 , 1.30 )
```

> ℹ️ Dans cette démo, la part objective (CTL / ATL) est **figée** sur le dernier point de données (7 juin : CTL = 43.6, ATL = 37.0). Seul le ressenti subjectif fait varier le score lors d'un check-in.

### États détectés

Croisement du ratio de charge (ATL/CTL) et du ressenti `S_subj` :

| État | Signification |
|------|---------------|
| `pic_de_forme` | Forme optimale, tout au vert |
| `forme_montante` | Le travail paie, bonne fenêtre pour pousser |
| `forme_stable` | Corps et données alignés |
| `surcompensation` | Récupération plus rapide que prévu |
| `recuperation` | La fatigue se dissipe |
| `accumulation` | La charge s'accumule, vigilance |
| `fatigue_latente` | Données correctes mais le corps dit autre chose |
| `surmenage` | Signaux clairs de surcharge, repos recommandé |

---

## 📊 Données

`src/data/lucasData.js` contient une entrée par jour avec, entre autres : `tss`, `ctl`, `atl`, `atl_ctl_ratio`, les réponses subjectives, `s_subjectif`, `rrs_daily` (le DRS du jour) et `etat`.
