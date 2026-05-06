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
import AdminPortal from "./pages/AdminPortal";
import FinanceAdmin from "./pages/admin/FinanceAdmin";
import SupportAdmin from "./pages/admin/SupportAdmin";
import SystemsAdmin from "./pages/admin/SystemsAdmin";
import UserManagementAdmin from "./pages/admin/UserManagementAdmin";
import AnnouncementsAdmin from "./pages/admin/AnnouncementsAdmin";
import RolesAdmin from "./pages/admin/RolesAdmin";
import SuperAdmin from "./pages/admin/SuperAdmin";

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
      <Route path="/admin-portal" component={AdminPortal} />
      <Route path="/admin/finance" component={FinanceAdmin} />
      <Route path="/admin/support" component={SupportAdmin} />
      <Route path="/admin/systems" component={SystemsAdmin} />
      <Route path="/admin/users" component={UserManagementAdmin} />
      <Route path="/admin/announcements" component={AnnouncementsAdmin} />
      <Route path="/admin/roles" component={RolesAdmin} />
      <Route path="/admin/super" component={SuperAdmin} />
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
