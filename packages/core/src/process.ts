import { ListingCategory, ListingTenure, ProcessStage } from "./types";

export type ProcessTimelineStage = {
  stage: ProcessStage;
  optional?: boolean;
};

const isRentCategory = (category: ListingCategory) =>
  category === ListingCategory.FOR_RENT || category === ListingCategory.RENTED;

export function getProcessTimelineStages(params: {
  category: ListingCategory;
  tenure?: ListingTenure;
}): ProcessTimelineStage[] {
  const tenure = params.tenure ?? ListingTenure.FREEHOLD;
  const base: ProcessTimelineStage[] = [
    { stage: ProcessStage.OWNER_APPOINTMENT },
    { stage: ProcessStage.MARKETING_ACTIVATION },
    { stage: ProcessStage.VIEWING_RECORD },
    { stage: ProcessStage.OFFER_STAGE },
  ];

  if (isRentCategory(params.category)) {
    return [
      ...base,
      { stage: ProcessStage.LEGAL_STAGE },
      { stage: ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT },
      { stage: ProcessStage.KEY_HANDOVER },
    ];
  }

  return [
    ...base,
    { stage: ProcessStage.LOAN_APPLICATION },
    { stage: ProcessStage.LEGAL_STAGE },
    {
      stage: ProcessStage.CONSENT_APPLICATION,
      optional: tenure === ListingTenure.FREEHOLD,
    },
    { stage: ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT },
    { stage: ProcessStage.KEY_HANDOVER },
  ];
}

export function getProcessStageDisplayLabel(stage: ProcessStage): string {
  if (stage === ProcessStage.KEY_HANDOVER) {
    return "Vacant Possession";
  }
  return stage;
}

export function getProcessStageAliasStages(stage: ProcessStage): ProcessStage[] {
  if (
    stage === ProcessStage.LOAN_APPLICATION ||
    stage === ProcessStage.CONSENT_APPLICATION
  ) {
    return [ProcessStage.LOAN_CONSENT];
  }
  return [];
}
