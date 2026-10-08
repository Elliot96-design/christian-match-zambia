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
import AdminGuard from "./components/AdminGuard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginSignup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/setup" component={ProfileSetup} />
      <Route path="/browse" component={Browse} />
      <Route path="/profile/:id" component={ProfileView} />
      <Route path="/chat/:id" component={ChatRoom} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/faith-values" component={FaithProfile} />
      <Route path="/relationship-prefs" component={RelationshipPrefs} />
      <Route path="/chatroom" component={ChatroomPage} />
      <Route path="/admin-portal" component={AdminPortal} />
      <Route path="/admin/finance">{() => <AdminGuard><FinanceAdmin /></AdminGuard>}</Route>
      <Route path="/admin/support">{() => <AdminGuard><SupportAdmin /></AdminGuard>}</Route>
      <Route path="/admin/systems">{() => <AdminGuard><SystemsAdmin /></AdminGuard>}</Route>
      <Route path="/admin/users">{() => <AdminGuard><UserManagementAdmin /></AdminGuard>}</Route>
      <Route path="/admin/announcements">{() => <AdminGuard><AnnouncementsAdmin /></AdminGuard>}</Route>
      <Route path="/admin/roles">{() => <AdminGuard><RolesAdmin /></AdminGuard>}</Route>
      <Route path="/admin/super">{() => <AdminGuard><SuperAdmin /></AdminGuard>}</Route>
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
