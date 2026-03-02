import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Heart, ShoppingCart, Star, Leaf, Recycle, MapPin, Tag, Plus } from "lucide-react";

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
}

interface ItemDetailModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToWardrobe?: (item: ClothingItem) => void;
  onToggleFavorite?: (itemId: number) => void;
  isFavorite?: boolean;
}

export function ItemDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onAddToWardrobe, 
  onToggleFavorite,
  isFavorite = false 
}: ItemDetailModalProps) {
  if (!item) return null;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {item.name}
            <div className="flex items-center gap-2">
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
          <DialogDescription>
            {item.brand && `${item.brand} • `}
            {item.category || item.type} • {item.style}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative">
              <ImageWithFallback
                src={item.image}
                alt={item.name}
                className="w-full h-96 object-cover rounded-lg"
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
            <div className="grid grid-cols-4 gap-2">
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
          <div className="space-y-6">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
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
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">Color:</span>
                <p className="text-sm">{item.color}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Style:</span>
                <p className="text-sm">{item.style}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Type:</span>
                <p className="text-sm">{item.type}</p>
              </div>
              {item.brand && (
                <div>
                  <span className="text-sm font-medium">Brand:</span>
                  <p className="text-sm">{item.brand}</p>
                </div>
              )}
            </div>
            
            {/* Sustainability Info */}
            {item.sustainable && (
              <div>
                <h4 className="font-medium mb-3">Sustainability</h4>
                <div className="flex flex-wrap gap-2">
                  {getSustainabilityIcons(item.sustainable).map(({ icon: Icon, color, label }, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${color}`} />
                      {label}
                    </Badge>
                  ))}
                </div>
                {item.materials && item.materials.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Materials:</span>
                    <p className="text-sm text-muted-foreground">{item.materials.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Description */}
            {item.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
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
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => alert('Added to cart! (This is a demo)')}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart - ${item.price}
                </Button>
                {onAddToWardrobe && (
                  <Button variant="outline" className="w-auto whitespace-nowrap" onClick={() => onAddToWardrobe(item)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Wardrobe
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex-1" onClick={() => onToggleFavorite?.(item.id)}>
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current text-red-500" : ""}`} />
                  {isFavorite ? 'Favorited' : 'Add to Wishlist'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => alert('Share feature coming soon!')}>
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
          <div className="grid grid-cols-3 gap-4">
            {relatedItems.map((relatedItem) => (
              <div key={relatedItem.id} className="group cursor-pointer">
                <ImageWithFallback
                  src={relatedItem.image}
                  alt={relatedItem.name}
                  className="w-full h-32 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
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