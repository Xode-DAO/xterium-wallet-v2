import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Token } from 'src/models/token.model';

@Injectable({
  providedIn: 'root'
})
export class TokensService {

  constructor(
    private http: HttpClient
  ) { }

  private assetPath = 'assets/images/tokens/';

  private tokenImagesSubject = new BehaviorSubject<Token[]>([]);
  public tokenImagesObservable = this.tokenImagesSubject.asObservable();

  async imageExists(path: string): Promise<boolean> {
    const baseUrl = `${window.location.protocol}//${window.location.host}/`;
    const url = baseUrl + path;

    return firstValueFrom(
      this.http.get(url, { responseType: 'arraybuffer', observe: 'response' }).pipe(
        map(() => true),
        catchError(() => of(false))
      )
    );
  }

  async getTokenIcon(symbol: string): Promise<string> {
    const pngPath = `${this.assetPath}${symbol.toLowerCase()}.png`;
    if (await this.imageExists(pngPath)) return pngPath;

    const jpgPath = `${this.assetPath}${symbol.toLowerCase()}.jpg`;
    if (await this.imageExists(jpgPath)) return jpgPath;

    const jpegPath = `${this.assetPath}${symbol.toLowerCase()}.jpeg`;
    if (await this.imageExists(jpegPath)) return jpegPath;

    const gifPath = `${this.assetPath}${symbol.toLowerCase()}.gif`;
    if (await this.imageExists(gifPath)) return gifPath;

    return `${this.assetPath}default.png`;
  }

  async attachIcons(tokens: Token[]): Promise<void> {
    let tokenImages: Token[] = [];

    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length; i++) {
        tokenImages.push({
          ...tokens[i],
          image: "./../../../" + await this.getTokenIcon(tokens[i].symbol)
        });
      }
    }

    this.tokenImagesSubject.next(tokenImages);
  }
}
