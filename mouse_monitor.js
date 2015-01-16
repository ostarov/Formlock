// Content script
var clickedEl1 = null;
var clickedEl2 = null;

document.addEventListener("mousedown", function(event) {
    // Right click
    if (event.button == 2) { 
        // Keep two copies
        clickedEl1 = event.target;
        clickedEl2 = event.target;
        
        // Active notification to prepare menu
        var p = clickedEl1;
        
        while (p && p.tagName != "FORM") {     
            p = p.parentElement;
        }
        
        if (p != null) {
            var domain = getHostname(p.getAttribute('action'));       
            chrome.runtime.sendMessage({req: "newForm", method: p.method, domain: domain});
        }
        else {
            chrome.runtime.sendMessage({req: "newForm"});
        }
        
        clickedEl1 = null;
    }
}, true);

function getHostname(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {  
    
    if (request.msg == "FGetClickedElement" && document.URL == request.url) {
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
