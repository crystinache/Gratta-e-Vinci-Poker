/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Star, Info } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface CardSelection {
  value: CardValue;
  suit: Suit;
}

export default function App() {
  const [selectedCard, setSelectedCard] = useState<CardSelection | null>(null);
  const [currentSelection, setCurrentSelection] = useState<CardSelection | null>(null);
  const [isModeSelection, setIsModeSelection] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number, y: number, value: CardValue, suit: Suit } | null>(null);
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Deck of cards API URL generator
  const getCardImageUrl = (card: CardSelection) => {
    const valMap: Record<string, string> = { '10': '0' };
    const val = valMap[card.value] || card.value;
    return `https://deckofcardsapi.com/static/img/${val}${card.suit}.png`;
  };

  // Logic to update the mask image in the UI directly (Bypassing React State for performance)
  const updateMask = useCallback(() => {
    if (canvasRef.current && containerRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const style = containerRef.current.style;
      style.webkitMaskImage = `url(${url})`;
      style.maskImage = `url(${url})`;
    }
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updateMask();
    };

    resize();
    return resize;
  }, [updateMask]);

  useEffect(() => {
    const resize = initCanvas();
    window.addEventListener('resize', resize!);
    return () => window.removeEventListener('resize', resize!);
  }, [initCanvas, isModeSelection]);

  const performScratch = (clientX: number, clientY: number) => {
    if (isModeSelection) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 45;

    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    } else {
      ctx.moveTo(x, y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
    updateMask();
  };

  const handleScratchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isModeSelection) return;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      if (e.buttons !== 1) return;
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPointRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleScratchMove = (e: React.TouchEvent | React.MouseEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      if (isModeSelection) onSelectionMove(clientX, clientY);
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      if (isModeSelection) onSelectionMove(clientX, clientY);
      if (e.buttons !== 1) {
        lastPointRef.current = null;
        return;
      }
    }
    
    if (!isModeSelection) performScratch(clientX, clientY);
  };

  const handleScratchEnd = () => {
    lastPointRef.current = null;
    if (isModeSelection) onSelectionEnd();
  };

  // Selections Handlers
  const onSelectionStart = (value: CardValue, initialSuit: Suit, x: number, y: number) => {
    if (!isModeSelection) return;
    touchStartRef.current = { x, y, value, suit: initialSuit };
    setCurrentSelection({ value, suit: initialSuit });
  };

  const onSelectionMove = (x: number, y: number) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    const dx = x - start.x;
    const dy = y - start.y;
    const threshold = 40;
    let newSuit = start.suit;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newSuit = dx > 0 ? 'D' : 'S';
      } else {
        newSuit = dy > 0 ? 'C' : 'H';
      }
    }

    if (newSuit !== currentSelection?.suit) {
      setCurrentSelection({ value: start.value, suit: newSuit });
    }
  };

  const onSelectionEnd = () => {
    if (isModeSelection && currentSelection) {
      setSelectedCard(currentSelection);
      setIsModeSelection(false);
    }
    setCurrentSelection(null);
    touchStartRef.current = null;
  };

  const startResetTimer = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Clear any existing timer just in case
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setSelectedCard(null);
      setIsModeSelection(true);
      resetTimerRef.current = null;
    }, 1000);
  };

  const clearResetTimer = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const suitEmoji = (suit: Suit) => {
    const emojis = { H: '♥', D: '♦', C: '♣', S: '♠' };
    return emojis[suit];
  };

  const stars = [
    { top: '10%', left: '15%', size: 24 }, { top: '15%', right: '10%', size: 20 },
    { top: '40%', left: '5%', size: 32 }, { top: '45%', right: '5%', size: 28 },
    { bottom: '20%', left: '10%', size: 24 }, { bottom: '25%', right: '15%', size: 20 },
    { top: '50%', left: '50%', size: 16 }, { top: '70%', left: '20%', size: 12 },
    { top: '30%', right: '25%', size: 18 },
  ];

  return (
    <div 
      className="h-screen w-screen bg-page-bg overflow-hidden flex flex-col items-stretch justify-stretch select-none touch-none"
      onMouseDown={handleScratchStart}
      onMouseMove={handleScratchMove}
      onMouseUp={handleScratchEnd}
      onMouseLeave={handleScratchEnd}
      onTouchStart={handleScratchStart}
      onTouchMove={handleScratchMove}
      onTouchEnd={handleScratchEnd}
    >
      
      {/* Background Layer: The Selected Card & Reset Zones */}
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-0 overflow-hidden pointer-events-none">
        {selectedCard ? (
          <div className="relative h-[85%] max-h-[90vh] aspect-[2/3] w-auto pointer-events-none">
             <motion.img 
              key={`${selectedCard.value}${selectedCard.suit}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={getCardImageUrl(selectedCard)} 
              className="h-full w-full object-contain shadow-huge rounded-2xl pointer-events-none select-none"
              alt="Carta Selezionata"
              draggable="false"
            />
            {/* Reset Area Overlays (Corners where value/suit usually reside) */}
            <div className="absolute inset-0 z-50 pointer-events-none">
              <div 
                className="absolute top-0 left-0 w-[25%] h-[20%] pointer-events-auto cursor-pointer"
                onPointerDown={startResetTimer}
                onPointerUp={clearResetTimer}
                onPointerLeave={clearResetTimer}
              />
              <div 
                className="absolute bottom-0 right-0 w-[25%] h-[20%] pointer-events-auto cursor-pointer"
                onPointerDown={startResetTimer}
                onPointerUp={clearResetTimer}
                onPointerLeave={clearResetTimer}
              />
            </div>
          </div>
        ) : (
          <div className="text-white/10 font-serif italic text-2xl px-12 text-center heartbeat">
            {isModeSelection ? "Scegli il tuo destino..." : ""}
          </div>
        )}
      </div>

      {/* Foreground Layer: The "Gratta e Vinci" UI */}
      <motion.div 
        ref={containerRef}
        animate={{ opacity: 1 }}
        className="relative flex-grow bg-diamond-pattern gold-border-screen overflow-hidden flex flex-col z-10 pointer-events-none"
        style={{
          maskMode: 'alpha',
          WebkitMaskMode: 'alpha',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          transform: 'translateZ(0)', // Force GPU acceleration for stability
          willChange: 'mask-image, -webkit-mask-image',
          backfaceVisibility: 'hidden',
          perspective: 1000
        }}
      >
        <div className="absolute inset-0 gold-inner-border-screen" />
        
        {stars.map((star, i) => (
          <div key={i} className="absolute z-10 opacity-60" style={{ top: star.top, left: star.left, right: star.right, bottom: star.bottom }}>
            <Star size={star.size} className="text-gold fill-gold drop-shadow-lg" />
          </div>
        ))}

        <div className="relative z-20 flex-grow flex flex-col items-center justify-center space-y-8 py-16 px-6 text-center select-none">
          <div className="w-full">
            <h1 className="text-[18vw] sm:text-[80px] font-serif font-black leading-none tracking-tighter uppercase text-gold-gradient drop-shadow-2xl">
              GIOCA<br /><span className="text-[12vw] sm:text-[50px] italic lowercase normal-case tracking-tighter">e</span><br />VINCI!
            </h1>
          </div>
          <div className="w-full">
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
            <h2 className="text-[10vw] sm:text-[40px] font-serif font-black uppercase tracking-tight text-gold-gradient drop-shadow-md px-4">
              TROVA LA CARTA FORTUNATA!
            </h2>
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-gold to-transparent mt-4" />
          </div>
        </div>

        <div className="absolute top-6 left-6 w-5 h-5 bg-gold rotate-45 z-30 shadow-md border border-white/20" />
        <div className="absolute top-6 right-6 w-5 h-5 bg-gold rotate-45 z-30 shadow-md border border-white/20" />
        <div className="absolute bottom-6 left-6 w-5 h-5 bg-gold rotate-45 z-30 shadow-md border border-white/20" />
        <div className="absolute bottom-6 right-6 w-5 h-5 bg-gold rotate-45 z-30 shadow-md border border-white/20" />
      </motion.div>

      <canvas ref={canvasRef} className="hidden pointer-events-none" />

      {/* Selection Grids Overlay (Only active/visible during selection mode) */}
      {isModeSelection && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {/* Top 1x2 Grid */}
          <div className="absolute top-0 left-0 right-0 h-16 border-[0.5px] border-white/20 pointer-events-none bg-black/10">
            <div className="grid grid-cols-2 h-full w-full">
              {[{v:'K', s:'H' as Suit, l:'K ♥'}, {v:'K', s:'D' as Suit, l:'K ♦'}].map((card, i) => (
                <button 
                  key={`top-${i}`}
                  className="border-[0.5px] border-white/20 pointer-events-auto flex items-center justify-center text-3xl font-serif font-black text-white bg-white/5 active:bg-white/20 transition-colors"
                  onTouchStart={(e) => onSelectionStart(card.v as CardValue, card.s, e.touches[0].clientX, e.touches[0].clientY)}
                  onMouseDown={(e) => onSelectionStart(card.v as CardValue, card.s, e.clientX, e.clientY)}
                >
                  {card.l}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute top-16 left-0 right-0 bottom-16 border-[0.5px] border-white/20 pointer-events-none bg-black/10">
            <div className="grid grid-cols-3 grid-rows-4 h-full w-full">
              {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'].map((val, i) => (
                <button 
                  key={i}
                  className="border-[0.5px] border-white/20 pointer-events-auto flex items-center justify-center text-3xl font-serif font-black text-white/40 bg-white/5 active:bg-white/20 transition-colors"
                  onTouchStart={(e) => onSelectionStart(val as CardValue, 'H', e.touches[0].clientX, e.touches[0].clientY)}
                  onMouseDown={(e) => onSelectionStart(val as CardValue, 'H', e.clientX, e.clientY)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 border-[0.5px] border-white/20 pointer-events-none bg-black/10">
            <div className="grid grid-cols-2 h-full w-full">
              {[{v:'K', s:'S' as Suit, l:'K ♠'}, {v:'K', s:'C' as Suit, l:'K ♣'}].map((card, i) => (
                <button 
                  key={`bottom-${i}`}
                  className="border-[0.5px] border-white/20 pointer-events-auto flex items-center justify-center text-3xl font-serif font-black text-white bg-white/5 active:bg-white/20 transition-colors"
                  onTouchStart={(e) => onSelectionStart(card.v as CardValue, card.s, e.touches[0].clientX, e.touches[0].clientY)}
                  onMouseDown={(e) => onSelectionStart(card.v as CardValue, card.s, e.clientX, e.clientY)}
                >
                  {card.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Selection Preview */}
      {currentSelection && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 px-8 py-6 rounded-3xl border-4 border-gold shadow-2xl flex flex-col items-center pointer-events-none scale-110">
          <span className="text-7xl font-serif font-black text-white mb-2">{currentSelection.value}</span>
          <span className={`text-5xl ${['H', 'D'].includes(currentSelection.suit) ? 'text-red-500' : 'text-white'}`}>
            {suitEmoji(currentSelection.suit)}
          </span>
          <div className="mt-4 text-xs text-gold uppercase tracking-widest font-bold opacity-50 font-sans">Seme Selezionato</div>
        </div>
      )}
    </div>
  );
}





