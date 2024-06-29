import { AOProcess } from './ao-integration.js';
import { jest } from '@jest/globals';

jest.mock('@permaweb/aoconnect', () => ({
  connect: jest.fn(() => ({
    sendMessage: jest.fn()
  }))
}));

describe('AOProcess', () => {
  let aoProcess;
  const mockNodeAddress = 'test-node-address';
  const mockProcessId = 'test-process-id';

  beforeEach(() => {
    aoProcess = new AOProcess(mockNodeAddress, mockProcessId);
  });

  test('initialize connects to AO network', async () => {
    await aoProcess.initialize();
    expect(aoProcess.node).not.toBeNull();
  });

  test('submitActiveClaim sends correct message', async () => {
    await aoProcess.initialize();
    const hexId = 'hex123';
    const userId = 'user456';
    await aoProcess.submitActiveClaim(hexId, userId);
    expect(aoProcess.node.sendMessage).toHaveBeenCalledWith({
      to: mockProcessId,
      message: {
        action: 'submitActiveClaim',
        hexId,
        userId
      }
    });
  });

  test('submitBid sends correct message', async () => {
    await aoProcess.initialize();
    const hexId = 'hex123';
    const userId = 'user456';
    const bidAmount = 100;
    await aoProcess.submitBid(hexId, userId, bidAmount);
    expect(aoProcess.node.sendMessage).toHaveBeenCalledWith({
      to: mockProcessId,
      message: {
        action: 'submitBid',
        hexId,
        userId,
        bidAmount
      }
    });
  });

  test('updateActivity sends correct message', async () => {
    await aoProcess.initialize();
    const hexId = 'hex123';
    const userId = 'user456';
    await aoProcess.updateActivity(hexId, userId);
    expect(aoProcess.node.sendMessage).toHaveBeenCalledWith({
      to: mockProcessId,
      message: {
        action: 'updateActivity',
        hexId,
        userId
      }
    });
  });

  test('getHexagonStatus sends correct message', async () => {
    await aoProcess.initialize();
    const hexId = 'hex123';
    await aoProcess.getHexagonStatus(hexId);
    expect(aoProcess.node.sendMessage).toHaveBeenCalledWith({
      to: mockProcessId,
      message: {
        action: 'getHexagonStatus',
        hexId
      }
    });
  });

  test('getHexaBalance sends correct message', async () => {
    await aoProcess.initialize();
    const userId = 'user456';
    await aoProcess.getHexaBalance(userId);
    expect(aoProcess.node.sendMessage).toHaveBeenCalledWith({
      to: mockProcessId,
      message: {
        action: 'getHexaBalance',
        userId
      }
    });
  });
});
