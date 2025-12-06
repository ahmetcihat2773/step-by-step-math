import { useState, useCallback } from "react";
import { Upload, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (imageBase64: string) => void;
  disabled?: boolean;
}

export const ImageUpload = ({ onImageSelect, disabled }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  if (preview) {
    return (
      <div className="relative animate-fade-in">
        <div className="rounded-xl overflow-hidden border border-border shadow-soft">
          <img 
            src={preview} 
            alt="Uploaded math problem" 
            className="w-full max-h-64 object-contain bg-muted/30"
          />
        </div>
        {!disabled && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-medium"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "upload-zone cursor-pointer transition-all duration-300",
        isDragging && "upload-zone-active",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDrop={disabled ? undefined : handleDrop}
      onDragOver={disabled ? undefined : handleDragOver}
      onDragLeave={disabled ? undefined : handleDragLeave}
      onClick={() => !disabled && document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Matematik problemi içeren resmi yükle
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Sürükle bırak veya tıkla
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Image className="h-4 w-4" />
          <span>PNG, JPG, WEBP</span>
        </div>
      </div>
    </div>
  );
};
