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
import ChatroomPage from "./pages/CommunityRoom";
import AdminPanel from "./pages/AdminPanel";
import EditProfile from "./pages/EditProfile";
import LoginSignup from "./pages/LoginSignup";
import FaithProfile from "./pages/FaithProfile";
import RelationshipPrefs from "./pages/RelationshipPrefs";
import { Redirect } from "wouter";

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
      <Route path="/faith-values" component={FaithProfile} />
      <Route path="/relationship-prefs" component={RelationshipPrefs} />
      <Route path="/chatroom" component={ChatroomPage} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/notifications">{() => <Redirect to="/browse?tab=notifications" />}</Route>
      <Route path="/messages">{() => <Redirect to="/browse?tab=messages" />}</Route>
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
