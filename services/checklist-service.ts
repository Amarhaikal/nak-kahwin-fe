import { apiRequest } from "./api-client";

export interface ChecklistItem {
  id: string;
  groupId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistGroup {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
}

export interface CreateGroupPayload {
  name: string;
}

export interface CreateItemPayload {
  groupId: string;
  title: string;
}

export interface UpdateItemPayload {
  title?: string;
  isCompleted?: boolean;
  groupId?: string;
}

export async function getChecklist(token: string) {
  return apiRequest<ChecklistGroup[]>("/api/checklist", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createGroup(payload: CreateGroupPayload, token: string) {
  return apiRequest<ChecklistGroup>("/api/checklist/groups", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateGroup(groupId: string, payload: CreateGroupPayload, token: string) {
  return apiRequest<ChecklistGroup>(`/api/checklist/groups/${groupId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(groupId: string, token: string) {
  return apiRequest<{ message: string }>(`/api/checklist/groups/${groupId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function reorderGroups(groupIds: string[], token: string) {
  return apiRequest<{ message: string }>("/api/checklist/groups/reorder", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupIds }),
  });
}

export async function createChecklistItem(payload: CreateItemPayload, token: string) {
  return apiRequest<ChecklistItem>("/api/checklist/items", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateChecklistItem(itemId: string, payload: UpdateItemPayload, token: string) {
  return apiRequest<ChecklistItem>(`/api/checklist/items/${itemId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteChecklistItem(itemId: string, token: string) {
  return apiRequest<{ message: string }>(`/api/checklist/items/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function reorderChecklistItems(groupId: string, itemIds: string[], token: string) {
  return apiRequest<{ message: string }>("/api/checklist/items/reorder", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ groupId, itemIds }),
  });
}
