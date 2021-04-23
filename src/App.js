import React, { PureComponent } from 'react';
import { Alert, Button, Space, Spin, Typography } from 'antd';
import 'antd/dist/antd.css';
import './App.css';

import Web3 from 'web3';
import Counter from './abis/Counter.json';
import networks from './truffle-networks';

const { Title } = Typography;

class App extends PureComponent {
  state = {
    account: '0x0',
    balance: '0',
    count: 0,
    loading: false,
    hasError: false,
    errorMessage: '',
    errorDescription: ''
  }

  async componentDidMount() {
    this.setState({ loading: true });
    try {
      // Get network provider and web3 instance.
      this.web3 = await this.getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      const envNetworkType = process.env.REACT_APP_NETWORK_TYPE;
      const networkType = await this.web3.eth.net.getNetworkType();
      if (networkType !== envNetworkType) {
        if (!(envNetworkType === 'development' && networkType === 'private')) {
          this.setState({
            loading: false,
            hasError: true,
            errorMessage: 'Error in Ethereum Network Type',
            errorDescription: `Current account is of ${networkType} network. Please select account for ${process.env.REACT_APP_NETWORK_TYPE} network.`
          });
          return;
        }
      }
      const networkId = await this.web3.eth.net.getId();

      // load wallet balance
      if (typeof accounts[0] !== 'undefined') {
        const balance = await this.web3.eth.getBalance(accounts[0]);
        this.setState({
          account: accounts[0],
          balance
        });
      } else {
        window.alert('Please login with MetaMask');
      }

      // load contracts
      this.contract = new this.web3.eth.Contract(Counter.abi, Counter.networks[networkId].address);

      // Check whether you already have voted
      const count = await this.contract.methods.getCount().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        loading: false,
        account: accounts[0],
        count
      });
    } catch (error) {
      this.setState({ loading: false }, () => {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      });
    }
  }

  getWeb3 = () => new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener('load', () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          window.ethereum.enable().then(data => {
            // Acccounts now exposed
            resolve(web3);
          });
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const web3 = new Web3(this.getProvider());
        console.log('No web3 instance injected, using Local web3.');
        resolve(web3);
      }
    });
  })

  getProvider() {
    if (process.env.REACT_APP_NETWORK_TYPE === 'development') {
      return new Web3.providers.HttpProvider(`http://${networks.development.host}:${networks.development.port}`);
    }
    return networks[process.env.REACT_APP_NETWORK_TYPE].provider();
  }

  onIncrement = async () => {
    // if gas and gasPrice is insufficient, "increment" method may be failed
    const tx = this.contract.methods.increment();
    const gas = await tx.estimateGas({
      from: this.state.account
    });
    const gasPrice = await this.web3.eth.getGasPrice();
    tx.send({
      gas,
      gasPrice,
      from: this.state.account
    }).on('transactionHash', (hash) => {
      console.log('Hash');
      // Network operation starts here
      this.setState({ loading: true });
    }).on('receipt', async (receipt) => {
      console.log('Receipt');
      const count = await this.contract.methods.getCount().call();
      const balance = await this.web3.eth.getBalance(this.state.account);
      this.setState({
        loading: false,
        count,
        balance
      });
    }).on('confirmation', (confirmationNumber, receipt) => {
      console.log('Confirmed');
    }).on('error', (err) => {
      console.error(err);
    });
  }

  onDecrement = async () => {
    // if gas and gasPrice is insufficient, "decrement" method may be failed
    const tx = this.contract.methods.decrement();
    const gas = await tx.estimateGas({
      from: this.state.account
    });
    const gasPrice = await this.web3.eth.getGasPrice();
    tx.send({
      gas,
      gasPrice,
      from: this.state.account
    }).on('transactionHash', (hash) => {
      console.log('Hash');
      // Network operation starts here
      this.setState({ loading: true });
    }).on('receipt', async (receipt) => {
      console.log('Receipt');
      const count = await this.contract.methods.getCount().call();
      const balance = await this.web3.eth.getBalance(this.state.account);
      this.setState({
        loading: false,
        count,
        balance
      });
    }).on('confirmation', (confirmationNumber, receipt) => {
      console.log('Confirmed');
    }).on('error', (err) => {
      console.error(err);
    });
  }

  onGetCount = () => {
    this.setState({ loading: true }, () => {
      this.contract.methods.getCount().call().then(count => {
        this.setState({
          loading: false,
          count
        });
      });
    });
  }

  render = () => (
    <div className="App">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {this.state.hasError && (
          <Alert
            type="warning"
            message={this.state.errorMessage}
            description={this.state.errorDescription}
            closable
            onClose={() => this.setState({ hasError: false })}
          />
        )}
        <Title level={3}>Counter dApp</Title>
        <Title level={5}>Wallet Account: {this.state.account}</Title>
        <Title level={5}>Wallet Balance: {this.web3 && this.web3.utils.fromWei(this.state.balance)} ETH</Title>
        <Title level={5}>{this.state.count}</Title>
        <Button type="primary" onClick={this.onIncrement}>INCREMENT</Button>
        <Button type="primary" onClick={this.onDecrement}>DECREMENT</Button>
        <Button type="primary" onClick={this.onGetCount}>GET COUNT</Button>
      </Space>
      {this.state.loading && (
        <div className="spin-container">
          <Spin />
        </div>
      )}
    </div>
  )
}

export default App;
