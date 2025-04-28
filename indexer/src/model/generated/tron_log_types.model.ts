import { PrimaryColumn, Column, Entity } from "@subsquid/typeorm-store";
import { BaseLogEvent } from "./tron_base_types.model";

@Entity()
export class DestroyedBlackFundsEvent extends BaseLogEvent {
  @Column() blackListedUser!: string;
  @Column("numeric") balance!: string;
}

@Entity()
export class IssueEvent extends BaseLogEvent {
  @Column("numeric") amount!: string;
}

@Entity()
export class RedeemEvent extends BaseLogEvent {
  @Column("numeric") amount!: string;
}

@Entity()
export class DeprecateEvent extends BaseLogEvent {
  @Column() newAddress!: string;
}

@Entity()
export class AddedBlackListEvent extends BaseLogEvent {
  @Column() user!: string;
}

@Entity()
export class RemovedBlackListEvent extends BaseLogEvent {
  @Column() user!: string;
}

@Entity()
export class ParamsEvent extends BaseLogEvent {
  @Column("numeric") feeBasisPoints!: string;
  @Column("numeric") maxFee!: string;
}

@Entity()
export class PauseEvent extends BaseLogEvent {}

@Entity()
export class UnpauseEvent extends BaseLogEvent {}

@Entity()
export class OwnershipTransferredEvent extends BaseLogEvent {
  @Column() previousOwner!: string;
  @Column() newOwner!: string;
}

@Entity()
export class ApprovalEvent extends BaseLogEvent {
  @Column() owner!: string;
  @Column() spender!: string;
  @Column("numeric") value!: string;
}

@Entity()
export class TransferEvent extends BaseLogEvent {
  @Column() from!: string;
  @Column() to!: string;
  @Column("numeric") value!: string;
}

@Entity()
export class GenericLogEvent extends BaseLogEvent {
  @Column("simple-array") topics!: string[];
  @Column() data!: string;
}
