import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Package, Plus, Trash2, Edit3, CheckCircle, XCircle, Shirt, Filter, Tag, Folders } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export function WardrobeSync({ wardrobe, setWardrobe, wardrobes, setWardrobes, analyzedItem }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    item: '',
    type: '',
    color: '',
    style: '',
    image: '',
    customTags: []
  });
  const [customFilter, setCustomFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [customTagFilter, setCustomTagFilter] = useState('all');
  const [currentWardrobe, setCurrentWardrobe] = useState(0);
  const [newTag, setNewTag] = useState('');

  const addItemToWardrobe = () => {
    if (newItem.item.trim()) {
      const item = {
        id: Date.now(),
        ...newItem,
        image: newItem.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop',
        customTags: newItem.customTags || []
      };
      setWardrobe([...wardrobe, item]);
      setNewItem({ item: '', type: '', color: '', style: '', image: '', customTags: [] });
      setShowAddDialog(false);
    }
  };

  const removeItemFromWardrobe = (id) => {
    setWardrobe(wardrobe.filter(item => item.id !== id));
  };

  const updateItem = (id, updates) => {
    setWardrobe(wardrobe.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    setEditingItem(null);
  };

  const addAnalyzedItemToWardrobe = () => {
    if (analyzedItem) {
      const newWardrobeItem = {
        id: Date.now(),
        item: `${analyzedItem.detected_item.color} ${analyzedItem.detected_item.type}`,
        type: analyzedItem.detected_item.type,
        color: analyzedItem.detected_item.color,
        style: analyzedItem.detected_item.style,
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop',
        customTags: ['analyzed']
      };
      setWardrobe([...wardrobe, newWardrobeItem]);
    }
  };

  const addCustomTag = (itemId) => {
    if (newTag.trim()) {
      setWardrobe(wardrobe.map(item => 
        item.id === itemId 
          ? { ...item, customTags: [...(item.customTags || []), newTag.trim()] }
          : item
      ));
      setNewTag('');
    }
  };

  const removeCustomTag = (itemId, tagToRemove) => {
    setWardrobe(wardrobe.map(item => 
      item.id === itemId 
        ? { ...item, customTags: (item.customTags || []).filter(tag => tag !== tagToRemove) }
        : item
    ));
  };

  const getUniqueCustomTags = () => {
    const tags = new Set();
    wardrobe.forEach(item => {
      if (item.customTags) {
        item.customTags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const getCompatibilityStatus = (item) => {
    if (!analyzedItem) return null;
    
    const usedItems = analyzedItem.wardrobe_integration?.used_items || [];
    const unusedItems = analyzedItem.wardrobe_integration?.unused_items || [];
    
    if (usedItems.includes(item.item)) {
      return { status: 'compatible', message: 'Used in this outfit' };
    }
    if (unusedItems.includes(item.item)) {
      return { status: 'incompatible', message: 'Not compatible' };
    }
    return null;
  };

  const filteredWardrobe = wardrobe.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (styleFilter !== 'all' && item.style !== styleFilter) return false;
    if (colorFilter !== 'all' && item.color !== colorFilter) return false;
    if (customTagFilter !== 'all' && !(item.customTags || []).includes(customTagFilter)) return false;
    if (customFilter && !item.item.toLowerCase().includes(customFilter.toLowerCase())) return false;
    return true;
  });

  const groupedWardrobe = filteredWardrobe.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Virtual Wardrobe Management
              </CardTitle>
              <CardDescription>
                Organize your clothing collection with advanced filtering and custom tags
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item to Wardrobe</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new clothing item to your virtual wardrobe.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={newItem.item}
                      onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                      placeholder="e.g., Blue Denim Jacket"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-type">Type</Label>
                    <Select value={newItem.type} onValueChange={(value) => setNewItem({...newItem, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Top">Top</SelectItem>
                        <SelectItem value="Bottom">Bottom</SelectItem>
                        <SelectItem value="Outerwear">Outerwear</SelectItem>
                        <SelectItem value="Shoes">Shoes</SelectItem>
                        <SelectItem value="Accessory">Accessory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item-color">Color</Label>
                    <Input
                      id="item-color"
                      value={newItem.color}
                      onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                      placeholder="e.g., Blue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-style">Style</Label>
                    <Select value={newItem.style} onValueChange={(value) => setNewItem({...newItem, style: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Formal">Formal</SelectItem>
                        <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                        <SelectItem value="Streetwear">Streetwear</SelectItem>
                        <SelectItem value="Athletic">Athletic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item-image">Image URL (optional)</Label>
                    <Input
                      id="item-image"
                      value={newItem.image}
                      onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <Button onClick={addItemToWardrobe} className="w-full">
                    Add to Wardrobe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Input
              placeholder="Search items..."
              value={customFilter}
              onChange={(e) => setCustomFilter(e.target.value)}
              className="col-span-2"
            />
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Top">Tops</SelectItem>
                <SelectItem value="Bottom">Bottoms</SelectItem>
                <SelectItem value="Outerwear">Outerwear</SelectItem>
                <SelectItem value="Shoes">Shoes</SelectItem>
                <SelectItem value="Accessory">Accessories</SelectItem>
              </SelectContent>
            </Select>

            <Select value={styleFilter} onValueChange={setStyleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                <SelectItem value="Streetwear">Streetwear</SelectItem>
                <SelectItem value="Athletic">Athletic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                <SelectItem value="Black">Black</SelectItem>
                <SelectItem value="White">White</SelectItem>
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Grey">Grey</SelectItem>
                <SelectItem value="Beige">Beige</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customTagFilter} onValueChange={setCustomTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Custom Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {getUniqueCustomTags().map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {filteredWardrobe.length} of {wardrobe.length} items shown
              </p>
              <Badge variant="outline" className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {Object.values({ typeFilter, styleFilter, colorFilter, customTagFilter }).filter(f => f !== 'all').length} filters active
              </Badge>
            </div>
            {analyzedItem && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={addAnalyzedItemToWardrobe}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Analyzed Item
              </Button>
            )}
          </div>

          {analyzedItem && (
            <Alert className="mb-6">
              <Shirt className="h-4 w-4" />
              <AlertDescription>
                Your wardrobe analysis shows {analyzedItem.wardrobe_integration?.used_items?.length || 0} compatible items 
                and {analyzedItem.wardrobe_integration?.unused_items?.length || 0} items that don't work with the analyzed piece.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {Object.keys(groupedWardrobe).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3>Your wardrobe is empty</h3>
            <p className="text-muted-foreground mb-4">
              Start building your virtual wardrobe by adding your clothing items
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedWardrobe).map(([type, items]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-lg">{type}s</CardTitle>
                <CardDescription>{items.length} item{items.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {items.map((item) => {
                    const compatibility = getCompatibilityStatus(item);
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border">
                        <ImageWithFallback
                          src={item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=400&fit=crop'}
                          alt={item.item}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">{item.item}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{item.style}</Badge>
                              <Badge variant="outline" className="text-xs">{item.color}</Badge>
                              {item.brand && (
                                <span className="text-xs text-muted-foreground">{item.brand}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Custom Tags */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {(item.customTags || []).map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="secondary" 
                                className="text-xs flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                                <button
                                  onClick={() => removeCustomTag(item.id, tag)}
                                  className="ml-1 text-xs hover:text-red-500"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                            <div className="flex items-center gap-1">
                              <Input
                                placeholder="Add tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="h-6 text-xs w-20"
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTag(item.id)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => addCustomTag(item.id)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {compatibility && (
                            <Badge 
                              variant={compatibility.status === 'compatible' ? 'default' : 'secondary'}
                              className={`flex items-center gap-1 ${
                                compatibility.status === 'compatible' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {compatibility.status === 'compatible' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {compatibility.message}
                            </Badge>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit3 className="w-4 h-4" />
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Update the details of your wardrobe item below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  value={editingItem.item}
                  onChange={(e) => setEditingItem({...editingItem, item: e.target.value})}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editingItem.type} onValueChange={(value) => setEditingItem({...editingItem, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Top">Top</SelectItem>
                    <SelectItem value="Bottom">Bottom</SelectItem>
                    <SelectItem value="Outerwear">Outerwear</SelectItem>
                    <SelectItem value="Shoes">Shoes</SelectItem>
                    <SelectItem value="Accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  value={editingItem.color}
                  onChange={(e) => setEditingItem({...editingItem, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Style</Label>
                <Select value={editingItem.style} onValueChange={(value) => setEditingItem({...editingItem, style: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Smart Casual">Smart Casual</SelectItem>
                    <SelectItem value="Streetwear">Streetwear</SelectItem>
                    <SelectItem value="Athletic">Athletic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <Button onClick={() => updateItem(editingItem.id, editingItem)} className="w-full">
                Update Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}