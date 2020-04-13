import { ParameterSchema, Schema } from '@dune-network/michelson-encoder';
import { EntrypointsResponse, ScriptResponse } from '@dune-network/rpc';
import { ContractProvider } from './interface';
import { InvalidParameterError } from './errors';
import { TransferParams } from '../operations/types';

interface SendParams {
  fee?: number;
  storageLimit?: number;
  gasLimit?: number;
  amount: number;
  source?: string;
  mutez?: boolean;
}

// Ensure that all parameter that are not in SendParams are defined
type ExplicitTransferParams = Required<Omit<TransferParams, keyof SendParams>> & SendParams;

const DEFAULT_SMART_CONTRACT_METHOD_NAME = 'main';

/**
 * @description Utility class to send smart contract operation
 */
export class ContractMethod {
  constructor(
    private provider: ContractProvider,
    private address: string,
    private parameterSchema: ParameterSchema,
    private name: string,
    private args: any[],
    private isMultipleEntrypoint = true,
    private isAnonymous = false
  ) {}

  /**
   * @description Get the schema of the smart contract method
   */
  get schema() {
    return this.isAnonymous
      ? this.parameterSchema.ExtractSchema()[this.name]
      : this.parameterSchema.ExtractSchema();
  }

  /**
   *
   * @description Send the smart contract operation
   *
   * @param Options generic operation parameter
   */
  send(params: Partial<SendParams> = {}) {
    return this.provider.transfer(this.toTransferParams(params));
  }

  /**
   *
   * @description Create transfer params to be used with TezosToolkit.contract.transfer methods
   *
   * @param Options generic transfer operation parameters
   */
  toTransferParams({
    fee,
    gasLimit,
    storageLimit,
    source,
    amount = 0,
    mutez = false,
  }: Partial<SendParams> = {}): TransferParams {
    const fullTransferParams: ExplicitTransferParams = {
      to: this.address,
      amount,
      fee,
      mutez,
      source,
      gasLimit,
      storageLimit,
      parameter: {
        entrypoint: this.isMultipleEntrypoint ? this.name : 'default',
        value: this.isAnonymous
          ? this.parameterSchema.Encode(this.name, ...this.args)
          : this.parameterSchema.Encode(...this.args),
      },
    };
    return fullTransferParams;
  }
}

const validateArgs = (args: any[], schema: ParameterSchema, name: string) => {
  const sigs = schema.ExtractSignatures();

  if (!sigs.find((x: any[]) => x.length === args.length)) {
    throw new InvalidParameterError(name, sigs, args);
  }
};

/**
 * @description Smart contract abstraction
 */
export class Contract {
  /**
   * @description Contains methods that are implemented by the target Tezos Smart Contract, and offers the user to call the Smart Contract methods as if they were native TS/JS methods.
   * NB: if the contract contains annotation it will include named properties; if not it will be indexed by a number.
   *
   */
  public methods: { [key: string]: (...args: any[]) => ContractMethod } = {};

  public readonly schema: Schema;

  public readonly parameterSchema: ParameterSchema;

  constructor(
    public readonly address: string,
    public readonly script: ScriptResponse,
    private provider: ContractProvider,
    private entrypoints: EntrypointsResponse
  ) {
    this.schema = Schema.fromRPCResponse({ script: this.script });
    this.parameterSchema = ParameterSchema.fromRPCResponse({ script: this.script });
    this._initializeMethods(address, provider, this.entrypoints.entrypoints);
  }

  private _initializeMethods(
    address: string,
    provider: ContractProvider,
    entrypoints: {
      [key: string]: object;
    }
  ) {
    const parameterSchema = this.parameterSchema;
    const keys = Object.keys(entrypoints);
    if (parameterSchema.isMultipleEntryPoint) {
      keys.forEach(smartContractMethodName => {
        const method = function(...args: any[]) {
          const smartContractMethodSchema = new ParameterSchema(
            entrypoints[smartContractMethodName]
          );

          validateArgs(args, smartContractMethodSchema, smartContractMethodName);

          return new ContractMethod(
            provider,
            address,
            smartContractMethodSchema,
            smartContractMethodName,
            args
          );
        };
        this.methods[smartContractMethodName] = method;
      });

      // Deal with methods with no annotations which were not discovered by the RPC endpoint
      // Methods with no annotations are discovered using parameter schema
      const anonymousMethods = Object.keys(parameterSchema.ExtractSchema()).filter(
        key => Object.keys(entrypoints).indexOf(key) === -1
      );

      anonymousMethods.forEach(smartContractMethodName => {
        const method = function(...args: any[]) {
          validateArgs(
            [smartContractMethodName, ...args],
            parameterSchema,
            smartContractMethodName
          );
          return new ContractMethod(
            provider,
            address,
            parameterSchema,
            smartContractMethodName,
            args,
            false,
            true
          );
        };
        this.methods[smartContractMethodName] = method;
      });
    } else {
      const smartContractMethodSchema = this.parameterSchema;
      const method = function(...args: any[]) {
        validateArgs(args, parameterSchema, DEFAULT_SMART_CONTRACT_METHOD_NAME);
        return new ContractMethod(
          provider,
          address,
          smartContractMethodSchema,
          DEFAULT_SMART_CONTRACT_METHOD_NAME,
          args,
          false
        );
      };
      this.methods[DEFAULT_SMART_CONTRACT_METHOD_NAME] = method;
    }
  }

  /**
   * @description Return a friendly representation of the smart contract storage
   */
  public storage<T>() {
    return this.provider.getStorage<T>(this.address, this.schema);
  }

  /**
   *
   * @description Return a friendly representation of the smart contract big map value
   *
   * @param key BigMap key to fetch
   *
   * @deprecated getBigMapKey has been deprecated in favor of getBigMapKeyByID
   *
   * @see https://tezos.gitlab.io/api/rpc.html#get-block-id-context-contracts-contract-id-script
   */
  public bigMap(key: string) {
    // tslint:disable-next-line: deprecation
    return this.provider.getBigMapKey(this.address, key, this.schema);
  }
}
