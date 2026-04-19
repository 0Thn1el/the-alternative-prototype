import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Heart, ShoppingCart, Star, Leaf, Recycle, MapPin, Tag, Plus, ArrowLeftRight, Package, Ruler } from "lucide-react";
import { calculateSustainabilityScore, getSustainabilityBgColor, getSustainabilityGrade, getSustainabilityHighlights } from '../utils/sustainabilityScore';
import { toast } from 'sonner';

interface ClothingItem {
  id: number;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image: string;
  category?: string;
  type: string;
  color: string;
  style: string;
  tags?: string[];
  materials?: string[];
  sustainable?: {
    organic: boolean;
    recycled: boolean;
    local: boolean;
  };
  description?: string;
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
}

type CartSelection = {
  size: string;
  quantity: number;
  stock: number;
};

interface ItemDetailModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToWardrobe?: (item: ClothingItem) => void;
  onAddToCart?: (item: ClothingItem, selection?: CartSelection) => void;
  onViewSimilar?: (item: ClothingItem) => void;
  onToggleFavorite?: (itemId: number) => void;
  isFavorite?: boolean;
}

function getDisplayBrand(brand?: string): string {
  if (!brand || /deepfashion/i.test(brand)) return 'The Alternative';
  return brand;
}

function getSizesForCategory(category?: string): string[] {
  const normalizedCategory = String(category || '').toLowerCase();

  if (normalizedCategory.includes('shoes')) return ['6', '7', '8', '9', '10', '11'];
  if (normalizedCategory.includes('dress') || normalizedCategory.includes('top') || normalizedCategory.includes('outerwear')) {
    return ['XS', 'S', 'M', 'L', 'XL'];
  }
  if (normalizedCategory.includes('bottom')) return ['26', '28', '30', '32', '34', '36'];
  return ['One Size', 'S', 'M', 'L'];
}

function getStockForItem(item: ClothingItem | null): number {
  const seedSource = String(item?.id || item?.name || 'item');
  const seed = Array.from(seedSource).reduce((total, char) => total + char.charCodeAt(0), 0);
  return 2 + (seed % 12);
}

