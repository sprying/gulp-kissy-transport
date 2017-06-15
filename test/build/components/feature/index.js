KISSY.add('components/feature/', function (S, io) {
    console.log('from path components/feature/index, module name is components/feature/');
}, {
    requires: [
        'io',
        'components/feature/util',
        'node',
        'components/feature_2/index',
        'json',
        'components/feature_2/tool',
        'ajax',
        'dd',
        'resizable'
    ]
});