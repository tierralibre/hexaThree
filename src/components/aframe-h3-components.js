// aframe-h3-components.js

// Ensure h3-js is available
if (typeof h3 === 'undefined') {
  console.error('h3-js is required for these components. Please include it in your project.');
}

// H3 Hexagon Geometry
AFRAME.registerGeometry('h3-hexagon', {
  schema: {
    cellId: {type: 'string'},
    elevation: {type: 'number', default: 0}
  },

  init: function (data) {
    const boundary = h3.cellToBoundary(data.cellId);
    const vertices = boundary.map(([lat, lon]) => this.latLonToPoint(lat, lon, data.elevation));
    
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Add center point
    const center = this.averagePoints(vertices);
    vertices.push(center);

    // Create faces
    for (let i = 0; i < 6; i++) {
      positions.push(...vertices[i], ...center, ...vertices[(i + 1) % 6]);
      indices.push(i * 3, i * 3 + 1, i * 3 + 2);
    }

    // Add top face for elevation
    if (data.elevation > 0) {
      const topVertices = boundary.map(([lat, lon]) => this.latLonToPoint(lat, lon, data.elevation));
      const topCenter = this.averagePoints(topVertices);
      for (let i = 0; i < 6; i++) {
        positions.push(...topVertices[i], ...topCenter, ...topVertices[(i + 1) % 6]);
        indices.push((i + 7) * 3, (i + 7) * 3 + 1, (i + 7) * 3 + 2);
      }
      // Add side faces
      for (let i = 0; i < 6; i++) {
        positions.push(...vertices[i], ...topVertices[i], ...vertices[(i + 1) % 6],
                       ...topVertices[i], ...topVertices[(i + 1) % 6], ...vertices[(i + 1) % 6]);
        indices.push((i + 13) * 3, (i + 13) * 3 + 1, (i + 13) * 3 + 2,
                     (i + 13) * 3 + 3, (i + 13) * 3 + 4, (i + 13) * 3 + 5);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.geometry = geometry;
  },

  latLonToPoint: function(lat, lon, elevation = 0) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    const radius = 1 + elevation;
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  },

  averagePoints: function(points) {
    const sum = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1], acc[2] + point[2]], [0, 0, 0]);
    return sum.map(v => v / points.length);
  }
});

// Global Hexagon Grid Component
AFRAME.registerComponent('global-hexagon-grid', {
  schema: {
    resolution: {type: 'number', default: 2},
    colorScheme: {type: 'string', default: 'status'}
  },

  init: function () {
    this.hexagons = new Map();
    this.generateGlobalGrid();
  },

  generateGlobalGrid: function() {
    const res0Cells = h3.getRes0Cells();
    res0Cells.forEach(res0Cell => {
      const resCells = h3.cellToChildren(res0Cell, this.data.resolution);
      resCells.forEach(cellId => this.createHexagon(cellId));
    });
  },

  createHexagon: function(cellId) {
    if (this.hexagons.has(cellId)) return;

    const hexEntity = document.createElement('a-entity');
    hexEntity.setAttribute('geometry', {
      primitive: 'h3-hexagon',
      cellId: cellId
    });
    hexEntity.setAttribute('material', {
      color: this.getColor(cellId, 'unclaimed'),
      opacity: 0.7,
      transparent: true,
      side: 'double'
    });
    hexEntity.setAttribute('class', 'clickable');
    hexEntity.setAttribute('data-cell-id', cellId);
    hexEntity.setAttribute('data-raycastable', '');
    hexEntity.setAttribute('hexagon-status', 'status: unclaimed');
    this.el.appendChild(hexEntity);
    this.hexagons.set(cellId, hexEntity);
  },

  getColor: function(cellId, status) {
    if (this.data.colorScheme === 'status') {
      return this.getStatusColor(status);
    } else if (this.data.colorScheme === 'random') {
      return this.getRandomColor();
    } else if (this.data.colorScheme === 'gradient') {
      return this.getGradientColor(cellId);
    } else {
      return this.data.colorScheme;
    }
  },

  getStatusColor: function(status) {
    const statusColors = {
      unclaimed: '#808080',
      activeClaim: '#4CAF50',
      bidClaim: '#FFC107',
      guardian: '#2196F3'
    };
    return statusColors[status] || statusColors.unclaimed;
  },

  getRandomColor: function() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  },

  getGradientColor: function(cellId) {
    const [lat, lon] = h3.cellToLatLng(cellId);
    const hue = (lat + 90) / 180 * 360; // Hue based on latitude
    return `hsl(${hue}, 70%, 50%)`;
  },

  updateHexagonStatus: function(cellId, status) {
    const hexEntity = this.hexagons.get(cellId);
    if (hexEntity) {
      hexEntity.setAttribute('hexagon-status', `status: ${status}`);
      hexEntity.setAttribute('material', 'color', this.getColor(cellId, status));
    }
  }
});

// Hexagon Status Component
AFRAME.registerComponent('hexagon-status', {
  schema: {
    status: {type: 'string', default: 'unclaimed'}
  },

  update: function() {
    console.log(`Hexagon status updated: ${this.data.status}`);
    this.updateVisuals();
  },

  updateVisuals: function() {
    const status = this.data.status;
    const hexEntity = this.el;

    // Remove any existing animation components
    ['animation__scale', 'animation__rotation', 'animation__color'].forEach(animName => {
      if (hexEntity.getAttribute(animName)) {
        hexEntity.removeAttribute(animName);
      }
    });

    // Add visual effects based on status
    switch(status) {
      case 'activeClaim':
        hexEntity.setAttribute('animation__scale', {
          property: 'scale',
          dir: 'alternate',
          dur: 1000,
          easing: 'easeInOutSine',
          loop: true,
          to: '1.05 1.05 1.05'
        });
        break;
      case 'bidClaim':
        hexEntity.setAttribute('animation__rotation', {
          property: 'rotation',
          dur: 2000,
          easing: 'linear',
          loop: true,
          to: '0 360 0'
        });
        break;
      case 'guardian':
        hexEntity.setAttribute('animation__color', {
          property: 'material.emissive',
          dur: 1000,
          easing: 'easeInOutSine',
          loop: true,
          to: '#2196F3'
        });
        break;
    }
  }
});

// Hexagon Click Handler Component
AFRAME.registerComponent('hexagon-click-handler', {
  init: function () {
    this.el.addEventListener('click', (evt) => {
      const clickedEntity = evt.target;
      const cellId = clickedEntity.getAttribute('data-cell-id');
      if (cellId) {
        console.log('Clicked hexagon:', cellId);
        const [lat, lon] = h3.cellToLatLng(cellId);
        console.log('Latitude:', lat, 'Longitude:', lon);
        
        // Emit a custom event that can be listened to by other components
        this.el.emit('hexagon-clicked', {cellId, lat, lon});
      }
    });
  }
});

// Export the components if using a module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    'h3-hexagon': AFRAME.geometries['h3-hexagon'],
    'global-hexagon-grid': AFRAME.components['global-hexagon-grid'],
    'hexagon-status': AFRAME.components['hexagon-status'],
    'hexagon-click-handler': AFRAME.components['hexagon-click-handler']
  };
}
