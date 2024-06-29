import { connect } from '@permaweb/aoconnect';

export class AOProcess {
  constructor(nodeAddress, processId) {
    this.nodeAddress = nodeAddress;
    this.processId = processId;
    this.node = null;
  }

  async initialize() {
    try {
      this.node = connect(this.nodeAddress);
      console.log('Connected to AO network');
    } catch (error) {
      console.error('Error connecting to AO network:', error);
      throw error;
    }
  }

  async sendMessage(action, data) {
    if (!this.node) {
      throw new Error('AO node not initialized');
    }

    try {
      const result = await this.node.sendMessage({
        to: this.processId,
        message: {
          action,
          ...data
        }
      });
      return result;
    } catch (error) {
      console.error(`Error sending message for action ${action}:`, error);
      throw error;
    }
  }

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
