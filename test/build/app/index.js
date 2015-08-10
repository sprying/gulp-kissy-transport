KISSY.add('app/index', function (S, Node, Feature) {
    console.log('hi');
}, {
    requires: [
        'node',
        'components/feature/',
        'components/feature_3/',
        'io',
        'components/feature_2/index',
        'ajax',
        'json',
        'dd',
        'resizable',
        'xtemplate'
    ]
});