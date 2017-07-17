'use strict';

var dataPath = 'assets/datasets/trumpworld.csv';

var treatData = function treatGraphData(data) {
  var entityLetters = ['A', 'B'],
      groupValues = { Organization: 0, Person: 1 };

  var nodeData = {},
      nodes = [],
      links = [],
      entity = '';

  data.forEach(function (row) {
    entityLetters.forEach(function (key, i) {
      entity = row['Entity ' + key];

      if (nodeData[entity]) {
        nodeData[entity].links++;
        nodeData[entity].connections.push({
          Name: row['Entity ' + entityLetters[1 - i]],
          Type: row['Entity ' + entityLetters[1 - i] + ' Type'],
          Connection: row['Connection'],
          'Source(s)': row['Source(s)']
        });
      } else {
        nodeData[entity] = {
          id: entity,
          group: groupValues[row['Entity ' + key + ' Type']],
          links: 1,
          connections: [{
            Name: row['Entity ' + entityLetters[1 - i]],
            Type: row['Entity ' + entityLetters[1 - i] + ' Type'],
            Connection: row['Connection'],
            'Source(s)': row['Source(s)']
          }]
        };
      }
    });

    links.push({ source: row['Entity A'], target: row['Entity B'] });
  });

  for (var key in nodeData) {
    nodes.push(nodeData[key]);
  }return { nodes: nodes, links: links };
};

d3.csv(dataPath, function (error, data) {
  if (error) throw error;

  var _treatData = treatData(data),
      nodes = _treatData.nodes,
      links = _treatData.links;

  console.log(nodes[0]);
  console.log(links[0]);

  //forceDirectedGraph(nodes, links);
});