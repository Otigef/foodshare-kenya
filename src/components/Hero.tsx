import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-foodshare.jpg";
import mealSharing1 from "@/assets/meal-sharing-1.jpg";
import mealSharing2 from "@/assets/meal-sharing-2.jpg";

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [heroImage, mealSharing1, mealSharing2];
  const imageDescriptions = [
    "Community sharing food in Kenya",
    "Kenyan family sharing a meal together",
    "Children enjoying shared meals outdoors"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Content */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Share Food,
                <span className="text-primary block">Share Hope</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Connect surplus food with those who need it most. Join Kenya's movement to end hunger and reduce food waste.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/auth'}
              >
                Start Sharing Food
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/auth'}
              >
                Find Food Nearby
              </Button>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-primary">12K+</div>
                <div className="text-sm text-muted-foreground">Meals Shared</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-secondary">500+</div>
                <div className="text-sm text-muted-foreground">Families Helped</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-accent">2.5T</div>
                <div className="text-sm text-muted-foreground">Waste Reduced</div>
              </div>
            </div>
          </div>

          {/* Hero Image with Animation */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-card">
              <div className="relative w-full h-[500px]">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={imageDescriptions[index]}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Cards */}
            <Card className="absolute -top-4 -left-4 p-4 bg-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Zero Hunger</div>
                  <div className="text-sm text-muted-foreground">SDG Goal 2</div>
                </div>
              </div>
            </Card>

            <Card className="absolute -bottom-4 -right-4 p-4 bg-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Leaf className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Sustainable</div>
                  <div className="text-sm text-muted-foreground">Food System</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Easy Connection</h3>
            <p className="text-muted-foreground">Connect donors and recipients instantly through our smart matching system.</p>
          </Card>

          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-secondary/10 rounded-full w-fit mx-auto">
              <Leaf className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Reduce Waste</h3>
            <p className="text-muted-foreground">Turn surplus food into hope for families in need across Kenya.</p>
          </Card>

          <Card className="p-6 text-center space-y-4 shadow-soft hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-accent/10 rounded-full w-fit mx-auto">
              <Heart className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Community Impact</h3>
            <p className="text-muted-foreground">Track your positive impact on the community and environment.</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;