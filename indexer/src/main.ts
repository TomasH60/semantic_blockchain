import { TronBatchProcessor } from "@subsquid/tron-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import * as model from "./model"; // your entity classes
import * as erc20 from "./abi/erc20"; // event decoders
import base58 from "bs58";
import { createHash } from "crypto";

function safeDate(input: any): Date {
  const n = Number(input);
  if (input != null && !isNaN(n)) {
    const d = new Date(n);
    if (!isNaN(d.getTime())) {
      console.log(d.toISOString())
      return d; 
    }
  }
  console.log(new Date(0).toISOString())
  return new Date(0);
}


function toBase58(hexAddress: string): string {
  const bytes = Buffer.from(hexAddress.replace(/^0x/, ""), "hex");
  const address =
    bytes.length === 20 ? Buffer.concat([Buffer.from([0x41]), bytes]) : bytes;
  const hash0 = createHash("sha256").update(address).digest();
  const hash1 = createHash("sha256").update(hash0).digest();
  const checksum = hash1.subarray(0, 4);
  const full = Buffer.concat([address, checksum]);
  return base58.encode(full);
}


const TIMEOUT_VALUE = Number(process.env.TIMEOUT_VALUE) || 0;
const RPC_URL = process.env.RPC_URL || "";
const API_KEY = process.env.API_KEY || "";
const FULL_RPC_URL = API_KEY ? `${RPC_URL}/${API_KEY}` : RPC_URL;

const START_BLOCK_NUMBER = process.env.START_BLOCK_NUMBER
  ? Number(process.env.START_BLOCK_NUMBER)
  : 0;

const END_BLOCK_NUMBER =
  process.env.END_BLOCK_NUMBER && Number(process.env.END_BLOCK_NUMBER) !== -1
    ? Number(process.env.END_BLOCK_NUMBER)
    : undefined;

const processor = new TronBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/tron-mainnet")
  .setHttpApi({
    url: FULL_RPC_URL,
    strideConcurrency: 1,
    strideSize: 1,
    headPollInterval: 1000
    
  })
  .setBlockRange({ from: START_BLOCK_NUMBER, to: END_BLOCK_NUMBER })
  .includeAllBlocks({ from: START_BLOCK_NUMBER, to: END_BLOCK_NUMBER })
  .setFields({
    block: { parentHash: true, timestamp: true },
    transaction: {
      hash: true,
      type: true,
      contractAddress: true,
      netFee: true,
      energyUsage: true,
      contractResult: true,
      timestamp: true,
      parameter: true,
    },
    log: { address: true, data: true, topics: true },
    internalTransaction: {
      callerAddress: true,
      transferToAddress: true,
      hash: true,
      rejected: true,
      callValueInfo: true,
    },
  })
  .addTransaction({ include: { logs: true, internalTransactions: true } })
  .setPrometheusPort(9090);


