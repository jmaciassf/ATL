$FINISH = {
    start: function () {
    	console.log("finish");
        var ctrl = this, view = $("#finish");

        function _exit() {
            $FLOW.cancel();
        }

        var jCampaign;
        try {
            ctrl.jCampaign = jCampaign = JSON.parse(sessionStorage.campaign);
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
		
		var data;
		try{
			data = JSON.parse(sessionStorage.finish);	
		}
		catch (e) {
			$FLOW.cancel();
			return;
		}
		
		view.find(".form").hide();
    	var $finish = view.find(".finish").show();
		$finish.find(".noTicket").html(data.Resultado);
		$finish.find(".time").html(minutes2hours(data.TiempoRespuesta));
		$finish.find(".priority").html(data.Prioridad);

        // Ayuda
        setHelp({ $section: view.find(".help"), flow: "Registro" });

        // Flujo
        $FLOW.setText();

        // Subtitle
        var description = ctrl.campaign = jCampaign.DescTiposervicio;
        view.find(".subtitle").html(description);
    },

    resize: function () {
        console.log("resize");
        
        if(!$("body").hasClass("isMobile")){
            setTimeout(function(){
                var height = $(window).height() - $("#header").height() - $("#topButtons").height() 
                    - $("#content .steps").height() - 185;
                if(height < 200) height = 200;
                $("#finish .content").css("height", height);
            }, 100);
        }
    }
}