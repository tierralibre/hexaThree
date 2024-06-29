// Mock wallet functionality using local storage

function generateMockAddress() {
  return 'ar' + Array(43).fill(0).map(() => Math.random().toString(36)[2]).join('');
}

export async function getOrCreateWallet() {
  let wallet = localStorage.getItem('mockArweaveWallet');
  
  if (!wallet) {
    // Generate a new mock wallet
    wallet = {
      address: generateMockAddress(),
      key: Array(32).fill(0).map(() => Math.floor(Math.random() * 256))
    };
    // Store the wallet in local storage
    localStorage.setItem('mockArweaveWallet', JSON.stringify(wallet));
  } else {
    // Parse the stored wallet
    wallet = JSON.parse(wallet);
  }

  return { wallet, address: wallet.address };
}

export async function getWalletAddress() {
  const { address } = await getOrCreateWallet();
  return address;
}

export function backupWallet() {
  const wallet = localStorage.getItem('mockArweaveWallet');
  if (!wallet) {
    throw new Error('No wallet found to backup');
  }
  
  // Create a Blob with the wallet data
  const blob = new Blob([wallet], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger the download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mock-arweave-wallet-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importWallet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wallet = JSON.parse(e.target.result);
        if (!wallet.address || !wallet.key) {
          throw new Error('Invalid wallet file');
        }
        // Store the imported wallet
        localStorage.setItem('mockArweaveWallet', JSON.stringify(wallet));
        resolve(wallet.address);
      } catch (error) {
        reject(new Error('Invalid wallet file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function signMessage(message) {
  // In a real implementation, this would use the wallet's private key to sign the message
  // For this mock version, we'll just return a dummy signature
  return 'mock_signature_' + Math.random().toString(36).substr(2, 9);
}