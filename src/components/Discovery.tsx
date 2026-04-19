import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Search, ShoppingCart, ArrowLeftRight, Filter, ChevronLeft, ChevronRight, Sparkles, Heart, Leaf } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { itemsAPI } from '../services/api';
import { getSustainabilityBgColor, getSustainabilityGrade } from '../utils/sustainabilityScore';

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

export function Discovery({ analyzedItem, onAddToCart, launchContext, onLaunchContextConsumed }: DiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
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

  const analyzedCategory = analyzedItem?.detected_item?.type || '';

  const currentCategory = useMemo(() => {
    if (categoryFilter !== 'all') return categoryFilter;
    return '';
  }, [categoryFilter]);

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

        if (priceFilter === 'budget') {
          params.maxPrice = 49;
        } else if (priceFilter === 'mid-range') {
          params.minPrice = 50;
          params.maxPrice = 149;
        } else if (priceFilter === 'premium') {
          params.minPrice = 150;
        }

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
  }, [catalogPage, searchQuery, currentCategory, priceFilter]);

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

  const renderPagination = (
    page: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => (
    <div className='flex items-center justify-center gap-2 pt-4'>
      <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className='w-4 h-4' />
      </Button>
      <div className='flex items-center gap-1'>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
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
      <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className='w-4 h-4' />
      </Button>
    </div>
  );

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
          <div className='grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 xl:grid-cols-6'>
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

            <Select value={priceFilter} onValueChange={(value) => { setCatalogPage(1); setPriceFilter(value); }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Price' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Prices</SelectItem>
                <SelectItem value='budget'>Budget</SelectItem>
                <SelectItem value='mid-range'>Mid-range</SelectItem>
                <SelectItem value='premium'>Premium</SelectItem>
              </SelectContent>
            </Select>

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

            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Weather' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='cold'>Cold</SelectItem>
                <SelectItem value='mild'>Mild</SelectItem>
                <SelectItem value='warm'>Warm</SelectItem>
                <SelectItem value='rainy'>Rainy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Occasion' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='casual'>Casual</SelectItem>
                <SelectItem value='work'>Work</SelectItem>
                <SelectItem value='evening'>Evening</SelectItem>
                <SelectItem value='formal'>Formal</SelectItem>
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
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {catalog.map((item) => (
                  <Card key={item._id} className='overflow-hidden min-w-0'>
                    <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-52 object-cover' />
                    <CardContent className='p-4 space-y-3 min-w-0'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                          <p className='text-sm text-muted-foreground'>{getDisplayBrand(item.brand)}</p>
                        </div>
                        <div className='shrink-0 text-right'>
                          <p className='font-medium'>${item.price ?? 'N/A'}</p>
                          <Badge variant='outline'>{getPriceTier(item.price)}</Badge>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-1'>
                        <Badge variant='secondary'>{item.category}</Badge>
                        {typeof item.sustainabilityScore === 'number' && (
                          <Badge className={getSustainabilityBgColor(Math.round(item.sustainabilityScore * 100))}>
                            <Leaf className='w-3 h-3 mr-1' />
                            {getSustainabilityGrade(Math.round(item.sustainabilityScore * 100))}
                          </Badge>
                        )}
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={`${item._id}-${tag}`} variant='outline'>{tag}</Badge>
                        ))}
                      </div>

                      {item.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>{item.description}</p>
                      )}

                      <div className='flex flex-col gap-2 sm:flex-row'>
                        <Button className='flex-1' size='sm' onClick={() => onAddToCart({ ...item, image: getImage(item) })}>
                          <ShoppingCart className='w-4 h-4 mr-1' />
                          Add to Cart
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => selectBaseItem(item)}>
                          <ArrowLeftRight className='w-4 h-4 mr-1' />
                          Similar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                  Showing items similar to: {selectedBaseItem.name}
                </AlertDescription>
              </Alert>

              <div className='mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {similarLoading ? (
                  <p className='text-muted-foreground'>Loading similar items...</p>
                ) : similarItems.length === 0 ? (
                  <p className='text-muted-foreground'>No similar items found.</p>
                ) : (
                  similarItems.map((item) => (
                    <Card key={item._id} className='overflow-hidden min-w-0'>
                      <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-52 object-cover' />
                      <CardContent className='p-4 space-y-3 min-w-0'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                            <p className='text-sm text-muted-foreground'>{getDisplayBrand(item.brand)}</p>
                          </div>
                          <p className='shrink-0 font-medium'>${item.price ?? 'N/A'}</p>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{item.category}</Badge>
                          <Badge variant='outline'>Match {(item.similarity ?? 0).toFixed(2)}</Badge>
                          {typeof item.sustainabilityScore === 'number' && (
                            <Badge className={getSustainabilityBgColor(Math.round(item.sustainabilityScore * 100))}>
                              {getSustainabilityGrade(Math.round(item.sustainabilityScore * 100))}
                            </Badge>
                          )}
                        </div>

                        <div className='flex flex-wrap gap-1'>
                          {(item.tags || []).slice(0, 4).map((tag) => (
                            <Badge key={`${item._id}-sim-${tag}`} variant='outline'>{tag}</Badge>
                          ))}
                        </div>

                        <Button size='sm' onClick={() => onAddToCart({ ...item, image: getImage(item) })}>
                          <ShoppingCart className='w-4 h-4 mr-1' />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

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
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {recommendations.map((item) => (
                <Card key={`rec-${item._id}`} className='overflow-hidden min-w-0'>
                  <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-48 object-cover' />
                  <CardContent className='p-4 space-y-3 min-w-0'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                        <p className='text-sm text-muted-foreground'>{getDisplayBrand(item.brand)}</p>
                      </div>
                      <Badge className='shrink-0'>Score {item.score.toFixed(2)}</Badge>
                    </div>

                    <div className='flex flex-wrap gap-1'>
                      <Badge variant='secondary'>{item.category}</Badge>
                      <Badge variant='outline'>Style {(item.scoreBreakdown.behaviourMatch * 100).toFixed(0)}%</Badge>
                      <Badge variant='outline'>Wardrobe {(item.scoreBreakdown.wardrobeCompatibility * 100).toFixed(0)}%</Badge>
                      <Badge variant='outline' className='flex items-center gap-1'>
                        <Leaf className='w-3 h-3' />
                        {(item.sustainabilityScore ?? item.scoreBreakdown.sustainabilityBoost).toFixed(2)}
                      </Badge>
                    </div>

                    <div className='space-y-1'>
                      {item.reasons.map((reason) => (
                        <p key={`${item._id}-${reason}`} className='text-sm text-muted-foreground'>
                          {reason}
                        </p>
                      ))}
                    </div>

                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <p className='font-medium'>${item.price ?? 'N/A'}</p>
                      <div className='flex flex-wrap gap-2'>
                        <Button variant='outline' size='sm' onClick={() => likeRecommendation(item._id)}>
                          <Heart className='w-4 h-4 mr-1' />
                          Like
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => onAddToCart({ ...item, image: getImage(item) })}>
                          <ShoppingCart className='w-4 h-4 mr-1' />
                          Cart
                        </Button>
                        <Button size='sm' onClick={() => selectBaseItem(item)}>
                          <ArrowLeftRight className='w-4 h-4 mr-1' />
                          Similar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
