import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string>("");

  // Keep callback ref fresh without restarting scanner
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scannerId = "barcode-scanner-region";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        {
          facingMode: "environment",
          width: { ideal: 1920 },  // Request HD resolution
          height: { ideal: 1080 },
        },
        { fps: 15, qrbox: { width: 300, height: 200 } },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          // Beep sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.frequency.value = 1200;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 150);
          } catch (_) {}

          scanner.stop().then(() => {
            onScanRef.current(decodedText);
          }).catch(() => {
            // Even if stop fails, still fire callback
            onScanRef.current(decodedText);
          });
        },
        () => {}
      )
      .catch((err) => {
        setError("Camera access denied. Please allow camera permissions.");
        console.error(err);
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold text-foreground">Scan Barcode</h2>
        <button onClick={onClose} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
          Close
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div id="barcode-scanner-region" className="w-full max-w-sm overflow-hidden rounded-xl" />
        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Point your camera at a barcode (EAN-13, UPC-A, Code-128)
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
