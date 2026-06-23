import { useState, useCallback } from "react";

const PIN_HASH_KEY = "kmt_pin_hash";
const ENCRYPTED_EMAIL_KEY = "kmt_enc_email";
const ENCRYPTED_PASS_KEY = "kmt_enc_pass";
const BIOMETRIC_ENABLED_KEY = "kmt_biometric_enabled";

// Simple XOR-based obfuscation with PIN (not military-grade, but reasonable for local storage)
function xorEncrypt(text: string, pin: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ pin.charCodeAt(i % pin.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded: string, pin: string): string {
  const text = atob(encoded);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ pin.charCodeAt(i % pin.length));
  }
  return result;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "kmt_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isPinSetup(): boolean {
  return !!localStorage.getItem(PIN_HASH_KEY);
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
}

export function hasStoredCredentials(): boolean {
  return !!localStorage.getItem(ENCRYPTED_EMAIL_KEY) && !!localStorage.getItem(ENCRYPTED_PASS_KEY);
}

export function clearBiometricData() {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(ENCRYPTED_EMAIL_KEY);
  localStorage.removeItem(ENCRYPTED_PASS_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
}

export async function checkBiometricAvailability(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

export function useBiometricAuth() {
  const [loading, setLoading] = useState(false);

  const setupPin = useCallback(async (pin: string, email: string, password: string, enableBiometric: boolean) => {
    const pinHash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, pinHash);
    localStorage.setItem(ENCRYPTED_EMAIL_KEY, xorEncrypt(email, pin));
    localStorage.setItem(ENCRYPTED_PASS_KEY, xorEncrypt(password, pin));
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, enableBiometric ? "true" : "false");
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<{ email: string; password: string } | null> => {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) return null;

    const pinHash = await hashPin(pin);
    if (pinHash !== storedHash) return null;

    const encEmail = localStorage.getItem(ENCRYPTED_EMAIL_KEY);
    const encPass = localStorage.getItem(ENCRYPTED_PASS_KEY);
    if (!encEmail || !encPass) return null;

    return {
      email: xorDecrypt(encEmail, pin),
      password: xorDecrypt(encPass, pin),
    };
  }, []);

  const triggerBiometric = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      // Use WebAuthn to verify the user's identity via device biometrics
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      // Try to create a credential for biometric verification
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Kailash Mahadev Temple" },
          user: {
            id: new Uint8Array(16),
            name: "devotee",
            displayName: "Devotee",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      return !!credential;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { setupPin, verifyPin, triggerBiometric, loading };
}
