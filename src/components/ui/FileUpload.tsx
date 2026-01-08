"use client";

import { InputHTMLAttributes, forwardRef, useState, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileIcon } from "lucide-react";
import { Button } from "./Button";

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (files: FileList | null) => void;
  maxSize?: number; // MB cinsinden
  accept?: string;
  preview?: boolean;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      onChange,
      maxSize = 10,
      accept,
      preview = true,
      multiple,
      id,
      ...props
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      // Dosya boyutu kontrolü
      const oversizedFiles = Array.from(files).filter(
        (file) => file.size > maxSize * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        alert(`Bazı dosyalar çok büyük. Maksimum dosya boyutu: ${maxSize}MB`);
        return;
      }

      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);

      if (preview) {
        // Önizleme URL'lerini oluştur
        const urls = fileArray.map((file) => {
          if (file.type.startsWith("image/")) {
            return URL.createObjectURL(file);
          }
          return "";
        });
        setPreviewUrls(urls);
      }

      onChange?.(files);
    };

    const removeFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      const newUrls = previewUrls.filter((_, i) => i !== index);

      setSelectedFiles(newFiles);
      setPreviewUrls(newUrls);

      // DataTransfer kullanarak FileList oluştur
      const dt = new DataTransfer();
      newFiles.forEach((file) => dt.items.add(file));

      onChange?.(dt.files);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className={cn("space-y-3", className)}>
          {/* Upload Area */}
          <label
            htmlFor={inputId}
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
              "hover:bg-slate-50 transition",
              error ? "border-red-500" : "border-slate-300",
              props.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">
                <span className="font-medium text-blue-600">Dosya seçin</span>{" "}
                veya sürükleyip bırakın
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {accept || "Tüm dosya türleri"} (Maks. {maxSize}MB)
              </p>
            </div>
            <input
              id={inputId}
              ref={ref}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={accept}
              multiple={multiple}
              disabled={props.disabled}
              {...props}
            />
          </label>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  {previewUrls[index] ? (
                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={props.disabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
