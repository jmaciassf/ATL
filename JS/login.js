$LOGIN = {
    start: function(){
        console.log("Login start");
        var ctrl = this;

        $("body").addClass("noUser");
        $("#header .title").show();
        $("#header .topRight .datetime").showBlock();
        $("#txtUser").focus();
        $("#txtUser, #txtPassword").enter($LOGIN.enter);

        $("#txtUser").on("input", function(){
        	var regex = /[A-z0-9.]/g;
        	var match = this.value.match(regex);
        	var value = "";
        	if(match)
        		value = this.value.match(regex).join("");
			this.value = value;
        });

        // Active Directory login
        if(localStorage.logout != "true"){
			/*SVC({
				url: urlContent + 'ATL/Autenticar',
				type: 'POST',
				data: { username: window._key },
				success: function(strJson) {
					var json = JSON.parse(strJson).List;
					ctrl.setStorage(json);
				},
				fail_after: function(){
					var x = 1;
				}
			});*/
        }
        else {
        	delete localStorage.logout;
        }
    },

    enter: function(){
        console.log("enter");

        var ctrl = $LOGIN;
        var validation = ctrl.validation();
		if (typeof validation == "function") {
			validation();
			return;
		}

        SVC({
        	url: getUrl('WSLogin', 'Autenticar'),
        	type: 'POST',
        	data: validation,
        	success: function(json) {
        		ctrl.setStorage(json);
			},
			fail_after: function(){
				$("#txtUser").focus();
			},
			fail_noAlert: $LOGIN.alertErrors
        });
    },

    setStorage: function(data){
		console.log(data);
		localStorage.clear();
		sessionStorage.clear();
		localStorage.WebToken = data.WebToken;
		localStorage.CveUsuario = data.CveUsuario;
		localStorage.Username = data.Nombre.trim();				
		localStorage.Style = data.Estilo;
		localStorage.Permissions = JSON.stringify(data.Permisos.Lista);		
		var redirect = location.href.replace(/\?username=[\s\S]*/g, '') + "#Reports";
		location.href = redirect;
    },

    validation: function(){
        var jsonValidar = { error: "", $fieldError: "" }
    
        // User
        var $user = $("#txtUser");
        jsonValidar = { $cmp: $user, type: "TEXT", msgError: "Debe introducir el usuario.", error: jsonValidar.error, $fieldError: jsonValidar.$fieldError }
        vamoAValidar(jsonValidar);

        // Password
        var $password = $("#txtPassword");
        jsonValidar = { $cmp: $password, type: "TEXT", msgError: "Debe introducir la contraseña.", error: jsonValidar.error, $fieldError: jsonValidar.$fieldError }
        vamoAValidar(jsonValidar);

        if (jsonValidar.error != "") {
            return function(){
            	warning(jsonValidar.error); 
                if(jsonValidar.$fieldError != "") 
                    jsonValidar.$fieldError.focus(); 
            };
        }

        var jsonForm = {
            Usuario: $user.valTrim(),
            Password: $password.valTrim()
        }
        return jsonForm;
    },

	alertErrors: function(json){
		var error = json.msg;
		switch(error.trim().toUpperCase()) {
			case "USER_REQUIRED":
				warning("El nombre de usuario es obligatorio.");
				break;

			case "PASS_REQUIRED":
				warning('La contraseña es obligatoria.');
				break;

			case "ACTIVO":
				warning('El usuario no se encuentra activo.');
				break;

			case "PASSWORD":
				warning('El usuario o contraseña no es válido, verifique sus datos.');
				break;

			case "LIGADO":
				warning('El usuario no se encuentra ligado a un agente o cliente.');
				break;

			case "BLOQUEADO":
				warning('El usuario de Active Directory está bloqueado.');
				break;
			
			case "NOT_EXIST":
				warning('No se pudo enviar la información de su cuenta. Detalle: El usuario no está registrado.');
				break;

			case "NOEXISTE":
				warning('El usuario no existe.');
				break;

			case "CONFIGURACION":
				warning('La configuración del Active Directory es inválida.');
				break;

			case "ACTIVEDIRECTORY":
				warning('Active Directory no pudo encontrar el usuario buscado.');
				break;

			case "INVALIDO":
				warning('El usuario de Active Directory no es válido.');
				break;
			
			case "REESTABLECER":
				warning('Su contraseña ha expirado, es necesario restablecerla.');
				break;
			
			case "SUCCESS":
				warning('Se ha enviado el correo con la información de su cuenta.');
				break;

			case "USUARIO":
				warning('El usuario no se encuentra en el sistema.');
				break;

			default:
				console.log(error);
				warning(error);
				break;
		}
	},

	logout: function(){
		console.log("logout");
		sessionStorage.clear();
		localStorage.clear();
		$("#header .user").html("");
		$("#topButtons, #header .fa-power-off").hide();
		$("body").removeClass("loaded").addClass("noUser").append(localStorage.Style);
		$(".customStyle").remove();
		loading_hide();
		delete window.webToken;
		localStorage.logout = true;
		location.hash = "#Login";
	}
}