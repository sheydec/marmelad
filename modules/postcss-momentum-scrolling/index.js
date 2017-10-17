'use strict';

const postcss = require('postcss');

module.exports = postcss.plugin('postcss-momentum-scrolling', function (opts) {

    opts = opts || {};

    return function (root) {

        root.walkRules(rule => {

            let hasMomentumScroll = false,
                hasOverflowDecl = false;

            rule.walkDecls(decl => {

                if (!hasMomentumScroll && decl.prop.match(/^-webkit-overflow/g)) {
                    hasMomentumScroll = true;
                }

                if (!hasOverflowDecl && decl.prop.match(/^overflow/g) && decl.value !== 'hidden') {
                    hasOverflowDecl = true;
                }
            });

            if (!hasMomentumScroll && hasOverflowDecl) {

                rule.append({
                    prop: '-webkit-overflow-scrolling',
                    value: 'touch'
                });
            }
        });

    };
});
