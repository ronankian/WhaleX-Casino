import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import React, { useState, useEffect } from "react";
import GameLayout from "../components/games/game-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import {
  FARM_ITEMS,
  getRandomItem,
  RARITY_BORDERS,
  RARITY_LABELS,
  RARITY_TEXT_COLORS,
} from "../lib/farm-items";

// Debug mode - set to true for 5 second countdown, false for 60 second countdown
const DEBUG_MODE = false;
const FISHING_COUNTDOWN = DEBUG_MODE ? 5 : 60;

const LEVEL_UP_COSTS = [
  0.0100, 0.0150, 0.0225, 0.0325, 0.0450, 0.0600, 0.0775, 0.0975, 0.1200, 0.1450,
  0.1725, 0.2025, 0.2350, 0.2700, 0.3075, 0.3475, 0.3900, 0.4350, 0.4825, 0.5325,
  0.5850, 0.6400, 0.6975, 0.7575,
];

const HIRE_COSTS = [1000, 5000, 20000, 50000];

const dockPositions = [
    { style: { bottom: "15%", left: "17%", width: '15%' }, animationType: 'fish' },
    { style: { bottom: "28%", right: "32%", width: '15%' }, animationType: 'fish' },
    { style: { bottom: "5%", right: "15%", zIndex: 10, width: '15%' }, animationType: 'row' },
    { style: { bottom: "8%", right: "3%", zIndex: 5, width: '15%' }, animationType: 'fish' },
];

