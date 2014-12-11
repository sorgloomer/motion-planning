define('planning.RrtVoronoi', [
    'utils.utils',
    'math.vec', 'math.NBoxTree', 'math.NBox',
    'planning.helper'
], function(
    utils,
    vec, NBoxTree, NBox,
    helper
) {

    function RrtVoronoi(map) {

        var dims = map.nbox.dims();
        var boxTree = new NBoxTree(map.nbox);
        var resolution = map.resolution;
        var resolution2 = resolution * resolution;
        var greediness = 0.3;

        var tempDot = vec.alloc(dims);

        var solutionNode = null;
        var parentMap = new Map();
        var edges = [];
        var samples = [];

        var wrongSampleCallback = null;

        putDot(map.start, null);


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

        function stepInDirectionTo(outp, from, to, maxDistance, knownDistance) {
            if (knownDistance === undefined) knownDistance = vec.dist(from, to);
            vec.lerpTo(outp, from, to, maxDistance / knownDistance);
        }

        function stepLimitedInDirectionTo(outp, from, to, maxDistance, knownDistance) {
            if (knownDistance === undefined) knownDistance = vec.dist(from, to);
            if (knownDistance > maxDistance) {
                vec.lerpTo(outp, from, to, maxDistance / knownDistance);
            } else if (outp !== to) vec.copyTo(outp, to);
        }

        function putRandomDot() {
            if (Math.random() < greediness) {
                vec.copyTo(tempDot, map.target);
            } else {
                helper.randomDotInBox(map.nbox, tempDot, dims);
            }
            var nearest = boxTree.nearest(tempDot);
            var knownDistance = vec.dist(nearest, tempDot);
            var goodSample = false;

            if (knownDistance > resolution) {
                stepInDirectionTo(tempDot, nearest, tempDot, resolution, knownDistance);

                var hitsWall = helper.checkLine(map.sampler, nearest, tempDot, 1, knownDistance);
                if (!hitsWall) {
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
            return helper.pathToRoot(parentMap, solutionNode, vec.dist);
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