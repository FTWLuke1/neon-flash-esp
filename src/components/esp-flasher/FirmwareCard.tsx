import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Settings, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FirmwareCardProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  advancedSettings: {
    baudRate: number;
    offset: string;
    eraseFlash: boolean;
  };
  onAdvancedSettingsChange: (settings: any) => void;
  disabled?: boolean;
}

export function FirmwareCard({ 
  file, 
  onFileSelect, 
  advancedSettings, 
  onAdvancedSettingsChange,
  disabled = false 
}: FirmwareCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(undefined);

    const files = Array.from(e.dataTransfer.files);
    const binFile = files.find(file => file.name.toLowerCase().endsWith('.bin'));
    
    if (!binFile) {
      setError("Please drop a .bin firmware file");
      return;
    }

    if (binFile.size > 16 * 1024 * 1024) { // 16MB limit
      setError("File too large. Maximum size is 16MB");
      return;
    }

    onFileSelect(binFile);
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(undefined);
      if (!file.name.toLowerCase().endsWith('.bin')) {
        setError("Please select a .bin firmware file");
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="glass-card p-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20 text-secondary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Firmware (.bin)</CardTitle>
              <CardDescription>
                Upload your ESP firmware file
              </CardDescription>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={disabled}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-primary/30">
              <DialogHeader>
                <DialogTitle>Advanced Options</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baud-rate">Baud Rate</Label>
                  <Input
                    id="baud-rate"
                    type="number"
                    value={advancedSettings.baudRate}
                    onChange={(e) => onAdvancedSettingsChange({
                      ...advancedSettings,
                      baudRate: parseInt(e.target.value) || 115200
                    })}
                    placeholder="115200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offset">Flash Offset (hex)</Label>
                  <Input
                    id="offset"
                    value={advancedSettings.offset}
                    onChange={(e) => onAdvancedSettingsChange({
                      ...advancedSettings,
                      offset: e.target.value
                    })}
                    placeholder="0x1000"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="erase-flash"
                    checked={advancedSettings.eraseFlash}
                    onCheckedChange={(checked) => onAdvancedSettingsChange({
                      ...advancedSettings,
                      eraseFlash: checked
                    })}
                  />
                  <Label htmlFor="erase-flash">Erase flash before writing</Label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
            isDragOver && "border-primary glow-border bg-primary/5",
            !isDragOver && "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            file && "border-primary/50 bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onClick={() => {
            if (!disabled) {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.bin';
              input.onchange = (e) => handleFileInput(e as any);
              input.click();
            }
          }}
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">File Selected</span>
              </div>
              <p className="text-sm font-mono">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • Click to choose different file
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className={cn(
                "h-8 w-8 mx-auto transition-colors",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <p className="font-medium">Drop your .bin here or click to choose</p>
                <p className="text-sm text-muted-foreground">
                  ESP8266/ESP32 firmware files only
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}