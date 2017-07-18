'use strict';

/**
 *    Set Global Graph/Similation Variables
 */

var width = 900,
    height = width / 1.6,
    fillColors = { Person: 'rgba(44, 143, 204, 0.95)', Organization: 'rgba(244, 89, 58, 0.95)' },
    dataPath = 'assets/datasets/trumpworld.csv';

var simulation = d3.forceSimulation().force('link', d3.forceLink().id(function (d) {
  return d.id;
}).distance([50])).force('charge', d3.forceManyBody().strength(function (d) {
  return [-4 * Math.pow(d.links, 1 / 2) - 20];
}).distanceMin([0.001]).distanceMax([width / 2])).force('center', d3.forceCenter(width / 2, height / 2));

/**
 *    Create/Append HTML Graph Components
 */

var svg = d3.select('#graph').append('svg').attrs({ height: height, width: width, class: 'chart-palette' });

var detailDiv = d3.select("#graph").append("div").attrs({ id: "details", class: "details" }).style("opacity", 0);

var tooltipDiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

/**
 *    Define Graph & Simulation Functions
 */

var updateDetailDiv = function updateDetailDiv(d) {
  detailDiv.transition().duration(200).styles({ opacity: 0.9, 'z-index': 5 });

  detailDiv.styles({
    'min-width': width / 3 + 'px',
    'height': height / 3 + 'px'
  }).html('<strong>' + d.id + '</strong><br/>\n      <br/>\n      Type: ' + d.group + '<br/>\n      Links: ' + d.links + '<br/>\n      <div class="table-container">\n        <table class="link-table">\n          <caption><h3>Trump World Connections</h3></caption>\n          <col/><col/><col/><col/>\n          <thead>\n            <tr>\n              <th class="link-table-index">#</th>\n              <th class="link-table-name">Name</th>\n              <th class="link-table-type">Type</th>\n              <th class="link-table-details">Details</th>\n              <th class="link-table-scroll"></th>\n            </tr>\n          </thead>\n          <tbody>\n            ' + d.connections.reduce(function (a, b, i) {
    return a + '<tr>\n                <td class="link-table-index">' + (i + 1) + '</td>\n                <td class="link-table-name">' + b.name + '</td>\n                <td class="link-table-type">' + b.type + '</td>\n                <td class="link-table-details">\n                  <a href=' + b.source + ' target="_blank">' + b.connection + '</a>\n                </td>\n              </tr>';
  }, "") + '\n          </tbody>\n        </table>\n      </div>');
};

var dragStarted = function dragSimulationStarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();

  d.fx = d.x;
  d.fy = d.y;
};

var dragged = function draggedSimulation(d) {
  d.fx = Math.max(d.radius, Math.min(width - d.radius, d3.event.x));
  d.fy = Math.max(d.radius, Math.min(height - d.radius, d3.event.y));
};

var dragEnded = function dragSimulationEnded(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;

  updateDetailDiv(d);
};

var treatData = function treatGraphData(data) {
  var entityLetters = ['A', 'B'],
      linksCutoff = 3;

  var nodeData = {},
      rowObj = {},
      nodes = [],
      links = [],
      endNodes = [],
      finalEntities = new Set(),
      entity = '';

  data.forEach(function (row) {
    entityLetters.forEach(function (key, i) {
      entity = row['Entity ' + key];

      if (nodeData[entity]) {
        nodeData[entity].links++;
        nodeData[entity].connections.push({
          name: row['Entity ' + entityLetters[1 - i]],
          type: row['Entity ' + entityLetters[1 - i] + ' Type'],
          connection: row['Connection'],
          source: row['Source(s)']
        });
      } else {
        nodeData[entity] = {
          id: entity,
          links: 1,
          group: row['Entity ' + key + ' Type'],
          connections: [{
            name: row['Entity ' + entityLetters[1 - i]],
            type: row['Entity ' + entityLetters[1 - i] + ' Type'],
            connection: row['Connection'],
            source: row['Source(s)']
          }]
        };
      }
    });

    links.push({ source: row['Entity A'], target: row['Entity B'] });
  });

  for (var key in nodeData) {
    rowObj = nodeData[key];

    if (rowObj.links <= linksCutoff) endNodes.push(key);else rowObj['radius'] = Math.pow(rowObj.links, 9 / 16) + 3, nodes.push(rowObj);
  }

  links = links.filter(function (el) {
    return !endNodes.includes(el.source) && !endNodes.includes(el.target);
  });

  links.forEach(function (el) {
    finalEntities.add(el.source), finalEntities.add(el.target);
  });

  nodes = nodes.filter(function (el) {
    return finalEntities.has(el.id);
  }).sort(function (a, b) {
    return b.links - a.links;
  });

  nodes.forEach(function (el) {
    return el.connections.sort(function (a, b) {
      return a.name <= b.name ? -1 : 1;
    });
  });

  return { nodes: nodes, links: links };
};

var forceDirectedGraph = function createForceDirectedGraph(nodes, links) {
  var link = svg.append('g').attr('class', 'link').selectAll('line').data(links).enter().append('line');

  var node = svg.append('g').attr('class', 'node').selectAll('circle').data(nodes).enter().append('circle').attrs({
    r: function r(d) {
      return d.radius;
    },
    fill: function fill(d) {
      return fillColors[d.group];
    }
  }).on('mouseover', function (d) {
    tooltipDiv.transition().duration(200).style('opacity', 0.9);
    tooltipDiv.html(d.id + '<br/>\n          Type: ' + d.group + '<br/>\n          Links: ' + d.links).styles({ left: d3.event.pageX + 'px', top: d3.event.pageY + 12 + "px" });
  }).on('mouseout', function (d) {
    tooltipDiv.transition().duration(500).style("opacity", 0);
  }).call(d3.drag().on('start', dragStarted).on('drag', dragged).on('end', dragEnded));

  var ticked = function linkTicked() {
    link.attrs({
      'x1': function x1(d) {
        return d.source.x;
      },
      'y1': function y1(d) {
        return d.source.y;
      },
      'x2': function x2(d) {
        return d.target.x;
      },
      'y2': function y2(d) {
        return d.target.y;
      }
    });

    node.attrs({
      cx: function cx(d) {
        return d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
      },
      cy: function cy(d) {
        return d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
      }
    });
  };

  d3.select('body').on('click', function (e) {
    if (d3.event.target.localName !== 'circle' && d3.event.path.every(function (el) {
      return el.id !== 'details';
    })) {

      detailDiv.transition().duration(333).styles({ opacity: 0, 'z-index': -1 });
    }
  });

  simulation.nodes(nodes).on('tick', ticked);

  simulation.force('link').links(links);
};

/**
 *    Run Force Directed Graph Simulation
 */

d3.csv(dataPath, function (error, data) {
  if (error) throw error;

  var _treatData = treatData(data),
      nodes = _treatData.nodes,
      links = _treatData.links;

  forceDirectedGraph(nodes, links);
});