//alert(window.location.href);
//console.log(taburl);

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

var global_url = getRootDomain(getHostname(taburl));
//var current_url = getHostname(document.URL);

// Iterate over all forms
for (var f = 0; f < document.forms.length; ++f) {
    
    //alert(document.forms[f].action);
    
    var current_url = getRootDomain(getHostname(document.forms[f].getAttribute('action')));
    
    /*
    // Variant - Adding link for more info
    document.forms[f].style.padding = "0px";
    if (document.getElementById("Formstery") == null) {
        var info = document.createElement("a");
        info.id = "Formstery";
        //info.style.position = "relative";
        //info.style.left = "0px";
        //info.style.top = "0px"
        info.style.zIndex = "+1";
        info.style.color = "white";
        info.style.backgroundColor = "red";
        info.onclick = function () { alert('Hello World!'); };
        info.innerHTML = "<b>Sharing</b>";
        document.forms[f].appendChild(info);
        //document.forms[f].insertBefore(info, document.forms[f].firstChild);
    }
    */
    
    var violation = "";
    
    if (document.forms[f].method == "get") {
        violation += "> Submit with GET\n";
    }
    
    if (global_url != current_url) {
        violation += "> Third-party: " + current_url + "\n";
    }
    
    if (violation != "") {
    
        document.forms[f].style.border = "medium solid red"; 
        
        /*
        // Variant - Registering doubleclick for more info
        document.forms[f].val = violation;
        document.forms[f].ondblclick = function(event) {
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
            else if (document.selection) {
                document.selection.empty();
            }

            alert(this.val);  
            console.log(this.val);
        }
        */
    }
    
    /*
    document.forms[f].onsubmit = function() {         
        //alert("Submit!");
        
        //chrome.runtime.sendMessage("submit");
        
        var inputs = "";
          
        for (var e = 0; e < this.elements.length; ++e) {
            var name = this.elements[e].name;
            var type = this.elements[e].type;
            var value = this.elements[e].value;
            
            // TODO: better separators!
            inputs += name + "," + type + "," + value + "\n";
        }
        
        return false;
    }
    */
}

