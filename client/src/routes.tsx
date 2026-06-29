import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./components/Dashboard";
import ProtectedRoutes from "./ProtectedRoutes";
import Profile from "./components/Profile";
import EditUserProfile from "./components/EditProfile";
import Groups from "./components/Groups";
import GroupDetail from "./components/GroupDetail";
import AcceptInvite from "./components/AcceptInvite";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
  {
    // Public route for invitation acceptance
    path: "invite/:token",
    element: <AcceptInvite />,
  },
  {
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "account", element: <Profile /> },
      { path: "edit-profile", element: <EditUserProfile /> },
      { path: "groups", element: <Groups /> },
      { path: "groups/:groupId", element: <GroupDetail /> },
    ],
  },
]);
