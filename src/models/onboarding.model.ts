import { Network } from "./network.model"
import { Wallet } from "./wallet.model"

export class Onboarding {
  step1_selected_network: Network | null = null;
  step2_accepted_terms: boolean = false;
  step3_created_wallet: Wallet | null = null;
  step4_completed: boolean = false;
}
