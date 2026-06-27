import { apiRequest } from "./api-client";

export interface SavingEntry {
  id: string;
  eventId: string;
  userId: string;
  contributorName: string;
  contributorRole: "groom" | "bride";
  month: string;
  amount: number;
  position: number;
  createdAt: string;
}

export interface CreateSavingEntryPayload {
  month: string;
  amount: number;
}

export async function getSavings(token: string, filter?: string | null, limit?: number) {
  let url = "/api/savings";
  const params: string[] = [];
  if (filter && filter !== 'null') {
    params.push(`filter=${encodeURIComponent(filter)}`);
  }
  if (limit !== undefined && limit !== null) {
    params.push(`limit=${limit}`);
  }
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  return apiRequest<SavingEntry[]>(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function addSaving(payload: CreateSavingEntryPayload, token: string) {
  return apiRequest<SavingEntry>("/api/savings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteSaving(savingId: string, token: string) {
  return apiRequest<{ message: string }>(`/api/savings/${savingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function reorderSavings(orderedIds: string[], token: string) {
  return apiRequest<{ message: string }>("/api/savings/reorder", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderedIds),
  });
}
