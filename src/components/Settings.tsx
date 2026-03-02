import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Settings as SettingsIcon, Moon, Sun, Type } from "lucide-react";

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  fontSize: string;
  setFontSize: (value: string) => void;
}

export function Settings({ isDarkMode, setIsDarkMode, fontSize, setFontSize }: SettingsProps) {
  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    
    // Update CSS variable
    const root = document.documentElement;
    switch (value) {
      case 'small':
        root.style.setProperty('--font-size', '14px');
        break;
      case 'medium':
        root.style.setProperty('--font-size', '16px');
        break;
      case 'large':
        root.style.setProperty('--font-size', '18px');
        break;
      case 'xlarge':
        root.style.setProperty('--font-size', '20px');
        break;
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    
    // Toggle dark mode class on document
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </CardTitle>
          <CardDescription>
            Customize your experience with The Alternative
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg">Appearance</h3>
            <Separator />
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="flex items-center gap-2">
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>

            {/* Font Size Selector */}
            <div className="space-y-2">
              <Label htmlFor="font-size" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Font Size
              </Label>
              <Select value={fontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger id="font-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (14px)</SelectItem>
                  <SelectItem value="medium">Medium (16px)</SelectItem>
                  <SelectItem value="large">Large (18px)</SelectItem>
                  <SelectItem value="xlarge">Extra Large (20px)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Adjust text size across the application
              </p>
            </div>
          </div>

          <Separator />

          {/* Accessibility */}
          <div className="space-y-4">
            <h3 className="text-lg">Accessibility</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Font size and theme settings help make The Alternative more accessible and comfortable to use.
              </p>
            </div>
          </div>

          <Separator />

          {/* Privacy & Data */}
          <div className="space-y-4">
            <h3 className="text-lg">Privacy & Data</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your wardrobe data is stored locally on your device. We do not collect or share any personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <strong>The Alternative</strong> - Your AI-powered sustainable fashion companion
          </p>
          <p className="text-sm text-muted-foreground">
            Version 1.0.0
          </p>
          <p className="text-sm text-muted-foreground">
            Discover, organize, and shop sustainable fashion with AI assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
