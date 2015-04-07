var getHostname = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
}

var getRootDomain = function(hostname) {
    if (hostname == undefined || hostname == null) return hostname;  
    var arr = hostname.split('.');
    if (arr.length > 1) {
        return arr[arr.length-2] + '.' + arr[arr.length-1];
    }
    else {
        return hostname;
    }
}