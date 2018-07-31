$REGISTER = {
    start: function () {
        console.log("Register start");
        var ctrl = $ctrl = this, view = ctrl.view = $("#register");
        delete ctrl.CveGrupo;
        delete ctrl.cveCategoria;
        delete ctrl.cveSupplier;
        delete ctrl.isMultiTicket;
        delete ctrl.jSupplier;
        delete ctrl.finish;

        function _exit() {
            $FLOW.cancel();
        }

        if(sessionStorage.finish && sessionStorage.finish != "true"){
			_exit();
			return;
		}

        var jCampaign, jServiceType;
        try {
            ctrl.jCampaign = jCampaign = JSON.parse(sessionStorage.campaign);
            ctrl.jServiceType = jServiceType = JSON.parse(sessionStorage.serviceType);
            if (typeof (jCampaign) != "object" || typeof (jServiceType) != "object") {
                _exit();
                return;
            }                
        }
        catch (e) {
            _exit();
            return;
        }

        $(window).on("resize", ctrl.resize);
        $(window).resize();

        matchFields();

        // Proveedor
        if(sessionStorage.supplier){
            ctrl.jSupplier = JSON.parse(sessionStorage.supplier);
        }

        // Ayuda
        setHelp({ $section: $("#register .help"), flow: "Registro" });

        // Flujo
        $FLOW.setText();

        // Subtitle
        var description = ctrl.campaign = jCampaign.DescTiposervicio;
        view.find(".subtitle").html(description);

        // Show report
        if(localStorage.autologin){
            view.find(".report").show();
            ctrl.$focus = view.find(".txtName").focus();
        }            

        // Reason
        view.find(".txtReason").val(jServiceType.DescTiposervicio);

        // Attachments
        if(jServiceType.DocumentoAdjunto){
            view.find(".attachments").show();
            if(jServiceType.DocumentoAdjuntoObligatorio){
                view.find(".attachments ._title").addClass("required");
            }
        }
        
        // Next step
        view.find(".buttons").removeClass("noNext");

        // Multifolio
        ctrl.checkMultiticket();
    },

    checkMultiticket: function(){
        console.log("multiticket");
        var ctrl = this, view = ctrl.view;

        if(sessionStorage.products){
            var products = JSON.parse(sessionStorage.products);
            ctrl.listaItemsDirectos = products.ListaItemsDirectos;
            ctrl.listaByPromoxxo = products.ListaByPromoxxo;
            if(ctrl.listaItemsDirectos){
                var data = {
                    CveCliente: localStorage.CveUsuario,
                    CveGrupo: ctrl.jSupplier.CveGrupo,
                    CveTipoServicio: ctrl.jServiceType.CveTiposervicio,
                    ItemsDirectos: ctrl.listaItemsDirectos.Lista,
                    StrCveCampania: ctrl.jCampaign.CveTiposervicio
                }

                SVC({
                    url: getUrl('WSValidaMultifolio', 'ValidaMultifolio'),
                    type: 'POST',
                    data: data,
                    success: function(json) {
                        ctrl.isMultiTicket = json.MultiFolio;
                        if(json.MultiFolio){
                        	view.addClass("multiticket");
                            ctrl.cveCategoria = "";
                            ctrl.cveSupplier = data.CveGrupo;
                            
                            // Lista de categorias
                            view.find(".multiticket").show();
                            var $results = view.find(".multiticket .results .data");
                            json.Categorias.forEach(function(item){
                                var $html = $(
                                '<div class="item" cvecategoria="'+ item.CveCategoria +'">'+
                                	'<span class="checkbox"><input type="checkbox" class="chk"></span>' +
                                	'<span class="onlyMobile bold">Categoría: </span>'+
                                	'<span class="category value">'+ item.Descripcion +'</span>'+
                                	'<div class="onlyMobile"></div>' +
                                	'<span class="onlySuccess bold">Ticket: </span>'+
                                	'<span class="ticket value"></span>'+
                                	'<div class="onlyMobile"></div>' +
                                	'<span class="onlySuccess bold">Prioridad: </span>'+
									'<span class="priority value"></span>'+
									'<div class="onlyMobile"></div>' +
									'<span class="onlySuccess bold">Tiempo respuesta: </span>'+
									'<span class="time value"></span>'+
									'<div class="onlyMobile"></div>' +
									'<span class="onlySuccess bold">Proveedor: </span>'+
									'<span class="supplier value"></span>'+
								'</div>');
                                $results.append($html);								
                                $html[0].data = item;
                            });

                            $results.find(".item").on("click", function(item){
                            	var $item = $(this);
                            	if($(event.target).hasClass("chk") || $item.attr("success") == "") return;
                            	$item.find(".chk").click();
                            });

                            // Llenar informacion de tickets resueltos
                            if(sessionStorage.multiticket){
                            	console.log("fill multiticket");
                            	var arr = JSON.parse(sessionStorage.multiticket);
                            	arr.forEach(function(item){
                            		ctrl.fillMultitickets(item);                            		
                            	});
                            	ctrl.endMultiticket();
                            }
                        }

                        ctrl.representantRule();
                    }
                });
            }
            else
                ctrl.representantRule();
        }
        else
            ctrl.representantRule();
    },

    // Obtener Representante y Prestador de Servicio
    representantRule: function(){
        console.log("representantRule");
        var ctrl = this, view = ctrl.view;
        SVC({
            url: getUrl('WSConsultaReglaRepresentante', 'ConsultarReglaRepresentante?strCveCliente='+ localStorage.CveUsuario +'&strCveTipoServicio='+ ctrl.jServiceType.CveTiposervicio),
            loading: "#register .section.right",
            success: function (_json) {
                console.log(_json);
                
                var data = _json.Lista[0] || {};
                if(data.Nombre){
                	var name = data.Nombre + " " + data.ApPaterno + " " + data.ApMaterno;
                	view.find(".txtOwner").val(name);	
                }                
                view.find(".txtServiceType").val(data.DescGrupo);                
                ctrl.CveGrupo = ctrl.cveSupplier ? ctrl.cveSupplier : data.CveGrupo;

                ctrl.additionalData();
            }
        });
    },

    // Datos adicionales
    additionalData: function(){
        console.log("additionalData");
        var ctrl = this, view = ctrl.view;
        SVC({
            url: getUrl('WSConsultaDatosAdicionales', 'ConsultaDatosAdicionales?strCveTipoServicio='+ ctrl.jServiceType.CveTiposervicio),
            loading: "#register .section.right",
            success: function (_json) {
                console.log(_json);
                var data = _json.Lista;
                $ADDITIONALDATA.add({ data: data, $div: view.find(".additionalData") });
                ctrl.template();
            }
        });
    },

    // Plantilla
    template: function(){
        console.log("template");
        var ctrl = this, view = ctrl.view;
        SVC({
            url: getUrl('WSRegistraServicio', 'ConsultarPlantilla?strCveTipoServicio='+ ctrl.jServiceType.CveTiposervicio),
            loading: "#register .section.right",
            success: function (_json) {
            	console.log("template result:");
                console.log(_json.Lista);
                $ADDITIONALDATA.add({ data: _json.Lista, $div: view.find('.template') });

				if(ctrl.$focus)
                	ctrl.$focus.focus();

                // Verificar si hay campos obligatorios en el formulario para mostrar la etiqueta
                if(view.find(".form .required:visible").length > 0){
                	view.find(".form .divRequired").show();
                }
            }
        });
    },

    resize: function () {
        console.log("resize");
        
        if(!$("body").hasClass("isMobile")){
            setTimeout(function(){
                var height = $(window).height() - $("#header").height() - $("#topButtons").height() 
                    - $("#content .steps").height() - 185;
                if(height < 200) height = 200;
                $("#register .content.right").css("height", height);
            }, 100);
        }
    },

    validation: function(){
        console.log("validation");
        var ctrl = this, view = $("#register");
        var jValidate = { error: "", $fieldError: "" }
    
        // Nombre
        var $name = view.find(".txtName");
        if($name.is(":visible")){
            jValidate = { $cmp: $name, type: "TEXT", msgError: "Debe introducir el nombre.", error: jValidate.error, $fieldError: jValidate.$fieldError }
            vamoAValidar(jValidate);
        }        
        
        // Plantilla
        var template = $ADDITIONALDATA.validation({ $fields: view.find(".template .field"), type: "template", jValidate: jValidate });
        
        // Datos adicionales
        var additionalData = $ADDITIONALDATA.validation({ $fields: view.find(".additionalData .field"), jValidate: jValidate });

        // Documentos adjuntos
        var attachments_required = view.find(".attachments ._title").hasClass("required");
        jValidate = { $cmp: view.find(".attachments .tag"),  type: "ATTACHMENTS", msgError: "Debe adjuntar mínimo un documento.", 
                        required: attachments_required, error: jValidate.error, $fieldError: jValidate.$fieldError }
        var arrAttachments = vamoAValidar(jValidate);

        if (jValidate.error != "") {
            return function(){
            	warning(jValidate.error); 
                if(jValidate.$fieldError != "") 
                    jValidate.$fieldError.focus(); 
            }
        }
        
        // Descripcion
        var description = "Nombre de quien reporta: ";
        if($name.valTrim() != "")
            description += $name.valTrim();
        else
            description += localStorage.Username;
        if(template)
            description += "\n" + template;
        
        var jsonForm = {
            StrCveCampania: ctrl.jCampaign.CveTiposervicio,
            StrCveCliente: localStorage.CveUsuario,
            StrCveTipoServicio: ctrl.jServiceType.CveTiposervicio,
            StrDescServicio: description,
            StrGrupo: ctrl.CveGrupo
        }
        if(additionalData.length)
        	jsonForm.ListaDatosAdic = { Lista: additionalData }
        if(arrAttachments.length)
            jsonForm.ListaArchivosAdj = { Lista: arrAttachments }
        jsonForm.ListaByPromoxxo = ctrl.listaByPromoxxo;
        jsonForm.ListaItemsDirectos = ctrl.listaItemsDirectos;
        
        // Multifolio
        if(ctrl.isMultiTicket){
            jsonForm.StrCveSupplier = ctrl.cveSupplier;
        }

        return jsonForm;
    },

    generate_validation: function(){
        console.log("generate_validation");

        var ctrl = this;
        var validation = ctrl.validation();
		if (typeof validation == "function") {
			validation();
			return;
		}

        // Validar checkbox seleccionados
        var $checked = $("#register .multiticket .data .chk:checked:not(:disabled)");
        if(!$checked.length){
            warning("Debe seleccionar mínimo una categoría para generar el folio.");
            return;   
        }
		
		$checked.prop("disabled", true);
		ctrl.multiticket = { data: validation, $checked: $checked, fullItemsDirectos: validation.ListaItemsDirectos, index: 0, total: $checked.length }
		ctrl.generate();
    },

    generate: function(){
    	var ctrl = this, view = ctrl.view;
    	var dataSVC = ctrl.multiticket.data;
    	var fullItemsDirectos = ctrl.multiticket.fullItemsDirectos;
    	var $item = ctrl.multiticket.$checked.eq(ctrl.multiticket.index).parents(".item:first");
		var data = $item[0].data;

		var jItemsDirectos = { Detalle: [], Lista: [] };
		data.ItemsDirectos.forEach(function(item){
			fullItemsDirectos.Lista.forEach(function(fullItem){
				if(item.Item == fullItem.Item){
					jItemsDirectos.Lista.push(fullItem);
				}
			});

			fullItemsDirectos.Detalle.forEach(function(fullItem){
				if(item.Item == fullItem.Clave){
					jItemsDirectos.Detalle.push(fullItem);
				}
			});
		});
				
		dataSVC.ListaItemsDirectos = jItemsDirectos;
		dataSVC.StrCveCategoria = data.CveCategoria;

		// Loading
		var $multi = view.find(".multiticket");
		$multi.find(".generate").hide();
		$multi.find("._loading").show();
		$multi.find(".count").html(ctrl.multiticket.index+1);
		$multi.find(".total").html(ctrl.multiticket.total);
		
		ctrl.svc(dataSVC);
    },

    send: function(){
        console.log("svc");
        var ctrl = this, view = ctrl.view;
        var validation = ctrl.validation();
		if (typeof validation == "function") {
			validation();
			return;
		}

		ctrl.svc(validation);
    },

    fillMultitickets: function(data){
    	var ctrl = this, view = ctrl.view;
    	var $multi = view.find(".multiticket");
		var $row = $multi.find(".results .item[cvecategoria="+data.cveCategoria+"]").attr("success", "");
		$row.find(".chk").prop("disabled", true).prop("checked", true);
		$row.find(".ticket").html(data.Resultado);
		$row.find(".priority").html(data.Prioridad);                	
		$row.find(".time").html(data.time);
		$row.find(".supplier").html(data.supplier);
    },

    svc: function(data){
    	var ctrl = this, view = ctrl.view;
    	var isMultiTicket = data.StrCveCategoria ? true : false;
    	var $multi = view.find(".multiticket");
        SVC({
            url: getUrl('WSRegistraServicio', 'RegistraServicio'),
            type: 'POST',
            data: data,
            noLoading: isMultiTicket,
            success: function(json) {
                console.log(json);
                var response = json.Lista[0];

                // Multifolio                
                if(data.StrCveCategoria){
                	response.time = minutes2hours(response.TiempoRespuesta);
                	response.cveCategoria = data.StrCveCategoria;

                	// Proveedor
                	var supplier = "";
                	if(data.ListaItemsDirectos && data.ListaItemsDirectos.Lista.length)
						supplier = response.supplier = data.ListaItemsDirectos.Lista[0].SupName;

                	ctrl.fillMultitickets(response);

                	// Guardar resultados en sessionStorage
                	var arrMultiticket = sessionStorage.multiticket ? JSON.parse(sessionStorage.multiticket) : [];
                	arrMultiticket.push(response);
                	sessionStorage.multiticket = JSON.stringify(arrMultiticket);

                	// Siguiente ticket?
                	ctrl.multiticket.index++;
                	if(ctrl.multiticket.index < ctrl.multiticket.total)
                		ctrl.generate();
					else {
						// Fin del ciclo
						ctrl.endMultiticket();
					}
                }
                else {
                	sessionStorage.finish = JSON.stringify(response);
                	location.hash = "Finish";
                }
            },

            fail_after: function(){
            	console.log("fail");

            	// Multifolio                
                if(data.StrCveCategoria){
                	var $multi = view.find(".multiticket");
                	var $row = $multi.find(".results .item[cvecategoria="+data.StrCveCategoria+"]");
                	$row.find(".chk").prop("disabled", false);

                	ctrl.multiticket.index++;
                	if(ctrl.multiticket.index < ctrl.multiticket.total)
                		ctrl.generate();
					else {
						// Fin
						$multi.find("._loading").hide();
						$multi.find(".generate").show();
					}
                }
            }
        });
    },

    endMultiticket: function(){
    	var ctrl = this, view = ctrl.view;
    	var $multi = view.find(".multiticket");
    	$multi.find("._loading").hide();
		var $generate = $multi.find(".generate");
		if(!$multi.find(".data .chk:not(:disabled)").length){
			$generate.hide();
			view.addClass("done");
			view.find(".flowButtons .btnBack, .flowButtons .btnCancel").hide();
			//view.find(".flowButtons .btnDone").showInline();
			sessionStorage.finish = true;
		}
		else
			$generate.show();
    }
}