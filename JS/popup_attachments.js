$ATTACHMENTS = {
	maxSize: { MB: 15, text: "15 MB" },
	deletedFiles: [],
	start: function(json){
		console.log("start");
		var ctrl = this;
		ctrl.deletedFiles = [];

		var body = 
		'<span>Adjunte los documentos que se requieran para este ticket.</span>' +
		'<input type="file" class="file hide" multiple>' +
		'<div class="button browse">Examinar</div>' +

		// Loading
		'<div class="progressBar"><div class="bar"></div></div>' +

		// Archivos
		'<div class="content hide">' +
			'<span class="totalSize">Tamaño total: <span class="value">0.00</span> Mb</span>' +
			'<div class="grid container">' +
				'<div class="header row">' +
					'<div class="col-sm-8">Nombre</div>' +
					'<div class="col-sm-2">Tamaño</div>' +
					'<div class="col-sm-2">Eliminar</div>' +
				'</div>' +
			'</div>' +
		'</div>';
		
		var $popup = ctrl.view = popup({
			class: "popup_attachments",
			title: "Documentos adjuntos",
			body: body,
			accept: true,
			acceptFn: function(){
				ctrl.accept();
			},
			cancelFn: function(){
				ctrl.cancel();
			}
		});
		ctrl.selectorTags = json.selectorTags;

		var $file = $popup.find(".file"), $browse = $popup.find(".browse");

		$browse.on("click", function(){
			ctrl.clearFile();
			$file.click();
		});
		
		// Selected files
		$file.on("change", function(){
			console.log("change");
			
			ctrl.counter = 0;
			ctrl.arrFiles = this.files;

			if (window.FormData === undefined) {
				warning("El navegador no puede subir archivos utilizando HTML5");
				return;
			}

			// Hide actions
			$popup.find(".accept, .browse").addClass("hidden");
			
			ctrl.msgDuplicated = "";
			ctrl.uploadFile();
		});


		// Archivos ya cargados en contentView
        $(ctrl.selectorTags + " .tag").each(function(index, tag) {
        	var data = tag.data;
            ctrl.addItem({
                idDocumento: data.idDocumento,
                nombre: data.fileName,
                size: data.size,
                tempName: data.tempName,
                tipo: data.type
            });
        });

        // Verificar maxSize
        SVC({
			url: getUrl('WSDocumentos', 'ConsultarTamanio'),
			noLoading: true,
			success: function(bytes) {
				var MB = bytes / (1024 * 1024);
				ctrl.maxSize = { MB: MB, text: MB+" MB" }
			}
		});
		
		setTimeout(popup_resize, 200);
	},
	
	accept: function(){
		console.log("accept");		
		var ctrl = this;

		ctrl.addFiles2View();

        // Borra los documentos que se eliminaron en el grid
        ctrl.deletedFiles.forEach(function(item) {
			ctrl.deleteFileTemp(item);
		});
	},

	addFiles2View: function(){
		console.log("addFiles2View");
		
		var ctrl = this, view = ctrl.view;
		var $tags = $(ctrl.selectorTags);

        // Limpiar el panel de contentView, excepto los fijos
        $tags.find(".tag").each(function(index, item) {
            $(item).remove();
        });
        
        view.find(".grid .data").each(function(index, item){
            var data = item.data;
            if (!data.tempName && !data.idDocument) return; // Debe tener tempName o idDocument, sino es invalido

            createTag({
            	$div: $tags,
            	data: data,
            	beforedestroyFn: function($tag){
                    popup({
						body: "¿Desea eliminar el documento adjunto?", 
						confirm: true,
						confirmFn: function(){
							ctrl.deleteFileTemp(data.tempName);
							$tag.remove();
						}
					});
            	}
			});
        });
	},

	// PENDING
	cancel: function(){
    	console.log("cancel");
    	var ctrl = this, view = ctrl.view;

        // Borrar los archivos que no estén en contentView y si en el grid
		var arrPopup = [];
		view.find(".grid .row.data").each(function(index, item){
			var tempName_Popup = item.data.tempName;
			if (tempName_Popup == null) return;
			arrPopup.push(tempName_Popup);

			$(ctrl.selectorTags + " .tag").each(function(index, tag) {
				var tempName_Tag = tag.data.tempName;
				if (tempName_Tag == tempName_Popup) {
					var index = arrPopup.indexOf(tempName_Popup);
					if (index > -1)
						arrPopup.splice(index, 1);
				}
			});
		});
		arrPopup.forEach(function(item) {
			ctrl.deleteFileTemp(item);
		});

		// No borrar los que están en los tags
		var arrNoDelete = [];

		var $attachmentsTags = $(ctrl.selectorTags + " .tag");
		for (var i = 0; i < $attachmentsTags.length; i++) {
			var tempName_Tag = $attachmentsTags[i].data.tempName;
			for (var j = 0; j < ctrl.deletedFiles.length; j++) {
				if (ctrl.deletedFiles[j] == tempName_Tag) {
					arrNoDelete.push(tempName_Tag);
					break;
				}
			}
		}
		arrNoDelete.forEach(function(item) {
			var index = ctrl.deletedFiles.indexOf(item);
			if (index > -1)
				ctrl.deletedFiles.splice(index, 1);
		});

		// Borra los documentos que se eliminaron en el grid
		ctrl.deletedFiles.forEach(function(item) {
			ctrl.deleteFileTemp(item);
		});
    },

	progressBar: function (percent, $element) {
		var width = percent * $element.width() / 100;
		var animationTime = 300;
		if(!width){
			$element.addClass("zero");
			animationTime = 0;
		}
		else
			$element.removeClass("zero");
		$element.find('.bar').show().stop().animate({ width: width }, animationTime).html(percent + "%");
	},
	
	// Upload files to server
	uploadFile: function() {
        console.log("Uploading file...");
        
        var ctrl = $ATTACHMENTS, view = ctrl.view,
            file = ctrl.arrFiles[ctrl.counter];

        // Verificar que el documento no haya sido agregado al grid
        var noUpload = false;
        view.find(".grid .row.data").each(function(index, item){
        	if (item.data.name == file.name) {
                ctrl.msgDuplicated += '"' + file.name + '", ';
                noUpload = true;
                return false;
            }
        });
        if (noUpload) {
            _uploadNextFile();
            return false;
        }
		
		// Start progressBar
        var $progressBar = view.find(".progressBar");
        
        var size = round2Decimals(file.size / 1024 / 1024);
        var totalSize = ctrl.checkTotalSize(size);
        if (totalSize === false) {
            setTimeout(function() {
                $progressBar.hide();
            }, 1500);
            return false;
        }

        ctrl.progressBar(0, $progressBar);
        $progressBar.show();




        // Convertir file a bytes
        var reader = new FileReader();
	  	reader.onload = function() {
			var arrayBuffer = this.result, arr8Bytes = new Uint8Array(arrayBuffer);
			var arrBytes = Array.from(arr8Bytes);
			
			var data = {
				Archivo: arrBytes,
				Nombre: file.name
			}

			SVC({
				url: getUrl('WSDocumentos', 'Adjuntar'),
				type: 'POST',
				data: data,
				noLoading: true,
				success: function(_data) {
					console.log('Exito: ', _data);
   
					// Agregar el elemento al grid                      
					var size = round2Decimals(file.size / 1024 / 1024);
					ctrl.addItem({
						nombre: file.name,
						size: size,
						tempName: _data.Path
					});
				},
				fail_after: function(){
					$progressBar.hide();
					ctrl.clearFile();
					error('Ha ocurrido un error al subir el archivo: ' + file.name);
				},
				complete: function(){
					_uploadNextFile();
				},
				xhr: function () {
					var xhr = $.ajaxSettings.xhr();
					xhr.upload.onprogress = function (e) {
						// Update loading bar
						if (e.lengthComputable){
							var percentage = Math.round(e.loaded * 100 / e.total);
							ctrl.progressBar(percentage, $progressBar);
						}
					};
					return xhr;
				}
			});
	  	}
	  	reader.readAsArrayBuffer(file);

        
        /*
        // Call SVC
        var data = new FormData();
        data.append("file1", file);
        data.append("WebToken", localStorage.WebToken);
        ctrl.xhr = new XMLHttpRequest();
        ctrl.xhr.open('POST', urlContent + 'ATL/UploadFile', true);
        ctrl.xhr.onload = function() {
        	var xhr = ctrl.xhr;
            var file = ctrl.arrFiles[ctrl.counter];
            if (xhr.status === 200) {
                var jsonResponse = JSON.parse(xhr.responseText).List;

                // Verificar si es error
                if(jsonResponse.MensajeError && jsonResponse.MensajeError.Mensaje){
                	warning(jsonResponse.MensajeError.Mensaje);
                }
                else {
                	console.log('Exito: ', jsonResponse);
   
					// Agregar el elemento al grid                      
					var size = round2Decimals(file.size / 1024 / 1024);
					ctrl.addItem({
						nombre: file.name,
						size: size,
						tempName: jsonResponse.Path
					});
                }
            } else if (xhr.status === 202) {
                alert(xhr.responseText.replace(/"/g, ""), 'warning');
            } else {
                $progressBar.hide();
                ctrl.clearFile();
                error('Ha ocurrido un error al subir el archivo: ' + file.name);
            }

            _uploadNextFile();
        }
        ctrl.xhr.upload.addEventListener("progress", function(evt){
	  		// Update loading bar
          	if (evt.lengthComputable){
	            var percentage = Math.round(evt.loaded * 100 / evt.total);
	            ctrl.progressBar(percentage, $progressBar);
          	}
        }, false);
        ctrl.xhr.send(data);
        */

        function _uploadNextFile() {
            ctrl.counter++;
            if (ctrl.counter >= ctrl.arrFiles.length) {
                
                setTimeout(function() {
                	view.find(".browse, .accept").removeClass("hidden");
                    if ($progressBar && $progressBar.length)
                        $progressBar.hide();
                }, 500);

                ctrl.clearFile();

                // Mostrar alerta de error
                var msgDuplicated = ctrl.msgDuplicated;
                if (msgDuplicated != "") {
                    if (msgDuplicated.endsWith(", "))
                        msgDuplicated = msgDuplicated.slice(0, msgDuplicated.lastIndexOf(", "));

                    warning('Ya existen archivos con el mismo nombre.<br>' + msgDuplicated);
                }
            } else {
                ctrl.uploadFile();
            }
        }
    },

    clearFile: function(){
		console.log("clearFile");
    	var ctrl = this, view = ctrl.view;

    	var inputFile = view.find("input.file")[0];
        inputFile.value = "";
        inputFile.type = '';
        inputFile.type = 'file';
	},

    checkTotalSize: function(addSize){
    	console.log("checkTotalSize");
    	var ctrl = this, view = ctrl.view;

    	var totalSize = (addSize == null) ? 0 : +addSize;
    	ctrl.view.find(".grid .data").each(function(){
    		totalSize += +this.data.size;
    	});

        var maxSize = ctrl.maxSize;
        if (totalSize > maxSize.MB) {
            warning("La capacidad máxima para adjuntar archivos es de " + maxSize.text + '.');
            ctrl.clearFile();
            view.find(".browse, .accept").removeClass("hidden");
            return false;
        }

        return totalSize;
    },

    addItem: function(json) {
        console.log("addItem");
    	var ctrl = this, view = ctrl.view;

        // Actualizar el label de tamaño total
        if (ctrl.updateTotalSize(json.size) == false) return;
		
		view.addClass("added");
        var $grid = view.find(".grid").show();

        $grid.append(
        '<div class="row data">' +
			'<div class="col-sm-8">'+ json.nombre +'</div>' +
			'<div class="col-sm-2">'+ round2Decimals(json.size) + ' MB</div>' +
			'<div class="col-sm-2 fa fa-trash-alt"></div>' +
		'</div>');
		var $last = $grid.find(".data:last");
		$last.find(".fa-trash-alt").on("click", function(){
			ctrl.delete(this);
		});
		$last[0].data = {
			name: json.nombre,
			size: json.size,
			tempName: json.tempName
		}
    },

    delete: function(ico){
    	console.log("delete");
    	var ctrl = this, view = ctrl.view;

    	popup({
    		body: "¿Desea eliminar el documento adjunto?", 
    		confirm: true,
    		confirmFn: function(){
    			// Delete temporal file
    			var $row = $(ico).parent();
    			var data = $row[0].data;
				var tempName = data.tempName;
				ctrl.deletedFiles.push(tempName);

				// Delete from grid
				$row.remove();

				ctrl.updateTotalSize();
				if (!view.find(".grid .row.data").length) {
					ctrl.reset();
				}
    		}
		});
    },

    reset: function() {
    	console.log("reset");
    	var ctrl = this, view = ctrl.view;
		
		// Clean grid
    	var $list = view.find(".grid .row.data").remove();

        // Clean input file
        ctrl.clearFile();

        // Hide sections
        view.removeClass("added");

        ctrl.deletedFiles.forEach(function(item) {
            ctrl.deleteFileTemp(item);
        });
        ctrl.deletedFiles = [];
        ctrl.counter = 0;        
    },

    deleteFileTemp: function(tempName) {
    	console.log("deleteFileTemp");
        if(tempName === true) return;
        setTimeout(function() {
        	var data = new FormData();
			data.append("filename", tempName);
			data.append("WebToken", localStorage.WebToken);
            var xhr = new XMLHttpRequest();
			xhr.open('POST', urlContent + 'ATL/DeleteFile', true);
			xhr.onload = function() {
				//var jsonResponse = JSON.parse(xhr.responseText).List;
				var x = 1;
			}
			xhr.send(data);
        }, 300);
    },

    updateTotalSize: function(size){
    	console.log("updateTotalSize");
    	var ctrl = this, view = ctrl.view;

    	var totalSize = ctrl.checkTotalSize(size);
        if (totalSize === false)
            return false;

        view.find('.totalSize .value').html(round2Decimals(totalSize));
        popup_resize();
        return true;
    }
}