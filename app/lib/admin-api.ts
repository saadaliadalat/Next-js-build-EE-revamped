import { supabase } from './supabase';

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function fetchAdminData(endpoint: string) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function updateAdminData(endpoint: string, data: any) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function createAdminData(endpoint: string, data: any) {
  const token = await getAuthToken();
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}