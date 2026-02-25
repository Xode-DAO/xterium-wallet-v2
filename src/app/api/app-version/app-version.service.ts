import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppVersionService {
  private readonly githubUrl = 'https://api.github.com/repos/Xode-DAO/xterium-wallet-v2/tags';

  constructor(
    private http: HttpClient
  ) { }

  async getLatestVersion() {
     return this.http.get<any[]>(this.githubUrl);
  }

}
