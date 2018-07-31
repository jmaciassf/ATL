$FLOW = {
    cancel: function(){
        location.hash = "Reports";
    },

    next: function(){
        console.log("next");
        var ctrl = this;

        var hash = location.hash.replace("#", "").toUpperCase();
        switch(hash){
            case "ITEMSSEARCH":
                ctrl.validation_ItemsSearch();
                break;

            case "REGISTER":
                $REGISTER.send();
                break;
            
            case "SERVICETYPE":
                ctrl.validation_ServiceType();
                break;
            
            case "CHECKLIST":
                ctrl.validation_Checklist();
                break;

            case "SUPPLIER":
                ctrl.validation_Supplier();
                break;

            case "FAILURE":
                ctrl.validation_Failure();
                break;
        }
    },

    nextStep: function(json){
        var ctrl = this, key =sessionStorage.selection;
        var jsonCampaign = JSON.parse(sessionStorage.campaign);
        var section;
        var hash = location.hash.replace("#", "").toUpperCase();
        switch(hash){
            case "ITEMSSEARCH":
                section = "Articulo";
                break;

            case "SERVICETYPE":
                section = "TS";
                break;
            
            case "CHECKLIST":
                section = "Solucion";                
                break;

            case "SUPPLIER":
                section = "Proveedor";
                break;

            case "FAILURE":
                section = "Falla";
                break;
        }
        
        var nextIndex = ctrl.findSection(section) + 1;
        var next = jsonCampaign.Flujo[nextIndex];

        switch(next.Titulo.toUpperCase()){
            case "ARTICULO":
                location.hash = "ItemsSearch";
                break;
            
            case "REGISTRO":
                location.hash= "Register";
                break;

            case "SOLUCION":
                SVC({
                    url: getUrl('WSConsultaListaSolucion', 'ConsultarSolucion?strCveTipoServicio='+ key),
                    success: function (___json) {
                         console.log(___json);
                        if (___json.Lista != []) {
                            ___json.Lista.forEach(function (item) {
                                if (item.Checklist != false) {
                                    var check = true;
                                } else {
                                    var check = false;
                                }
                                if (check != null) {
                                    sessionStorage.check = check;
                                }
                            });
                        }

                        var _check = (sessionStorage.check) ? JSON.parse(sessionStorage.check) : "false";
                        
                        sessionStorage.listasolucion = true;
                        if(_check == true)
                            sessionStorage.listasolucion = false;

                        location.hash = "Checklist";
                    }
                });
                break;
            case "TS":
                location.hash = "ServiceType";
                break;
            case "Falla":
                location.hash = "failure";
                break;
                
            case "PROVEEDOR":
                location.hash = "supplier";
                break;
        }

        sessionStorage.navigation = "next";
    },

    validation_ItemsSearch: function(){
        this.nextStep();
    },

    validation_ServiceType: function(){
        var $selected = $("#serviceType .contentTree .jstree-clicked");
        if(!$selected.length){
            warning("Debe seleccionar un tipo de servicio.");
            return;
        }
        
        var key = $selected.parent().attr("key");
        sessionStorage.serviceType = JSON.stringify($selected.parent()[0]._data);
        this.nextStep({ key: key });        
    },

    validation_Checklist: function(){
        console.log("validation_Checklist");
        this.nextStep();
    },
      validation_Failure: function(){
        console.log("validation_Failure");
        this.nextStep();
    },
    validation_Supplier: function(){
        var suppliersTable = $('#itemsSearchResults').DataTable();
        var supplierSelected =  suppliersTable.rows('.selected').data();
        if(supplierSelected.length == 0) {
            $('.searchError').html('Seleccionar un Proveedor para continuar.');
            return;
        }

        sessionStorage.supplier = JSON.stringify(supplierSelected[0].itemData);
        this.nextStep();
    },

    setText: function(){
        console.log("setText");

        var jsonCampaign = JSON.parse(sessionStorage.campaign);
        var arrFlow = jsonCampaign.Flujo;
        var $steps = $("#content .steps").html("");
        var _index = $FLOW.getActualIndex();
        $("#content .number.flow").html(_index+1);

        arrFlow.forEach(function(item, index){
            var active = "";
            if(_index == index) active = "active";
            $steps.append('<span class="number '+ active +'">'+ (index+1) +'</span><span class="'+ active +'">'+ arrFlow[index].Descripcion +'</span>');
            if(index != arrFlow.length-1)
                $steps.append('<i class="fa fa-chevron-right _principal"></i>');                    
        });
    },

    getActualIndex: function(){
        var ctrl = this;
        var FlujoHash=[];
        var actual ="";
        var hash = location.hash.replace("#", "").toUpperCase();
         FlujoHash.push(hash);
                 
         switch (hash) {
            case "FAILURE":
                 flujo = "Falla";
                 sessionStorage.actual = flujo;
                 return ctrl.findSection("Falla");
            
            case "FINISH":
            case "REGISTER":
                flujo = "Registro";
                sessionStorage.actual=flujo;
                return ctrl.findSection("Registro");

            case "SERVICETYPE":
                flujo = "TS";
                sessionStorage.actual=flujo;
                return ctrl.findSection("TS");

            case "ITEMSSEARCH":
                flujo = "Articulo";
                sessionStorage.actual=flujo;
                return ctrl.findSection("Articulo");
            
            case "CHECKLIST":
                flujo = "Solucion";
                sessionStorage.actual = flujo;
                return ctrl.findSection("Solucion");

            case "SUPPLIER":
                flujo = "Proveedor";
                sessionStorage.actual = flujo;
                return ctrl.findSection("Proveedor");
        }
  
        sessionStorage.actual=actual;
        return -1;
    },

    findSection: function(section){
        var _index = -1;
        var jsonCampaign = JSON.parse(sessionStorage.campaign);
        jsonCampaign.Flujo.every(function(item, i){
            if(item.Titulo == section){
                _index = i;
                return false;
            }
            return true;
        });
        return _index;
    },

 
    //Consulta el Flujo dependiendo de la Campa�a
    FlujoCampania:function(){
      var jsonCampaign=JSON.parse(sessionStorage.campaign);
      var flujo=[];
      jsonCampaign.Flujo.forEach(function(item){
          flujo.push(item.Titulo);
      })
       
        return flujo;
    },

    //Consulta la vista(Hash) dependiendo del Flujo
    viewsAc: function(view){
        var views = view;
        //Agregar Flujo y hash del flujo 
        switch (views) {
            case "Falla":
                hash = "failure"
                break;

            case "Registro":
                hash="register"
                break;
                
            case "TS":
               hash="serviceType";
              break;

            case "Articulo":
                 hash="itemsSearch"
               break;
               
            case "Solucion":
                hash="checklist"
                break;

            case "Proveedor":
               hash="supplier"
               break;
        }
        return hash;
    },


    //Boton Anterior
    back: function () {
        console.log("Back flow");
        var ctrl = this;        
        
        var arrViews = ctrl.FlujoCampania();
        var nameView = arrViews[ctrl.getActualIndex()];
        var backIndex = ctrl.findSection(nameView) - 1;
        
        //Vista actual dependiendo del Flujo
         var actualView = ctrl.viewsAc(nameView);
         var flujoBack = arrViews[backIndex];
         var viewBack = ctrl.viewsAc(flujoBack);

        //seleccionar Vista anterior 
        if(actualView != null){
            if(viewBack =="checklist"){
                if (sessionStorage.TipoSelSolucion == "none") {
                    var viewFlow_chk = arrViews[(backIndex-1)];
                    var viewBack_chk = ctrl.viewsAc(viewFlow_chk);
                    location.hash = viewBack_chk;
                }
                else
                    location.hash=viewBack;
            }
            else  
                location.hash=viewBack;
            
            sessionStorage.navigation = "back";
        }
    }
}