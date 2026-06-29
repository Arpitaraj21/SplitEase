import axiosInstance, { endpoints } from "../utils/axios";

export const userService = {
  loginservice: (data: { identifier: string; password: string }) =>
    axiosInstance.post(endpoints.login, data).then((res) => res.data),

  signupservice: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => axiosInstance.post(endpoints.signup, data).then((res) => res.data),

  logoutservice: () =>
    axiosInstance.post(endpoints.logout).then((res) => res.data),

  getProfileservice: () =>
    axiosInstance.get(endpoints.profileDetails).then((res) => res.data),

  editProfileservice: (data: Record<string, any>) =>
    axiosInstance.patch(endpoints.editProfile, data).then((res) => res.data),

  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("profileImage", file);
    return axiosInstance
      .post(endpoints.uploadProfileImage, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  searchUsers: (query: string) =>
    axiosInstance.get(`${endpoints.searchUsers}?q=${encodeURIComponent(query)}`).then((res) => res.data),

  deleteProfileservice: () =>
    axiosInstance.delete(endpoints.deleteProfile).then((res) => res.data),
};
