export interface FarmItem {
  id: string;
  name: string;
  image: string;
  rarity: 'trash' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  dropChance: number;
  tokenValue: number;
  description: string;
}

export const RARITY_COLORS = {
  trash: 'text-gray-400',
  common: 'text-white',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-pink-400'
};

export const RARITY_BORDERS = {
  trash: 'border-gray-500',
  common: 'border-white',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
  mythic: 'border-pink-500'
};

export const RARITY_TEXT_COLORS: { [key: string]: string } = {
  trash: "text-gray-500",
  common: "text-gray-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-orange-500",
  mythic: "text-red-600",
};

export const RARITY_LABELS = {
  trash: '🗑️',
  common: '⭐',
  uncommon: '⭐⭐',
  rare: '⭐⭐⭐',
  epic: '⭐⭐⭐⭐',
  legendary: '⭐⭐⭐⭐⭐',
  mythic: '💠'
};

export const FARM_ITEMS: FarmItem[] = [
  // Trash (9 items - 20% Total Drop Chance)
  { id: 'brokencd', name: 'Broken CD', image: '/farm/fish/brokencd.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'A scratched CD. Wonder what was on it?' },
  { id: 'brokenglasses', name: 'Broken Glasses', image: '/farm/fish/brokenglasses.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'Looks like someone had a bad day.' },
  { id: 'driftwood', name: 'Driftwood', image: '/farm/fish/driftwood.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'A piece of wood that has been drifting in the ocean.' },
  { id: 'greenalgae', name: 'Green Algae', image: '/farm/fish/greenalgae.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'It\'s slimy.' },
  { id: 'rottenplant', name: 'Rotten Plant', image: '/farm/fish/rottenplant.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'A soggy, decaying plant.' },
  { id: 'seaweed', name: 'Seaweed', image: '/farm/fish/seaweed.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'It can be used in cooking.' },
  { id: 'soggynewspaper', name: 'Soggy Newspaper', image: '/farm/fish/soggynewspaper.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'This is trash.' },
  { id: 'whitealgae', name: 'White Algae', image: '/farm/fish/whitealgae.gif', rarity: 'trash', dropChance: 2.22, tokenValue: 0.0000, description: 'It\'s also slimy, but in a different way.' },
  { id: 'trash', name: 'Trash', image: '/farm/fish/trash.gif', rarity: 'trash', dropChance: 2.24, tokenValue: 0.0000, description: 'It\'s a piece of trash.' },

  // Common (18 items - 50% Total Drop Chance)
  { id: 'anchovy', name: 'Anchovy', image: '/farm/fish/anchovy.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A small silver fish.' },
  { id: 'carp', name: 'Carp', image: '/farm/fish/carp.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A common pond fish.' },
  { id: 'chub', name: 'Chub', image: '/farm/fish/chub.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A common freshwater fish.' },
  { id: 'herring', name: 'Herring', image: '/farm/fish/herring.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A common ocean fish.' },
  { id: 'mussel', name: 'Mussel', image: '/farm/fish/mussel.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A common bivalve.' },
  { id: 'oyster', name: 'Oyster', image: '/farm/fish/oyster.gif', rarity: 'common', dropChance: 4.00, tokenValue: 0.0010, description: 'A briny delicacy.' },
  { id: 'perch', name: 'Perch', image: '/farm/fish/perch.gif', rarity: 'common', dropChance: 2.67, tokenValue: 0.0015, description: 'A freshwater fish of the winter.' },
  { id: 'periwinkle', name: 'Periwinkle', image: '/farm/fish/periwinkle.gif', rarity: 'common', dropChance: 2.67, tokenValue: 0.0015, description: 'A tiny freshwater snail.' },
  { id: 'pike', name: 'Pike', image: '/farm/fish/pike.gif', rarity: 'common', dropChance: 2.67, tokenValue: 0.0015, description: 'A freshwater fish with a long snout.' },
  { id: 'salmon', name: 'Salmon', image: '/farm/fish/salmon.gif', rarity: 'common', dropChance: 2.67, tokenValue: 0.0015, description: 'A fish that swims upstream to lay its eggs.' },
  { id: 'sardine', name: 'Sardine', image: '/farm/fish/sardine.gif', rarity: 'common', dropChance: 2.66, tokenValue: 0.0015, description: 'A common ocean fish.' },
  { id: 'seashell', name: 'Seashell', image: '/farm/fish/seashell.gif', rarity: 'common', dropChance: 2.66, tokenValue: 0.0015, description: 'A beautiful shell from the sea.' },
  { id: 'shad', name: 'Shad', image: '/farm/fish/shad.gif', rarity: 'common', dropChance: 1.67, tokenValue: 0.0020, description: 'A fish that can be found in rivers.' },
  { id: 'smallmouthbass', name: 'Smallmouth Bass', image: '/farm/fish/smallmouthbass.gif', rarity: 'common', dropChance: 1.67, tokenValue: 0.0020, description: 'A fish that lives in rivers.' },
  { id: 'snail', name: 'Snail', image: '/farm/fish/snail.gif', rarity: 'common', dropChance: 1.67, tokenValue: 0.0020, description: 'A slow-moving mollusk.' },
  { id: 'tilapia', name: 'Tilapia', image: '/farm/fish/tilapia.gif', rarity: 'common', dropChance: 1.67, tokenValue: 0.0020, description: 'A tropical fish.' },
  { id: 'sunfish', name: 'Sunfish', image: '/farm/fish/sunfish.gif', rarity: 'common', dropChance: 1.66, tokenValue: 0.0020, description: 'A common river fish.' },
  { id: 'clam', name: 'Clam', image: '/farm/fish/clam.gif', rarity: 'common', dropChance: 1.66, tokenValue: 0.0020, description: 'There\'s a chewy creature inside this shell.' },
  
  // Uncommon (18 items - 18% Total Drop Chance)
  { id: 'angler', name: 'Angler', image: '/farm/fish/angler.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A deep-sea fish with a bioluminescent lure.' },
  { id: 'bream', name: 'Bream', image: '/farm/fish/bream.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A common river fish.' },
  { id: 'bullhead', name: 'Bullhead', image: '/farm/fish/bullhead.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A freshwater fish that can be found in mountain lakes.' },
  { id: 'crab', name: 'Crab', image: '/farm/fish/crab.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A crustacean with a hard shell.' },
  { id: 'crayfish', name: 'Crayfish', image: '/farm/fish/crayfish.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A small freshwater lobster.' },
  { id: 'flounder', name: 'Flounder', image: '/farm/fish/flounder.gif', rarity: 'uncommon', dropChance: 1.50, tokenValue: 0.0025, description: 'A flatfish that lives on the ocean floor.' },
  { id: 'goby', name: 'Goby', image: '/farm/fish/goby.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A small, bottom-dwelling fish.' },
  { id: 'halibut', name: 'Halibut', image: '/farm/fish/halibut.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A large flatfish.' },
  { id: 'lingcod', name: 'Lingcod', image: '/farm/fish/lingcod.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A large, predatory fish.' },
  { id: 'redmullet', name: 'Red Mullet', image: '/farm/fish/redmullet.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A common ocean fish.' },
  { id: 'redsnapper', name: 'Red Snapper', image: '/farm/fish/redsnapper.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A fish that can be found in the ocean.' },
  { id: 'rainbowtrout', name: 'Rainbow Trout', image: '/farm/fish/rainbowtrout.gif', rarity: 'uncommon', dropChance: 1.00, tokenValue: 0.0050, description: 'A colorful fish found in mountain lakes.' },
  { id: 'seaurchin', name: 'Sea Urchin', image: '/farm/fish/seaurchin.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A spiny creature that lives on the ocean floor.' },
  { id: 'shrimp', name: 'Shrimp', image: '/farm/fish/shrimp.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A small crustacean.' },
  { id: 'catfish', name: 'Catfish', image: '/farm/fish/catfish.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A fish that can be found in rivers.' },
  { id: 'walleye', name: 'Walleye', image: '/farm/fish/walleye.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A freshwater fish that can be found in rivers.' },
  { id: 'tuna', name: 'Tuna', image: '/farm/fish/tuna.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A large fish that lives in the ocean.' },
  { id: 'tigertrout', name: 'Tiger Trout', image: '/farm/fish/tigertrout.gif', rarity: 'uncommon', dropChance: 0.50, tokenValue: 0.0075, description: 'A hybrid of a brown trout and a brook trout.' },
  
  // Rare (16 items - 7% Total Drop Chance)
  { id: 'albacore', name: 'Albacore', image: '/farm/fish/albacore.gif', rarity: 'rare', dropChance: 0.60, tokenValue: 0.0100, description: 'A type of tuna.' },
  { id: 'slimejack', name: 'Slimejack', image: '/farm/fish/slimejack.gif', rarity: 'rare', dropChance: 0.60, tokenValue: 0.0100, description: 'A fish that seems to be made of slime.' },
  { id: 'crimsonfish', name: 'Crimsonfish', image: '/farm/fish/crimsonfish.gif', rarity: 'rare', dropChance: 0.60, tokenValue: 0.0100, description: 'A legendary fish that lives in the ocean.' },
  { id: 'dorado', name: 'Dorado', image: '/farm/fish/dorado.gif', rarity: 'rare', dropChance: 0.60, tokenValue: 0.0100, description: 'A powerful river fish.' },
  { id: 'ghostfish', name: 'Ghostfish', image: '/farm/fish/ghostfish.gif', rarity: 'rare', dropChance: 0.60, tokenValue: 0.0100, description: 'A translucent fish from the mines.' },
  { id: 'largemouthbass', name: 'Largemouth Bass', image: '/farm/fish/largemouthbass.gif', rarity: 'rare', dropChance: 0.50, tokenValue: 0.0200, description: 'A popular fish that lives in lakes.' },
  { id: 'lobster', name: 'Lobster', image: '/farm/fish/lobster.gif', rarity: 'rare', dropChance: 0.50, tokenValue: 0.0200, description: 'A large crustacean.' },
  { id: 'octopus', name: 'Octopus', image: '/farm/fish/octopus.gif', rarity: 'rare', dropChance: 0.50, tokenValue: 0.0200, description: 'An intelligent, eight-armed cephalopod.' },
  { id: 'pufferfish', name: 'Pufferfish', image: '/farm/fish/pufferfish.gif', rarity: 'rare', dropChance: 0.50, tokenValue: 0.0200, description: 'A fish that inflates when threatened.' },
  { id: 'sandfish', name: 'Sandfish', image: '/farm/fish/sandfish.gif', rarity: 'rare', dropChance: 0.50, tokenValue: 0.0200, description: 'A fish that can be found in the desert.' },
  { id: 'seacucumber', name: 'Sea Cucumber', image: '/farm/fish/seacucumber.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'A wobbly creature from the sea.' },
  { id: 'sturgeon', name: 'Sturgeon', image: '/farm/fish/sturgeon.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'An ancient fish.' },
  { id: 'stonefish', name: 'Stonefish', image: '/farm/fish/stonefish.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'A venomous fish that looks like a rock.' },
  { id: 'stingray', name: 'Stingray', image: '/farm/fish/stingray.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'A flat, cartilaginous fish with a venomous tail.' },
  { id: 'squid', name: 'Squid', image: '/farm/fish/squid.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'A ten-armed cephalopod.' },
  { id: 'woodskip', name: 'Woodskip', image: '/farm/fish/woodskip.gif', rarity: 'rare', dropChance: 0.25, tokenValue: 0.0350, description: 'A fish that can be found in the secret woods.' },

  // Epic (9 items - 3% Total Drop Chance)
  { id: 'blue_discus', name: 'Blue Discus', image: '/farm/fish/blue_discus.gif', rarity: 'epic', dropChance: 0.50, tokenValue: 0.0500, description: 'A brilliantly colored tropical fish.' },
  { id: 'eel', name: 'Eel', image: '/farm/fish/eel.gif', rarity: 'epic', dropChance: 0.50, tokenValue: 0.0500, description: 'A long, slippery fish.' },
  { id: 'icepip', name: 'Ice Pip', image: '/farm/fish/icepip.gif', rarity: 'epic', dropChance: 0.50, tokenValue: 0.0500, description: 'A fish that lives in frozen water.' },
  { id: 'lionfish', name: 'Lionfish', image: '/farm/fish/lionfish.gif', rarity: 'epic', dropChance: 0.30, tokenValue: 0.1000, description: 'A venomous fish with beautiful fins.' },
  { id: 'scorpioncarp', name: 'Scorpion Carp', image: '/farm/fish/scorpioncarp.gif', rarity: 'epic', dropChance: 0.30, tokenValue: 0.1000, description: 'A carp with a venomous stinger.' },
  { id: 'spookfish', name: 'Spook Fish', image: '/farm/fish/spookfish.gif', rarity: 'epic', dropChance: 0.30, tokenValue: 0.1000, description: 'A fish that can be found in the submarine.' },
  { id: 'tampalpuke', name: 'Pink Angler', image: '/farm/fish/tampalpuke.gif', rarity: 'epic', dropChance: 0.20, tokenValue: 0.1500, description: 'A mysterious and powerful creature of the deep.' },
  { id: 'supercucumber', name: 'Super Cucumber', image: '/farm/fish/supercucumber.gif', rarity: 'epic', dropChance: 0.20, tokenValue: 0.1500, description: 'A rare, purple sea cucumber.' },
  { id: 'blobfish', name: 'Blobfish', image: '/farm/fish/blobfish.gif', rarity: 'epic', dropChance: 0.20, tokenValue: 0.1500, description: 'A gelatinous fish from the deep sea.' },
  
  // Legendary (6 items - 1.5% Total Drop Chance)
  { id: 'glacierfish', name: 'Glacierfish', image: '/farm/fish/glacierfish.gif', rarity: 'legendary', dropChance: 0.30, tokenValue: 0.2000, description: 'A legendary fish that lives in the glacier.' },
  { id: 'lavaeel', name: 'Lava Eel', image: '/farm/fish/lavaeel.gif', rarity: 'legendary', dropChance: 0.30, tokenValue: 0.2000, description: 'A fish that swims in lava.' },
  { id: 'legend', name: 'Legend', image: '/farm/fish/legend.gif', rarity: 'legendary', dropChance: 0.30, tokenValue: 0.2000, description: 'The legendary fish.' },
  { id: 'midnightsquid', name: 'Midnight Squid', image: '/farm/fish/midnightsquid.gif', rarity: 'legendary', dropChance: 0.20, tokenValue: 0.5000, description: 'A squid that only comes out at night.' },
  { id: 'midnightcarp', name: 'Midnight Carp', image: '/farm/fish/midnightcarp.gif', rarity: 'legendary', dropChance: 0.20, tokenValue: 0.5000, description: 'A carp that can only be caught at night.' },
  { id: 'radioactivecarp', name: 'Radioactive Carp', image: '/farm/fish/radioactivecarp.gif', rarity: 'legendary', dropChance: 0.20, tokenValue: 0.5000, description: 'A legendary fish that glows in the dark.' },
  
  // Mythic (3 items - 0.5% Total Drop Chance)
  { id: 'rainbowshell', name: 'Rainbow Shell', image: '/farm/fish/rainbowshell.gif', rarity: 'mythic', dropChance: 0.25, tokenValue: 1.0000, description: 'A beautiful shell with all the colors of the rainbow.' },
  { id: 'voidsalmon', name: 'Void Fish', image: '/farm/fish/voidsalmon.gif', rarity: 'mythic', dropChance: 0.15, tokenValue: 1.2500, description: 'A fish that has been infused with void energy.' },
  { id: 'mutantcarp', name: 'Mutant Carp', image: '/farm/fish/mutantcarp.gif', rarity: 'mythic', dropChance: 0.10, tokenValue: 1.5000, description: 'A legendary fish that lives in the sewers.' },
];

// Helper function to get items by rarity
export const getItemsByRarity = (rarity: FarmItem['rarity']) => {
  return FARM_ITEMS.filter(item => item.rarity === rarity);
};

// Helper function to get random item based on drop chances
export const getRandomItem = (): FarmItem => {
  const random = Math.random() * 100;
  let cumulativeChance = 0;
  
  for (const item of FARM_ITEMS) {
    cumulativeChance += item.dropChance;
    if (random <= cumulativeChance) {
      return item;
    }
  }
  
  // Fallback to first item if something goes wrong
  return FARM_ITEMS[0];
};

// Helper function to get items for a specific character level
export const getItemsForLevel = (level: number): FarmItem[] => {
  // Higher levels can catch rarer items
  if (level >= 20) return FARM_ITEMS; // All items
  if (level >= 15) return FARM_ITEMS.filter(item => item.rarity !== 'mythic');
  if (level >= 10) return FARM_ITEMS.filter(item => !['mythic', 'legendary'].includes(item.rarity));
  if (level >= 5) return FARM_ITEMS.filter(item => !['mythic', 'legendary', 'epic'].includes(item.rarity));
  return FARM_ITEMS.filter(item => ['trash', 'common', 'uncommon'].includes(item.rarity));
}; 