export default function FarmPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dock");
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  const [animationStates, setAnimationStates] = useState<{ [key: string]: string }>({});
  const [isFishing, setIsFishing] = useState(false);
  const [catchHistory, setCatchHistory] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(FISHING_COUNTDOWN);
  const [catchTimestamp, setCatchTimestamp] = useState<number | null>(null);
  const [isCatching, setIsCatching] = useState(false);

  const { data: farmData, isLoading: isLoadingFarm, isError: isErrorFarm } = useQuery({
    queryKey: ["farmCharacters", user?.id],
    queryFn: () => fetchCharacters(user!.id),
    enabled: !!user,
  });

  const { data: levelStats = [], isLoading: isLoadingLevelStats, isError: isErrorLevelStats } = useQuery({
    queryKey: ["levelStats"],
    queryFn: fetchLevelStats,
  });

  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ["farmInventory", user?.id],
    queryFn: () => fetchInventory(user!.id),
    enabled: !!user,
  });

  // Calculate the total number of occupied storage slots by summing quantities.
  const currentStorageUsed = inventory.reduce((acc, item) => acc + item.quantity, 0);

  // Create a "flattened" inventory array where each object represents a single item,
  // which is what we'll use for rendering to ensure one item per slot.
  const flattenedInventory = inventory.reduce((acc, item) => {
    for (let i = 0; i < item.quantity; i++) {
      // Give each unrolled item a unique key for React's rendering.
      acc.push({ ...item, uniqueDisplayId: `${item.id}-${i}` });
    }
    return acc;
  }, []);

  const hireMutation = useMutation({
    mutationFn: hireCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmCharacters", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      toast({ title: "Success", description: "Character hired!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hiring Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
      });
    },
  });

  const levelUpMutation = useMutation({
    mutationFn: levelUpCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmCharacters", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      toast({ title: "Success", description: "Character leveled up!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Level Up Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
      });
    },
  });

  const startFishingMutation = useMutation({
    mutationFn: startFishing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmCharacters", user?.id] });
      setIsFishing(true);
      toast({ title: "Success", description: "Fishing started!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Start Fishing Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
      });
    },
  });

  const stopFishingMutation = useMutation({
    mutationFn: stopFishing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmCharacters", user?.id] });
      setIsFishing(false);
      toast({ title: "Success", description: "Fishing stopped!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Stop Fishing Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
      });
    },
  });
  
  const processCatchesMutation = useMutation({
    mutationFn: processCatches,
    onSuccess: (data) => {
      // The animation state is already set. This just handles the results.
      queryClient.invalidateQueries({ queryKey: ["farmCharacters", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["farmInventory", user?.id] });

      // Update catch history if there were new catches
      if (data.newCatches && data.newCatches.length > 0) {
        setCatchHistory(prevHistory => 
          [...data.newCatches, ...prevHistory].slice(0, 10)
        );
      }
    },
    onError: (error: any) => {
      console.error('Error processing catches:', error);
      toast({
        variant: "destructive",
        title: "Catch Processing Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
      });
      // IMPORTANT: If the server fails, reset the state so the user isn't stuck.
      setIsCatching(false);
      setCountdown(FISHING_COUNTDOWN);
      setAnimationStates(prevStates => {
        const revertedStates = { ...prevStates };
        hiredCharacters
          .filter(char => char.status === 'Fishing')
          .forEach((char, index) => {
            const position = dockPositions[index];
            if (position) {
              revertedStates[char.id] = position.animationType;
            }
          });
        return revertedStates;
      });
    },
  });
  
  const allCharacters = farmData?.allCharacters || [];
  const hiredCharacters = farmData?.hiredCharacters || [];

  // Check if any characters are fishing & initialize animations
  useEffect(() => {
    const fishingCharacters = hiredCharacters.filter((char: any) => char.status === 'Fishing');
    const currentlyFishing = fishingCharacters.length > 0;
    setIsFishing(currentlyFishing);

    // Initialize animation states
    if (hiredCharacters.length > 0) {
      const initialStates = {};
      hiredCharacters.forEach((char, index) => {
        const position = dockPositions[index];
        if (position) {
          initialStates[char.id] = position.animationType; // fish or row animation
        }
      });
      setAnimationStates(initialStates);
    }
  }, [hiredCharacters]);

  // Set up countdown timer for fishing
  useEffect(() => {
    if (!isFishing || !user || isCatching) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // 1. Set catching state to pause the countdown and show "Catching..." text
          setIsCatching(true);

          // 2. Immediately change the animation to the hook animation
          setAnimationStates(prevStates => {
            const newStates = { ...prevStates };
            hiredCharacters.forEach((char, index) => {
              if (char.status === 'Fishing') {
                const position = dockPositions[index];
                // Only change animation for characters that are supposed to 'fish'
                if (position && position.animationType === 'fish') {
                  newStates[char.id] = 'hook';
                }
              }
            });
            return newStates;
          });
          
          // 3. Call the server to acquire items. This was the missing piece.
          processCatchesMutation.mutate(user.id);

          return 0; // Stop the countdown timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFishing, user, isCatching, hiredCharacters, processCatchesMutation]);

  // This effect runs when 'isCatching' becomes true. It waits for the duration
  // of the hook animation, then reverts the state back to normal fishing.
  useEffect(() => {
    if (!isCatching) {
      return;
    }

    // The hook animation GIF is about 1 second long. We set a timer for its duration.
    const animationTimer = setTimeout(() => {
      // Animation is complete, resume the fishing cycle
      setIsCatching(false);
      setCountdown(FISHING_COUNTDOWN);
      
      // Revert all fishing characters back to their default animation
      setAnimationStates(prevStates => {
        const revertedStates = { ...prevStates };
        hiredCharacters.forEach((char, index) => {
          if (char.status === 'Fishing') {
            const position = dockPositions[index];
            if (position) {
              revertedStates[char.id] = position.animationType;
            }
          }
        });
        return revertedStates;
      });
    }, 1000); // Wait for the animation to finish

    // Cleanup the timer if the component unmounts or if isCatching changes
    return () => clearTimeout(animationTimer);
  }, [isCatching, hiredCharacters]);

  if (!user) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Please log in to play.</div></GameLayout>;
  if (isLoadingFarm || isLoadingLevelStats || isLoadingInventory) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Loading Farm...</div></GameLayout>;
  if (isErrorFarm) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Error fetching your farm data. Please try again later.</div></GameLayout>;
  if (isErrorLevelStats) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Error fetching game configuration. Please try again later.</div></GameLayout>;

  if (!farmData || !Array.isArray(allCharacters) || !Array.isArray(hiredCharacters) || !Array.isArray(levelStats)) {
    return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Receiving unexpected data from the server.</div></GameLayout>;
  }
  
  if (allCharacters.length === 0 || levelStats.length === 0) {
    return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">No character or level data found.</div></GameLayout>;
  }

  const character = allCharacters[selectedCharacterIndex];
  
  if (!character) {
      return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Selected character not found.</div></GameLayout>;
  }

  const stats = levelStats[character.level - 1];
  const levelUpCost = character.level < 25 ? LEVEL_UP_COSTS[character.level - 1] : 'MAX';
  const numHired = allCharacters.filter((c: any) => c.hired).length;
  const hireCost = HIRE_COSTS[numHired];

  const getStorageSlots = (level: number) => {
    let slots = 30;
    if (level >= 25) slots += 5;
    if (level >= 20) slots += 5;
    if (level >= 15) slots += 5;
    if (level >= 10) slots += 5;
    if (level >= 5) slots += 10;
    return slots;
  };
  
  const totalStorageSlots = hiredCharacters.reduce((acc: number, char: any) => acc + getStorageSlots(char.level), 0);

  const handlePrevCharacter = () => setSelectedCharacterIndex((prev) => (prev === 0 ? allCharacters.length - 1 : prev - 1));
  const handleNextCharacter = () => setSelectedCharacterIndex((prev) => (prev === allCharacters.length - 1 ? 0 : prev + 1));
  
  const handleHire = () => {
    if (!user) return;
    hireMutation.mutate({ userId: user.id, characterType: character.characterType });
  };
  const handleLevelUp = () => {
    if (!user) return;
    levelUpMutation.mutate({ userId: user.id, characterType: character.characterType });
  };

  const handleStartFishing = () => {
    if (!user) return;
    startFishingMutation.mutate({ userId: user.id });
  };

  const handleStopFishing = () => {
    if (!user) return;
    stopFishingMutation.mutate({ userId: user.id });
  };

  return (
    <GameLayout
      title="🔱 Reef Tycoon"
      description="Hire characters, assign them to fishing spots, and earn rewards."
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-white">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Character Card */}
          <Card className="bg-gray-900/50 border-gray-700">
             <CardHeader>
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="icon" onClick={handlePrevCharacter} disabled={allCharacters.length <= 1}>
                  <ChevronLeftIcon className="w-6 h-6" />
                </Button>
                <CardTitle className="text-center font-bold text-xl">{character.characterType}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextCharacter} disabled={allCharacters.length <= 1}>
                  <ChevronRightIcon className="w-6 h-6" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <img
                src={character.profileImg}
                alt={character.characterType}
                className="w-24 h-24 rounded-full border-2 border-gray-600 object-cover"
              />
              {character.hired ? (
                 <>
                  <Badge className="bg-green-600/80 text-white font-semibold">Level {character.level}</Badge>
                  <div className="w-full space-y-2 text-sm pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Catch Rate:</span>
                      <span className="font-semibold text-gold-400">
                        {character
                          ? `${Math.round(
                              (5 * (character.level - 1)) / 24 + 1
                            )}/min`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Bonus Catch:</span>
                      <span className="font-semibold text-blue-400">
                        {character
                          ? `${(character.level * 0.5).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status:</span>
                      <span
                        className={`font-semibold ${
                          character.status === "Fishing"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {character.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Catch:</span>
                      <span className="font-semibold text-purple-400">
                        {character ? character.totalCatch : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full border-t border-gray-700 pt-3 mt-2 space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span>Level Up Cost:</span>
                      <span className="font-bold text-yellow-500 flex items-center gap-1">
                        {typeof levelUpCost === 'number' ? levelUpCost.toFixed(4) : levelUpCost}
                        <img src="/images/$MOBY.png" alt="$MOBY" className="w-5 h-5" />
                      </span>
                    </div>
                    <Button onClick={handleLevelUp} disabled={levelUpMutation.isPending || character.level >= 25} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg flex items-center gap-2">
                      <StarIcon className="w-5 h-5" /> {levelUpMutation.isPending ? 'Leveling up...' : 'Level Up'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">Not Hired</Badge>
                  <div className="text-lg">
                    Hire Cost: <span className="font-bold text-yellow-500">{hireCost}</span>
                    <img src="/images/coin.png" alt="coin" className="inline-block w-5 h-5 ml-1" />
                  </div>
                  <Button onClick={handleHire} disabled={hireMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg">
                    {hireMutation.isPending ? 'Hiring...' : '+ Hire Character'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* How to Play Card */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="font-bold flex items-center gap-2">
                <LightbulbIcon className="w-5 h-5 text-yellow-400" /> How to
                Play:
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                <strong className="text-base">1. Hire Characters:</strong>
                <br /> Use WhaleX coins to hire characters (1,000 → 5,000 →
                20,000 → 50,000)
              </p>
              <p>
                <strong className="text-base">2. Start Fishing:</strong>
                <br /> Click "Start Fishing" to begin the idle fishing session
              </p>
              <p>
                <strong className="text-base">3. Collect Items:</strong>
                <br /> Characters will automatically catch items every minute
              </p>
              <p>
                <strong className="text-base">4. Manage Storage:</strong>
                <br /> When storage is full, characters stop fishing automatically
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Game View with Tabs */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="flex flex-col h-[550px] rounded-lg overflow-hidden border-2 border-gray-700 bg-black">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 bg-gray-900/80">
              <button
                className={`flex-1 px-6 py-3 font-semibold focus:outline-none transition-colors ${activeTab === "dock" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                onClick={() => setActiveTab("dock")}
              >
                Dock
              </button>
              <button
                className={`flex-1 px-6 py-3 font-semibold focus:outline-none transition-colors ${activeTab === "storage" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                onClick={() => setActiveTab("storage")}
              >
                Storage ({currentStorageUsed}/{totalStorageSlots})
              </button>
              <button
                className={`flex-1 px-6 py-3 font-semibold focus:outline-none transition-colors ${activeTab === "aquapedia" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                onClick={() => setActiveTab("aquapedia")}
              >
                Aquapedia
              </button>
            </div>
            {/* Tab Content */}
            <div className="flex-1 relative">
              {activeTab === "dock" && (
                <>
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: "url('/farm/fishing/Objects/farmbg.png')" }}
                  />

                  {/* Centered Fishing Controls */}
                  {hiredCharacters.length > 0 && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                      <Button
                        onClick={isFishing ? handleStopFishing : handleStartFishing}
                        disabled={
                          isFishing
                            ? stopFishingMutation.isPending
                            : startFishingMutation.isPending || currentStorageUsed >= totalStorageSlots
                        }
                        className={`px-8 py-2 text-xl font-bold rounded-lg shadow-lg transition-all duration-200 ${
                          isFishing
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isFishing
                          ? (stopFishingMutation.isPending ? 'Stopping...' : 'STOP')
                          : (startFishingMutation.isPending ? 'Starting...' : 'START')
                        }
                      </Button>
                      {isFishing && !stopFishingMutation.isPending && (
                        <div className="text-white text-sm bg-black/50 px-2 py-1 rounded-md">
                          {isCatching ? (
                            <span className="text-yellow-400 animate-pulse">🎣 Catching...</span>
                          ) : (
                            <span>Catch in {countdown}s</span>
                          )}
                        </div>
                      )}
                      {currentStorageUsed >= totalStorageSlots && !isFishing && (
                         <div className="text-red-400 text-xs bg-black/50 px-2 py-1 rounded-md animate-pulse">
                           Storage is full!
                         </div>
                      )}
                    </div>
                  )}

                  <img
                    src="/farm/fishing/Objects/Fishing_hut.png"
                    alt="Fishing hut"
                    className="absolute w-[60%]"
                    style={{ bottom: "4%", left: "3%" }}
                  />
                  <img
                    src="/farm/fishing/Objects/Boat.png"
                    alt="Boat"
                    className="absolute w-[25%]"
                    style={{ bottom: "7%", right: "7%", zIndex: 10 }}
                  />
                  {hiredCharacters.map((char: any, index: number) => {
                    const position = dockPositions[index];
                    if (!position) return null;

                    const currentAnimationType = animationStates[char.id] || position.animationType;
                    const characterName = char.characterType.charAt(0).toUpperCase() + char.characterType.slice(1);
                    
                    let imageSrc = `/farm/fishing/Character animation/${characterName}/${characterName}_${currentAnimationType}.gif`;

                    // To force the browser to replay the GIF, we append a unique timestamp
                    // to its src each time the catch is initiated.
                    if (currentAnimationType === 'hook') {
                        imageSrc += `?t=${catchTimestamp}`;
                    }
                    
                    return (
                        <img
                            key={char.id}
                            src={imageSrc}
                            alt={`${characterName} animation`}
                            className="absolute"
                            style={position.style as React.CSSProperties}
                        />
                    );
                  })}
                </>
              )}
              {activeTab === "storage" && (
                <div className="absolute inset-0 p-4 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-yellow-400 [&::-webkit-scrollbar-thumb:hover]:bg-yellow-500">
                  <div className="grid grid-cols-10 gap-2">
                    {flattenedInventory.map((item: any) => {
                      const itemInfo = FARM_ITEMS.find(i => i.id === item.itemId);
                      if (!itemInfo) return null;
                      
                        return (
                          <div
                          key={item.uniqueDisplayId}
                            className={`w-full aspect-square bg-gray-800/50 border-2 ${
                            RARITY_BORDERS[itemInfo.rarity]
                            } rounded-md flex items-center justify-center relative group`}
                          >
                            <img
                            src={itemInfo.image}
                            alt={itemInfo.name}
                              className="w-10 h-10 object-contain"
                            />
                            <div className="absolute top-0 right-0 text-xs p-1 tracking-[-0.2em]">
                            {RARITY_LABELS[itemInfo.rarity]}
                          </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center text-xs p-1 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity">
                            {itemInfo.name}
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({ length: totalStorageSlots - flattenedInventory.length }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="w-full aspect-square bg-gray-800/50 border border-gray-700 rounded-md flex items-center justify-center"
                      >
                        {/* Empty slot */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "aquapedia" && (
                <div className="absolute inset-0 p-4 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-yellow-400 [&::-webkit-scrollbar-thumb:hover]:bg-yellow-500">
                  <div className="grid grid-cols-10 gap-2">
                    {FARM_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className={`w-full aspect-square border-2 ${
                          RARITY_BORDERS[item.rarity]
                        } rounded-md flex items-center justify-center relative group bg-black/50`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="absolute top-0 right-0 text-xs p-1 tracking-[-0.2em]">
                          {RARITY_LABELS[item.rarity]}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center text-xs p-1 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Catch History Log */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="font-bold flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-purple-400" /> Catch History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catchHistory.length === 0 ? (
                <p className="text-gray-400">Start fishing to see your recent catches here!</p>
              ) : (
                <ul className="space-y-3">
                  {catchHistory.map((caughtItem, index) => (
                    <li key={index} className="flex items-center gap-4 p-2 rounded-lg bg-gray-800/50">
                      <img src={caughtItem.profileImg} alt={caughtItem.characterType} className="w-10 h-10 rounded-full border-2 border-gray-600" />
                      <p className="text-sm">
                        <span className="font-semibold">{caughtItem.characterType}</span>
                        <span> has caught a </span>
                        <span className={`font-semibold ${RARITY_TEXT_COLORS[caughtItem.rarity] || 'text-yellow-400'}`}>{caughtItem.itemName}</span>!
                      </p>
                      <img src={caughtItem.itemImage} alt={caughtItem.itemName} className="w-10 h-10 ml-auto object-contain" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
} 

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function LightbulbIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 9 8c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}

function FishingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L12 22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

const fetchCharacters = async (userId: number) => {
  const { data } = await axios.get(`/api/farm/characters/${userId}`);
  return data;
};

const fetchLevelStats = async () => {
  const { data } = await axios.get("/api/farm/level-stats");
  return data;
};

const fetchInventory = async (userId: number) => {
  const { data } = await axios.get(`/api/farm/inventory/${userId}`);
  return data;
};

const hireCharacter = async ({ userId, characterType }: { userId: number, characterType: string }) => {
  const { data } = await axios.post('/api/farm/hire', { userId, characterType });
  return data;
};

const levelUpCharacter = async ({ userId, characterType }: { userId: number, characterType: string }) => {
  const { data } = await axios.post('/api/farm/level-up', { userId, characterType });
  return data;
};

const startFishing = async ({ userId }: { userId: number }) => {
  const { data } = await axios.post('/api/farm/start-fishing', { userId });
  return data;
};

const stopFishing = async ({ userId }: { userId: number }) => {
  const { data } = await axios.post('/api/farm/stop-fishing', { userId });
  return data;
};

const processCatches = async (userId: number) => {
  const { data } = await axios.post('/api/farm/process-catches', { userId });
  return data;
};
