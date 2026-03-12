import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { ImageAnalysis } from './components/ImageAnalysis';
import { OutfitBuilder } from './components/OutfitBuilder';
import { EnhancedWardrobe } from './components/EnhancedWardrobe';
import { Discovery } from './components/Discovery';
import { Settings } from './components/Settings';
import { Cart } from './components/Cart';
import { Profile } from './components/Profile';
import { Toaster } from "./components/ui/sonner";
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';



type User = {
  email: string;
  // add additional fields as needed
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [wardrobe, setWardrobe] = useState([
    { 
      id: 1, 
      item: "Organic Cotton Hoodie", 
      type: "Top", 
      color: "Grey", 
      style: "Casual",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop",
      customTags: ["comfortable", "everyday"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["Organic Cotton"],
      brand: "Patagonia",
      price: 85,
      fabric: "100% Organic Cotton",
      isOwned: true,
      isFavorite: false,
      description: "Comfortable everyday hoodie made from organic cotton",
      sustainabilityScore: 85
    },
    { 
      id: 2, 
      item: "Classic Blue Denim Jeans", 
      type: "Bottom", 
      color: "Blue", 
      style: "Casual",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop",
      customTags: ["versatile", "classic"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["Organic Denim"],
      brand: "Everlane",
      price: 120,
      fabric: "100% Organic Denim",
      isOwned: true,
      isFavorite: true,
      description: "Classic fit jeans made from locally sourced organic denim",
      sustainabilityScore: 85
    },
    { 
      id: 3, 
      item: "Wool Runner Sneakers", 
      type: "Shoes", 
      color: "White", 
      style: "Casual",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop",
      customTags: ["comfortable", "daily"],
      sustainable: { organic: false, recycled: true, local: false },
      materials: ["Merino Wool", "Recycled Materials"],
      brand: "Allbirds",
      price: 95,
      fabric: "Merino Wool & Recycled Materials",
      isOwned: true,
      isFavorite: false,
      description: "Sustainable sneakers made from natural materials",
      sustainabilityScore: 82
    },
    { 
      id: 4, 
      item: "Organic Cotton Flannel Shirt", 
      type: "Top", 
      color: "Red", 
      style: "Casual",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=400&fit=crop",
      customTags: ["cozy", "autumn"],
      sustainable: { organic: true, recycled: false, local: true },
      materials: ["Organic Cotton Flannel"],
      brand: "Patagonia",
      price: 78,
      fabric: "100% Organic Cotton Flannel",
      isOwned: false,
      isFavorite: true,
      description: "Cozy flannel shirt perfect for autumn weather",
      sustainabilityScore: 80
    },
    { 
      id: 5, 
      item: "Sustainable Chino Pants", 
      type: "Bottom", 
      color: "Beige", 
      style: "Smart Casual",
      image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=400&fit=crop",
      customTags: ["smart", "professional"],
      sustainable: { organic: true, recycled: true, local: false },
      materials: ["Organic Cotton", "Recycled Polyester"],
      brand: "Reformation",
      price: 89,
      fabric: "Organic Cotton & Recycled Polyester Blend",
      isOwned: true,
      isFavorite: false,
      description: "Versatile chinos perfect for professional settings",
      sustainabilityScore: 90
    }
  ]);
  
  const [cart, setCart] = useState([
    {
      id: 1,
      name: "Organic Cotton T-Shirt",
      brand: "Everlane",
      price: 28,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop",
      quantity: 1,
      size: "M",
      color: "White",
      sustainable: { organic: true, recycled: false, local: true }
    },
    {
      id: 2,
      name: "Recycled Denim Jeans",
      brand: "Everlane",
      price: 98,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop",
      quantity: 1,
      size: "32",
      color: "Blue",
      sustainable: { organic: false, recycled: true, local: false }
    },
    {
      id: 3,
      name: "Wool Runner Sneakers",
      brand: "Allbirds",
      price: 95,
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop",
      quantity: 1,
      size: "9",
      color: "White",
      sustainable: { organic: false, recycled: true, local: false }
    }
  ]);

  const [wardrobes, setWardrobes] = useState([
    { id: 1, name: "Main Wardrobe", items: wardrobe },
    { id: 2, name: "Work Outfits", items: [] },
    { id: 3, name: "Weekend Casual", items: [] }
  ]);
  
  const [analyzedItem, setAnalyzedItem] = useState(null);

  // Sync dark mode with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage wardrobe={wardrobe} setWardrobe={setWardrobe} />;
      case 'analyze':
        return <ImageAnalysis onAnalysisComplete={setAnalyzedItem} wardrobe={wardrobe} />;
      case 'outfits':
        return <OutfitBuilder analyzedItem={analyzedItem} wardrobe={wardrobe} />;
      case 'wardrobe':
        return <EnhancedWardrobe 
          wardrobe={wardrobe} 
          setWardrobe={setWardrobe} 
          wardrobes={wardrobes}
          setWardrobes={setWardrobes}
          analyzedItem={analyzedItem} 
        />;
      case 'discover':
        return <Discovery wardrobe={wardrobe} analyzedItem={analyzedItem} />;
      case 'settings':
        return <Settings 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />;
      case 'cart':
        return <Cart cart={cart} setCart={setCart} />;
      case 'profile':
        return <Profile />;
      default:
        return <HomePage wardrobe={wardrobe} setWardrobe={setWardrobe} />;
    }
  };

  

  const pageVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3
      }
    }
  };


  if (!user) {
    if (authMode === 'signin') {
      return (
        <SignIn
          onSuccess={setUser}
          onSwitchToSignUp={() => setAuthMode('signup')}
        />
      );
    } else {
      return (
        <SignUp
          onSuccess={setUser}
          onSwitchToSignIn={() => setAuthMode('signin')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} cartCount={cart.length} />
      <main className="lg:ml-64">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6 md:py-10 lg:py-12 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

