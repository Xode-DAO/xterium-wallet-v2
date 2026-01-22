import { Injectable } from '@angular/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class BiometricService {
  private readonly ENABLE_BIOMETRIC_STORAGE_KEY = 'enable_biometric';
  private readonly SERVER_ID = 'xterium.wallet';

  private biometricTypeToString(biometryType: BiometryType): string {
    switch (biometryType) {
      case BiometryType.FACE_ID:
        return 'faceId';
      case BiometryType.FACE_AUTHENTICATION:
        return 'faceAuthentication';
      case BiometryType.FINGERPRINT:
        return 'fingerprint';
      case BiometryType.MULTIPLE:
        return 'multiple';
      case BiometryType.NONE:
        return 'none';
      default:
        return 'unknown';
    }
  }

  async isAvailable(): Promise<{ available: boolean; type?: string }> {
    try {
      const result = await NativeBiometric.isAvailable();

      return {
        available: result.isAvailable,
        type: this.biometricTypeToString(result.biometryType),
      };
    } catch (error) {
      console.error('Biometric availability check error:', error);
      return { available: false };
    }
  }

  async verifyIdentity(): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available.available) {
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: 'Confirm your identity',
        title: 'Biometric Authentication',
        subtitle: 'Use your biometric to continue',
        maxAttempts: 3,
      });

      return true;
    } catch (error) {
      console.error('Biometric verification error:', error);
      return false;
    }
  }

  async setCredentials(): Promise<void> {
    try {
      const verified = await this.verifyIdentity();
      if (!verified) throw new Error('Biometric verification failed.');

      const randomKey = btoa(
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => String.fromCharCode(b))
          .join('')
      );

      await NativeBiometric.setCredentials({
        username: "xterium",
        password: randomKey,
        server: this.SERVER_ID,
      });
    } catch (error) {
      console.error('Biometric credential setting error:', error);
      throw error;
    }
  }

  async getCredentials(): Promise<{ username: string; password: string }> {
    try {
      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_ID,
      });

      return {
        username: credentials.username,
        password: credentials.password
      };
    } catch (error) {
      console.error('Biometric credential setting error:', error);
      throw error;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({
        server: this.SERVER_ID,
      });
    } catch (error) {
      throw error;
    }
  }

  async enableBiometric(): Promise<void> {
    await Preferences.set({
      key: this.ENABLE_BIOMETRIC_STORAGE_KEY,
      value: "true"
    });
  }

  async disableBiometric(): Promise<void> {
    await Preferences.set({
      key: this.ENABLE_BIOMETRIC_STORAGE_KEY,
      value: "false"
    });
  }

  async isBiometricEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: this.ENABLE_BIOMETRIC_STORAGE_KEY });
    return value === "true";
  }
}
