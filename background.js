alert("Thank you for using Formstery!");

var params = null;
var global = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    
    if (request.req == "newForm") {
        //console.log(JSON.stringify(request));
        
        chrome.contextMenus.update("submitMethod", {"title": "Submit method: " + request.method});
        chrome.contextMenus.update("submitTo", {"title": "Submits to: " + getRootDomain(request.domain)});
    }
});

chrome.webNavigation.onCompleted.addListener(function(o) {
    
    chrome.tabs.executeScript(o.tabId, {
        allFrames: true,
        file: "mouse_monitor.js"
    });
    
    chrome.tabs.get(o.tabId, function(tab) {
        
        //alert(tab.url);
        //console.log(tab.url);
        
        chrome.tabs.executeScript(o.tabId, { 
            allFrames: true,
            code: "var taburl = \"" + tab.url + "\";"
            }, 
            function() {
                chrome.tabs.executeScript(o.tabId, {
                    allFrames: true,
                    file: "form_check.js"
                });
            });
    }); 
});

var trackDomain = null;

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        //console.log(JSON.stringify(details));
        
        var d = getRootDomain(getHostname(details.url));
        if (trackDomain != null && trackDomain != d) {
            console.log(details.url);
        }
        
        /*
        //if (details.url.indexOf("track") != -1) {
        if (details.requestBody != undefined) {
            alert(details.url);
            alert(JSON.stringify(details.requestBody));
        }
        
        return {cancel: details.url.indexOf("://www.evil.com/") != -1};
        */
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestBody"]);



function getHostname(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
}

function getRootDomain(hostname) {
    if (hostname == undefined || hostname == null) return hostname;
    
    var arr = hostname.split('.');
    if (arr.length > 1) {
        return arr[arr.length-2] + '.' + arr[arr.length-1];
    }
    else {
        return hostname;
    }
}

chrome.runtime.onInstalled.addListener(function() {
    
    var clickHandler = function(info, tab) {
        //console.log("info: " + JSON.stringify(info));
        //console.log("tab: " + JSON.stringify(tab));
        
        var url = info.frameUrl ? info.frameUrl : info.pageUrl;
        
        if (info.menuItemId == "formRisks") {
        
            chrome.tabs.sendMessage(tab.id, {"msg": "FGetClickedElement", "url": url}, function(payload) {
                //alert(payload.method);
                //console.log(JSON.stringify(payload));

                if (payload != null) {

                    var violation = "";

                    if (payload.method == "get") {
                        violation += "> Submit with GET\n";
                    }

                    var global_url = getRootDomain(getHostname(tab.url));
                    var current_url = getRootDomain(payload.domain);

                    if (global_url != current_url) {
                        violation += "> Third-party: " + current_url + "\n";
                    }

                    if (violation == "") {
                        violation = "Looks safe.";
                    }

                    alert(violation);
                }
            });
        }
        
        /*
        if (info.menuItemId == "track") {
            
            var url = info.frameUrl;
            if (url == undefined) url = info.pageUrl;
            
            trackDomain = getRootDomain(getHostname(url));   
        }
        */
    }; 
    
    // Prepare menu
    chrome.contextMenus.create({"title": "Formstery", "contexts": ["all"], "id": "Formstery"});
    chrome.contextMenus.create({"title": "Submit method: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitMethod"});
    chrome.contextMenus.create({"title": "Submits to: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitTo"});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Explain sharing risks.", "contexts": ["all"], "parentId": "Formstery", "id": "formRisks", "onclick": clickHandler});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Block other domains.", "contexts": ["all"], "parentId": "Formstery", "id": "blockDomains", "onclick": clickHandler});
    
    
    
});
