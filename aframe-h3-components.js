// Ensure h3-js is available
if (typeof h3 === 'undefined') {
    console.error('h3-js is required for these components. Please include it in your project.');
  }
  
  // H3 Hexagon Geometry
  AFRAME.registerGeometry('h3-hexagon', {
    schema: {
      cellId: {type: 'string'}
    },
  
    init: function (data) {
      const boundary = h3.cellToBoundary(data.cellId);
      const vertices = boundary.map(([lat, lon]) => this.latLonToPoint(lat, lon));
      
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
  
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
  
      this.geometry = geometry;
    },
  
    latLonToPoint: function(lat, lon) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      const x = -Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
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
      resolution: {type: 'number', default: 1},
      colorScheme: {type: 'string', default: 'random'} // 'random', 'gradient', or a specific color
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
        color: this.getColor(cellId),
        opacity: 0.7,
        transparent: true,
        side: 'double'
      });
      hexEntity.setAttribute('class', 'clickable');
      hexEntity.setAttribute('data-cell-id', cellId);
      hexEntity.setAttribute('data-raycastable', '');
      this.el.appendChild(hexEntity);
      this.hexagons.set(cellId, hexEntity);
    },
  
    getColor: function(cellId) {
      switch (this.data.colorScheme) {
        case 'random':
          return this.getRandomColor();
        case 'gradient':
          return this.getGradientColor(cellId);
        default:
          return this.data.colorScheme;
      }
    },
  
    getRandomColor: function() {
      return '#' + Math.floor(Math.random()*16777215).toString(16);
    },
  
    getGradientColor: function(cellId) {
      // Implement a gradient color scheme based on the cell's position
      // This is a placeholder implementation
      const [lat, lon] = h3.cellToLatLng(cellId);
      const hue = (lat + 90) / 180 * 360; // Hue based on latitude
      return `hsl(${hue}, 70%, 50%)`;
    }
  });
  
// Hexagon Click Handler Component
AFRAME.registerComponent('hexagon-click-handler', {
    init: function () {
      this.el.addEventListener('click', (evt) => { // Use an arrow function here
        const clickedEntity = evt.target;
        const cellId = clickedEntity.getAttribute('data-cell-id');
        if (cellId) {
          console.log('Clicked hexagon:', cellId);
          const [lat, lon] = h3.cellToLatLng(cellId);
          console.log('Latitude:', lat, 'Longitude:', lon);
          // Change color of the clicked hexagon
          clickedEntity.setAttribute('material', 'color', '#' + Math.floor(Math.random()*16777215).toString(16));
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
      'hexagon-click-handler': AFRAME.components['hexagon-click-handler']
    };
  }