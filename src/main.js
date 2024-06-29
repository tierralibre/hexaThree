import { AOProcess } from './lib/ao-integration.js';
import { getOrCreateWallet, getWalletAddress, backupWallet, importWallet } from './lib/wallet.js';
import './components/global-hexagon-grid.js';

let selectedHexagon = null;
let aoProcess;
let userWalletAddress;
let hexaBalance = 0;

const AO_NODE_ADDRESS = 'https://ao-node.example.com'; // Replace with actual node address
const HEXA_CLAIM_PROCESS_ID = 'process_id'; // Replace with actual process ID

async function initScene() {
  const h3World = document.querySelector('#h3-world');
  
  h3World.setAttribute('global-hexagon-grid', {
    resolution: 2,
    colorScheme: 'status'
  });
  h3World.setAttribute('hexagon-click-handler', '');

  h3World.addEventListener('hexagon-clicked', handleHexagonClick);

  document.getElementById('submit-active-claim').addEventListener('click', handleActiveClaimButtonClick);
  document.getElementById('submit-bid').addEventListener('click', handleBidButtonClick);
  document.getElementById('backup-wallet').addEventListener('click', handleBackupWallet);
  document.getElementById('import-wallet').addEventListener('change', handleWalletImport);

  try {
    await initializeWallet();
    await initializeAOProcess();
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Failed to initialize the application. Please try again later.', 'error');
  }
}

async function initializeWallet() {
  try {
    const { address } = await getOrCreateWallet();
    userWalletAddress = address;
    updateWalletDisplay();
    console.log('Wallet initialized with address:', userWalletAddress);
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    throw new Error('Wallet initialization failed');
  }
}

async function initializeAOProcess() {
  try {
    aoProcess = new AOProcess(AO_NODE_ADDRESS, HEXA_CLAIM_PROCESS_ID);
    await aoProcess.initialize();
    console.log('AO Process initialized successfully');
    await updateHexaBalanceDisplay();
    startClaimActivityMonitoring();
  } catch (error) {
    console.error('Failed to initialize AO Process:', error);
    throw new Error('AO Process initialization failed');
  }
}

function updateWalletDisplay() {
  const walletInfo = document.getElementById('wallet-address');
  if (walletInfo) {
    walletInfo.textContent = `Wallet: ${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`;
  }
}

async function updateHexaBalanceDisplay() {
  try {
    const result = await aoProcess.getHexaBalance(userWalletAddress);
    hexaBalance = result.balance;
    const balanceDisplay = document.getElementById('hexa-balance');
    if (balanceDisplay) {
      balanceDisplay.textContent = `HEXA Balance: ${hexaBalance}`;
    }
  } catch (error) {
    console.error('Error updating HEXA balance display:', error);
    showNotification('Failed to fetch HEXA balance. Please try again later.', 'error');
  }
}

async function handleHexagonClick(event) {
  const { cellId, lat, lon } = event.detail;
  console.log(`Clicked hexagon: ${cellId} at ${lat}, ${lon}`);
  
  selectedHexagon = { cellId, lat, lon };
  await displayHexagonInfo(cellId, lat, lon);
  showHexagonInfo();
}

async function displayHexagonInfo(cellId, lat, lon) {
  document.getElementById('cell-id').textContent = cellId;

  try {
    const result = await aoProcess.getHexagonStatus(cellId);
    const status = result.status;
    document.getElementById('hex-status').textContent = status.status;
    document.getElementById('guardian').textContent = status.guardian || 'None';
    document.getElementById('highest-bid').textContent = status.highestBid;
    updateHexagonVisual(cellId, status);
  } catch (error) {
    console.error('Error fetching hexagon status:', error);
    document.getElementById('hex-status').textContent = 'Error fetching status';
    showNotification('Failed to fetch hexagon status. Please try again.', 'error');
  }
}

function updateHexagonVisual(cellId, status) {
  const h3World = document.querySelector('#h3-world');
  let visualStatus = 'unclaimed';

  if (status.guardian) {
    visualStatus = 'guardian';
  } else if (status.activeClaims > 0) {
    visualStatus = 'activeClaim';
  } else if (status.highestBid > 0) {
    visualStatus = 'bidClaim';
  }

  h3World.components['global-hexagon-grid'].updateHexagonStatus(cellId, visualStatus);
}

function showHexagonInfo() {
  document.getElementById('hexagon-info').style.display = 'block';
}

async function handleActiveClaimButtonClick() {
  if (selectedHexagon) {
    try {
      const result = await aoProcess.submitActiveClaim(selectedHexagon.cellId, userWalletAddress);
      console.log(result);
      showNotification('Active claim submitted successfully!', 'success');
      await displayHexagonInfo(selectedHexagon.cellId, selectedHexagon.lat, selectedHexagon.lon);
      await updateHexaBalanceDisplay();
    } catch (error) {
      console.error('Error submitting active claim:', error);
      showNotification('Failed to submit active claim. Please try again.', 'error');
    }
  }
}

async function handleBidButtonClick() {
  if (selectedHexagon) {
    const bidAmount = parseInt(document.getElementById('bid-amount').value);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      showNotification('Please enter a valid bid amount.', 'error');
      return;
    }
    if (bidAmount > hexaBalance) {
      showNotification('Insufficient HEXA balance for this bid.', 'error');
      return;
    }
    try {
      const result = await aoProcess.submitBid(selectedHexagon.cellId, userWalletAddress, bidAmount);
      console.log(result);
      showNotification('Bid submitted successfully!', 'success');
      await displayHexagonInfo(selectedHexagon.cellId, selectedHexagon.lat, selectedHexagon.lon);
      await updateHexaBalanceDisplay();
    } catch (error) {
      console.error('Error submitting bid:', error);
      showNotification('Failed to submit bid. Please try again.', 'error');
    }
  }
}

function handleBackupWallet() {
  try {
    backupWallet();
    showNotification('Wallet backup file downloaded successfully.', 'success');
  } catch (error) {
    console.error('Failed to backup wallet:', error);
    showNotification('Failed to backup wallet. Please try again.', 'error');
  }
}

async function handleWalletImport(event) {
  const file = event.target.files[0];
  if (file) {
    try {
      const newAddress = await importWallet(file);
      userWalletAddress = newAddress;
      updateWalletDisplay();
      await updateHexaBalanceDisplay();
      showNotification('Wallet imported successfully.', 'success');
    } catch (error) {
      console.error('Failed to import wallet:', error);
      showNotification('Failed to import wallet. Please ensure you selected a valid wallet file.', 'error');
    }
  }
}

function startClaimActivityMonitoring() {
  setInterval(async () => {
    if (selectedHexagon) {
      try {
        await aoProcess.updateActivity(selectedHexagon.cellId, userWalletAddress);
        console.log('Activity updated for hexagon:', selectedHexagon.cellId);
        await displayHexagonInfo(selectedHexagon.cellId, selectedHexagon.lat, selectedHexagon.lon);
        await updateHexaBalanceDisplay();
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    }
  }, 60000); // Check every minute
}

function showNotification(message, type) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = type;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// Initialize the scene when the document is loaded
document.addEventListener('DOMContentLoaded', initScene);
