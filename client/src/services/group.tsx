import axiosInstance, { endpoints } from "../utils/axios";

export const groupService = {
  getGroups: () =>
    axiosInstance.get(endpoints.groups).then((res) => res.data),

  getGroupById: (groupId: string) =>
    axiosInstance.get(`${endpoints.groups}/${groupId}`).then((res) => res.data),

  createGroup: (data: { name: string; description?: string; category?: string; memberEmails?: string[] }) =>
    axiosInstance.post(endpoints.groups, data).then((res) => res.data),

  updateGroup: (groupId: string, data: { name?: string; description?: string; category?: string }) =>
    axiosInstance.patch(`${endpoints.groups}/${groupId}`, data).then((res) => res.data),

  deleteGroup: (groupId: string) =>
    axiosInstance.delete(`${endpoints.groups}/${groupId}`).then((res) => res.data),

  addMember: (groupId: string, email: string) =>
    axiosInstance.post(`${endpoints.groups}/${groupId}/members`, { email }).then((res) => res.data),

  removeMember: (groupId: string, memberId: string) =>
    axiosInstance.delete(`${endpoints.groups}/${groupId}/members/${memberId}`).then((res) => res.data),
};
