import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Search, ShoppingCart, ArrowLeftRight, Filter, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { itemsAPI } from '../services/api';

type CatalogItem = {
  _id: string;
  name: string;
  category: string;
  tags?: string[];
  price?: number;
  brand?: string;
  imageUrl?: string;
  similarity?: number;
};

type DiscoveryProps = {
  wardrobe: any[];
  analyzedItem: any;
};

const PAGE_SIZE = 24;
const SIMILAR_PAGE_SIZE = 12;

export function Discovery({ analyzedItem }: DiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [selectedBaseItem, setSelectedBaseItem] = useState<CatalogItem | null>(null);
  const [similarItems, setSimilarItems] = useState<CatalogItem[]>([]);
  const [similarPage, setSimilarPage] = useState(1);
  const [similarTotalPages, setSimilarTotalPages] = useState(1);
  const [similarLoading, setSimilarLoading] = useState(false);

  const analyzedCategory = analyzedItem?.detected_item?.type || '';

  const currentCategory = useMemo(() => {
    if (categoryFilter !== 'all') return categoryFilter;
    return '';
  }, [categoryFilter]);

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

  const selectBaseItem = (item: CatalogItem) => {
    setSelectedBaseItem(item);
    setSimilarPage(1);
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
            DeepFashion Discovery
          </CardTitle>
          <CardDescription>
            Browse a paginated catalog seeded from DeepFashion, including price bands and tags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 mb-4'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4' />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setCatalogPage(1);
                  setSearchQuery(e.target.value);
                }}
                placeholder='Search by name, category, tag'
                className='w-60'
              />
            </div>

            <Select value={priceFilter} onValueChange={(value) => { setCatalogPage(1); setPriceFilter(value); }}>
              <SelectTrigger className='w-36'>
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
              <SelectTrigger className='w-44'>
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

            {analyzedCategory && (
              <Badge variant='outline' className='flex items-center gap-1'>
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

      <Tabs defaultValue='recommendations' className='w-full'>
        <TabsList>
          <TabsTrigger value='recommendations'>Shop Catalog</TabsTrigger>
          <TabsTrigger value='similar' disabled={!selectedBaseItem}>Similar Clothing</TabsTrigger>
          <TabsTrigger value='trending'>Top Picks</TabsTrigger>
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
                  <Card key={item._id} className='overflow-hidden'>
                    <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-52 object-cover' />
                    <CardContent className='p-4 space-y-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                          <p className='text-sm text-muted-foreground'>{item.brand || 'DeepFashion'}</p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium'>${item.price ?? 'N/A'}</p>
                          <Badge variant='outline'>{getPriceTier(item.price)}</Badge>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-1'>
                        <Badge variant='secondary'>{item.category}</Badge>
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={`${item._id}-${tag}`} variant='outline'>#{tag}</Badge>
                        ))}
                      </div>

                      <div className='flex gap-2'>
                        <Button className='flex-1' size='sm'>
                          <ShoppingCart className='w-4 h-4 mr-1' />
                          Shop
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
                    <Card key={item._id} className='overflow-hidden'>
                      <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-52 object-cover' />
                      <CardContent className='p-4 space-y-3'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                            <p className='text-sm text-muted-foreground'>{item.brand || 'DeepFashion'}</p>
                          </div>
                          <p className='font-medium'>${item.price ?? 'N/A'}</p>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary'>{item.category}</Badge>
                          <Badge variant='outline'>Match {(item.similarity ?? 0).toFixed(2)}</Badge>
                        </div>

                        <div className='flex flex-wrap gap-1'>
                          {(item.tags || []).slice(0, 4).map((tag) => (
                            <Badge key={`${item._id}-sim-${tag}`} variant='outline'>#{tag}</Badge>
                          ))}
                        </div>
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
          <p className='text-muted-foreground mb-4'>Trending currently mirrors the top catalog items from page 1.</p>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {catalog.slice(0, 6).map((item) => (
              <Card key={`trend-${item._id}`} className='overflow-hidden'>
                <ImageWithFallback src={getImage(item)} alt={item.name} className='w-full h-48 object-cover' />
                <CardContent className='p-4 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-medium line-clamp-1'>{item.name}</h3>
                    <Badge>Trending</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>{item.category}</p>
                  <p className='font-medium'>${item.price ?? 'N/A'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
