import { Injectable } from '@angular/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

@Injectable({
  providedIn: 'root',
})
export class BiometricService {
  private readonly SERVER_ID = 'xterium.wallet';

  constructor() {}

  async isBiometricAvailable(): Promise<{ available: boolean; type?: string }> {
    try {
      const result = await NativeBiometric.isAvailable();

      return {
        available: result.isAvailable,
        type: this.biometryTypeToString(result.biometryType),
      };
    } catch (error) {
      return { available: false };
    }
  }

  async verifyIdentity(): Promise<boolean> {
    try {
      const available = await this.isBiometricAvailable();
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
    } catch (error: any) {
      return false;
    }
  }

  async promptEnableBiometric(): Promise<boolean> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available.available) return false;

      const enable = confirm(
        'Do you want to enable biometric login for future logins?'
      );
      return enable;
    } catch (error) {
      return false;
    }
  }

  async generateBiometricKey(): Promise<string> {
    try {
      const verified = await this.verifyIdentity();
      if (!verified) throw new Error('Biometric verification failed.');

      const randomKey = btoa(
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => String.fromCharCode(b))
          .join('')
      );

      await this.storeCredentials(randomKey);

      return randomKey;
    } catch (error) {
      throw error;
    }
  }

  async storeCredentials(password: string): Promise<void> {
    try {
      await NativeBiometric.setCredentials({
        username: 'user',
        password,
        server: this.SERVER_ID,
      });
    } catch (error) {
      throw error;
    }
  }

  async getCredentials(): Promise<{ password: string }> {
    try {
      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_ID,
      });
      return { password: credentials.password };
    } catch (error) {
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

  private biometryTypeToString(biometryType: BiometryType): string {
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
}
