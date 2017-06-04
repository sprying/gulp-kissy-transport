/**
 * Created by yingchun.fyc@alibaba-inc.com on 2017/6/4.
 */

function addIndexAndJsExtFromName(name) {
    // 'x/' 'x/y/z/'
    if (name.charAt(name.length - 1) === '/') {
        name += 'index';
    }
    if (name.slice(-3) != '.js') {
        name = name + '.js';
    }
    return name;
}

function nameInPath(modName, path){
    var modPath = addIndexAndJsExtFromName(modName)
    return  path.substr(0 - modPath.length) == modPath
}
exports.addIndexAndJsExtFromName = addIndexAndJsExtFromName
exports.nameInPath = nameInPath
