// Todays date
Date.prototype.today = function () {
    return ((this.getDate() < 10)?"0":"") + this.getDate() +" "+ _months[this.getMonth()] +" "+ this.getFullYear();    
}

// Time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

String.prototype.matchAny = function(array) {
    var match = false,
        str = this;
    if (typeof array != "object") return false;
    array.forEach(function(item) {
        if (str == item) {
            match = true;
            return;
        }
    });
    return match;
}
String.prototype.enter2br = function(){
	var str = this;
	return str.replace(/\r?\n|\r/g, "<br>");
}
Number.prototype.matchAny = function(array) {
    var match = false,
        str = this;
    if (typeof array != "object") return false;
    array.forEach(function(item) {
        if (str == item) {
            match = true;
            return;
        }
    });
    return match;
}
// IE
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

jQuery.fn.disable = function() {
    return $(this).attr("disabled", "");
}
jQuery.fn.enable = function() {
    return $(this).removeAttr("disabled");
}
$.fn.enter = function(callback) {
	$(this).each(function(index, input){
		if(input.fnEnter != true){
			input.fnEnter = true;
			$(input).keypress(function(e){
				if(e.charCode == 13)
					callback();
			});
		}
	});
}
jQuery.fn.valTrim = function() {
    return $(this).val().trim();
}
jQuery.fn.validate = function(validation) {
    var a = $(this);
    if(validation == null || validation === true)
    {
        a.removeClass("error");
        if( a.prop("tagName") == "SELECT" )
        {
            a.siblings(".combobox").find("input, a").removeClass("error");
        }
    }
    else
    {
        a.addClass("error");
        if( a.prop("tagName") == "SELECT" )
        {
            a.siblings(".combobox").find("input, a").addClass("error");
        }
    }
    return a;
}
$.fn.fadeInline = function(){
    $(this).fadeIn().css("display","inline-block");
}
$.fn.showBlock = function(){
	$(this).css("display", "block");
	return $(this);
}
$.fn.showInline = function(){
	$(this).css("display", "inline-block");
	return $(this);
}
jQuery.fn.valCombo = function(id){
    var $combo = $(this);
    $combo.val(id);
    var text = $combo.find("option[value='" + $combo.val()  + "']").text();
    $combo.siblings(".combobox").find("input").val( text );
    return $combo;
}
$.fn.loading = function(text){
    var $target = $(this);
    $target.unloading();
	
	// Element not found
	if(!$target.position() || $target.position().top == 0) return;

	var $loading = $('<div class="loading"><div class="loading_items"><span class="gif"></span></div>');
	$loading.css({
	    top: $target.position().top + +$target.css("marginTop").replace("px", ""),
	    left: $target.position().left + +$target.css("marginLeft").replace("px", ""),
	    width: $target.outerWidth(),
	    height: $target.outerHeight()
	});
	$("body").append($loading);

	var text = text;
	$(".loading_items").append(text);

    // Center loading
    var $img = $loading.find(".gif");
	var loading_height = $img.height();
    var loading_width = $img.width();		
	$loading.find(".loading_items").css({
	    top: ( $target.outerHeight() - loading_width ) / 2,
	    left: ( $target.outerWidth() - loading_height ) / 2
	});
	$target.addClass("hasLoading");
	$target[0].$loading = $loading;

	// Radius
	$loading.css("border-radius", $target.css("border-radius"));

    return $target;
}
$.fn.unloading = function(){
    var $target = $(this);
    if($target[0] && $target[0].$loading)
    {
    	$target.removeClass("hasLoading");
        $target[0].$loading.remove();
        delete $target[0].$loading;
    }
}
$.fn.onlyNumbers = function(){
	$(this).on('input keypress', function(e){
		if( !isNumber_event(e, e.target) )
		{
			event.preventDefault();
			return false;
		}
	}).on('blur', function(){
		$(this).val( round2Decimals( $(this).val() ) );
	});
	return $(this);
}
$.fn.outerHtml = function(){
	return $(this).wrapAll('<div>').parent().html();
}
$.fn.hasScroll = function() {
	return this.get(0).scrollHeight > this.height();
}

$.datepicker.regional['es'] = {
    closeText: 'Cerrar',
    prevText: '< Ant',
    nextText: 'Sig >',
    currentText: 'Hoy',
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene','Feb','Mar','Abr', 'May','Jun','Jul','Ago','Sep', 'Oct','Nov','Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
    dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
    weekHeader: 'Sm',
    dateFormat: 'dd/mm/yy',
    firstDay: 1,
    isRTL: false,
    showMonthAfterYear: false,
    yearSuffix: ''
 };
 $.datepicker.setDefaults($.datepicker.regional['es']);