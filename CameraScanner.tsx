
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertCircle, X, History, Scan } from 'lucide-react';

interface CameraScannerProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
  onClose: () => void;
  onOpenList?: () => void;
  hasLastDelivery?: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, isProcessing, onClose, onOpenList, hasLastDelivery }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [stabilityLevel, setStabilityLevel] = useState(0);
  const stabilityCounter = useRef(0);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);

      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            }
          });
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
    }
  }, []);

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.acceleration;
    if (!acc) return;
    const totalMotion = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
    if (totalMotion < 0.3) {
      stabilityCounter.current = Math.min(stabilityCounter.current + 10, 100);
    } else {
      stabilityCounter.current = Math.max(stabilityCounter.current - 20, 0);
    }
    setStabilityLevel(stabilityCounter.current);
    setIsStable(stabilityCounter.current >= 90);
  };

  useEffect(() => {
    startCamera();
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const cropWidth = videoWidth * 0.75;
    const cropHeight = cropWidth * (3/4);
    const startX = (videoWidth - cropWidth) / 2;
    const startY = (videoHeight - cropHeight) / 2;

    const targetWidth = 1024;
    const targetHeight = cropHeight * (targetWidth / cropWidth);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)';
    ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);

    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    onCapture(base64);
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-xl font-bold mb-2">Câmera Bloqueada</h2>
        <p className="text-slate-400 mb-8">O LogiFlow precisa da câmera para processar etiquetas.</p>
        <button onClick={startCamera} className="bg-blue-600 px-8 py-4 rounded-3xl font-bold active:scale-95 transition-all">Permitir Acesso</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-70" />
      
      <button onClick={onClose} className="absolute top-12 left-8 p-4 bg-white/10 backdrop-blur-md rounded-full text-white z-50">
        <X className="w-7 h-7" />
      </button>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-[85%] max-w-[340px] aspect-[4/3] border-2 rounded-[2.5rem] relative transition-all duration-500 ${isStable ? 'border-green-500 scale-105 shadow-[0_0_60px_rgba(34,197,94,0.4)]' : 'border-white/20'}`}>
          {isProcessing && <div className="scanning-line absolute w-full left-0 z-10" />}
          <div className="absolute -bottom-16 left-0 right-0 flex flex-col items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div 
                className={`h-full transition-all duration-200 ${isStable ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${stabilityLevel}%` }}
               />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isStable ? 'text-green-500' : 'text-white/40'}`}>
              {isStable ? 'Pronto para Escanear' : 'Estabilizando Dispositivo...'}
            </span>
          </div>
        </div>
      </div>

      {/* Botão Lista de Entregas: Posição mantida conforme instruções */}
      <button
        onClick={onOpenList}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: '#424242',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 60
        }}
        className="active:scale-90 transition-all hover:brightness-110"
      >
        <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: '600' }} className="flex items-center gap-2">
           <History className="w-4 h-4" />
           Lista de Entregas
        </span>
      </button>

      {/* scanButton: REPOSICIONADO PARA O CENTRO INFERIOR E AUMENTADO (54px) */}
      <button
        onClick={captureFrame}
        disabled={isProcessing}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '54px',
          height: '54px',
          borderRadius: '27px',
          backgroundColor: '#1976D2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 60
        }}
        className="active:scale-90 transition-all hover:brightness-110 disabled:opacity-50"
      >
        <Scan className="w-6 h-6 text-white" />
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraScanner;
