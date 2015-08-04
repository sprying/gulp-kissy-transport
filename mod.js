var extend = require('extend')
function Mod(cfg){
    extend(this,{
        name : '',
        content : '',
        path : '',
        requires : [],
        requireObj : {}
    },cfg);
}
Mod.prototype.add = function(type,value){
    switch(type){
        case 'requires':
            this.requires.push(value)
            break;
        case 'requireObj':
            this.requireObj[value.get('name')] = value
            break;
    }
}
Mod.prototype.get = function(type){
    switch(type){
        case 'requires':
            return this.requires
        case 'name':
            return this.name
        case 'isFolder':
            return this.isFolder
        case 'path':
            return this.path

    }
}

module.exports=Mod
