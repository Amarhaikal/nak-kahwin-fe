import { apiRequest } from "./api-client";

export interface PlanDetailsResponse {
  id: string;
  title: string;
  isEngagementEnabled: boolean;
  ownerName: string;
  partnerName: string | null;
  marriageVenue?: string | null;
  marriageDate?: string | null;
  engagementVenue?: string | null;
  engagementDate?: string | null;
}

export interface CreatePlanPayload {
  title: string;
  weddingDate: string | null; // Format: "YYYY-MM-DD"
  isEngagementEnabled: boolean;
  engagementDate: string | null; // Format: "YYYY-MM-DD"
}

export async function getMyPlan(accessToken: string) {
  return apiRequest<PlanDetailsResponse>("/api/events/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createPlan(payload: CreatePlanPayload, accessToken: string) {
  const mappedPayload = {
    title: payload.title,
    marriageDate: payload.weddingDate,
    isEngagementEnabled: payload.isEngagementEnabled,
    engagementDate: payload.engagementDate,
  };

  return apiRequest<PlanDetailsResponse>("/api/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(mappedPayload),
  });
}

export interface UpdateEventPayload {
  title?: string;
  isEngagementEnabled?: boolean;
  marriageVenue?: string;
  marriageDate?: string | null; // Format: "YYYY-MM-DD"
  engagementVenue?: string;
  engagementDate?: string | null; // Format: "YYYY-MM-DD"
}

export async function updateEvent(id: string, payload: UpdateEventPayload, accessToken: string) {
  return apiRequest<PlanDetailsResponse>(`/api/events/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}
