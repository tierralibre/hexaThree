// Mock AO Process for frontend development and testing

export class AOProcess {
  constructor(nodeAddress, processId) {
    this.nodeAddress = nodeAddress;
    this.processId = processId;
    this.mockState = {
      claims: {},
      bids: {},
      guardians: {},
      hexaBalances: {}
    };
  }

  async initialize() {
    console.log('Mock AO Process initialized');
    return Promise.resolve();
  }

  async sendMessage(action, data) {
    console.log(`Sending mock message: ${action}`, data);
    switch (action) {
      case 'submitActiveClaim':
        return this.mockSubmitActiveClaim(data.hexId, data.userId);
      case 'submitBid':
        return this.mockSubmitBid(data.hexId, data.userId, data.bidAmount);
      case 'updateActivity':
        return this.mockUpdateActivity(data.hexId, data.userId);
      case 'getHexagonStatus':
        return this.mockGetHexagonStatus(data.hexId);
      case 'getHexaBalance':
        return this.mockGetHexaBalance(data.userId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  mockSubmitActiveClaim(hexId, userId) {
    if (!this.mockState.claims[hexId]) {
      this.mockState.claims[hexId] = {};
    }
    this.mockState.claims[hexId][userId] = Date.now();
    return Promise.resolve({ result: `Active claim submitted for ${hexId}` });
  }

  mockSubmitBid(hexId, userId, bidAmount) {
    if (!this.mockState.bids[hexId]) {
      this.mockState.bids[hexId] = {};
    }
    this.mockState.bids[hexId][userId] = { amount: bidAmount, timestamp: Date.now() };
    return Promise.resolve({ result: `Bid submitted for ${hexId}` });
  }

  mockUpdateActivity(hexId, userId) {
    if (this.mockState.claims[hexId] && this.mockState.claims[hexId][userId]) {
      this.mockState.claims[hexId][userId] = Date.now();
      return Promise.resolve({ result: `Activity updated for ${hexId}` });
    }
    return Promise.resolve({ result: `No active claim found for ${hexId}` });
  }

  mockGetHexagonStatus(hexId) {
    const guardian = this.mockState.guardians[hexId];
    const status = guardian ? "claimed" : "unclaimed";
    const activeClaims = this.mockState.claims[hexId] ? Object.keys(this.mockState.claims[hexId]).length : 0;
    let highestBid = 0;
    let highestBidder = null;

    if (this.mockState.bids[hexId]) {
      for (const [userId, bid] of Object.entries(this.mockState.bids[hexId])) {
        if (bid.amount > highestBid) {
          highestBid = bid.amount;
          highestBidder = userId;
        }
      }
    }

    return Promise.resolve({
      status: {
        status,
        guardian,
        activeClaims,
        highestBid,
        highestBidder
      }
    });
  }

  mockGetHexaBalance(userId) {
    const balance = this.mockState.hexaBalances[userId] || 100; // Default balance of 100
    return Promise.resolve({ balance });
  }

  // Helper methods to interact with mock state
  async submitActiveClaim(hexId, userId) {
    return this.sendMessage('submitActiveClaim', { hexId, userId });
  }

  async submitBid(hexId, userId, bidAmount) {
    return this.sendMessage('submitBid', { hexId, userId, bidAmount });
  }

  async updateActivity(hexId, userId) {
    return this.sendMessage('updateActivity', { hexId, userId });
  }

  async getHexagonStatus(hexId) {
    return this.sendMessage('getHexagonStatus', { hexId });
  }

  async getHexaBalance(userId) {
    return this.sendMessage('getHexaBalance', { userId });
  }
}