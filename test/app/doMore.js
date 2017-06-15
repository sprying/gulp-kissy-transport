/**
 * Created by sprying.fang@gmail.com on 2017/6/14.
 */
KISSY.add('common/doMore', function () {
    // console.log('from path app/doMore')
    console.log('from path app/doMore, module name is common/doMore')
})
// up is wrong
// seed.js:251 app/doMore is not loaded! can not find module in path : http://localhost:8989/test/app/??doMore.js
KISSY.add('app/doMore', function () {
    console.log('from path app/doMore, module name is app/doMore')
})
