$ITEMSSEARCH = {
	serviceTypeAdditionalFields: null,
	start: function(){
		console.log("Items search start");
		var ctrl = this;

		if(!sessionStorage.serviceType || sessionStorage.finish){
			$FLOW.cancel();
			return;
		}

		// Validar la existencia de articulos en el tipo de servicio
		ctrl.serviceTypeData = JSON.parse(sessionStorage.serviceType);		
		if(ctrl.serviceTypeData.ItemsDirectos == ctrl.serviceTypeData.Items && ctrl.serviceTypeData.Items == "N"){
			if(sessionStorage.navigation == "next")
				$FLOW.next();
			else
				$FLOW.back();
			return;
		}

		$('#searchResultsSection').hide();
		$('#searchButtons').hide();

		$FLOW.setText();
		setHelp({ $section: $("#itemsSearch .help"), flow: "Articulo" });

		var description = JSON.parse(sessionStorage.campaign).DescTiposervicio;
        $("#itemsSearch .subtitle.desktop").html(description);

		ctrl.getAdditionalFields();
		
		applyRegex($("#txtItemsSearch"), "^[\na-zA-Z0-9%_ ]+$");
		$("#txtItemsSearch").keyup(function(event) {
		    if (event.keyCode === 13) {
		        $("#btnSearch").click();
		    }
		});

		$(window).on("resize", ctrl.resize);
        $(window).resize();
	},

	resize: function(){
		if(!$("body").hasClass("isMobile")){
            setTimeout(function(){
                var height = $(window).height() - $("#header").height() - $("#topButtons").height() 
                    - $("#content .steps").height() - 182;
                if(height < 200) height = 200;
                $("#itemsSearch .rightSection").css("height", height);
            }, 100);
        }
	},

	isPromocionales: function(){
		if($ITEMSSEARCH.serviceTypeData.Items === 'S') {
			return true;
		}
		return false;	
	},

	searchItems: function(){
		$('.searchError').html('');
		var tableResults = $('#itemsSearchResults').DataTable();
			tableResults.rows().remove().draw(false);

		var searchText = $('.txtSearch').val();

		if(searchText.length == 0){
			$('.searchError').html('Debes ingresar un código de barras o una descripción para realizar tu búsqueda.');
			return;
		}

		if(searchText == '%')
			searchText = '';

  		var serviceName = 'WSConsultaItemsDirectos';
  		var jsonSupplier = JSON.parse(sessionStorage.supplier); 
    	var methodParams = 'ConsultaItemsDirectos?strCveCliente=' + localStorage.CveUsuario + '&strSupplier=' + jsonSupplier.Alias + '&strItemDesc=' +  searchText;

		if($ITEMSSEARCH.isPromocionales()){
			var cveTipoServicio = $ITEMSSEARCH.serviceTypeData.CveTiposervicio;
			serviceName = 'WSConsultaArticulosPromocionales';
			methodParams = 'ConsultarArticuloPromocional?strCveTipoServicio='+ cveTipoServicio  +'&strDescripcion=' + searchText;
		}
    	
    	SVC({
			url: getUrl(serviceName, methodParams),
			success: function(json) {
				console.log(json)

				if(json.Lista && json.Lista.length > 0){

					$('#searchResultsSection').show();
					$('#searchButtons').show();

					var itemCve = ($ITEMSSEARCH.isPromocionales()) ? 'Clave' : 'Item';
					var itemDesc = ($ITEMSSEARCH.isPromocionales()) ? 'TipoPromo' : 'ItemDesc';

					var tableResults = $('#itemsSearchResults').DataTable();
						tableResults.rows().remove().draw(false);

					var items = json.Lista;
					for (var i = items.length - 1; i >= 0; i--) {
						if(isMobile()){
							tableResults.row.add([items[i][itemCve], "<b>Código de Barras:</b><br>" + items[i][itemCve]  + '<br><b>Descripción:</b><br>' +  items[i][itemDesc] ]).draw( false );
						}else
							tableResults.row.add([ items[i][itemCve], items[i][itemDesc] ]).draw( false );

						// add complete data object 
						tableResults.row(':last').data().itemData = items[i];
					}
				} else {
					$('.searchError').html('No se encontraron artículos.');
				}
			}
		});
	},

	addItemsToFolio: function(){
		console.log('add articulos to folio');

		var itemsSearchTable = $('#itemsSearchResults').DataTable();
			rowsSelected = itemsSearchTable.rows('.selected').data();
		if(rowsSelected.length == 0){
			warning('Debes seleccionar un artículo.');
			return;
		}

		var tableItemsFolio = $('#itemsFolio').DataTable();
		var countAddedItems = 0;
		for (var i = rowsSelected.length - 1; i >= 0; i--) {
			console.log(rowsSelected[i].itemData);
			
			if($ITEMSSEARCH.validateDuplicates(rowsSelected[i])){
				countAddedItems++;

				if(isMobile()){
					tableItemsFolio.row.add([  rowsSelected[i][0], rowsSelected[i][1] + '<br>' +  '<div class="fieldsContainer"></div>' ]).draw( false );
				} else {
					if($ITEMSSEARCH.serviceTypeAdditionalFields != null)
						tableItemsFolio.row.add([ rowsSelected[i][0], rowsSelected[i][1], '<div class="fieldsContainer"></div>' ]).draw( false );
					else
						tableItemsFolio.row.add([ rowsSelected[i][0], rowsSelected[i][1] ]).draw( false );
				}

				var lastRow = $('#itemsFolio tbody tr:last');
					lastRow[0].itemData = rowsSelected[i].itemData;
				if($ITEMSSEARCH.serviceTypeAdditionalFields != null){
					$ADDITIONALDATA.add({ data: $ITEMSSEARCH.serviceTypeAdditionalFields, $div: lastRow.find('.fieldsContainer') });
				}
			}

		}

		success('Se agregó ' + countAddedItems + ' nuevo(s) elemento(s) de ' + rowsSelected.length + ' seleccionados');

		// go to last added element
		$ITEMSSEARCH.goToLastElement();
	},

	goToLastElement: function(){
		var table = $('#itemsFolio');

		//go to last page
		table.dataTable();
		table.fnPageChange('last');

		var lastRow = $('#itemsFolio').find('tbody tr').last(), 
			firstRowInput = $(lastRow.find('input')[0]);

		//scroll to last row
		setTimeout( function(){
			$('html, body').animate({ scrollTop: $(lastRow).offset().top}, 1000);
			firstRowInput.focus();
		}, 1000, lastRow, firstRowInput);
	},

	clearSearch: function(){
		$('#searchResultsSection').hide();
		$('#searchButtons').hide();
		$('#itemsSearchResults').DataTable().rows().remove().draw(false);
	},

	deleteItemsFolio: function(){
		var table = $('#itemsFolio').DataTable();
			rowsSelected = table.rows('.selected').data();
		
		if(rowsSelected.length > 0)
			popup({ 
				title: "Advertencia", 
				body: '<span>Se eliminaran los elementos seleccionados. ¿Desea continuar?</span>', 
				confirm: true,
				confirmFn: function(){
					table.rows('.selected').remove().draw(false);
				}
			});
		else
			warning('Debes seleccionar un artículo de la lista de Artículos del Folio.')
	},

	validateDuplicates: function(rowToAdd){
		var itemsFolio = $('#itemsFolio').DataTable().rows().data();
		if(itemsFolio.length == 0)
			return true;
		else{
			var idxItem = $('#itemsFolio').DataTable().rows().data().map(function(i){ return i[0]; }).indexOf(rowToAdd[0]);
			if(idxItem == -1)
				return true;
			else 
				return false
		}
	},

	getAdditionalFields: function(){
		//OSABRTCLJF
		var cveTipoServicio = $ITEMSSEARCH.serviceTypeData.CveTiposervicio;
		SVC({
			url: getUrl('WsConsultaArticulosDirectosDet', 'ConsultarArticuloDirectoDet?strCveTipoServicio=' + cveTipoServicio),
			//url: getUrl('WsConsultaArticulosDirectosDet', 'ConsultarArticuloDirectoDet?strCveTipoServicio=OSABRTCLJF'),			
			success: function(json) {
				if((typeof json.Detalle != 'undefined') && json.Detalle.length > 0){
					$ITEMSSEARCH.serviceTypeAdditionalFields = json.Detalle; 
				}
				
				$ITEMSSEARCH.defineDataTables();
			}
		});
	},

	validation: function(){

		var tableFolio = $('#itemsFolio').DataTable();

		if(tableFolio.data().length == 0){
			warning('Debes agregar un producto para proceder con tu reporte.');
			return;
		}

		var isValid = true;

		//Validate Inputs
		var arrayInputs = $('#itemsFolio').find('tbody tr').find('input').toArray();
		var arraySelect = $('#itemsFolio').find('tbody tr').find('select').toArray();

		var finalArray = arrayInputs.concat(arraySelect);

		for (var i = 0; i < finalArray.length; i++) {
			var $currentField = finalArray[i];

			if($currentField.type != 'checkbox'){
				var value = $currentField.value;
				if(value == "" || value == -1){
					$($currentField).addClass('errorClass');
					isValid = false;
				} else {
					$($currentField).removeClass('errorClass');
				}
			}
		}

		if(!isValid)
			warning('Todos los campos adicionales en la tabla de articulos de folio son obligatorios.');
		else
			$ITEMSSEARCH.next();
	},

	createRegisterObject: function(){

		var itemsFolio = $('#itemsFolio').DataTable().rows().data(); 
		var rowsFolio = $('#itemsFolio tbody tr');

		var jsonObj = {
			ListaByPromoxxo : {
				Detalle:  new Array(),
				Lista: new Array()
			},
			ListaItemsDirectos: {
				Detalle: new Array(),
				Lista: new Array()
			}
		};

		for (var i = 0; i < rowsFolio.length ; i++) {
			var currentRow = rowsFolio[i];
			var itemObj = null;

			var arrayInputs = $(rowsFolio[i]).find('input').toArray();
			var arraySelect = $(rowsFolio[i]).find('select').toArray();

			var arrayFields = arrayInputs.concat(arraySelect);

			if($ITEMSSEARCH.isPromocionales()){

				//add aditional fields Descriptions and Values 
				for (var j = 0; j < arrayFields.length; j++) {
					var fieldObj = {
						Clave: currentRow.itemData.Clave,
						CveDetalle: arrayFields[j].getAttribute('cvedetalle'),
						CveItem: currentRow.itemData.CveItem,
						DescEtiqueta: arrayFields[j].getAttribute('descitem'),
						Valor: arrayFields[j].value
					}

					jsonObj.ListaByPromoxxo.Detalle.push(fieldObj);
				}

				itemObj = {
					Clave: currentRow.itemData.Clave,
					CveItem: currentRow.itemData.CveItem,
					CveTipoServicio: $ITEMSSEARCH.serviceTypeData.CveTiposervicio,
					DescItem: currentRow.itemData.DescItem,
					TipoPromo: currentRow.itemData.TipoPromo
				};

				jsonObj.ListaByPromoxxo.Lista.push(itemObj);
				delete jsonObj.ListaItemsDirectos;
			
			}else {
				//add aditional fields Descriptions and Values 
				for (var j = 0; j < arrayFields.length; j++) {
					var fieldObj = {
						Clave: currentRow.itemData.Item,
						CveDetalle: arrayFields[j].getAttribute('cvedetalle'),
						DescEtiqueta: arrayFields[j].getAttribute('descitem'),
						Valor: arrayFields[j].value
					}

					jsonObj.ListaItemsDirectos.Detalle.push(fieldObj);
				}

				itemObj = {
					Clave: currentRow.itemData.Item,
					DivClave: currentRow.itemData.Item,
					DescItem: currentRow.itemData.ItemDesc,
					DivName: currentRow.itemData.DivName,
					Item: currentRow.itemData.Item,
					ItemDesc: currentRow.itemData.ItemDesc,
					Store: currentRow.itemData.Store,
					SupName: currentRow.itemData.SupName,
					Supplier: currentRow.itemData.Supplier,
				};

				jsonObj.ListaItemsDirectos.Lista.push(itemObj);
				delete jsonObj.ListaByPromoxxo;
			}
		};

		return jsonObj;
	},

	next: function(){
		var registerObject = $ITEMSSEARCH.createRegisterObject();
		sessionStorage.products = JSON.stringify(registerObject);
		$FLOW.next();
	},

	defineDataTables: function(){

		var columnsWidthFolio = [];
		var columnsWidthSearchResults = [];

		if(isMobile()){
			var tableHeader = $("#itemsSearchResults>thead>tr");
				tableHeader.append('<th scope="col">Id</th>');
				tableHeader.append('<th scope="col" style="min-width: 100px !important"></th>');


				tableHeader = $('#itemsFolio>thead>tr');
				tableHeader.append('<th scope="col">Id</th>')
				tableHeader.append('<th scope="col" style="min-width: 100px !important"></th>');

			columnsWidthFolio = [{ visible: false} , { width: "100%" }];
			columnsWidthSearchResults = [{ visible: false}, { width: "100%" }];


		} else {
			var tableHeader = $("#itemsSearchResults>thead>tr");
				tableHeader.append('<th scope="col" style="min-width: 100px !important">CÓDIGO DE BARRAS</th>');
				tableHeader.append('<th scope="col">ARTÍCULO</th>');

				columnsWidthSearchResults = [{ width: "35%" }, { width: "65%" }]

			
				tableHeader = $('#itemsFolio>thead>tr');
				tableHeader.append('<th scope="col" style="min-width: 100px !important">CÓDIGO DE BARRAS</th>');
				tableHeader.append('<th scope="col">ARTÍCULO</th>');

				if($ITEMSSEARCH.serviceTypeAdditionalFields != null){
					tableHeader.append('<th scope="col">CAMPOS</th>');
					columnsWidthFolio = [{ width: "20%" }, {width: "30%"}, { width: "50%" }];
				}else{
					columnsWidthFolio = [{ width: "40%" }, {width: "60%"}];
				}
		}

		//Definir DataTable SearchResults
		createDataTable('itemsSearchResults', { order: [], columns: columnsWidthSearchResults });

		//apply regex to filter field
		var inputFilter = $('.dataTables_filter').find('input')[0];
		applyRegex($(inputFilter), "^[\na-zA-Z0-9 ]+$");

		//Definir DataTable Folios
		createDataTable('itemsFolio', { order: [], columns: columnsWidthFolio, searching: false, paging: true, language: { emptyTable: 'No se han agregado articulos.', info: "_START_ a _END_ de _TOTAL_ agregados",  } });

	},

	cancel: function(){
		location.href = "#Reports";
	},

	clear: function(){
		$ITEMSSEARCH.serviceTypeAdditionalFields = null;
	}
}