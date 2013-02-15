var hasLoggedIn = false;

function refreshFiles(readycallback) {
	if (!hasLoggedIn) return false;
	api_req([{
		a: 'f',
		c: 1
	}], {
		start_ul: false,
		callback: function (json, res) {
			json = json[0];
			maxaction = json.sn;
			var callback = new Object;
			if (json.cr) callback.cr = json.cr;
			if (json.sr) callback.sr = json.sr;
			callback.fn = function (cb) {
				if (cb.cr) crypto_procmcr(cb.cr);
				if (cb.sr) crypto_procsr(cb.sr);
				getsc();
				ul_completepending();
				crypto_share_rsa2aes();
				crypto_sendrsa2aes();
			}
			cFileList[cFileIndex] = new Object;
			cFileList[cFileIndex].f = json.f;
			process_f(cFileIndex, false, callback);
			if (currentdirid === undefined) currentdirid = cRootFolder;
			cFileIndex++;
			if (readycallback) {
				console.log("File System Refreshed!");
				readycallback(cFileIndex - 1);
			}
		}
	});
}

function createfolder(parentId, name, afterCallBack) {
	var attrs = {
		n: name
	};
	var mkat = enc_attr(attrs, []);
	var req = {
		a: 'p',
		t: parentId,
		n: [{
			h: 'xxxxxxxx',
			t: 1,
			a: ab_to_base64(mkat[0]),
			k: a32_to_base64(encrypt_key(u_k_aes, mkat[1]))
		}],
		i: requesti
	};
	api_req([req], {
		ulparams: false,
		callback: function (json, params) {
			cFileList[cFileIndex] = new Object;
			cFileList[cFileIndex].f = json[0].f;
			process_f(cFileIndex, true, {
				fn: function () {}
			});
			cFileIndex++;
			if (afterCallBack) afterCallBack();
		}
	});
}

function OnFilesReady() {
	var cont = document.getElementById("fileTable");
	cont.innerHTML = "<tr><th>Filename</th><th>File Id</th><th>Action</th><th>Delete File</th></tr>";
	for (var i = 0; i < cFileList[cFileIndex - 1].f.length; i++) {
		var tempFile = cFileList[cFileIndex - 1].f[i];

		if (tempFile.p == currentdirid && tempFile.name !== undefined && tempFile.name != "") {
			if (tempFile.t == 1) {
				console.log("Loaded Folder: " + tempFile.name);
				cont.innerHTML += "<tr class='fTr'><td>" + tempFile.name + "</td><td>" + tempFile.h + "</td><td><button onclick='openFolderIndex(" + i + ")'>Browse</button></td><td><button onclick='deleteFile(\"" + tempFile.h + "\")'>Delete</button></td></tr>";
			} else if (tempFile.t == 0) {
				console.log("Loaded File: " + tempFile.name);
				cont.innerHTML += "<tr class='fTr'><td>" + tempFile.name + "</td><td>" + tempFile.h + "</td><td><button onclick='downloadIndex(" + i + ")'>Download</button></td><td><button onclick='deleteFile(\"" + tempFile.h + "\")'>Delete</button></td></tr>";
			}
		}
	}
}

function OnFolderCreate() {
	console.log("New Folder Created!");
	setTimeout(function(){refreshMain();},500);
}

function backToRoot() {
	currentdirid = cRootFolder;
	setTimeout(function(){refreshMain();},500);
}

function openFolderIndex(ind) {
	currentdirid = cFileList[cFileList.length - 1].f[ind].h;
	setTimeout(function(){refreshMain();},500);
}

function addFolder(name, parent) {
	if (!hasLoggedIn) return false;
	createfolder(parent || currentdirid, name, OnFolderCreate);
}

function refreshMain() {
	if (!hasLoggedIn) return false;
	refreshFiles(OnFilesReady);
}
var loginMonitor = {
	checkloginresult: function (ctx, r) {
		if (r == EBLOCKED) {
			console.log("Account Suspended");
			hasLoggedIn = false;
		} else if (r) {
			u_type = r;
			console.log("Login Success");
			hasLoggedIn = true;
			closePrompt();
			refreshMain();
		} else {
			console.log("Login Failed");
			hasLoggedIn = false;
			alert('Invalid Username / Password');
		}
	}
};

function mainLogin(username, password, remember) {
	return cLogin(loginMonitor, username, password, remember);
}

function cLogin(Callback, username, password, remember) {
	username = username.toLowerCase();
	var passwordaes = new sjcl.cipher.aes(prepare_key_pw(password));
	var uh = stringhash(username, passwordaes);
	return u_login(Callback, username, password, uh, remember || false);
}

/*
Start Upload Functions
*/

function fileSelected(e) {
	FileSelectHandler(e);
}

function onUploadStart(id) {
	ul_queue[id]['starttime'] = new Date().getTime();
	runProgress("File Upload", "Uploading File: " + name, "Upload Progress");
}



function onUploadSuccess(id, handle, key) {
	console.log("File Upload Success!");
	closePrompt();
	setTimeout(function(){refreshMain();},500);
}

function onUploadProgress(fileid, bytesloaded, bytestotal) {
	var eltime = (new Date().getTime() - ul_queue[fileid]['starttime']) / 1000;
	var bps = Math.round(bytesloaded / eltime);
	var retime = (bytestotal - bytesloaded) / bps;

	document.getElementById("cfProgress").value = Math.floor(bytesloaded / bytestotal * 100);

}


function onUploadError(fileid, error) {
	console.log("FILE " + fileid + " - ERROR: " + error);
}

/*
File Download Functions Below
*/
function downloadIndex(arrayInd) {
	var disFiles = cFileList[cFileList.length - 1].f;
	if (disFiles[arrayInd].s == -1) {
		console.log("Tried to Download Folder");
		return;
	}
	runDownload(disFiles[arrayInd].h, disFiles[arrayInd].key, disFiles[arrayInd].name);
}

function runDownload(fileid, filekey, filename) {
	dl_queue.push({
		id: fileid,
		key: filekey,
		n: filename,
		onDownloadProgress: cDlProgress,
		onDownloadComplete: cDlComplete,
		onBeforeDownloadComplete: cDlAlmost,
		onDownloadError: cDlError,
		onDownloadStart: cDlStart
	});
	startdownload();
}

function cDlStart(id, name, filesize) {
	console.log('OnDownloadStart ' + id);
	dl_queue[dl_queue_num].starttime = new Date().getTime();
	runProgress("File Download", "Downloading File: " + name, "Download Progress");
}

function cDlError(id, error) {
	console.log("Error: " + error + "\nDownloading File: " + id);
}

function cDlProgress(fileid, bytesloaded, bytestotal) {
	var eltime = (new Date().getTime() - dl_queue[dl_queue_num].starttime) / 1000;
	var bps = Math.round(bytesloaded / eltime);
	var retime = (bytestotal - bytesloaded) / bps;
	document.getElementById("cfProgress").value = Math.floor(bytesloaded / bytestotal * 100);
}

function cDlAlmost() {
	console.log("Almost Done!");
}

function cDlComplete(id) {
	console.log("Done Downloading File: " + id);
	closePrompt();
}

function makeFolderUI() {
	if (document.getElementById("newFolderName").value.length < 2) {
		console.log("bad folder name" + document.getElementById("newFolderName").value);
		return;
	}
	addFolder(document.getElementById("newFolderName").value);
}