import React, { useState, useRef } from "react";
import { Upload, Link, Image as ImageIcon, Loader2, X, Check } from "lucide-react";

interface ImageUploadSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ImageUploadSelector: React.FC<ImageUploadSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder = "Pegar URL de la imagen...",
  className = ""
}) => {
  const [activeMode, setActiveMode] = useState<"upload" | "url">(value.startsWith("data:") ? "upload" : "url");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and convert file to Base64 (max 800px on longest side, 0.75 quality)
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP, etc.)");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIDE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIDE) {
            height = Math.round((height * MAX_SIDE) / width);
            width = MAX_SIDE;
          }
        } else {
          if (height > MAX_SIDE) {
            width = Math.round((width * MAX_SIDE) / height);
            height = MAX_SIDE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as JPEG to keep payload lightweight (usually ~35-70 KB)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          onChange(compressedBase64);
        } else {
          onChange(event.target?.result as string);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setIsProcessing(false);
        alert("Error al procesar la imagen seleccionada.");
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert("Error al leer el archivo.");
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const clearImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBase64 = value.startsWith("data:");

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="font-bold text-foreground text-[11px] uppercase tracking-wider">{label}</label>
        
        {/* Toggle Controls */}
        <div className="flex border border-border/60 rounded-md overflow-hidden bg-muted/30 self-start">
          <button
            type="button"
            onClick={() => setActiveMode("upload")}
            className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
              activeMode === "upload"
                ? "bg-accent text-accent-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Subir Archivo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("url")}
            className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
              activeMode === "url"
                ? "bg-accent text-accent-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Link className="w-3 h-3" />
            <span>Enlace URL</span>
          </button>
        </div>
      </div>

      {/* Upload Container */}
      {activeMode === "upload" ? (
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-accent bg-accent/10"
                : "border-border/60 bg-muted/10 hover:border-accent/60 hover:bg-muted/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <span className="text-muted-foreground font-medium animate-pulse">Procesando y comprimiendo imagen...</span>
              </div>
            ) : value ? (
              <div className="flex flex-col items-center space-y-2 py-1">
                <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 rounded-full p-1 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-foreground font-bold">¡Imagen cargada con éxito!</span>
                <span className="text-muted-foreground text-[10px] uppercase font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isBase64 ? "Formato Base64 Optimizado" : "Enlace Externo"}
                </span>
                <span className="text-accent underline font-semibold text-[10px] mt-1 hover:text-accent/80">Reemplazar imagen</span>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-foreground font-semibold">Arrastrá tu foto acá o hacé click para buscar</p>
                <p className="text-muted-foreground text-[10px]">Formatos recomendados: PNG, JPG, WebP. Peso máximo sugerido: 5MB</p>
              </div>
            )}
          </div>

          {Boolean(value) && (
            <div className="flex items-center justify-between p-2 bg-muted/40 border border-border/30 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded border border-border overflow-hidden bg-black/40 flex items-center justify-center shrink-0">
                  <img src={value || undefined} alt="Preview thumbnail" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="truncate text-[10px] text-muted-foreground font-mono">
                  {isBase64 ? `image-base64-compressed.jpg (${Math.round(value.length / 1024)} KB)` : value}
                </div>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="p-1 text-rose-400 hover:text-rose-500 hover:bg-rose-950/20 rounded transition-colors"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* URL Paste Container */
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ImageIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="url"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-background border border-border rounded pl-8 pr-2 py-2 text-foreground font-mono text-[10px] outline-none focus:border-accent"
              />
            </div>
            {value && (
              <button
                type="button"
                onClick={clearImage}
                className="px-2.5 py-1 bg-rose-950/20 text-rose-400 border border-rose-500/30 rounded text-[10px] hover:bg-rose-950/40 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {Boolean(value) && (
            <div className="border border-border/20 rounded-xl overflow-hidden max-h-36 bg-black/40 flex items-center justify-center relative p-1 group">
              <img src={value || undefined} alt="Previsualización" className="max-h-32 object-contain rounded" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white hover:text-rose-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
