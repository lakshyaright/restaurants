import React, { useRef, useState } from 'react';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  Store,
  Layers
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { getRestaurantMenuUrl } from '../../lib/supabase';

export const QRCodePage: React.FC = () => {
  const { currentRestaurant } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<number>(300);
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const [tableNumberLabel, setTableNumberLabel] = useState<string>('01');

  const canvasRef = useRef<HTMLDivElement>(null);

  if (!currentRestaurant) return null;

  const publicUrl = getRestaurantMenuUrl(currentRestaurant.slug);

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const canvasElement = canvasRef.current?.querySelector('canvas');
    if (!canvasElement) return;

    const pngUrl = canvasElement.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${currentRestaurant.slug}-table-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById('restaurant-svg-qr');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${currentRestaurant.slug}-table-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">QR Code & Table Standee Engine</h1>
          <p className="text-xs text-stone-500 mt-0.5">Generate, customize, and print contactless tabletop QR signs for your dining room</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintStandee}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg shadow-xs hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>Print Standee</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls & Live Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customization Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              QR Code Configuration
            </h3>

            {/* Permanent URL Destination Info */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <span className="text-[11px] font-semibold text-stone-600 block">QR Target Destination</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-emerald-800 truncate">{publicUrl}</span>
                <button
                  onClick={copyUrl}
                  className="p-1 rounded text-stone-500 hover:text-stone-900 shrink-0"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 pt-1">
                This QR code remains permanently valid even when you edit menu prices, add dishes, or change categories.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Table Number Label (Optional)
                </label>
                <input
                  type="text"
                  value={tableNumberLabel}
                  onChange={(e) => setTableNumberLabel(e.target.value)}
                  placeholder="e.g. 01, VIP, Terrace-4"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Include Restaurant Logo in Center</span>
                </label>
              </div>
            </div>

            {/* Download Buttons Group */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <span className="text-xs font-semibold text-stone-700 block">Export Assets</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadPNG}
                  className="w-full py-2 px-3 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG (1024px)</span>
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="w-full py-2 px-3 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vector SVG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hidden Canvas Ref for High-Res PNG Download */}
          <div ref={canvasRef} className="hidden">
            <QRCodeCanvas
              value={publicUrl}
              size={1024}
              level="H"
              includeMargin={true}
              imageSettings={
                includeLogo && currentRestaurant.logo_url
                  ? {
                      src: currentRestaurant.logo_url,
                      x: undefined,
                      y: undefined,
                      height: 180,
                      width: 180,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>
        </div>

        {/* Right: Printable Tabletop Standee Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700">Acrylic Table Standee Preview (A6 / 4x6&quot;)</span>
            <span className="font-mono text-[11px]">Print Ready</span>
          </div>

          {/* Standee Card Template (Printed element) */}
          <div 
            id="printable-standee" 
            className="bg-white p-8 sm:p-10 rounded-2xl border-2 border-stone-200 shadow-md max-w-sm mx-auto text-center space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Header branding */}
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center overflow-hidden">
                {currentRestaurant.logo_url ? (
                  <img
                    src={currentRestaurant.logo_url}
                    alt={currentRestaurant.name}
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-7 h-7 text-emerald-700" />
                )}
              </div>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {currentRestaurant.name}
              </h2>
              {tableNumberLabel && (
                <div className="inline-block px-3 py-0.5 rounded-full bg-stone-100 text-[11px] font-mono font-bold text-stone-800 border border-stone-300">
                  TABLE #{tableNumberLabel}
                </div>
              )}
            </div>

            {/* Scannable SVG QR Code with Quiet Zone */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block shadow-inner">
              <QRCodeSVG
                id="restaurant-svg-qr"
                value={publicUrl}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={
                  includeLogo && currentRestaurant.logo_url
                    ? {
                        src: currentRestaurant.logo_url,
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* Diner Instructions */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Scan for Contactless Digital Menu</span>
              </div>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
                Open your phone camera, scan the code, and view our fresh daily menu with photos and prices.
              </p>
            </div>

            {/* Quiet Footer Brand */}
            <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400">
              <span>Powered by TechRescue Digital Menu · techrescue.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
