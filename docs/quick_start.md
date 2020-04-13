---
title: Quick start
author: Simon Boissonneault-Robert
---

## Installing the library

> For quick-start, you may also like to try out our template/boilerplate app [here][boilerplate]

The following instructions assume you have a project already created, and you have `npm` installed and operable.

```sh
npm install @dune-network/taquito
```

## Import the library in your project

You can access Tezos Toolkit in one of two ways.

### Import `Tezos` (a singleton object) from `@dune-network/taquito`

```js
import { Tezos } from '@dune-network/taquito';
```

### Import `TezosToolkit` from `@dune-network/taquito` and instantiate it

This approach is only required if you need to instantiate more than one toolkit.

```js
import { TezosToolkit } from '@dune-network/taquito';

const tezos = new TezosToolkit();
```

## Configuration

### Changing the underlying rpc

```js
import { Tezos } from '@dune-network/taquito';

Tezos.setProvider({ rpc: 'your_rpc' });
```

### Changing the underlying signer

```js
import { Tezos } from '@dune-network/taquito';
import { TezBridgeSigner } from '@dune-network/tezbridge-signer';

Tezos.setProvider({ signer: new TezBridgeSigner() });
```

## Example

### Get balance

```js live noInline
Tezos.setProvider({ rpc: 'https://api.tez.ie/rpc/mainnet' });
Tezos.tz
  .getBalance('tz1NAozDvi5e7frVq9cUaC3uXQQannemB8Jw')
  .then(balance => println(`${balance.toNumber() / 1000000} ꜩ`))
  .catch(error => println(JSON.stringify(error)));
```

### Import a key

This will import your private key in memory and sign operations using this key.

#### Private key

```js
Tezos.importKey('p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1');
```

#### Faucet Key

A faucet key can be generated at https://faucet.tzalpha.net/

```js
const FAUCET_KEY = {
  mnemonic: [
    'cart',
    'will',
    'page',
    'bench',
    'notice',
    'leisure',
    'penalty',
    'medal',
    'define',
    'odor',
    'ride',
    'devote',
    'cannon',
    'setup',
    'rescue',
  ],
  secret: '35f266fbf0fca752da1342fdfc745a9c608e7b20',
  amount: '4219352756',
  pkh: 'tz1YBMFg1nLAPxBE6djnCPbMRH5PLXQWt8Mg',
  password: 'Fa26j580dQ',
  email: 'jxmjvauo.guddusns@tezos.example.org',
};

Tezos.importKey(
  FAUCET_KEY.email,
  FAUCET_KEY.password,
  FAUCET_KEY.mnemonic.join(' '),
  FAUCET_KEY.secret
);
```

### Transfer

The transfer operation requires a configured signer. In this example we will use a private key that we will get from a service that was implemented for demonstration purposes and should only be used for testing and development.

```js live noInline
const amount = 2;
const address = 'tz1h3rQ8wBxFd8L9B3d7Jhaawu6Z568XU3xY';

println(`Transfering ${amount} ꜩ to ${address}...`);
Tezos.contract.transfer({ to: address, amount: amount })
  .then(op => {
    println(`Waiting for ${op.hash} to be confirmed...`);
    return op.confirmation(1).then(() => op.hash);
  })
  .then(hash => println(`Operation injected: https://carthagenet.tzstats.com/${hash}`))
  .catch(error => println(`Error: ${error} ${JSON.stringify(error, null, 2)}`));
```

### Interact with a smart contract

Calling smart contract operations require a configured signer, in this example we will use a faucet key. The source for the smart contract [KT1JVErLYTgtY8uGGZ4mso2npTSxqVLDRVbC][smart_contract_on_better_call_dev] used in this example can be found in a [Ligo Web IDE][smart_contract_source].

```js live noInline
Tezos.contract.at('KT1JVErLYTgtY8uGGZ4mso2npTSxqVLDRVbC')
  .then(contract => {
    const i = 7;

    println(`Incrementing storage value by ${i}...`);
    return contract.methods.increment(i).send();
  })
  .then(op => {
    println(`Waiting for ${op.hash} to be confirmed...`);
    return op.confirmation(1).then(() => op.hash);
  })
  .then(hash => println(`Operation injected: https://carthagenet.tzstats.com/${hash}`))
  .catch(error => println(`Error: ${JSON.stringify(error, null, 2)}`));
```

[boilerplate]: https://github.com/ecadlabs/taquito-boilerplate
[smart_contract_source]: https://ide.ligolang.org/p/CelcoaDRK5mLFDmr5rSWug
[smart_contract_on_better_call_dev]: https://better-call.dev/carthage/KT1JVErLYTgtY8uGGZ4mso2npTSxqVLDRVbC/operations
