window.addEventListener("DOMContentLoaded", function() {
  async function getData() {
    try {
      await dataJSON;
      cyload();
    } catch (err) {
      // 專注在錯誤
      console.log("catch", err);
    }
  }

  let dataJSON = $.getJSON("data.json", function() {
    console.log("success");
    console.log(dataJSON.responseJSON);
  })
    .fail(function() {
      console.log("error");
    });

  function cyload() {
    const data = {
      nodes: dataJSON.responseJSON[0],
      edges: dataJSON.responseJSON[1],
    };

    const style = [
      {
        selector: "node",
        style: {
          "background-color": "#11479e",
          content: function(node) {
            return node.data("type") + "\n" + node.data("name");
          },
          // 'content': function( node ){ return node.data("type"); },
          "text-valign": "top",
          "text-halign": "center",
          "text-margin-y": -15,
          // 'text-margin-x': -25,
          "font-size": 13,
          "text-wrap": "wrap",
          "text-rotation": "autorotate",
        },
      },
      {
        selector: ":parent",
        style: {
          "text-valign": "top",
          "text-halign": "left",
          "background-color": "#f8f8f8",
          "border-color": "#cccccc",
          "text-margin-x": 100,
          "font-size": 16,
          "font-weight": 700,
          content: "data(type)",
        },
      },
      {
        selector: "edge",
        style: {
          width: 4,
          "target-arrow-shape": "triangle",
          // 'source-arrow-shape': 'triangle',
          "line-color": "#c1d8fc",
          "target-arrow-color": "#9dbaea",
          "curve-style": "straight",
          // 'curve-style': 'segments',
          // 'curve-style': 'straight-triangle'
          // 'curve-style': 'unbundled-bezier',
          // "curve-style": "taxi",
        },
      },

      {
        selector: "node.highlight",
        style: {
          "border-color": "#c1d8fc",
          "border-width": "3px",
        },
      },
      {
        selector: "node.semitransp",
        style: { opacity: "0.5" },
      },
      {
        selector: "edge.highlight",
        style: {
          "mid-target-arrow-color": "#FFF",
          "line-color": "#fdce34",
          "target-arrow-color": "#dfae0c",
        },
      },
      {
        selector: "edge.semitransp",
        style: {
          opacity: "0.2",
        },
      },
    ];
    var cy = (window.cy = cytoscape({
      container: document.getElementById("cy"),

      boxSelectionEnabled: false,
      autounselectify: true,
      style: style,
      elements: data,

      layout: {
        name: "dagre",
        avoidOverlap: true,
        // dagre algo options, uses default value on undefined
        nodeSep: 30, // the separation between adjacent nodes in the same rank
        edgeSep: undefined, // the separation between adjacent edges in the same rank
        rankSep: undefined, // the separation between each rank in the layout
        rankDir: "LR", // 'TB' for top to bottom flow, 'LR' for left to right,
        align: "UR", // alignment for rank nodes. Can be 'UL', 'UR', 'DL', or 'DR', where U = up, D = down, L = left, and R = right
        acyclicer: undefined, // If set to 'greedy', uses a greedy heuristic for finding a feedback arc set for a graph.
        // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
        ranker: undefined, // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
        minLen: function(edge) {
          return 3;
        }, // number of ranks to keep between the source and target of the edge
        edgeWeight: function(edge) {
          return 3;
        }, // higher weight edges are generally made shorter and straighter than lower weight edges
        // general layout options
        fit: true, // whether to fit to viewport
        padding: 10, // fit padding
        spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
        nodeDimensionsIncludeLabels: true, // whether labels should be included in determining the space used by a node
        animate: true, // whether to transition the node positions
        animateFilter: function(node, i) {
          return true;
        }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
        animationDuration: 500, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        transform: function(node, pos) {
          return pos;
        }, // a function that applies a transform to the final node position

        stop: function() {}, // on layoutstop
      },
      ready: function() {
        //
        cy = this;

        function runLayout(fit, callBack) {
          // step-1 position child nodes
          var parentNodes = cy.nodes(":parent");
          console.log(parentNodes.descendants());
          var grid_layout = parentNodes.descendants().layout({
            name: "dagre",
            // cols: 1,
            // name: 'breadthfirst',
            // directed: true,
            rankDir: "LR",
            fit: fit,
          });
          grid_layout.promiseOn("layoutstop").then(function(event) {
            // step-2 position parent nodes
            var dagre_layout = parentNodes.layout({
              name: "dagre",
              rankDir: "LR",
              fit: fit,
            });
            dagre_layout.promiseOn("layoutstop").then(function(event) {
              if (callBack) {
                callBack.call(cy, event);
              }
            });
            dagre_layout.run();
            // console.log(dagre_layout.promiseOn("layoutstop"))
          });
          grid_layout.run();
        }
        runLayout(true);

        cy.on("mouseover", "node", function(e) {
          var sel = e.target;
          cy.elements()
            .difference(sel.outgoers())
            .not(sel)
            .addClass("semitransp");
          sel
            .addClass("highlight")
            .outgoers()
            .addClass("highlight");
        });
        cy.on("mouseout", "node", function(e) {
          var sel = e.target;
          cy.elements().removeClass("semitransp");
          sel
            .removeClass("highlight")
            .outgoers()
            .removeClass("highlight");
        });

        let evt_type;

        cy.on("tap", "node", function(e) {
          // $('#dataID').html(e.target.id())
          evt_type = e.target.data().type;
          var data_name = dataName(evt_type);
          var data =
            `<li class="title">Arn：</li>` +
            `<li>${e.target.data().id}</li>` +
            `<li class="title">${data_name}：</li>` +
            `<li>${e.target.data().name}</li>` +
            `<li class="title">Region</li>` +
            `<li>${e.target.data().region}</li>`;
          $("#sidebar-menu").html(data);
          $("#dataType").html(evt_type);
          $(".page-wrapper").removeClass("toggled");
          $(".sidebar-sub-wrapper").addClass("active");
          console.log(e.target.data().name);
        });

        function dataName(evt_type) {
          var name;
          if (evt_type == "Lambda") {
            name = "Function Name";
          } else if (evt_type == "S3") {
            name = "Bucket Name";
          } else if (evt_type == "DynamoDB") {
            name = "Table Name";
          } else if (evt_type == "Cognito") {
            name = "Identity Pool Name";
          } else {
            name = "Name";
          }

          return name;
        }
      }, // on layoutready
    }));
  }

  getData();
});
