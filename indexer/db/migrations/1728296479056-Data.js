module.exports = class Data1728296479056 {
    name = 'Data1728296479056'

    async up(db) {
        await db.query(`
            CREATE TABLE "transfer" (
                "id" character varying NOT NULL,
                "block_number" integer NOT NULL,
                "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
                "tx" text NOT NULL,
                "from" text NOT NULL,
                "to" text NOT NULL,
                "amount" numeric NOT NULL,
                "contract_address" text NOT NULL,
                CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id")
            )
        `)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
    }
}
