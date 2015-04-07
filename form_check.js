/*
    Highlights risky forms with red border.
*/

// Using global URL of the current tab
var global_url = getRootDomain(getHostname(taburl));

// Iterate over all forms
for (var f = 0; f < document.forms.length; ++f) {

    var current_url = getRootDomain(getHostname(document.forms[f].getAttribute('action')));

    var violation = "";
    
    if (global_url !== current_url) {
        violation += "> Third-party: " + current_url + "\n";
    }
    
    if (document.forms[f].method === "get") {
        violation += "> Submit with GET\n";
    }
    
    if (violation !== "") {   
        document.forms[f].style.border = "medium solid red"; 
    }
}
