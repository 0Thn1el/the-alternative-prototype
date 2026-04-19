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
import { toast } from 'sonner';

type CartItem = {
  cartKey: string;
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

type DiscoverLaunchContext = {
  query?: string;
  category?: string;
  itemName?: string;
  openSimilar?: boolean;
};

type ShopLaunchContext = {
  query?: string;
  category?: string;
};

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

const FONT_SIZE_VALUES: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
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

function normalizeCategoryForShop(category?: string): string | undefined {
  const normalized = String(category || '').trim().toLowerCase();
  if (!normalized) return undefined;

  if (normalized === 'top' || normalized === 'tops') return 'Top';
  if (normalized === 'bottom' || normalized === 'bottoms') return 'Bottom';
  if (normalized === 'dress' || normalized === 'dresses') return 'Dress';
  if (normalized === 'outerwear' || normalized.includes('jacket') || normalized.includes('coat')) return 'Outerwear';
  if (normalized === 'shoes' || normalized === 'shoe' || normalized.includes('boot') || normalized.includes('sneaker')) return 'Shoes';
  return category;
}

function getCartItemName(item: any): string {
  return item?.name || item?.item || 'Item';
}

export default function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('isDarkMode') === 'true';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'medium';

    const savedFontSize = window.localStorage.getItem('fontSize');
    if (savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large' || savedFontSize === 'xlarge') {
      return savedFontSize;
    }

    return 'medium';
  });
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [discoverLaunchContext, setDiscoverLaunchContext] = useState<DiscoverLaunchContext | null>(null);
  const [shopLaunchContext, setShopLaunchContext] = useState<ShopLaunchContext | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const rawCart = window.localStorage.getItem('cart');
      if (!rawCart) return [];
      const parsedCart = JSON.parse(rawCart);
      if (!Array.isArray(parsedCart)) return [];

      return parsedCart.map((item: any) => {
        const fallbackId = item.id || item._id || item.mongoId || getCartItemName(item);
        const fallbackSize = item.size || '';
        return {
          ...item,
          cartKey: item.cartKey || `${String(fallbackId)}::${String(fallbackSize)}`,
        };
      });
    } catch (error) {
      console.warn('Failed to parse saved cart:', error);
      return [];
    }
  });

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
    const itemName = getCartItemName(item);
    const cartId = item.cartId || item._id || item.mongoId || item.id || `${itemName}-${item.brand || 'brand'}`;
    const quantityToAdd = selection?.quantity ?? 1;
    const selectedSize = selection?.size || item.size;
    const cartKey = `${String(cartId)}::${String(selectedSize || '')}`;

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.cartKey === cartKey
      );

      if (existingItem) {
        toast.success(`${itemName} quantity updated in cart`);
        return currentCart.map((cartItem) =>
          cartItem.cartKey === cartKey
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem
        );
      }

      toast.success(`${itemName} added to cart`);
      return [
        ...currentCart,
        {
          cartKey,
          id: cartId,
          name: itemName,
          brand: getDisplayBrand(item.brand),
          price: typeof item.price === 'number' ? item.price : 0,
          image: item.image || item.imageUrl || getImageUrlFromDoc(item),
          quantity: quantityToAdd,
          size: selectedSize,
          color: item.color,
          sustainable: item.sustainable || {
            organic: Boolean(String(item.material || item.fabric || '').toLowerCase().includes('organic')),
            recycled: Boolean(
              String(item.material || item.fabric || '').toLowerCase().includes('recycled') ||
              (item.tags || item.customTags || []).some((tag: string) => String(tag).toLowerCase().includes('recycled'))
            ),
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

  const openShopWithSuggestion = (context?: { query?: string; category?: string }) => {
    setShopLaunchContext(
      context
        ? {
            query: context.query,
            category: normalizeCategoryForShop(context.category),
          }
        : null
    );
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

  const openDiscoverSearch = (context?: { query?: string; category?: string }) => {
    setDiscoverLaunchContext(
      context
        ? {
            query: context.query,
            category: normalizeCategoryForDiscover(context.category),
            openSimilar: false,
          }
        : null
    );
    setCurrentPage('discover');
  };

  // Sync dark mode with document class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', FONT_SIZE_VALUES[fontSize]);
    window.localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    window.localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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
            launchContext={shopLaunchContext}
            onLaunchContextConsumed={() => setShopLaunchContext(null)}
          />
        );
      case 'discover':
        return (
          <Discovery
            wardrobe={wardrobe}
            setWardrobe={setWardrobe}
            analyzedItem={analyzedItem}
            onAddToCart={requestAddToCart}
            launchContext={discoverLaunchContext}
            onLaunchContextConsumed={() => setDiscoverLaunchContext(null)}
          />
        );
      case 'analyze':
        return <ImageAnalysis onAnalysisComplete={setAnalyzedItem} />;
      case 'outfits':
        return <OutfitBuilder analyzedItem={analyzedItem} wardrobe={wardrobe} onShopSuggestion={openShopWithSuggestion} />;
      case 'wardrobe':
        return <EnhancedWardrobe 
          wardrobe={wardrobe} 
          setWardrobe={setWardrobe} 
          onAddToCart={requestAddToCart}
          onDiscoverSuggestion={openDiscoverSearch}
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
        return <Profile wardrobe={wardrobe} />;
      default:
        return (
          <HomePage
            wardrobe={wardrobe}
            setWardrobe={setWardrobe}
            onAddToCart={requestAddToCart}
            onViewSimilar={openDiscoverWithSimilar}
            launchContext={shopLaunchContext}
            onLaunchContextConsumed={() => setShopLaunchContext(null)}
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
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
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

