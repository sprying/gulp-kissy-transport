KISSY.add('app/index', function (S, Node, Feature) {
    console.log('hi');
}, {
    requires: [
        'node',
        'components/feature/',
        'components/feature_3/',
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