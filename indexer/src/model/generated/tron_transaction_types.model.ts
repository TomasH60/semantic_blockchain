import { Entity, Column } from "@subsquid/typeorm-store";
import { BaseTransaction } from "./tron_base_types.model";

@Entity()
export class AccountCreateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  
}

@Entity()
export class TransferContractTransaction extends BaseTransaction {
  @Column() from!: string;
  @Column() to!: string;
  @Column("numeric") amount!: string;
}

@Entity()
export class TransferAssetContractTransaction extends BaseTransaction {
  @Column() assetName!: string;
  @Column() from!: string;
  @Column() to!: string;
  @Column("numeric") amount!: string;
}

@Entity()
export class VoteAssetContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("simple-json") votes!: { voteAddress: string; voteCount: string }[];
}

@Entity()
export class VoteWitnessContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("simple-json") votes!: { voteAddress: string; voteCount: string }[];
}

@Entity()
export class WitnessCreateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() url!: string;
}

@Entity()
export class AssetIssueContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() name!: string;
  @Column("numeric") totalSupply!: string;
}

@Entity()
export class WitnessUpdateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() updateUrl!: string;
}

@Entity()
export class ParticipateAssetIssueContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() assetName!: string;
  @Column("numeric") amount!: string;
}

@Entity()
export class AccountUpdateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() accountName!: string;
}

@Entity()
export class FreezeBalanceContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("numeric") frozenBalance!: string;
  @Column() frozenDuration!: number;
  @Column() resource!: string;
}

@Entity()
export class UnfreezeBalanceContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() resource!: string;
}

@Entity()
export class WithdrawBalanceContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
}

@Entity()
export class UnfreezeAssetContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
}

@Entity()
export class UpdateAssetContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() assetName!: string;
}

@Entity()
export class ProposalCreateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("simple-json") parameters!: { key: number; value: string }[];
}

@Entity()
export class ProposalApproveContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() proposalId!: number;
}

@Entity()
export class ProposalDeleteContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() proposalId!: number;
}

@Entity()
export class SetAccountIdContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() accountId!: string;
}

@Entity()
export class CustomContractTransaction extends BaseTransaction {
  @Column() data!: string;
}

@Entity()
export class CreateSmartContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractName!: string;
  @Column() originAddress!: string;
  @Column() abi!: string;
  @Column() bytecode!: string;
  @Column() originEnergyLimit!: number;
}

@Entity()
export class TriggerSmartContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractAddress!: string;
  @Column() data!: string;
  @Column() energyUsage!: string;
  @Column() contractResult!: string;
}

@Entity()
export class GetContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractAddress!: string;
}

@Entity()
export class UpdateSettingContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractAddress!: string;
  @Column("simple-json") settings!: { key: string; value: string }[];
}

@Entity()
export class ExchangeCreateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() firstTokenId!: string;
  @Column("numeric") firstTokenBalance!: string;
  @Column() secondTokenId!: string;
  @Column("numeric") secondTokenBalance!: string;
}

@Entity()
export class ExchangeInjectContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() exchangeId!: number;
  @Column() tokenId!: string;
  @Column("numeric") quant!: string;
}

@Entity()
export class ExchangeWithdrawContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() exchangeId!: number;
  @Column() tokenId!: string;
  @Column("numeric") quant!: string;
}

@Entity()
export class ExchangeTransactionContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() exchangeId!: number;
  @Column() tokenId!: string;
  @Column("numeric") quant!: string;
  @Column("numeric") expected!: string;
}

@Entity()
export class UpdateEnergyLimitContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractAddress!: string;
  @Column("numeric") originEnergyLimit!: string;
}

@Entity()
export class AccountPermissionUpdateContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("simple-json") owner!: object;
  @Column("simple-json") witness!: object;
  @Column("simple-json") actives!: object[];
}

@Entity()
export class ClearABIContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() contractAddress!: string;
}

@Entity()
export class UpdateBrokerageContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() brokerage!: number;
}

@Entity()
export class ShieldedTransferContractTransaction extends BaseTransaction {
  @Column() transparentFromAddress!: string;
  @Column() transparentToAddress!: string;
  @Column("numeric") amount!: string;
  @Column() shieldedTransactionData!: string;
}

@Entity()
export class MarketSellAssetContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() assetName!: string;
  @Column("numeric") amount!: string;
}

@Entity()
export class MarketCancelOrderContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() orderId!: string;
}

@Entity()
export class FreezeBalanceV2ContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column("numeric") frozenBalance!: string;
  @Column() resource!: string;
}

@Entity()
export class UnfreezeBalanceV2ContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
}

@Entity()
export class WithdrawExpireUnfreezeContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
}

@Entity()
export class DelegateResourceContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() receiverAddress!: string;
  @Column("numeric") balance!: string;
  @Column() resource!: string;
  @Column() lock?: boolean;
}

@Entity()
export class UnDelegateResourceContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
  @Column() receiverAddress!: string;
  @Column("numeric") balance!: string;
  @Column() resource!: string;
}

@Entity()
export class CancelAllUnfreezeV2ContractTransaction extends BaseTransaction {
  @Column() ownerAddress!: string;
}
