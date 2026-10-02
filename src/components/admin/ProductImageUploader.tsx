import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Star,
  MoveLeft,
  MoveRight,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ProductImageUploaderProps {
  token: string | null;
  mainImage: string;
  images: string[];
  onMainImageChange: (url: string) => void;
  onImagesChange: (urls: string[]) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  token,
  mainImage,
  images,
  onMainImageChange,
  onImagesChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const allImages = Array.from(new Set([mainImage, ...images].filter(Boolean)));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage('');
    setIsUploading(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setErrorMessage('Only image files (JPG, PNG, WEBP) are supported.');
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage(`"${file.name}" exceeds the 10MB limit.`);
          continue;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dataUrl,
            filename: file.name,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          newUrls.push(data.url);
        } else {
          newUrls.push(dataUrl);
        }
      }

      if (newUrls.length > 0) {
        const updated = [...allImages, ...newUrls];
        if (!mainImage && updated.length > 0) {
          onMainImageChange(updated[0]);
        }
        onImagesChange(updated);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMessage('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || replaceIndex === null) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Only image files (JPG, PNG, WEBP) are supported.');
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      });

      const newUrl = response.ok ? (await response.json()).url : dataUrl;
      const updated = [...allImages];
      const oldUrl = updated[replaceIndex];
      updated[replaceIndex] = newUrl;

      onImagesChange(updated);
      if (mainImage === oldUrl || replaceIndex === 0) {
        onMainImageChange(newUrl);
      }
    } catch (err) {
      setErrorMessage('Failed to replace photo');
    } finally {
      setIsUploading(false);
      setReplaceIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setErrorMessage('Please enter a valid image URL starting with http://, https://, or /');
      return;
    }

    setErrorMessage('');
    const updated = [...allImages, trimmed];
    if (!mainImage) {
      onMainImageChange(trimmed);
    }
    onImagesChange(updated);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleSetMain = (url: string) => {
    onMainImageChange(url);
    if (!images.includes(url)) {
      onImagesChange([url, ...images]);
    }
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    const remaining = allImages.filter((img) => img !== photoToDelete);
    onImagesChange(remaining);
    if (mainImage === photoToDelete) {
      onMainImageChange(remaining[0] || '');
    }
    setPhotoToDelete(null);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= allImages.length) return;

    const list = [...allImages];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    onImagesChange(list);
    if (newIdx === 0 || index === 0) {
      onMainImageChange(list[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleReplaceUpload(e.target.files)}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest font-serif font-bold text-stone-700 dark:text-stone-300">
          Product Photos (WordPress / Atelier Media)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {showUrlInput ? 'Hide URL Input' : 'Add via URL'}
          </button>
        </div>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs uppercase tracking-wider font-semibold rounded hover:bg-amber-600 transition"
          >
            Add
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag photos here or choose photos from computer */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isUploading
            ? 'border-amber-500 bg-amber-500/5 cursor-wait'
            : 'border-stone-300 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-stone-50/50 dark:bg-zinc-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
              {isUploading
                ? 'Uploading to Atelier Media Library...'
                : 'Drag photos here or Choose Photos From Computer'}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Supports multiple photos • JPG, PNG, WEBP up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Grid with slot indicators [ Main Photo ] [ Photo 2 ] [ Photo 3 ] [ Photo 4 ] */}
      {allImages.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold uppercase tracking-wider">
              Product Images ({allImages.length}) — Reorder or Replace
            </span>
            <span>First photo is used as primary storefront cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {allImages.map((img, idx) => {
              const isMain = idx === 0 || img === mainImage;
              const slotLabel = isMain ? 'Main Photo' : `Photo ${idx + 1}`;

              return (
                <div
                  key={`${img}-${idx}`}
                  className={`relative group rounded-xl overflow-hidden border transition-all ${
                    isMain
                      ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md bg-amber-50/10'
                      : 'border-stone-200 dark:border-zinc-800 hover:border-amber-500/40 bg-stone-50 dark:bg-zinc-900'
                  }`}
                >
                  {/* Slot Tag */}
                  <div className="px-2.5 py-1 bg-stone-900/90 dark:bg-zinc-950/90 border-b border-stone-800 flex items-center justify-between text-[10px] font-mono">
                    <span className={isMain ? 'text-amber-400 font-bold' : 'text-stone-400'}>
                      [ {slotLabel} ]
                    </span>
                    {isMain && (
                      <span className="text-[9px] uppercase font-bold text-amber-500">★ Primary</span>
                    )}
                  </div>

                  <div className="aspect-square relative overflow-hidden bg-stone-100 dark:bg-zinc-900">
                    <img
                      src={img}
                      alt={slotLabel}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                      <div className="flex items-center justify-between">
                        {!isMain ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMain(img);
                            }}
                            title="Make Main Photo"
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white text-xs transition"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1">
                          {/* Replace Photo Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplaceIndex(idx);
                              replaceInputRef.current?.click();
                            }}
                            title="Replace photo"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white text-xs transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoToDelete(img);
                            }}
                            title="Delete photo"
                            className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white text-xs transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center justify-center gap-2">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(idx, 'left');
                            }}
                            title="Move left (prioritize)"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-amber-600 text-white transition"
                          >
                            <MoveLeft className="w-4 h-4" />
                          </button>
                        )}
                        {idx < allImages.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(idx, 'right');
                            }}
                            title="Move right"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-amber-600 text-white transition"
                          >
                            <MoveRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Delete this product photo?
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Are you sure you want to remove this image from the product gallery? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePhoto}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

