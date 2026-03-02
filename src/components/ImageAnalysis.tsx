import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Upload, Camera, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export function ImageAnalysis({ onAnalysisComplete, wardrobe }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI response following the specified format
    const mockAnalysis = {
      detected_item: {
        type: "Jacket",
        color: "Black",
        pattern: "Plain",
        fabric: "Leather",
        style: "Streetwear",
        confidence: 0.92
      },
      outfits: [
        {
          category: "Budget-Friendly",
          pieces: [
            { item: "Grey Hoodie", source: "User Wardrobe" },
            { item: "Slim Blue Jeans", source: "User Wardrobe" },
            { item: "White Sneakers", source: "User Wardrobe" },
            { item: "Black Beanie", source: "H&M", price: "$15" }
          ],
          reasoning: "A casual streetwear look leveraging your existing wardrobe."
        },
        {
          category: "Trendy/Statement",
          pieces: [
            { item: "Oversized White Tee", source: "Zara", price: "$25" },
            { item: "Distressed Black Jeans", source: "ASOS", price: "$40" },
            { item: "High-top Sneakers", source: "Nike", price: "$90" }
          ],
          reasoning: "Edgy and modern streetwear combination."
        },
        {
          category: "Sustainable/Minimalist",
          pieces: [
            { item: "Organic Cotton Tee", source: "Patagonia", price: "$35" },
            { item: "Recycled Denim Jeans", source: "Levi's Sustainable", price: "$70" },
            { item: "Vegan Leather Boots", source: "Dr. Martens", price: "$120" }
          ],
          reasoning: "Eco-conscious option focusing on sustainability."
        }
      ],
      wardrobe_integration: {
        used_items: ["Grey Hoodie", "Slim Blue Jeans", "White Sneakers"],
        unused_items: ["Red Flannel Shirt", "Beige Chinos"]
      },
      recommended_actions: [
        "Filter outfits by price",
        "Save this outfit to wardrobe",
        "Favorite this look",
        "Compare jacket with alternatives",
        "Share outfit summary"
      ]
    };
    
    setAnalysisResult(mockAnalysis);
    onAnalysisComplete(mockAnalysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Image Analysis & Detection
          </CardTitle>
          <CardDescription>
            Upload a clothing item photo to analyze its attributes and get styling recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {selectedImage ? (
              <div className="space-y-4">
                <ImageWithFallback 
                  src={selectedImage} 
                  alt="Uploaded clothing item"
                  className="mx-auto max-w-xs max-h-64 object-cover rounded-lg"
                />
                <Button onClick={analyzeImage} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3>Upload a clothing item</h3>
                  <p className="text-muted-foreground">
                    Drag and drop or click to select an image
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button as="span" className="cursor-pointer">
                    Select Image
                  </Button>
                </label>
              </div>
            )}
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Analyzing image...</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Analysis complete with {Math.round(analysisResult.detected_item.confidence * 100)}% confidence
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-muted-foreground">Type</label>
                <p>{analysisResult.detected_item.type}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Color</label>
                <p>{analysisResult.detected_item.color}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Pattern</label>
                <p>{analysisResult.detected_item.pattern}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Fabric</label>
                <p>{analysisResult.detected_item.fabric}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Style</label>
                <Badge variant="secondary">{analysisResult.detected_item.style}</Badge>
              </div>
              <div>
                <label className="text-muted-foreground">Confidence</label>
                <p>{Math.round(analysisResult.detected_item.confidence * 100)}%</p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="mb-2">Wardrobe Integration</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Compatible items: </span>
                  {analysisResult.wardrobe_integration.used_items.map((item, index) => (
                    <Badge key={index} variant="outline" className="mr-1">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div>
                  <span className="text-muted-foreground">Unused items: </span>
                  {analysisResult.wardrobe_integration.unused_items.map((item, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}