import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAlert,
  IonText,
} from '@ionic/angular/standalone';

import { LocalNotification } from 'src/models/local-notification.model';

import { LocalNotificationsService } from 'src/app/api/local-notifications/local-notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonAlert,
    IonText,
  ]
})
export class NotificationsComponent  implements OnInit {

  @Output() onOpenNotification = new EventEmitter<LocalNotification>();

  constructor(
    private localNotificationsService: LocalNotificationsService,
  ) { }

  notifications: LocalNotification[] = [];
  selectedNotification: LocalNotification | null = null;

  isAlertOpen: boolean = false;

  async getNotifications(): Promise<void> {
    this.notifications = await this.localNotificationsService.getAllNotifications();
  }

  async openNotification(notification: LocalNotification) {
    this.selectedNotification = notification;
    this.isAlertOpen = true;
  
    if (notification.id !== undefined) {
      await this.localNotificationsService.markAsReadById(notification.id);
  
      this.notifications = await this.localNotificationsService.getAllNotifications();
    }
  }

  async ngOnInit() {
      await this.getNotifications()
  }

}
