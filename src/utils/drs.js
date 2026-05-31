// DRS (Daily Readiness Score) calculation engine
// Based on last historical data point: 2026-06-07
// CTL = 43.6, ATL = 37.0, TSB = 6.6, atl_ctl_ratio = 0.849

const CTL = 43.6;
const ATL = 37.0;
const ATL_CTL = ATL / CTL; // 0.849 (fixed from last data point)

const CTL_MAX = 53.7; // historical max
const NORMALIZER = Math.pow(CTL_MAX, 0.8) * Math.exp(-0.6);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute the DRS score and derived state from subjective inputs.
 *
 * @param {{ fatigue: number, douleurs: number, sommeil: number, stress: number, motivation: number }} inputs
 *   UI scale: 1=worst, 7=best for fatigue/douleurs/sommeil/stress (higher = better).
 *   Motivation: 1=worst, 5=best.
 * @returns {{ score: number, state: string, fitness: number, fatigueRatio: number, sommeilScore: number, s_subj: number, mod: number }}
 */
export function computeDRS({ fatigue, douleurs, sommeil, stress, motivation }) {
  // --- Objective component (fixed from last data point) ---
  const DRS_obj = (Math.pow(CTL, 0.8) * Math.exp(-1.0 * ATL / CTL)) / NORMALIZER * 100;

  // --- Convert UI scale (higher=better) back to Hooper convention (higher=worse) ---
  const fatigue_hooper  = 8 - fatigue;
  const stress_hooper   = 8 - stress;
  const douleurs_hooper = 8 - douleurs;
  const sommeil_hooper  = 8 - sommeil;

  // --- Normalize (Hooper: 1=best → normalized 1.0, 7=worst → 0.0) ---
  const fatigue_n    = (7 - fatigue_hooper)  / 6;
  const stress_n     = (7 - stress_hooper)   / 6;
  const douleurs_n   = (7 - douleurs_hooper) / 6;
  const sommeil_n    = (7 - sommeil_hooper)  / 6;
  const motivation_n = (motivation - 1) / 4;

  const S_subj =
    0.30 * sommeil_n +
    0.25 * fatigue_n +
    0.20 * douleurs_n +
    0.15 * motivation_n +
    0.10 * stress_n;

  const mod = clamp(1 + 0.6 * (S_subj - 0.5), 0.70, 1.30);

  const score = Math.min(DRS_obj * mod, 100);

  // --- State detection ---
  const atl_ctl = ATL_CTL; // 0.849
  const S = S_subj;

  // Per-component "green" status, mirroring the breakdown bars on the Score page.
  const fitnessGreen = (CTL / CTL_MAX) * 100 > 70; // fitness level high enough
  const chargeGreen = atl_ctl <= 0.85;             // load not stacking up
  const bienGreen = S > 0.70;                       // subjective well-being green
  const objectiveOk = fitnessGreen && chargeGreen;

  let state;
  if (atl_ctl < 0.75 && S > 0.7) {
    state = 'pic_de_forme';
  } else if (atl_ctl < 0.75 && S >= 0.5) {
    state = 'surcompensation';
  } else if (atl_ctl < 0.75) {
    state = 'recuperation';
  } else if (atl_ctl > 0.95 && S < 0.4) {
    state = 'surmenage';
  } else if (atl_ctl > 0.95) {
    state = 'accumulation';
  } else if (objectiveOk && bienGreen) {
    // All three components green → corps et données alignés.
    state = 'forme_stable';
  } else if (objectiveOk && S < 0.60) {
    // Objective looks fine but the body says otherwise.
    state = 'fatigue_latente';
  } else if (objectiveOk) {
    // Objective fine, well-being decent but not fully green (0.60–0.70).
    state = 'forme_montante';
  } else if (S > 0.65) {
    // Load not yet green but feeling good → still building.
    state = 'forme_montante';
  } else {
    state = 'fatigue_latente';
  }

  return {
    score: Math.round(score),
    state,
    fitness: CTL,
    fatigueRatio: atl_ctl,
    sommeilScore: sommeil_n * 100,
    s_subj: S_subj,
    mod,
    objective: DRS_obj,
  };
}

/**
 * Returns display metadata for a given state key.
 *
 * @param {string} state
 * @returns {{ label: string, comment: string, color: string }}
 */
export function getStateInfo(state) {
  const stateMap = {
    forme_stable: {
      label: 'Forme stable',
      comment: 'Tout est aligné. Corps et données envoient le même signal. Séance normale.',
      color: '#22C55E',
    },
    forme_montante: {
      label: 'Forme montante',
      comment: "Le travail paie. C'est une bonne fenêtre pour pousser aujourd'hui.",
      color: '#22C55E',
    },
    accumulation: {
      label: 'Accumulation',
      comment: "La charge s'accumule depuis plusieurs jours. Le corps encaisse encore. Reste vigilant.",
      color: '#EAB308',
    },
    fatigue_latente: {
      label: 'Fatigue latente',
      comment: "Les données semblent correctes, mais ton corps dit autre chose. Privilégie une séance légère aujourd'hui.",
      color: '#EAB308',
    },
    surmenage: {
      label: 'Surmenage',
      comment: "Le corps envoie des signaux clairs. Ce n'est pas dans la tête. Repose-toi.",
      color: '#EF4444',
    },
    recuperation: {
      label: 'Récupération',
      comment: 'La fatigue se dissipe doucement. Laisse le corps finir son travail.',
      color: '#22C55E',
    },
    surcompensation: {
      label: 'Surcompensation',
      comment: 'Tu récupères mieux que prévu. Une séance modérée s\'impose.',
      color: '#22C55E',
    },
    pic_de_forme: {
      label: 'Pic de forme',
      comment: "Forme optimale, tout est au vert. Tu peux donner le meilleur aujourd'hui.",
      color: '#22C55E',
    },
  };

  return stateMap[state] ?? stateMap['forme_stable'];
}
