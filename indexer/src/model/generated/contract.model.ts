import { Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_ } from "typeorm";

@Entity_()
export class ContractExecution {
    constructor(props?: Partial<ContractExecution>) {
        Object.assign(this, props);
    }

    @PrimaryColumn_()
    id!: string;

    @Column_("int4", { nullable: false })
    blockNumber!: number;

    @Column_("timestamp with time zone", { nullable: false })
    timestamp!: Date;

    @Column_("text", { nullable: false })
    tx!: string;

    @Column_("text", { nullable: false })
    contractAddress!: string;

    @Column_("text", { nullable: true })
    methodId?: string;

    @Column_("text", { nullable: true })
    caller?: string;
}
