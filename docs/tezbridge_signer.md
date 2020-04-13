---
title: TezBridge Signer
author: Simon Boissonneault-Robert
---

## Usage

You first need to include https://www.tezbridge.com/plugin.js in your application to use this signer

```js
import { TezBridgeSigner } from '@dune-network/tezbridge-signer'
import { Tezos } from '@dune-network/taquito'

Tezos.setProvider({signer: new TezBridgeSigner()})
```

For more information on how to use TezBridge see https://docs.tezbridge.com/
