import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Leaf, Recycle, MapPin } from "lucide-react";

export function ScrollingClothesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const featuredItems = [
    {
      id: 1,
      name: "Organic Cotton Tee",
      brand: "EcoWear",
      price: 35,
      originalPrice: 45,
      image: "https://images.unsplash.com/photo-1675239514439-1c128b0cffcd?w=300&h=400&fit=crop",
      sustainable: { organic: true, recycled: false, local: true }
    },
    {
      id: 2,
      name: "Recycled Denim Trucker Jacket",
      brand: "Patagonia",
      price: 89,
      originalPrice: 120,
      image: "https://images.unsplash.com/photo-1587761383903-4ed7d428e746?w=300&h=400&fit=crop",
      sustainable: { organic: false, recycled: true, local: false }
    },
    {
      id: 3,
      name: "Wool Runner Sneakers",
      brand: "Allbirds",
      price: 75,
      originalPrice: 95,
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop",
      sustainable: { organic: true, recycled: true, local: true }
    },
    {
      id: 4,
      name: "Bamboo Fiber Dress",
      brand: "SustainStyle",
      price: 65,
      originalPrice: 85,
      image: "https://images.unsplash.com/photo-1602303894456-398ce544d90b?w=300&h=400&fit=crop",
      sustainable: { organic: true, recycled: false, local: false }
    },
    {
      id: 5,
      name: "Organic Cotton Hoodie",
      brand: "Patagonia",
      price: 95,
      originalPrice: 130,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop",
      sustainable: { organic: true, recycled: false, local: true }
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredItems.length);
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [featuredItems.length]);

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

  return (
    <div className="w-full overflow-hidden bg-black rounded-lg p-6 border border-white/10">
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h3 
          className="text-2xl font-bold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Sustainable Spotlight
        </motion.h3>
        <motion.p 
          className="text-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Featured eco-friendly fashion pieces
        </motion.p>
      </motion.div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <motion.div 
                  className="md:w-1/3 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageWithFallback
                    src={featuredItems[currentIndex].image}
                    alt={featuredItems[currentIndex].name}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </motion.div>
                <CardContent className="md:w-2/3 p-6 flex flex-col justify-center">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <h4 className="text-xl font-semibold">{featuredItems[currentIndex].name}</h4>
                      <p className="text-sm text-muted-foreground">{featuredItems[currentIndex].brand}</p>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <motion.span 
                        className="text-2xl font-bold text-green-600"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        ${featuredItems[currentIndex].price}
                      </motion.span>
                      <span className="text-lg text-muted-foreground line-through">${featuredItems[currentIndex].originalPrice}</span>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Badge variant="destructive" className="bg-green-500 hover:bg-green-600">
                          Save ${featuredItems[currentIndex].originalPrice - featuredItems[currentIndex].price}
                        </Badge>
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-2 flex-wrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <span className="text-sm font-medium text-muted-foreground">Sustainable:</span>
                      <motion.div 
                        className="flex gap-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                      >
                        {getSustainabilityIcons(featuredItems[currentIndex].sustainable)}
                      </motion.div>
                      {featuredItems[currentIndex].sustainable.organic && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                            Organic
                          </Badge>
                        </motion.div>
                      )}
                      {featuredItems[currentIndex].sustainable.recycled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.65 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Recycled
                          </Badge>
                        </motion.div>
                      )}
                      {featuredItems[currentIndex].sustainable.local && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Local
                          </Badge>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <motion.div 
          className="flex justify-center space-x-2 mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {featuredItems.map((_, index) => (
            <motion.button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              animate={index === currentIndex ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}