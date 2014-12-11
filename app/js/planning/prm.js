define('planning.Prm', [
    'utils.utils',
    'math.vec', 'math.NBoxTree', 'math.NBox',
    'planning.helper',
    'utils.UnionFind', 'utils.MultiMap', 'utils.Heap'
], function(
    utils,
    vec, NBoxTree, NBox,
    helper,
    UnionFind, MultiMap, Heap
) {

    function Prm(map) {

        var dims = map.nbox.dims();
        var boxTree = new NBoxTree(map.nbox);
        var resolution = map.resolution;
        // Use hypersphere 4 times the volume of the resolution sphere
        var connectResolution = resolution * Math.pow(4, 1.0 / dims);

        var connectedSets = new UnionFind();
        var neighboursMap = new MultiMap();
        var edges = [];
        var samples = [];
        var bHasSolution = false;

        var startNode = vec.copy(map.target);
        var endNode = vec.copy(map.start);

        putDot(startNode);
        putDot(endNode);

        function makeNeighbours(a, b) {
            neighboursMap.put(a, b);
            neighboursMap.put(b, a);
            connectedSets.union(a, b);
            edges.push([{pos:a}, {pos:b}]);
            if (connectedSets.same(startNode, endNode)) {
                bHasSolution = true;
            }
        }

        var wrongSampleCallback = null;

        function putDot(dot) {
            boxTree.putDot(dot);
            samples.push({pos:dot});

            boxTree.enumerateInRange(dot, connectResolution, function(dotInTree, knownDistance2) {
                var dist = Math.sqrt(knownDistance2);
                var hitsWall = helper.checkLine(map.sampler, dot, dotInTree, 1, dist);
                if (!hitsWall) {
                    makeNeighbours(dot, dotInTree);
                }
            });
        }


        function putRandomDot() {
            var newDot = vec.alloc(dims);
            helper.randomDotInBox(map.nbox, newDot, dims);
            var nearest = boxTree.nearest(newDot);
            var goodSample = false;
            if (nearest) {
                var knownDistance = vec.dist(nearest, newDot);
                if (knownDistance > resolution) {
                    if (!map.sampler(newDot)) {
                        goodSample = true;
                        putDot(newDot, nearest);
                    }
                }
            }
            if (!goodSample && wrongSampleCallback) {
                wrongSampleCallback(newDot);
            }
        }


        function iterate(trialCount) {
            trialCount = trialCount || 20;
            for (var i = 0; i < trialCount; i++) {
                putRandomDot();
            }
        }

        function setWrongSampleCallback(cb) {
            wrongSampleCallback = cb;
        }
        
        function hasSolution() {
            return bHasSolution;
        }

        function getSolution() {
            var item;
            var queue = new Heap();
            var parentMap = new Map();

            queue.push(0, [null, startNode]);
            while (item = queue.pop()) {
                var current = item.value[1];
                if (!parentMap.has(current)) {
                    parentMap.set(current, item.value[0]);
                    var total = item.key;
                    if (!item) break;

                    neighboursMap.get(current).forEach(function (neigh) {
                        var dist = vec.dist(current, neigh);
                        queue.push(total + dist, [current, neigh]);
                    });
                }
            }

            return helper.pathToRoot(parentMap, endNode, vec.dist);
        }

        this.edges = edges;
        this.samples = samples;
        this.setWrongSampleCallback = setWrongSampleCallback;
        this.iterate = iterate;
        this.hasSolution = hasSolution;
        this.getSolution = getSolution;
    }
    return Prm;
});
