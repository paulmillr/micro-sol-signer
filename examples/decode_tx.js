import { base64 } from '@scure/base';
import * as sol from '../index.js';

// Random USDT tx from explorer:
// https://explorer.solana.com/tx/5Nnhjv1GVB8T1k8MguUGHQw5zQQQsWET1f1zzj8azRhnVoYQPoZPtkscPCKy6FisP2eVWehjU1EYV8zywqKm5if4
const tx =
  'Atrba9P4rJ4tA3fMXioF+LBR5Y397TCaCC7o/JsViIFxDQ+FOpW2/I+DGMtapWPmrRJ3KDEaYa21YbpUcXaygQPKXDfudpRNZKsMsjhhH018U2YKTAJoqu6Jr1jASfnV98/65boYyPzPujo4YMKnIaCjrt1EsvnPNCuoBMXUEzYAAgEECc20MANIMI92j1eVfOiH5WQ691HznE9ZeQfjeXpDNm0eH5z5eohWokD+6H+jjnZ/KFqkCmlEdPrk6HCx+mOgjTAJUM/3r5vR1DjJnZhT6PQK3Z32pIe8MzDmPxe8Ttzy2CTxiTfFaNQeAkRJCefcB5JJGeb/Qxrj4dpxv8Kv9gClJ544V5wdVgmhBbCFO1kSIv6OaEUizyYdqhTUiO8w8XsGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAM4BDmCv7bInF71jGS9UFFo/llozu4LSxwKess4eIIJkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYUpqsC9KfFD7lsris1C7YZkNRdSH5qix9nMo2igoP0yAgcDAgUBBAQAAAAIBAMGBAAKDJSDxgMPAAAABg==';
const decodedTx = sol.Transaction.decode(base64.decode(tx));

console.log(decodedTx);
/*
{
  msg: {
    feePayer: 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB',
    blockhash: '9xp5Jz2v7ZsE3Xn5SVGkRisjo7h16vzF1ducwhWnc5n9',
    instructions: [ [Object], [Object] ]
  },
  signatures: {
    EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB: Uint8Array(64),
    '38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom': Uint8Array(64),
  }
}
*/

console.log(
  decodedTx.msg.instructions.map((i) => {
    return sol.parseInstruction(i, {
      ...sol.COMMON_TOKENS,
      // You can add custom tokens here if needed
    });
  })
);
/*
[
  {
    type: 'advanceNonce',
    info: {
      nonceAccount: 'dN98UQCp6Hq9kedJKEczHt5B53tsC8eENv9cGEVwvuD',
      nonceAuthority: '38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom'
    },
    hint: 'Consume nonce in nonce account=dN98UQCp6Hq9kedJKEczHt5B53tsC8eENv9cGEVwvuD (owner: 38QU8LKVK1Ew5uzsqttamNTTFxvnfzgi2ACQvj3ekuom)'
  },
  {
    type: 'transferChecked',
    info: {
      amount: 64487850900n,
      decimals: 6,
      source: '3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4',
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      destination: '3feqC1fmo5YHMh2iw7X9kGE9F8P147hiiDQqC5xtSbpN',
      owner: 'EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB'
    },
    hint: 'Transfer 64487.8509 USDT from token account=3VDHywae15vgbG2euNPpwoHTEr2eyGLuS6EoF74kDkp4 of owner=EqywLUZcm73PSWri93X3M5TN62iFMsUPMjvWYUq89dKB to 3feqC1fmo5YHMh2iw7X9kGE9F8P147hiiDQqC5xtSbpN'
  }
]
*/
