import { apiRequest } from "./api-client";

export interface PlanDetailsResponse {
  id: string;
  title: string;
  isEngagementEnabled: boolean;
  ownerName: string;
  partnerName: string | null;
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
