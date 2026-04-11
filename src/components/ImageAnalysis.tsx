import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ImageWithFallback } from './errors/ImageWithFallback';
import { Upload, AlertCircle, Search, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { itemsAPI } from '../services/api';

export function ImageAnalysis({ onAnalysisComplete }: { onAnalysisComplete: (result: any) => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size too large. Please select an image under 10MB.');
        return;
      }

      setUploadError(null);
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string ?? null);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setUploadError('Please select a valid image file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError('File size too large. Please select an image under 10MB.');
          return;
        }

        setUploadError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string ?? null);
          setAnalysisResult(null);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError('Please drop a valid image file.');
      }
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !selectedFile) {
      setUploadError('Please select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setUploadError(null);
    setUploadError(null);

    try {
      // Use the stored file directly instead of converting from base64
      const searchResult = await itemsAPI.searchByImage(selectedFile);

      if (searchResult.data.success && searchResult.data.results.length > 0) {
        // Transform search results into analysis format
        const isFallback = searchResult.data.fallback;
        const mockAnalysis = {
          detected_item: {
            type: "Clothing Item",
            color: isFallback ? "Basic Detection" : "AI Analyzed",
            pattern: isFallback ? "Pattern Detected" : "AI Analyzed",
            fabric: isFallback ? "Material Detected" : "AI Analyzed",
            style: isFallback ? "Style Detected" : "AI Analyzed",
            confidence: isFallback ? 0.75 : 0.95
          },
          similar_items: searchResult.data.results,
          outfits: [
            {
              category: isFallback ? "Suggested Matches" : "AI Recommended",
              pieces: searchResult.data.results.slice(0, 3).map((item: any) => ({
                item: item.name,
                source: "Your Wardrobe",
                similarity: isFallback ? `${item.similarity}% suggested match` : `${Math.round(item.similarity * 100)}% match`
              })),
              reasoning: isFallback
                ? "Suggested items from your wardrobe based on available data."
                : "AI-powered recommendations based on visual similarity to your uploaded image."
            }
          ],
          wardrobe_integration: {
            used_items: searchResult.data.results.slice(0, 3).map((item: any) => item.name),
            unused_items: []
          },
          recommended_actions: isFallback ? [
            "Add more items to enable AI search",
            "Try uploading different images",
            "Items shown are suggestions from your wardrobe"
          ] : [
            "View similar items in wardrobe",
            "Create outfit with these matches",
            "Add this item to favorites",
            "Compare with other styles"
          ]
        };

        setAnalysisResult(mockAnalysis);
        onAnalysisComplete(mockAnalysis);
      } else {
        // No similar items found
        const noResultsAnalysis = {
          detected_item: {
            type: "Clothing Item",
            color: "Detected",
            pattern: "AI Analyzed",
            fabric: "Material Detected",
            style: "Fashion Style",
            confidence: 0.95
          },
          similar_items: [],
          outfits: [],
          wardrobe_integration: {
            used_items: [],
            unused_items: []
          },
          recommended_actions: [
            "Add more items to your wardrobe",
            "Try uploading a different image",
            "Check image quality and lighting"
          ]
        };

        setAnalysisResult(noResultsAnalysis);
        onAnalysisComplete(noResultsAnalysis);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      setUploadError('Failed to analyze image. Please try again.');

      // Fallback to basic analysis if AI search fails
      const fallbackAnalysis = {
        detected_item: {
          type: "Clothing Item",
          color: "Analysis Failed",
          pattern: "Error",
          fabric: "Unknown",
          style: "Unknown",
          confidence: 0.0
        },
        similar_items: [],
        outfits: [],
        wardrobe_integration: {
          used_items: [],
          unused_items: []
        },
        recommended_actions: [
          "Try uploading a different image",
          "Check your internet connection",
          "Try again later"
        ]
      };

      setAnalysisResult(fallbackAnalysis);
      onAnalysisComplete(fallbackAnalysis);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            AI Image Search & Analysis
          </CardTitle>
          <CardDescription>
            Upload a clothing item photo to find visually similar items in your wardrobe using OpenAI CLIP technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              // Only trigger file input if clicking on the div itself, not on child elements
              if (e.target === e.currentTarget) {
                console.log('Div clicked, triggering file input');
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }
            }}
          >
            {selectedImage ? (
              <div className="space-y-4">
                <ImageWithFallback
                  src={selectedImage}
                  alt="Uploaded clothing item"
                  className="mx-auto max-w-xs max-h-64 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedFile(null);
                      setAnalysisResult(null);
                      setUploadError(null);
                      // Reset file input
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className={`w-12 h-12 mx-auto ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <h3 className={isDragOver ? 'text-primary' : ''}>
                    {isDragOver ? 'Drop your image here' : 'Upload a clothing item'}
                  </h3>
                  <p className="text-muted-foreground">
                    Drag and drop or click to select an image
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    ref={fileInputRef}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Select Image button clicked');
                      if (fileInputRef.current) {
                        console.log('Triggering file input click');
                        fileInputRef.current.click();
                      } else {
                        console.log('fileInputRef.current is null');
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>AI analyzing image with CLIP...</span>
                <span>Processing...</span>
              </div>
              <Progress value={75} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Extracting visual features and searching your wardrobe for similar items
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Similar Items Found
            </CardTitle>
            <CardDescription>
              {analysisResult.similar_items && analysisResult.similar_items.length > 0
                ? `Found ${analysisResult.similar_items.length} visually similar item${analysisResult.similar_items.length > 1 ? 's' : ''} in your wardrobe`
                : 'No similar items found in your wardrobe'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisResult.similar_items && analysisResult.similar_items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResult.similar_items.map((item: any, index: number) => (
                  <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                    {item.imageUrl ? (
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-medium leading-tight">{item.name}</h5>
                        <Badge className="shrink-0 bg-green-100 text-green-800 border-green-200">
                          {item.similarity}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      {item.color && (
                        <p className="text-xs text-muted-foreground">{item.color}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Search className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  No similar items found in your wardrobe.
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adding more clothing items or uploading a different image.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}