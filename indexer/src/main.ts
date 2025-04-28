import { TronBatchProcessor } from "@subsquid/tron-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import * as model from "./model"; // your entity classes
import * as erc20 from "./abi/erc20"; // event decoders

function safeDate(input: any): Date {
  const n = Number(input);
  if (input != null && !isNaN(n)) {
    const d = new Date(n);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return new Date(0);
}
// const loggedTypes = new Set<string>();
const processor = new TronBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/tron-mainnet")
  .setHttpApi({
    url: "https://rpc.ankr.com/http/tron",
    strideConcurrency: 1,
    strideSize: 1,
  })
  .setBlockRange({ from: 70003681 })
  .setFields({
    block: { parentHash: true, timestamp: true },
    transaction: {
      hash: true,
      type: true,
      signature: true,
      contractAddress: true,
      rawDataHex: true,
      fee: true,
      netUsage: true,
      netFee: true,
      energyUsage: true,
      energyFee: true,
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
  .addTransaction({ include: { logs: true, internalTransactions: true } });

processor.run(new TypeormDatabase(), async (ctx) => {
  for (const block of ctx.blocks) {
    const blockEntity = new model.Block({
      id: block.header.hash,
      number: block.header.height,
      parentHash: block.header.parentHash,
      timestamp: new Date(block.header.timestamp),
    });
    ctx.store.insert(blockEntity);

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
    
      const itxEntity = new model.InternalTransaction({
        id: itx.hash,
        transactionHash: parentHash,
        callerAddress: itx.callerAddress,
        transferToAddress: itx.transferToAddress,
        amount: itx.callValueInfo?.[0]?.callValue?.toString() ?? "0",
        rejected: itx.rejected ?? false,
      });
      ctx.store.insert(itxEntity);
    }
    
    for (const tx of block.transactions) {
      if (tx.transactionIndex === undefined) continue;

      try {
        const p = tx.parameter?.value ?? {};
        /*if (!loggedTypes.has(tx.type)) {
          console.log(`\n--- PARAMETER SAMPLE FOR TYPE: ${tx.type} ---\n`, p);
          loggedTypes.add(tx.type);
        } */
        switch (tx.type) {
          case "AccountCreateContract":
      
            ctx.store.insert(
              new model.AccountCreateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "TransferContract":
            ctx.store.insert(
              new model.TransferContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                from: p.owner_address ?? "none",
                to: p.to_address ?? "none",
                amount: p.amount?.toString() ?? "0",
              })
            );
            break;

          case "TransferAssetContract":
            ctx.store.insert(
              new model.TransferAssetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                assetName: p.asset_name ?? "none",
                from: p.owner_address ?? "none",
                to: p.to_address ?? "none",
                amount: p.amount?.toString() ?? "0",
              })
            );
            break;

          case "VoteAssetContract":
            ctx.store.insert(
              new model.VoteAssetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                votes: Array.isArray(p.votes)
                  ? p.votes.map((v: any) => ({
                      voteAddress: v.voteAddress ?? "none",
                      voteCount: v.voteCount?.toString() ?? "0",
                    }))
                  : [],
              })
            );
            break;

          case "VoteWitnessContract":
            ctx.store.insert(
              new model.VoteWitnessContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                votes: Array.isArray(p.votes)
                  ? p.votes.map((v: any) => ({
                      voteAddress: v.vote_address ?? "none",
                      voteCount: v.vote_count?.toString() ?? "0",
                    }))
                  : [],
              })
            );
            break;

          case "WitnessCreateContract":
            ctx.store.insert(
              new model.WitnessCreateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                url: p.url ?? "none",
              })
            );
            break;

          case "AssetIssueContract":
            ctx.store.insert(
              new model.AssetIssueContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                name: p.name ?? "none",
                totalSupply: p.total_supply?.toString() ?? "0",
              })
            );
            break;

          case "WitnessUpdateContract":
            
            ctx.store.insert(
              new model.WitnessUpdateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                updateUrl: p.update_url ?? "none",
              })
            );
            break;

          case "ParticipateAssetIssueContract":
            ctx.store.insert(
              new model.ParticipateAssetIssueContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                assetName: p.asset_name ?? "none",
                amount: p.amount?.toString() ?? "0",
              })
            );
            break;

          case "AccountUpdateContract":
            ctx.store.insert(
              new model.AccountUpdateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                accountName: p.account_name ?? "none",
              })
            );
            break;

          case "FreezeBalanceContract":
            ctx.store.insert(
              new model.FreezeBalanceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                frozenBalance: p.frozen_balance?.toString() ?? "0",
                frozenDuration: p.frozen_duration ?? -1,
                resource: p.resource ?? -1,
              })
            );
            break;

          case "UnfreezeBalanceContract":
            ctx.store.insert(
              new model.UnfreezeBalanceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                resource: p.resource ?? -1,
              })
            );
            break;

          case "WithdrawBalanceContract":
            ctx.store.insert(
              new model.WithdrawBalanceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "UnfreezeAssetContract":
            ctx.store.insert(
              new model.UnfreezeAssetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "UpdateAssetContract":
            ctx.store.insert(
              new model.UpdateAssetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                assetName: p.asset_name ?? "none",
              })
            );
            break;

          case "ProposalCreateContract":
            ctx.store.insert(
              new model.ProposalCreateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                parameters: p.parameters ?? [],
              })
            );
            break;

          case "ProposalApproveContract":
            ctx.store.insert(
              new model.ProposalApproveContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                proposalId: p.proposal_id ?? -1,
              })
            );
            break;

          case "ProposalDeleteContract":
            ctx.store.insert(
              new model.ProposalDeleteContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                proposalId: p.proposal_id ?? -1,
              })
            );
            break;

          case "SetAccountIdContract":
            ctx.store.insert(
              new model.SetAccountIdContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                accountId: p.account_id ?? "none",
              })
            );
            break;

          case "CustomContract":
            ctx.store.insert(
              new model.CustomContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                data: p.data ?? "none",
              })
            );
            break;

          case "CreateSmartContract":
            ctx.store.insert(
              new model.CreateSmartContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                originAddress: p.originAddress ?? "none", 
                contractName: p.name ?? "none",
                abi: p.abi ?? "none",
                bytecode: p.bytecode ?? "none",
                originEnergyLimit: p.origin_energy_limit ?? -1,
              })
            );
            break;

          case "TriggerSmartContract":
            ctx.store.insert(
              new model.TriggerSmartContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                contractAddress: p.contract_address ?? "none",
                data: p.data ?? "none",
                callValue: p.call_value?.toString() ?? "0",
              })
            );
            break;

          case "GetContract":
            ctx.store.insert(
              new model.GetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                contractAddress: p.contract_address ?? "none",
              })
            );
            break;

          case "UpdateSettingContract":
            ctx.store.insert(
              new model.UpdateSettingContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                contractAddress: p.contract_address ?? "none",
                settings: p.settings ?? [],
              })
            );
            break;

          case "ExchangeCreateContract":
            ctx.store.insert(
              new model.ExchangeCreateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                firstTokenId: p.first_token_id ?? "none",
                firstTokenBalance: p.first_token_balance?.toString() ?? "0",
                secondTokenId: p.second_token_id ?? "none",
                secondTokenBalance: p.second_token_balance?.toString() ?? "0",
              })
            );
            break;

          case "ExchangeInjectContract":
            ctx.store.insert(
              new model.ExchangeInjectContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                exchangeId: p.exchange_id?.toString() ?? "0",
                tokenId: p.token_id ?? "none",
                quant: p.quant?.toString() ?? "0",
              })
            );
            break;

          case "ExchangeWithdrawContract":
            ctx.store.insert(
              new model.ExchangeWithdrawContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                exchangeId: p.exchange_id?.toString() ?? "0",
                tokenId: p.token_id ?? "none",
                quant: p.quant?.toString() ?? "0",
              })
            );
            break;

          case "ExchangeTransactionContract":
            ctx.store.insert(
              new model.ExchangeTransactionContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                exchangeId: p.exchange_id?.toString() ?? "0",
                tokenId: p.token_id ?? "none",
                quant: p.quant?.toString() ?? "0",
                expected: p.expected?.toString() ?? "0",
              })
            );
            break;

          case "UpdateEnergyLimitContract":
            ctx.store.insert(
              new model.UpdateEnergyLimitContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                contractAddress: p.contract_address ?? "none",
                originEnergyLimit: p.origin_energy_limit?.toString() ?? "0",
              })
            );
            break;

          case "AccountPermissionUpdateContract":
            ctx.store.insert(
              new model.AccountPermissionUpdateContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                owner: p.owner ?? {},
                witness: p.witness ?? {},
                actives: p.actives ?? [],
              })
            );
            break;

          case "ClearABIContract":
            ctx.store.insert(
              new model.ClearABIContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                contractAddress: p.contract_address ?? "none",
              })
            );
            break;

          case "UpdateBrokerageContract":
            ctx.store.insert(
              new model.UpdateBrokerageContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                brokerage: p.brokerage ?? -1,
              })
            );
            break;

          case "ShieldedTransferContract":
            ctx.store.insert(
              new model.ShieldedTransferContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                transparentFromAddress: p.transparent_from_address ?? "none",
                transparentToAddress: p.transparent_to_address ?? "none",
                amount: p.amount?.toString() ?? "0",
                shieldedTransactionData: p.shielded_transaction_data ?? "none",
              })
            );
            break;

          case "MarketSellAssetContract":
            ctx.store.insert(
              new model.MarketSellAssetContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                assetName: p.asset_name ?? "none",
                amount: p.amount?.toString() ?? "0",
              })
            );
            break;

          case "MarketCancelOrderContract":
            ctx.store.insert(
              new model.MarketCancelOrderContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                orderId: p.order_id ?? "none",
              })
            );
            break;

          case "FreezeBalanceV2Contract":
            ctx.store.insert(
              new model.FreezeBalanceV2ContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                frozenBalance: p.frozen_balance?.toString() ?? "0",
                resource: p.resource ?? -1,
              })
            );
            break;

          case "UnfreezeBalanceV2Contract":
            ctx.store.insert(
              new model.UnfreezeBalanceV2ContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "WithdrawExpireUnfreezeContract":
            ctx.store.insert(
              new model.WithdrawExpireUnfreezeContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "DelegateResourceContract":
            ctx.store.insert(
              new model.DelegateResourceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                receiverAddress: p.receiver_address ?? "none",
                balance: p.balance?.toString() ?? "0",
                resource: p.resource ?? -1,
                lock: p.lock ?? false,
              })
            );
            break;

          case "UnDelegateResourceContract":
            ctx.store.insert(
              new model.UnDelegateResourceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                receiverAddress: p.receiver_address ?? "none",
                balance: p.balance?.toString() ?? "0",
                resource: p.resource ?? -1,
              })
            );
            break;

          case "CancelAllUnfreezeV2Contract":
            ctx.store.insert(
              new model.CancelAllUnfreezeV2ContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          case "DelegateResourceContract":
            ctx.store.insert(
              new model.DelegateResourceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                receiverAddress: p.receiver_address ?? "none",
                balance: p.balance?.toString() ?? "0",
                resource: p.resource ?? -1,
                lock: p.lock ?? false,
              })
            );
            break;

          case "UnDelegateResourceContract":
            ctx.store.insert(
              new model.UnDelegateResourceContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
                receiverAddress: p.receiver_address ?? "none",
                balance: p.balance?.toString() ?? "0",
                resource: p.resource ?? -1,
              })
            );
            break;

          case "CancelAllUnfreezeV2Contract":
            ctx.store.insert(
              new model.CancelAllUnfreezeV2ContractTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                ownerAddress: p.owner_address ?? "none",
              })
            );
            break;

          default:
            ctx.store.insert(
              new model.GenericTransaction({
                id: tx.hash,
                blockHash: block.header.hash,
                timestamp: safeDate(tx.timestamp),
                type: tx.type ?? "none",
                contractAddress: tx.contractAddress ?? "none",
                fee: tx.fee?.toString() ?? "0",
                result: tx.contractResult ?? "none",
              })
            );
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
        const topic0 = "0x" + log.topics[0];
        try {
          switch (topic0) {
            case erc20.events.Transfer.topic:
             
              const transfer = erc20.events.Transfer.decode(event);
              
              ctx.store.insert(
                new model.TransferEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  from: transfer.from ?? "none",
                  to: transfer.to ?? "none",
                  value: transfer.value?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.Approval.topic:
              const approval = erc20.events.Approval.decode(event);
              ctx.store.insert(
                new model.ApprovalEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  owner: approval.owner ?? "none",
                  spender: approval.spender ?? "none",
                  value: approval.value?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.DestroyedBlackFunds.topic:
              const destroyed = erc20.events.DestroyedBlackFunds.decode(event);
              ctx.store.insert(
                new model.DestroyedBlackFundsEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  blackListedUser: destroyed._blackListedUser ?? "none",
                  balance: destroyed._balance?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.Issue.topic:
              const issue = erc20.events.Issue.decode(event);
              ctx.store.insert(
                new model.IssueEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  amount: issue.amount?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.Redeem.topic:
              const redeem = erc20.events.Redeem.decode(event);
              ctx.store.insert(
                new model.RedeemEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  amount: redeem.amount?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.Deprecate.topic:
              const deprecate = erc20.events.Deprecate.decode(event);
              ctx.store.insert(
                new model.DeprecateEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  newAddress: deprecate.newAddress ?? "none",
                })
              );
              break;
        
            case erc20.events.AddedBlackList.topic:
              const added = erc20.events.AddedBlackList.decode(event);
              ctx.store.insert(
                new model.AddedBlackListEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  user: added._user ?? "none",
                })
              );
              break;
        
            case erc20.events.RemovedBlackList.topic:
              const removed = erc20.events.RemovedBlackList.decode(event);
              ctx.store.insert(
                new model.RemovedBlackListEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  user: removed._user ?? "none",
                })
              );
              break;
        
            case erc20.events.Params.topic:
              const params = erc20.events.Params.decode(event);
              ctx.store.insert(
                new model.ParamsEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  feeBasisPoints: params.feeBasisPoints?.toString() ?? "0",
                  maxFee: params.maxFee?.toString() ?? "0",
                })
              );
              break;
        
            case erc20.events.Pause.topic:
              ctx.store.insert(
                new model.PauseEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                })
              );
              break;
        
            case erc20.events.Unpause.topic:
              ctx.store.insert(
                new model.UnpauseEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                })
              );
              break;
        
            case erc20.events.OwnershipTransferred.topic:
              const ownership = erc20.events.OwnershipTransferred.decode(event);
              ctx.store.insert(
                new model.OwnershipTransferredEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
                  previousOwner: ownership.previousOwner ?? "none",
                  newOwner: ownership.newOwner ?? "none",
                })
              );
              break;
        
            default:
              ctx.store.insert(
                new model.GenericLogEvent({
                  id: log.id,
                  blockHash: block.header.hash,
                  transactionHash: tx.hash,
                  contractAddress: log.address ?? "none",
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
