KISSY.add('app/index', function (S, Node, Feature) {
    console.log('hi, module app/index start');
}, {
    requires: [
        'node',
        'components/feature/index',
        'components/feature_3/index.js',
        'app/doMore',
        'io',
        'components/feature/util',
        'components/feature_2/index',
        'json',
        'components/feature_2/tool',
        'ajax',
        'dd',
        'resizable',
        'xtemplate'
    ]
});
KISSY.add('common/index', function () {
    console.log('from path app/index, module name is common/index');
}, { requires: ['common/doMore'] });