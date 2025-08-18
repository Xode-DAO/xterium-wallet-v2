import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { v4 as uuidv4 } from 'uuid';

import {
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonLabel,
  IonToast,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, copyOutline, close } from 'ionicons/icons';

import { Network } from 'src/models/network.model';
import { Wallet } from 'src/models/wallet.model'

import { PolkadotjsService } from 'src/app/api/polkadotjs/polkadotjs.service';
import { OnboardingService } from 'src/app/api/onboarding/onboarding.service';
import { WalletsService } from 'src/app/api/wallets/wallets.service';

@Component({
  selector: 'app-new-wallet',
  templateUrl: './new-wallet.component.html',
  styleUrls: ['./new-wallet.component.scss'],
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
    IonLabel,
    IonToast,
  ]
})
export class NewWalletComponent implements OnInit {
  @Input() selectedNetwork: Network = {} as Network;
  @Output() onCreatedWallet = new EventEmitter<Wallet>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private onboardingService: OnboardingService,
    private walletsService: WalletsService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      copyOutline,
      close
    });
  }

  walletName: string = '';
  walletMnemonicPhrase: string[] = new Array(12).fill('');

  isProcessing: boolean = false;

  async copyToClipboard() {
    const mnemonic = this.walletMnemonicPhrase.join(' ');

    navigator.clipboard.writeText(mnemonic).then(async () => {
      const toast = await this.toastController.create({
        message: 'Mnemonic phrase copied to clipboard!',
        color: 'success',
        duration: 1500,
        position: 'top',
      });

      await toast.present();
    });
  }

  async saveWallet() {
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

    let isMnemonicPhraseValid = await this.polkadotjsService.validateMnemonic(this.walletMnemonicPhrase.join(' '));
    if (isMnemonicPhraseValid) {
      const seed: Uint8Array = await this.polkadotjsService.generateMnemonicToMiniSecret(this.walletMnemonicPhrase.join(' '));
      const keypair = await this.polkadotjsService.createKeypairFromSeed(seed);

      const newId = uuidv4();

      const wallet: Wallet = {
        id: newId,
        name: this.walletName,
        network_id: this.selectedNetwork.id,
        mnemonic_phrase: this.walletMnemonicPhrase.join(' '),
        public_key: keypair.publicKey.toString(),
        private_key: keypair.secretKey.toString()
      };

      let getExistingPublicAddress = await this.walletsService.getWalletById(newId);
      if (getExistingPublicAddress) {
        this.isProcessing = false;

        const toast = await this.toastController.create({
          message: 'Wallet already exists!',
          color: 'danger',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      } else {
        await this.walletsService.create(wallet);
        this.onCreatedWallet.emit({ ...wallet });

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
          message: 'Wallet created successfully!',
          color: 'success',
          duration: 1500,
          position: 'top',
        });

        await toast.present();
      }
    }
  }

  ngOnInit() {
    this.polkadotjsService.generateMnemonic().then(mnemonicPhrase => {
      this.walletMnemonicPhrase = mnemonicPhrase.split(' ');
    });
  }
}
