import React, { useState, useEffect } from "react";
import Web3 from "web3";
import {
  Button,
  Layout,
  Typography,
  message as antdMessage,
  Divider,
} from "antd";
import { WalletOutlined, DisconnectOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import "./App.css"; // Import custom styles if needed
import lottery from "./assets/lottery.jpg";
import { AwesomeButton } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPlayerCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "manager",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pickWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "players",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const contractAddress = "0xfF623f9184D0e49c4Bd442FEc4Fdb272177ead7b";
const managerAddress = "0x0b0D3cde7bFf54B935095C2078A1F23c52A0D26b";

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [players, setPlayers] = useState(0);
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("Let the game begin...");

  useEffect(() => {
    loadWeb3();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      const lotteryContract = new web3Instance.eth.Contract(
        abi,
        contractAddress
      );
      setContract(lotteryContract);
      fetchContractDetails(web3Instance, lotteryContract);
    } else {
      setMessage("Please install MetaMask to use this app.");
    }
  };

  const fetchContractDetails = async (web3Instance, contractInstance) => {
    if (!web3Instance || !contractInstance) {
      console.error("Web3 or Contract is not initialized.");
      return;
    }

    try {
      const playersCount = await contractInstance.methods
        .getPlayerCount()
        .call();
      const playersCountNumber = Number(playersCount); // Convert BigInt to number
      setPlayers(playersCountNumber);

      const contractBalance = await contractInstance.methods
        .getBalance()
        .call();
      const contractBalanceInEther = web3Instance.utils.fromWei(
        contractBalance.toString(),
        "ether"
      );
      setBalance(contractBalanceInEther);
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setMessage("Failed to retrieve contract details.");
    }
  };

  const enterLottery = async () => {
    if (!web3 || !contract) {
      antdMessage.error("Please connect your wallet first.");
      return;
    }

    setMessage("Entering the lottery...");
    try {
      await web3.eth.sendTransaction({
        from: account,
        to: contractAddress,
        value: web3.utils.toWei("0.001", "ether"),
        gas: 300000,
      });
      setMessage("You have been entered into the lottery!");
      await fetchContractDetails(web3, contract); // Update player count and balance
    } catch (error) {
      console.log("hello", error);
      if (error.code === 4001) {
        setMessage("Transaction was rejected by the user.");
      } else {
        console.error("Error entering lottery:", error);
        setMessage("Transaction failed. Please try again.");
      }
    }
  };

  const pickWinner = async () => {
    if (!web3 || !contract) {
      antdMessage.error("Please connect your wallet first.");
      return;
    }

    setMessage("Picking a winner...");
    try {
      await contract.methods.pickWinner().send({
        from: account,
        gas: 300000,
      });
      setMessage("A winner has been picked!");
      await fetchContractDetails(web3, contract); // Update player count and balance
    } catch (error) {
      console.error("Error picking a winner:", error);
      setMessage("Transaction failed. Please try again.");
    }
  };

  const handleConnect = () => {
    if (!account) loadWeb3();
  };

  const handleDisconnect = () => {
    setAccount("");
    setWeb3(null);
    setContract(null);
    setPlayers(0);
    setBalance(0);
    setMessage("Disconnected. Please connect your wallet.");
  };

  const isManager = account.toLowerCase() === managerAddress.toLowerCase();
  const isConnected = !!account;

  return (
    <Layout className="min-h-screen bg-gray-100">
      <Header className="bg-gray-800 p-4 flex items-center">
        <h1 className="text-3xl text-orange-500 font-semibold">Lottery DApp</h1>
        {isConnected ? (
          <Button
            onClick={handleDisconnect}
            icon={<DisconnectOutlined />}
            type="primary"
            className="ml-auto"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            icon={<WalletOutlined />}
            type="primary"
            className="ml-auto"
          >
            Connect Wallet
          </Button>
        )}
      </Header>
      <Content
        className="flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${lottery})`, backgroundSize: "cover" }}
      >
        <div className="max-w-md w-full bg-white bg-opacity-95 p-8 rounded-lg shadow-lg">
          <Title level={2} className="text-center mb-6 text-2xl">
            Lottery Contract
          </Title>
          <Paragraph className="mb-4">
            Welcome to the Lottery DApp! Each account can enter the lottery by
            committing
            <strong className="text-orange-500"> 0.001 ETH</strong>. The owner
            of the contract can pick a winner randomly when there are at least
            three participants.
          </Paragraph>
          <Paragraph className="mb-4">Account: {account}</Paragraph>
          <Paragraph className="mb-4">
            Players participating: {players}
          </Paragraph>
          <Paragraph className="mb-4">
            Contract balance: {balance} ETH
          </Paragraph>

          <Divider className="my-4" />

          <AwesomeButton
            type="primary"
            onPress={enterLottery}
            disabled={!isConnected}
            className="w-full mb-4"
          >
            Enter Lottery
          </AwesomeButton>

          <AwesomeButton
            type="secondary"
            onPress={pickWinner}
            className="w-full mb-4"
            disabled={!isConnected || !isManager}
          >
            Pick a Winner
          </AwesomeButton>

          <Divider className="my-4" />

          <Title level={4} className="text-center text-red-500">
            {message}
          </Title>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
