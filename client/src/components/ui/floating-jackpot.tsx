import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useLocation } from "wouter";

export default function FloatingJackpot({ refreshSignal }: { refreshSignal?: any }) {
  const [jackpot, setJackpot] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();

  const fetchJackpot = async () => {
    try {
      const response = await apiRequest("GET", "/api/jackpot");
      const data = await response.json();
      setJackpot(data);
    } catch (error) {
      console.error("Failed to fetch jackpot:", error);
    }
  };

  useEffect(() => {
    fetchJackpot();
    // Refresh jackpot every 10 seconds for real-time updates
    const interval = setInterval(fetchJackpot, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refetch jackpot when refreshSignal changes
  useEffect(() => {
    if (refreshSignal !== undefined) {
      fetchJackpot();
    }
  }, [refreshSignal]);

  // Exclude on /casino page
  if (!isVisible || location === "/casino") {
    return null;
  }

  return (
    <div className="jackpot-container">
      <div className="jackpot-glow relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center transition-colors z-10 pointer-events-auto text-white/70 hover:text-white"
          title="Hide Jackpot"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Treasure Chest */}
          <div className="treasure-chest-glow mb-2">
            <img 
              src="/images/chest.png" id="chest"
              alt="Jackpot Chest" 
              className="h-16 w-16 sm:h-20 sm:w-20" 
            />
          </div>
          
          {/* Grand Jackpot Text */}
          <div className="jackpot-text-neon-white font-display font-bold text-white text-base sm:text-lg tracking-wider mb-1">
            GRAND JACKPOT
          </div>
          
          {/* Amount Display */}
          <div className="flex items-center justify-center space-x-2">
            <span className="jackpot-amount-neon font-display font-bold text-white text-xl sm:text-2xl tracking-wider leading-none">
              {jackpot ? parseFloat(jackpot.totalPool).toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 4 
              }) : "0.00"}
            </span>
            <img 
              src="/images/$MOBY.png" 
              alt="$MOBY Token" 
              className="moby-token-glow h-[1.5rem] w-[1.5rem] sm:h-[2rem] sm:w-[2rem]" 
              style={{ height: '1.5rem', width: '1.5rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 