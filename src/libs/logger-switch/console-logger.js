(function() {
    var DEBUG = false; // set to false to disable debugging
    

    function switchLogger() {
        if(!DEBUG){
            if(!window.console) window.console = {};
            var methods = ["log", "debug", "warn", "info"];
            for(var i=0;i<methods.length;i++){
                console[methods[i]] = function(){};
            }
        }       
    }

    var logSwitch = document.getElementById("logSwitch");
    if (logSwitch) {
        initLog();
        logSwitch.addEventListener("change", function(event) {
          resetLog();
        });
    }

    function initLog() {
        //keep the state of the button from last time
        var logSelected =
            localStorage.getItem("logSwitch") !== null &&
            localStorage.getItem("logSwitch") === "off";
        logSwitch.checked = !logSelected;

        //initialize the console state
        logSwitch.checked
            ? DEBUG = true
            : DEBUG = false;
        switchLogger();
        }

    
    function resetLog() {
        if (logSwitch.checked) {
            DEBUG = true;
            localStorage.removeItem("logSwitch");
            switchLogger();
            console.log('console logger enabled');
            
        } 
        else {
            console.log('console logger disabled');
            localStorage.setItem("logSwitch", "off");
            DEBUG = false;
            
            switchLogger();
            console.log('console logger disabled');
            
        }
    }
    
    
    
})();