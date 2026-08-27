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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchVehicleQR();
  }, []);

  const fetchVehicleQR = async () => {
    try {
      setLoading(true);
      setError("");
      
      const accessToken = localStorage.getItem('civicsync_vehicle_token');

      if (!accessToken) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching vehicle QR code...');
      const response = await fetch(`${API_BASE_URL}/auth/vehicle/qr-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ QR code fetched successfully');
        setQrData(data);
        const qrContent = data.scan_url || data.qr_code;
        setQrValue(qrContent);
      } else {
        console.error('❌ Failed to fetch QR:', data.error);
        setError(data.error || 'Failed to fetch vehicle QR code');
      }
    } catch (err: any) {
      console.error('Error fetching vehicle QR:', err);
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
      <DriverShell title="Vehicle QR Code" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-bold text-lg">Loading your vehicle QR code...</p>
          </div>
        </div>
      </DriverShell>
    );
  }

  if (error) {
    return (
      <DriverShell title="Vehicle QR Code" subtitle="Error">
        <div className="border-4 border-destructive bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-lg text-destructive mb-2">Error Loading QR Code</p>
              <p className="text-destructive/80 mb-2">{error}</p>
              {error.includes('No vehicle assigned') && (
                <p className="text-sm text-destructive/70 mb-4">
                  You need to have a vehicle assigned to you by an administrator before you can view the QR code.
                </p>
              )}
              <button
                onClick={fetchVehicleQR}
                className="flex items-center gap-2 border-4 border-destructive bg-destructive px-4 py-2 font-bold uppercase text-destructive-foreground hover:bg-destructive/90"
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

  if (!qrData) {
    return (
      <DriverShell title="Vehicle QR Code" subtitle="Not Available">
        <div className="border-4 border-warning bg-warning/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-lg text-warning mb-2">QR Code Not Generated</p>
              <p className="text-warning/80">
                Your vehicle doesn't have a QR code yet. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </DriverShell>
    );
  }

  return (
    <DriverShell title="Vehicle QR Code" subtitle={`Vehicle: ${qrData.license_plate}`}>
      <div className="space-y-4 print:space-y-8">
        {/* Info Banner */}
        <section className="border-4 border-primary bg-primary/10 p-4 print:hidden">
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-lg text-primary mb-1">Permanent Vehicle QR Code</p>
              <p className="text-sm text-primary/80">
                This QR code is unique to your vehicle ({qrData.license_plate}). Display it prominently on your vehicle so citizens can scan it to verify garbage collection.
              </p>
            </div>
          </div>
        </section>

        {/* QR Code Display */}
        <section className="border-4 border-border bg-card p-6 print:border-8">
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="text-center print:mb-8">
              <div className="inline-block border-4 border-primary bg-primary px-6 py-2 print:border-8 print:px-12 print:py-4">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-foreground print:text-2xl">
                  Vehicle
                </p>
                <p className="text-3xl font-extrabold text-primary-foreground print:text-6xl">
                  {qrData.license_plate}
                </p>
              </div>
            </div>

            {/* QR Code Visualization */}
            <div className="flex justify-center bg-white p-8">
              {qrValue ? (
                <QRCodeCanvas
                  value={qrValue}
                  size={280}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              ) : (
                <div className="w-[280px] h-[280px] flex items-center justify-center border-4 border-border">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* QR Code Text */}
            <div className="space-y-3 print:mt-8">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground print:text-xl">
                  QR Code ID
                </p>
                <p className="font-mono text-xs break-all bg-muted px-4 py-2 border-4 border-border print:text-2xl print:py-4">
                  {qrData.qr_code}
                </p>
              </div>

              <div className="text-center text-sm text-muted-foreground print:text-xl print:mt-8">
                <p className="font-bold">📱 How to Use:</p>
                <p>Citizens can scan this QR code to report garbage collection</p>
                <p className="text-xs mt-2 print:text-lg">
                  Generated: {new Date(qrData.generated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-4 print:hidden">
              <button
                onClick={() => copyToClipboard(qrData.qr_code)}
                className="flex flex-col items-center justify-center gap-2 border-4 border-border bg-background px-4 py-4 font-bold uppercase hover:bg-muted transition-colors"
              >
                {copied ? <Check className="h-6 w-6 text-success" /> : <Copy className="h-6 w-6" />}
                <span className="text-xs">{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              
              <button
                onClick={downloadQR}
                className="flex flex-col items-center justify-center gap-2 border-4 border-border bg-background px-4 py-4 font-bold uppercase hover:bg-muted transition-colors"
              >
                <Download className="h-6 w-6" />
                <span className="text-xs">Download</span>
              </button>
              
              <button
                onClick={printQR}
                className="flex flex-col items-center justify-center gap-2 border-4 border-primary bg-primary px-4 py-4 font-bold uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Printer className="h-6 w-6" />
                <span className="text-xs">Print</span>
              </button>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="border-4 border-border bg-card p-4 print:hidden">
          <h3 className="mb-3 text-lg font-extrabold uppercase flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Display Instructions
          </h3>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Print this QR code or download it to your device</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>Display it prominently on your garbage collection vehicle</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Citizens will scan this code to verify you collected their garbage</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Keep this QR code visible during your collection route</span>
            </li>
          </ol>
        </section>

        {/* Security Notice */}
        <section className="border-4 border-muted bg-muted/50 p-4 print:hidden">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold">🔒 Security Notice:</span> This QR code is unique to your vehicle ({qrData.license_plate}) and should not be shared with other vehicles. Each scan is logged with timestamp and location for accountability. This QR code is permanent and tied to your vehicle only.
          </p>
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
