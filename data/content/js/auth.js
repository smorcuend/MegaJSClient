
function loginUI() {
	if ((document.getElementById('login_email').value == '')) {
		alert("Error: Bad Username/Password!");
	} else {

		mainLogin(document.getElementById('login_email').value.toLowerCase(), document.getElementById('login_password').value);
	}
}

function runPrompt(title, inhtml) {
	document.getElementById("cftitleBar").innerHTML = title;
	document.getElementById("promptBody").innerHTML = inhtml;
	document.getElementById("hideClear").style.display = "block";
	document.getElementById("cfPrompt").style.display = "block";
}

function closePrompt() {
	document.getElementById("hideClear").style.display = "none";
	document.getElementById("cfPrompt").style.display = "none";
}

function runProgress(title, subtitle, progLabel) {
	runPrompt(title, '<h2>' + subtitle + '</h2> <span style="position:absolute;left:20px;;bottom:10px"> <span id="progLabel">' + progLabel + '</span><br /> <progress max="100" value="0" id="cfProgress"> <strong>Progress: 0% done.</strong> </progress> </span>');
}
runPrompt("Login", '<h2>Login to Mega:</h2> <br /> <input id="login_email" type="text" value="Email Address" onfocus="this.value=(this.value==\'Email Address\') ? \'\' : this.value;" onblur="this.value=(this.value==\'\') ? \'Email Address\' : this.value;"> <br /> <input id="login_password" type="password" value="Password" onfocus="this.value=(this.value==\'Password\') ? \'\' : this.value;" onblur="this.value=(this.value==\'\') ? \'Password\' : this.value;"> <br /> <button style="font-size:28px" onclick="loginUI()">Login</button>');
document.getElementById("fileselect1").addEventListener("change", FileSelectHandler, false);