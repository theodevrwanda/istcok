import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Shield, Camera, Loader2, CheckCircle, Pencil, X, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { profile, refreshProfile, user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    image: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        image: profile.image || null,
      });
      setImagePreview(profile.image || null);
    }
  }, [profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file exceeds the 10MB limit (10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File Too Large", 
        description: "Image size must be less than 10MB. Please select a smaller photo.", 
        variant: "destructive" 
      });
      e.target.value = ""; // Clear the input
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let updatedSomething = false;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        await api.post("/dashboard/profile/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSelectedFile(null);
        updatedSomething = true;
      }

      const updates: Record<string, string> = {};
      if (form.fullName !== profile?.fullName) updates.fullName = form.fullName;
      if (form.email !== profile?.email) updates.email = form.email;
      if (form.phone !== profile?.phone) updates.phone = form.phone;

      if (Object.keys(updates).length > 0) {
        await api.patch("/dashboard/profile", updates);
        updatedSomething = true;
      }

      if (!updatedSomething) {
        toast({ title: "No Changes", description: "Nothing to update." });
        setSaving(false);
        return;
      }

      await refreshProfile();
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Validate fields, then show confirmation dialog
  const initiatePasswordChange = () => {
    if (!currentPassword) {
      toast({ title: "Required", description: "Enter your current password.", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Invalid", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setShowPasswordConfirm(true);
  };

  // Step 2: After user confirms in dialog, verify current password and update
  const handlePasswordChange = async () => {
    setShowPasswordConfirm(false);
    setSavingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (currentPassword !== "admin123" && currentPassword !== "manager123" && currentPassword !== "staff123") {
        throw new Error("Current password is incorrect. (Hint: default passwords are admin123, manager123, staff123)");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password Updated", description: "Your login password has been changed successfully (Mock)." });
    } catch (err: any) {
      toast({ title: "Password Change Failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    staff: "Staff Member",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Cover & Avatar Header Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/80 via-primary/50 to-primary/80 overflow-hidden rounded-t-xl">
          {/* Abstract texture placeholder */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>

        {/* Info & Avatar Container */}
        <div className="relative px-6 md:px-10 pb-6">
          
          {/* Overlapping Avatar */}
          <div className="absolute -top-12 md:-top-16 left-6 md:left-10 z-10">
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-card bg-muted shadow-md overflow-hidden group">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground text-4xl md:text-5xl font-black">
                  {profile.fullName?.charAt(0) || "?"}
                </div>
              )}
              
              <label className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isEditing ? "opacity-0 group-hover:opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}>
                <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                <input type="file" accept="image/*" disabled={!isEditing} className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Profile Header Info */}
          <div className="pt-14 md:pt-20 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.fullName || "User"}</h1>
            <p className="text-muted-foreground font-medium mt-0.5">
              {roleLabels[profile.role] || profile.role}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            {isEditing ? (
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={() => {
                  setForm({
                    fullName: profile.fullName || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                    image: profile.image || null,
                  });
                  setImagePreview(profile.image || null);
                  setSelectedFile(null);
                  setIsEditing(false);
                }} className="h-9">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="h-9">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="w-full md:w-auto h-9">
                <Pencil className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: About Section (Facebook style info sidebar) */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5 sticky top-20">
            <h2 className="font-bold text-lg text-foreground pb-2 border-b border-border/50">Intro</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-2"><User className="h-3.5 w-3.5" /> Full Name</Label>
                {isEditing ? (
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-9 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{profile.fullName || "Not provided"}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</Label>
                {isEditing ? (
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
                ) : (
                  <p className="text-sm font-medium">{profile.email || "Not provided"}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
                {isEditing ? (
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" placeholder="+250..." />
                ) : (
                  <p className="text-sm font-medium">{profile.phone || "Not provided"}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Account Type</Label>
                {isEditing ? (
                  <Input value={roleLabels[profile.role] || profile.role} disabled className="h-9 text-sm bg-muted/50 cursor-not-allowed" />
                ) : (
                  <p className="text-sm font-medium">{roleLabels[profile.role] || profile.role}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Security/Posts Feed */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="pb-4 mb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg text-foreground">Security Settings</h2>
              </div>
            </div>
            
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Update your login credentials. You must provide your current password for security verification before creating a new one.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-full md:col-span-1">
                  <Label className="text-xs font-semibold">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10"
                    placeholder="Enter current password"
                    autoComplete="off"
                  />
                </div>
                <div className="col-span-full hidden md:block" />
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10"
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button onClick={initiatePasswordChange} disabled={savingPassword} className="gap-2 px-6 h-10 w-full md:w-auto text-xs md:text-sm">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  {savingPassword ? "Verifying & Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirm Password Change</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to change your password? This will update your login credentials immediately. You will need to use the new password on your next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-xs h-8" onClick={(e) => { e.preventDefault(); handlePasswordChange(); }} disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Yes, Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
