# HexaClaim Alpha Handover Document

## Project Overview

HexaClaim is a decentralized application built on the AO network that allows users to claim and manage hexagonal territories on a global grid. This alpha version uses a local wallet with import/export functionality.

## Key Components

1. **Frontend (src/main.js)**: 
   - Manages the user interface and interactions
   - Integrates with A-Frame for 3D visualization
   - Handles wallet operations and AO process interactions

2. **AO Integration (src/lib/ao-integration.js)**:
   - Manages communication with the AO network
   - Implements methods for all contract interactions

3. **Wallet Management (src/lib/wallet.js)**:
   - Handles local wallet creation, storage, backup, and import
   - Uses Arweave for cryptographic operations

4. **Lua Contract (HexaClaim.lua)**:
   - Implements the core game logic on the AO network
   - Manages claims, bids, and HEXA token balances

5. **A-Frame Components (src/components/aframe-h3-components.js)**:
   - Custom A-Frame components for hexagon rendering and interaction

## Key Functionalities

1. **Hexagon Claiming**: Users can submit active claims or bids on hexagons.
2. **HEXA Token System**: Users earn and spend HEXA tokens for claims and bids.
3. **Guardian System**: Hexagons have guardians based on active claims or highest bids.
4. **Wallet Management**: Users can backup and import their local wallets.

## Testing

- Unit tests for AO integration are provided in `test/ao-integration.test.js`
- Manual testing of the Lua contract can be done using the AO shell

## Deployment

- The Lua contract needs to be deployed to the AO network
- Frontend can be built using Vite and deployed to a web server or Arweave

## Future Improvements

1. Implement more robust error handling and recovery mechanisms
2. Enhance the user interface with more intuitive controls and feedback
3. Optimize hexagon rendering for better performance with large numbers of hexagons
4. Implement a more sophisticated activity update mechanism
5. Add more unit and integration tests
6. Consider moving to a more secure wallet solution in future versions

## Known Issues

1. The local wallet storage is not encrypted and may pose security risks
2. The activity update mechanism may not be reliable for long-term use
3. The current implementation may not scale well for a large number of hexagons or users

## Resources

- AO Network Documentation: [AO Cookbook](https://cookbook_ao.g8way.io/)
- Arweave Documentation: [Arweave Docs](https://docs.arweave.org/)
- A-Frame Documentation: [A-Frame Docs](https://aframe.io/docs/)

Remember to replace placeholder values (like AO node addresses and process IDs) with actual values before deployment. This alpha version serves as a proof of concept and should be further developed and secured before any production use.

