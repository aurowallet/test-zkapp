export const NET_CONFIG_TYPE:{ [key: string]: string } = {
  Mainnet: "Mainnet",
  Devnet: "Devnet",
  Berkeley: "Berkeley",
  Testworld2: "Testworld2",
};


export const NetConfigMap = {
  [NET_CONFIG_TYPE.Berkeley]: {
    name: NET_CONFIG_TYPE.Berkeley,
    gql: "https://proxy.berkeley.minaexplorer.com",
  },
  [NET_CONFIG_TYPE.Testworld2]: {
    name: NET_CONFIG_TYPE.Testworld2,
    gql: "https://proxy.testworld.minaexplorer.com",
  },
};

export const GITHUB_URL = 'https://github.com/aurowallet/test-zkapp'