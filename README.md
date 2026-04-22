# Gratta e Vinci - Poker Edition

Un'applicazione web magica e interattiva che simula un vero "Gratta e Vinci" con selezione segreta della carta.

## Caratteristiche

- **Selezione Segreta:** Un menu invisibile basato su gesti (swipe) per scegliere valore e seme della carta desiderata.
- **Motore di Grattata Realistico:** Effetto grattata fluido e continuo basato su Canvas con accelerazione hardware.
- **Cross-Platform:** Ottimizzato per smartphone (touch) e desktop (mouse).
- **Reset di Sicurezza:** Funzionalità di reset protetta da pressione prolungata (1 secondo) negli angoli per evitare ripristini accidentali.

## Deployment su Vercel

Questa app è pronta per essere distribuita su Vercel:

1. Collega il tuo repository GitHub a Vercel.
2. Assicurati che il **Framework Preset** sia impostato su `Vite`.
3. Il comando di build è `npm run build` e la cartella di output è `dist`.
4. (Opzionale) Se utilizzi funzionalità AI, aggiungi la variabile d'ambiente `GEMINI_API_KEY` nelle impostazioni di Vercel.

## Istruzioni per l'uso

1. **Configurazione:** All'apertura, clicca/tocca i settori invisibili (griglia 3x4 centrale o tasti laterali per i K) e trascina verso una direzione per scegliere il seme.
2. **Conferma:** Rilasciando, il biglietto dorato apparirà integro.
3. **Gratta:** Muovi il dito/mouse sulla grafica dorata per svelare la carta.
4. **Reset:** Per cambiare carta, tieni premuto per **1 secondo** sopra il seme in miniatura negli angoli (alto-sx o basso-dx).

## Tecnologie utilizzate

- React 19
- Vite
- Tailwind CSS 4
- Framer Motion (per le animazioni)
- HTML5 Canvas (per il motore di grattata)
