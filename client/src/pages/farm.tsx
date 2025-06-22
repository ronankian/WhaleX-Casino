import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import React, { useState } from "react";
import GameLayout from "../components/games/game-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";

const LEVEL_UP_COSTS = [
  0.0100, 0.0150, 0.0225, 0.0325, 0.0450, 0.0600, 0.0775, 0.0975, 0.1200, 0.1450,
  0.1725, 0.2025, 0.2350, 0.2700, 0.3075, 0.3475, 0.3900, 0.4350, 0.4825, 0.5325,
  0.5850, 0.6400, 0.6975, 0.7575,
];

const HIRE_COSTS = [1000, 5000, 20000, 50000];

export default function FarmPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dock");
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);

  const { data: characters = [], isLoading: isLoadingCharacters, isError: isErrorCharacters } = useQuery({
    queryKey: ["farmCharacters", user?.id],
    queryFn: () => fetchCharacters(user!.id),
    enabled: !!user,
  });

  const { data: levelStats = [], isLoading: isLoadingLevelStats, isError: isErrorLevelStats } = useQuery({
    queryKey: ["levelStats"],
    queryFn: fetchLevelStats,
  });

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
  
  if (!user) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Please log in to play.</div></GameLayout>;
  if (isLoadingCharacters || isLoadingLevelStats) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Loading Farm...</div></GameLayout>;
  if (isErrorCharacters) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Error fetching your farm data. Please try again later.</div></GameLayout>;
  if (isErrorLevelStats) return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Error fetching game configuration. Please try again later.</div></GameLayout>;

  if (!Array.isArray(characters) || !Array.isArray(levelStats)) {
    return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Receiving unexpected data from the server.</div></GameLayout>;
  }
  
  if (characters.length === 0 || levelStats.length === 0) {
    return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">No character or level data found.</div></GameLayout>;
  }

  const character = characters[selectedCharacterIndex];
  
  if (!character) {
      return <GameLayout title="🎣 Reef Tycoon" description="..."><div className="text-white">Selected character not found.</div></GameLayout>;
  }

  const stats = levelStats[character.level - 1];
  const levelUpCost = character.level < 25 ? LEVEL_UP_COSTS[character.level - 1] : 'MAX';
  const numHired = characters.filter((c: any) => c.hired).length;
  const hireCost = HIRE_COSTS[numHired];

  const getStorageSlots = (level: number) => 30 + (Math.floor((level -1) / 5) * 5);
  
  const handlePrevCharacter = () => setSelectedCharacterIndex((prev) => (prev === 0 ? characters.length - 1 : prev - 1));
  const handleNextCharacter = () => setSelectedCharacterIndex((prev) => (prev === characters.length - 1 ? 0 : prev + 1));
  
  const handleHire = () => {
    if (!user) return;
    hireMutation.mutate({ userId: user.id, characterType: character.name });
  };
  const handleLevelUp = () => {
    if (!user) return;
    levelUpMutation.mutate({ userId: user.id, characterType: character.name });
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
                <Button variant="ghost" size="icon" onClick={handlePrevCharacter} disabled={characters.length <= 1}>
                  <ChevronLeftIcon className="w-6 h-6" />
                </Button>
                <CardTitle className="text-center font-bold text-xl">{character.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextCharacter} disabled={characters.length <= 1}>
                  <ChevronRightIcon className="w-6 h-6" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <img
                src={character.profileImg}
                alt={character.name}
                className="w-24 h-24 rounded-full border-2 border-gray-600 object-cover"
              />
              {character.hired ? (
                 <>
                  <Badge className="bg-green-600/80 text-white font-semibold">Level {character.level}</Badge>
                  <div className="w-full space-y-2 text-sm pt-2">
                    <div className="flex justify-between"><span>Catch Rate:</span> <span className="font-bold text-green-400">{stats?.fishPerMin}/min</span></div>
                    <div className="flex justify-between"><span>Bonus Chance:</span> <span className="font-bold text-green-400">{stats?.bonusChance.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Storage:</span> <span className="font-bold">0/{getStorageSlots(character.level)}</span></div>
                    <div className="flex justify-between"><span>Status:</span> <span className="font-bold text-yellow-400">{character.status}</span></div>
                    <div className="flex justify-between"><span>Total Catch:</span> <span className="font-bold">{character.totalCatch}</span></div>
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
                <strong className="text-base">2. Assign to Spots:</strong>
                <br /> Click blue + buttons to assign hired characters to
                fishing spots
              </p>
              <p>
                <strong className="text-base">3. Start Fishing:</strong>
                <br /> Click "Start Fishing" to begin the idle fishing session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Game View with Tabs */}
        <div className="lg:col-span-3 flex flex-col h-[550px] rounded-lg overflow-hidden border-2 border-gray-700 bg-black">
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
              Storage
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
                <img
                  src="/farm/fishing/Objects/Fishing_hut.png"
                  alt="Fishing hut"
                  className="absolute w-[60%]"
                  style={{ bottom: "4%", left: "3%" }}
                />
                <img
                  src="/farm/fishing/Objects/Boat.png"
                  alt="Boat"
                  className="absolute w-[23%]"
                  style={{ bottom: "7%", right: "7%" }}
                />
                <img
                  src="/farm/fishing/Character animation/Fisherman/Fisherman_fish.gif"
                  alt="Fisherman fishing"
                  className="absolute w-[15%]"
                  style={{ bottom: "15%", left: "17%" }}
                />
                                <img
                  src="/farm/fishing/Character animation/Fisherman/Fisherman_fish.gif"
                  alt="Fisherman fishing"
                  className="absolute w-[15%]"
                  style={{ bottom: "28%", right: "32%" }}
                />
              </>
            )}
            {activeTab === "storage" && (
              <div className="flex items-center justify-center h-full text-2xl text-gray-300">
                Storage content goes here (show storage and items).
              </div>
            )}
            {activeTab === "aquapedia" && (
              <div className="flex items-center justify-center h-full text-2xl text-gray-300">
                Aquapedia content goes here (show caught items).
              </div>
            )}
          </div>
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

const fetchCharacters = async (userId: number) => {
  const { data } = await axios.get(`/api/farm/characters/${userId}`);
  return data;
};

const fetchLevelStats = async () => {
  const { data } = await axios.get("/api/farm/level-stats");
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
