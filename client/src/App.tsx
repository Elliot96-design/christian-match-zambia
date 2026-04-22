import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProfileSetup from "./pages/ProfileSetup";
import Browse from "./pages/Browse";
import ProfileView from "./pages/ProfileView";
import ChatRoom from "./pages/ChatRoom";
import AdminPanel from "./pages/AdminPanel";
import EditProfile from "./pages/EditProfile";
import LoginSignup from "./pages/LoginSignup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginSignup} />
      <Route path="/setup" component={ProfileSetup} />
      <Route path="/browse" component={Browse} />
      <Route path="/profile/:id" component={ProfileView} />
      <Route path="/chat/:id" component={ChatRoom} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
