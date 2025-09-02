import { useState, useCallback, useEffect } from "react";
import { DeviceCard } from "@/components/esp-flasher/DeviceCard";
import { FirmwareCard } from "@/components/esp-flasher/FirmwareCard";
import { FlashCard } from "@/components/esp-flasher/FlashCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlashService, DeviceInfo, FlashProgress } from "@/services/FlashService";
import { AlertTriangle, Github, FileText, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FlashStepStatus = 'pending' | 'active' | 'completed' | 'error';

interface FlashStep {
  name: string;
  status: FlashStepStatus;
}

const Index = () => {
  const { toast } = useToast();
  const [flashService] = useState(() => new FlashService());
  
  // Device state
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>();
  const [deviceError, setDeviceError] = useState<string>();

  // Firmware state
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState({
    baudRate: 115200,
    offset: "0x1000",
    eraseFlash: true
  });

  // Flash state
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashLogs, setFlashLogs] = useState<string[]>([]);
  const [flashSteps, setFlashSteps] = useState<FlashStep[]>([
    { name: 'Connecting', status: 'pending' },
    { name: 'Syncing', status: 'pending' },
    { name: 'Erasing', status: 'pending' },
    { name: 'Writing', status: 'pending' },
    { name: 'Verifying', status: 'pending' },
    { name: 'Done', status: 'pending' }
  ]);
  const [flashError, setFlashError] = useState<string>();
  const [flashCompleted, setFlashCompleted] = useState(false);
  const [flashStats, setFlashStats] = useState<any>();

  // Check Web Serial support
  const [webSerialSupported, setWebSerialSupported] = useState(true);
  const [browserWarning, setBrowserWarning] = useState<string>();

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await flashService.checkWebSerialSupport();
      setWebSerialSupported(supported);
      
      // Check for specific browser/environment issues
      if (!supported) {
        setBrowserWarning('Web Serial API not supported in this browser.');
      } else if (location.protocol !== 'https:' && !location.hostname.includes('localhost') && location.hostname !== '127.0.0.1') {
        setBrowserWarning('Web Serial requires HTTPS. Some features may not work over HTTP.');
      }
    };
    checkSupport();
  }, [flashService]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setDeviceError(undefined);
    
    try {
      const info = await flashService.connect();
      setDeviceInfo(info);
      setIsConnected(true);
      
      toast({
        title: "Device Connected",
        description: `${info.chip} detected successfully`,
      });
      
      setFlashLogs(prev => [...prev, `Connected to ${info.chip} at ${info.port}`]);
    } catch (error: any) {
      const errorMessage = FlashService.getErrorMessage(error);
      const suggestion = FlashService.getErrorSuggestion(error);
      setDeviceError(`${errorMessage} ${suggestion}`);
      
      toast({
        title: "Connection Failed", 
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  }, [flashService, toast]);

  const handleFlash = useCallback(async () => {
    if (!firmwareFile || !isConnected) return;

    setIsFlashing(true);
    setFlashError(undefined);
    setFlashCompleted(false);
    setFlashProgress(0);
    setFlashLogs([]);
    
    // Reset steps
    const steps = [
      'Connecting', 'Syncing', 
      ...(advancedSettings.eraseFlash ? ['Erasing'] : []), 
      'Writing', 'Verifying', 'Done'
    ];
    setFlashSteps(steps.map(name => ({ name, status: 'pending' as FlashStepStatus })));

    const startTime = Date.now();

    try {
      await flashService.flash(
        {
          file: firmwareFile,
          baudRate: advancedSettings.baudRate,
          offset: advancedSettings.offset,
          eraseFlash: advancedSettings.eraseFlash
        },
        (progress: FlashProgress) => {
          setFlashProgress(progress.progress);
          setFlashLogs(prev => [...prev, progress.message]);
          
          // Update step status
          setFlashSteps(prev => prev.map((step, index) => {
            if (step.name === progress.step) {
              return { ...step, status: 'active' as FlashStepStatus };
            }
            // Mark previous steps as completed
            const currentIndex = steps.indexOf(progress.step);
            if (index < currentIndex) {
              return { ...step, status: 'completed' as FlashStepStatus };
            }
            return step;
          }));
        }
      );

      // Mark all steps as completed
      setFlashSteps(prev => prev.map(step => ({ ...step, status: 'completed' as FlashStepStatus })));
      setFlashCompleted(true);
      
      const duration = Date.now() - startTime;
      setFlashStats({
        chip: deviceInfo?.chip || 'Unknown',
        baudRate: advancedSettings.baudRate,
        fileSize: firmwareFile.size,
        duration
      });

      toast({
        title: "Flash Completed",
        description: "Firmware flashed successfully!",
      });

    } catch (error: any) {
      const errorMessage = FlashService.getErrorMessage(error);
      setFlashError(errorMessage);
      
      // Mark current step as error
      setFlashSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error' as FlashStepStatus } : step
      ));

      toast({
        title: "Flash Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFlashing(false);
    }
  }, [firmwareFile, isConnected, advancedSettings, flashService, deviceInfo, toast]);

  const handleReset = useCallback(() => {
    setFlashCompleted(false);
    setFlashError(undefined);
    setFlashProgress(0);
    setFlashLogs([]);
    setFlashStats(undefined);
    setFlashSteps(prev => prev.map(step => ({ ...step, status: 'pending' as FlashStepStatus })));
  }, []);

  const canFlash = isConnected && firmwareFile && !isFlashing;

  if (!webSerialSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Browser Not Supported</h1>
          <p className="text-muted-foreground">
            Your browser doesn't support Web Serial. Try Chrome or Edge on desktop.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">infiltra flasher</h1>
              <p className="text-sm text-muted-foreground">
                Flash ESP firmware in your browser. No drivers. No CLI.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              <a 
                href="https://infiltra.xyz" 
                className="hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                infiltra.xyz
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Browser Warning */}
      {browserWarning && (
        <div className="border-b border-amber-500/20 bg-amber-500/5">
          <div className="container mx-auto px-4 py-3 max-w-4xl">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{browserWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <DeviceCard
          isConnected={isConnected}
          deviceInfo={deviceInfo}
          onConnect={handleConnect}
          connecting={connecting}
          error={deviceError}
        />

        <FirmwareCard
          file={firmwareFile}
          onFileSelect={setFirmwareFile}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={setAdvancedSettings}
          disabled={isFlashing}
        />

        <FlashCard
          canFlash={canFlash}
          isFlashing={isFlashing}
          progress={flashProgress}
          steps={flashSteps}
          logs={flashLogs}
          onFlash={handleFlash}
          onReset={handleReset}
          error={flashError}
          completed={flashCompleted}
          flashStats={flashStats}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-card/30 backdrop-blur mt-16">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground">
              <p>Files stay local. No uploads. Open source.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a 
                href="#" 
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <FileText className="h-3 w-3" />
                Docs
              </a>
              <a 
                href="#" 
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Github className="h-3 w-3" />
                Source
              </a>
              <a 
                href="#" 
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <HelpCircle className="h-3 w-3" />
                Help
              </a>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-primary/10">
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-primary">FAQ</summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>Which chips are supported?</strong>
                  <p>ESP8266/ESP32 families supported by the browser flashing library.</p>
                </div>
                <div>
                  <strong>Why Chrome/Edge?</strong>
                  <p>Web Serial is currently supported there.</p>
                </div>
                <div>
                  <strong>Stuck in boot mode?</strong>
                  <p>Hold BOOT while pressing RESET, then release BOOT and retry.</p>
                </div>
              </div>
            </details>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
