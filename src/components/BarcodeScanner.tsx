import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef("barcode-scanner");

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          toast.success(`Scanned: ${decodedText}`);
          stopScanning();
        },
        (errorMessage) => {
          // Error callback (we can ignore these as they're frequent during scanning)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera. Please check permissions.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Barcode Scanner</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            id={scannerIdRef.current}
            className="w-full aspect-video bg-muted rounded-lg overflow-hidden"
          />
          
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Stop Scanning
            </Button>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            Position the barcode within the frame to scan
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
