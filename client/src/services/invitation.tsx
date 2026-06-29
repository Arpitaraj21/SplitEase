import axiosInstance, { endpoints } from "../utils/axios";

export const invitationService = {
  sendInvitation: (data: { groupId: string; email?: string; phone?: string; method: string }) =>
    axiosInstance.post(endpoints.invitations, data).then((res) => res.data),

  getMyInvitations: () =>
    axiosInstance.get(endpoints.myInvitations).then((res) => res.data),

  getInvitationByToken: (token: string) =>
    axiosInstance.get(`${endpoints.invitations}/${token}`).then((res) => res.data),

  acceptInvitation: (token: string) =>
    axiosInstance.post(`${endpoints.invitations}/${token}/accept`).then((res) => res.data),

  declineInvitation: (token: string) =>
    axiosInstance.post(`${endpoints.invitations}/${token}/decline`).then((res) => res.data),

  getGoogleContacts: () =>
    axiosInstance.get(endpoints.googleContacts).then((res) => res.data),
};
