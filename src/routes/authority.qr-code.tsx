import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { QrCode, Download, Copy, Check, Printer, Truck, RefreshCw, AlertCircle, ArrowLeft, Home } from "lucide-react";
import { API_BASE_URL, useVehicleAuthority } from "@/lib/vehicle-authority-store";
import QRCode from 'qrcode';

export const Route = createFileRoute("/authority/qr-code")({
  head: () => ({
    meta: [
      { title: "Vehicle QR Code | CivicSync Authority" },
      {
        name: "description",
        content: "Display your vehicle's permanent QR code for citizen scanning.",
      },
    ],
  }),
  component: AuthorityQRCodePage,
});

interface VehicleQRData {
  qr_code: string;
  license_plate: string;
  generated_at: string;
  vehicle_id: string;
}

function AuthorityQRCodePage() {
  const { state } = useVehicleAuthority();
  const [qrData, setQrData] = useState<VehicleQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchVehicleQR();
  }, []);

  useEffect(() => {
    if (qrData && qrCanvasRef.current) {
      generateQRCode();
    }
  }, [qrData]);

  const generateQRCode = async () => {
    if (!qrData || !qrCanvasRef.current) return;
    
    try {
      // Generate URL that will open citizen app to scan this vehicle
      const citizenAppUrl = `${window.location.origin}/citizen/scan?vehicle=${qrData.qr_code}`;
      
      // Generate QR code with the URL
      await QRCode.toCanvas(qrCanvasRef.current, citizenAppUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      console.log('✅ QR Code generated with URL:', citizenAppUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const fetchVehicleQR = async () => {
    try {
      setLoading(true);
      setError("");
      
      const accessToken = state.access_token;
      
      if (!accessToken) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching vehicle QR code for authority...');
      const response = await fetch(`${API_BASE_URL}/auth/driver/qr-code`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ QR code fetched successfully');
        setQrData(data);
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

  const downloadQR = async () => {
    if (!qrData) return;

    try {
      // Generate URL for citizen app
      const citizenAppUrl = `${window.location.origin}/citizen/scan?vehicle=${qrData.qr_code}`;
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(citizenAppUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Create canvas with text
      const canvas = document.createElement('canvas');
      const size = 700;
      canvas.width = size;
      canvas.height = size + 150;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size + 150);

      // Load QR image
      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR code centered
        const qrSize = 600;
        const qrX = (size - qrSize) / 2;
        const qrY = 50;
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Add vehicle info
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Vehicle: ${qrData.license_plate}`, size / 2, qrY + qrSize + 50);
        
        ctx.font = '20px Arial';
        ctx.fillText('Scan to Verify Garbage Collection', size / 2, qrY + qrSize + 85);
        
        ctx.font = '16px monospace';
        ctx.fillText(qrData.qr_code, size / 2, qrY + qrSize + 115);

        // Download
        const link = document.createElement('a');
        link.download = `vehicle-qr-${qrData.license_plate}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      qrImage.src = dataUrl;
    } catch (err) {
      console.error('Error downloading QR:', err);
    }
  };

  const printQR = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/authority/home" className="flex items-center gap-2 text-primary hover:underline font-bold uppercase">
                <ArrowLeft className="h-5 w-5" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <Truck className="h-6 w-6" />
                <h1 className="text-xl font-extrabold uppercase">Vehicle QR Code</h1>
              </div>
            </div>
            {state.user && (
              <div className="text-sm font-bold text-muted-foreground">
                {state.user.full_name}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-bold text-lg">Loading your vehicle QR code...</p>
            </div>
          </div>
        ) : error ? (
          <div className="border-4 border-destructive bg-destructive/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-destructive mb-2">Error Loading QR Code</p>
                <p className="text-destructive/80 mb-2">{error}</p>
                {error.includes('No vehicle assigned') && (
                  <p className="text-sm text-destructive/70 mb-4">
                    You need to have a vehicle assigned to you by an administrator.
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
        ) : !qrData ? (
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
        ) : (
          <div className="space-y-4 print:space-y-8">
            {/* Info Banner */}
            <section className="border-4 border-primary bg-primary/10 p-4 print:hidden">
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg text-primary mb-1">Permanent Vehicle QR Code</p>
                  <p className="text-sm text-primary/80">
                    This QR code is unique to your vehicle ({qrData.license_plate}). Display it prominently so citizens can scan it to verify garbage collection.
                  </p>
                </div>
              </div>
            </section>

            {/* QR Code Display */}
            <section className="border-4 border-border bg-card p-6 print:border-8">
              <div className="space-y-6">
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

                <div className="flex justify-center bg-white p-8 print:p-16">
                  <div className="inline-block border-8 border-foreground bg-white p-6 print:border-[16px] print:p-12">
                    <canvas 
                      ref={qrCanvasRef}
                      className="block print:!w-[600px] print:!h-[600px]"
                    />
                  </div>
                </div>

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
                    <p className="font-bold">📱 How It Works:</p>
                    <p className="mt-2">When citizens scan this QR code:</p>
                    <ol className="mt-2 text-left inline-block text-xs space-y-1">
                      <li>1. Opens scan page automatically</li>
                      <li>2. Citizen uploads photo proof</li>
                      <li>3. GPS location captured automatically</li>
                      <li>4. You see the scan in your dashboard</li>
                      <li>5. Admin can verify the collection</li>
                    </ol>
                    <p className="text-xs mt-4 print:text-lg">
                      Generated: {new Date(qrData.generated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 print:hidden">
                  <button
                    onClick={() => copyToClipboard(qrData.qr_code)}
                    className="flex flex-col items-center justify-center gap-2 border-4 border-border bg-background px-4 py-4 font-bold uppercase hover:bg-muted transition-colors"
                  >
                    {copied ? <Check className="h-6 w-6 text-success" /> : <Copy className="h-6 w-6" />}
                    <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
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
                Instructions
              </h3>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <span>Print or download this QR code</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <span>Display it on your vehicle</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <span>Citizens scan to verify collection</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">4.</span>
                  <span>Keep visible during your route</span>
                </li>
              </ol>
            </section>
          </div>
        )}
      </main>

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
    </div>
  );
}
