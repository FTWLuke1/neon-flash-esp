// ESP Flashing Service using esptool-js
// This service wraps the esptool-js library for browser-based ESP flashing

// Web Serial API type definitions
interface SerialPort {
  open(options: { baudRate: number; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
  getInfo(): { usbProductId?: string; usbVendorId?: string };
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialPortRequestOptions {
  filters?: Array<{
    usbVendorId?: number;
    usbProductId?: number;
  }>;
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

declare global {
  interface Navigator {
    serial?: Serial;
  }
}

export interface DeviceInfo {
  chip: string;
  port: string;
  mac?: string;
}

export interface FlashOptions {
  file: File;
  baudRate: number;
  offset: string;
  eraseFlash: boolean;
}

export interface FlashProgress {
  step: string;
  progress: number;
  bytesWritten: number;
  totalBytes: number;
  message: string;
}

export class FlashService {
  private port: SerialPort | null = null;
  private espTool: any = null;

  async checkWebSerialSupport(): Promise<boolean> {
    return 'serial' in navigator && !!navigator.serial;
  }

  async connect(): Promise<DeviceInfo> {
    try {
      // Request port from user
      this.port = await navigator.serial!.requestPort();
      
      // Open the port
      await this.port.open({ 
        baudRate: 115200,
        bufferSize: 1024
      });

      // Initialize esptool-js (mock implementation for now)
      // In a real implementation, you would use the actual esptool-js library
      const deviceInfo = await this.detectDevice();
      
      return deviceInfo;
    } catch (error) {
      throw new Error(`Failed to connect: ${(error as Error).message}`);
    }
  }

  private async detectDevice(): Promise<DeviceInfo> {
    // Mock device detection
    // In real implementation, this would use esptool-js to sync and detect the chip
    
    // Simulate detection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock device info based on common ESP chips
    const chips = ['ESP32', 'ESP32-S2', 'ESP32-S3', 'ESP32-C3', 'ESP8266'];
    const randomChip = chips[Math.floor(Math.random() * chips.length)];
    
    return {
      chip: randomChip,
      port: this.port?.getInfo()?.usbProductId ? 'USB' : 'Serial',
      mac: '24:6F:28:' + Math.random().toString(16).substr(2, 6).toUpperCase()
    };
  }

  async flash(
    options: FlashOptions, 
    onProgress: (progress: FlashProgress) => void
  ): Promise<void> {
    if (!this.port) {
      throw new Error('No device connected');
    }

    try {
      const steps = [
        'Connecting',
        'Syncing', 
        ...(options.eraseFlash ? ['Erasing'] : []),
        'Writing',
        'Verifying',
        'Done'
      ];

      let currentStep = 0;
      const totalBytes = options.file.size;

      // Helper to update progress
      const updateProgress = (step: string, progress: number, bytesWritten: number, message: string) => {
        onProgress({
          step,
          progress,
          bytesWritten,
          totalBytes,
          message
        });
      };

      // Step 1: Connecting
      updateProgress(steps[currentStep], 0, 0, 'Establishing connection...');
      await this.sleep(500);
      currentStep++;

      // Step 2: Syncing
      updateProgress(steps[currentStep], 10, 0, 'Syncing with device...');
      await this.sleep(800);
      currentStep++;

      // Step 3: Erasing (if enabled)
      if (options.eraseFlash) {
        updateProgress(steps[currentStep], 20, 0, 'Erasing flash memory...');
        await this.sleep(1500);
        currentStep++;
      }

      // Step 4: Writing
      const writeStartProgress = options.eraseFlash ? 30 : 20;
      const writeEndProgress = 85;
      
      updateProgress(steps[currentStep], writeStartProgress, 0, 'Writing firmware...');
      
      // Simulate writing progress
      const chunks = 50;
      const chunkSize = Math.ceil(totalBytes / chunks);
      
      for (let i = 0; i < chunks; i++) {
        const bytesWritten = Math.min((i + 1) * chunkSize, totalBytes);
        const progress = writeStartProgress + ((writeEndProgress - writeStartProgress) * (i + 1)) / chunks;
        
        updateProgress(
          steps[currentStep], 
          progress, 
          bytesWritten, 
          `Writing: ${this.formatBytes(bytesWritten)}/${this.formatBytes(totalBytes)}`
        );
        
        await this.sleep(50);
      }
      currentStep++;

      // Step 5: Verifying
      updateProgress(steps[currentStep], 90, totalBytes, 'Verifying flash...');
      await this.sleep(1000);
      currentStep++;

      // Step 6: Done
      updateProgress(steps[currentStep], 100, totalBytes, 'Flash completed successfully!');
      
    } catch (error) {
      throw new Error(`Flash failed: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Error handling helpers
  static getErrorMessage(error: any): string {
    if (error.name === 'NotFoundError') {
      return 'No device selected. Please connect your ESP device and try again.';
    }
    if (error.name === 'NotSupportedError') {
      return 'Web Serial is not supported in this browser. Please use Chrome or Edge.';
    }
    if (error.name === 'SecurityError') {
      return 'Permission denied. Please allow access to the serial port.';
    }
    if (error.name === 'NetworkError') {
      return 'Failed to communicate with device. Check your connection and try again.';
    }
    return error.message || 'An unknown error occurred';
  }

  static getErrorSuggestion(error: any): string {
    if (error.name === 'NotFoundError') {
      return 'Make sure your ESP device is connected via USB and try clicking Connect again.';
    }
    if (error.name === 'NetworkError') {
      return 'Try holding BOOT button, pressing RESET, then releasing BOOT and retry.';
    }
    return 'Check your device connection and try again.';
  }
}