"use client";

import type { ServiceItem, ServiceVariant, BookingStatus, SiteSettings, BranchItem } from "./types";

export async function adminLogin(pin: string): Promise<boolean> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return res.ok;
}

export async function adminFetchServices(pin: string): Promise<ServiceItem[]> {
  const res = await fetch("/api/admin/services", {
    headers: { "x-admin-pin": pin },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.services ?? [];
}

export async function adminUpdateService(
  pin: string,
  id: string,
  patch: Partial<ServiceItem>
): Promise<boolean> {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export async function adminCreateService(
  pin: string,
  body: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function adminDeleteService(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/services/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

// ===== Variants =====
export async function adminCreateVariant(
  pin: string,
  body: { serviceId: string; name: string; nameAr?: string; price: number; duration?: number }
): Promise<ServiceVariant | null> {
  const res = await fetch("/api/admin/variants", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.variant ?? null;
}

export async function adminUpdateVariant(
  pin: string,
  id: string,
  patch: Partial<ServiceVariant>
): Promise<boolean> {
  const res = await fetch(`/api/admin/variants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export async function adminDeleteVariant(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/variants/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

// ===== Customers =====
export async function adminFetchCustomers(pin: string, q?: string): Promise<unknown[]> {
  const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : "/api/admin/customers";
  const res = await fetch(url, { headers: { "x-admin-pin": pin } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.customers ?? [];
}

export async function adminDeleteCustomer(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/customers?id=${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

export async function adminFetchBookings(
  pin: string,
  status?: string
): Promise<unknown[]> {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(`/api/admin/bookings${q}`, {
    headers: { "x-admin-pin": pin },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.bookings ?? [];
}

export async function adminUpdateBookingStatus(
  pin: string,
  id: string,
  status: BookingStatus
): Promise<boolean> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

export async function adminUpdateBookingExpiry(
  pin: string,
  id: string,
  expiryDate: string | null
): Promise<boolean> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify({ expiryDate }),
  });
  return res.ok;
}

export async function adminUpdateBookingNote(
  pin: string,
  id: string,
  adminNote: string | null
): Promise<boolean> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify({ adminNote }),
  });
  return res.ok;
}

// ===== Branches =====
export async function adminFetchBranches(pin: string): Promise<BranchItem[]> {
  const res = await fetch("/api/admin/branches", {
    headers: { "x-admin-pin": pin },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.branches ?? [];
}

export async function adminCreateBranch(
  pin: string,
  body: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch("/api/admin/branches", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function adminUpdateBranch(
  pin: string,
  id: string,
  patch: Partial<BranchItem>
): Promise<boolean> {
  const res = await fetch(`/api/admin/branches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export async function adminDeleteBranch(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/branches/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

export async function adminDeleteBooking(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

export async function adminUpdateSettings(
  pin: string,
  patch: Partial<SiteSettings>
): Promise<boolean> {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

// ===== Offers =====
export async function adminFetchOffers(pin: string): Promise<unknown[]> {
  const res = await fetch("/api/admin/offers", { headers: { "x-admin-pin": pin } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.offers ?? [];
}

export async function adminCreateOffer(pin: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch("/api/admin/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function adminUpdateOffer(pin: string, id: string, patch: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/admin/offers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export async function adminDeleteOffer(pin: string, id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/offers/${id}`, {
    method: "DELETE",
    headers: { "x-admin-pin": pin },
  });
  return res.ok;
}

// ===== Reports =====
export async function adminFetchReport(
  pin: string,
  type: "daily" | "monthly" | "financial",
  params?: { date?: string; month?: string }
): Promise<unknown> {
  const q = new URLSearchParams({ type });
  if (params?.date) q.set("date", params.date);
  if (params?.month) q.set("month", params.month);
  const res = await fetch(`/api/admin/report?${q}`, { headers: { "x-admin-pin": pin } });
  if (!res.ok) return null;
  return res.json();
}
