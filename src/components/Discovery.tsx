import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Search, ShoppingCart, ArrowLeftRight, Filter, ChevronLeft, ChevronRight, Sparkles, Heart, Leaf, MapPin, Plus, Recycle, Star, Tag } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { ItemDetailModal } from './ItemDetailModal';
import { itemsAPI } from '../services/api';
import { formatItemName } from '../utils/formatItemName';
import { toast } from 'sonner';
import { calculateSustainabilityScore, getSustainabilityBgColor, getSustainabilityGrade, getSustainabilityHighlights } from '../utils/sustainabilityScore';

type CatalogItem = {
  _id: string;
  name: string;
  category: string;
  tags?: string[];
  description?: string;
  price?: number;
  brand?: string;
  color?: string;
  material?: string;
  imageUrl?: string;
  similarity?: number;
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
};

type RecommendationItem = CatalogItem & {
  score: number;
  reasons: string[];
  sustainabilityScore?: number;
  scoreBreakdown: {
    visualSimilarity: number;
    behaviourMatch: number;
    wardrobeCompatibility: number;
    contextRelevance: number;
    sustainabilityBoost: number;
    total: number;
  };
};

type DiscoveryProps = {
  wardrobe: any[];
  setWardrobe: React.Dispatch<React.SetStateAction<any[]>>;
  analyzedItem: any;
  onAddToCart: (item: any) => void;
  launchContext?: {
    query?: string;
    category?: string;
    itemName?: string;
    openSimilar?: boolean;
  } | null;
  onLaunchContextConsumed?: () => void;
};

const PAGE_SIZE = 24;
const SIMILAR_PAGE_SIZE = 12;
const DEFAULT_PRICE_RANGE = [0, 500] as const;

