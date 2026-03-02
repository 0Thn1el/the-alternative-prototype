import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { ShoppingCart, Trash2, Plus, Minus, Leaf, Tag, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: number;
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
}

interface CartProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export function Cart({ cart, setCart }: CartProps) {
  const updateQuantity = (id: number, change: number) => {
    setCart(items =>
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart(items => items.filter(item => item.id !== id));
    toast.success("Item removed from cart");
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const getSustainabilityBadges = (sustainable: CartItem['sustainable']) => {
    if (!sustainable) return null;
    
    const badges = [];
    if (sustainable.organic) badges.push("Organic");
    if (sustainable.recycled) badges.push("Recycled");
    if (sustainable.local) badges.push("Local");
    
    return badges.map((label, i) => (
      <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
        <Leaf className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    ));
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout...");
    // In a real app, this would redirect to checkout
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
          </CardTitle>
          <CardDescription>
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some sustainable fashion items to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-lg border">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {item.size && item.color && (
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size} • Color: {item.color}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {getSustainabilityBadges(item.sustainable)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping === 0 && (
                <p className="text-xs text-green-600">
                  Free shipping on orders over $100!
                </p>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCheckout}>
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              <p>Secure checkout • 30-day returns • Free shipping over $100</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}