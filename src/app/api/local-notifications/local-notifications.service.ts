import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { LocalNotifications } from '@capacitor/local-notifications';

import { Preferences } from '@capacitor/preferences';
import { LocalNotification } from 'src/models/local-notification.model';

@Injectable({
  providedIn: 'root'
})
export class LocalNotificationsService {
  private readonly NOTIFICATION_STORAGE_KEY = 'notifications';


  private localNotificationSubject = new BehaviorSubject<LocalNotification | undefined>(undefined);
  public localNotificationObservable = this.localNotificationSubject.asObservable();

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

    await this.saveNotification({
      id,
      title,
      body,
      timestamp: new Date().toISOString(),
      is_open: false,
      is_read: false,
    })
  }
  async saveNotification(notification: LocalNotification): Promise<void> {
    const existingNotifications = await this.getAllNotifications();

    notification.is_read = false;
    notification.is_open = false;
    notification.timestamp = new Date().toISOString();

    if (existingNotifications.length >= 25) {
      existingNotifications.pop();
    }

    existingNotifications.push(notification);
    existingNotifications.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    await Preferences.set({
      key: this.NOTIFICATION_STORAGE_KEY,
      value: JSON.stringify(existingNotifications)
    });

    this.localNotificationSubject.next(notification);
  }

  async getAllNotifications(): Promise<LocalNotification[]> {
    const { value } = await Preferences.get({ key: this.NOTIFICATION_STORAGE_KEY });
    const notifications: LocalNotification[] = value ? JSON.parse(value) : [];

    return notifications.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  async openNotifications(): Promise<LocalNotification[]> {
    const notifications = await this.getAllNotifications();
    notifications.forEach(n => {
      n.is_open = true;
    });

    await Preferences.set({
      key: this.NOTIFICATION_STORAGE_KEY,
      value: JSON.stringify(notifications)
    });

    return notifications;
  }

  async markAsReadById(id: number): Promise<void> {
    const notifications = await this.getAllNotifications();

    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.is_read = true;

      await Preferences.set({
        key: this.NOTIFICATION_STORAGE_KEY,
        value: JSON.stringify(notifications)
      });
    }
  }

  async getUnopenNotifications(): Promise<number> {
    const notifications = await this.getAllNotifications();
    return notifications.filter(n => !n.is_open).length;
  }

  async markAllAsRead(): Promise<void> {
    const notifications = await this.getAllNotifications();

    notifications.forEach(n => n.is_read = true);

    await Preferences.set({
      key: this.NOTIFICATION_STORAGE_KEY,
      value: JSON.stringify(notifications)
    });
  }
}
