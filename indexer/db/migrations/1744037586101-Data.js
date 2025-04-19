module.exports = class Data1744037586101 {
    name = 'Data1744037586101'

    async up(db) {
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "tx" text NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "amount" numeric NOT NULL, "contract_address" text NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "contract_execution" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "tx" text NOT NULL, "contract_address" text NOT NULL, "method_id" text, "caller" text, CONSTRAINT "PK_a9c619ec7d50cedd198b97e4af5" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP TABLE "contract_execution"`)
    }
}
