import { base58, base64, utf8 } from '@scure/base';
import { describe, should } from 'micro-should';
import { deepStrictEqual, throws } from 'node:assert';
import * as idl from '../src/idl/index.ts';
// import fs from 'node:fs';
// import { createFromRoot } from 'codama';
// import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
// import anchorIdl from './token_metadata.json' with { type: 'json' };
// const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));
// fs.writeFileSync('tokenMetadata.json', codama.getJson());
import codamaIdl from './vectors/idl/tokenMetadata.json' with { type: 'json' };

// Testing conversion from anchor v0
describe('TokenMetadata', () => {
  should('basic', async () => {
    const metadata = base64.decode(
      'BHlZUWfaSAxa4TRFAdIRt3NjQOP73wDs3mO2TciKzC8cvAfFbmCtPT8Xc4LqxlSPuh/TLP2QygKz58+hhf3Oc5ggAAAAQm9uawAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAQm9uawAAAAAAAMgAAABodHRwczovL2Fyd2VhdmUubmV0L1FQQzZGWWRVbi0zVjh5dEZOdW9DUzg1UzJ0SEF1aURibGg2dTNDSVpMc3cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAf8BAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
    );
    // Get metadata PDA
    const BONK = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
    const meta = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
    const seeds = [utf8.decode('metadata'), base58.decode(meta), base58.decode(BONK)];
    const metaplexPDA = idl.programAddress(meta, ...seeds);
    // const replay = mftch.replayable(fetch, {}, { getKey, offline: false });
    // const ftch = mftch.ftch(replay, { concurrencyLimit: 1 });
    // const archive = new ArchiveNodeProvider(mftch.jsonrpc(ftch, URL, { batchSize: 5 }));
    // const metadata2 = (await archive.accountInfo(metaplexPDA)).data

    const TokenMetadata = idl.defineIDL(codamaIdl);
    // NOTE: this won't work even with skipping unread bytes, because there is no descriminators in this IDL!
    throws(() =>
      TokenMetadata.tokenMetadata.accounts.decoder(metadata, {
        allowUnreadBytes: true,
      })
    );
    deepStrictEqual(
      TokenMetadata.tokenMetadata.program.accounts.coders.metadata.decode(metadata, {
        allowUnreadBytes: true,
      }),
      {
        key: { TAG: 'metadataV1', data: undefined },
        updateAuthority: '9AhKqLR67hwapvG8SA2JFXaCshXc9nALJjpKaHZrsbkw',
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        data: {
          name: 'Bonk',
          symbol: 'Bonk',
          uri: 'https://arweave.net/QPC6FYdUn-3V8ytFNuoCS85S2tHAuiDblh6u3CIZLsw',
          sellerFeeBasisPoints: 0,
          creators: undefined,
        },
        primarySaleHappened: true,
        isMutable: true,
        editionNonce: 255,
        tokenStandard: { TAG: 'fungible', data: undefined },
        collection: undefined,
        uses: undefined,
        collectionDetails: undefined,
        programmableConfig: undefined,
      }
    );
  });
});

should.runWhen(import.meta.url);
