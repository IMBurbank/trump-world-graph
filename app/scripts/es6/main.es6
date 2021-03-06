/**
 *    Set Global Graph/Similation Variables
 */

const width = 900,
      height = width / 1.6,
      fillColors = { Person: 'rgba(44, 143, 204, 0.95)', Organization: 'rgba(244, 89, 58, 0.95)' },
      dataPath = 'assets/datasets/trumpworld.csv';

const simulation = d3.forceSimulation()
  .force('link',
    d3.forceLink()
      .id( d => d.id )
      .distance([50])
  )
  .force('charge',
    d3.forceManyBody()
      .strength( d => [-4 * d.links**(1/2) - 20] )
      .distanceMin([0.001])
      .distanceMax([width / 2])
  )
  .force('center',
    d3.forceCenter(width / 2, height / 2)
  );


/**
 *    Create/Append HTML Graph Components
 */

const svg = d3.select('#graph')
  .append('svg')
  .attrs({ height, width, class: 'chart-palette' });

const detailDiv = d3.select("#graph")
  .append("div")
	.attrs({ id: "details", class: "details" })
	.style("opacity", 0);

const tooltipDiv = d3.select("body")
  .append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);


/**
 *    Define Graph & Simulation Functions
 */

const updateDetailDiv = function updateDetailDiv(d) {
  detailDiv
    .transition()
    .duration(200)
    .styles({opacity: 0.9, 'z-index': 5 });

  detailDiv
    .styles({
      'min-width': width / 3 + 'px',
      'height': height / 3 + 'px'
    })
    .html(
      `<strong>${d.id}</strong><br/>
      <br/>
      Type: ${d.group}<br/>
      Links: ${d.links}<br/>
      <div class="table-container">
        <table class="link-table">
          <caption><h3>Trump World Connections</h3></caption>
          <col/><col/><col/><col/>
          <thead>
            <tr>
              <th class="link-table-index">#</th>
              <th class="link-table-name">Name</th>
              <th class="link-table-type">Type</th>
              <th class="link-table-details">Details</th>
              <th class="link-table-scroll"></th>
            </tr>
          </thead>
          <tbody>
            ${d.connections.reduce( (a, b, i) => {
              return `${a}<tr>
                <td class="link-table-index">${i + 1}</td>
                <td class="link-table-name">${b.name}</td>
                <td class="link-table-type">${b.type}</td>
                <td class="link-table-details">
                  <a href=${b.source} target="_blank">${b.connection}</a>
                </td>
              </tr>`;
            }, "")}
          </tbody>
        </table>
      </div>`
    );
}


const dragStarted = function dragSimulationStarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();

  d.fx = d.x;
  d.fy = d.y
}


const dragged = function draggedSimulation(d) {
  d.fx = Math.max(d.radius, Math.min(width - d.radius, d3.event.x));
  d.fy = Math.max(d.radius, Math.min(height - d.radius, d3.event.y));
}


const dragEnded = function dragSimulationEnded(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;

  updateDetailDiv(d);
}


const treatData = function treatGraphData(data) {
  const entityLetters = ['A', 'B'],
        linksCutoff = 3;

  let nodeData = {},
      rowObj = {},
      nodes = [],
      links = [],
      endNodes = [],
      finalEntities = new Set(),
      entity = '';

  data.forEach( row => {
    entityLetters.forEach( (key, i) => {
      entity = row[`Entity ${key}`];

      if (nodeData[entity]) {
        nodeData[entity].links++;
        nodeData[entity].connections.push({
          name: row[`Entity ${entityLetters[1 - i]}`],
          type: row[`Entity ${entityLetters[1 - i]} Type`],
          connection: row['Connection'],
          source: row['Source(s)']
        });
      }
      else {
        nodeData[entity] = {
          id: entity,
          links: 1,
          group: row[`Entity ${key} Type`],
          connections: [{
            name: row[`Entity ${entityLetters[1 - i]}`],
            type: row[`Entity ${entityLetters[1 - i]} Type`],
            connection: row['Connection'],
            source: row['Source(s)']
          }],
        };
      }
    });

    links.push({source: row['Entity A'], target: row['Entity B']});
  });

  for (let key in nodeData) {
    rowObj = nodeData[key];

    if (rowObj.links <= linksCutoff) endNodes.push(key);
    else rowObj['radius'] = rowObj.links**(9/16) + 3, nodes.push(rowObj);
  }

  links = links.filter( el => !endNodes.includes(el.source) && !endNodes.includes(el.target) );

  links.forEach( el => {finalEntities.add(el.source), finalEntities.add(el.target)} );

  nodes = nodes
    .filter( el => finalEntities.has(el.id))
    .sort( (a, b) => b.links - a.links );

  nodes.forEach( el => el.connections.sort( (a, b) => a.name <= b.name ? -1 : 1) );

  return {nodes, links};
}


const forceDirectedGraph =  function createForceDirectedGraph(nodes, links) {
  const link = svg.append('g')
    .attr('class', 'link')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')

  const node = svg.append('g')
    .attr('class', 'node')
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attrs({
      r: d => d.radius,
      fill: d => fillColors[d.group]
    })
    .on('mouseover', d => {
      tooltipDiv.transition()
        .duration(200)
        .style('opacity', 0.9);
      tooltipDiv
        .html(
          `${d.id}<br/>
          Type: ${d.group}<br/>
          Links: ${d.links}`
        )
        .styles({ left: (d3.event.pageX) + 'px', top: (d3.event.pageY + 12) + "px"});
    })
    .on('mouseout', d => {
      tooltipDiv.transition()
      	.duration(500)
      	.style("opacity", 0);
    })
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
    )

  const ticked = function linkTicked() {
    link.attrs({
      'x1': d => d.source.x,
      'y1': d => d.source.y,
      'x2': d => d.target.x,
      'y2': d => d.target.y
    });

    node.attrs({
      cx: d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)),
      cy: d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y))
    });
  }


  d3.select('body')
    .on('click', e => {
      if (d3.event.target.localName !== 'circle' &&
        d3.event.path.every( el => el.id !== 'details')) {

        detailDiv
          .transition()
          .duration(333)
          .styles({ opacity: 0, 'z-index': -1 });
      }
    });

  simulation
    .nodes(nodes)
    .on('tick', ticked);

  simulation
    .force('link')
    .links(links);
}


/**
 *    Run Force Directed Graph Simulation
 */

d3.csv(dataPath, (error, data) => {
  if (error) throw error;

  const {nodes, links} = treatData(data);

  forceDirectedGraph(nodes, links);
});
