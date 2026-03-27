import { useState, useCallback } from "react";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: React.ReactNode;
}

export function FileDropZone({ onFilesDropped, children }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesDropped(files);
  }, [onFilesDropped]);

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="relative">
      {children}
      {isDragging && (
        <div className="absolute inset-0 bg-orange-600/10 border-2 border-dashed border-orange-600 rounded-xl flex items-center justify-center z-50">
          <span className="text-orange-400 text-sm font-medium">Drop files here</span>
        </div>
      )}
    </div>
  );
}
