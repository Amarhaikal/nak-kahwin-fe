import { apiRequest } from "./api-client";

export interface SavingEntry {
  id: string;
  eventId: string;
  userId: string;
  contributorName: string;
  contributorRole: "groom" | "bride";
  month: string;
  amount: number;
  createdAt: string;
}

export interface CreateSavingEntryPayload {
  month: string;
  amount: number;
}

export async function getSavings(token: string, filter?: string | null) {
  const url = (filter && filter !== 'null') ? `/api/savings?filter=${encodeURIComponent(filter)}` : "/api/savings";
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
