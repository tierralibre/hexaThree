// main.js

// Initialize A-Frame scene
function initScene() {
  const h3World = document.querySelector('#h3-world');
  
  // Add global hexagon grid
  h3World.setAttribute('global-hexagon-grid', {
    resolution: 2,
    colorScheme: 'gradient'
  });
  h3World.setAttribute('hexagon-click-handler', '');

  // Add click event listener
  h3World.addEventListener('hexagon-clicked', handleHexagonClick);
}

// Handle hexagon click
async function handleHexagonClick(event) {
  const { cellId, lat, lon } = event.detail;
  console.log(`Clicked hexagon handleHexagonClick: ${cellId} at ${lat}, ${lon}`);
}

// Update hexagon visual
function updateHexagonVisual(cellId, playerId) {
  const hexEntity = document.querySelector(`[data-cell-id="${cellId}"]`);
  if (hexEntity) {
    hexEntity.setAttribute('material', 'color', getPlayerColor(playerId));
  }
}

// Get player color
function getPlayerColor(playerId) {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  return colors[playerId.charCodeAt(0) % colors.length];
}

// Initialize resources for a hexagon
async function initializeResources(cellId) {
  const initialResources = generateInitialResources();
  try {
    await process.call('initializeHexResources', { hexId: cellId, resources: initialResources });
  } catch (error) {
    console.error('Error initializing hex resources:', error);
  }
}

// Generate initial resources
function generateInitialResources() {
  return {
    wood: Math.floor(Math.random() * 10),
    stone: Math.floor(Math.random() * 5),
    food: Math.floor(Math.random() * 15)
  };
}

// Main initialization
async function init() {
  initScene();
}

// Run initialization when the document is loaded
document.addEventListener('DOMContentLoaded', init);