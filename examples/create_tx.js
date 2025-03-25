import * as sol from '../index.js';

const privKey = new Uint8Array(32).fill(0x01);
// Get address of private key
const address = sol.getAddress(privKey);
// AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9

// Format private key
const privFormatted = sol.formatPrivate(privKey);
// 2AXDGYSE4f2sz7tvMMzyHvUfcoJmxudvdhBcmiUSo6iuCXagjUCKEQF21awZnUGxmwD4m9vGXuC3qieHXJQHAcT

// Simple tx (transfer some sol's from one account to another)
const toAddress = 'FDwkzWGxx6LfCfzcmVVLEk3QUMxNhuFuKEMRwzR4Dtys';
const blockhash = 'J2BjKU6L83eehHVgoze6uTXGCBu6nbxsqEro9QvWpU52';
const amount = '10.1';
const tx0 = sol.createTx(address, toAddress, amount, blockhash);
// AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDiojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1zTVICVf7+to6zQ/+XautpF+KSSoZ7ESTxv3rg8xPqyXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/ORj/WtXHGLCh9wC0eGkf26qTFR5x3nCqwXXmoVtZb0BAgIAAQwCAAAAAMUBWgIAAAA=
const [txHash0, signedTx0] = sol.signTx(privKey, tx0);
/*
{
txHash0: '3wL4PdgBr3J2r4uuUrf4MU7HhgrJg6re2YRBeAwsZpYZRHgSgUAJymLRu6GcnKk7ZuR3F5UgPRTNj1mbzv966PTy',
signedTx0: 'AZLiibj05SPRhNU/o3ntK/7+aNQ8H/3HGLdh6zjxZKdyrKJEhjUjWDlMnEF2x0U/8JsKYsMMiYvQShkuNfpYdAwBAAEDiojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1zTVICVf7+to6zQ/+XautpF+KSSoZ7ESTxv3rg8xPqyXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/ORj/WtXHGLCh9wC0eGkf26qTFR5x3nCqwXXmoVtZb0BAgIAAQwCAAAAAMUBWgIAAAA='
}
*/
console.log('T', { txHash0, signedTx0 });
