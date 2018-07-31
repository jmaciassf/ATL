$CHECKLIST = {
    start: function () {
        console.log("checklist start");
        if (!(sessionStorage && sessionStorage.campaign) || sessionStorage.finish) {
            location.hash = "#Reports";
            return;
        }
        var campania = JSON.parse(sessionStorage.campaign);
        var llave = sessionStorage.selection;
        var subtitulo = campania.DescTiposervicio;
        var Slidecount = 0;
        var tipoSelSolu = "";
        var lectura = 0
        var lstSol = JSON.parse(sessionStorage.listasolucion);
        $("#checklist  .subtitle").append(subtitulo);
        console.log(campania);

        SVC({
            url: getUrl('WSConsultaListaSolucion', 'ConsultarSolucion?strCveTipoServicio=' + llave),
            success: function (json) {
                console.log(json);
                tipoSelSolu = "none";
                json.Lista.forEach(function (item, index) {
                    var ac = index + 1
                    if (item.CheckList == false) {
                        var checkhtml = '<h6><p class="checklist"> ' + ac + ".-" + item.Descripcion + '</p></h6>';
                        tipoSelSolu = "checklist"
                        sessionStorage.TipoSelSolucion = tipoSelSolu;
                        sessionStorage.check = false;

                    } if (item.CheckList == true) {
                        var c_indicators =
                                                '<li data-target="#Solutions" class="li" data-slide-to="' + index + '" ></li>';
                        var c_inner =
                            '<div class="carousel-item">' +
                            '<div class="carousel-caption">' +
                                '<p class="carousel-text"> ' + item.Descripcion + '</p>' +
                            '</div>' +
                            '</div>';
                        sessionStorage.check = true;
                        tipoSelSolu = "Carousel";
                        sessionStorage.TipoSelSolucion = tipoSelSolu;

                    }
                    if (sessionStorage.check == "false") {
                        $(".chk_form").append(checkhtml);
                        $(".slide").hide();
                    }
                    if (sessionStorage.check == "true") {
                        $(".carousel-indicators").append(c_indicators);
                        $(".carousel-inner").append(c_inner);
                        if (index == 0) {
                            $('.carousel-item').addClass('active');
                            $('.li').addClass('active');
                            $(".der").hide();
                        }
                        Slidecount = index;
                        $(".chk_form").hide();
                    }
                });

                setHelp({ $section: $("#checklist .help"), flow: "Solucion" });
                $FLOW.setText();
                var validar = '<img class="validar_img" src="' + urlContent + 'Images/loading.gif">' +
               '<h3 class="validar_txt">Estamos validando su informaci&oacuten...</h3>';
                $(".vamoa_validar").append(validar);
                // console.log(validar);
                if (tipoSelSolu == "none") {
                    sessionStorage.TipoSelSolucion = "none";
                    $(".section").hide();
                    $(".subtitle").hide();
                    $(".flow").hide();
                    $(".btnCancel").hide();
                    $(".btnNext").hide();
                    $(".vamoa_validar").show();
                    setTimeout(function () {
                        $(".vamoa_validar").hide();
                        $FLOW.next();
                    }, 2000);

                } else {
                    $(".section").hide();
                    $(".btnCancel").hide();
                    $(".btnNext").hide();
                    $(".subtitle").hide();
                    $(".flow").hide();
                    //$(".buttons.hide.btnchk").hide();
                    $(".vamoa_validar").show();
                    setTimeout(function () {
                        $(".vamoa_validar").hide();
                        //habilitar y deshabilitar checkBox
                        var enable = JSON.parse(sessionStorage.check);
                        //borrar session
                        $(".section").show();
                        $(".subtitle").show();
                        $(".flow").show();
                        $(".btnCancel").show();
                        $(".btnNext").show();
                        sessionStorage.check = null;
                        if (enable == true) { $(".checklist").enable(true); }
                        else if (enable == false) { $(".checklist").disable(true); }
                        $('#siguiente').click(function () {
                            if (tipoSelSolu == "Carousel") {
                                if (lectura == true) {
                                    $FLOW.next();
                                } else {
                                    warning("Favor de leer todas las soluciones");
                                }
                            } else if (tipoSelSolu == "checklist") {
                                $FLOW.next();
                                event.preventDefault();
                            }
                            var check = JSON.parse(sessionStorage.check);
                        });

                        // Flujo

                        $("#checklist .buttons").show();
                        $('.izq').click(function () {
                            if ($(".carousel-item").hasClass('active')) {
                                if ($(".li.active").index() == (Slidecount - 1)) {
                                    $(".der").show();
                                    $(".izq").hide();
                                    lectura = true;
                                }
                            }
                            if ($(".li.active").index() == 0) {
                                $(".izq").show();
                                $(".der").show();
                                lectura = false;
                            }

                        });
                        $('.der').click(function () {
                            if ($(".li.active").index() == Slidecount) {
                                $(".der").show();
                                $(".izq").show();
                                lectura = false;
                            }
                            if ($(".li.active").index() == 1) {
                                $(".der").hide();
                                $(".izq").show();
                                lectura = false;
                            }
                            if ($(".li.active").index() == 0) {
                                $(".izq").show();
                                lectura = false;
                            }

                        });

                        $(window).on("resize", $CHECKLIST.resize);
                        $(window).resize();
                    }, 2000);


                }


            }

        });

    },

    resize: function () {
        _resize();
        setTimeout(function () { _resize(); }, 100);

        function _resize() {
            if (!$("body").hasClass("isMobile")) {
                var height = $(window).height() - $("#header").height() - $("#topButtons").height()
                    - $("#content .steps").height() - 184;
                if (height < 200) height = 200;
                $("#checklist .checklist_").css("height", height);
            }
        }
    }

}