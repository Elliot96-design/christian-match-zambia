import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Heart, Users, MessageCircle, Shield } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (!user.profileComplete) {
        navigate("/setup");
      } else {
        navigate("/browse");
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-semibold text-foreground text-sm">Christian Match Zambia</span>
        </div>
        <a href={getLoginUrl()}>
          <Button size="sm" variant="outline" className="text-primary border-primary">
            Sign In
          </Button>
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="container py-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-primary fill-primary/20" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Find Your God-Given Partner
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm mx-auto">
            Connect with fellow Christians in Zambia who share your faith, values, and vision for life.
          </p>
          <a href={getLoginUrl()} className="block">
            <Button size="lg" className="w-full max-w-xs mx-auto text-base h-12 rounded-xl">
              Get Started — It's Free
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Join thousands of Christians finding love in Zambia
          </p>
        </section>

        {/* Features */}
        <section className="container pb-8">
          <div className="space-y-4">
            <FeatureCard
              icon={<Users className="w-5 h-5 text-primary" />}
              title="Browse Profiles"
              desc="Explore profiles of Christians from churches across Zambia. Filter by gender and location."
            />
            <FeatureCard
              icon={<MessageCircle className="w-5 h-5 text-primary" />}
              title="Private Chat"
              desc="Unlock private conversations with a one-time K10 payment. Chat stays open forever."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5 text-primary" />}
              title="Safe & Trusted"
              desc="Verified profiles, admin moderation, and secure payments via MTN or Airtel Money."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="bg-secondary/50 py-8">
          <div className="container">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">How It Works</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Create Your Profile", desc: "Sign up and complete your profile with your photo, church, and bio." },
                { step: "2", title: "Browse & Connect", desc: "Browse profiles of Christians near you and find someone special." },
                { step: "3", title: "Unlock & Chat", desc: "Pay K10 once to unlock private chat with someone you like." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">{item.step}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section className="container py-10 text-center">
          <p className="text-foreground font-semibold text-lg mb-4">
            Ready to find your match?
          </p>
          <a href={getLoginUrl()} className="block">
            <Button size="lg" className="w-full max-w-xs mx-auto h-12 rounded-xl text-base">
              Join Christian Match Zambia
            </Button>
          </a>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Christian Match Zambia · Built with faith and love
          </p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start bg-card border border-border rounded-xl p-4">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
