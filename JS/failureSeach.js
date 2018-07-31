$FAILURE = {
    start: function () {
        console.log("failure start");
        var ctrl = this, view = $("#failure");
        var jsonCampaign = JSON.parse(sessionStorage.campaign);
        var description = jsonCampaign.DescTiposervicio;
          $("#failure .subtitle").html(description); 
        function _exit() {
            $FLOW.cancel();
        }
         $(".confirmData").hide();
           // Flujo
        $FLOW.setText();
        setHelp({ $section: $("#failure .help"), flow: "Falla" });
        if (sessionStorage.finish || !sessionStorage.campaign) {
            _exit();
            return;
        }
        var jCampaign, jServiceType;
        try {
            jCampaign = JSON.parse(sessionStorage.campaign);
            if (typeof (jCampaign) != "object") {
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

            $(".sFailure").keyup(function(event) {
		    if (event.keyCode === 13) {
		        $(".btnSearch").click();
		    }
		});
            $("#no").click(function () {
                $('input[type="text"]').val('');
                $(".confirmData").hide();
                $.jstree.destroy();
            });
    },
    search: function () {
        var ctrl = this, sFailureKey = sessionStorage.sFailureKey;
        var jsonArray = [], jsArray=[];
        var JsonCampaign = JSON.parse(sessionStorage.campaign);
        var usuario =localStorage.CveUsuario.toLowerCase();
       
         sessionStorage.campaniaTest= JsonCampaign.CveTiposervicio;//
         var campania = sessionStorage.campaniaTest;

        if ($(".sFailure").val() != "") {
            var clave = $(".sFailure").val();
        } else {
            $.jstree.destroy();
            warning("Debe ingresar la clave del Tipo de Falla a reportar");
            $(".confirmData").hide();
        }
        sessionStorage.sFailureKey = clave;
        ctrl.ajax_sFailure = SVC({
            url: getUrl('WSConsultaTiposServicioCampania', 'ConsultarTiposServicioCampania?strCveCliente=' + usuario + '&strCveCampania=' + campania + '&strCveTipoServicioFalla=' + clave),
                   // url: getUrl('WSConsultaTiposServicioCampania', 'ConsultarTiposServicioCampania?strCveCliente='+usuario+'&strCveCampania='+campania+'&strCveTipoServicioFalla='+clave),
                    success: function (json)
                    {
                     console.log(json);
                     sessionStorage.searchFailure = JSON.stringify(json);
                     console.log(json);
                        $SERVICETYPE.make_tree(json);
                        $(".confirmData").show();
                    }
                })
 
         },

     toggleTree: function () {
        console.log("toggleTree");
        var lhash=location.hash;
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
      resize: function () {
        _resize();
        setTimeout(function () { _resize(); }, 100);

        function _resize() {
            if (!$("body").hasClass("isMobile")) {
                var height = $(window).height() - $("#header").height() - $("#topButtons").height()
                    - $("#content .steps").height() - 184;
                if (height < 200) height = 200;
                $("#failure .izq").css("height", height);
            }
        }
    }
}