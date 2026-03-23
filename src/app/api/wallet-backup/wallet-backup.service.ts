import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Capacitor } from '@capacitor/core';

import { SocialLogin } from '@capgo/capacitor-social-login';

import { WalletsService } from '../wallets/wallets.service';
import { EncryptionService } from '../encryption/encryption.service';

import { Wallet } from 'src/models/wallet.model';

@Injectable({
  providedIn: 'root',
})
export class WalletBackupService {

  private readonly BACKUP_FILE_NAME = 'xterium_backup.json';
  private readonly DRIVE_FOLDER_NAME = 'Xterium';
  private readonly DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
  private readonly DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  private readonly BOUNDARY = 'wallet_backup_boundary';

  constructor(
    private http: HttpClient,
    private walletsService: WalletsService,
    private encryptionService: EncryptionService
  ) { }

  async signInWithGoogle(): Promise<string | null> {
    try {
      const result = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/drive.file',
          ],
        },
      });

      console.log('Full SocialLogin result:', JSON.stringify(result, null, 2));
      return (result.result as any)?.accessToken?.token ?? null;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      return null;
    }
  }

  async backup(backupPin: string): Promise<{ success: boolean; walletCount?: number; error?: string }> {
    const wallets = await this.walletsService.getAllWallets();

    if (!wallets.length) {
      return { success: false, error: 'No wallets found — nothing to back up.' };
    }

    const platform = Capacitor.getPlatform();
    if (platform === 'android') return this.backupToGoogleDrive(wallets, backupPin);

    return { success: false, error: 'Backup is only supported on Android and iOS.' };
  }

  async restore(backupPin: string): Promise<{ success: boolean; wallets?: Wallet[]; error?: string }> {
    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      const wallets = await this.restoreFromGoogleDrive(backupPin);
      if (!wallets) return { success: false, error: 'No backup file found or wrong PIN.' };
      return { success: true, wallets };
    }

    return { success: false, error: 'Restore is only supported on Android and iOS.' };
  }

  private async backupToGoogleDrive(
    wallets: Wallet[],
    backupPin: string
  ): Promise<{ success: boolean; fileId?: string; walletCount?: number; error?: string }> {
    const encryptionKey = await this.encryptionService.hash(backupPin);

    const token = await this.signInWithGoogle();
    if (!token) return { success: false, error: 'Google sign-in did not return an access token.' };

    const json = JSON.stringify(wallets, null, 2);
    const encryptedJson = await this.encryptionService.encrypt(json, encryptionKey);

    const folderId = await this.getOrCreateDriveFolder(token);
    const existingId = await this.findFileInDrive(token, folderId);

    const fileId = existingId
      ? await this.updateDriveFile(token, existingId, encryptedJson)
      : await this.createDriveFile(token, folderId, encryptedJson);

    return { success: true, fileId, walletCount: wallets.length };
  }

  private async restoreFromGoogleDrive(backupPin: string): Promise<Wallet[] | null> {
    const encryptionKey = await this.encryptionService.hash(backupPin);

    const token = await this.signInWithGoogle();
    if (!token) return null;

    const folderId = await this.getOrCreateDriveFolder(token);
    const fileId = await this.findFileInDrive(token, folderId);
    if (!fileId) return null;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const encryptedData = await firstValueFrom(
      this.http.get(
        `${this.DRIVE_FILES_URL}/${fileId}?alt=media`,
        { headers, responseType: 'text' }
      )
    );

    const decryptedJson = await this.encryptionService.decrypt(encryptedData, encryptionKey);
    const wallets: Wallet[] = JSON.parse(decryptedJson);

    return wallets;
  }

  private async getOrCreateDriveFolder(token: string): Promise<string> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const query = `name='${this.DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const search: any = await firstValueFrom(
      this.http.get(
        `${this.DRIVE_FILES_URL}?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers }
      )
    );
    if (search.files?.length > 0) return search.files[0].id;

    const created: any = await firstValueFrom(
      this.http.post(
        this.DRIVE_FILES_URL,
        { name: this.DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
        { headers }
      )
    );
    return created.id;
  }

  private async findFileInDrive(token: string, folderId: string): Promise<string | null> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const query = `name='${this.BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;

    const result: any = await firstValueFrom(
      this.http.get(
        `${this.DRIVE_FILES_URL}?q=${encodeURIComponent(query)}&fields=files(id)`,
        { headers }
      )
    );
    return result.files?.length > 0 ? result.files[0].id : null;
  }

  private async createDriveFile(token: string, folderId: string, content: string): Promise<string> {
    const result: any = await firstValueFrom(
      this.http.post(
        this.DRIVE_UPLOAD_URL,
        this.multipart({ name: this.BACKUP_FILE_NAME, parents: [folderId], mimeType: 'application/json' }, content),
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${this.BOUNDARY}`,
          }),
        }
      )
    );
    return result.id;
  }

  private async updateDriveFile(token: string, fileId: string, content: string): Promise<string> {
    const result: any = await firstValueFrom(
      this.http.patch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        this.multipart({ mimeType: 'application/json' }, content),
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${this.BOUNDARY}`,
          }),
        }
      )
    );
    return result.id;
  }

  private multipart(metadata: object, content: string): string {
    return (
      `--${this.BOUNDARY}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${this.BOUNDARY}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${content}\r\n` +
      `--${this.BOUNDARY}--`
    );
  }
}