window.onhashchange = function(){
    hashChange();
}

function cleaner(){
	$ctrl = null;
	if($SERVICETYPE) $(window).off("resize", $SERVICETYPE.resize);
	if($CHECKLIST) $(window).off("resize", $CHECKLIST.resize);
	if ($ITEMSSEARCH) $(window).off("resize", $ITEMSSEARCH.resize);
	if ($REGISTER) $(window).off("resize", $REGISTER.resize);
	if ($FINISH) $(window).off("resize", $FINISH.resize);	
	//if ($FAILURE) $(window).off("resize", $FAILURE.resize);
	$("#header .title, #topButtons").hide();
	$(".loading").remove();
	loading_hide();
	$("body").removeClass("noHelp");
	$("#topButtons .fa-question-circle").hide();

	var $modals = $(".modal").modal('hide');
	setTimeout(function(){
		$modals.remove();
	}, 600);
	
	// Abort ajax
	if($SERVICETYPE.ajax_serviceType)
		$SERVICETYPE.ajax_serviceType.abort();
}

function hashChange(json) {
	checkToken();
	cleaner();
	var $body = $("body");

	if(location.hash == "#Logout"){
		$LOGIN.logout();
		return;
	}

	// Regresar al Login cuando no existe la sesion
	if(!localStorage.WebToken && location.hash != '#Login'){
		//$body.removeClass("loaded");
		//location.hash = 'Login';
		$LOGIN.logout();
		return;
	}

	if( typeof(event) != "undefined" && event.type == "click" ){
		if(json && json.href){
			location.href = "#" + json.href + "/rnd" + new Date().getTime();
			return;
		}
		else if( !(json && json.refresh) )
			return;
	}
	
	// Firefox
	if(navigator.userAgent.indexOf("Firefox") != -1){
		if(json && json.href){
			location.href = json.href + "/rnd" + new Date().getTime();
			return;
		}
	}	
	
    console.log("Hash change");    
		
    if(localStorage.WebToken){
    	// Header & Style
    	if( !$body.hasClass("loaded") ){
    		var username = localStorage.Username;
    		if(localStorage.autologin)
    			username = username.split(" ")[0];
    		$("#header .user, #menu .user").html(username);

			$body.addClass("loaded").removeClass("noUser").append("<div class='customStyle hide'>"+localStorage.Style+"</div>");
		}
		$("#topButtons, #header .fa-power-off").show();

		// Cerrar sesion
		if(getPermission("CerrarSesion"))
			$("#topButtons .logout").show();
	}
	$("#header").show();

    var arrHash = location.hash.replace("#", "").split("/");
    var hash = arrHash[0].toUpperCase();
    var loadHTML, loadJS, afterFn;
    $("#content").hide();
    switch(hash)
    {
    	case "REPORTS":
    		loadHTML = "reports.html";
			afterFn = function(){
				$REPORTS.start();
			}
    		break;

		case "LOGIN":
			if(localStorage.WebToken){
				if(location.href.split("?").length > 1){
					//location.href = location.href.split("?")[0] + "Reports";
					location.href = location.href.split("?")[0] + "#Reports";
					return;
				}				
				location.hash = "Reports";
				return;
			}
			loadHTML = "login.html";
			afterFn = function(){
				$LOGIN.start();
			}
			break;
		
		case "SERVICETYPE":
			loadHTML = "serviceType.html";
			afterFn = function(){
				$SERVICETYPE.start();
			}
			break;

		case "ITEMSSEARCH":
			loadHTML = "items.html";
			afterFn = function(){
				$ITEMSSEARCH.clear();
				$ITEMSSEARCH.start();
			}
			break;

        case "CHECKLIST":
            loadHTML = "checklist.html";
            afterFn = function() {
                $CHECKLIST.start();
            }
            break;
            
        case "FAILURE":
            loadHTML = "failure.html";
            afterFn = function () {
                $FAILURE.start();
            }
            break;
		
		case "REGISTER":
			loadHTML = "register.html";
            afterFn = function() {
                $REGISTER.start();
            }
			break;

		case "SUPPLIER":
			loadHTML = "supplier.html";
			afterFn = function() {
				$SUPPLIER.start();
			}
			break;
		
		case "FINISH":
			loadHTML = "finish.html";
            afterFn = function() {
                $FINISH.start();
            }
			break;

        default:
        	location.hash = "#Login";
        	break;
    }
	
	if(loadHTML){
		if(loadJS){
			loadScript(urlContent + "JS/" + loadJS, function(){
				_loadHTML();
			});
		}
		else {
			_loadHTML();
		}

		function _loadHTML(){
			$("#content").load(urlContent + "Html/" + loadHTML, function(){			
				$("#content").fadeIn(500);
				tabindex();
				if(typeof afterFn == "function")
					afterFn();
			});			
		}
	}
}