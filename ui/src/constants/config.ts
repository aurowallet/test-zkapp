export const NET_CONFIG_TYPE = {
  Mainnet: "Mainnet",
  Devnet: "Devnet",
  Berkeley: "Berkeley",
  Testworld2: "Testworld2",
  Unknown: "Unknown",
};

export const EXPLORER_URL = {
  [NET_CONFIG_TYPE.Mainnet]: "https://minascan.io/mainnnet",
  [NET_CONFIG_TYPE.Devnet]: "https://minascan.io/devnet",
  [NET_CONFIG_TYPE.Berkeley]: "https://minascan.io/testworld2",
};


export const NetConfigMap = {
  [NET_CONFIG_TYPE.Berkeley]: {
    name: NET_CONFIG_TYPE.Berkeley,
    gql: "https://proxy.berkeley.minaexplorer.com",
    explorer: "https://berkeley.minaexplorer.com",
  },
  [NET_CONFIG_TYPE.Testworld2]: {
    name: NET_CONFIG_TYPE.Testworld2,
    gql: "https://proxy.testworld.minaexplorer.com",
    explorer: "https://testworld.minaexplorer.com",
  },
};
