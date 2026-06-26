import { apiRequest } from "./api-client";

export interface SavingsContribution {
  id: string;
  goalId: string;
  contributorId: string;
  contributorName: string;
  contributorRole: "groom" | "bride";
  amount: number;
  contributedAt: string;
}

export interface SavingsGoal {
  id: string;
  eventId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  updatedAt: string;
  contributions: SavingsContribution[];
}

export interface CreateSavingsGoalPayload {
  title: string;
  targetAmount: number;
}

export interface UpdateSavingsGoalPayload {
  title: string;
  targetAmount: number;
}

export interface CreateContributionPayload {
  amount: number;
}

export async function getSavings(token: string) {
  return apiRequest<SavingsGoal[]>("/api/savings", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createSavingsGoal(payload: CreateSavingsGoalPayload, token: string) {
  return apiRequest<SavingsGoal>("/api/savings/goals", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateSavingsGoal(goalId: string, payload: UpdateSavingsGoalPayload, token: string) {
  return apiRequest<SavingsGoal>(`/api/savings/goals/${goalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteSavingsGoal(goalId: string, token: string) {
  return apiRequest<{ message: string }>(`/api/savings/goals/${goalId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createContribution(goalId: string, payload: CreateContributionPayload, token: string) {
  return apiRequest<SavingsContribution>(`/api/savings/goals/${goalId}/contributions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteContribution(contributionId: string, token: string) {
  return apiRequest<{ message: string }>(`/api/savings/contributions/${contributionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
