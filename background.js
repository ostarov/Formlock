/*
    Main background Form Lock script.
*/

alert("Thank you for trying FormLock!");

// INTERCEPTS PAGE SCRIPTS ON NEW URL LOADED
chrome.webNavigation.onCompleted.addListener(function(o) {
    
    // (1) Tracking the mouse events  
    //chrome.tabs.executeScript(tabId, {file: "utils.js"}, function(){
    chrome.tabs.executeScript(o.tabId, {
            allFrames: true,
            file: "mouse_track.js"
    });
    
    // (2) Checking the available forms
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
});

// The one allowed domain
var lockDomain = null;
var blockedCounter = 0;

// BLOCKS THIRD-PARTY DOMAINS EXCEPT THE LOCK
// TODO: chenge global blocking to per tab/frame based!
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        var current_domain = getRootDomain(getHostname(details.url));
        var fCancel = (lockDomain != null && lockDomain != current_domain);
        
        if (fCancel) {
            console.log(details.url);
            blockedCounter++;
        }
        
        return {cancel: fCancel};

    },
    {urls: ["<all_urls>"]},
    ["blocking"] // TODO: analyze the "requestBody" too!
);


// UPDATES THE CONTEXT MENU WITH CURRENT FORM'S INFO
// TODO: consider reliability and usability of this approach!
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
    if (request.req === "FLClickedForm") {      
        chrome.contextMenus.update("submitMethod", {"title": "Submit method: " + request.method});
        chrome.contextMenus.update("submitTo", {"title": "Submits to: " + getRootDomain(request.domain)});
    }
});

// Helper functions
// TODO: move to utils.js
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

// CREATES THE CONTEXT MENU AND ITS CLICK HANDLERS
chrome.runtime.onInstalled.addListener(function() {
    
    // (1) Process the menu clicks
    var clickHandler = function(info, tab) {
        //console.log("info: " + JSON.stringify(info));
        //console.log("tab: " + JSON.stringify(tab));
        
        var url = info.frameUrl ? info.frameUrl : info.pageUrl;
        
        // Explain the form risks option
        if (info.menuItemId === "formRisks") {
        
            chrome.tabs.sendMessage(tab.id, {"msg": "FLGetClickedElement", "url": url}, function(payload) {
                //alert(payload.method);
                //console.log(JSON.stringify(payload));

                if (payload != null) {

                    // TODO: move to utils.js
                    var violation = "";

                    var global_url = getRootDomain(getHostname(tab.url));
                    var current_url = getRootDomain(payload.domain);

                    if (global_url != current_url) {
                        violation += "> Third-party: " + current_url + "\n";
                    }
                    
                    if (payload.method === "get") {
                        violation += "> Submit with GET\n";
                    }

                    if (violation === "") {
                        violation = "Looks safe.";
                    }

                    alert(violation);
                }
            });
        }
        
        // Set the lock for one domain allowed
        if (info.menuItemId === "blockDomains") {
            
            chrome.tabs.sendMessage(tab.id, {"msg": "FLGetClickedElement", "url": url}, function(payload) {

                if (payload != null) {
                    
                    if (lockDomain != null) {
                        alert("Please, remove the current lock to the \"" + lockDomain + "\" first. You can use the context menu.");
                    }
                    else {          
                        lockDomain = getRootDomain(payload.domain);
                        alert("Submit the form in private! Now only calls to the \"" + lockDomain 
                              + "\" are allowed. To remove the lock use context menu.")
                    
                        chrome.contextMenus.update("removeLock", {"title": "Remove lock: " + lockDomain});  
                    }
                }
            });   
        }
        
        // Removes the current form lock
        if (info.menuItemId === "removeLock") {         
            var buf = "Lock for the only \"" + lockDomain + "\" has been removed. " + "Third-party requests blocked: " + blockedCounter + ".";
                   
            chrome.contextMenus.update("removeLock", {"title": "Remove lock: <none>"});
            
            if (blockedCounter === 0) {
                alert(buf);
            }
            else {
                var answer = confirm(buf + " For more privacy it is better to reload the tab, okay?");
                if (answer === true) {
                    chrome.tabs.executeScript(tab.id, {code: "window.location.reload();"});
                }
            }
            
            lockDomain = null;
            blockedCounter = 0;
        }
    }; 
    
    // (2) Register the menu items
    chrome.contextMenus.create({"title": "FormLock", "contexts": ["all"], "id": "Formstery"});
    chrome.contextMenus.create({"title": "Submit method: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitMethod"});
    chrome.contextMenus.create({"title": "Submits to: undefined", "contexts": ["all"], "parentId": "Formstery", id: "submitTo"});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Explain sharing risks.", "contexts": ["all"], "parentId": "Formstery", "id": "formRisks", "onclick": clickHandler});
    chrome.contextMenus.create({"type": "separator", "contexts": ["all"], "parentId": "Formstery"});
    chrome.contextMenus.create({"title": "Allow only this domain.", "contexts": ["all"], "parentId": "Formstery", "id": "blockDomains", "onclick": clickHandler});
    chrome.contextMenus.create({"title": "Remove lock: <none>", "id": "removeLock", "contexts": ["all"], "parentId": "Formstery", "onclick": clickHandler}); 
});
