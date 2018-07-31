var $ctrl;
$(document).ready(function(){
    console.log("ready");
    
    hashChange();
    initDate_header();
    menu_config();
    $(window).resize();
});

$(window).resize(function(){
	loading_resize();

	// Menu
	if(window.innerWidth >= 768){
		menu_hide();
		$("body").removeClass("isMobile").addClass("isDesktop");
	}
	else {
		$("body").removeClass("isDesktop").addClass("isMobile");
	}

	popup_resize();
	help_resize();
});

// Fecha y hora actual en el header
function initDate_header(){
	console.log("initDate_header");
	$("#topButtons .fa-question-circle").tooltip();
    var $date = $("#header .datetime");
    _datetime();
    setInterval(function(){ _datetime(); }, 1000);

    function _datetime(){
        var newDate = new Date();
        var datetime = '<span class="date">'+ newDate.today() +'</span><span class="time">'+ newDate.timeNow() +'</span>';
        $date.html(datetime);
    }
}

function menu_config(){
	$("#menu").on("click", function(){
		console.log("click menu");
		if(event.target.id == "menu" || $(event.target).hasClass("option") || $(event.target).hasClass("fa-arrow-left")){
			menu_hide();
		}		
	});
}

function menu(){
	console.log("menu");
	$("body").addClass("menu");
}
function menu_hide(){
	$("body").removeClass("menu");
}

function loadScript(url, callback) {
    $.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}

function tabindex(){
    $(".button").attr("tabindex", 0).on("keydown", function(e){
        var code = e.which;
		// Enter y espacio
		if ((code === 13) || (code === 32)) {
			$(this).click();
		}
    });
}

function getUrl(servicio, metodo) {
    return $WCF + servicio + ".svc/json/" + metodo;
}

