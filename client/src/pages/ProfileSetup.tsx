import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Camera, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Chipata", "Kasama", "Solwezi",
  "Mongu", "Mansa", "Choma", "Mazabuka", "Kafue", "Other"
];

export default function ProfileSetup() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [location, setLocation] = useState("");
  const [church, setChurch] = useState("");
  const [bio, setBio] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const uploadPhoto = trpc.profile.uploadPhoto.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
    if (!loading && isAuthenticated && user?.profileComplete) navigate("/browse");
    if (user?.name) setName(user.name);
  }, [loading, isAuthenticated, user, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setPhotoData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
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
      if (photoData) {
        await uploadPhoto.mutateAsync(photoData);
      }
      toast.success("Profile created!");
      navigate("/browse");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <img src={LOGO_URL} alt="Christian Match Zambia" className="w-9 h-9 rounded-xl object-cover shadow-sm flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">Set Up Your Profile</p>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </div>
        <button
          onClick={async () => { await logout(); navigate("/"); }}
          aria-label="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:bg-muted/70"
        >
          <LogOut className="w-4 h-4 text-destructive" />
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      <div className="container py-6 flex-1">
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
              <p className="text-muted-foreground text-sm mt-1">Tell others about yourself</p>
            </div>

            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center overflow-hidden"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-primary mb-1" />
                    <span className="text-xs text-primary">Add Photo</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <p className="text-xs text-muted-foreground">Optional · Max 2MB</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                  min={18}
                  max={100}
                  className="mt-1 h-12 text-base"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Gender *</Label>
                <div className="flex gap-3 mt-2">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 h-12 rounded-xl border-2 font-medium text-sm capitalize transition-colors ${
                        gender === g
                          ? "border-primary bg-primary text-white"
                          : "border-border text-foreground bg-white"
                      }`}
                    >
                      {g === "male" ? "👨 Male" : "👩 Female"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base rounded-xl"
              onClick={() => {
                if (!name || !age || !gender) {
                  toast.error("Please fill name, age, and gender");
                  return;
                }
                setStep(2);
              }}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Faith & Location</h2>
              <p className="text-muted-foreground text-sm mt-1">Help others find you</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Location *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {ZAMBIA_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocation(loc)}
                      className={`h-10 rounded-lg border text-xs font-medium transition-colors ${
                        location === loc
                          ? "border-primary bg-primary text-white"
                          : "border-border text-foreground bg-white"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="church" className="text-sm font-medium">Church / Denomination *</Label>
                <Input
                  id="church"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                  placeholder="e.g. UCZA, Bread of Life, UCZ"
                  className="mt-1 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a little about yourself, your faith journey, what you're looking for..."
                  className="mt-1 text-base resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1 h-12 text-base rounded-xl"
                onClick={handleSubmit}
                disabled={updateProfile.isPending || uploadPhoto.isPending}
              >
                {(updateProfile.isPending || uploadPhoto.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
