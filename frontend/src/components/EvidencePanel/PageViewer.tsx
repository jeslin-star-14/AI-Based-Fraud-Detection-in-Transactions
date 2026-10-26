import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { BoundingBox, LanguageCode } from '../../types';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';

interface PageViewerProps {
  pageImage: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  boundingBoxes: BoundingBox[];
  activeBoxId?: string;
  onBoxClick?: (box: BoundingBox) => void;
  language: LanguageCode;
}

export const PageViewer: React.FC<PageViewerProps> = ({
  pageImage,
  currentPage,
  totalPages,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [inputPage, setInputPage] = useState<string>(String(currentPage));

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setInputPage(String(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setInputPage(String(currentPage + 1));
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setInputPage(String(currentPage));
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleResetZoom = () => setZoomLevel(100);

  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [pageImage, currentPage]);

  return (
    <div className="flex flex-col w-full space-y-2 select-none">
      {/* Top Page Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        {/* Prev / Page Input / Next */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Page</span>
            <input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onBlur={handlePageInputSubmit}
              className="w-10 text-center py-0.5 px-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0d5c4d]"
            />
            <span className="text-slate-500 font-medium text-[11px]">of {totalPages}</span>
          </form>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-600 w-9 text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer ml-0.5"
            title="Reset zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Canvas Container */}
      <div className="relative w-full rounded-lg overflow-auto border border-slate-200/90 shadow-xs bg-slate-100 min-h-[360px] max-h-[640px] flex items-center justify-center p-2">
        <div
          className="relative transition-transform duration-150 origin-top shadow-md rounded bg-white"
          style={{ transform: `scale(${zoomLevel / 100})`, width: '100%' }}
        >
          {pageImage && !imageError ? (
            <img
              src={pageImage}
              alt={`Page ${currentPage} Preview`}
              onError={() => setImageError(true)}
              className="block w-full h-auto object-contain select-none rounded"
            />
          ) : (
            <div className="p-8 w-full bg-white rounded-lg flex flex-col justify-between min-h-[460px] text-slate-800 select-none shadow-xs border border-slate-200">
              {/* Document Header Representation */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Indexed Document Intelligence Record
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Document Page #{currentPage}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Visual Grounding Active
                  </span>
                </div>

                {/* Simulated Paragraph Lines */}
                <div className="space-y-3 mb-6">
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-11/12" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>

                {/* Simulated Financial Data Table Grid */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 mb-6">
                  <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-2 mb-2 font-bold text-[11px] text-slate-700">
                    <span>Transaction Metric</span>
                    <span>Q2 Baseline</span>
                    <span>Q4 Target</span>
                    <span>Variance</span>
                  </div>
                  <div className="space-y-2 text-[10px] text-slate-600 font-medium">
                    <div className="grid grid-cols-4 gap-2">
                      <span className="font-bold text-slate-900">Operational Yield</span>
                      <span>87.4%</span>
                      <span>93.8%</span>
                      <span className="text-emerald-600 font-bold">+6.4%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <span className="font-bold text-slate-900">Fraud Discrepancy Ratio</span>
                      <span>1.82%</span>
                      <span>0.05%</span>
                      <span className="text-emerald-600 font-bold">-1.77%</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Additional Text */}
                <div className="space-y-2.5">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>

              {/* Document Footer Watermark */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-6">
                <span>OCR & Multimodal Parsing Complete</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          )}


          {/* Bounding Box Highlights on top of the page */}
          {boundingBoxes && boundingBoxes.length > 0 && (
            <BoundingBoxOverlay
              boxes={boundingBoxes}
              activeBoxId={activeBoxId}
              onBoxClick={onBoxClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
