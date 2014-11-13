define('planning.rrt_voronoi', [
    'utils', 'vec', 'NBoxTree', 'NBox'
], function(utils, vec, NBoxTree, NBox) {

    function RrtVoronoi(map) {

        var dims = map.nbox.dims();
        var boxTree = new NBoxTree(map.nbox);
        var resolution = map.resolution;
        var resolution2 = resolution * resolution;
        var greediness = 0.3;

        var tempDot = vec.alloc(dims);
        var tempDot2 = vec.alloc(dims);

        var solutionNode = null;
        var parentMap = new Map();
        var edges = [];
        var samples = [];

        var wrongSampleCallback = null;

        putDot(map.start, null);

        function randomDotInBox(nbox, dot) {
            for (var i = 0; i < dims; i++) {
                dot[i] = Math.random() * nbox.width(i) + nbox.min[i];
            }
            return dot;
        }

        function putDot(dot, parent) {
            boxTree.putDot(dot);
            var len2 = vec.dist2(map.target, dot);
            if (len2 < resolution2) {
                solutionNode = dot;
            }
            if (parent) {
                parentMap.set(dot, parent);
                edges.push([{pos: parent},{pos: dot}]);
                samples.push({ pos: dot, parent: parent });
            }
        }

        function putRandomDot() {
            if (Math.random() < greediness) {
                vec.copyTo(tempDot, map.target);
            } else {
                randomDotInBox(map.nbox, tempDot);
            }
            var nearest = boxTree.nearest(tempDot);
            var veclen = vec.dist(nearest, tempDot);
            var goodSample = false;

            if (veclen > resolution) {
                vec.subTo(tempDot, tempDot, nearest);
                var scale = resolution / veclen;
                vec.scale(tempDot, scale, tempDot);
                vec.addTo(tempDot, tempDot, nearest);

                var inc = 1.0 / resolution;
                var inters = true;
                for (var i = 0; i < 1; i += inc) {
                    vec.lerpTo(tempDot2, nearest, tempDot, i);
                    if (map.sampler(tempDot2)) {
                        inters = false;
                        break;
                    }
                }
                if (inters && !map.sampler(tempDot)) {
                    goodSample = true;
                    putDot(vec.copy(tempDot), nearest);
                }
            }

            if (!goodSample && wrongSampleCallback) {
                wrongSampleCallback(vec.copy(tempDot));
            }
        }

        function iterate(trialCount) {
            trialCount = trialCount || 20;
            for (var i = 0; i < trialCount && !solutionNode; i++) {
                putRandomDot();
            }
        }

        function hasSolution() {
            return !!solutionNode;
        }

        function getSolution() {
            var p = solutionNode;
            if (p) {
                var path = [];
                var totalLength = 0;
                for(;;) {
                    path.unshift(p);
                    var parent = parentMap.get(p);
                    if (!parent) break;
                    totalLength += vec.dist(p, parent);
                    p = parent;
                }
                return {
                    cost: totalLength,
                    path: path
                };
            } else {
                return null;
            }
        }

        function setWrongSampleCallback(cb) {
            wrongSampleCallback = cb;
        }

        this.edges = edges;
        this.samples = samples;
        this.setWrongSampleCallback = setWrongSampleCallback;
        this.iterate = iterate;
        this.hasSolution = hasSolution;
        this.getSolution = getSolution;
    }


    return RrtVoronoi;
});