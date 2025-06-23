import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { LockIcon, UnlockIcon } from '../ui/icons';
import { FARM_ITEMS, RARITY_BORDERS } from '../../lib/farm-items';
import { Badge } from '../ui/badge';

interface ItemActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  inventory: any[];
  onAction: (action: 'lock' | 'sell' | 'dispose', quantity?: number) => void;
  isLoading?: boolean;
}

export function ItemActionDialog({ isOpen, onClose, item, inventory, onAction, isLoading = false }: ItemActionDialogProps) {
  if (!item) return null;
  
  const itemInfo = FARM_ITEMS.find(i => i.id === item.itemId);
  
  if (!itemInfo) return null;

  const quantity = inventory.filter(i => i.itemId === item.itemId).length;
  const isTrash = itemInfo.rarity === 'trash';
  const isLocked = item.locked;
  const sellValue = itemInfo.tokenValue;

  const handleAction = (action: 'lock' | 'sell' | 'dispose') => {
    onAction(action, item.quantity);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/80 border-2 border-gray-700 text-white sm:max-w-[425px] p-0 rounded-lg shadow-lg">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-4 text-xl font-bold text-yellow-400">
            <img src={itemInfo.image} alt={itemInfo.name} className="w-12 h-12 object-contain bg-black/30 p-1 rounded-md" />
            <span>{itemInfo.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-b border-gray-700/50 py-4">
            <div className="text-gray-400 font-medium">Rarity</div>
            <div className="flex justify-end">
                <Badge variant="outline" className={`capitalize border-2 ${RARITY_BORDERS[itemInfo.rarity]}`}>
                    {itemInfo.rarity}
                </Badge>
            </div>

            <div className="text-gray-400 font-medium">Quantity</div>
            <div className="flex justify-end font-semibold">
              {quantity}
            </div>

            <div className="text-gray-400 font-medium">Item ID</div>
            <div className="flex justify-end text-gray-300 font-mono text-xs">
              {item.id}
            </div>

            {!isTrash && (
              <>
                <div className="text-gray-400 font-medium">Sell Value</div>
                <div className="font-semibold text-yellow-400 flex items-center justify-end gap-1.5">
                  {sellValue.toFixed(4)}
                  <img src="/images/$MOBY.png" alt="$MOBY" className="w-4 h-4" />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {isLocked ? (
              <Button
                onClick={() => handleAction('lock')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base"
              >
                <UnlockIcon className="w-5 h-5 mr-2" />
                Unlock Item
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleAction('lock')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base"
                >
                  <LockIcon className="w-5 h-5 mr-2" />
                  Lock Item
                </Button>
                
                {isTrash ? (
                  <Button
                    onClick={() => handleAction('dispose')}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base"
                  >
                    Dispose Item
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction('sell')}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-base"
                  >
                    Sell Item
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 