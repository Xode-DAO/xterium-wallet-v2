import { Injectable } from '@angular/core';
import { ExtrinsicCategory, ExtrinsicInfo } from 'src/models/fees.model';

@Injectable({
  providedIn: 'root'
})
export class ExtrinsicMappingService {
  
  private extrinsicMap: { [key: string]: ExtrinsicInfo } = {
    // Balances transfers
    'Balances.transfer_allow_death': {
      category: 'transfer',
      title: 'You are sending',
      subtitle: 'Review the transfer details before confirming.',
      requiredFields: ['amount', 'from', 'to', 'network', 'fee']
    },
    'Balances.transfer_keep_alive': {
      category: 'transfer',
      title: 'You are sending',
      subtitle: 'Review the transfer details before confirming.',
      requiredFields: ['amount', 'from', 'to', 'network', 'fee']
    },

    // Assets transfers
    'Assets.transfer_keep_alive': {
      category: 'assets',
      title: 'You are sending',
      subtitle: 'Review the transfer details before confirming.',
      requiredFields: ['amount', 'from', 'to', 'assetId', 'network', 'fee']
    },
    'Assets.transfer': {
      category: 'assets',
      title: 'You are sending',
      subtitle: 'Review the transfer details before confirming.',
      requiredFields: ['amount', 'from', 'to', 'assetId', 'network', 'fee']
    },

    // Staking
    'Staking.bond': {
      category: 'staking',
      title: 'Bond Tokens',
      subtitle: 'Bond tokens for staking',
      requiredFields: ['amount', 'from', 'controller', 'payee', 'network', 'fee']
    },
    'Staking.nominate': {
      category: 'staking',
      title: 'Nominate Validators',
      subtitle: 'Nominate validators for staking',
      requiredFields: ['from', 'validator', 'network', 'fee']
    },
    'Staking.unbond': {
      category: 'staking',
      title: 'Unbond Tokens',
      subtitle: 'Unbond staked tokens',
      requiredFields: ['amount', 'from', 'network', 'fee']
    },

    // XCM Transfers
    'polkadotXcm.limitedReserveTransferAssets': {
      category: 'xcm',
      title: 'Cross-Chain Transfer',
      subtitle: 'Transfer assets to another chain',
      requiredFields: ['amount', 'from', 'destinationChain', 'beneficiary', 'assets', 'feeAssetItem', 'weightLimit', 'network', 'fee']
    },
    'polkadotXcm.limitedTeleportAssets': {
      category: 'xcm',
      title: 'Cross-Chain Teleport',
      subtitle: 'Teleport assets to another chain',
      requiredFields: ['amount', 'from', 'destinationChain', 'beneficiary', 'assets', 'feeAssetItem', 'weightLimit', 'network', 'fee']
    },
    'polkadotXcm.execute': {
      category: 'xcm',
      title: 'XCM Execute',
      subtitle: 'Execute cross-chain message',
      requiredFields: ['from', 'destinationChain', 'network', 'fee']
    },

    // Swaps
    'assetconversion.swap_exact_tokens_for_tokens': {
      category: 'swap',
      title: 'Token Swap',
      subtitle: 'Swap exact tokens for tokens',
      requiredFields: ['amount', 'from', 'tokenIn', 'tokenOut', 'slippage', 'minimumOut', 'network', 'fee']
    },

    // Governance
    'Democracy.vote': {
      category: 'governance',
      title: 'Vote',
      subtitle: 'Vote on governance proposal',
      requiredFields: ['from', 'network', 'fee']
    },
    'Council.vote': {
      category: 'governance',
      title: 'Council Vote',
      subtitle: 'Vote in council proposal',
      requiredFields: ['from', 'network', 'fee']
    }
  };

  getExtrinsicInfo(extrinsic: string): ExtrinsicInfo {
    return this.extrinsicMap[extrinsic] || {
      category: 'unknown',
      title: extrinsic,
      subtitle: 'Custom transaction',
      requiredFields: ['amount', 'from', 'network', 'fee']
    };
  }

  getCategoryIcon(category: ExtrinsicCategory): string {
    const icons = {
      'transfer': 'arrow-redo',
      'staking': 'trending-up',
      'assets': 'card',
      'xcm': 'git-branch',
      'swap': 'swap-horizontal',
      'governance': 'megaphone',
      'unknown': 'help'
    };
    return icons[category];
  }

  getCategoryColor(category: ExtrinsicCategory): string {
    const colors = {
      'transfer': 'primary',
      'staking': 'success',
      'assets': 'warning',
      'xcm': 'tertiary',
      'swap': 'secondary',
      'governance': 'danger',
      'unknown': 'medium'
    };
    return colors[category];
  }

  getAllExtrinsics(): string[] {
    return Object.keys(this.extrinsicMap);
  }
}