function getDisplayBrand(brand?: string): string {
  if (!brand || /deepfashion/i.test(brand)) return 'The Alternative';
  return brand;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month <= 2 || month === 12) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function Discovery({ wardrobe, setWardrobe, analyzedItem, onAddToCart, launchContext, onLaunchContextConsumed }: DiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<number[]>([...DEFAULT_PRICE_RANGE]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<number[]>([...DEFAULT_PRICE_RANGE]);
  const [priceSort, setPriceSort] = useState('featured');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [weather, setWeather] = useState('mild');
  const [occasion, setOccasion] = useState('casual');
  const [sustainabilityWeight, setSustainabilityWeight] = useState(50);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [selectedBaseItem, setSelectedBaseItem] = useState<CatalogItem | null>(null);
  const [similarItems, setSimilarItems] = useState<CatalogItem[]>([]);
  const [similarPage, setSimilarPage] = useState(1);
  const [similarTotalPages, setSimilarTotalPages] = useState(1);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [pendingSimilarName, setPendingSimilarName] = useState<string | null>(null);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const analyzedCategory = analyzedItem?.detected_item?.type || '';

  const currentCategory = useMemo(() => {
    if (categoryFilter !== 'all') return categoryFilter;
    return '';
  }, [categoryFilter]);

  const getSortableDiscount = (item: any) => {
    if (typeof item.discount === 'number') return item.discount;
    const source = String(item._id || item.id || item.name || 'item');
    const seed = Array.from(source).reduce((total, character) => total + character.charCodeAt(0), 0);
    return 18 + (seed % 23);
  };

  const sortItems = <T extends { price?: number }>(items: T[]) => {
    const nextItems = [...items];

    if (priceSort === 'price-low-high') {
      return nextItems.sort((left, right) => {
        const leftPrice = typeof left.price === 'number' ? left.price : Number.POSITIVE_INFINITY;
        const rightPrice = typeof right.price === 'number' ? right.price : Number.POSITIVE_INFINITY;
        return leftPrice - rightPrice;
      });
    }

    if (priceSort === 'price-high-low') {
      return nextItems.sort((left, right) => {
        const leftPrice = typeof left.price === 'number' ? left.price : Number.NEGATIVE_INFINITY;
        const rightPrice = typeof right.price === 'number' ? right.price : Number.NEGATIVE_INFINITY;
        return rightPrice - leftPrice;
      });
    }

    if (priceSort === 'discount-low-high') {
      return nextItems.sort((left, right) => getSortableDiscount(left) - getSortableDiscount(right));
    }

    if (priceSort === 'discount-high-low') {
      return nextItems.sort((left, right) => getSortableDiscount(right) - getSortableDiscount(left));
    }

    return nextItems;
  };

  const sortedCatalog = useMemo(() => sortItems(catalog), [catalog, priceSort]);
  const sortedSimilarItems = useMemo(() => sortItems(similarItems), [priceSort, similarItems]);
  const sortedRecommendations = useMemo(() => sortItems(recommendations), [priceSort, recommendations]);

  const priceRangeLabel = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;
    return `$${minPrice} - $${maxPrice}`;
  }, [priceRange]);

  useEffect(() => {
    if (!launchContext) return;

    setCatalogPage(1);
    setSimilarPage(1);
    setSelectedBaseItem(null);

    if (launchContext.query !== undefined) setSearchQuery(launchContext.query);
    setCategoryFilter(launchContext.category || 'all');
    setActiveTab(launchContext.openSimilar ? 'similar' : 'recommendations');
    setPendingSimilarName(launchContext.openSimilar ? launchContext.itemName || launchContext.query || null : null);

    onLaunchContextConsumed?.();
  }, [launchContext, onLaunchContextConsumed]);

  useEffect(() => {
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const params: any = {
          page: catalogPage,
          limit: PAGE_SIZE,
        };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (currentCategory) params.category = currentCategory;

        if (appliedPriceRange[0] > DEFAULT_PRICE_RANGE[0]) params.minPrice = appliedPriceRange[0];
        if (appliedPriceRange[1] < DEFAULT_PRICE_RANGE[1]) params.maxPrice = appliedPriceRange[1];

        const response = await itemsAPI.getCatalog(params);
        setCatalog(response.data.items || []);
        setCatalogTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Failed to load catalog:', error);
        setCatalog([]);
        setCatalogTotalPages(1);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, [catalogPage, searchQuery, currentCategory, appliedPriceRange]);

  useEffect(() => {
    if (!pendingSimilarName || catalogLoading) return;

    if (catalog.length === 0) {
      setPendingSimilarName(null);
      setActiveTab('recommendations');
      return;
    }

    const normalizedName = pendingSimilarName.trim().toLowerCase();
    const matchedItem = catalog.find((item) => item.name.trim().toLowerCase() === normalizedName) || catalog[0];

    selectBaseItem(matchedItem);
    setActiveTab('similar');
    setPendingSimilarName(null);
  }, [catalog, catalogLoading, pendingSimilarName]);

  useEffect(() => {
    if (!selectedBaseItem?._id) return;

    const loadSimilar = async () => {
      setSimilarLoading(true);
      try {
        const response = await itemsAPI.getSimilarCatalogItems(selectedBaseItem._id, {
          page: similarPage,
          limit: SIMILAR_PAGE_SIZE,
        });
        setSimilarItems(response.data.items || []);
        setSimilarTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Failed to load similar items:', error);
        setSimilarItems([]);
        setSimilarTotalPages(1);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilar();
  }, [selectedBaseItem, similarPage]);

  useEffect(() => {
    const loadRecommendations = async () => {
      setRecommendationsLoading(true);
      try {
        const response = await itemsAPI.getRecommendations({
          limit: 6,
          weather,
          occasion,
          timeOfDay: getCurrentTimeOfDay(),
          season: getCurrentSeason(),
          category: currentCategory || analyzedCategory || undefined,
          baseItemId: selectedBaseItem?._id,
          sustainabilityWeight: sustainabilityWeight / 100,
        });
        setRecommendations(response.data.items || []);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    loadRecommendations();
  }, [weather, occasion, sustainabilityWeight, currentCategory, analyzedCategory, selectedBaseItem]);

  const selectBaseItem = (item: CatalogItem) => {
    setSelectedBaseItem(item);
    setSimilarPage(1);
    setActiveTab('similar');
    void itemsAPI.trackInteraction({
      itemId: item._id,
      event: 'view',
      context: {
        season: getCurrentSeason(),
        timeOfDay: getCurrentTimeOfDay(),
        weather,
        occasion,
      },
    }).catch((error) => {
      console.warn('Failed to track view interaction:', error);
    });
  };

  const likeRecommendation = (itemId: string) => {
    void itemsAPI.trackInteraction({
      itemId,
      event: 'like',
      context: {
        season: getCurrentSeason(),
        timeOfDay: getCurrentTimeOfDay(),
        weather,
        occasion,
      },
    }).catch((error) => {
      console.warn('Failed to track like interaction:', error);
    });
  };

  const getPriceTier = (price?: number) => {
    if (typeof price !== 'number') return 'Unpriced';
    if (price < 50) return 'Budget';
    if (price < 150) return 'Mid-range';
    return 'Premium';
  };

  const getImage = (item: CatalogItem) => item.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop';

  const getItemSeed = (item: CatalogItem | RecommendationItem) => {
    const source = String(item._id || item.name || 'item');
    return Array.from(source).reduce((total, character) => total + character.charCodeAt(0), 0);
  };

  const getItemMaterials = (item: any): string[] => {
    if (Array.isArray(item.materials) && item.materials.length > 0) return item.materials.filter(Boolean);
    return String(item.material || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  };

  const getDerivedSustainable = (item: any) => {
    if (item.sustainable) return item.sustainable;

    const text = [item.material, ...(item.tags || []), ...getItemMaterials(item)].filter(Boolean).join(' ').toLowerCase();
    return {
      organic: text.includes('organic'),
      recycled: text.includes('recycled') || text.includes('upcycled'),
      local: text.includes('local') || text.includes('made local'),
    };
  };

  const getDisplayStyle = (item: any): string => {
    const preferredTags = ['Night Out', 'Formal', 'Polished', 'Workwear', 'Off Duty', 'Street', 'Classic', 'Minimal', 'Tailored', 'Sport', 'Relaxed', 'Boho', 'Luxe'];
    const tagMatch = preferredTags.find((tag) => (item.tags || []).includes(tag));
    return item.style || tagMatch || item.category || 'Styled';
  };

  const getItemRating = (item: any) => {
    if (typeof item.rating === 'number') return item.rating;
    return Number((4.3 + ((getItemSeed(item) % 7) * 0.1)).toFixed(1));
  };

  const getItemReviews = (item: any) => {
    if (typeof item.reviews === 'number') return item.reviews;
    return 120 + (getItemSeed(item) % 320);
  };

  const getItemDiscount = (item: any) => {
    if (typeof item.discount === 'number') return item.discount;
    return 18 + (getItemSeed(item) % 23);
  };

  const getItemOriginalPrice = (item: any) => {
    if (typeof item.originalPrice === 'number') return item.originalPrice;
    if (typeof item.price !== 'number') return undefined;
    const discount = getItemDiscount(item) / 100;
    return Math.max(item.price + 10, Math.round(item.price / (1 - discount)));
  };

  const getSustainabilityIcons = (sustainable: { organic: boolean; recycled: boolean; local: boolean }) => {
    const icons = [];
    if (sustainable.organic) icons.push(<Leaf key='organic' className='w-3 h-3 text-green-600' />);
    if (sustainable.recycled) icons.push(<Recycle key='recycled' className='w-3 h-3 text-blue-600' />);
    if (sustainable.local) icons.push(<MapPin key='local' className='w-3 h-3 text-purple-600' />);
    return icons;
  };

  const buildShopCardItem = (item: any) => {
    const materials = getItemMaterials(item);
    const sustainable = getDerivedSustainable(item);
    const style = getDisplayStyle(item);
    const rating = getItemRating(item);
    const reviews = getItemReviews(item);
    const discount = getItemDiscount(item);
    const originalPrice = getItemOriginalPrice(item);

    return {
      ...item,
      id: item.id || item._id,
      image: getImage(item),
      type: item.type || item.category,
      style,
      rating,
      reviews,
      discount,
      originalPrice,
      materials,
      sustainable,
      tags: item.tags || [],
      price: typeof item.price === 'number' ? item.price : 0,
      brand: getDisplayBrand(item.brand),
      color: item.color || 'Neutral',
    };
  };

  const toggleFavorite = (itemId: string) => {
    setFavoriteItems((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  };

  const addToWardrobe = async (item: any) => {
    try {
      const response = await itemsAPI.create({
        name: item.name,
        category: item.type || item.category,
        color: item.color,
        material: item.material || (item.materials || []).join(', '),
        imageUrl: item.image,
        tags: item.tags || [],
        description: item.description,
        brand: item.brand,
        price: item.price,
      });

      const savedItem = response.data;
      const wardrobeItem = {
        id: Date.now(),
        mongoId: savedItem._id,
        item: savedItem.name,
        type: savedItem.category,
        color: savedItem.color || item.color,
        style: item.style,
        image: item.image,
        customTags: savedItem.tags || item.tags || [],
        brand: getDisplayBrand(savedItem.brand || item.brand),
        price: savedItem.price || item.price,
        fabric: savedItem.material || item.material || (item.materials || []).join(', '),
        materials: item.materials || [],
        sustainable: item.sustainable,
        isOwned: false,
        isFavorite: false,
        description: savedItem.description || item.description || '',
        sustainabilityScore: item.sustainabilityScore,
        brandEthicsScore: item.brandEthicsScore,
        carbonScore: item.carbonScore,
      };

      setWardrobe([...wardrobe, wardrobeItem]);
      toast.success(`${formatItemName(item.name)} saved to wardrobe as a wishlist piece`);
    } catch (error) {
      console.error('Failed to save wardrobe item:', error);
      toast.error('Could not save this item to your wardrobe');
    }
  };

  const openItemDetail = (item: any) => {
    setSelectedItem(buildShopCardItem(item));
    setShowDetailModal(true);
  };

  const renderShopCard = (item: any, index: number, variant: 'catalog' | 'similar' | 'recommendation') => {
    const cardItem = buildShopCardItem(item);
    const sustainabilityScore = calculateSustainabilityScore({
      sustainable: cardItem.sustainable,
      materials: cardItem.materials,
      tags: cardItem.tags,
      brand: cardItem.brand,
      sustainabilityScore: cardItem.sustainabilityScore,
      brandEthicsScore: cardItem.brandEthicsScore,
      carbonScore: cardItem.carbonScore,
    });
    const sustainabilityHighlights = getSustainabilityHighlights({
      sustainable: cardItem.sustainable,
      materials: cardItem.materials,
      tags: cardItem.tags,
      brand: cardItem.brand,
      carbonScore: cardItem.carbonScore,
    });
    const cardKey = `${variant}-${cardItem._id || cardItem.id}`;

    return (
      <motion.div
        key={cardKey}
        layout
        className='min-w-0'
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.4, delay: index * 0.05, layout: { duration: 0.3 } }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
      >
        <Card
          className='h-full cursor-pointer overflow-hidden transition-all duration-300 group hover:shadow-xl'
          onClick={() => openItemDetail(cardItem)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openItemDetail(cardItem);
            }
          }}
          role='button'
          tabIndex={0}
        >
          <div className='relative overflow-hidden'>
            <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.4 }}>
              <ImageWithFallback src={cardItem.image} alt={cardItem.name} className='w-full h-48 sm:h-56 md:h-64 object-cover' />
            </motion.div>
            <div className='absolute top-2 left-2 flex flex-col gap-1'>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Badge variant='destructive' className='bg-red-500 text-xs shadow-lg'>
                  -{cardItem.discount}%
                </Badge>
              </motion.div>
              {(cardItem.sustainable.organic || cardItem.sustainable.recycled || cardItem.sustainable.local) && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Badge variant='secondary' className={`${getSustainabilityBgColor(sustainabilityScore)} text-xs shadow-lg`}>
                    <Leaf className='w-3 h-3 mr-1' />
                    {getSustainabilityGrade(sustainabilityScore)}
                  </Badge>
                </motion.div>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant='ghost'
                size='sm'
                className='absolute top-2 right-2 bg-card/95 hover:bg-card shadow-lg border border-border w-8 h-8 p-0 transition-all duration-200'
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(String(cardItem.id || cardItem._id));
                }}
              >
                <motion.div
                  animate={favoriteItems.includes(String(cardItem.id || cardItem._id)) ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={`w-4 h-4 transition-all duration-300 ${favoriteItems.includes(String(cardItem.id || cardItem._id)) ? 'fill-current text-red-500' : 'text-foreground'}`} />
                </motion.div>
              </Button>
            </motion.div>
          </div>

          <CardContent className='min-w-0 p-4'>
            <div className='flex h-full flex-col gap-3'>
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 + 0.4 }}>
                <h3 className='font-semibold line-clamp-1 text-sm md:text-base'>{formatItemName(cardItem.name)}</h3>
                <p className='text-xs md:text-sm text-muted-foreground'>{cardItem.brand}</p>
              </motion.div>

              <motion.div className='flex items-start justify-between gap-3' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.5 }}>
                <div className='flex min-w-0 flex-wrap items-center gap-1'>
                  <Star className='w-3 h-3 md:w-4 md:h-4 fill-current text-yellow-400' />
                  <span className='text-xs md:text-sm font-medium'>{cardItem.rating}</span>
                  <span className='text-xs text-muted-foreground'>({cardItem.reviews})</span>
                </div>
                <div className='shrink-0 text-right'>
                  <p className='font-bold text-sm md:text-lg text-green-600'>${cardItem.price}</p>
                  {cardItem.originalPrice && <p className='text-xs md:text-sm text-muted-foreground line-through'>${cardItem.originalPrice}</p>}
                </div>
              </motion.div>

              <motion.div className='rounded-xl border border-border/60 bg-muted/30 p-3' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.6 }}>
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <span className='text-xs text-muted-foreground'>Sustainability:</span>
                  <Badge className={getSustainabilityBgColor(sustainabilityScore)}>{sustainabilityScore}/100</Badge>
                  {getSustainabilityIcons(cardItem.sustainable)}
                  {cardItem.sustainable.organic && (
                    <Badge variant='secondary' className='text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'>
                      Organic
                    </Badge>
                  )}
                  {cardItem.sustainable.recycled && (
                    <Badge variant='secondary' className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                      Recycled
                    </Badge>
                  )}
                  {cardItem.sustainable.local && (
                    <Badge variant='secondary' className='text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'>
                      Local
                    </Badge>
                  )}
                  {sustainabilityHighlights.slice(0, 1).map((highlight) => (
                    <Badge key={`${cardKey}-${highlight}`} variant='outline' className='text-xs'>{highlight}</Badge>
                  ))}
                </div>

                <div className='mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2'>
                  <span className='font-medium'>Materials:</span> {cardItem.materials.length > 0 ? cardItem.materials.join(', ') : 'Curated fabric blend'}
                </div>
              </motion.div>

              <motion.div className='flex items-center gap-1.5 flex-wrap' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.8 }}>
                <Badge variant='outline' className='text-xs hover:bg-accent transition-colors'>
                  {cardItem.style}
                </Badge>
                <Badge variant='outline' className='text-xs hover:bg-accent transition-colors'>
                  {cardItem.color}
                </Badge>
                {cardItem.tags.slice(0, 1).map((tag: string) => (
                  <Badge key={`${cardKey}-${tag}`} variant='secondary' className='text-xs hover:scale-105 transition-transform'>
                    <Tag className='w-3 h-3 mr-1' />
                    {tag}
                  </Badge>
                ))}
              </motion.div>

              <motion.div className='mt-auto grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 + 0.9 }}>
                <motion.div className='h-14 flex-1' whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size='sm'
                    className='!h-full w-full px-3 py-2 text-center text-sm transition-all duration-200 hover:shadow-md'
                    onClick={(event) => {
                      event.stopPropagation();
                      openItemDetail(cardItem);
                    }}
                  >
                    <ShoppingCart className='w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2' />
                    Buy Now
                  </Button>
                </motion.div>
                <motion.div className='h-14 flex-1' whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant='outline'
                    size='sm'
                    className='!h-full w-full px-3 py-2 text-center text-sm transition-all duration-200 hover:shadow-md'
                    onClick={(event) => {
                      event.stopPropagation();
                      void addToWardrobe(cardItem);
                    }}
                  >
                    <Plus className='w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2' />
                    Save to Wardrobe
                  </Button>
                </motion.div>
                <motion.div className='sm:col-span-2' whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='h-11 w-full px-3 py-2 text-center text-sm'
                    onClick={(event) => {
                      event.stopPropagation();
                      selectBaseItem(cardItem);
                    }}
                  >
                    <ArrowLeftRight className='w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2' />
                    Similar Styles
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderPagination = (
    page: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => {
    const visibleWindow = 7;
    const halfWindow = Math.floor(visibleWindow / 2);
    const startPage = Math.max(1, Math.min(page - halfWindow, totalPages - visibleWindow + 1));
    const endPage = Math.min(totalPages, startPage + visibleWindow - 1);
    const visiblePages = Array.from({ length: Math.max(endPage - startPage + 1, 0) }, (_, index) => startPage + index);

    return (
      <div className='flex items-center justify-center gap-2 pt-4'>
        <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className='w-4 h-4' />
        </Button>

        {startPage > 1 && (
          <>
            <Button variant='outline' size='sm' onClick={() => onPageChange(1)} className='min-w-9'>1</Button>
            {startPage > 2 && <span className='px-1 text-sm text-muted-foreground'>...</span>}
          </>
        )}

        <div className='flex items-center gap-1'>
          {visiblePages.map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size='sm'
              onClick={() => onPageChange(p)}
              className='min-w-9'
            >
              {p}
            </Button>
          ))}
        </div>

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className='px-1 text-sm text-muted-foreground'>...</span>}
            <Button variant='outline' size='sm' onClick={() => onPageChange(totalPages)} className='min-w-9'>
              {totalPages}
            </Button>
          </>
        )}

        <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className='w-4 h-4' />
        </Button>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Search className='w-5 h-5' />
            Discover The Alternative
          </CardTitle>
          <CardDescription>
            Browse the live catalog, filter by style, and compare similar alternatives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 xl:grid-cols-7'>
            <div className='flex min-w-0 items-center gap-2 md:col-span-2'>
              <Filter className='w-4 h-4' />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setCatalogPage(1);
                  setSearchQuery(e.target.value);
                }}
                placeholder='Search by name, category, tag'
                className='w-full'
              />
            </div>

            <div className='flex min-w-0 flex-col gap-2 xl:col-span-2'>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Price</span>
                <span>{priceRangeLabel}</span>
              </div>
              <Slider
                min={DEFAULT_PRICE_RANGE[0]}
                max={DEFAULT_PRICE_RANGE[1]}
                step={10}
                value={priceRange}
                onValueChange={(value) => {
                  if (value.length !== 2) return;
                  setPriceRange([value[0], value[1]]);
                }}
                onValueCommit={(value) => {
                  if (value.length !== 2) return;
                  setCatalogPage(1);
                  setAppliedPriceRange([value[0], value[1]]);
                }}
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => { setCatalogPage(1); setCategoryFilter(value); }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                <SelectItem value='top'>Top</SelectItem>
                <SelectItem value='bottom'>Bottom</SelectItem>
                <SelectItem value='dress'>Dress</SelectItem>
                <SelectItem value='outerwear'>Outerwear</SelectItem>
                <SelectItem value='shoes'>Shoes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Sort By' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='featured'>Sort By</SelectItem>
                <SelectItem value='price-low-high'>Price: Low to High</SelectItem>
                <SelectItem value='price-high-low'>Price: High to Low</SelectItem>
                <SelectItem value='discount-low-high'>Discount: Low to High</SelectItem>
                <SelectItem value='discount-high-low'>Discount: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <div className='flex min-w-0 flex-col gap-2'>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Prioritize sustainability</span>
                <span>{sustainabilityWeight}%</span>
              </div>
              <Input
                type='range'
                min='0'
                max='100'
                step='5'
                value={sustainabilityWeight}
                onChange={(event) => setSustainabilityWeight(Number(event.target.value))}
              />
            </div>

            {analyzedCategory && (
              <Badge variant='outline' className='flex items-center gap-1 justify-center md:justify-start'>
                <Sparkles className='w-3 h-3' />
                Detected category: {analyzedCategory}
              </Badge>
            )}
          </div>

          {!selectedBaseItem && (
            <Alert>
              <ArrowLeftRight className='h-4 w-4' />
              <AlertDescription>
                Choose any catalog item to load similar clothing in the Similar tab.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='flex h-auto w-full flex-wrap justify-start gap-2'>
          <TabsTrigger value='recommendations'>Shop Catalog</TabsTrigger>
          <TabsTrigger value='similar' disabled={!selectedBaseItem}>Similar Clothing</TabsTrigger>
          <TabsTrigger value='trending'>Hybrid Picks</TabsTrigger>
        </TabsList>

        <TabsContent value='recommendations' className='mt-6'>
          {catalogLoading ? (
            <p className='text-muted-foreground'>Loading catalog...</p>
          ) : catalog.length === 0 ? (
            <p className='text-muted-foreground'>No catalog items found for this filter.</p>
          ) : (
            <>
              <motion.div layout className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <AnimatePresence mode='popLayout'>
                  {sortedCatalog.map((item, index) => renderShopCard(item, index, 'catalog'))}
                </AnimatePresence>
              </motion.div>
              {renderPagination(catalogPage, catalogTotalPages, setCatalogPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value='similar' className='mt-6'>
          {!selectedBaseItem ? (
            <p className='text-muted-foreground'>Select a catalog item from Shop Catalog first.</p>
          ) : (
            <>
              <Alert>
                <Search className='h-4 w-4' />
                <AlertDescription>
                  Showing items similar to: {formatItemName(selectedBaseItem.name)}
                </AlertDescription>
              </Alert>

              <motion.div layout className='mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {similarLoading ? (
                  <p className='text-muted-foreground'>Loading similar items...</p>
                ) : similarItems.length === 0 ? (
                  <p className='text-muted-foreground'>No similar items found.</p>
                ) : (
                  <AnimatePresence mode='popLayout'>
                    {sortedSimilarItems.map((item, index) => renderShopCard(item, index, 'similar'))}
                  </AnimatePresence>
                )}
              </motion.div>

              {renderPagination(similarPage, similarTotalPages, setSimilarPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value='trending' className='mt-6'>
          <Alert className='mb-4'>
            <Sparkles className='h-4 w-4' />
            <AlertDescription>
              Ranked using visual similarity, your interactions, wardrobe compatibility, current context, and sustainability preference.
            </AlertDescription>
          </Alert>

          {recommendationsLoading ? (
            <p className='text-muted-foreground'>Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p className='text-muted-foreground'>No recommendations available yet. Interact with catalog items to train the recommender.</p>
          ) : (
            <motion.div layout className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <AnimatePresence mode='popLayout'>
                {sortedRecommendations.map((item, index) => renderShopCard(item, index, 'recommendation'))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <ItemDetailModal
        item={selectedItem}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToWardrobe={(item) => {
          void addToWardrobe(item);
        }}
        onAddToCart={onAddToCart}
        onViewSimilar={(item) => {
          if ('_id' in item) {
            selectBaseItem(item as CatalogItem);
          }
        }}
        onToggleFavorite={(itemId) => toggleFavorite(String(itemId))}
        isFavorite={selectedItem ? favoriteItems.includes(String(selectedItem.id || selectedItem._id)) : false}
      />
    </div>
  );
}
