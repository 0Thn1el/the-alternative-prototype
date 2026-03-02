import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { 
  Package, Plus, Trash2, Edit3, CheckCircle, XCircle, Shirt, Filter, Tag, 
  Folders, Grid3X3, List, Heart, Star, ShoppingBag, Eye, Sparkles, LayoutGrid 
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface ClothingItem {
  id: number;
  item: string;
  type: string;
  color: string;
  style: string;
  image: string;
  customTags?: string[];
  brand?: string;
  price?: number;
  fabric?: string;
  materials?: string[];
  sustainable?: {
    organic: boolean;
    recycled: boolean;
    local: boolean;
  };
  isFavorite?: boolean;
  isOwned?: boolean;
  description?: string;
  rating?: number;
}

interface EnhancedWardrobeProps {
  wardrobe: ClothingItem[];
  setWardrobe: (wardrobe: ClothingItem[]) => void;
  wardrobes: any[];
  setWardrobes: (wardrobes: any[]) => void;
  analyzedItem: any;
}

export function EnhancedWardrobe({ wardrobe, setWardrobe, wardrobes, setWardrobes, analyzedItem }: EnhancedWardrobeProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    item: '',
    type: '',
    color: '',
    style: '',
    image: '',
    customTags: [],
    brand: '',
    price: 0,
    fabric: '',
    description: '',
    isOwned: true,
    isFavorite: false
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [showFilter, setShowFilter] = useState('all'); // 'all', 'owned', 'favorites'
  
  // View states
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'tags'
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState([
    'Shoes', 'Jackets', 'Streetwear', 'Formal', 'Casual', 'Vintage', 'Designer'
  ]);

  // Tag management
  const addNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags([...availableTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const deleteTag = (tagToDelete: string) => {
    setAvailableTags(availableTags.filter(tag => tag !== tagToDelete));
    // Remove tag from all items
    setWardrobe(wardrobe.map(item => ({
      ...item,
      customTags: (item.customTags || []).filter(tag => tag !== tagToDelete)
    })));
  };

  // Item management
  const addItemToWardrobe = () => {
    if (newItem.item?.trim()) {
      const item: ClothingItem = {
        id: Date.now(),
        item: newItem.item!,
        type: newItem.type || '',
        color: newItem.color || '',
        style: newItem.style || '',
        image: newItem.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop',
        customTags: newItem.customTags || [],
        brand: newItem.brand || '',
        price: newItem.price || 0,
        fabric: newItem.fabric || '',
        description: newItem.description || '',
        isOwned: newItem.isOwned ?? true,
        isFavorite: newItem.isFavorite ?? false,
        materials: [],
        sustainable: { organic: false, recycled: false, local: false }
      };
      setWardrobe([...wardrobe, item]);
      setNewItem({
        item: '', type: '', color: '', style: '', image: '', customTags: [], 
        brand: '', price: 0, fabric: '', description: '', isOwned: true, isFavorite: false
      });
      setShowAddDialog(false);
    }
  };

  const toggleFavorite = (id: number) => {
    setWardrobe(wardrobe.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const toggleOwned = (id: number) => {
    setWardrobe(wardrobe.map(item => 
      item.id === id ? { ...item, isOwned: !item.isOwned } : item
    ));
  };

  const removeItemFromWardrobe = (id: number) => {
    setWardrobe(wardrobe.filter(item => item.id !== id));
  };

  const addTagToItem = (itemId: number, tag: string) => {
    if (!tag.trim()) return;
    setWardrobe(wardrobe.map(item => 
      item.id === itemId 
        ? { ...item, customTags: [...(item.customTags || []), tag.trim()] }
        : item
    ));
  };

  const removeTagFromItem = (itemId: number, tagToRemove: string) => {
    setWardrobe(wardrobe.map(item => 
      item.id === itemId 
        ? { ...item, customTags: (item.customTags || []).filter(tag => tag !== tagToRemove) }
        : item
    ));
  };

  // Smart suggestions based on wardrobe
  const getSmartSuggestions = useMemo(() => {
    const ownedColors = [...new Set(wardrobe.filter(item => item.isOwned).map(item => item.color))];
    const ownedStyles = [...new Set(wardrobe.filter(item => item.isOwned).map(item => item.style))];
    const ownedTags = [...new Set(wardrobe.filter(item => item.isOwned).flatMap(item => item.customTags || []))];
    
    // Mock suggestions based on analysis
    return [
      { name: "Navy Blazer", reason: "Complements your grey hoodie", type: "Outerwear" },
      { name: "White Button Shirt", reason: "Perfect for smart casual looks", type: "Top" },
      { name: "Black Ankle Boots", reason: "Versatile with your jeans", type: "Shoes" }
    ];
  }, [wardrobe]);

  // Filtering logic
  const filteredWardrobe = useMemo(() => {
    return wardrobe.filter(item => {
      // Search filter
      if (searchQuery && !item.item.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.brand?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      
      // Style filter
      if (styleFilter !== 'all' && item.style !== styleFilter) return false;
      
      // Color filter
      if (colorFilter !== 'all' && item.color !== colorFilter) return false;
      
      // Tag filter
      if (tagFilter !== 'all' && !(item.customTags || []).includes(tagFilter)) return false;
      
      // Brand filter
      if (brandFilter !== 'all' && item.brand !== brandFilter) return false;
      
      // Show filter (owned/favorites)
      if (showFilter === 'owned' && !item.isOwned) return false;
      if (showFilter === 'favorites' && !item.isFavorite) return false;
      
      return true;
    });
  }, [wardrobe, searchQuery, typeFilter, styleFilter, colorFilter, tagFilter, brandFilter, showFilter]);

  // Group by tags for tag view
  const groupedByTags = useMemo(() => {
    const grouped: { [key: string]: ClothingItem[] } = {};
    
    filteredWardrobe.forEach(item => {
      if (item.customTags && item.customTags.length > 0) {
        item.customTags.forEach(tag => {
          if (!grouped[tag]) grouped[tag] = [];
          grouped[tag].push(item);
        });
      } else {
        if (!grouped['Untagged']) grouped['Untagged'] = [];
        grouped['Untagged'].push(item);
      }
    });
    
    return grouped;
  }, [filteredWardrobe]);

  const getUniqueValues = (field: keyof ClothingItem) => {
    return [...new Set(wardrobe.map(item => item[field] as string).filter(Boolean))];
  };

  const openDetailView = (item: ClothingItem) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Enhanced Wardrobe Management
              </CardTitle>
              <CardDescription>
                Organize your clothing collection with advanced filtering, tags, and smart suggestions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Item to Wardrobe</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new clothing item to your virtual wardrobe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-name">Item Name *</Label>
                        <Input
                          id="item-name"
                          value={newItem.item || ''}
                          onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                          placeholder="e.g., Blue Denim Jacket"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-brand">Brand</Label>
                        <Input
                          id="item-brand"
                          value={newItem.brand || ''}
                          onChange={(e) => setNewItem({...newItem, brand: e.target.value})}
                          placeholder="e.g., Levi's"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-type">Type *</Label>
                        <Select value={newItem.type || ''} onValueChange={(value) => setNewItem({...newItem, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Top">Top</SelectItem>
                            <SelectItem value="Bottom">Bottom</SelectItem>
                            <SelectItem value="Outerwear">Outerwear</SelectItem>
                            <SelectItem value="Shoes">Shoes</SelectItem>
                            <SelectItem value="Accessory">Accessory</SelectItem>
                            <SelectItem value="Dress">Dress</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-color">Color</Label>
                        <Input
                          id="item-color"
                          value={newItem.color || ''}
                          onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                          placeholder="e.g., Navy Blue"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-price">Price ($)</Label>
                        <Input
                          id="item-price"
                          type="number"
                          value={newItem.price || ''}
                          onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-style">Style</Label>
                        <Select value={newItem.style || ''} onValueChange={(value) => setNewItem({...newItem, style: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Casual">Casual</SelectItem>
                            <SelectItem value="Formal">Formal</SelectItem>
                            <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                            <SelectItem value="Streetwear">Streetwear</SelectItem>
                            <SelectItem value="Athletic">Athletic</SelectItem>
                            <SelectItem value="Vintage">Vintage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-fabric">Fabric/Material</Label>
                        <Input
                          id="item-fabric"
                          value={newItem.fabric || ''}
                          onChange={(e) => setNewItem({...newItem, fabric: e.target.value})}
                          placeholder="e.g., 100% Cotton"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-image">Image URL</Label>
                        <Input
                          id="item-image"
                          value={newItem.image || ''}
                          onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-description">Description</Label>
                        <Textarea
                          id="item-description"
                          value={newItem.description || ''}
                          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                          placeholder="Brief description of the item..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="item-owned"
                            checked={newItem.isOwned ?? true}
                            onChange={(e) => setNewItem({...newItem, isOwned: e.target.checked})}
                          />
                          <Label htmlFor="item-owned">I own this item</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="item-favorite"
                            checked={newItem.isFavorite ?? false}
                            onChange={(e) => setNewItem({...newItem, isFavorite: e.target.checked})}
                          />
                          <Label htmlFor="item-favorite">Add to favorites</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={addItemToWardrobe} className="w-full mt-4">
                    Add to Wardrobe
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant={showFilter === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setShowFilter('all')}
                >
                  All Items ({wardrobe.length})
                </Button>
                <Button 
                  variant={showFilter === 'owned' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setShowFilter('owned')}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Owned ({wardrobe.filter(item => item.isOwned).length})
                </Button>
                <Button 
                  variant={showFilter === 'favorites' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setShowFilter('favorites')}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Favorites ({wardrobe.filter(item => item.isFavorite).length})
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'tags' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('tags')}
                >
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueValues('type').map(type => (
                    <SelectItem key={type} value={type}>{type}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {getUniqueValues('style').map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {getUniqueValues('brand').map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag Management */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm">Manage Tags:</span>
              <Input
                placeholder="New tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-32"
                onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
              />
              <Button size="sm" onClick={addNewTag}>
                <Plus className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 flex-wrap">
                {availableTags.slice(0, 5).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                    <button
                      onClick={() => deleteTag(tag)}
                      className="ml-1 text-xs hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {availableTags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{availableTags.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredWardrobe.length} of {wardrobe.length} items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      {getSmartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              Based on your wardrobe and style preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getSmartSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{suggestion.name}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{suggestion.type}</Badge>
                    <Button size="sm" variant="outline">
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      Shop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wardrobe Content */}
      {filteredWardrobe.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3>No items found</h3>
            <p className="text-muted-foreground mb-4">
              {wardrobe.length === 0 
                ? "Start building your virtual wardrobe by adding your clothing items"
                : "Try adjusting your filters to see more items"
              }
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWardrobe.map((item) => (
                <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.item}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => openDetailView(item)}
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.isOwned && (
                        <Badge className="bg-green-600 text-white text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                      {item.isFavorite && (
                        <Badge className="bg-red-500 text-white text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          Favorite
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-card/95 hover:bg-card shadow-lg border border-border w-8 h-8 p-0"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-current text-red-500" : "text-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-card/95 hover:bg-card shadow-lg border border-border w-8 h-8 p-0"
                        onClick={() => openDetailView(item)}
                      >
                        <Eye className="w-4 h-4 text-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{item.item}</h3>
                        {item.brand && (
                          <p className="text-sm text-muted-foreground">{item.brand}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{item.style}</Badge>
                          <Badge variant="outline" className="text-xs">{item.color}</Badge>
                        </div>
                        {item.price && item.price > 0 && (
                          <span className="font-semibold text-green-600">${item.price}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {(item.customTags || []).slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {(item.customTags || []).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(item.customTags || []).length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => toggleOwned(item.id)}
                        >
                          {item.isOwned ? <CheckCircle className="w-4 h-4 mr-1" /> : <Package className="w-4 h-4 mr-1" />}
                          {item.isOwned ? 'Owned' : 'Add to Owned'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemFromWardrobe(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredWardrobe.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.item}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                        onClick={() => openDetailView(item)}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{item.item}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {item.brand && <span className="text-sm text-muted-foreground">{item.brand}</span>}
                              <Badge variant="outline" className="text-xs">{item.type}</Badge>
                              <Badge variant="outline" className="text-xs">{item.style}</Badge>
                              <Badge variant="outline" className="text-xs">{item.color}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.price && item.price > 0 && (
                              <span className="font-semibold text-green-600">${item.price}</span>
                            )}
                            <div className="flex items-center gap-1">
                              {item.isOwned && (
                                <Badge className="bg-green-600 text-white text-xs">Owned</Badge>
                              )}
                              {item.isFavorite && (
                                <Badge className="bg-red-500 text-white text-xs">Favorite</Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(item.id)}
                            >
                              <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-current text-red-500" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailView(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromWardrobe(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {(item.customTags || []).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'tags' && (
            <div className="space-y-6">
              {Object.entries(groupedByTags).map(([tag, items]) => (
                <Card key={tag}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      {tag}
                    </CardTitle>
                    <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="relative group">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.item}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                            onClick={() => openDetailView(item)}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button size="sm" variant="secondary">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1">
                            {item.isOwned && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {item.isFavorite && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs mt-1 line-clamp-1">{item.item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedItem.item}
                  {selectedItem.isFavorite && <Heart className="w-5 h-5 fill-current text-red-500" />}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.brand && `${selectedItem.brand} • `}
                  {selectedItem.type} • {selectedItem.style}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <ImageWithFallback
                    src={selectedItem.image}
                    alt={selectedItem.item}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Color:</span> {selectedItem.color}</div>
                      <div><span className="font-medium">Style:</span> {selectedItem.style}</div>
                      {selectedItem.fabric && (
                        <div><span className="font-medium">Fabric:</span> {selectedItem.fabric}</div>
                      )}
                      {selectedItem.price && selectedItem.price > 0 && (
                        <div><span className="font-medium">Price:</span> ${selectedItem.price}</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedItem.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedItem.customTags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => toggleFavorite(selectedItem.id)}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${selectedItem.isFavorite ? "fill-current" : ""}`} />
                      {selectedItem.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toggleOwned(selectedItem.id)}
                    >
                      {selectedItem.isOwned ? <CheckCircle className="w-4 h-4 mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                      {selectedItem.isOwned ? 'Owned' : 'Mark as Owned'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}