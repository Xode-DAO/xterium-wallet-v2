import { Injectable } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {

  constructor(private toastController: ToastController) {}
  
  async copy(value: string, message: string) {
    await Clipboard.write({ string: value });

    const toast = await this.toastController.create({
      message,
      color: 'success',
      duration: 1500,
      position: 'top',
    });

    await toast.present();
  }
}
