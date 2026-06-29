import axios from "axios";
import { HOST_API } from "../config-global";

const axiosInstance = axios.create({
  baseURL: HOST_API,
  withCredentials: true,
});

// Track refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try refreshing token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axiosInstance(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${HOST_API}/refresh-token`, {}, { withCredentials: true });
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only redirect if not already on login/signup page
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(
      (error.response && error.response.data) || "An error occurred"
    );
  }
);

export default axiosInstance;

export const endpoints = {
  login: "/login",
  signup: "/signup",
  logout: "/logout",
  refreshToken: "/refresh-token",
  profileDetails: "/profile-details",
  editProfile: "/edit-profile",
  uploadProfileImage: "/upload-profile-image",
  deleteProfile: "/delete-profile",
  searchUsers: "/users/search",
  // Groups
  groups: "/groups",
  // Expenses
  expenses: "/expenses",
  // Direct Expenses (Friends)
  directExpenses: "/direct-expenses",
  directBalances: "/direct-expenses/balances",
  directSettle: "/direct-expenses/settle",
  // Balances
  balancesOverall: "/balances/overall",
  // Stats
  spendingStats: "/stats/spending",
  // Settlements
  settlements: "/settlements",
  // Invitations
  invitations: "/invitations",
  myInvitations: "/invitations/mine",
  // Google
  googleContacts: "/auth/google/contacts",
};
