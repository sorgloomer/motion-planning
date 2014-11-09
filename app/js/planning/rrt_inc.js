define('planning.rrt_inc', [
    'utils', 'vec', 'NBoxTree', 'NBox'
], function(utils, vec, NBoxTree, NBox) {


    var itemCmp = utils.byCmp("score");

    function RrtInc(map) {
        var samples = this.samples = [];
        var edges = this.edges = [];
        this.map = map;

        var quad = new NBoxTree(new NBox([0, 0], [640, 480]));
        var trialCount = 0;
        var target = map.target;

        var mdist = map.resolution;
        var mdist2 = mdist * mdist * 0.95;

        var localSampler = map.sampler;
        var wrongSampleCallback = null;

        var solutionSample = null;


        putNewItemByPos(map.start, null);


        function putNewItemByPos(dot, parent) {
            var item = { pos: dot, fails: 0, parent: parent };
            if (putDotInTree(dot)) {
                samples.push(item);
                if (parent) {
                    edges.push([parent, item]);
                }
            }
            return item;
        }

        function hasNear(p) {
            var result = false;
            function visit(dot) {
                if (vec.dist2(dot, p) < mdist2) {
                    result = true;
                }
            }
            quad.traverse(function(node) {
                if (result || node.nbox.dist2(p) > mdist2) {
                    return true;
                } else {
                    var dots = node.dots;
                    if (dots) {
                        dots.forEach(visit);
                    }
                }
            });
            return result;
        }


        function verifyDot(item, u, edot) {
            var x = Math.cos(u), y = Math.sin(u);
            var p = item.pos;
            var dot, i;
            edot[0] = p[0] + x * mdist;
            edot[1] = p[1] + y * mdist;

            for (i = 5; ; i += 5) {
                if (i >= mdist) {
                    return !localSampler(edot) && !hasNear(edot);
                } else {
                    dot = [p[0] + x * i, p[1] + y * i];
                    if (localSampler(dot)) {
                        return false;
                    }
                }
            }
        }

        function putRandomDot() {
            var a = Math.random() * 6.28;
            var idx = Math.random();
            idx *= idx;
            idx *= idx;
            idx = (idx * (samples.length - 0.0001)) | 0;
            var item = samples[idx];
            trialCount++;

            var dot = [0, 0];
            if (verifyDot(item, a, dot)) {
                var newItem = putNewItemByPos(dot, item);
                if (vec.dist2(dot, target) < mdist2) {
                    solutionSample = newItem;
                }
            } else {
                if (wrongSampleCallback) {
                    wrongSampleCallback(dot);
                }
                item.fails++;
            }
        }

        function itemScore(a) {
            return a.fails + vec.dist(a.pos, target) * 0.02;
        }


        function putDotInTree(dot) {
            return quad.putDot(dot, 0);
        }

        function iterate(sampleCnt) {
            sampleCnt = sampleCnt || 20;
            samples.forEach(function(item) {
                item.score = itemScore(item);
            });
            samples.sort(itemCmp);
            for (var i = 0; i < sampleCnt && !solutionSample; i++) {
                putRandomDot();
            }
        }

        function setWrongSampleCallback(cb) {
            wrongSampleCallback = cb;
        }

        function hasSolution() {
            return !!solutionSample;
        }

        function getSolution() {
            var p = solutionSample;
            if (p) {
                var path = [];
                var totalLength = 0;
                for(;;) {
                    path.unshift(p.pos);
                    if (!p.parent) break;
                    totalLength += vec.dist(p.pos, p.parent.pos);
                    p = p.parent;
                }
                return {
                    cost: totalLength,
                    path: path
                };
            } else {
                return null;
            }
        }

        this.setWrongSampleCallback = setWrongSampleCallback;
        this.iterate = iterate;
        this.hasSolution = hasSolution;
        this.getSolution = getSolution;
    }

    return RrtInc;
});