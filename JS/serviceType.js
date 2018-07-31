$SERVICETYPE = {
    start: function () {
        console.log("Service type start");
        var ctrl = $ctrl = this, view = $("#serviceType");

        function _exit() {
            location.hash = "Reports";            
        }

        if (!sessionStorage.campaign || sessionStorage.finish) {
            _exit();
            return;
        }

        var jsonCampaign;
        try {
            jsonCampaign = JSON.parse(sessionStorage.campaign);
            if (typeof (jsonCampaign) != "object") {
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

        // Ayuda
        setHelp({ $section: $("#serviceType .help"), flow: "TS" });

        // Flujo
        $FLOW.setText();

        // Permisos de visualizacion
        if(getPermission("GridTS")){
            view.find(".views").show();
            view.addClass("viewsOn")
        }
        
        // Arbol de tipo de servicio
        var campaign = ctrl.campaignKey = jsonCampaign.CveTiposervicio;
        var description = ctrl.campaign = jsonCampaign.DescTiposervicio;
        $("#serviceType .subtitle").html(description);

        setTimeout(function(){ view.find(".flowButtons").removeClass("hide"); }, 400);        

        //check for supplier
        var cveGrupo = '';
        if(typeof sessionStorage.supplier != 'undefined') {
            var jsonSupplier = JSON.parse(sessionStorage.supplier);
            cveGrupo = jsonSupplier.CveGrupo;
        }

        // Buscar si esta guardado el arbol, no consultar el servicio
       if(sessionStorage.tree){
           ctrl.setTree();
           
            return;
       }

        ctrl.ajax_serviceType = SVC({
                url: getUrl('WSConsultaTiposServicio', 'ConsultarTipoServicio?strCveCliente=' + localStorage.CveUsuario + '&strCveCampania=' + campaign + '&strCveGrupo=' +cveGrupo),
            loading: '#serviceType .section.content',
        	success: function(json){
        	    console.log(json);

        	    if(!json.Lista.length){
        	        warning("La campaña no cuenta con tipos de servicio.");
        	        $("#serviceType .main .right").hide();
        	        return;
        	    }
        	   
        	    ctrl.make_tree(json);
        	}
        	})
        	},
         
     make_tree: function(_json){
               
                var ctrl = this, sFailureKey = sessionStorage.sFailureKey;
                var arrTree = [], f_arrTree=[];
                var treeFull = false, itemsAdded = 0;
                var Campania = sessionStorage.campaniaTest;
                if(sFailureKey){
               
               _json.Lista.forEach(function (item){
                      f_arrTree.push(item); 
                   });
                }
                $.jstree.destroy();
                while (!treeFull){ 
                       _json.Lista.forEach(function (item, index) {
                        if (item.added) return ;    

                        //funcion para buscar padres eh hijos 
                        function _findParent(_parent) {
                                  if(sFailureKey){
                                        if(_parent.CveTiposervicio == Campania)
                                        {
                                             item.text = item.DescTiposervicio;
                                        }
            
                                     }
                                if (_parent.CveTiposervicio == item.CveTiposervicioSuperior) {
                                    if (!_parent.hasChildren) {
                                        //_parent.state = { disabled: true };
                                       _parent.children = [];
                                       _parent.hasChildren = true;
                                    }
                                
                                    item.text = item.DescTiposervicio;
                                    _parent.children.push(item);
                                    /*
                                    _parent.children.push({ 
                                        text: item.DescTiposervicio, 
                                        CveTiposervicio: item.CveTiposervicio, 
                                        CveTiposervicioSuperior: item.CveTiposervicioSuperior 
                                    });
                                    */
                                    item.added = true;
                                    itemsAdded++;
                                    return false;
                                }
                                else if (_parent.children) {
                                    // Recorrer los hijos
                                    var _return = true;
                                    _parent.children.every(function (children) {
                                        _return = _findParent(children);
                                        return _return;
                                    });
                                    return _return;
                                }
                                return true;
                            }
                        
                        // Buscar el padre de falla
                            if(sFailureKey){
                                f_arrTree.every(function (parent) {
                                return _findParent(parent);
                                    }); 
                                    if(item.CveTipoServicioFalla== sFailureKey){
                                         itemsAdded++;
                                    }
                           
                            } else if (item.CveTiposervicioSuperior) {
                            // Recorre todos los elementos agregados al arbol para buscar al padre del elemento actual
                             arrTree.every(function (parent) {
                                return _findParent(parent);
                            }); 
                            // Recursividad para buscar el padre del elemento en todo el arbol
                            
                        }
                        else{

                            item.text = item.DescTiposervicio;
                            arrTree.push(item);
                            //arrTree.push({ text: item.DescTiposervicio, CveTiposervicio: item.CveTiposervicio, CveTiposervicioSuperior: item.CveTiposervicioSuperior });                            
                            item.added = true;
                            itemsAdded++;
                        }
                      
                        //}
                                                 
                    });
                                        // Verificar si ya se agregaron todos los elementos al arbol
                    if (itemsAdded >= _json.Lista.length)
                        treeFull = true;
                }
                if(sFailureKey){
                    // filtra el arbol para traer solo el seleccionado 
                    f_arrTree = f_arrTree.filter(function(item){ return item.CveTiposervicio == Campania;});
                   //  f_arrTree = f_arrTree.filter(item => item.CveTiposervicio == Campania);
                    //agrega el arrelgo al arbol 
                     sessionStorage.tree = JSON.stringify(f_arrTree);
                            ctrl.setTree();
                }else{
                     sessionStorage.tree = JSON.stringify(arrTree);
                            ctrl.setTree();
                }
               
        	
        //});
    },
  
    setTree: function(){
        console.log("setTree");
        
        var ctrl = this, sFailureKey = sessionStorage.sFailureKey;
        var arrTree = JSON.parse(sessionStorage.tree);
        var lhash=location.hash;
        
        if (lhash=="#ServiceType"){
            lhash="#serviceType";
        }
        ctrl.tree = arrTree;
        console.log(arrTree);

        
        //serviceType
        $( lhash+' .tree_grid .tree').jstree({
            core: {
                themes: { icons: false},
                data: arrTree
            },
            conditionalselect: function (node, event) {
                // Seleccionar solo nodos de ultimo nivel
                if(!node.children.length)
                    return true;
            },
            plugins: ["conditionalselect", "search"]
        }).bind(
            "select_node.jstree", function (evt, data) {
                //$("#serviceType .suggestion").hide();
                var key = data.node.original.CveTiposervicio;
                console.log("selection: " + key);
                sessionStorage.selection = key;
                //mostrar nodo seleccionado 
                if (sFailureKey){
                   var failure_selectedNode =JSON.stringify(data.node.original);                  
                   // sessionStorage.failure_selectedNode = failure_selectedNode;
                    sessionStorage.serviceType = failure_selectedNode;
                    //mostrar el nodo seleccionado
                    var f_selectNode = JSON.parse(sessionStorage.serviceType);
                    console.log(f_selectNode);
               }
                // Verificar si tiene permisos para ver sugerencias
                if (!getPermission("Sugerencia"))
                    return;

                // Sugerencias
                var $target = $(".jstree-clicked"); ///$(event.target);
                var $icoSuggestion = $(lhash+" .fa-lightbulb");
                //$(".ui-tooltip").remove();

                if ($target[0].suggestion_consulted) {
                    //$target.mouseover();
                    if($target[0].suggestion)
                        _showSuggestion($target[0].suggestion);
                    else {
                        $icoSuggestion.hide();
                    }
                    return;
                }


                SVC({
                    url: getUrl('WSConsultaTiposServicio', 'ConsultarSugerencia?strCveTipoServicio=' + key),
                    loading: lhash+" .suggestion",
                    success: function (_json) {
                        console.log(_json);

                        if (_json.Sugerencia) {
                            var suggestion = _json.Sugerencia;
                            $target[0].suggestion = suggestion;                                    
                            _showSuggestion(suggestion);

                            /*
                            $target.prop("title", _json.Sugerencia).tooltip({
                                content: function() {
                                    var element = $( this );
                                    return "<b>Sugerencia: </b>" + $target.prop("title");
                                },
                                disabled: true,
                                close: function( event, ui ) { 
                                    $(this).tooltip('disable'); 
                                }
                            }).on('click', function () {
                                 $(this).tooltip('enable').tooltip('open');
                            }).click();//.mouseover();
                            */
                        }
                        else {
                            $icoSuggestion.hide();
                        }
                    }
                });
                $target[0].suggestion_consulted = true;

                function _showSuggestion(suggestion) {
                    //$("#serviceType .suggestion .info").html(suggestion);
                    //$("#serviceType .suggestion").show();

                    // Mobile
                    //if(($("body").hasClass("isMobile") || $("body").hasClass("noHelp")) && !$(event.target).hasClass("fas"))
                        popup({ title: "Sugerencia", body: suggestion, alert: true, class: "suggestion" });
                        $icoSuggestion.showInline();
                }
            }

        );
        $(lhash+" .buttons").removeClass("noNext");
        setTimeout(function(){
            help_resize();
            if(sFailureKey){ 
                      ctrl.selectNode();
                 }

        }, 300); 
    },
    //Seleccionar nodo despues de cargar el flujo
    selectNode:function(){
         ctrl=this,sFailureKey = sessionStorage.sFailureKey;
                 if(sFailureKey){
                    $(".tree").jstree("open_all");
                   var node =  $(".jstree-node.jstree-leaf.jstree-last")[0].id;
                    $.jstree.reference('.tree').select_node('#'+node);
                 }
             },
    toggleTree: function () {
        console.log("toggleTree");
        var lhash = location.hash;

        if (lhash == "#ServiceType") {
            lhash = "#serviceType";
        }
        var $ico = $(lhash+" .toggleTree");
        if ($ico.hasClass("collapse")) {
            $(".tree").jstree("close_all");
        }
        else {
            $(".tree").jstree("open_all");
        }
        $ico.toggleClass("collapse");
        this.resize();
    },

    changeView: function (ico) {

        console.log("changeView");
        var lhash = location.hash;
        if (lhash == "#ServiceType") {
            lhash = "#serviceType";
        }
        var lhash
        var $ico = $(ico);
        if ($ico.hasClass("selected"))
            return;
            
        $ico.siblings().removeClass("selected");
        $ico.addClass("selected");
        var $hierarchy = $(lhash+" .hierarchy");
        $hierarchy.html("");
        var $tree_grid = $(lhash+" .tree_grid").removeClass("small");

        if ($ico.hasClass("icoHierarchy")) {
            // Show tree
            $(lhash+" .contentTree, "+lhash+" .subtitle:not(.hierarchy)").show();
            $(lhash+" .contentGrid").hide();
            $hierarchy.addClass("hidee");
            $tree_grid.removeClass("grid").addClass("_tree");
            //$("#serviceType .section.right").removeClass("width100");

            // Scroll in the selected element
            var $selected = $("#serviceType .contentTree .jstree-clicked");
            if ($selected.length) {
                var selectedTop = $("#serviceType .contentTree .jstree-clicked").offset().top;
                if ($(".tree_grid").hasScroll()) {
                    var pRelative = selectedTop - $("#serviceType .tree").offset().top + 32;
                    var difference = pRelative - $(".tree_grid").height();
                    if (difference > 0) {
                      $(".tree_grid").scrollTop(difference + 32);
                    }   
                }
                else {
                    // Mobile
                    $("html").scrollTop(selectedTop - 70);
                }
            }
        }
        else {
            // Show grid
            if($ico.hasClass("fa-th")){
                $tree_grid.addClass("small");
            }
            $SERVICETYPE.grid_view();
        }
    },

    grid_view: function (_key) {
        console.log("grid_view");
        var lhash = location.hash;
        if (lhash == "#ServiceType"){lhash = "#serviceType";}
        var $content = $("#serviceType .contentGrid");
        $content.hide();
        $(lhash+" .contentTree").hide();
        $(lhash+" .tree_grid").removeClass("_tree").addClass("grid");
        var $hierarchy = $(lhash+" .hierarchy");
        var $grids = $(lhash+" .contentGrid .grids");
        $grids.html("");
        var arrItems = [];

        var tree = $SERVICETYPE.tree;
        
        var $_li;
        if (_key) {
            $_li = $(lhash+" .contentTree li[key='" + _key + "']");
            if (!$_li.find("> ul").length) {
                // Open node
                $_li.find("> i").click();
            }
        }
          
        // Verificar el nodo seleccionado para mostrar el nivel actual en el grid
        var $selected = _key ? $_li.find("> ul > li:first > a") : $(lhash+" .contentTree .jstree-clicked");
        if ($selected.length) {
            var data = $selected.parent()[0]._data;
            var key = data.CveTiposervicio;
            var parentKey = _key ? key : data.CveTiposervicioSuperior;

            if (parentKey != "") {
                // Show hierarchy
                $hierarchy.removeClass("hidee");
                $(lhash+" .subtitle:not(.hierarchy)").hide();

                // Obtener los elementos del nivel seleccionado
                var $ul = $selected.parents(".jstree-children:first");
                $ul.children().each(function () {
                    var $child = $(this);
                    arrItems.push($child[0]._data);
                });

                // Buscar la ruta completa en el arbol
                var hierarchy = "";
                _hierarchy($ul);
                hierarchy = '<span onclick="$SERVICETYPE.grid_view(\'' + $SERVICETYPE.campaignKey + '\')">' + $SERVICETYPE.campaign + '</span>' + hierarchy;
                $hierarchy.html(hierarchy);

                function _hierarchy($item) {
                    var parentText = $item.siblings(".jstree-anchor").text();
                    if (parentText) {
                        var __key = $item.parent()[0]._data.CveTiposervicio;
                        if (hierarchy)
                            hierarchy = " > " + '<span onclick="$SERVICETYPE.grid_view(\'' + __key + '\')">' + parentText + '</span>' + hierarchy;
                        else
                            hierarchy = " > " + '<span>' + parentText + '</span>' + hierarchy;
                    }                        
                    var $parent = $item.parents(".jstree-children:first");
                    if ($parent.length) {
                        _hierarchy($parent);
                    }
                }
            }
        }
        else {
            // Hide hierarchy
            $hierarchy.addClass("hidee");
            $(lhash+" .subtitle:not(.hierarchy)").show();
            //$("#serviceType .subtitle:first").show();
        }

        if (!arrItems.length)
            arrItems = tree;

        arrItems.forEach(function (item) {
            $grids.append('<div class="grid campaign" key="' + item.CveTiposervicio + '"><div class="data"><span class="description">' + item.text + '</span></div></div>');
            $grids.find(".campaign:last")[0]._data = item;
            if (item.hasChildren) {
                $grids.find(".campaign:last").append('<i class="fas fa-angle-double-right"></i>');
            }
        });

        var $arrGrids = $("#serviceType .contentGrid .grid");

        // Color of grids
        var jsonCampaign = JSON.parse(sessionStorage.campaign);        
        $arrGrids.css("backgroundColor", jsonCampaign.Color);

        // Click on grid
        $arrGrids.on("click", function () {
            var $grid = $(this);
            var _data = $grid[0]._data;
            console.log(_data);            
            //if ($grid.hasClass("selected")) return;

            if (_data.hasChildren) {
                $SERVICETYPE.grid_view(_data.CveTiposervicio);
                return;
            }
            
            $arrGrids.removeClass("selected");
            $grid.addClass("selected");

            // Select node on tree

            $("#serviceType .contentTree li[key='" + _data.CveTiposervicio + "'] > a").click();
        });

        // Select grid selected in tree
        if (!_key && key)
            $arrGrids.parent().find("[key=" + key + "]").click();

        $content.fadeIn();
        
        $SERVICETYPE.grid_resize();
    },
    
    grid_resize: function () {
        var lhash = location.hash;
        if (lhash == "#ServiceType") { lhash = "#serviceType"; }
        if (!$("#serviceType .contentGrid:visible").length) return;
        $("#serviceType .contentGrid .grid").each(function () {
            $(this).find(".description").width($(this).width() - 10);
        });
    },

    resize: function () {
        console.log("resize");
        
        if(!$("body").hasClass("isMobile")){
            setTimeout(function(){
                var height = $(window).height() - $("#header").height() - $("#topButtons").height() 
                    - $("#content .steps").height() - $("#serviceType .content .text").height() - 220;
                //$("#serviceType .tree_grid").css("maxHeight", height);
                if(height < 200) height = 200;
                $("#serviceType .tree_grid").css("height", height);
            }, 100);            
            //$(".modal.suggestion").modal('hide');
        }

        $SERVICETYPE.grid_resize();
    },

    next_step: function () {
        console.log("next_step");
        $FLOW.next();
    },
           
    timeout_search: false,
    search: function(){
        var ctrl = this;
        if(ctrl.timeout_search) { clearTimeout(ctrl.timeout_search); }
        ctrl.timeout_search = setTimeout(function(){
            var val = $('#serviceType .txtSearch').val();
            $('#serviceType .tree_grid .tree').jstree(true).search(val);
        }, 250);
    },


}