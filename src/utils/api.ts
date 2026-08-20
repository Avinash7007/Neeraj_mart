import { auth } from "../firebase";

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_session_token") : null;
  const customerToken = typeof window !== "undefined" ? localStorage.getItem("customer_session_token") : null;

  if (adminToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${adminToken}`);
  } else if (customerToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${customerToken}`);
  } else if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (e) {
      console.warn("Failed to get ID token", e);
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}

