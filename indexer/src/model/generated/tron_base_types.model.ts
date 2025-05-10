import { PrimaryColumn, Column, Entity } from "@subsquid/typeorm-store";

export abstract class BaseTransaction {
  @PrimaryColumn() id!: string;
  @Column() blockHash!: string;
  @Column('timestamptz')timestamp!: Date;
  @Column() netFee!: string;
  constructor(props?: Partial<any>) {
    Object.assign(this, props);
  }
}

export abstract class BaseLogEvent {
  @PrimaryColumn() id!: string;
  @Column() blockHash!: string;
  @Column() transactionHash!: string;
  @Column() contractAddress!: string;

  constructor(props?: Partial<any>) {
    Object.assign(this, props);
  }
}
@Entity()
export class Block {
  constructor(props?: Partial<Block>) {
    Object.assign(this, props);
  }
  @PrimaryColumn() id!: string;
  @Column() number!: number;
  @Column() parentHash!: string;
  @Column('timestamptz')timestamp!: Date;
}

@Entity()
export class InternalTransaction {
  constructor(props?: Partial<InternalTransaction>) {
    Object.assign(this, props);
  }
  @PrimaryColumn() id!: string;
  @Column() callerAddress!: string;
  
  @Column() transferToAddress!: string;
  @Column() transactionHash!: string;
  @Column() callValue!: string;
  @Column() tokenId!: string;
  @Column() rejected?: boolean;
}
