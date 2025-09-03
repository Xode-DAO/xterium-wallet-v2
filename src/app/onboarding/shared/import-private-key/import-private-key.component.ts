import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

import { Clipboard } from '@capacitor/clipboard';
import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, clipboardOutline, close } from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model'

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-import-private-key',
  templateUrl: './import-private-key.component.html',
  styleUrls: ['./import-private-key.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonTextarea,
    IonLabel,
    IonToast,
  ]
})
export class ImportPrivateKeyComponent implements OnInit {
  @Input() selectedNetwork: Network = {} as Network;
  @Output() onImportedWallet = new EventEmitter<Wallet>();

  constructor(
    private polkadotJsService: PolkadotJsService,
    private onboardingService: OnboardingService,
    private walletsService: WalletsService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      clipboardOutline,
      close
    });
  }

  walletName: string = '';
  privateKey: string = '';

  isProcessing: boolean = false;

  async pasteFromClipboard() {
    const { type, value } = await Clipboard.read();

    if (type === 'text/plain') {
      this.privateKey = value;
    }
  }

  async importWallet() {
    if (this.walletName === "") {
      const toast = await this.toastController.create({
        message: 'Wallet name is required!',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
      return;
    }

    this.isProcessing = true;

    if (this.selectedNetwork.id === 1 || this.selectedNetwork.id === 2) {
      let validatedKeypair = await this.polkadotJsService.validatePrivateKey(this.privateKey);
      if (validatedKeypair && !validatedKeypair.valid) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Invalid private key: ' + validatedKeypair.error,
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const keypair = validatedKeypair;
      const newId = uuidv4();

      let getExistingWallet = await this.walletsService.getWalletById(newId);
      if (getExistingWallet) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Wallet already exists!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
        return;
      }

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        network_id: this.selectedNetwork.id,
        mnemonic_phrase: "-",
        public_key: (keypair.publicKey?.toString() ?? ''),
        private_key: (keypair.secretKey?.toString() ?? '')
      };

      await this.walletsService.create(wallet);
      this.onImportedWallet.emit({ ...wallet });

      const wallets = await this.walletsService.getAllWallets();
      if (wallets.length === 1) {
        await this.walletsService.setCurrentWallet(newId);
      }

      const onboarding = await this.onboardingService.get();
      if (onboarding) {
        if (onboarding.step3_created_wallet === null && onboarding.step4_completed == false) {
          await this.onboardingService.update({ step3_created_wallet: wallet, step4_completed: true });
        }
      }

      const toast = await this.toastController.create({
        message: 'Wallet imported successfully!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else if (this.selectedNetwork.id === 3) {
      this.isProcessing = false;

      const toast = await this.toastController.create({
        message: this.selectedNetwork.name + ' network is not yet supported.',
        color: 'warning',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    } else {

    }
  }

  ngOnInit() { }
}
