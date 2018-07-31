$REPORTS = {
    start: function(){
        console.log("Reports start");
        var ctrl = $ctrl = this;

        // Clean campaign info
        sessionStorage.clear();
        //delete sessionStorage.campaign;
        //delete sessionStorage.campaignHelp;
        
        // Load campaigns
        var $campaigns = $("#reports .campaigns");
        $campaigns.html("");
        SVC({
            url: getUrl('WSConsultaTiposServicioSuperior', 'ConsultarTiposServicioSuperior?strCveCliente=' + localStorage.CveUsuario),
            loading: '#reports .main',
            success: function (json) {
                console.log(json);
                var link = "";
                json.Lista.forEach(function (item, index) {
                    var style = "";
                    //var icon = item.Icono || "fab fa-react";
                    var icon = item.Icono;
                    var toggle = item.Ruta ? "data-toggle='modal' data-target='#modal' style='-webkit-appearance: inherit;'" : "";
                    var type = item.Ruta ? "button" : "";
                    var onclick = item.Ruta ? link = item.Ruta : "";
                    var html =
                    '<div id="'+ index +'" type="'+type+'"  class="campaign" ' + toggle + 'style="background-color:' + item.Color + '" >' +
                       '<div class="data">'+
                           '<i class="'+icon+' _principal"></i>'+
                           '<span class="description">' + item.DescTiposervicio + '</span>' +
                        '</div>'+
                    '</div>';
                    $campaigns.append(html);

                    setTimeout(function(){
						$(".campaign")[index].json = JSON.stringify(item);
						if(!icon){
							$(".campaign:eq("+ index +") i").hide();
						}
					}, 100);
                });

                $('.campaign').click(function () {
                    sessionStorage.campaign = this.json;
                    var json = JSON.parse(this.json);

                    // Popup
                    if(json.Ruta){
                    	popup({ iframe: true, body: '<iframe src="' + json.Ruta + '"></iframe>' }); //width="1025px" height="500px"
                    	return;
                    }

                    if(!json.Flujo){
                    	warning("Campaña sin flujo");
                    	return;
                    }

                    // Flow
                    switch(json.Flujo[0].Titulo.toUpperCase()){
                    	case "FALLA":
                    	    //warning("Abrir pantalla de Falla");
                    	    location.hash = "failure";
                    		break;
						
						case "PROVEEDOR":
                    		//warning("Abrir pantalla de Proveedor");
                            console.log('provisonalmente se abre pantalla de busqueda articulos');
                            location.hash = "supplier";
                    		break;

                    	case "TS":
                    		location.hash = "ServiceType";
                    		break;
                    }
                });

                var modal = '<div class="modal fade" id="modal" role="dialog">' +
                                    '<div class="modal-dialog modal-lg">' +
                                        '<style type="text/css"> .medidas{ width: 1050px !important;  height: 605px  !important;  }</style>' +
                                      '<!-- Modal content-->' +
                                      '<div class="modal-content medidas">' +

                                        '<div><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                                        
                                        '<div class="modal-body">' +
                                        	'<iframe width="1020px" height="500px" src="' + link + '"></iframe>' +
                                        '</div>' +
                                        '<div class="modal-footer">' +
                                         '<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>' +
                                        '</div>' +
                                      '</div>' +
                                    '</div>' +
                                  '</div>';
                //$("#reports").append(modal);                
            }
        });
        
    },

    // start: function(){
    //     console.log("Reports start");
        
    //     // Load campaigns
    //     SVC({
    //         url: getUrl('WSConsultaTiposServicioSuperior', 'ConsultarTiposServicioSuperior?strCveCliente=' + localStorage.CveUsuario),
    //     	success: function(json){
    //     	    console.log(json);

    //     	    json.Lista.forEach(function(item){
    //     	        var icon = item.Icono || "fab fa-react";
    //     	        var onclick = item.Ruta ? "window.open('"+ item.Ruta +"')" : "";
    //     	        var html = 
    //     	        '<div class="campaign" style="background-color:'+ item.Color +'" onclick="'+ onclick +'">'+
    //     	           '<div class="data">'+
    //     	               '<i class="'+icon+' _principal"></i>'+
    //     	               '<span class="description">'+ item.DescTiposervicio +'</span>' +
    //                     '</div>'+
    //                 '</div>';
    //     	        $("#reports .campaigns").append(html);
    //     	    });
    //         }
    //     });

    // },

    universalSearch: function(){
    	console.log('get search results');

        location.href = '#ItemsSearch';
        return;

    	var searchText = $('.txtSearch').val();
    	if(searchText == '' || searchText == null){
    		warning('Debes introducir texto en el campo de búsqueda.');
    		$('.txtSearch').focus();
    		return;
    	}

    	var  methodParams = '';
    	var searchType = $("input[name='search']:checked").val();

    	if(searchType == 'general'){
    		methodParams = 'MultiplesResultados?strBusqueda=bimbo&strCliente=10mon50edi';
    	}
    	else{
    		methodParams = 'MultiplesResultados?strBusqueda=bimbo&strCliente=10mon50edi';
    	}


    	SVC({
			url: getUrl('WSBusquedaUniversal', methodParams),
			success: function(json) {
				console.log(json)

				$REPORTS.drawTableResults(json.Lista);
			}
		});
    	
    },

    drawTableResults: function(items){
    	if(items.length == 1)
    		$REPORTS.openNextWindow();
    	else if(items.length > 1){
    		var content = '<table id="searchResults" class="table table-responsive">' +
                  '<thead>' +
                    '<tr>' +
                      '<th scope="col"></th>' +
                      '<th scope="col">Campania</th>' +
                      '<th scope="col">Niveles Superiores</th>' +
                      '<th scope="col">Tipo</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' +

                  '</tbody>' +
                '</table>';


				jsoninfo = {
				    title : 'Resultados',
				    body : content,
				    show : true,
				    id: 'universalSearchResults',
				    idContainer: 'reports',
                    acceptFn: function(){ success('yeaa');}
				}

				popup(jsoninfo);
				
				var tableResults = $("table.table-responsive");
				tableResults.empty();

				for (var i = items.length - 1; i >= 0; i--) {
					var newRow = '<tr>' +
			        	'<td><input type="checkbox" value="email"></td>' + 
			           '<td>' + items[i].Campania + '</td>' +
			           ' <td>' + items[i].InfoPadre + '</td>' +
			           '<td>' + items[i].Cvetiposervicio + '</td>' +
			         '</tr>';
					tableResults.append(newRow);
				}
    	}
    },

    openNextWindow: function(){
    	success('Open new window for editing new folios');
    }
}