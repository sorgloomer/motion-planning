
define('NBoxTree', [], function() {
    function Node(nbox) {
        this.nbox = nbox;
        this.ch = null;
        this.dots = [];
    }

    function NBoxTree(nbox) {
        this.root = new Node(nbox);
        this.maxcnt = 3;
    }

    NBoxTree.Node = Node;

    var NodeProto = Node.prototype;
    var NBoxTreeProto = NBoxTree.prototype;

    NodeProto.isLeaf = function() {
        return !this.ch;
    };
    function newNode(nbox) {
        return new Node(nbox);
    }

    function putChild(dot, ch, depth, maxcnt) {
        return ch.some(function (c) {
            return c.putDot(dot, depth, maxcnt);
        });
    }

    NodeProto.putDot = function(dot, depth, maxcnt) {
        var ch = this.ch;
        if (this.nbox.contains(dot)) {
            if (!ch && this.dots.length > maxcnt) {
                ch = this.split(depth + 1);
            }
            if (ch) {
                return putChild(dot, ch, depth + 1, maxcnt);
            } else {
                this.dots.push(dot);
            }
            return true;
        } else {
            return false;
        }
    };

    NodeProto.split = function(depth) {
        var ch = this.ch = this.nbox.split(depth % this.nbox.dims()).map(newNode);
        this.dots.forEach(function(dot) {
            putChild(dot, ch, depth);
        });
        this.dots = null;
        return ch;
    };


    NBoxTreeProto.traverse = function(fn, ctx) {
        var depth = 0;
        function bound(node) {
            if (!fn.call(ctx, node, depth)) {
                var ch = node.ch;
                if (ch) {
                    depth++;
                    ch.forEach(bound);
                    depth--;
                }
            }
        }
        bound(this.root);
    };

    NBoxTreeProto.putDot = function(dot) {
        return this.root.putDot(dot, 0, this.maxcnt);
    };

    return NBoxTree;
});
