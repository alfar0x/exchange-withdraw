// symbol - [key]
// network - networks[key]
// chain - network.id

const tokens = {
  era: {
    eth: {
      symbol: "ETH",
      network: "zkSync Era",
      chain: "ETH-zkSync Era",
    },
  },
  matic: {
    matic: {
      symbol: "MATIC",
      network: "MATIC",
      chain: "MATIC-Polygon",
    },
  },
  apt: {
    apt: {
      symbol: "APT",
      network: "APT",
      chain: "APT-Aptos",
    },
  },
};

export default tokens;
