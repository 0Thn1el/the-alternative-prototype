import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { User, Mail, MapPin, Phone, CreditCard, Package, Heart, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { calculateSustainabilityScore, getSustainabilityGrade } from '../utils/sustainabilityScore';

type WardrobeItem = {
  sustainable?: {
    organic?: boolean;
    recycled?: boolean;
    local?: boolean;
  };
  fabric?: string;
  materials?: string[];
  customTags?: string[];
  brand?: string;
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
};

interface ProfileProps {
  wardrobe?: WardrobeItem[];
}

export function Profile({ wardrobe = [] }: ProfileProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    joinDate: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const buildFallbackProfile = () => ({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    joinDate: user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        })
      : ""
  });

  useEffect(() => {
    if (user) {
      const fallbackProfile = buildFallbackProfile();
      setProfile(fallbackProfile);
      setEditedProfile(fallbackProfile);
      setLoading(false);
      fetchUserProfile();
    } else {
      console.warn('Profile component rendered but user is not authenticated');
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const response = await userAPI.getMe();
      const userData = response.data;
      
      const profileData = {
        name: userData.displayName || user?.displayName || "",
        email: userData.email || user?.email || "",
        phone: "",
        location: "",
        joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        }) : ""
      };
      
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      
      // If user not found in database, create the user record
      if (error.response?.status === 404 && user) {
        try {
          await userAPI.updateProfile({
            displayName: user.displayName || "",
            email: user.email || ""
          });
          
          // Retry fetching after creation
          const response = await userAPI.getMe();
          const userData = response.data;
          
          const profileData = {
            name: userData.displayName || user?.displayName || "",
            email: userData.email || user?.email || "",
            phone: "",
            location: "",
            joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            }) : ""
          };
          
          setProfile(profileData);
          setEditedProfile(profileData);
        } catch (createError) {
          console.error('Failed to create user profile:', createError);
          const profileData = buildFallbackProfile();
          setProfile(profileData);
          setEditedProfile(profileData);
          toast.error("Failed to load profile data");
        }
      } else {
        const profileData = buildFallbackProfile();
        setProfile(profileData);
        setEditedProfile(profileData);
        toast.error("Failed to load profile data from server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Starting profile update...');
      console.log('Current user:', user);
      console.log('Edited profile:', editedProfile);
      
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Check if user has a valid auth token
      try {
        await user.getIdToken(true); // Force refresh token
        console.log('User token is valid');
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError);
        throw new Error('Authentication session expired. Please log in again.');
      }
      
      console.log('Updating profile with:', {
        displayName: editedProfile.name,
        email: editedProfile.email
      });
      
      const response = await userAPI.updateProfile({
        displayName: editedProfile.name,
        email: editedProfile.email
      });
      
      console.log('Profile update response:', response);
      
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'Network error occurred';
      toast.error(`Failed to update profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const sustainabilityStats = useMemo(() => {
    if (wardrobe.length === 0) {
      return {
        itemsSaved: 0,
        co2Reduced: 0,
        waterSaved: 0,
        sustainabilityScore: 0,
        grade: 'D',
      };
    }

    const scores = wardrobe.map((item) => {
      return calculateSustainabilityScore({
        sustainable: item.sustainable,
        material: item.fabric,
        materials: item.materials,
        tags: item.customTags,
        brand: item.brand,
        sustainabilityScore: item.sustainabilityScore,
        brandEthicsScore: item.brandEthicsScore,
        carbonScore: item.carbonScore,
      });
    });

    const itemsSaved = scores.filter((score) => score >= 60).length;
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const co2Reduced = Math.round(scores.reduce((sum, score) => sum + (score / 100) * 3.3, 0));
    const waterSaved = Math.round(scores.reduce((sum, score) => sum + (score / 100) * 88, 0));

    return {
      itemsSaved,
      co2Reduced,
      waterSaved,
      sustainabilityScore: averageScore,
      grade: getSustainabilityGrade(averageScore),
    };
  }, [wardrobe]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  const orderHistory = [
    {
      id: "ORD-001",
      date: "Nov 15, 2024",
      total: 254,
      status: "Delivered",
      items: 3
    },
    {
      id: "ORD-002",
      date: "Nov 8, 2024",
      total: 189,
      status: "Delivered",
      items: 2
    },
    {
      id: "ORD-003",
      date: "Oct 28, 2024",
      total: 432,
      status: "In Transit",
      items: 5
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">
                {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                 user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription>Member since {profile.joinDate}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="impact" className="flex-1">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={isEditing ? editedProfile.name : profile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedProfile.email : profile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={isEditing ? editedProfile.phone : profile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={isEditing ? editedProfile.location : profile.location}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-medium">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order History
              </CardTitle>
              <CardDescription>View and track your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderHistory.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.id}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.date} • {order.items} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total.toFixed(2)}</p>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Sustainability Impact
              </CardTitle>
              <CardDescription>
                See how your sustainable choices are making a difference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <Heart className="w-5 h-5" />
                    <p className="text-sm">Sustainable Items</p>
                  </div>
                  <p className="text-3xl">{sustainabilityStats.itemsSaved}</p>
                  <p className="text-xs text-muted-foreground">items in your wardrobe</p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Award className="w-5 h-5" />
                    <p className="text-sm">Sustainability Score</p>
                  </div>
                  <p className="text-3xl">{sustainabilityStats.sustainabilityScore}%</p>
                  <p className="text-xs text-muted-foreground">{sustainabilityStats.grade} rating from your current wardrobe</p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">CO₂ Reduced</p>
                  <p className="text-3xl">{sustainabilityStats.co2Reduced} kg</p>
                  <p className="text-xs text-muted-foreground">vs. fast fashion</p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Water Saved</p>
                  <p className="text-3xl">{sustainabilityStats.waterSaved} L</p>
                  <p className="text-xs text-muted-foreground">liters conserved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sustainability Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Eco Warrior</p>
                    <p className="text-sm text-muted-foreground">80% sustainable wardrobe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Conscious Shopper</p>
                    <p className="text-sm text-muted-foreground">10 sustainable purchases</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
