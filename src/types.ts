export type Hex = `0x${string}`;

export interface RpcEndpoint {
  name: string;
  url: string;
  family: string;
}

export interface HeightPin {
  height: number;
  blockHash: Hex;
  stateRoot?: Hex;
}

export interface ChainPin {
  chainId: number;
  deniedHostSubstrings: string[];
  heights: HeightPin[];
}

export interface RpcCallResult<T> {
  endpoint: RpcEndpoint;
  ok: boolean;
  result?: T;
  error?: string;
  ms: number;
}

export interface BlockHeaderView {
  number: number;
  hash: Hex;
  parentHash: Hex;
  stateRoot: Hex;
  timestamp: number;
}

export interface FamilySplit {
  height: number;
  byHash: Record<string, string[]>;
  pinned?: Hex;
  matchesPin: boolean;
}

export interface NonceScan {
  address: Hex;
  byEndpoint: Array<{
    name: string;
    family: string;
    transactionCount?: number;
    error?: string;
  }>;
  uniqueCounts: number[];
  agree: boolean;
}

export interface EvidencePack {
  generatedAt: string;
  subject?: Hex;
  pin: ChainPin;
  liveChainIds: RpcCallResult<number>[];
  headers: Array<{
    height: number;
    samples: RpcCallResult<BlockHeaderView | null>[];
  }>;
  splits: FamilySplit[];
  nonce?: NonceScan;
}
