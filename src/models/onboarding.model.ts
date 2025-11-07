import { Chain } from "src/models/chain.model"
import { Wallet } from "src/models/wallet.model"

export class Onboarding {
  step1_selected_chain: Chain = new Chain();
  step2_accepted_terms: boolean = false;
  step3_created_wallet: Wallet | null = null;
  step4_completed: boolean = false;
}
