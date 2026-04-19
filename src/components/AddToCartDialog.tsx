import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Package, Ruler, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './errors/ImageWithFallback';

type CartSelection = {
  size: string;
  quantity: number;
  stock: number;
};

type AddToCartDialogProps = {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: any, selection: CartSelection) => void;
};

function getSizesForCategory(category?: string): string[] {
  const normalizedCategory = String(category || '').toLowerCase();

  if (normalizedCategory.includes('shoes')) return ['6', '7', '8', '9', '10', '11'];
  if (normalizedCategory.includes('dress') || normalizedCategory.includes('top') || normalizedCategory.includes('outerwear')) {
    return ['XS', 'S', 'M', 'L', 'XL'];
  }
  if (normalizedCategory.includes('bottom')) return ['26', '28', '30', '32', '34', '36'];
  return ['One Size', 'S', 'M', 'L'];
}

function getStockForItem(item: any): number {
  const seedSource = String(item?._id || item?.id || item?.name || 'item');
  const seed = Array.from(seedSource).reduce((total, char) => total + char.charCodeAt(0), 0);
  return 2 + (seed % 12);
}

function getDisplayBrand(brand?: string): string {
  if (!brand || /deepfashion/i.test(brand)) return 'The Alternative';
  return brand;
}

export function AddToCartDialog({ item, isOpen, onClose, onConfirm }: AddToCartDialogProps) {
  const sizeOptions = useMemo(() => getSizesForCategory(item?.category || item?.type), [item]);
  const stock = useMemo(() => getStockForItem(item), [item]);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!item) return;
    setSelectedSize(sizeOptions[0] || 'One Size');
    setQuantity(1);
  }, [item, sizeOptions]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Choose Your Fit</DialogTitle>
          <DialogDescription>
            Pick the size and quantity before adding this item to your cart.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]'>
          <ImageWithFallback
            src={item.image || item.imageUrl}
            alt={item.name}
            className='h-56 w-full rounded-lg object-cover'
          />

          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold'>{item.name}</h3>
              <p className='text-sm text-muted-foreground'>{getDisplayBrand(item.brand)}</p>
              <p className='mt-1 text-lg font-semibold text-green-600'>${item.price ?? 0}</p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Package className='h-3 w-3' />
                {stock} in stock
              </Badge>
              <Badge variant='outline' className='flex items-center gap-1'>
                <Ruler className='h-3 w-3' />
                {String(item.category || item.type || 'Item')}
              </Badge>
              {item.color && <Badge variant='outline'>{item.color}</Badge>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cart-size'>Size</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger id='cart-size'>
                  <SelectValue placeholder='Select size' />
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

            <div className='space-y-2'>
              <Label htmlFor='cart-quantity'>Quantity</Label>
              <Input
                id='cart-quantity'
                type='number'
                min={1}
                max={stock}
                value={quantity}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setQuantity(Number.isNaN(nextValue) ? 1 : Math.max(1, Math.min(stock, nextValue)));
                }}
              />
            </div>

            <div className='rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground'>
              Ready to ship. Stock updates live when you add this size to cart.
            </div>

            <div className='flex gap-3'>
              <Button variant='outline' className='flex-1' onClick={onClose}>
                Cancel
              </Button>
              <Button
                className='flex-1'
                onClick={() => onConfirm(item, { size: selectedSize, quantity, stock })}
                disabled={!selectedSize}
              >
                <ShoppingCart className='mr-2 h-4 w-4' />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}