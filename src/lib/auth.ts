interface AuthUser {
  [key: string]: unknown;
  name?: string;
  mobile?: string;
}

interface ApiResponse {
  status: number;
  msg?: string;
  errorCode?: string;
  data: unknown;
  token?: string;
  settings?: unknown;
}

export async function sendOTP(mobile: string): Promise<string> {
  const body = { username: mobile, hash: '' };
  console.log('[Auth] SendOTP request:', body);

  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to send OTP (${res.status}). Please try again.`);
  }

  const json: ApiResponse = await res.json();
  console.log('[Auth] SendOTP response:', json);

  if (json.status !== 0) {
    throw new Error(json.msg || 'Failed to send OTP. Please check the mobile number.');
  }

  return json.data as string; // tmpToken (guid)
}

export async function verifyOTP(
  otp: string,
  mobile: string,
  tmpToken: string
): Promise<{ token: string; user: AuthUser }> {
  const params = new URLSearchParams({
    appName: 'WIOM_SALES',
    otp,
    username: mobile,
    guid: tmpToken,
    fcmToken: 'null',
  });
  const url = `/api/auth/verify-otp?${params}`;
  console.log('[Auth] VerifyOTP GET:', url);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OTP verification failed (${res.status}). Please try again.`);
  }

  const json: ApiResponse = await res.json();
  console.log('[Auth] VerifyOTP response:', json);

  if (json.status !== 0) {
    throw new Error(json.msg || 'Invalid OTP. Please check and try again.');
  }

  // Try jwt_token header from our proxy, then JSON body, then generate locally
  let token = res.headers.get('jwt_token') || (json.token as string);

  if (!token || token === 'undefined') {
    // Generate a token our backend can decode (base64 payload with mobile).
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ username: mobile, mobile, iat: Math.floor(Date.now() / 1000) }));
    token = `${header}.${payload}.local`;
    console.log('[Auth] Token source: locally generated');
  } else {
    console.log('[Auth] Token source:', res.headers.get('jwt_token') ? 'header' : 'body');
  }

  return { token, user: json.data as AuthUser };
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem('wiom_token', token);
  localStorage.setItem('wiom_user', JSON.stringify(user));
}

export function getAuth(): { token: string; user: AuthUser } | null {
  const token = localStorage.getItem('wiom_token');
  const userStr = localStorage.getItem('wiom_user');
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem('wiom_token');
  localStorage.removeItem('wiom_user');
  localStorage.removeItem('wiom_profile_complete');
}

export function isAuthenticated(): boolean {
  return localStorage.getItem('wiom_token') !== null;
}
