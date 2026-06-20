import { apiRequest, API_BASE_URL } from "./api-client";

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
  marriageImageUrl?: string | null;
  engagementImageUrl?: string | null;
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

export async function uploadEventImage(
  eventId: string,
  eventType: string,
  uri: string,
  token: string
): Promise<{ data: PlanDetailsResponse | null; error: string | null }> {
  try {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "upload.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("eventType", eventType);
    
    // React Native FormData format:
    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { data: null, error: errData.message || "Upload failed." };
    }

    const data: PlanDetailsResponse = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || "Upload failed." };
  }
}
