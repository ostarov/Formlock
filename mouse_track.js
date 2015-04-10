/*
    Tracks the mouse location and context menu clicks.
*/

var clickedEl1 = null;
var clickedEl2 = null;

document.addEventListener("mousedown", function(event) {
    // Right click
    if (event.button == 2) { 
        // Keep two copies
        clickedEl1 = event.target;
        clickedEl2 = event.target;
        
        var p = clickedEl1;
        while (p && p.tagName != "FORM") {     
            p = p.parentElement;
        }
        
        // Active notification to prepare menu
        if (p != null) {
            var domain = getHostname(p.getAttribute('action'));
            chrome.runtime.sendMessage({req: "FLClickedForm", method: p.method, domain: domain});
        }
        else {
            chrome.runtime.sendMessage({req: "FLClickedForm"});
        }
        
        clickedEl1 = null;
    }
}, true);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { 
    // Retrive the clicked form for locking
    if (request.msg == "FLGetClickedForm" && document.URL == request.url) {
        var p = clickedEl2;
        
        while (p && p.tagName != "FORM") {     
            p = p.parentElement;
        }
        
        if (p != null) {
            var domain = getHostname(p.getAttribute('action')); 
            sendResponse({method: p.method, domain: domain});
        }
        
        clickedEl2 = null;
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          alert('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
        }
});
