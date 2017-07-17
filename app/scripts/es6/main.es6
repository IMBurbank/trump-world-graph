const dataPath = 'assets/datasets/trumpworld.csv';


const treatData = function treatGraphData(data) {
  const entityLetters = ['A', 'B'];

  let nodeData = {},
    nodes = [],
    links = [],
    entity = '';

  data.forEach( row => {
    entityLetters.forEach( (key, i) => {
      entity = row[`Entity ${key}`];

      if (nodeData[entity]) {
        nodeData[entity].links++;
        nodeData[entity].connections.push({
          Name: row[`Entity ${entityLetters[1 - i]}`],
          Type: row[`Entity ${entityLetters[1 - i]} Type`],
          Connection: row['Connection'],
          'Source(s)': row['Source(s)']
        });
      }
      else {
        nodeData[entity] = {
          id: entity,
          links: 1,
          group: row[`Entity ${key} Type`],
          connections: [{
            Name: row[`Entity ${entityLetters[1 - i]}`],
            Type: row[`Entity ${entityLetters[1 - i]} Type`],
            Connection: row['Connection'],
            'Source(s)': row['Source(s)']
          }],
        };
      }
    });

    links.push({source: row['Entity A'], target: row['Entity B']});
  });

  for (let key in nodeData) nodes.push(nodeData[key]);

  return {nodes, links};
}


const forceDirectedGraph =  function createForceDirectedGraph(nodes, links) {

}


d3.csv(dataPath, (error, data) => {
  if (error) throw error;

  const {nodes, links} = treatData(data);

  forceDirectedGraph(nodes, links);
});
