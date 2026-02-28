import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, Category, createTransaction, getReceiptWithItems, updateReceiptWithItems } from '@/lib/db';
import { supabase } from '@/lib/db';
import { toast } from 'sonner';
import { Camera, ImageIcon, Trash2, Plus, ScanLine, CheckCircle, Loader2 } from 'lucide-react';

interface EditableItem {
  name: string;
  price: string; // kept as string for controlled input
}

interface ReceiptUploadTabProps {
  accounts: Account[];
  categories: Category[];
  onSuccess: () => void;
  onClose: () => void;
}

type Phase = 'idle' | 'extracting' | 'review' | 'confirming';

export default function ReceiptUploadTab({
  accounts,
  categories,
  onSuccess,
  onClose,
}: ReceiptUploadTabProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  // Review state
  const [receiptId, setReceiptId] = useState<string>('');
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [accountId, setAccountId] = useState<string>(
    accounts.length > 0 ? String(accounts[0].id) : ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    categories.length > 0 ? String(categories[0].id) : ''
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const computedTotal = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);

  // ── File selection ────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setPhase('idle');
    // Reset review state when a new file is chosen
    setReceiptId('');
    setStoreName('');
    setItems([]);
    // Reset input value so the same file can be re-selected
    e.target.value = '';
  }

  // ── Extract ───────────────────────────────────────────────────────────────

  async function handleExtract() {
    if (!file) return;
    setPhase('extracting');

    try {
      // 1. Compress image
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.7,
      });

      // 2. Convert to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });

      // 3. Call edge function
      const { data, error } = await supabase.functions.invoke('parse-receipts', {
        body: { imageBase64: base64Image },
      });

      if (error) throw error;

      const { receipt_id } = data as { receipt_id: string };

      // 4. Fetch the full receipt + items
      const receipt = await getReceiptWithItems(receipt_id);
      if (!receipt) throw new Error('Receipt not found after parsing');

      // 5. Populate review state
      setReceiptId(receipt_id);
      setStoreName(receipt.store_name ?? '');
      setItems(
        (receipt.receipt_items ?? []).map((item) => ({
          name: item.raw_name,
          price: String(item.price ?? ''),
        }))
      );
      setPhase('review');
    } catch (err) {
      console.error('Receipt extraction failed:', err);
      toast.error('Failed to extract receipt. Please try again.');
      setPhase('idle');
    }
  }

  // ── Item editing ──────────────────────────────────────────────────────────

  function updateItem(index: number, field: 'name' | 'price', value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', price: '' }]);
  }

  // ── Confirm ───────────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!accountId || !categoryId) {
      toast.error('Please select an account and category');
      return;
    }
    if (computedTotal <= 0) {
      toast.error('Total must be greater than 0');
      return;
    }

    setPhase('confirming');
    try {
      // Update receipt metadata + items in DB
      await updateReceiptWithItems(
        receiptId,
        storeName.trim() || null,
        computedTotal,
        items.map((i) => ({ name: i.name, price: parseFloat(i.price) || 0 }))
      );

      // Create the expense transaction
      await createTransaction({
        account_id: parseInt(accountId),
        date,
        type: 'expense',
        amount: computedTotal,
        category_id: parseInt(categoryId),
        from_account_id: null,
        to_account_id: null,
        note: storeName.trim() ? `Receipt: ${storeName.trim()}` : 'Receipt',
        tags: null,
      });

      toast.success('Receipt saved and transaction created!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      toast.error('Failed to save receipt. Please try again.');
      setPhase('review');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 mt-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image selection */}
      <div className="space-y-3">
        <Label className="text-sm">Upload picture of receipt</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-16 flex-col gap-1 text-xs"
            onClick={() => cameraInputRef.current?.click()}
            disabled={phase === 'extracting' || phase === 'confirming'}
          >
            <Camera className="h-5 w-5" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-16 flex-col gap-1 text-xs"
            onClick={() => galleryInputRef.current?.click()}
            disabled={phase === 'extracting' || phase === 'confirming'}
          >
            <ImageIcon className="h-5 w-5" />
            Open Pictures
          </Button>
        </div>

        {/* Thumbnail preview */}
        {previewUrl && (
          <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted/50 flex justify-center">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-h-48 object-contain w-full"
            />
          </div>
        )}

        {/* Extract button */}
        <Button
          type="button"
          className="w-full"
          onClick={handleExtract}
          disabled={!file || phase === 'extracting' || phase === 'confirming'}
        >
          {phase === 'extracting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4 mr-2" />
              Extract Receipt
            </>
          )}
        </Button>
      </div>

      {/* Review section — shown after extraction */}
      {(phase === 'review' || phase === 'confirming') && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Review & Edit</p>

          {/* Store name */}
          <div className="grid gap-1.5">
            <Label className="text-sm">Store name</Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Store name"
              className="text-sm"
              disabled={phase === 'confirming'}
            />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label className="text-sm">Items</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 text-sm h-8"
                    disabled={phase === 'confirming'}
                  />
                  <Input
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    className="w-24 text-sm h-8"
                    disabled={phase === 'confirming'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(index)}
                    disabled={phase === 'confirming'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={addItem}
              disabled={phase === 'confirming'}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add item
            </Button>
          </div>

          {/* Computed total */}
          <div className="flex justify-between items-center px-1 py-1.5 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-bold">{computedTotal.toFixed(2)} kr</span>
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label className="text-sm">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm"
              disabled={phase === 'confirming'}
            />
          </div>

          {/* Account */}
          <div className="grid gap-1.5">
            <Label className="text-sm">Account</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={phase === 'confirming'}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)} className="text-sm">
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <Label className="text-sm">Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={phase === 'confirming'}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)} className="text-sm">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirm */}
          <Button
            type="button"
            className="w-full"
            onClick={handleConfirm}
            disabled={phase === 'confirming'}
          >
            {phase === 'confirming' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm &amp; Save
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
