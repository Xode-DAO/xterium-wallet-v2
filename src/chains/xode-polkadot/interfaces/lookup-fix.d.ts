// Temporary fix for missing Polkadot lookup types
// Avoids modifying generated files or node_modules

declare module '@polkadot/types/lookup' {
  export type PalletElectionsPhragmenSeatHolder = any;
  export type PalletIdentityRegistration = any;
  export type PalletBagsListListBag = any;
  export type PalletBagsListListNode = any;
  export type FrameSupportPreimagesBounded = any;
  export type PalletDemocracyReferendumInfo = any;
  export type PalletDemocracyReferendumStatus = any;
  export type PalletDemocracyVoteThreshold = any;
  export type PalletSocietyBid = any;
  export type PalletSocietyBidKind = any;
  export type PalletSocietyVote = any;
  export type PalletSocietyVouchingStatus = any;
  export type PalletStakingEraRewardPoints = any;
  export type PalletStakingRewardDestination = any;
  export type PalletStakingStakingLedger = any;
  export type PalletStakingValidatorPrefs = any;
  export type SpStakingExposure = any;
  export type SpStakingExposurePage = any;
  export type SpStakingPagedExposureMetadata = any;
  export type PalletBountiesBounty = any;
}
