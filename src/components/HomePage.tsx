import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { ScrollingClothesSection } from './ScrollingClothesSection';
import { ItemDetailModal } from './ItemDetailModal';
import { Heart, ShoppingCart, Star, Filter, Plus, Search, Tag, Leaf, Recycle, MapPin } from "lucide-react";
import { toast } from "sonner";

export function HomePage({ wardrobe, setWardrobe }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [sustainabilityFilter, setSustainabilityFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Expanded sale items data with sustainability info
  const saleItems = [
    {
      id: 1,
      name: "Organic Silk Evening Dress",
      brand: "Reformation",
      price: 89,
      originalPrice: 149,
      rating: 4.8,
      reviews: 324,
      image: "https://images.unsplash.com/photo-1764265148862-7ee72a4fb367?w=300&h=400&fit=crop",
      category: "Dress",
      type: "Top",
      color: "Navy",
      style: "Formal",
      discount: 40,
      isOnSale: true,
      tags: ["elegant", "evening", "designer"],
      sustainable: { organic: true, recycled: false, local: false },
      materials: ["Organic Silk", "Natural Dyes"]
    },
    {
      id: 2,
      name: "Black Biker Jacket",
      brand: "Stella McCartney",
      price: 199,
      originalPrice: 299,
      rating: 4.9,
      reviews: 512,
      image: "https://images.unsplash.com/photo-1606715791286-6e43e9838f44?w=300&h=400&fit=crop",
      category: "Outerwear",
      type: "Outerwear",
      color: "Black",
      style: "Streetwear",
      discount: 33,
      isOnSale: true,
      tags: ["leather", "edgy", "premium"],
      sustainable: { organic: false, recycled: true, local: true },
      materials: ["Recycled Vegan Leather", "Organic Cotton Lining"]
    },
    {
      id: 3,
      name: "Organic Cotton Blouse",
      brand: "Patagonia",
      price: 45,
      originalPrice: 65,
      rating: 4.6,
      reviews: 289,
      image: "https://images.unsplash.com/photo-1694243382362-14da84ba6a2d?w=300&h=400&fit=crop",
      category: "Top",
      type: "Top",
      color: "White",
      style: "Casual",
      discount: 31,
      isOnSale: true,
      tags: ["comfortable", "everyday", "cotton"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["100% Organic Cotton", "Low-Impact Dyes"]
    },
    {
      id: 4,
      name: "Classic Khaki Chinos",
      brand: "Everlane",
      price: 79,
      originalPrice: 120,
      rating: 4.7,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1696889450800-e94ec7a32206?w=300&h=400&fit=crop",
      category: "Bottom",
      type: "Bottom",
      color: "Khaki",
      style: "Smart Casual",
      discount: 34,
      isOnSale: true,
      tags: ["versatile", "professional", "smart"],
      sustainable: { organic: true, recycled: true, local: true },
      materials: ["Organic Cotton", "Recycled Polyester Blend"]
    },
    {
      id: 5,
      name: "Hemp & Cork Sneakers",
      brand: "Veja",
      price: 159,
      originalPrice: 220,
      rating: 4.8,
      reviews: 423,
      image: "https://images.unsplash.com/photo-1597350584914-55bb62285896?w=300&h=400&fit=crop",
      category: "Shoes",
      type: "Shoes",
      color: "White",
      style: "Athletic",
      discount: 28,
      isOnSale: true,
      tags: ["luxury", "sport", "comfortable"],
      sustainable: { organic: true, recycled: true, local: true },
      materials: ["Hemp Canvas", "Cork Sole", "Recycled Rubber"]
    },
    {
      id: 6,
      name: "Upcycled Denim Jacket",
      brand: "Patagonia",
      price: 69,
      originalPrice: 95,
      rating: 4.5,
      reviews: 198,
      image: "https://images.unsplash.com/photo-1580644228275-2b826dbec5bf?w=300&h=400&fit=crop",
      category: "Outerwear",
      type: "Outerwear",
      color: "Blue",
      style: "Casual",
      discount: 27,
      isOnSale: true,
      tags: ["vintage", "denim", "classic"],
      sustainable: { organic: false, recycled: true, local: true },
      materials: ["Upcycled Denim", "Organic Thread"]
    },
    // Additional items for more variety
    {
      id: 7,
      name: "Bamboo Fiber T-Shirt",
      brand: "Allbirds",
      price: 25,
      originalPrice: 35,
      rating: 4.4,
      reviews: 142,
      image: "https://images.unsplash.com/photo-1545292621-377089fbcbb4?w=300&h=400&fit=crop",
      category: "Top",
      type: "Top",
      color: "Green",
      style: "Casual",
      discount: 29,
      isOnSale: true,
      tags: ["soft", "breathable", "eco"],
      sustainable: { organic: true, recycled: false, local: false },
      materials: ["Bamboo Fiber", "Natural Dyes"]
    },
    {
      id: 8,
      name: "Recycled Wool Cardigan",
      brand: "Reformation",
      price: 95,
      originalPrice: 135,
      rating: 4.7,
      reviews: 287,
      image: "https://images.unsplash.com/photo-1610765987208-06bbd5d2a1a8?w=300&h=400&fit=crop",
      category: "Top",
      type: "Top",
      color: "Grey",
      style: "Smart Casual",
      discount: 30,
      isOnSale: true,
      tags: ["warm", "cozy", "recycled"],
      sustainable: { organic: false, recycled: true, local: true },
      materials: ["Recycled Wool", "Organic Cotton Buttons"]
    },
    {
      id: 9,
      name: "Linen Midi Skirt",
      brand: "Everlane",
      price: 55,
      originalPrice: 75,
      rating: 4.6,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1678300410347-fc1accb1b19b?w=300&h=400&fit=crop",
      category: "Bottom",
      type: "Bottom",
      color: "Beige",
      style: "Casual",
      discount: 27,
      isOnSale: true,
      tags: ["flowy", "summer", "natural"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["Organic Linen", "Natural Fiber Dyes"]
    },
    {
      id: 10,
      name: "Vegan Leather Boots",
      brand: "Veja",
      price: 129,
      originalPrice: 180,
      rating: 4.5,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1638158980051-f7e67291efed?w=300&h=400&fit=crop",
      category: "Shoes",
      type: "Shoes",
      color: "Brown",
      style: "Casual",
      discount: 28,
      isOnSale: true,
      tags: ["durable", "vegan", "stylish"],
      sustainable: { organic: false, recycled: true, local: false },
      materials: ["Pineapple Leather", "Recycled Sole"]
    },
    {
      id: 11,
      name: "Tencel Dress Shirt",
      brand: "Pangaia",
      price: 85,
      originalPrice: 115,
      rating: 4.8,
      reviews: 321,
      image: "https://images.unsplash.com/photo-1667890786332-42c2cbd8d695?w=300&h=400&fit=crop",
      category: "Top",
      type: "Top",
      color: "White",
      style: "Formal",
      discount: 26,
      isOnSale: true,
      tags: ["professional", "breathable", "sustainable"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["Tencel Lyocell", "Mother of Pearl Buttons"]
    },
    {
      id: 12,
      name: "Hemp Cargo Shorts",
      brand: "Patagonia",
      price: 42,
      originalPrice: 60,
      rating: 4.3,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1759476531403-b1f88092f992?w=300&h=400&fit=crop",
      category: "Bottom",
      type: "Bottom",
      color: "Olive",
      style: "Casual",
      discount: 30,
      isOnSale: true,
      tags: ["durable", "outdoor", "functional"],
      sustainable: { organic: true, recycled: true, local: true },
      materials: ["Hemp Canvas", "Recycled Polyester Pockets"]
    }
  ];

  const toggleFavorite = (itemId) => {
    if (favoriteItems.includes(itemId)) {
      setFavoriteItems(favoriteItems.filter(id => id !== itemId));
    } else {
      setFavoriteItems([...favoriteItems, itemId]);
    }
  };

  const addToWardrobe = (item) => {
    const wardrobeItem = {
      id: Date.now(),
      item: item.name,
      type: item.type,
      color: item.color,
      style: item.style,
      image: item.image,
      customTags: item.tags,
      brand: item.brand,
      price: item.price,
      fabric: item.materials ? item.materials.join(', ') : '',
      materials: item.materials || [],
      sustainable: item.sustainable || { organic: false, recycled: false, local: false },
      isOwned: true,
      isFavorite: false,
      description: item.description || ''
    };
    setWardrobe([...wardrobe, wardrobeItem]);
    toast.success(`${item.name} added to your wardrobe!`);
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const filteredItems = saleItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.brand.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (styleFilter !== "all" && item.style !== styleFilter) return false;
    if (brandFilter !== "all" && item.brand !== brandFilter) return false;
    if (sustainabilityFilter !== "all") {
      if (sustainabilityFilter === "organic" && !item.sustainable.organic) return false;
      if (sustainabilityFilter === "recycled" && !item.sustainable.recycled) return false;
      if (sustainabilityFilter === "local" && !item.sustainable.local) return false;
    }
    if (priceFilter !== "all") {
      const maxPrice = priceFilter === "under50" ? 50 : priceFilter === "50to100" ? 100 : priceFilter === "100to200" ? 200 : Infinity;
      const minPrice = priceFilter === "50to100" ? 50 : priceFilter === "100to200" ? 100 : priceFilter === "over200" ? 200 : 0;
      if (item.price < minPrice || item.price > maxPrice) return false;
    }
    return true;
  });

  const getSustainabilityIcons = (sustainable) => {
    const icons = [];
    if (sustainable.organic) {
      icons.push(<Leaf key="organic" className="w-3 h-3 text-green-600" />);
    }
    if (sustainable.recycled) {
      icons.push(<Recycle key="recycled" className="w-3 h-3 text-blue-600" />);
    }
    if (sustainable.local) {
      icons.push(<MapPin key="local" className="w-3 h-3 text-purple-600" />);
    }
    return icons;
  };

  const getUniqueBrands = () => {
    return [...new Set(saleItems.map(item => item.brand))].sort();
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 md:p-8 text-center border border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Sustainable Fashion Sale
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-foreground/80 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Discover eco-friendly fashion with up to 40% off! Organic, recycled, and locally-made pieces.
        </motion.p>
        <motion.div 
          className="flex flex-wrap justify-center gap-2 md:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { icon: Leaf, text: "Organic Materials", color: "green" },
            { icon: Recycle, text: "Recycled Fabrics", color: "blue" },
            { icon: MapPin, text: "Local Production", color: "purple" }
          ].map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                variant="secondary" 
                className={`text-sm md:text-lg px-3 md:px-4 py-1 md:py-2 bg-${badge.color}-100 dark:bg-${badge.color}-900/30 text-${badge.color}-800 dark:text-${badge.color}-300 border border-${badge.color}-200 dark:border-${badge.color}-800 cursor-default`}
              >
                <badge.icon className="w-4 h-4 mr-1" />
                {badge.text}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scrolling Clothes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <ScrollingClothesSection />
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Filter className="w-5 h-5" />
              </motion.div>
              Find Your Perfect Style
            </CardTitle>
            <CardDescription>
              Browse our curated collection and add items to your virtual wardrobe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              <div className="relative sm:col-span-2 xl:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-transform hover:scale-110" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Top">Tops</SelectItem>
                  <SelectItem value="Bottom">Bottoms</SelectItem>
                  <SelectItem value="Outerwear">Outerwear</SelectItem>
                  <SelectItem value="Shoes">Shoes</SelectItem>
                  <SelectItem value="Dress">Dresses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Streetwear">Streetwear</SelectItem>
                  <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                  <SelectItem value="Athletic">Athletic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {getUniqueBrands().map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sustainabilityFilter} onValueChange={setSustainabilityFilter}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                  <SelectValue placeholder="Sustainability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="organic">Organic Only</SelectItem>
                  <SelectItem value="recycled">Recycled Only</SelectItem>
                  <SelectItem value="local">Local Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under50">Under $50</SelectItem>
                  <SelectItem value="50to100">$50 - $100</SelectItem>
                  <SelectItem value="100to200">$100 - $200</SelectItem>
                  <SelectItem value="over200">Over $200</SelectItem>
                </SelectContent>
              </Select>

              <motion.div 
                className="text-sm text-muted-foreground flex items-center justify-center xl:justify-start"
                key={filteredItems.length}
                initial={{ scale: 1.2, color: "rgb(34 197 94)" }}
                animate={{ scale: 1, color: "inherit" }}
                transition={{ duration: 0.3 }}
              >
                {filteredItems.length} items found
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sale Items Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 h-full">
                <div className="relative overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 sm:h-56 md:h-64 object-cover cursor-pointer"
                      onClick={() => openItemDetail(item)}
                    />
                  </motion.div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      <Badge variant="destructive" className="bg-red-500 text-xs shadow-lg">
                        -{item.discount}%
                      </Badge>
                    </motion.div>
                    {(item.sustainable.organic || item.sustainable.recycled || item.sustainable.local) && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs shadow-lg">
                          <Leaf className="w-3 h-3 mr-1" />
                          Eco
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-card/95 hover:bg-card shadow-lg border border-border w-8 h-8 p-0 transition-all duration-200"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      <motion.div
                        animate={favoriteItems.includes(item.id) ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart className={`w-4 h-4 transition-all duration-300 ${favoriteItems.includes(item.id) ? "fill-current text-red-500" : "text-foreground"}`} />
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
                
                <CardContent className="p-3 md:p-4">
                  <div className="space-y-2 md:space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.4 }}
                    >
                      <h3 className="font-semibold line-clamp-1 text-sm md:text-base">{item.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.brand}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.5 }}
                    >
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 md:w-4 md:h-4 fill-current text-yellow-400" />
                        <span className="text-xs md:text-sm font-medium">{item.rating}</span>
                        <span className="text-xs text-muted-foreground">({item.reviews})</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm md:text-lg text-green-600">${item.price}</p>
                        <p className="text-xs md:text-sm text-muted-foreground line-through">${item.originalPrice}</p>
                      </div>
                    </motion.div>

                    {/* Sustainability Info */}
                    <motion.div 
                      className="flex items-center gap-1 flex-wrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.6 }}
                    >
                      <span className="text-xs text-muted-foreground">Sustainable:</span>
                      {getSustainabilityIcons(item.sustainable)}
                      {item.sustainable.organic && (
                        <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 hover:scale-105 transition-transform">
                          Organic
                        </Badge>
                      )}
                      {item.sustainable.recycled && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform">
                          Recycled
                        </Badge>
                      )}
                      {item.sustainable.local && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform">
                          Local
                        </Badge>
                      )}
                    </motion.div>

                    {/* Materials */}
                    <motion.div 
                      className="text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.7 }}
                    >
                      <span className="font-medium">Materials:</span> {item.materials.join(', ')}
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-1 md:gap-2 flex-wrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.8 }}
                    >
                      <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                        {item.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                        {item.color}
                      </Badge>
                      {item.tags.slice(0, 1).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs hover:scale-105 transition-transform">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </motion.div>

                    <motion.div 
                      className="flex flex-col sm:flex-row gap-2 pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.9 }}
                    >
                      <motion.div 
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button size="sm" className="w-full text-xs md:text-sm transition-all duration-200 hover:shadow-md">
                          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          Buy Now
                        </Button>
                      </motion.div>
                      <motion.div 
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs md:text-sm transition-all duration-200 hover:shadow-md"
                          onClick={() => addToWardrobe(item)}
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          Add to Wardrobe
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardContent className="text-center py-12">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria to find more items.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToWardrobe={addToWardrobe}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedItem ? favoriteItems.includes(selectedItem.id) : false}
      />
    </motion.div>
  );
}