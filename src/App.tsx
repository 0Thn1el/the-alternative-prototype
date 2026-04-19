import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { HomePageCatalog } from './components/HomePageCatalog';
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
import { toast } from 'sonner';

type CartItem = {
  id: string | number;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  sustainable?: {
    organic: boolean;
    recycled: boolean;
    local: boolean;
  };
};

type ShopLaunchContext = {
  query?: string;
  category?: string;
};

type DiscoverLaunchContext = {
  query?: string;
  category?: string;
  itemName?: string;
  openSimilar?: boolean;
};

function getImageUrlFromDoc(doc: any): string {
  if (typeof doc?.imageUrl === 'string' && doc.imageUrl.trim()) return doc.imageUrl;
  if (typeof doc?.image === 'string' && doc.image.trim()) return doc.image;
  if (typeof doc?.image?.url === 'string' && doc.image.url.trim()) return doc.image.url;
  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop';
}

function getDisplayBrand(brand?: string): string {
  if (!brand || /deepfashion/i.test(brand)) return 'The Alternative';
  return brand;
}

function normalizeCategoryForDiscover(category?: string): string | undefined {
  const normalized = String(category || '').trim().toLowerCase();
  if (!normalized) return undefined;

  if (normalized === 'tops') return 'top';
  if (normalized === 'bottoms') return 'bottom';
  if (normalized === 'dresses') return 'dress';
  return normalized;
}

export default function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [shopLaunchContext, setShopLaunchContext] = useState<ShopLaunchContext | null>(null);
  const [discoverLaunchContext, setDiscoverLaunchContext] = useState<DiscoverLaunchContext | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([
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

  const requestAddToCart = (item: any, selection?: { size: string; quantity: number; stock: number }) => {
    addToCart(item, selection);
  };

  const addToCart = (item: any, selection?: { size: string; quantity: number; stock: number }) => {
    const cartId = item.cartId || item._id || item.mongoId || item.id || `${item.name}-${item.brand || 'brand'}`;
    const quantityToAdd = selection?.quantity ?? 1;
    const selectedSize = selection?.size || item.size;

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => String(cartItem.id) === String(cartId) && String(cartItem.size || '') === String(selectedSize || '')
      );

      if (existingItem) {
        toast.success(`${item.name} quantity updated in cart`);
        return currentCart.map((cartItem) =>
          String(cartItem.id) === String(cartId) && String(cartItem.size || '') === String(selectedSize || '')
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem
        );
      }

      toast.success(`${item.name} added to cart`);
      return [
        ...currentCart,
        {
          id: cartId,
          name: item.name,
          brand: getDisplayBrand(item.brand),
          price: typeof item.price === 'number' ? item.price : 0,
          image: item.image || item.imageUrl || getImageUrlFromDoc(item),
          quantity: quantityToAdd,
          size: selectedSize,
          color: item.color,
          sustainable: item.sustainable || {
            organic: Boolean(String(item.material || '').toLowerCase().includes('organic')),
            recycled: Boolean(String(item.material || '').toLowerCase().includes('recycled') || (item.tags || []).some((tag: string) => tag.toLowerCase().includes('recycled'))),
            local: false,
          },
        },
      ];
    });

    if (item._id) {
      void itemsAPI.trackInteraction({
        itemId: item._id,
        event: 'add_to_cart',
      }).catch((error) => {
        console.warn('Failed to track add to cart interaction:', error);
      });
    }
  };

  const openShopWithSuggestion = (context: ShopLaunchContext) => {
    setShopLaunchContext(context);
    setCurrentPage('home');
  };

  const openDiscoverWithSimilar = (item: any) => {
    setDiscoverLaunchContext({
      query: item.name,
      category: normalizeCategoryForDiscover(item.category || item.type),
      itemName: item.name,
      openSimilar: true,
    });
    setCurrentPage('discover');
  };

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
          customTags: doc.tags || [],
          brand: getDisplayBrand(doc.brand),
          price: typeof doc.price === 'number' ? doc.price : 0,
          description: doc.description || '',
          isOwned: true,
          isFavorite: false,
          materials: doc.material ? [doc.material] : [],
          sustainable: {
            organic: Boolean(String(doc.material || '').toLowerCase().includes('organic')),
            recycled: Boolean(String(doc.material || '').toLowerCase().includes('recycled') || (doc.tags || []).some((tag: string) => String(tag).toLowerCase().includes('recycled'))),
            local: false,
          },
          sustainabilityScore: doc.sustainabilityScore,
          brandEthicsScore: doc.brandEthicsScore,
          carbonScore: doc.carbonScore,
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
        return (
          <HomePage
            wardrobe={wardrobe}
            setWardrobe={setWardrobe}
            onAddToCart={requestAddToCart}
            onViewSimilar={openDiscoverWithSimilar}
          />
        );
      case 'discover':
        return (
          <Discovery
            wardrobe={wardrobe}
            analyzedItem={analyzedItem}
            onAddToCart={requestAddToCart}
            launchContext={discoverLaunchContext}
            onLaunchContextConsumed={() => setDiscoverLaunchContext(null)}
          />
        );
      case 'analyze':
        return <ImageAnalysis onAnalysisComplete={setAnalyzedItem} />;
      case 'outfits':
        return <OutfitBuilder analyzedItem={analyzedItem} wardrobe={wardrobe} />;
      case 'wardrobe':
        return <EnhancedWardrobe 
          wardrobe={wardrobe} 
          setWardrobe={setWardrobe} 
          wardrobes={wardrobes}
          setWardrobes={setWardrobes}
          analyzedItem={analyzedItem} 
          onShopSuggestion={openShopWithSuggestion}
        />;
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
        return (
          <HomePage
            wardrobe={wardrobe}
            setWardrobe={setWardrobe}
            onAddToCart={requestAddToCart}
            onViewSimilar={openDiscoverWithSimilar}
          />
        );
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
        duration: 0.4
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

