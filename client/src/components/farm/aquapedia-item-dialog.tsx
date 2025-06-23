import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { FarmItem, FARM_ITEMS, RARITY_BORDERS } from '../../lib/farm-items';

interface AquapediaItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: FarmItem | null;
}

export function AquapediaItemDialog({ isOpen, onClose, item }: AquapediaItemDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/80 border-2 border-gray-700 text-white sm:max-w-[425px] p-0 rounded-lg shadow-lg">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-4 text-xl font-bold text-yellow-400">
            <img src={item.image} alt={item.name} className="w-12 h-12 object-contain bg-black/30 p-1 rounded-md" />
            <span>{item.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-4">
          <p className="text-gray-300 text-center italic px-2 py-4 border-t border-b border-gray-700/50">{item.description}</p>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="text-gray-400 font-medium">Rarity</div>
            <div className="flex justify-end">
                <Badge variant="outline" className={`capitalize border-2 ${RARITY_BORDERS[item.rarity]}`}>
                    {item.rarity}
                </Badge>
            </div>

            {item.rarity !== 'trash' && (
              <>
                <div className="text-gray-400 font-medium">Sell Value</div>
                <div className="font-semibold text-yellow-400 flex items-center justify-end gap-1.5">
                  {item.tokenValue.toFixed(4)}
                  <img src="/images/$MOBY.png" alt="$MOBY" className="w-4 h-4" />
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 