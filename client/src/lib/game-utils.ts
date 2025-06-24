export function generateClientSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function calculateDiceWinChance(target: number): number {
  return Math.max(1, target - 1);
}

export function calculateDiceMultiplier(target: number): number {
  const winChance = calculateDiceWinChance(target);
  return parseFloat((99 / winChance).toFixed(2));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatMoby(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export const BET_AMOUNTS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

export const SLOT_SYMBOLS = [
  { icon: "🐟", name: "fish", multiplier: 1000 },
  { icon: "👑", name: "crown", multiplier: 500 },
  { icon: "💎", name: "gem", multiplier: 250 },
  { icon: "🚢", name: "ship", multiplier: 100 },
  { icon: "⚓", name: "anchor", multiplier: 50 },
];

export const CARD_SUITS = ["♠", "♥", "♦", "♣"];
export const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function getCardValue(card: string): number {
  if (card === "A") return 1;
  if (["J", "Q", "K"].includes(card)) return [11, 12, 13][["J", "Q", "K"].indexOf(card)];
  return parseInt(card);
}

export function formatCard(value: number | null | undefined): string {
  if (value === null || value === undefined) return "?";
  if (value === 1) return "A";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  return value.toString();
}
