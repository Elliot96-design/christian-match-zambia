import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Camera, Loader2, LogOut, User } from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Chipata", "Kasama", "Solwezi",
  "Mongu", "Mansa", "Choma", "Mazabuka", "Kafue", "Other"
];

export default function EditProfile() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [location, setLocation] = useState("");
  const [church, setChurch] = useState("");
  const [bio, setBio] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<{ base64: string; mimeType: string } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
    if (user) {
      setName(user.name ?? "");
      setAge(user.age?.toString() ?? "");
      setGender((user.gender as "male" | "female") ?? "");
      setLocation(user.location ?? "");
      setChurch(user.church ?? "");
      setBio(user.bio ?? "");
      setPhotoPreview(user.photoUrl ?? null);
    }
  }, [loading, isAuthenticated, user, navigate]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const uploadPhoto = trpc.profile.uploadPhoto.useMutation();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setPhotoData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name || !age || !gender || !location || !church) {
      toast.error("Please fill in all required fields");
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      toast.error("Age must be between 18 and 100");
      return;
    }
    try {
      await updateProfile.mutateAsync({ name, age: ageNum, gender, location, church, bio });
      if (photoData) await uploadPhoto.mutateAsync(photoData);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[480px] mx-auto">
      {/* Header */}
      <header className="hero-gradient px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate("/browse")} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <img src={LOGO_URL} alt="" className="w-8 h-8 rounded-lg object-cover opacity-90" />
        <p className="font-display font-bold text-white text-base flex-1">Edit Profile</p>
        <button
          onClick={handleLogout}
          className="text-white/60 text-xs font-medium"
        >
          Sign Out
        </button>
      </header>

      <div className="container py-6 space-y-5">
        {/* Photo */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-primary/40 bg-primary/5 overflow-hidden flex items-center justify-center relative"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary/30" />
            )}
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <p className="text-xs text-muted-foreground">Tap to change photo · Max 2MB</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="mt-1 h-12 text-base" />
          </div>
          <div>
            <Label className="text-sm font-medium">Age *</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 25" min={18} max={100} className="mt-1 h-12 text-base" />
          </div>
          <div>
            <Label className="text-sm font-medium">Gender *</Label>
            <div className="flex gap-3 mt-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 h-12 rounded-xl border-2 font-medium text-sm capitalize transition-colors ${
                    gender === g ? "border-primary bg-primary text-white" : "border-border text-foreground bg-white"
                  }`}
                >
                  {g === "male" ? "👨 Male" : "👩 Female"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Location *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {ZAMBIA_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`h-10 rounded-lg border text-xs font-medium transition-colors ${
                    location === loc ? "border-primary bg-primary text-white" : "border-border text-foreground bg-white"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Church / Denomination *</Label>
            <Input value={church} onChange={(e) => setChurch(e.target.value)} placeholder="e.g. UCZA, Bread of Life" className="mt-1 h-12 text-base" />
          </div>
          <div>
            <Label className="text-sm font-medium">Short Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." className="mt-1 text-base resize-none" rows={4} maxLength={500} />
            <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/500</p>
          </div>
        </div>

        <Button
          className="w-full h-12 text-base rounded-xl"
          onClick={handleSave}
          disabled={updateProfile.isPending || uploadPhoto.isPending}
        >
          {(updateProfile.isPending || uploadPhoto.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}
