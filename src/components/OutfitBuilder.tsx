import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Heart, Share2, ShoppingCart, Filter, Sparkles, Leaf, DollarSign, Award } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { calculateSustainabilityScore, getSustainabilityGrade, getSustainabilityBgColor } from '../utils/sustainabilityScore';

export function OutfitBuilder({ analyzedItem, wardrobe }) {
  const [priceFilter, setPriceFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [sustainabilityFilter, setSustainabilityFilter] = useState("all");
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [favoriteOutfits, setFavoriteOutfits] = useState([]);

  // Generate outfits from wardrobe items
  const generateOutfitsFromWardrobe = () => {
    const tops = wardrobe.filter(item => item.type === "Top");
    const bottoms = wardrobe.filter(item => item.type === "Bottom");
    const shoes = wardrobe.filter(item => item.type === "Shoes");
    const outerwear = wardrobe.filter(item => item.type === "Outerwear");

    const generatedOutfits = [];

    // Generate casual outfits
    if (tops.length > 0 && bottoms.length > 0 && shoes.length > 0) {
      const casualTop = tops.find(t => t.style === "Casual") || tops[0];
      const casualBottom = bottoms.find(b => b.style === "Casual") || bottoms[0];
      const casualShoes = shoes[0];
      
      const pieces = [casualTop, casualBottom, casualShoes];
      const outfitScore = Math.round(pieces.reduce((sum, p) => sum + (p.sustainabilityScore || calculateSustainabilityScore(p.sustainable)), 0) / pieces.length);
      
      generatedOutfits.push({
        category: "Everyday Casual",
        pieces: pieces.map(p => ({
          item: p.item,
          source: "Your Wardrobe",
          image: p.image,
          brand: p.brand,
          price: p.price,
          sustainabilityScore: p.sustainabilityScore || calculateSustainabilityScore(p.sustainable)
        })),
        reasoning: "A comfortable everyday look using items from your wardrobe. Perfect for casual outings.",
        totalPrice: "$0",
        sustainabilityScore: outfitScore
      });
    }

    // Generate smart casual outfit
    const smartTops = tops.filter(t => t.style === "Smart Casual");
    const smartBottoms = bottoms.filter(b => b.style === "Smart Casual");
    
    if (smartTops.length > 0 && smartBottoms.length > 0 && shoes.length > 0) {
      const pieces = [smartTops[0], smartBottoms[0], shoes[0]];
      const outfitScore = Math.round(pieces.reduce((sum, p) => sum + (p.sustainabilityScore || calculateSustainabilityScore(p.sustainable)), 0) / pieces.length);
      
      generatedOutfits.push({
        category: "Professional Smart",
        pieces: pieces.map(p => ({
          item: p.item,
          source: "Your Wardrobe",
          image: p.image,
          brand: p.brand,
          price: p.price,
          sustainabilityScore: p.sustainabilityScore || calculateSustainabilityScore(p.sustainable)
        })),
        reasoning: "A polished professional look using your existing wardrobe items.",
        totalPrice: "$0",
        sustainabilityScore: outfitScore
      });
    }

    // Add outfit with recommendations for missing pieces
    if (tops.length > 0 && bottoms.length > 0) {
      const recommendedJacket = {
        item: "Sustainable Denim Jacket",
        source: "Recommended - Patagonia",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop",
        brand: "Patagonia",
        price: 149,
        isRecommendation: true,
        sustainabilityScore: 85
      };
      
      const pieces = [tops[0], bottoms[0], recommendedJacket];
      const outfitScore = Math.round(pieces.reduce((sum, p) => sum + p.sustainabilityScore, 0) / pieces.length);
      
      generatedOutfits.push({
        category: "Layered Style",
        pieces: [
          { ...tops[0], item: tops[0].item, source: "Your Wardrobe", image: tops[0].image, brand: tops[0].brand, price: tops[0].price, sustainabilityScore: tops[0].sustainabilityScore || calculateSustainabilityScore(tops[0].sustainable) },
          { ...bottoms[0], item: bottoms[0].item, source: "Your Wardrobe", image: bottoms[0].image, brand: bottoms[0].brand, price: bottoms[0].price, sustainabilityScore: bottoms[0].sustainabilityScore || calculateSustainabilityScore(bottoms[0].sustainable) },
          recommendedJacket
        ],
        reasoning: "Complete this outfit with a sustainable jacket. Uses your existing pieces as a base.",
        totalPrice: "$149",
        sustainabilityScore: outfitScore,
        hasRecommendations: true
      });
    }

    return generatedOutfits;
  };

  const mockOutfits = generateOutfitsFromWardrobe();

  const getCategoryIcon = (category) => {
    if (category.includes("Budget")) return <DollarSign className="w-4 h-4" />;
    if (category.includes("Sustainable")) return <Leaf className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    if (category.includes("Budget")) return "bg-green-100 text-green-800 border-green-200";
    if (category.includes("Sustainable")) return "bg-green-100 text-green-800 border-green-200";
    return "bg-purple-100 text-purple-800 border-purple-200";
  };

  const saveOutfit = (outfitIndex) => {
    if (!savedOutfits.includes(outfitIndex)) {
      setSavedOutfits([...savedOutfits, outfitIndex]);
    }
  };

  const toggleFavorite = (outfitIndex) => {
    if (favoriteOutfits.includes(outfitIndex)) {
      setFavoriteOutfits(favoriteOutfits.filter(i => i !== outfitIndex));
    } else {
      setFavoriteOutfits([...favoriteOutfits, outfitIndex]);
    }
  };

  const shareOutfit = (outfit) => {
    const summary = `Check out this ${outfit.category} outfit: ${outfit.pieces.map(p => p.item).join(', ')}`;
    navigator.clipboard.writeText(summary);
    // In a real app, this would share via social media or generate a shareable link
  };

  const filteredOutfits = mockOutfits.filter(outfit => {
    if (sustainabilityFilter === "sustainable" && outfit.sustainabilityScore < 70) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Outfit Builder
          </CardTitle>
          <CardDescription>
            AI-generated outfit suggestions based on your wardrobe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Select value={sustainabilityFilter} onValueChange={setSustainabilityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outfits</SelectItem>
                  <SelectItem value="sustainable">High Sustainability</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert className="mb-6">
            <Leaf className="h-4 w-4" />
            <AlertDescription>
              Outfits are generated from your wardrobe items with sustainable recommendations for missing pieces.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredOutfits.map((outfit, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryIcon(outfit.category)}
                  <CardTitle className="text-lg">{outfit.category}</CardTitle>
                  <Badge className={getSustainabilityBgColor(outfit.sustainabilityScore)}>
                    <Award className="w-3 h-3 mr-1" />
                    {getSustainabilityGrade(outfit.sustainabilityScore)} - {outfit.sustainabilityScore}/100
                  </Badge>
                  {outfit.hasRecommendations && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Has Recommendations
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(index)}
                    className={favoriteOutfits.includes(index) ? "text-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 ${favoriteOutfits.includes(index) ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareOutfit(outfit)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{outfit.reasoning}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {outfit.pieces.map((piece, pieceIndex) => (
                  <div key={pieceIndex} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {piece.image ? (
                        <ImageWithFallback
                          src={piece.image}
                          alt={piece.item}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{piece.item}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {piece.brand || piece.source}
                        </p>
                        {piece.sustainabilityScore && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            <Leaf className="w-3 h-3 mr-1" />
                            Score: {piece.sustainabilityScore}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {piece.source === "Your Wardrobe" ? (
                        <Badge variant="secondary">In Wardrobe</Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                          <ShoppingCart className="w-3 h-3" />
                          ${piece.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}</div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {outfit.totalPrice === "$0" ? (
                    "All items from your wardrobe"
                  ) : (
                    `Add missing items for ${outfit.totalPrice}`
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => saveOutfit(index)}
                    disabled={savedOutfits.includes(index)}
                    className="flex-1 sm:flex-none"
                  >
                    {savedOutfits.includes(index) ? "Saved" : "Save Outfit"}
                  </Button>
                  {outfit.hasRecommendations && (
                    <Button size="sm" className="flex-1 sm:flex-none">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Shop Items
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOutfits.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No outfits match your current filters. Try adjusting your criteria or add more items to your wardrobe.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}