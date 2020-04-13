import { Tezos } from '@dune-network/taquito'


async function example() {
    const provider = 'https://api.tez.ie/rpc/carthagenet';
    Tezos.setProvider({ rpc: provider });
    try {
        const op = await Tezos.tz.activate("tz1ZfrERcALBwmAqwonRXYVQBDT9BjNjBHJu", "161d907951bf5594bedb1d70bb03c938d63c22be")
        console.log('Awaiting confirmation...');
        await op.confirmation();
        console.log(op.hash, op.includedInBlock);
    } catch (ex) {
        console.log(ex)
    }
}

// tslint:disable-next-line: no-floating-promises
example();