export function ItemDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onAddToWardrobe, 
  onAddToCart,
  onViewSimilar,
  onToggleFavorite,
  isFavorite = false 
}: ItemDetailModalProps) {
  const sizeOptions = useMemo(() => getSizesForCategory(item?.category || item?.type), [item?.category, item?.type]);
  const stock = useMemo(() => getStockForItem(item), [item]);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedSize(sizeOptions[0] || 'One Size');
    setQuantity(1);
  }, [item, sizeOptions]);

  if (!item) return null;

  const sustainabilityScore = calculateSustainabilityScore({
    sustainable: item.sustainable,
    materials: item.materials,
    tags: item.tags,
    brand: item.brand,
    sustainabilityScore: item.sustainabilityScore,
    brandEthicsScore: item.brandEthicsScore,
    carbonScore: item.carbonScore,
  });
  const sustainabilityHighlights = getSustainabilityHighlights({
    sustainable: item.sustainable,
    materials: item.materials,
    tags: item.tags,
    brand: item.brand,
    carbonScore: item.carbonScore,
  });

  const getSustainabilityIcons = (sustainable?: { organic: boolean; recycled: boolean; local: boolean }) => {
    if (!sustainable) return [];
    const icons = [];
    if (sustainable.organic) {
      icons.push({ icon: Leaf, color: "text-green-600", label: "Organic" });
    }
    if (sustainable.recycled) {
      icons.push({ icon: Recycle, color: "text-blue-600", label: "Recycled" });
    }
    if (sustainable.local) {
      icons.push({ icon: MapPin, color: "text-purple-600", label: "Local Production" });
    }
    return icons;
  };

  const relatedItems = [
    {
      id: 999,
      name: "Similar Organic Shirt",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop",
      price: 45
    },
    {
      id: 998,
      name: "Matching Accessories",
      image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=200&fit=crop",
      price: 25
    },
    {
      id: 997,
      name: "Complementary Bottom",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&h=200&fit=crop",
      price: 79
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl overflow-x-hidden overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-3 pr-8 text-left sm:flex-row sm:items-start sm:justify-between">
            <span className="min-w-0 break-words pr-0 sm:pr-4">{item.name}</span>
            <div className="flex shrink-0 items-center gap-2 self-start">
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span className="text-sm">{item.rating}</span>
                  {item.reviews && (
                    <span className="text-sm text-muted-foreground">({item.reviews})</span>
                  )}
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="break-words pr-8 leading-relaxed">
            {`${getDisplayBrand(item.brand)} • `}
            {item.category || item.type} • {item.style}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Image Section */}
          <div className="min-w-0 space-y-4">
            <div className="relative overflow-hidden rounded-lg">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="block h-72 w-full object-cover sm:h-96"
              />
              {item.originalPrice && item.originalPrice > item.price && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-card/95 hover:bg-card shadow-lg border border-border"
                onClick={() => onToggleFavorite?.(item.id)}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current text-red-500" : "text-foreground"}`} />
              </Button>
            </div>
            
            {/* Additional Images Placeholder */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div 
                  key={index} 
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs"
                >
                  View {index + 2}
                </div>
              ))}
            </div>
          </div>
          
          {/* Details Section */}
          <div className="min-w-0 space-y-6">
            {/* Price */}
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">${item.price}</span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-lg text-muted-foreground line-through">${item.originalPrice}</span>
                )}
              </div>
              {item.originalPrice && item.originalPrice > item.price && (
                <p className="text-sm text-green-600">
                  You save ${item.originalPrice - item.price}!
                </p>
              )}
            </div>
            
            {/* Basic Details */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <span className="text-sm font-medium">Color:</span>
                <p className="text-sm break-words">{item.color}</p>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium">Style:</span>
                <p className="text-sm break-words">{item.style}</p>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium">Type:</span>
                <p className="text-sm break-words">{item.type}</p>
              </div>
              {getDisplayBrand(item.brand) && (
                <div className="min-w-0">
                  <span className="text-sm font-medium">Brand:</span>
                  <p className="text-sm break-words">{getDisplayBrand(item.brand)}</p>
                </div>
              )}
            </div>
            
            {/* Sustainability Info */}
            {item.sustainable && (
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="font-medium">Sustainability</h4>
                  <Badge className={getSustainabilityBgColor(sustainabilityScore)}>
                    {getSustainabilityGrade(sustainabilityScore)} - {sustainabilityScore}/100
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSustainabilityIcons(item.sustainable).map(({ icon: Icon, color, label }, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${color}`} />
                      {label}
                    </Badge>
                  ))}
                  {sustainabilityHighlights.map((highlight) => (
                    <Badge key={highlight} variant="outline">{highlight}</Badge>
                  ))}
                </div>
                {item.materials && item.materials.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Materials:</span>
                    <p className="text-sm text-muted-foreground break-words">{item.materials.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Description */}
            {item.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed break-words">{item.description}</p>
              </div>
            )}
            
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {stock} in stock
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {String(item.category || item.type || 'Item')}
                  </Badge>
                  {item.color && <Badge variant="outline">{item.color}</Badge>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="detail-cart-size">Size</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger id="detail-cart-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detail-cart-quantity">Quantity</Label>
                    <Input
                      id="detail-cart-quantity"
                      type="number"
                      min={1}
                      max={stock}
                      value={quantity}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setQuantity(Number.isNaN(nextValue) ? 1 : Math.max(1, Math.min(stock, nextValue)));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button className="h-auto whitespace-normal px-3 py-2 text-center leading-tight" onClick={() => onAddToCart?.(item, { size: selectedSize, quantity, stock })}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                {onAddToWardrobe && (
                  <Button variant="outline" className="h-auto w-full whitespace-normal px-3 py-2 text-center leading-tight" onClick={() => onAddToWardrobe(item)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Save to Wardrobe
                  </Button>
                )}
                {onViewSimilar && (
                  <Button variant="secondary" className="h-auto w-full whitespace-normal px-3 py-2 text-center leading-tight sm:col-span-2" onClick={() => onViewSimilar(item)}>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    View Similar Styles
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto whitespace-normal px-3 py-2 text-center leading-tight" onClick={() => onToggleFavorite?.(item.id)}>
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                  {isFavorite ? 'Favorited' : 'Wishlist'}
                </Button>
                <Button variant="outline" className="h-auto whitespace-normal px-3 py-2 text-center leading-tight" onClick={() => toast.success('Share feature coming soon')}>
                  Share
                </Button>
              </div>
            </div>
            
            {/* Size Guide */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Size Guide</h4>
              <p className="text-sm text-muted-foreground">
                Need help with sizing? Check our detailed size guide for the perfect fit.
              </p>
              <Button variant="link" className="p-0 h-auto text-blue-600">
                View Size Chart
              </Button>
            </div>
            
            {/* Care Instructions */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Care Instructions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Machine wash cold with like colors</li>
                <li>• Tumble dry low heat</li>
                <li>• Iron on low temperature if needed</li>
                <li>• Do not bleach</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Related Items */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium mb-4">You might also like</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((relatedItem) => (
              <div key={relatedItem.id} className="group min-w-0 cursor-pointer">
                <ImageWithFallback
                  src={relatedItem.image}
                  alt={relatedItem.name}
                  className="block h-32 w-full rounded-lg object-cover transition-opacity group-hover:opacity-80"
                />
                <p className="text-sm font-medium mt-2 line-clamp-1">{relatedItem.name}</p>
                <p className="text-sm text-green-600">${relatedItem.price}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}