import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class LocalNotificationsService {
  async presentNotification(title: string, body: string, id: number) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: "",
          smallIcon: "xterium_logo",
          largeIcon: "xterium_logo",
        },
      ],
    });
  }
}
