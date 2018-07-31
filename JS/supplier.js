$SUPPLIER = {

	selected: false,
	start: function(){
		console.log('yea yea');

		var ctrl = this;

		$FLOW.setText();
		setHelp({ $section: $("#supplier .help"), flow: "Proveedor" });

		var description = JSON.parse(sessionStorage.campaign).DescTiposervicio;
        $("#supplier .subtitle.desktop").html(description);

		// Set Table configuration
		ctrl.defineDataTable();

		//hide next button
		$('#btnNextFlow').hide();

		applyRegex($("#txtSupplierSearch"), "^[\na-zA-Z0-9% ]+$");
		$("#txtSupplierSearch").keyup(function(event) {
		    if (event.keyCode === 13) {
		        $("#btnSearch").click();
		    }
		});

		$(window).on("resize", $SUPPLIER.resize);
        $(window).resize();

	},

	resize: function(){
		if(!isMobile()){
            setTimeout(function(){
                var height = $(window).height() - $("#header").height() - $("#topButtons").height() 
                    - $("#content .steps").height() - 182;
                if(height < 200) height = 200;
                $("#supplier .rightSection").css("height", height);
            }, 100);
        }
	},

	searchSuppliers: function(){

		var tableResults = $('#itemsSearchResults').DataTable();
			tableResults.rows().remove().draw(false);

		$('.searchError').html('');
		var searchText = $('.txtSearch').val();

		if(searchText.length == 0){
			$('.searchError').html('Favor de Ingresar Nombre de Proveedor para la Búsqueda. No se han encontrado Proveedores en la búsqueda.');
			return;
		}

		var cveCampaign = JSON.parse(sessionStorage.campaign).CveTiposervicio;
		SVC({
			url: getUrl('WSConsultaGrupos', 'ConsultaGrupos?strCveCliente=' + localStorage.CveUsuario + '&strCveCampania=' + cveCampaign + '&strDescripcion=' + searchText),
			success: function(json) {
				console.log(json)

				if(json.Lista && json.Lista.length > 0){
					$('#searchResultsSection').show();
					$('#btnNextFlow').show()

					var items = json.Lista;
					for (var i = items.length - 1; i >= 0; i--) {
						if(isMobile()){
							tableResults.row.add([items[i].CveGrupo, "<b> CVE GRUPO: </b><br>" + items[i].CveGrupo + '<br><b> PROVEEDOR: </b><br>' +  items[i].DescGrupo ]).draw( false );
						}else
							tableResults.row.add([ items[i].CveGrupo, items[i].DescGrupo ]).draw( false );

						// add complete data object 
						tableResults.row(':last').data().itemData = items[i];
					}
				} else {
					$('.searchError').html('No se han encontrado Proveedores en la búsqueda.');
					$('#btnNextFlow').hide();
				}

			}
		});
	},

	defineDataTable: function(){

		var columnsWidthSearchResults = [];

		if(isMobile()){
			var tableHeader = $("#itemsSearchResults>thead>tr");
				tableHeader.append('<th scope="col">Id</th>');
				tableHeader.append('<th scope="col" style="min-width: 100px !important"></th>');

			columnsWidthSearchResults = [{ visible: false}, { width: "100%" }];

		} else {
			var tableHeader = $("#itemsSearchResults>thead>tr");
				tableHeader.append('<th scope="col" style="min-width: 100px !important"> CVE GRUPO </th>');
				tableHeader.append('<th scope="col"> PROVEEDOR </th>');

			columnsWidthSearchResults = [{ width: "30%" }, { width: "70%" }]

		}

		//Definir DataTable SearchResults
		createDataTable('itemsSearchResults', { multi: false, order: [], columns: columnsWidthSearchResults, language: { emptyTable: '' }, select: { style: 'single' } });

		//apply regex to filter field
		var inputFilter = $('.dataTables_filter').find('input')[0];
		applyRegex($(inputFilter), "^[\na-zA-Z0-9 ]+$");


	},
}

