import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import type { LanguageCode } from '../../types';

interface FileUploadZoneProps {
  language: LanguageCode;
  onFileUpload: (files: FileList | File[]) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl py-5 px-4 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/50'
          : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/60 shadow-2xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.tiff,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-1.5">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-0.5">
          <UploadCloud className="w-4 h-4 text-slate-600" />
        </div>
        <p className="text-xs font-bold text-slate-800">
          Upload Documents
        </p>
        <p className="text-[11px] text-slate-500">
          PDF, Word, Scans & Receipts
        </p>
      </div>
    </div>
  );
};

