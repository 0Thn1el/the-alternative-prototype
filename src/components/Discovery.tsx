import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Search, ShoppingCart, ExternalLink, Leaf, Star, DollarSign, Heart, ArrowLeftRight, Filter } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { calculateSustainabilityScore, getSustainabilityBgColor, getSustainabilityGrade } from '../utils/sustainabilityScore';

export function Discovery({ wardrobe, analyzedItem }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sustainabilityFilter, setSustainabilityFilter] = useState("all");
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [compareItems, setCompareItems] = useState([]);

  // Mock recommendation data with real brands
  const recommended_items = [
    {
      id: 1,
      name: "Recycled Cashmere Sweater",
      brand: "Everlane",
      price: 98,
      originalPrice: 145,
      rating: 4.8,
      reviews: 1245,
      sustainable: { organic: false, recycled: true, local: true },
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=400&fit=crop",
      category: "Top",
      description: "Luxuriously soft cashmere made from recycled materials",
      stores: ["Everlane", "Nordstrom", "Shopbop"],
      reason: "Matches your sustainable style preferences"
    },
    {
      id: 2,
      name: "Recycled Denim Trucker Jacket",
      brand: "Patagonia",
      price: 149,
      originalPrice: 179,
      rating: 4.6,
      reviews: 890,
      sustainable: { organic: false, recycled: true, local: true },
      image: "https://images.unsplash.com/photo-1716231683024-c85536c2dd52?w=300&h=400&fit=crop",
      category: "Outerwear",
      description: "Classic denim jacket made from recycled materials",
      stores: ["Patagonia", "REI", "Backcountry"],
      reason: "Perfect for layering with your existing pieces"
    },
    {
      id: 3,
      name: "Minimalist Leather Sneakers",
      brand: "Veja",
      price: 120,
      originalPrice: 140,
      rating: 4.7,
      reviews: 2100,
      sustainable: { organic: false, recycled: true, local: false },
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop",
      category: "Shoes",
      description: "Clean, minimal sneakers in sustainable materials",
      stores: ["Veja", "End Clothing", "SSENSE"],
      reason: "Versatile style that works with multiple outfits"
    },
    {
      id: 4,
      name: "Wool Blend Sweater",
      brand: "Allbirds",
      price: 79,
      originalPrice: 99,
      rating: 4.5,
      reviews: 650,
      sustainable: { organic: true, recycled: false, local: true },
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=400&fit=crop",
      category: "Top",
      description: "Soft wool blend sweater in a relaxed fit",
      stores: ["Allbirds", "ARKET", "Zara"],
      reason: "Adds texture variety to your wardrobe"
    },
    {
      id: 5,
      name: "Organic Cotton Tee",
      brand: "Reformation",
      price: 45,
      originalPrice: 58,
      rating: 4.9,
      reviews: 1850,
      sustainable: { organic: true, recycled: false, local: true },
      image: "https://images.unsplash.com/photo-1626496997178-7aa9d13b5799?w=300&h=400&fit=crop",
      category: "Top",
      description: "Essential organic cotton tee in classic colors",
      stores: ["Reformation", "Nordstrom", "Net-a-Porter"],
      reason: "A sustainable wardrobe staple"
    },
    {
      id: 6,
      name: "Recycled Polyester Pants",
      brand: "Pangaia",
      price: 110,
      originalPrice: 140,
      rating: 4.6,
      reviews: 780,
      sustainable: { organic: false, recycled: true, local: false },
      image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=400&fit=crop",
      category: "Bottom",
      description: "Modern pants made from recycled materials",
      stores: ["Pangaia", "Selfridges", "Farfetch"],
      reason: "Complements your existing style"
    }
  ];

  const similar_alternatives = [
    {
      id: 1,
      name: "Alternative Leather Jacket",
      brand: "AllSaints",
      price: 420,
      originalPrice: 500,
      rating: 4.9,
      reviews: 850,
      sustainability: "Standard",
      image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=300&h=400&fit=crop",
      category: "Outerwear",
      description: "Premium leather jacket with vintage finish",
      stores: ["AllSaints", "Nordstrom", "ASOS"],
      comparison: {
        price: "Higher",
        quality: "Premium",
        sustainability: "Lower",
        style: "Similar"
      }
    },
    {
      id: 2,
      name: "Vegan Leather Jacket",
      brand: "Stella McCartney",
      price: 890,
      originalPrice: 1200,
      rating: 4.6,
      reviews: 340,
      sustainability: "Vegan Materials",
      image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=300&h=400&fit=crop",
      category: "Outerwear",
      description: "Luxury vegan leather jacket with modern silhouette",
      stores: ["Stella McCartney", "Net-a-Porter", "Matches"],
      comparison: {
        price: "Much Higher",
        quality: "Luxury",
        sustainability: "Higher",
        style: "Modern"
      }
    }
  ];

  const toggleFavorite = (itemId) => {
    if (favoriteItems.includes(itemId)) {
      setFavoriteItems(favoriteItems.filter(id => id !== itemId));
    } else {
      setFavoriteItems([...favoriteItems, itemId]);
    }
  };

  const toggleCompare = (itemId) => {
    if (compareItems.includes(itemId)) {
      setCompareItems(compareItems.filter(id => id !== itemId));
    } else if (compareItems.length < 3) {
      setCompareItems([...compareItems, itemId]);
    }
  };

  const getSustainabilityBadge = (sustainability) => {
    const isEco = sustainability !== "Standard";
    return (
      <Badge 
        variant={isEco ? "default" : "secondary"}
        className={isEco ? "bg-green-100 text-green-800 border-green-200" : ""}
      >
        {isEco && <Leaf className="w-3 h-3 mr-1" />}
        {sustainability}
      </Badge>
    );
  };

  const getPriceTier = (price) => {
    if (price < 50) return "Budget";
    if (price < 150) return "Mid-range";
    return "Premium";
  };

  const filteredRecommendations = recommended_items.filter(item => {
    if (priceFilter !== "all") {
      const tier = getPriceTier(item.price);
      if (tier.toLowerCase() !== priceFilter) return false;
    }
    
    if (sustainabilityFilter === "sustainable" && item.sustainability === "Standard") {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Discovery & Shopping
          </CardTitle>
          <CardDescription>
            Discover new items that complement your style and wardrobe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="mid-range">Mid-range</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={sustainabilityFilter} onValueChange={setSustainabilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                <SelectItem value="sustainable">Sustainable Only</SelectItem>
              </SelectContent>
            </Select>

            {compareItems.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                {compareItems.length} items to compare
              </Badge>
            )}
          </div>

          {!analyzedItem && (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                Analyze a clothing item to get personalized recommendations and similar alternatives.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="similar" disabled={!analyzedItem}>
            Similar Items {!analyzedItem && "(Analyze item first)"}
          </TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-card/95 hover:bg-card shadow-lg border border-border"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Heart className={`w-4 h-4 ${favoriteItems.includes(item.id) ? "fill-current text-red-500" : "text-foreground"}`} />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium line-clamp-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.price}</p>
                        {item.originalPrice > item.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ${item.originalPrice}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="text-sm">{item.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.reviews} reviews)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {getPriceTier(item.price)}
                      </Badge>
                      {getSustainabilityBadge(item.sustainability)}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {item.reason}
                    </p>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(`https://${item.stores[0].toLowerCase().replace(' ', '')}.com`, '_blank')}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Buy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleCompare(item.id)}
                        disabled={compareItems.length >= 3 && !compareItems.includes(item.id)}
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Available at: {item.stores.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="similar" className="mt-6">
          {analyzedItem ? (
            <div className="space-y-6">
              <Alert>
                <Search className="h-4 w-4" />
                <AlertDescription>
                  Similar items to your analyzed {analyzedItem.detected_item.color} {analyzedItem.detected_item.type}
                </AlertDescription>
              </Alert>
              
              <div className="grid md:grid-cols-2 gap-6">
                {similar_alternatives.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-32 h-32 object-cover"
                      />
                      <div className="flex-1 p-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.brand}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-current text-yellow-400" />
                              <span className="text-sm">{item.rating}</span>
                            </div>
                            <div>
                              <p className="font-medium">${item.price}</p>
                              {item.originalPrice > item.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  ${item.originalPrice}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Price: </span>
                              <span className={item.comparison.price.includes('Higher') ? 'text-red-600' : 'text-green-600'}>
                                {item.comparison.price}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quality: </span>
                              <span>{item.comparison.quality}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sustainability: </span>
                              <span className={item.comparison.sustainability === 'Higher' ? 'text-green-600' : 'text-red-600'}>
                                {item.comparison.sustainability}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Style: </span>
                              <span>{item.comparison.style}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleCompare(item.id)}>
                              <ArrowLeftRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3>No item analyzed yet</h3>
              <p className="text-muted-foreground">
                Upload and analyze a clothing item to see similar alternatives and comparisons.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended_items.slice(0, 6).map((item) => (
              <Card key={`trending-${item.id}`} className="overflow-hidden">
                <div className="relative">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary">
                    Trending
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.brand}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        <span className="text-sm">{item.rating}</span>
                      </div>
                      <p className="font-medium">${item.price}</p>
                    </div>
                    <Button size="sm" className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Shop Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}