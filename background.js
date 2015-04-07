/*
    Main background Form Lock script.
*/

alert("Thank you for trying FormLock!\nSincerely, PragSec Team");

// BLOCKS THIRD-PARTY DOMAINS EXCEPT THE LOCK
// TODO: change global blocking to per tab/frame based!
var lockDomains = [];
//var lockTab = null;
var blocked = [];

// TODO: analyze the "requestBody"
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        var fCancel = false;
        if (lockDomains.length > 0) {
            fCancel = true;
            var current_domain = getRootDomain(getHostname(details.url));
            
            for (l in lockDomains) {
                if (lockDomains[l] === current_domain) {
                    fCancel = false;
                    break;
                }
            }
        
            if (fCancel) {
                //console.log(details.url);
                blocked.push(details.url);
            }
        }
        return {cancel: fCancel};
    },
    {urls: ["<all_urls>"]},
    ["blocking"] 
);

// CREATES THE CONTEXT MENU AND ITS CLICK HANDLERS
chrome.runtime.onInstalled.addListener(function() {
    
    // (1) Process the menu clicks
    var clickHandler = function(info, tab) {
        var url = info.frameUrl ? info.frameUrl : info.pageUrl;
        
        // Explain the form risks option
        if (info.menuItemId === "explainRisks") {   
            chrome.tabs.sendMessage(tab.id, {"msg": "FLGetClickedForm", "url": url}, function(payload) {
                if (payload !== null) {
                    var violation = "";

                    var global_url = getRootDomain(getHostname(tab.url));
                    var current_url = getRootDomain(payload.domain);

                    if (global_url !== current_url) violation += "> Third-party: " + current_url + "\n"; 
                    if (payload.method === "get") violation += "> Submit with GET\n";

                    if (violation === "") violation = "Looks safe.";
                    
                    alert(violation);
                }
            });
        }
        
        // Set the lock for one domain allowed
        if (info.menuItemId === "lock") {    
            if (lockDomains.length > 0) {
                // Remove LOCK
                var msg = "Unlocked. Third-party requests blocked " + blocked.length + ":\n";
                for (b in blocked) {
                    msg += getRootDomain(getHostname(blocked[b])) + "\n";
                }
                chrome.browserAction.setBadgeText({text: ""})
                chrome.browserAction.setTitle({title: "FormLock"})
                chrome.contextMenus.update("lock", {"title": "Set LOCK"});
                lockDomains = []
                blocked = []
                chrome.tabs.reload(tab.id);
                //chrome.tabs.executeScript(tab.id, {code: "window.location.reload();"});
                alert(msg);            
            }
            else {
                // Set LOCK
                chrome.tabs.sendMessage(tab.id, {"msg": "FLGetClickedForm", "url": url}, function(payload) {
                    if (payload !== null) {                            
                        // Page url and the form url
                        var first = getRootDomain(getHostname(tab.url));
                        var second = getRootDomain(payload.domain);
                        lockDomains.push(first);
                        if (first !== second) {
                            lockDomains.push(second);
                        }
                        chrome.browserAction.setBadgeText({text: "on"})
                        chrome.browserAction.setTitle({title: lockDomains.join("\n")})
                        alert("Locked. Requests are allowed to only:\n" + lockDomains.join("\n"));  
                        chrome.contextMenus.update("lock", {"title": "Remove LOCK"});  
                    }
                });
            }   
        }
    }; 
    
    // (2) Register the menu items
    chrome.contextMenus.create({"title": "FormLock", "contexts": ["all"], "id": "Formstery"});
    chrome.contextMenus.create({"title": "Submit method: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitMethod"});
    chrome.contextMenus.create({"title": "Submits to: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitTo"});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Explain sharing risks.", "contexts": ["all"], "parentId": "Formstery", "id": "explainRisks", "onclick": clickHandler});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Set LOCK", "contexts": ["all"], "parentId": "Formstery", "id": "lock", "onclick": clickHandler}); 
});

// UPDATES THE CONTEXT MENU WITH CURRENT FORM'S INFO
// TODO: consider reliability and usability of this approach!
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
    if (request.req === "FLClickedForm") {      
        chrome.contextMenus.update("submitMethod", {"title": "Submit method: " + request.method});
        chrome.contextMenus.update("submitTo", {"title": "Submits to: " + getRootDomain(request.domain)});
    }
});

// INTERCEPTS PAGE SCRIPTS ON A NEW URL LOADED
chrome.webNavigation.onCompleted.addListener(function(o) {
    
    // (1) Monitoring mouse events
    chrome.tabs.executeScript(o.tabId, {file: "utils.js", allFrames: true}, function(tab) {
        // UTILS ->
        chrome.tabs.executeScript(o.tabId, {
                allFrames: true,
                file: "mouse_track.js"
        });
        // <- UTILS
    });
    
    // (2) Highlighting risky forms
    chrome.tabs.executeScript(o.tabId, {file: "utils.js", allFrames: true}, function(tab) {
        // UTILS ->
        chrome.tabs.get(o.tabId, function(tab) { 
            // Passing the tab URL
            chrome.tabs.executeScript(o.tabId, { 
                allFrames: true,
                code: "var taburl = \"" + tab.url + "\";"
            }, 
            function() {
                // Main code
                chrome.tabs.executeScript(o.tabId, {
                    allFrames: true,
                    file: "form_check.js"
                });
            });
        }); 
        // <- UTILS
    });
});



