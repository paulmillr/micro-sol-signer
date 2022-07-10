import * as sol from '../index.js';

// Check if account is valid token account
function isValidTokenAccount(mint, info, owner) {
  if (!info) return false;
  if (info.owner !== sol.TOKEN_PROGRAM) return false;
  try {
    const data = sol.TokenAccount.decode(info.data);
    if (data.mint !== mint) return false;
    if (data.state !== 'initialized') return false;
    if (owner && data.owner !== owner) return false;
    return true;
  } catch (e) {
    return false;
  }
}

async function solAccountInfo(address) {
  // Network code, outside of scope of this package

  // Call rpc with getAccountInfo
  const res = await rpcCall('getAccountInfo', address, {
    encoding: 'base64',
    commitment: 'confirmed',
  });
  if (res.value === null) return undefined;
  const [data, encoding] = res.value.data;
  if (encoding !== 'base64') throw new Error(`SOL: invalid data encoding=${encoding}`);
  return {
    lamports: BigInt(res.value.lamports),
    owner: res.value.owner,
    rentEpoch: res.value.rentEpoch,
    data: base64.decode(data),
    exec: !!res.value.executable,
  };
}

async function createTx(
  fromAddress, // our address (solana account), from which we will send tokens
  toAddress, // user provided address to send tokens in.
  tokenContract, // token contract address
  decimals, // decimals of contract
  amount, // string with amount of tokens to send
  blockhash // current block hash
) {
  // Derive token account from 'from' address
  const fromTokenAccount = sol.tokenAddress(tokenContract, fromAccount);
  // Common token options
  const tokenOpt = {
    source: fromTokenAccount,
    amount: sol.parseDecimal(amount, decimals),
    decimals,
    mint: tokenContract,
    owner: fromAddress, // owner of source
  };
  // If address is on curve, it is probably not 'associated token contract'
  if (sol.isOnCurve(toAddress)) {
    // Derive token account from solana account
    const toTokenAddress = sol.tokenAddress(tokenContract, toAddress);
    const [addrInfo, assocInfo] = await Promise.all([
      solAccountInfo(toAddress),
      solAccountInfo(toTokenAddress),
    ]);
    // toTokenAddress -- is valid token account, we can send here
    if (isValidTokenAccount(tokenContract, assocInfo, toAddress)) {
      // Associted account is ok, send to toTokenAddress
      return sol.createTxComplex(
        fromAddress,
        [sol.token.transferChecked({ ...tokenOpt, destination: toTokenAddress })],
        blockhash
      );
      // toTokenAddress is not valid token account, but toAddress is (even if it is on-curve)
    } else if (isValidTokenAccount(tokenContract, addrInfo)) {
      // account is actually token account, send to address. But since we don't know
      return sol.createTxComplex(
        fromAddress,
        [sol.token.transferChecked({ ...tokenOpt, destination: toAddress })],
        blockhash
      );
      // There is no valid token accounts, but toAddress is basic solana account and we can create
      // token account for it
    } else if (addrInfo && addrInfo.owner === sol.SYS_PROGRAM) {
      // try to create assoc address and send tokens to it
      return sol.createTxComplex(
        fromAddress,
        [
          sol.associatedToken.create({
            source: fromAddress,
            account: toTokenAddress,
            wallet: toAddress,
            mint: tokenContract,
          }),
          sol.token.transferChecked({ ...tokenOpt, destination: toTokenAddress }),
        ],
        blockhash
      );
    } else {
      // We probably can create associated account here, even if account doesn't exists, but it is probably typo and funds will be lost
      throw new Error(
        `SOL.createTx: invalid token destination address, account=${toAddress} doesn't exists, associated=${assocAddress} doesn't exists`
      );
    }
  } else {
    // Address is off-curve: which means it should be associated token account
    const info = await solAccountInfo(toAddress);
    // We cannot create associated address here, since given address is already off-curve
    if (!isValidTokenAccount(tokenContract, info))
      throw new Error(
        `SOL.createTx: invalid token destination address=${toAddress}, off-curve and invalid`
      );
    // Valid token addr, send to it. Send to address
    return sol.createTxComplex(
      fromAddress,
      [sol.token.transferChecked({ ...tokenOpt, destination: toAddress })],
      blockhash
    );
  }
  throw new Error('SOL.createTx: unexpected case');
}
