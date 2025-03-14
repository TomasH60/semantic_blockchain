import { TronBatchProcessor } from "@subsquid/tron-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import assert from "assert";
import * as erc20 from "./abi/erc20";
import { Transfer } from "./model";

const processor = new TronBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/tron-mainnet")
  .setHttpApi({
    url: "https://rpc.ankr.com/http/tron",
    strideConcurrency: 1,
    strideSize: 1,
  })
  .setFields({
    block: { timestamp: true },
    transaction: { hash: true },
    log: { address: true, data: true, topics: true },
  })
  .addLog({
    where: { topic0: ["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"] },
    include: { transaction: true },
  });

processor.run(new TypeormDatabase(), async (ctx) => {
  let transfers: Transfer[] = [];

  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (log.topics?.[0] === "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        try {
          assert(log.data, "USDT transfers always carry data");
        } catch (error) {
          console.log(error);
          continue;
        }

        if (log.topics.length === 3) {
          let tx = log.getTransaction();
          let event = {
            topics: log.topics.map((t) => "0x" + t),
            data: "0x" + log.data,
          };
          let { from, to, value } = erc20.events.Transfer.decode(event);

          transfers.push(
            new Transfer({
              id: log.id,
              blockNumber: block.header.height,
              timestamp: new Date(block.header.timestamp),
              tx: tx.hash,
              from,
              to,
              amount: value,
              contractAddress: log.address,
            })
          );
        } else {
          console.warn("Unexpected topic count:", log.topics);
          continue;
        }
      }
    }
  }

  await ctx.store.insert(transfers);
});
