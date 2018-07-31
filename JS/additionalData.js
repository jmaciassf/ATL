$ADDITIONALDATA = {
    add: function(json){
        var ctrl = this, arrData = [];

        if(!json || !json.data || !json.data.length)
        	return;

        if(json.data[0].CveConfigDetalle){
            // Convert data (Additional Data)
            json.data.forEach(function(item){                
                arrData.push({
                    _data: item,
                    required: item.EsRequerido,
                    CveDetalle: item.CveConfigDetalle,
                    DescEtiqueta: item.RefCampo,
                    Longitud: item.Longitud,
                    Opcion: item.Opcion, // Para los combobox
                    TipoDato: ctrl.dataType(item.CveTipoDatos)
                });
            });   
        }
        else {
        	// No convert (Template)
            arrData = json.data;
        }

        //var dom = ctrl.create({ arrData: arrData, $div: json.$div });
        //json.$div.append(dom);

        ctrl.create({ arrData: arrData, $div: json.$div });
        ctrl.configure(json.$div);
    },

    create: function(json){
    	var arrData = json.arrData;
		var mainDiv = document.createElement("div");

		if(!isMobile())
			mainDiv.setAttribute('class', 'mainDiv');

		for (var i = 0; i < arrData.length; i++) {
		    var $div = $('<div class="additionalFields field"></div>');
		    var $lbl = $('<label class="name">'+ arrData[i].DescEtiqueta + ':</label>');
			var field = document.createElement("input");

			switch(arrData[i].TipoDato.toUpperCase()) {
				case 'NUMERICO':
				    $div.attr("type", "number");
					field.setAttribute("type", "text");
					field.setAttribute("min", "0");
					field.setAttribute("class", "numericField");
					break;

				case 'FECHA':
				    $div.attr("type", "date");
					field.setAttribute('type', 'text');
					field.setAttribute("class", "datepicker");
					if(arrData[i].Operador == 'Mayor'){
						field.setAttribute("minDate", true);
					}
					else if(arrData[i].Operador == 'Menor'){
						field.setAttribute("maxDate", true);
					}
					break;					
								
				case 'MONEDA':
					var decimals = arrData[i]._data ? arrData[i]._data.Decimales : 2;
					$div.attr("type", "currency");
					$(field).attr("data-a-sign", "$ ").attr("data-n-sep", "true").autoNumeric("init", { mDec: decimals });
					break;

				case 'TEXT':
				case 'ALFANUMERICO':
				    $div.attr("type", "text");
					field.setAttribute('type', "text");
					field.setAttribute('class', 'alfanumerico');
					break;

				case 'COMBO':
				    $div.attr("type", "combo");
					field = null;
					field = document.createElement("select");
					field.setAttribute("id", "select" + i);

					//add empty option 
					var option = document.createElement("option");
						option.setAttribute("value", "");
						option.setAttribute("text", "");
						option.innerHTML = "";
						field.appendChild(option);

					var options = arrData[i].Opcion;
					for (var j = 0; j < options.length; j++) {
						var option = document.createElement("option");
						option.setAttribute("value", options[j].Id);
						option.setAttribute("text", options[j].Descripcion);
						option.innerHTML = options[j].Descripcion;
						field.appendChild(option);
					}
					break;

				case 'BOLEANO':
				    $div.attr("type", "bool");
					field.setAttribute('type', 'checkbox');
					field.setAttribute('value', "true");
					$lbl.addClass('labelCheckbox');
					break;

				case 'HORA':
				    $div.attr("type", "time");
					field.setAttribute('type', "text");
					field.setAttribute('class', 'timepicker');
					break;

				case 'TEXTO':
				    $div.attr("type", "text");
					field.setAttribute('type', "text");
					field.setAttribute('class', 'textarea');
					break;
			}

			// Max length
			if(arrData[i].Longitud > 0){
				field.setAttribute('maxlength', arrData[i].Longitud);
			}

			// Is required?
			if(arrData[i].required == null || arrData[i].required == true)
				$div.addClass("required");

			//add CveDetalle
			field.setAttribute('CveDetalle', arrData[i].CveDetalle);
			field.setAttribute('DescItem', arrData[i].DescEtiqueta);
                        
			$div.append($lbl);
			$div.append($(field));
			
			json.$div.append($div);
			json.$div.find(".field:last")[0]._data = arrData[i]._data;

			//$(mainDiv).append($div);
			//$(mainDiv).find(".field:last")[0]._data = arrData[i]._data;
		}

		return mainDiv.outerHTML;
	},

	configure: function($div){
	    $div.find('.datepicker').toArray().map(function(item){
			console.log(item);
			var params = { dateFormat: 'dd/mm/yy', maxDate: '', minDate: '' }; 
			if(item.getAttribute('maxDate'))
				params.maxDate = '-1';
			else if(item.getAttribute('minDate'))
				params.minDate = '1';
			
			$(item).datepicker(params);
		});

		$div.find('.datepicker').keydown(function(e){
			if(e.keyCode && e.keyCode != 8)
				return false;
			this.value = '';
		});

		$div.find('.timepicker').clockpicker({ 
			autoclose: true,
			placement: 'top',
			align: (isMobile()) ? 'left' : 'right',
			twelvehour: true
		});

		$div.find('.timepicker').keydown(function(e){
			if(e.keyCode && e.keyCode != 8)
				return false;
			this.value = '';
		});

		applyRegex($div.find('.numericField'), "^[0-9]+$");
		applyRegex($div.find('.alfanumerico'), "^[a-zA-Z0-9 ]+$");
	},

	validation: function(json){
		var jValidate = json.jValidate || {};
		var result = [];
		if(json.type == "template")
			result = "";
		json.$fields.each(function(index, field){
            var $field = $(field), $input, value, name = $field.find(".name").html(), data = field._data, validate = !data || (data && data.EsRequerido);
            switch($field.attr("type")){
            	case "bool":
            		$input = $field.find("input");
            		if(json.type == "template")
                    	value = $input.is(":checked") ? "Si" : "No";
					else
						value = $input.is(":checked") ? "1" : "0";
            		break;

                case "combo":
                    $input = $field.find("select");
                    value = $input.find("option:selected").html();
                    if(validate){
                    	jValidate = { $cmp: $input, type: "COMBO", msgError: "Debe seleccionar una opción.", error: jValidate.error, $fieldError: jValidate.$fieldError }
                    	vamoAValidar(jValidate);
                    }                    
                    break;
				
				case "currency":
                    $input = $field.find("input");
                    value = $input.val().match(/[0-9.]+/g);
                    if(value)
                    	value = +value[0];
                    if(validate){
						jValidate = { $cmp: $input, type: "CURRENCY", msgError: "Debe introducir un valor mayor a 0.", error: jValidate.error, $fieldError: jValidate.$fieldError }
						vamoAValidar(jValidate);
                    }
                    else {
                    	if(!value)
                    		value = 0;
                    }
                    break;
                
                case "date":
                    $input = $field.find("input");
                    value = $input.val();
                    if(validate){
						jValidate = { $cmp: $input, type: "TEXT", msgError: "Debe seleccionar una fecha.", error: jValidate.error, $fieldError: jValidate.$fieldError }
						vamoAValidar(jValidate);
                    }
                    break;
                
                case "number":
                case "text":
                    $input = $field.find("input");
                    value = $input.val();
                    if(validate){
						jValidate = { $cmp: $input, type: "TEXT", msgError: "Debe introducir un valor.", error: jValidate.error, $fieldError: jValidate.$fieldError }
						vamoAValidar(jValidate);
                    }
                    break;
                
                case "time":
                    $input = $field.find("input");
                    value = $input.val();
                    if(validate){
						jValidate = { $cmp: $input, type: "TEXT", msgError: "Debe seleccionar una hora.", error: jValidate.error, $fieldError: jValidate.$fieldError }
						vamoAValidar(jValidate);
                    }
                    break;
                
                default:
                    var x = 1;
                    break;
            }

            if(json.type == "template"){
            	result += name + " " + value;
            	if(json.$fields.length-1 > index){
            		result += "\n";
            	}
            }
            else {
            	result.push({
            		CveCampoOriDat: $field[0]._data.CveCampoOriDat,
            		CveConfigDetalle: $input.attr("cvedetalle"),
            		ValorDetalle: value
            	});
            }
        });
		
		if(json.jValidate){			
			json.jValidate.$fieldError = jValidate.$fieldError;
			json.jValidate.error = jValidate.error;
		}		
        return result;
	},

    dataType: function(number){
        switch(number){
            case 1: return "TEXTO";
            case 2: return "NUMERICO";
            case 3: return "FECHA";
            case 4: return "MONEDA";
            case 5: return "BOLEANO";
            case 6: return "HORA";
            case 7: return "ALFANUMERICO";
            case 8: return "COMBO";
        }
    }
}