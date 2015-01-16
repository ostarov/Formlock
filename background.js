alert("Thank you for using FormLock!");

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

var allowedDomain = null;
var blockedCounter = 0;

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        //console.log(JSON.stringify(details));
        
        // TODO: block only for specific tab/frame?
        var current_domain = getRootDomain(getHostname(details.url));
        var fCancel = (allowedDomain != null && allowedDomain != current_domain);
        
        if (fCancel) {
            console.log(details.url);
            blockedCounter++;
        }
        
        return {cancel: fCancel};

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
        
        if (info.menuItemId == "blockDomains") {
            
            chrome.tabs.sendMessage(tab.id, {"msg": "FGetClickedElement", "url": url}, function(payload) {

                if (payload != null) {
                    
                    if (allowedDomain != null) {
                        var buf = "Lock for only " + allowedDomain + " removed. " + "Third-party requests blocked: " + blockedCounter;
                   
                        allowedDomain = null;
                        blockedCounter = 0;
            
                        chrome.contextMenus.update("removeLock", {"title": "Remove lock: <none>"});
            
                        alert(buf);
                    }

                    allowedDomain = getRootDomain(payload.domain);
                    alert("Submit the form in private! Now only calls to " + allowedDomain 
                          + " are allowed. To remove the lock use context menu.")
                    chrome.contextMenus.update("removeLock", {"title": "Remove lock: " + allowedDomain});     
                }
            });   
        }
        
        if (info.menuItemId == "removeLock") {         
            var buf = "Lock for only " + allowedDomain + " removed. " + "Third-party requests blocked: " + blockedCounter;
                   
            allowedDomain = null;
            blockedCounter = 0;
            
            chrome.contextMenus.update("removeLock", {"title": "Remove lock: <none>"});
            
            alert(buf);
        }
    }; 
    
    // Prepare menu
    chrome.contextMenus.create({"title": "FormLock", "contexts": ["all"], "id": "Formstery"});
    chrome.contextMenus.create({"title": "Submit method: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitMethod"});
    chrome.contextMenus.create({"title": "Submits to: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitTo"});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Explain sharing risks.", "contexts": ["all"], "parentId": "Formstery", "id": "formRisks", "onclick": clickHandler});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Allow only this domain.", "contexts": ["all"], "parentId": "Formstery", "id": "blockDomains", "onclick": clickHandler});
    chrome.contextMenus.create({"title": "Remove lock: <none>", "id": "removeLock", "contexts": ["all"], "parentId": "Formstery", "onclick": clickHandler}); 
});
