import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './errors/ImageWithFallback';
import { ScrollingClothesSection } from './ScrollingClothesSection';
import { ItemDetailModal } from './ItemDetailModal';
import { Heart, ShoppingCart, Filter, Plus, Search, Tag, Leaf, Star, Sparkles, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { itemsAPI } from '../services/api';
import { calculateSustainabilityScore, getSustainabilityBgColor, getSustainabilityGrade, getSustainabilityHighlights } from '../utils/sustainabilityScore';

type ShopCatalogItem = {
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
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
  similarity?: number;
};

type HomePageCatalogProps = {
  wardrobe: any[];
  setWardrobe: React.Dispatch<React.SetStateAction<any[]>>;
  onAddToCart: (item: any) => void;
  launchContext?: {
    query?: string;
    category?: string;
  } | null;
  onLaunchContextConsumed?: () => void;
};

const PAGE_SIZE = 24;

function getCategoryBucket(category?: string): string {
  const normalized = String(category || '').toLowerCase();

  if (/(top|shirt|blouse|tee|t-shirt|tank|sweater|hoodie|knit|cardigan|polo)/.test(normalized)) return 'top';
  if (/(bottom|jean|pant|trouser|skirt|short|legging)/.test(normalized)) return 'bottom';
  if (/(outerwear|jacket|coat|blazer|anorak|parka)/.test(normalized)) return 'outerwear';
  if (/(shoe|boot|sneaker|loafer|heel|sandal|trainer)/.test(normalized)) return 'shoes';
  if (/(dress|gown)/.test(normalized)) return 'dress';

  return normalized;
}

function getImage(item: ShopCatalogItem): string {
  return item.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop';
}

function inferStyle(item: ShopCatalogItem): string {
  const tags = (item.tags || []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => ['night out', 'tailored', 'formal'].includes(tag))) return 'Formal';
  if (tags.some((tag) => ['street', 'streetwear', 'edgy'].includes(tag))) return 'Streetwear';
  if (tags.some((tag) => ['sport', 'sporty', 'active'].includes(tag))) return 'Athletic';
  if (tags.some((tag) => ['minimal', 'clean', 'smart'].includes(tag))) return 'Smart Casual';
  return 'Casual';
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

function getDisplayBrand(brand?: string): string {
  if (!brand || /deepfashion/i.test(brand)) return 'The Alternative';
  return brand;
}

export function HomePageCatalog({
  wardrobe,
  setWardrobe,
  onAddToCart,
  launchContext,
  onLaunchContextConsumed,
}: HomePageCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [weather, setWeather] = useState('mild');
  const [occasion, setOccasion] = useState('casual');
  const [sustainabilityWeight, setSustainabilityWeight] = useState(50);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [catalog, setCatalog] = useState<ShopCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [selectedBaseItem, setSelectedBaseItem] = useState<ShopCatalogItem | null>(null);
  const [similarItems, setSimilarItems] = useState<ShopCatalogItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const similarSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const params: any = { page: catalogPage, limit: PAGE_SIZE };

        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (categoryFilter !== 'all') params.category = categoryFilter;
        if (tagFilter !== 'all') params.tag = tagFilter;
        if (priceFilter === 'under50') params.maxPrice = 50;
        if (priceFilter === '50to100') {
          params.minPrice = 50;
          params.maxPrice = 100;
        }
        if (priceFilter === '100to200') {
          params.minPrice = 100;
          params.maxPrice = 200;
        }
        if (priceFilter === 'over200') params.minPrice = 200;

        const response = await itemsAPI.getCatalog(params);
        setCatalog(response.data.items || []);
        setCatalogTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Failed to load shop catalog:', error);
        setCatalog([]);
        setCatalogTotalPages(1);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, [catalogPage, categoryFilter, priceFilter, searchQuery, tagFilter]);

  useEffect(() => {
    if (!launchContext) return;

    setCatalogPage(1);
    if (launchContext.query !== undefined) setSearchQuery(launchContext.query);
    if (launchContext.category) setCategoryFilter(launchContext.category);
    onLaunchContextConsumed?.();
  }, [launchContext, onLaunchContextConsumed]);

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
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
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
  }, [categoryFilter, occasion, selectedBaseItem, sustainabilityWeight, weather]);

  useEffect(() => {
    if (!selectedBaseItem?._id) return;

    const loadSimilarItems = async () => {
      setSimilarLoading(true);
      try {
        const response = await itemsAPI.getSimilarCatalogItems(selectedBaseItem._id, { limit: 6, page: 1 });
        setSimilarItems(response.data.items || []);
      } catch (error) {
        console.error('Failed to load similar items:', error);
        setSimilarItems([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilarItems();
  }, [selectedBaseItem]);

  useEffect(() => {
    if (!selectedBaseItem || !similarSectionRef.current) return;
    similarSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedBaseItem, similarItems]);

  const shopItems = useMemo(() => {
    return catalog.map((item) => {
      const price = typeof item.price === 'number' ? item.price : 68;
      return {
        ...item,
        id: item._id,
        image: getImage(item),
        price,
        originalPrice: Math.round(price * 1.3),
        rating: 4.6,
        reviews: 120,
        color: item.color || 'Neutral',
        style: inferStyle(item),
        type: item.category,
        materials: item.material ? [item.material] : [],
        sustainable: {
          organic: Boolean(String(item.material || '').toLowerCase().includes('organic')),
          recycled: Boolean(String(item.material || '').toLowerCase().includes('recycled') || (item.tags || []).some((tag) => tag.toLowerCase().includes('recycled'))),
          local: false,
        },
      };
    });
  }, [catalog]);

  const availableTags = useMemo(() => {
    return [...new Set(shopItems.flatMap((item) => item.tags || []))].sort();
  }, [shopItems]);

  const filteredItems = useMemo(() => {
    return shopItems.filter((item) => {
      const sustainabilityScore = calculateSustainabilityScore({
        sustainable: item.sustainable,
        materials: item.materials,
        tags: item.tags,
        brand: item.brand,
        sustainabilityScore: item.sustainabilityScore,
        brandEthicsScore: item.brandEthicsScore,
        carbonScore: item.carbonScore,
      });

      if (searchQuery && !`${item.name} ${getDisplayBrand(item.brand)} ${(item.tags || []).join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== 'all' && getCategoryBucket(item.category) !== categoryFilter.toLowerCase()) return false;
      if (styleFilter !== 'all' && item.style !== styleFilter) return false;
      if (brandFilter !== 'all' && getDisplayBrand(item.brand) !== brandFilter) return false;
      if (tagFilter !== 'all' && !(item.tags || []).includes(tagFilter)) return false;
      if (sustainabilityFilter === 'high-score' && sustainabilityScore < 75) return false;
      return true;
    });
  }, [brandFilter, categoryFilter, searchQuery, shopItems, styleFilter, sustainabilityFilter, tagFilter]);

  const getUniqueBrands = () => [...new Set(shopItems.map((item) => getDisplayBrand(item.brand)).filter(Boolean))].sort();

  const activeFilterLabels = useMemo(() => {
    return [
      searchQuery ? `Search: ${searchQuery}` : null,
      categoryFilter !== 'all' ? `Category: ${categoryFilter}` : null,
      styleFilter !== 'all' ? `Style: ${styleFilter}` : null,
      brandFilter !== 'all' ? `Brand: ${brandFilter}` : null,
      tagFilter !== 'all' ? `Tag: ${tagFilter}` : null,
      sustainabilityFilter === 'high-score' ? 'Sustainability 75+' : null,
    ].filter(Boolean) as string[];
  }, [brandFilter, categoryFilter, searchQuery, styleFilter, sustainabilityFilter, tagFilter]);

  const getFitSignals = (item: any) => {
    const signals: string[] = [];
    if (searchQuery && `${item.name} ${getDisplayBrand(item.brand)} ${(item.tags || []).join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase())) {
      signals.push(`Search Match`);
    }
    if (categoryFilter !== 'all' && getCategoryBucket(item.category) === categoryFilter.toLowerCase()) {
      signals.push(`Fits ${item.category}`);
    }
    if (styleFilter !== 'all' && item.style === styleFilter) {
      signals.push(styleFilter);
    }
    if (tagFilter !== 'all' && (item.tags || []).includes(tagFilter)) {
      signals.push(tagFilter);
    }
    return signals.slice(0, 3);
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
      toast.success(`${item.name} saved to wardrobe as a wishlist piece`);
    } catch (error) {
      console.error('Failed to save wardrobe item:', error);
      toast.error('Could not save this item to your wardrobe');
    }
  };

  const selectBaseItem = (item: ShopCatalogItem) => {
    setSelectedBaseItem(item);
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

  const renderCatalogCard = (item: any, variant: 'catalog' | 'similar' | 'recommendation' = 'catalog') => {
    const sustainabilityScore = calculateSustainabilityScore({
      sustainable: item.sustainable,
      materials: item.materials,
      tags: item.tags,
      brand: item.brand,
      sustainabilityScore: item.sustainabilityScore,
      brandEthicsScore: item.brandEthicsScore,
      carbonScore: item.carbonScore,
    });
    const highlights = getSustainabilityHighlights({
      sustainable: item.sustainable,
      materials: item.materials,
      tags: item.tags,
      brand: item.brand,
      carbonScore: item.carbonScore,
    });
    const fitSignals = getFitSignals(item);

    return (
      <Card key={`${variant}-${item.id || item._id}`} className='overflow-hidden h-full'>
        <div className='relative'>
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            className='w-full h-56 object-cover cursor-pointer'
            onClick={() => {
              setSelectedItem(item);
              setShowDetailModal(true);
            }}
          />
          <Button variant='ghost' size='sm' className='absolute top-2 right-2 bg-card/95 hover:bg-card' onClick={() => toggleFavorite(String(item.id || item._id))}>
            <Heart className={`w-4 h-4 ${favoriteItems.includes(String(item.id || item._id)) ? 'fill-current text-red-500' : ''}`} />
          </Button>
        </div>
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h3 className='font-semibold line-clamp-1'>{item.name}</h3>
              <p className='text-sm text-muted-foreground'>{getDisplayBrand(item.brand)}</p>
            </div>
            <div className='text-right'>
              <p className='font-bold text-green-600'>${item.price}</p>
              {item.originalPrice && <p className='text-xs text-muted-foreground line-through'>${item.originalPrice}</p>}
            </div>
          </div>

          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            <Star className='w-4 h-4 fill-current text-yellow-400' />
            <span>{item.rating || 4.6}</span>
            <span>({item.reviews || 120})</span>
            {typeof item.similarity === 'number' && <Badge variant='outline' className='ml-auto'>Match {(item.similarity * 100).toFixed(0)}%</Badge>}
          </div>

          <div className='flex flex-wrap gap-1'>
            <Badge variant='secondary'>{item.category}</Badge>
            <Badge className={getSustainabilityBgColor(sustainabilityScore)}>{getSustainabilityGrade(sustainabilityScore)}</Badge>
            {(item.tags || []).slice(0, 2).map((tag: string) => (
              <Badge key={`${item.id || item._id}-${tag}`} variant='outline' className='text-xs'>
                <Tag className='w-3 h-3 mr-1' />
                {tag}
              </Badge>
            ))}
          </div>

          {fitSignals.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {fitSignals.map((signal) => (
                <Badge key={`${item.id || item._id}-${signal}`} className='bg-amber-100 text-amber-900 hover:bg-amber-100'>
                  {signal}
                </Badge>
              ))}
            </div>
          )}

          {item.description && <p className='text-sm text-muted-foreground line-clamp-2'>{item.description}</p>}

          <div className='flex flex-wrap gap-1'>
            {highlights.slice(0, 2).map((highlight) => (
              <Badge key={highlight} variant='outline' className='text-xs'>
                <Leaf className='w-3 h-3 mr-1' />
                {highlight}
              </Badge>
            ))}
          </div>

          <div className='grid grid-cols-2 gap-2 pt-2'>
            <Button size='sm' onClick={() => onAddToCart(item)}>
              <ShoppingCart className='w-4 h-4 mr-2' />
              Add to Cart
            </Button>
            <Button variant='outline' size='sm' onClick={() => selectBaseItem(item)}>
              <ArrowLeftRight className='w-4 h-4 mr-2' />
              Similar
            </Button>
          </div>

          <Button variant='secondary' size='sm' className='w-full' onClick={() => addToWardrobe(item)}>
            <Plus className='w-4 h-4 mr-2' />
            Save to Wardrobe
          </Button>

          {variant === 'recommendation' && item.reasons?.length > 0 && (
            <div className='space-y-1 text-sm text-muted-foreground'>
              {item.reasons.slice(0, 2).map((reason: string) => <p key={`${item._id}-${reason}`}>{reason}</p>)}
            </div>
          )}

          {variant === 'recommendation' && (
            <Button variant='ghost' size='sm' className='w-full' onClick={() => likeRecommendation(item._id)}>
              <Heart className='w-4 h-4 mr-2' />
              Like Suggestion
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <motion.div className="bg-gradient-to-r from-green-50 via-stone-50 to-amber-50 rounded-lg p-6 md:p-8 text-center border border-border" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Shop The Alternative</h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-6">One live shopping tab with search, alternatives, and smart suggestions in the same flow.</p>
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          <Badge variant="secondary" className="px-4 py-2">Live Catalog</Badge>
          <Badge variant="secondary" className="px-4 py-2">Visual Alternatives</Badge>
          <Badge variant="secondary" className="px-4 py-2">Sustainability Rated</Badge>
          <Badge variant="secondary" className="px-4 py-2">Cart Ready</Badge>
        </div>
      </motion.div>

      <ScrollingClothesSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />Search, Filter, and Discover</CardTitle>
          <CardDescription>Search the catalog, then use Similar on any item to surface live alternatives instantly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
            <div className="relative sm:col-span-2 xl:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by product, brand, or tag..." value={searchQuery} onChange={(e) => { setCatalogPage(1); setSearchQuery(e.target.value); }} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => { setCatalogPage(1); setCategoryFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="top">Tops</SelectItem>
                <SelectItem value="bottom">Bottoms</SelectItem>
                <SelectItem value="outerwear">Outerwear</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
                <SelectItem value="dress">Dresses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={styleFilter} onValueChange={(value) => { setCatalogPage(1); setStyleFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Style" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Streetwear">Streetwear</SelectItem>
                <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                <SelectItem value="Athletic">Athletic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={(value) => { setCatalogPage(1); setBrandFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {getUniqueBrands().map((brand) => <SelectItem key={brand} value={brand!}>{brand}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={(value) => { setCatalogPage(1); setTagFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sustainabilityFilter} onValueChange={(value) => { setCatalogPage(1); setSustainabilityFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Sustainability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="high-score">Score 75+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={(value) => { setCatalogPage(1); setPriceFilter(value); }}>
              <SelectTrigger><SelectValue placeholder="Price Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under50">Under $50</SelectItem>
                <SelectItem value="50to100">$50 - $100</SelectItem>
                <SelectItem value="100to200">$100 - $200</SelectItem>
                <SelectItem value="over200">Over $200</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">{filteredItems.length} items found</div>
          </div>

          <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger><SelectValue placeholder='Weather' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='cold'>Cold</SelectItem>
                <SelectItem value='mild'>Mild</SelectItem>
                <SelectItem value='warm'>Warm</SelectItem>
                <SelectItem value='rainy'>Rainy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger><SelectValue placeholder='Occasion' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='casual'>Casual</SelectItem>
                <SelectItem value='work'>Work</SelectItem>
                <SelectItem value='evening'>Evening</SelectItem>
                <SelectItem value='formal'>Formal</SelectItem>
              </SelectContent>
            </Select>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Recommendation sustainability</span>
                <span>{sustainabilityWeight}%</span>
              </div>
              <Input type='range' min='0' max='100' step='5' value={sustainabilityWeight} onChange={(event) => setSustainabilityWeight(Number(event.target.value))} />
            </div>
          </div>

          {activeFilterLabels.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {activeFilterLabels.map((label) => <Badge key={label} variant='outline'>{label}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      {catalogLoading ? (
        <p className="text-muted-foreground">Loading shop...</p>
      ) : filteredItems.length === 0 ? (
        <Card><CardContent className="text-center py-12">No items found for this filter.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item) => renderCatalogCard(item, 'catalog'))}
        </div>
      )}

      <div className='flex justify-center'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' disabled={catalogPage <= 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}>Previous</Button>
          <Badge variant='outline'>Page {catalogPage} of {catalogTotalPages}</Badge>
          <Button variant='outline' size='sm' disabled={catalogPage >= catalogTotalPages} onClick={() => setCatalogPage((page) => Math.min(catalogTotalPages, page + 1))}>Next</Button>
        </div>
      </div>

      <div ref={similarSectionRef} className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold'>Alternatives Right Now</h2>
            <p className='text-sm text-muted-foreground'>Press Similar on any product to run an instant visual alternative search.</p>
          </div>
          {selectedBaseItem && <Badge variant='secondary'>From {selectedBaseItem.name}</Badge>}
        </div>

        {!selectedBaseItem ? (
          <Alert>
            <ArrowLeftRight className='h-4 w-4' />
            <AlertDescription>Choose any item above to fetch visually similar alternatives immediately.</AlertDescription>
          </Alert>
        ) : similarLoading ? (
          <p className='text-muted-foreground'>Searching for alternatives...</p>
        ) : similarItems.length === 0 ? (
          <Card><CardContent className='py-10 text-muted-foreground'>No alternatives found for this item yet.</CardContent></Card>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            {similarItems.map((item) => renderCatalogCard({
              ...item,
              id: item._id,
              image: getImage(item),
              price: typeof item.price === 'number' ? item.price : 68,
              originalPrice: Math.round((typeof item.price === 'number' ? item.price : 68) * 1.2),
              rating: 4.5,
              reviews: 84,
              color: item.color || 'Neutral',
              style: inferStyle(item),
              type: item.category,
              materials: item.material ? [item.material] : [],
              sustainable: {
                organic: Boolean(String(item.material || '').toLowerCase().includes('organic')),
                recycled: Boolean(String(item.material || '').toLowerCase().includes('recycled') || (item.tags || []).some((tag) => tag.toLowerCase().includes('recycled'))),
                local: false,
              },
            }, 'similar'))}
          </div>
        )}
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold flex items-center gap-2'>
              <Sparkles className='w-5 h-5' />
              Smart Suggestions
            </h2>
            <p className='text-sm text-muted-foreground'>Recommendation ranking blends your filters, wardrobe context, and sustainability preference.</p>
          </div>
        </div>

        {recommendationsLoading ? (
          <p className='text-muted-foreground'>Loading smart suggestions...</p>
        ) : recommendations.length === 0 ? (
          <Card><CardContent className='py-10 text-muted-foreground'>No suggestions available yet.</CardContent></Card>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
            {recommendations.map((item) => renderCatalogCard({
              ...item,
              id: item._id,
              image: getImage(item),
              price: typeof item.price === 'number' ? item.price : 68,
              originalPrice: Math.round((typeof item.price === 'number' ? item.price : 68) * 1.2),
              rating: 4.7,
              reviews: 132,
              color: item.color || 'Neutral',
              style: inferStyle(item),
              type: item.category,
              materials: item.material ? [item.material] : [],
              sustainable: {
                organic: Boolean(String(item.material || '').toLowerCase().includes('organic')),
                recycled: Boolean(String(item.material || '').toLowerCase().includes('recycled') || (item.tags || []).some((tag: string) => tag.toLowerCase().includes('recycled'))),
                local: false,
              },
            }, 'recommendation'))}
          </div>
        )}
      </div>

      <ItemDetailModal
        item={selectedItem}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToWardrobe={addToWardrobe}
        onAddToCart={onAddToCart}
        onToggleFavorite={(itemId) => toggleFavorite(String(itemId))}
        isFavorite={selectedItem ? favoriteItems.includes(String(selectedItem.id)) : false}
      />
    </motion.div>
  );
}
