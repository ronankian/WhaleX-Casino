import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Coins, Users, Star, Gamepad2 } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Provably Fair Gaming",
      description: "Every game outcome is verifiable and transparent, ensuring complete fairness for all players."
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Instant Transactions",
      description: "Lightning-fast deposits and withdrawals with no waiting times or hidden fees."
    },
    {
      icon: <Coins className="h-8 w-8 text-white" />,
      title: "Dual Token System",
      description: "Earn both WhaleX Coins for gaming rewards and $MOBY tokens for cryptocurrency benefits."
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Community Driven",
      description: "Built by players, for players. Your feedback shapes our platform's future."
    },
    {
      icon: <Star className="h-8 w-8 text-white" />,
      title: "Premium Experience",
      description: "Luxury gaming interface with smooth animations and professional design."
    },
    {
      icon: <Gamepad2 className="h-8 w-8 text-white" />,
      title: "Diverse Game Collection",
      description: "From classic casino games to innovative crypto gaming experiences."
    }
  ];

  const team = [
    {
      name: "WhaleX Team",
      role: "Development Team",
      description: "Dedicated to creating the ultimate crypto gaming experience."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
          About WhaleX Casino
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          WhaleX Casino is a revolutionary crypto gaming platform that combines the thrill of traditional casino games 
          with the innovation of blockchain technology. Our mission is to provide a secure, fair, and entertaining 
          gaming experience for crypto enthusiasts worldwide.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-16">
        <Card className="glass-card border-gold-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-gold-400">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-lg leading-relaxed">
              At WhaleX Casino, we believe that gaming should be accessible, fair, and rewarding for everyone. 
              By leveraging blockchain technology, we've created a platform where players can enjoy their favorite 
              casino games while earning real cryptocurrency rewards. Our commitment to transparency, security, 
              and innovation drives everything we do.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">Why Choose WhaleX Casino?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card border-gold-500/20 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="glass-card border-gold-500/20 text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-xl text-white">{member.name}</CardTitle>
                <CardDescription className="text-gold-400">{member.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">{member.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="text-center">
        <Card className="glass-card border-gold-500/20 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-gold-400">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-6">
              Have questions or suggestions? We'd love to hear from you!
            </p>
            <div className="space-y-4">
              <p className="text-gray-300">
                <strong>Email:</strong> support@whalexcasino.com
              </p>
              <p className="text-gray-300">
                <strong>Discord:</strong> Join our community server
              </p>
              <p className="text-gray-300">
                <strong>Twitter:</strong> @WhaleXCasino
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 