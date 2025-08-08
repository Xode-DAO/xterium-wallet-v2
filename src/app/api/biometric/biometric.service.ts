import { Injectable } from '@angular/core';
import { NativeBiometric } from 'capacitor-native-biometric';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {

  constructor() { }

  verifyIdentity() {
    NativeBiometric.isAvailable().then((isAvailable) => {
      if (isAvailable) {
        NativeBiometric.verifyIdentity({
          reason: 'For easy log in',
          title: 'Log in',
          subtitle: 'Authenticate',
          description: 'Please authenticate to proceed',
          maxAttempts: 2,
          useFallback: true,
        }).then((result) => {
          alert("Biometric authentication successful");
          console.log(result);
        }).catch((error) => {
          console.error('Error verifying identity:', error);
        });
      } else {
        alert('Biometric authentication is not available on this device.');
      }
    }).catch((e) => {
      console.error(e);
      alert('Authentication failed');
    });
  }
}
