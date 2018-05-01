function createHeader()
{
	document.body.innerHTML += "Sdfsdaf";
	newDiv = document.createElement("div");
	newDiv.innerHTML = "sdfsadfsaf";
	newDiv.style.top = 0;
	newDiv.style.left = 0;
	newDiv.style.width = "500px";
	newDiv.style.height = "300px";
	newDiv.style.position = "absolute";
	newDiv.style.backgroundColor = "red";
	document.body.appendChild(newDiv);
	/*	alert(3);
	xmlhttp=new XMLHttpRequest();
	xmlhttp.open("GET","header.xml",true);
	xmlhttp.timeout = 2000; // time in milliseconds
	
	xmlhttp.onload = function()
	{
		alert(1);
		var xmlDoc = this.responseXML;
	};
	
	xmlhttp.ontimeout = function (e) {
	  alert(2);// XMLHttpRequest timed out. Do something here.
	};*/
}