function popup(json){
	if(!json) json = {}
	json.show = json.show || true;
	json.body = json.body || "Contenido";
	json.title = json.title || "";
	var $container = json.container ? $(container) : $("body");

	var _class = "modal fade ";
	if(json.class)
		_class += json.class;
	
	var _attr = "";
	if(json.alert || json.confirm)
		_attr += ' data-backdrop="static"';
		
	var $popup = 
	$('<div class="'+ _class +'" id="popup_'+ new Date().getTime() +'" tabindex="-1" role="dialog" aria-hidden="true" '+ _attr +'>' +
      '<div class="modal-dialog" role="document"> ' +
       ' <div class="modal-content"> ' +
	  	
	  		// Header
	  		'<div class="modal-header">' +
	  			'<button type="button" class="close" data-dismiss="modal">&times;</button>' +
			'</div>' +
			
			// Body
          	'<div class="modal-body">' + json.body + '</div>' +

          	// Footer
          	'<div class="modal-footer"></div>' +
        '</div>' +
      '</div>' +
    '</div>');
	
	var $header = $popup.find(".modal-header");

	// Titulo
    if(json.title){
		$header.prepend('<h5 class="modal-title">' + json.title + '</h5>');
    }
    else {
    	$header.addClass("noBorder");
    }

    var $footer = $popup.find(".modal-footer");

    var showAccept = json.accept;
    var btnAccept = '<button type="button" class="button accept" data-dismiss="modal">Aceptar</button>';
    
    // Alerta, solo tiene el boton de aceptar
    if(json.alert){
    	$popup.addClass("alert");
    	showAccept = true;
    }
	
	// Confirm
	var $btnAccept;
    if(json.confirm){    	
        $popup.addClass("confirm");
        $footer.append(
            '<button type="button" class="button cancel" data-dismiss="modal">Cancelar</button>' +
            btnAccept
        );

        $btnAccept = $footer.find(".accept");
        if(typeof json.confirmFn == 'function'){            
            $btnAccept.on('click', function(){
                json.confirmFn();
                $popup.modal('hide').data('bs.modal', null);
            }); 
        }
    }

    // Cancel
    var $btnCancel = $footer.find(".cancel");
    if(typeof json.cancelFn == 'function'){
		$btnCancel.on('click', function(){
			json.cancelFn();
		}); 
	}

    if(showAccept){
    	if(!$btnAccept){
    		$footer.append(btnAccept);
			$btnAccept = $footer.find(".accept");	
    	}
    }
    if(typeof json.acceptFn == 'function'){
		$btnAccept.on('click', function(){
			json.acceptFn();
		}); 
	}
    
    if($footer.html() == "")
    	$footer.hide();

    $container.append($popup);

    // iFrame
	if(json.iframe){
		$popup.addClass("iframe");
		setTimeout(function(){
			var head = $popup.find("iframe").contents().find("head");
			var css = '<style type="text/css">' +
						'#mainContent { margin: 0 auto; }' +
					  '</style>';
			$(head).append(css);
		}, 600);
	}

    $popup.modal({ show: json.show });
	
	// z-index
    var zIndex = 1040 + (10 * $('.modal:visible').length);
    $popup.css('z-index', zIndex);
    setTimeout(function() {
        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
    }, 0);
	
	// Remove
    $popup.on('hidden.bs.modal', function(){
		$(this).remove();
	});
		
	$popup.on("click", function(){
		// Click outside or button x
		if($(event.target).hasClass("modal") || $(event.target).hasClass("close")){
			if(typeof json.cancelFn == 'function'){
				json.cancelFn();
			}	
		}		
	});

    setTimeout(function(){
    	popup_resize();
    }, 200);

    setTimeout(function(){
    	// Focus
    	if($btnCancel.length)
    		$btnCancel.focus();
		else
    		$btnAccept.focus();
    }, 350);
	
	tabindex();
    return $popup;
}

function popup_resize(){
	$(".modal.show").each(function(){
		// Ajustar la altura en caso de que sea más grande que la ventana
		var $popup = $(this);
		var $dialog = $popup.find(".modal-dialog");
		var mVertical = $dialog.css("margin-top").match(/[0-9]+/)[0] * 2;
		var header = $popup.find(".modal-header").height();
		var footer = $popup.find(".modal-footer").height();
		var maxHeight = $(window).height() - mVertical - header - footer - 100;
		if(!$popup.find(".modal-title").length)
			maxHeight += 18;
		if($popup.hasClass("iframe")){			
			$popup.find("iframe").height( maxHeight );
		}
		else {
			var $content = $popup.find(".modal-content");
			var $body = $popup.find(".modal-body");
			$body.height("auto");
			if($content.height() + 60 > $(window).height()){				
				$body.height(maxHeight);

				// Reducir margin
				$dialog.addClass("lessMargin");
			}
			else {
				// Restaurar margin
				$dialog.removeClass("lessMargin");
			}
		}
	});
}