export async function main() {
  await processor.run(new TypeormDatabase(), async (ctx) => {
    for (const block of ctx.blocks) {
      console.log(block.header.height);
      const blockEntity = new model.Block({
        id: block.header.hash,
        number: block.header.height,
        parentHash: block.header.parentHash,
        timestamp: safeDate(block.header.timestamp),
      });
      await ctx.store.insert(blockEntity);

      const logMap = new Map<number, (typeof block.logs)[number][]>();
      for (const log of block.logs) {
        if (log.transactionIndex === undefined) continue;
        if (!logMap.has(log.transactionIndex)) {
          logMap.set(log.transactionIndex, []);
        }
        logMap.get(log.transactionIndex)!.push(log);
      }

      const internalTxMap = new Map<
        number,
        (typeof block.internalTransactions)[number][]
      >();
      for (const itx of block.internalTransactions) {
        if (itx.transactionIndex === undefined) continue;
        if (!internalTxMap.has(itx.transactionIndex)) {
          internalTxMap.set(itx.transactionIndex, []);
        }
        internalTxMap.get(itx.transactionIndex)!.push(itx);
      }

      for (const itx of block.internalTransactions) {
        if (itx.transactionIndex === undefined) continue;

        const parentTx = block.transactions[itx.transactionIndex];
        const parentHash = parentTx?.hash ?? "none";

        const valueInfo = itx.callValueInfo?.[0];
        const itxEntity = new model.InternalTransaction({
          id: itx.hash,
          transactionHash: parentHash,
          callerAddress: toBase58(itx.callerAddress ?? ""),
          transferToAddress: toBase58(itx.transferToAddress ?? ""),
          callValue: valueInfo?.callValue?.toString() ?? "-1",
          tokenId: valueInfo?.tokenId ?? "none",
          rejected: itx.rejected ?? false,
        });
        await ctx.store.insert(itxEntity);
      }

      for (const tx of block.transactions) {
        if (tx.transactionIndex === undefined) continue;

        const base = {
          id: tx.hash,
          blockHash: block.header.hash,
          timestamp: safeDate(tx.timestamp),
          netFee: tx.netFee?.toString() ?? "none",
        };
        try {
          const p = tx.parameter?.value ?? {};
          switch (tx.type) {
            case "AccountCreateContract":
              await ctx.store.insert(
                new model.AccountCreateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            case "TransferContract":
              await ctx.store.insert(
                new model.TransferContractTransaction({
                  ...base,
                  from: toBase58(p.owner_address ?? "none"),
                  to: toBase58(p.to_address ?? "none"),
                  amount: p.amount?.toString() ?? "-1",
                })
              );
              break;

            case "TransferAssetContract":
              await ctx.store.insert(
                new model.TransferAssetContractTransaction({
                  ...base,
                  assetName: p.asset_name ?? "none",
                  from: toBase58(p.owner_address ?? "none"),
                  to: toBase58(p.to_address ?? "none"),
                  amount: p.amount?.toString() ?? "-1",
                })
              );
              break;

            case "VoteAssetContract":
              await ctx.store.insert(
                new model.VoteAssetContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  votes: Array.isArray(p.votes)
                    ? p.votes.map((v: any) => ({
                        voteAddress: toBase58(v.voteAddress ?? "none"),
                        voteCount: v.voteCount?.toString() ?? "-1",
                      }))
                    : [],
                })
              );
              break;

            case "VoteWitnessContract":
              await ctx.store.insert(
                new model.VoteWitnessContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  votes: Array.isArray(p.votes)
                    ? p.votes.map((v: any) => ({
                        voteAddress: toBase58(v.voteAddress ?? "none"),
                        voteCount: v.vote_count?.toString() ?? "-1",
                      }))
                    : [],
                })
              );
              break;

            case "WitnessCreateContract":
              await ctx.store.insert(
                new model.WitnessCreateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  url: p.url ?? "none",
                })
              );
              break;

            case "AssetIssueContract":
              await ctx.store.insert(
                new model.AssetIssueContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  name: p.name ?? "none",
                  totalSupply: p.total_supply?.toString() ?? "-1",
                })
              );
              break;

            case "WitnessUpdateContract":
              await ctx.store.insert(
                new model.WitnessUpdateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  updateUrl: p.update_url ?? "none",
                })
              );
              break;

            case "ParticipateAssetIssueContract":
              await ctx.store.insert(
                new model.ParticipateAssetIssueContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  assetName: p.asset_name ?? "none",
                  amount: p.amount?.toString() ?? "-1",
                })
              );
              break;

            case "AccountUpdateContract":
              await ctx.store.insert(
                new model.AccountUpdateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  accountName: p.account_name ?? "none",
                })
              );
              break;

            case "FreezeBalanceContract":
              await ctx.store.insert(
                new model.FreezeBalanceContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  frozenBalance: p.frozen_balance?.toString() ?? "-1",
                  frozenDuration: p.frozen_duration ?? -1,
                  resource: p.resource ?? -1,
                })
              );
              break;

            case "UnfreezeBalanceContract":
              await ctx.store.insert(
                new model.UnfreezeBalanceContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  resource: p.resource ?? -1,
                })
              );
              break;

            case "WithdrawBalanceContract":
              await ctx.store.insert(
                new model.WithdrawBalanceContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            case "UnfreezeAssetContract":
              await ctx.store.insert(
                new model.UnfreezeAssetContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            case "UpdateAssetContract":
              await ctx.store.insert(
                new model.UpdateAssetContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  assetName: p.asset_name ?? "none",
                })
              );
              break;

            case "ProposalCreateContract":
              await ctx.store.insert(
                new model.ProposalCreateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  parameters: p.parameters ?? [],
                })
              );
              break;

            case "ProposalApproveContract":
              await ctx.store.insert(
                new model.ProposalApproveContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  proposalId: p.proposal_id ?? -1,
                })
              );
              break;

            case "ProposalDeleteContract":
              await ctx.store.insert(
                new model.ProposalDeleteContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  proposalId: p.proposal_id ?? -1,
                })
              );
              break;

            case "SetAccountIdContract":
              await ctx.store.insert(
                new model.SetAccountIdContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  accountId: p.account_id ?? "none",
                })
              );
              break;

            case "CustomContract":
              await ctx.store.insert(
                new model.CustomContractTransaction({
                  ...base,
                  data: p.data ?? "none",
                })
              );
              break;

            case "CreateSmartContract":
              await ctx.store.insert(
                new model.CreateSmartContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  originAddress: toBase58(p.originAddress ?? "none"),
                  contractName: p.name ?? "none",
                  abi: p.abi ?? "none",
                  bytecode: p.bytecode ?? "none",
                  originEnergyLimit: p.origin_energy_limit ?? -1,
                })
              );
              break;

            case "TriggerSmartContract":
              await ctx.store.insert(
                new model.TriggerSmartContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  contractAddress: toBase58(p.contract_address ?? "none"),
                  data: p.data ?? "none",
                  energyUsage: tx.energyUsage ?? "none",
                  contractResult: tx.contractResult,
                })
              );
              break;

            case "GetContract":
              await ctx.store.insert(
                new model.GetContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  contractAddress: toBase58(p.contract_address ?? "none"),
                })
              );
              break;

            case "UpdateSettingContract":
              await ctx.store.insert(
                new model.UpdateSettingContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  contractAddress: toBase58(p.contract_address ?? "none"),
                  settings: p.settings ?? [],
                })
              );
              break;

            case "ExchangeCreateContract":
              await ctx.store.insert(
                new model.ExchangeCreateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  firstTokenId: p.first_token_id ?? "none",
                  firstTokenBalance: p.first_token_balance?.toString() ?? "-1",
                  secondTokenId: p.second_token_id ?? "none",
                  secondTokenBalance:
                    p.second_token_balance?.toString() ?? "-1",
                })
              );
              break;

            case "ExchangeInjectContract":
              await ctx.store.insert(
                new model.ExchangeInjectContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  exchangeId: p.exchange_id?.toString() ?? "-1",
                  tokenId: p.token_id ?? "none",
                  quant: p.quant?.toString() ?? "-1",
                })
              );
              break;

            case "ExchangeWithdrawContract":
              await ctx.store.insert(
                new model.ExchangeWithdrawContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  exchangeId: p.exchange_id?.toString() ?? "-1",
                  tokenId: p.token_id ?? "none",
                  quant: p.quant?.toString() ?? "-1",
                })
              );
              break;

            case "ExchangeTransactionContract":
              await ctx.store.insert(
                new model.ExchangeTransactionContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  exchangeId: p.exchange_id?.toString() ?? "-1",
                  tokenId: p.token_id ?? "none",
                  quant: p.quant?.toString() ?? "-1",
                  expected: p.expected?.toString() ?? "-1",
                })
              );
              break;

            case "UpdateEnergyLimitContract":
              await ctx.store.insert(
                new model.UpdateEnergyLimitContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  contractAddress: toBase58(p.contract_address ?? "none"),
                  originEnergyLimit: p.origin_energy_limit?.toString() ?? "-1",
                })
              );
              break;

            case "AccountPermissionUpdateContract":
              await ctx.store.insert(
                new model.AccountPermissionUpdateContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  owner: p.owner ?? {},
                  witness: p.witness ?? {},
                  actives: p.actives ?? [],
                })
              );
              break;

            case "ClearABIContract":
              await ctx.store.insert(
                new model.ClearABIContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  contractAddress: toBase58(p.contract_address ?? "none"),
                })
              );
              break;

            case "UpdateBrokerageContract":
              await ctx.store.insert(
                new model.UpdateBrokerageContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  brokerage: p.brokerage ?? -1,
                })
              );
              break;

            case "ShieldedTransferContract":
              await ctx.store.insert(
                new model.ShieldedTransferContractTransaction({
                  ...base,
                  transparentFromAddress: toBase58(
                    p.transparent_from_address ?? "none"
                  ),
                  transparentToAddress: toBase58(
                    p.transparent_to_address ?? "none"
                  ),
                  amount: p.amount?.toString() ?? "-1",
                  shieldedTransactionData:
                    p.shielded_transaction_data ?? "none",
                })
              );
              break;

            case "MarketSellAssetContract":
              await ctx.store.insert(
                new model.MarketSellAssetContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  assetName: p.asset_name ?? "none",
                  amount: p.amount?.toString() ?? "-1",
                })
              );
              break;

            case "MarketCancelOrderContract":
              await ctx.store.insert(
                new model.MarketCancelOrderContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  orderId: p.order_id ?? "none",
                })
              );
              break;

            case "FreezeBalanceV2Contract":
              await ctx.store.insert(
                new model.FreezeBalanceV2ContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  frozenBalance: p.frozen_balance?.toString() ?? "-1",
                  resource: p.resource ?? -1,
                })
              );
              break;

            case "UnfreezeBalanceV2Contract":
              await ctx.store.insert(
                new model.UnfreezeBalanceV2ContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            case "WithdrawExpireUnfreezeContract":
              await ctx.store.insert(
                new model.WithdrawExpireUnfreezeContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            case "DelegateResourceContract":
              await ctx.store.insert(
                new model.DelegateResourceContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  receiverAddress: toBase58(p.receiver_address ?? "none"),
                  balance: p.balance?.toString() ?? "-1",
                  resource: p.resource ?? -1,
                  lock: p.lock ?? false,
                })
              );
              break;

            case "UnDelegateResourceContract":
              await ctx.store.insert(
                new model.UnDelegateResourceContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                  receiverAddress: toBase58(p.receiver_address ?? "none"),
                  balance: p.balance?.toString() ?? "-1",
                  resource: p.resource ?? -1,
                })
              );
              break;

            case "CancelAllUnfreezeV2Contract":
              await ctx.store.insert(
                new model.CancelAllUnfreezeV2ContractTransaction({
                  ...base,
                  ownerAddress: toBase58(p.owner_address ?? "none"),
                })
              );
              break;

            default:
              console.error(`unknown tx type: ${tx.type}:`);
              break;
          }
        } catch (e) {
          console.error(`Failed to decode transaction ${tx.hash}:`, e);
        }

        const logs = logMap.get(tx.transactionIndex) ?? [];
        for (const log of logs) {
          if (log.topics == null || log.topics.length === 0) continue;
          let event = {
            topics: log.topics.map((t) => "0x" + t),
            data: "0x" + log.data,
          };
          const base = {
            id: log.id,
            blockHash: block.header.hash,
            transactionHash: tx.hash,
            contractAddress: toBase58(log.address ?? "none"),
          };
          const topic0 = "0x" + log.topics[0];
          try {
            switch (topic0) {
              case erc20.events.Transfer.topic:
                const transfer = erc20.events.Transfer.decode(event);

                await ctx.store.insert(
                  new model.TransferEvent({
                    ...base,
                    from: toBase58(transfer.from ?? "none"),
                    to: toBase58(transfer.to ?? "none"),
                    value: transfer.value?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.Approval.topic:
                const approval = erc20.events.Approval.decode(event);
                await ctx.store.insert(
                  new model.ApprovalEvent({
                    ...base,
                    owner: toBase58(approval.owner ?? "none"),
                    spender: toBase58(approval.spender ?? "none"),
                    value: approval.value?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.DestroyedBlackFunds.topic:
                const destroyed =
                  erc20.events.DestroyedBlackFunds.decode(event);
                await ctx.store.insert(
                  new model.DestroyedBlackFundsEvent({
                    ...base,
                    blackListedUser: toBase58(
                      destroyed._blackListedUser ?? "none"
                    ),
                    balance: destroyed._balance?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.Issue.topic:
                const issue = erc20.events.Issue.decode(event);
                await ctx.store.insert(
                  new model.IssueEvent({
                    ...base,
                    amount: issue.amount?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.Redeem.topic:
                const redeem = erc20.events.Redeem.decode(event);
                await ctx.store.insert(
                  new model.RedeemEvent({
                    ...base,
                    amount: redeem.amount?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.Deprecate.topic:
                const deprecate = erc20.events.Deprecate.decode(event);
                await ctx.store.insert(
                  new model.DeprecateEvent({
                    ...base,
                    newAddress: toBase58(deprecate.newAddress ?? "none"),
                  })
                );
                break;

              case erc20.events.AddedBlackList.topic:
                const added = erc20.events.AddedBlackList.decode(event);
                await ctx.store.insert(
                  new model.AddedBlackListEvent({
                    ...base,
                    user: toBase58(added._user ?? "none"),
                  })
                );
                break;

              case erc20.events.RemovedBlackList.topic:
                const removed = erc20.events.RemovedBlackList.decode(event);
                await ctx.store.insert(
                  new model.RemovedBlackListEvent({
                    ...base,
                    user: toBase58(removed._user ?? "none"),
                  })
                );
                break;

              case erc20.events.Params.topic:
                const params = erc20.events.Params.decode(event);
                await ctx.store.insert(
                  new model.ParamsEvent({
                    ...base,
                    feeBasisPoints: params.feeBasisPoints?.toString() ?? "-1",
                    maxFee: params.maxFee?.toString() ?? "-1",
                  })
                );
                break;

              case erc20.events.Pause.topic:
                await ctx.store.insert(
                  new model.PauseEvent({
                    ...base,
                  })
                );
                break;

              case erc20.events.Unpause.topic:
                await ctx.store.insert(
                  new model.UnpauseEvent({
                    ...base,
                  })
                );
                break;

              case erc20.events.OwnershipTransferred.topic:
                const ownership =
                  erc20.events.OwnershipTransferred.decode(event);
                await ctx.store.insert(
                  new model.OwnershipTransferredEvent({
                    ...base,
                    previousOwner: toBase58(ownership.previousOwner ?? "none"),
                    newOwner: toBase58(ownership.newOwner ?? "none"),
                  })
                );
                break;

              default:
                await ctx.store.insert(
                  new model.GenericLogEvent({
                    ...base,
                    topics: log.topics ?? [],
                    data: log.data ?? "none",
                  })
                );
                break;
            }
          } catch (e) {
            console.error(`Failed to decode log ${log.id}:`, e);
          }
        }
      }
    }
  });
}
