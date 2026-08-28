import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { QrCode, Download, Copy, Check, Printer, Truck, RefreshCw, AlertCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { DriverShell } from "@/components/driver/DriverShell";
import { API_BASE_URL } from "@/lib/vehicle-authority-store";

export const Route = createFileRoute("/driver/qr-generator")({
  head: () => ({
    meta: [
      { title: "Vehicle QR Code | CivicSync" },
      {
        name: "description",
        content: "Display your vehicle's permanent QR code for citizen scanning.",
      },
    ],
  }),
  component: VehicleQRPage,
});

interface VehicleQRData {
  qr_code: string;
  license_plate: string;
  generated_at: string;
  vehicle_id: string;
  scan_url: string;
}

function VehicleQRPage() {
  const [qrData, setQrData] = useState<VehicleQRData | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVehicleQR();
  }, []);

  const fetchVehicleQR = async () => {
    try {
      setLoading(true);
      setError("");
      
      const accessToken = localStorage.getItem('civicsync_vehicle_token');

      if (!accessToken) {
        // Local session fallback
        const storedVehicleData = localStorage.getItem('civicsync_vehicle_data');
        const vObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
        if (vObj) {
          setQrData({
            qr_code: `QR-${vObj.license_plate || 'MH15EX4021'}`,
            license_plate: vObj.license_plate || 'MH-15-EX-4021',
            generated_at: new Date().toISOString(),
            vehicle_id: vObj.id || 'V-101',
            scan_url: `https://civicsync.gov.in/verify-bin?vehicle=${vObj.license_plate || 'MH15EX4021'}`,
          });
          setQrValue(`https://civicsync.gov.in/verify-bin?vehicle=${vObj.license_plate || 'MH15EX4021'}`);
          setLoading(false);
          return;
        }
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/vehicle/qr-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setQrData(data);
        const qrContent = data.scan_url || data.qr_code;
        setQrValue(qrContent);
      } else {
        const storedVehicleData = localStorage.getItem('civicsync_vehicle_data');
        const vObj = storedVehicleData ? JSON.parse(storedVehicleData) : null;
        setQrData({
          qr_code: `QR-${vObj?.license_plate || 'MH15EX4021'}`,
          license_plate: vObj?.license_plate || 'MH-15-EX-4021',
          generated_at: new Date().toISOString(),
          vehicle_id: vObj?.id || 'V-101',
          scan_url: `https://civicsync.gov.in/verify-bin?vehicle=${vObj?.license_plate || 'MH15EX4021'}`,
        });
        setQrValue(`https://civicsync.gov.in/verify-bin?vehicle=${vObj?.license_plate || 'MH15EX4021'}`);
      }
    } catch (err: any) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrData || !qrValue) return;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `vehicle-qr-${qrData.license_plate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const printQR = () => {
    window.print();
  };

  if (loading) {
    return (
      <DriverShell title="Vehicle QR Code Pass" subtitle="Loading...">
        <div className="flex items-center justify-center py-16 text-slate-300">
          <div className="text-center">
            <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="font-bold text-base">Loading vehicle QR code...</p>
          </div>
        </div>
      </DriverShell>
    );
  }

  if (error && !qrData) {
    return (
      <DriverShell title="Vehicle QR Code Pass" subtitle="Error">
        <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 max-w-xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-1" />
            <div>
              <p className="font-extrabold text-lg text-white mb-2">Error Loading QR Code</p>
              <p className="text-xs font-semibold text-slate-300 mb-4">{error}</p>
              <button
                onClick={fetchVehicleQR}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-red-500"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </DriverShell>
    );
  }

  return (
    <DriverShell title="Official Vehicle QR Code Pass" subtitle={`Assigned Vehicle: ${qrData?.license_plate}`}>
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto print:space-y-8">
        {/* Info Banner */}
        <section className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-5 print:hidden">
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-base text-white mb-1">Permanent Vehicle Verification QR Pass</p>
              <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                This QR code is unique to your vehicle ({qrData?.license_plate}). Display it prominently on your vehicle so citizens can scan it to verify waste collection.
              </p>
            </div>
          </div>
        </section>

        {/* QR Code Display */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl print:border-8">
          <div className="space-y-6 max-w-md mx-auto">
            {/* Vehicle Info */}
            <div className="text-center print:mb-8">
              <div className="inline-block rounded-2xl border border-orange-500/30 bg-orange-600 px-8 py-3 shadow-lg print:border-8 print:px-12 print:py-4">
                <p className="text-xs font-black uppercase tracking-wider text-white print:text-2xl">
                  Garbage Truck License
                </p>
                <p className="text-3xl font-black text-white print:text-6xl uppercase tracking-widest mt-0.5">
                  {qrData?.license_plate}
                </p>
              </div>
            </div>

            {/* QR Code Visualization */}
            <div className="flex justify-center bg-white p-8 rounded-2xl shadow-inner border border-slate-700">
              {qrValue ? (
                <QRCodeCanvas
                  value={qrValue}
                  size={260}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              ) : (
                <div className="w-[260px] h-[260px] flex items-center justify-center border border-slate-300">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
                </div>
              )}
            </div>

            {/* QR Code Text */}
            <div className="space-y-3 print:mt-8">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-wider text-slate-300 print:text-xl">
                  Permanent QR Code ID
                </p>
                <p className="font-mono text-xs break-all bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-amber-400 font-bold mt-1 print:text-2xl print:py-4">
                  {qrData?.qr_code}
                </p>
              </div>

              <div className="text-center text-xs font-semibold text-slate-300 space-y-1 print:text-xl print:mt-8">
                <p className="font-black text-white">How Citizens Scan:</p>
                <p>Citizens point their mobile camera at this QR pass during waste collection</p>
                <p className="text-[11px] font-bold text-slate-400 mt-2 print:text-lg">
                  Generated: {new Date(qrData?.generated_at || Date.now()).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-4 print:hidden">
              <button
                onClick={() => copyToClipboard(qrData?.qr_code || "")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-xs font-black uppercase text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-orange-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              
              <button
                onClick={downloadQR}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-xs font-black uppercase text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Download className="h-5 w-5 text-orange-400" />
                <span>Download</span>
              </button>
              
              <button
                onClick={printQR}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-600 px-4 py-3.5 text-xs font-black uppercase text-white hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/30"
              >
                <Printer className="h-5 w-5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 print:hidden space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <QrCode className="h-5 w-5 text-orange-400" /> Display Instructions for Drivers
          </h3>
          <ol className="space-y-2 text-xs font-bold text-slate-300">
            <li className="flex items-center gap-2">
              <span className="font-black text-orange-400">1.</span>
              <span>Print this QR pass or download the high-resolution PNG image</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-black text-orange-400">2.</span>
              <span>Mount it clearly on the exterior side of your collection truck</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-black text-orange-400">3.</span>
              <span>Citizens scan this QR code when handing over segregated waste to credit civic reward points</span>
            </li>
          </ol>
        </section>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          section:has(.print\\:border-8),
          section:has(.print\\:border-8) * {
            visibility: visible;
          }
          
          @page {
            size: A4;
            margin: 2cm;
          }
        }
      `}</style>
    </DriverShell>
  );
}
