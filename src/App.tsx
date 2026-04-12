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
import { useAuth } from './hooks/useAuth';
import { itemsAPI } from './services/api';



type User = {
  email: string;
  // add additional fields as needed
};

function getImageUrlFromDoc(doc: any): string {
  if (typeof doc?.imageUrl === 'string' && doc.imageUrl.trim()) return doc.imageUrl;
  if (typeof doc?.image === 'string' && doc.image.trim()) return doc.image;
  if (typeof doc?.image?.url === 'string' && doc.image.url.trim()) return doc.image.url;
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop';
}

export default function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  
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

  // Load wardrobe from MongoDB when user signs in
  useEffect(() => {
    if (!user) return;
    itemsAPI.getAll()
      .then((res) => {
        const items = (res.data as any[]).map((doc: any) => ({
          id: Date.now() + Math.random(), // local numeric id
          mongoId: doc._id,
          item: doc.name,
          type: doc.category,
          color: doc.color || '',
          style: '',
          image: getImageUrlFromDoc(doc),
          fabric: doc.material || '',
          customTags: [],
          brand: '',
          price: 0,
          description: '',
          isOwned: true,
          isFavorite: false,
          materials: [],
          sustainable: { organic: false, recycled: false, local: false },
        }));
        setWardrobe(items);
      })
      .catch((err) => {
        console.warn('Could not load wardrobe from server:', err);
      });
  }, [user]);

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


  if (!user && !loading) {
    if (authMode === 'signin') {
      return (
        <SignIn
          onSwitchToSignUp={() => setAuthMode('signup')}
        />
      );
    } else {
      return (
        <SignUp
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