function SVC(json) {
	checkToken();
    if (!json) {
        console.log("No hay informacion");
        return;
    }
    /*El metodo no debe ser nulo, puede ser GET, POST*/
    if (!json.type) {
        json.type = "GET";
    }
    if (!json.url) {
        console.log("URL es nulo");
        return;
    }
    else {
    	// Add random
    	if(json.url.indexOf("?") == -1)
    		json.url += "?random=" + new Date().getTime();
		else
			json.url += "&random=" + new Date().getTime();
    }
    
    if (!json.Timeout) {
        json.Timeout = 300000;
        //json.Timeout = 10000;
    }
    
    // Loading
    if(json.loading){
    	if(json.toggleLoading)
    		$(json.loading).show();

    	$(json.loading).loading();
    }
    else if( !json.noLoading )
    	loading();

    json.AfterMsgError = json.AfterMsgError ? json.AfterMsgError : '';

    // Ejecuta una funcion antes del ajax
    if (typeof json.beforeFunction == "function")
        json.beforeFunction();

    var jsonAjax = {
        type: json.type,
        url: json.url,
        success: _done,
        error: _fail,
        complete: function(){
        	if(typeof json.complete == "function")
        		json.complete();
        	if(json.$focus)
        		json.$focus.focus();
        	if(json.toggleLoading)
    			$(json.loading).hide();
			if(json.loading)
    			$(json.loading).unloading();
			
			loading_resize();
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {},
        timeout: json.Timeout,
        xhr: json.xhr
    }
    if( json.data )
        jsonAjax.data = JSON.stringify(json.data);
    if( json.headers )
        jsonAjax.headers = json.headers;

	// WebToken
	if( !jsonAjax.headers.WebToken && localStorage.WebToken )
		jsonAjax.headers.WebToken = localStorage.WebToken;

    var ajax = $.ajax(jsonAjax);

    function _done(jResponse){
    	if(!json.noHideLoading)
        	loading_hide();
		
		if(json.toggleLoading)
			$(json.loading).hide();
		
		if(jResponse.MensajeError && jResponse.MensajeError.Mensaje){
			//warning(jResponse.MensajeError.Mensaje);
			_fail(jResponse);
			return;
		}

        if( typeof json.success == "function" )
            json.success(jResponse);
    }

    function _fail(jsonResponse){
        console.log("Error en SVC");
        
        loading_hide();

        if( typeof json.fail == "function" )
        {
            json.fail(jsonResponse);   
        }
        else 
        {
            var errorMsg = getErrorSVC(jsonResponse);
            
            // WebToken invalido => logout
            if( errorMsg.type == "WebToken" )
            {
            	location.href = "#Logout";
            	if( errorMsg.message != "El token es requerido" )
            		error("La sesión ha expirado.");
            	return;
            }

            var typeAlert = 'error';
            if (errorMsg.type == "BusinessRule") {
                typeAlert = 'warning';
            }

            if (errorMsg.message) {
                var msg = errorMsg.message;
                if (typeof json.AfterMsgError == 'function')
                    json.AfterMsgError(errorMsg);
                else
                    msg += json.AfterMsgError;

                // Caso de success
                if (errorMsg.type == "Success") {
                    ajax.done();
                    success(msg);
                    if (typeof json.AfterMsgSuccess == 'function')
                        json.AfterMsgSuccess(errorMsg);
                    return;
                }
                else {
                    if (typeof json.fail_noAlert == "function")
                        json.fail_noAlert({
                            msg: msg,
                            typeAlert: typeAlert
                        });
                    else
                    {
                        if( typeAlert == 'warning' )
                            warning(msg);
                            /* No mostrar mensajes si son errores
                        else if( typeAlert == 'error' )
                            error(msg);
                            */
						
						console.log(msg);
                    }   
                }
            }

            if (errorMsg.technicalError)
                console.log("Technical error: " + errorMsg.technicalError);
            if (errorMsg.source)
                console.log("Origen del error: " + errorMsg.source);
			
			// Timeout
			if(jsonResponse.statusText == "timeout")
				error("Terminó el tiempo de espera.");
        }

        if( typeof json.fail_after == "function" )
            json.fail_after();
    }

    return ajax;
}

// Obtener el mensaje de error que regresa el SVC
function getErrorSVC(jsonResp) {
	var isError = false;
    if (jsonResp.responseText)
    	isError = true;
	
	if(jsonResp.MensajeError && jsonResp.MensajeError.Mensaje)
		isError = true;
	
	if(!isError)
		return "";

    var jError = {};

    if(jsonResp.responseText){
		var errorFull = jsonResp.responseText.split("<StackTrace")[0];
		//if (errorFull.split("<Message>").length > 1)
		  //  jError.message = errorFull.split("<Message>")[1].replace("</Message>", "");
		if (errorFull.split("<Message>").length > 1)
			jError.message = errorFull.split("<Message>")[1].split("</Message>")[0];

		// Tipo de error    
		if (errorFull.split("<Type>").length > 1)
			jError.type = errorFull.split("<Type>")[1].split("</Type>")[0];
		if(errorFull == "WebTokenError")
			jError.type = "WebToken";

		// ID
		if (errorFull.split("<Id>").length > 1)
			jError.id = errorFull.split("<Id>")[1].split("</Id>")[0];

		// Error técnico
		var matchText = jsonResp.responseText.match(/<Text[\w :="->]*<\/Text>/g);
		if(matchText && matchText.length)
			jError.technicalError = matchText[0].replace(/<Text[\w :="->]*MX">/g, "").replace(/<\/Text>/g, "");

		// Origen del error
		matchText = jsonResp.responseText.match(/<Origen[\w :|\n="->]*<\/Origen>/g);
		if(matchText && matchText.length)    
			jError.sourceError = matchText[0].replace(/<Origen>/g, "").replace(/<\/Origen>/g, "");    

		// Source
		if (errorFull.split("<Source>").length > 1)
			jError.source = errorFull.split("<Source>")[1].split("</Source>")[0];
	}
	else if(jsonResp.MensajeError){
		jError.message = jsonResp.MensajeError.Mensaje;
		jError.source = jsonResp.MensajeError.Cadena;
		if(jsonResp.MensajeError.TipoDeError == 1)
			jError.type = "BusinessRule";
		else {
			// Codigo fuente, no mostrar
			console.log("Error: " + jError.message);
			jError.message = "";
			//jError.message = "Ocurrió un error en el sistema. Por favor contacte al administrador.";
		}
	}
    
    return jError;
}

function loading(){
    $("#loading").css("display", "block").focus();
    $("#body").addClass("hasLoading");
	loading_resize();
}

function loading_hide(){
	$("#body").removeClass("hasLoading");
    $("#loading").hide();
}

// Centrar el loading
function loading_resize(){
	if( $("#loading").is(":visible") ) {
		var loading_height = $("#loading_items").height();
		var loading_width = $("#loading_items").width();
		$("#loading_items").css({ 
			top: ($(window).height() - loading_height) / 2, 
			left: ($(window).width() - loading_width) / 2 
		});
	}

	// Ajustar el loading a su elemento original
	_loading();
	setTimeout(function(){ _loading(); }, 100);
	setTimeout(function(){ _loading(); }, 200);
	function _loading() { $(".hasLoading").each(function(index, tag){ $(tag).loading(); }); }
}

// Crear el componente Tag
function createTag(json){
	var data = json.data;
	var $tag = $(
	'<div class="tag">' +
		'<span class="text">'+ data.name +'</span><i class="fa fa-times"></i>' +
	'</div>');
	
	json.$div.append($tag);
	$tag[0].data = {
		fileName: data.name,
		idDocument: data.idDocument,
		type: data.type,
		size: data.size,
		sizeView: data.sizeView,
		tempName: data.tempName
	}
	
	// Before destroy
	$tag.find(".fa").on("click", function(){
		if(typeof json.beforedestroyFn == "function"){
			json.beforedestroyFn($tag);
		}
	});
}

function checkToken(){
	if(window.webToken){
		if(window.webToken != localStorage.WebToken){
			sessionStorage.clear();
			location.reload();			
		}			
	}
	else
		window.webToken = localStorage.WebToken;
}

// Validaciones más comunes
function vamoAValidar(json) {
    var $cmp = json.$cmp;
    if ($cmp && json.type != "ISVALID_ONLY_ERROR") {
        $cmp.validation = true;
        if (typeof $cmp.validate == "function")
            $cmp.validate();
    }

    switch (json.type) {
        case "MULTILINE":
        case "MULTILINEA":
        case "TEXT":
        case "TEXTO":
            if ($cmp.valTrim() == "") {
                var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
            }
            if ( json.type.matchAny(["MULTILINEA", "MULTILINE"]) ) {
                $cmp.valTrim().split("\n").every(function (line) {
                    if (line.trim() == "") {
                        var newError = json.msgErrorMultiple; // Busca alguna linea vacia
                        if (json.error == "") {
                            json.error = newError;
                            json.$fieldError = $cmp;
                        }
                        $cmp.validate(newError);
                        return false;
                    }
                    return true;
                });
            }
            return $cmp.val();
            break;
		
		case "COMBO":
			if( !$cmp.val() ){
				var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    if($cmp.siblings(".combobox").find("input").length)
                    	json.$fieldError = $cmp.siblings(".combobox").find("input");
					else
						json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
			}
			return $cmp.val();
			break;
		
		case "CURRENCY":
			var value = $cmp.valTrim().match(/[0-9.]+/g);
			if(value) value = +value[0];
			if (value == null || value <= 0) {
                var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
            }
            return value;
        
        case "EMAIL":
            if (json.required == false && $cmp.valTrim() == "") {

            }
            else if (!validateEmail($cmp.valTrim())) {
                var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
            }
            break;
		
		case "ERROR":
            var newError = json.msgError;
            if (json.error == "") {
                json.error = newError;
                json.$fieldError = $cmp ? $cmp : "";
            }
            if($cmp)            
            	$cmp.validate(newError);
            break;
		
		case "CHARACTERS":
			if ($cmp.valTrim().length < json.count) {
                var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
            }
			return $cmp.val();
			break;
		
		case "DECIMAL":
			var value = +$cmp.val();
			if( isNaN(value) || value <= 0 )
			{
				var newError = json.msgError;
                if (json.error == "") {
                    json.error = newError;
                    json.$fieldError = $cmp;
                }
                $cmp.validate(newError);
			}
			return $cmp.val();
			break;
		
		case "ATTACHMENTS":
			var arr = [];
			$cmp.each(function(index, tag){
				var data = tag.data;
				arr.push({
					Nombre: data.fileName,
					Path: data.tempName
				});
			});
			var newError = json.msgError;
			if(json.required && arr.length == 0 && json.error == ""){
				json.error = newError;
                json.$fieldError = $cmp ? $cmp : "";
			}
			return arr;
    }

    // minLength
    if( json.minLength && $cmp.val().length < json.minLength )
    {
        var newError = json.msgError + " debe tener mínimo " + json.minLength + " caracteres.";
        if (json.error == "") {
            json.error = newError;
            json.$fieldError = $cmp;
        }
        $cmp.validate(newError);
    }
}

function getMaxZIndex(){
	var maxZ = Math.max.apply(null,$.map($('body > *'), function(e,n){           
		return parseInt($(e).css('z-index'))||1 ;
   	}));
    return maxZ;
}

function setHelp(json){
	if(!sessionStorage.campaign) return;	
	var jsonHelp;
	if(sessionStorage.campaignHelp){
		jsonHelp = JSON.parse(sessionStorage.campaignHelp);
		_setHTML();
	}
	else {
		var jsonCampaign = JSON.parse(sessionStorage.campaign);
		var campaign = jsonCampaign.CveTiposervicio;
        SVC({
            url: getUrl('WSCampania', 'ConsultarAyuda?CveCampania=' + campaign),
            loading: json.$section.parent(),
        	success: function(json){
        	    console.log("Ayuda");
        	    console.log(json);
        	    jsonHelp = json.Lista;
        	    sessionStorage.campaignHelp = JSON.stringify(json.Lista);
        	    _setHTML();
        	}
        });
	}

	function _setHTML(){
		var index = -1;
		jsonHelp.some(function(el, i) {
			if (el.Ventana == json.flow) {
				index = i;
				return true;
			}
		});

		if(index == -1) return;

		var help = jsonHelp[index].Ayuda;
		var bodyHelp = "";
		help.split("->").forEach(function(item){
			if(item.trim() != ""){
				bodyHelp +=
				'<div class="option">' +
                    '<div class="icoLeft">' +
                        '<i class="fas fa-chevron-circle-right _principal"></i>' +
                    '</div>' +
                    '<div class="contentRight">' +
                        '<span class="info">'+ item +'</span>' +
                    '</div>' +
                '</div>';
			}
		});

		var html = 
		'<div class="title" onclick="toggleHelp()">' +
			'<div class="icoLeft"><i class="fas fa-question-circle"></i></div>' +
			'<span class="text">Ayuda</span>' +
			'<i class="fas fa-angle-double-up right"></i>' +
			'<i class="fas fa-angle-double-down right"></i>' +
		'</div>' +
		'<div class="content">'+ bodyHelp +'</div>';
		json.$section.html(html);
	}
}

function help_resize(){
	console.log("help_resize");
	
	_resize();
	setTimeout(function(){ _resize(); 
		//if($ctrl && typeof $ctrl.resize == "function")
			//$ctrl.resize();
	}, 300);
	setTimeout(function(){ _resize(); }, 0);
	setTimeout(function(){
		if($ctrl && typeof $ctrl.resize == "function")
			$ctrl.resize();
	}, 600);

	function _resize(){
		var $main = $("#content .main");
		var $help = $main.find(".help .content");
		if(!$help.length) return;
		$help.css("height", 30);
		var maxHeight = $main.height() - $main.find(".subtitle").height() - 108;
		$help.css("height", "auto");
		$help.css("maxHeight", maxHeight);

		
	}
}

function getPermission(name){
	if(!localStorage.Permissions) return false;
	var arrPermissions = JSON.parse(localStorage.Permissions);
	var permission = false;
	arrPermissions.every(function(item){
		if(item.AccionDesc == name){
			permission = item.Activo;
			return false;	
		}
		return true;
	});
	return permission;
}

// Redondea un numero a 2 decimales
function round2Decimals(num) {
    num = num.toString().replace(/,/g, "");
    if (isNaN(num) || num == "") num = 0;
    return (+(Math.round(num + "e+2") + "e-2")).toFixed(2);
}

function minutes2hours(str){
	var arr = str.toString().split(":");
	var hoursTotal = +arr[0];
	var minutes = +arr[1] || 0;
	var days = Math.floor(hoursTotal / 24);
	var hours = hoursTotal % 24;	
	var result = "";
	if(days == 1)
		result += days + " día ";
	else if(days > 1)
		result += days + " días ";
	result += hours + ":" + ("0" + minutes).slice(-2) +" hrs";
	return result;
}

function matchFields(){
	$("[match=alphanumeric_sp]").on("input", function(){
		var match = this.value.match(/([A-z ÁÉÍáéíúóÓÚÑñ])+/g);
		var value = "";
		if(match)
			value = this.value.match(/([A-z ÁÉÍáéíúóÓÚÑñ])+/g).join("");
		this.value = value;
	});
}

function toggleHelp(){
	console.log("toggleHelp");
	
	var $body = $("body"), $icoHelp = $("#topButtons .fa-question-circle");
	if($icoHelp.is(":animated")) return;

	// $body.hasClass("isMobile") || 
	
	var $help = $(".section.help");
	//var $contentHelp = $help.find(".content");
	var $left = $help.parent();
	//if($left.is(":visible")){
	if(!$body.hasClass("noHelp")){
		if(!$body.hasClass("isMobile"))
			$left.fadeOut();
		$left.hide();
		$icoHelp.fadeIn(function(){	});
		$body.addClass("noHelp");
	}
	else {
		if(!$body.hasClass("isMobile"))
			$left.fadeIn();
		$left.show();
		$body.removeClass("noHelp");
		$icoHelp.fadeOut(function(){ });
		$(".ui-tooltip").hide();
	}

	$(window).resize();
}

function toggleSuggestion(){
	console.log("toggleSuggestion");
	$("#serviceType .jstree-clicked").click();
}

function success(msg){
	$.iaoAlert({ msg: msg, type: "success", mode: "dark" });
}
function warning(msg){
	$.iaoAlert({ msg: msg, type: "warning", mode: "dark" });
}
function error(msg){
	$.iaoAlert({ msg: msg, type: "error", mode: "dark" });
}

//datatable
function createDataTable(idTable, extraParams){
    
    var tableInitParams = {
        destroy: true,
        lengthChange: false,
        autoWidth: false,
        multi: true,
        language: {
            "search": "Filtrar Resultados: ",
            "emptyTable": "No se encontraron artículos",
            "zeroRecords": "No se encontraron resultados.",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "info":           "_START_ a _END_ de _TOTAL_ resultados",
            "infoEmpty":      "",
            "infoFiltered":   "(filtrados de _MAX_ resultados)",
            "responsive": true,
            "rowReorder": {
                selector: 'td:nth-child(2)'
            },
        }
    };

    if(typeof extraParams == 'object'){
        addKeyValues(extraParams, tableInitParams);
    }

    var finalTable = $('#' + idTable).DataTable(tableInitParams);

    $('#' + idTable + ' tbody').on( 'click', 'tr', function () {
        if(event.target.tagName != "INPUT" && event.target.tagName != 'SELECT') {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            } else {
                if(!tableInitParams.multi)
                    finalTable.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            }
        }
    });

    return  finalTable;
}

function addKeyValues(newObject, parentObject){
    for (var key in newObject) {
        if(typeof newObject[key] == 'object' && !Array.isArray(newObject[key])){
            if(typeof parentObject[key] == 'undefined')
                 parentObject[key] = newObject[key];
             else
                addKeyValues(newObject[key], parentObject[key]);
        } else {
            parentObject[key] = newObject[key];            
        }
    }
}

function createAdditionalFields(){

    switch (json.type) {
        case "NUMERICO":
        case "TEXTO":
            break;
    }
}

function isMobile(){
    if( $("body").hasClass("isMobile"))
        return true;
    else
        return false;
}

function applyRegex(field, regexString){
    field.keypress(function (e) {
        var regex = new RegExp(regexString);
        var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
        if (regex.test(str)) {
            return true;
        }
    
        e.preventDefault();
        return false;
    });
}
