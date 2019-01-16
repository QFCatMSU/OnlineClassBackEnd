smallImageHeight = 100;			// set the height of flex-sized images when small 
imageHeight = new Array();		// the heights of all flex-sized images in a page
imageWidth = new Array();		// the widths of all flex-sized images in a page
minImageWidth = 700;				// minimum width for a flexSize image in expanded mode
scrollTopPosition = 0; 			// value saved for links-return-links within a page
overflowCalled = false;   		// check to see if there is a current check of code lines

// D2L variables
redNum = -1;						// the number of the class 
instructorEmail = "Charlie Belinsky <belinsky@msu.edu>;";

// pre-onload functions
fixMathJaxEQs();	// Make all math equations default to inline mode (D2L issue)
addEqNumbering(); // 
addStyleSheet();  // can be done before page load since this is called in the [head]
	
// resize the iframe in the parent window when the page gets resized
window.parent.addEventListener("resize", function()
{
	/* When the parent page gets resized, it causes the content in the iframe to get resized.
		But, the iframe itself only resizes when the content inside the iframe changes (D2L bug).*/
	
	// the iframe's height is set to "auto" so we don't need to directly change its size.
	
	// get iframes from the parent windows:
	parentIFrames = window.parent.document.getElementsByTagName("iframe");
	if (parentIFrames[0] && parentIFrames[0].contentWindow.document.body)
	{
		// change to size of the document
		parentIFrames[0].height = parentIFrames[0].contentWindow.document.body.scrollHeight;
	}
	
	if(overflowCalled == false)
	{
		overflowCalled = true;
	}
	else
	{
		clearTimeout(overFlowTimer);
	}
	overFlowTimer = setTimeout(function() { overflowCodeLines(); }, 500);
});

// don't do anything until the parent frame (d2L) loads 
// this still seems to work if there is no parent -- probably should check for this, though
parent.window.onload = function()
{	
	encapObject = document.body;  	
	
	fixMathJaxEQs();
	fixIframeSize();

	// there should be no [div] elements in the page -- [div] can be copied/pasted in
	removeDivs();
	
	editURL = "";	
	
   // check if any meta content starts with "Joomla"
	if(document.querySelectorAll('meta[content^="Joomla"]').length > 0)  // we are in Joomla
	{
		// In Joomla, the article is in a div of class "container"
		containers = document.querySelectorAll("div.container"); 
		containers[0].style.backgroundColor = "#003c3c";
		containers[0].style.padding = "9px";

		// Joomla uses these itemprprops -- need a better way to check for Joomla...
		itemPropDiv = document.querySelectorAll("div[itemprop]");
		if(itemPropDiv.length == 1)
		{
			// the lesson is encapsulated in the div with the itemprop
			encapObject = itemPropDiv[0];	
			
			// create the editing URL
			// in Joomla it is: URL of page - last section + "?view=form&layout=edit&a_id=" + the page id
			theURL = window.location.href; 
			lastSlashIndex = theURL.lastIndexOf("/");
			editURL = theURL.substring(0, lastSlashIndex);
			pageID = theURL.substring((lastSlashIndex +1), theURL.indexOf("-"));
			editURL = editURL + "?view=form&layout=edit&a_id=" + pageID;
		}
		
		// will need to move this line to make it more general
		encapObject.style.backgroundColor = "rgb(0,60,60)";	
	}
	else if(window.location.hostname == "d2l.msu.edu")  // we are in D2L
	{
		oldURL = String(window.parent.location); 
		editURL = oldURL.split('?')[0];  // get rid of parameters (designated by "?")
		editURL = editURL.replace("viewContent", "contentFile"); // replace viewContent with contentFile
		editURL = editURL.replace("View", "EditFile?fm=0"); 	 	// replace View with EditFile?fm=0
					
		// remove the header in the D2L page
		p = parent.document.getElementsByClassName("d2l-page-header");
		for(i=0; i<p.length; i++)
		{
			p[i].style.display = "none";
		}
		
		p = parent.document.getElementsByClassName("d2l-page-collapsepane-container");
		for(i=0; i<p.length; i++)
		{
			p[i].style.display = "none";
		}
		
		p = parent.document.getElementsByClassName("d2l-page-main-padding");
		for(i=0; i<p.length; i++)
		{
			p[i].style.padding = "0";
		}

		if(self != top)
		{
			// create div at top of page and add the home page, previous, and next page
			divTop = document.createElement("div");
			divTop.classList.add("headerDiv");
			encapObject.prepend(divTop);
			
			// add home page link
			url = window.parent.location.href;
			classNum = url.match(/\/[0-9]{3,}\//); 
			redNum = classNum[0].substring(1, classNum[0].length-1); // get number of D2L class
			homePage = document.createElement("a");
			homePage.innerHTML = "Home";
			homePage.href = "https://d2l.msu.edu/d2l/home/" + redNum;
			homePage.target = "_parent";
			homePage.classList.add("lessonLink");
			homePage.classList.add("sameWin");
			homePage.classList.add("homePage");
			divTop.appendChild(homePage);
				
			// add previous link
			prevPage = encapObject.querySelectorAll(".previousLesson, .pl");
			if(prevPage[0])  // a prevPage object exists
			{
				text = prevPage[0].innerText;
				url = window.parent.document.getElementsByClassName("d2l-iterator-button-prev");
				newPrevPage = document.createElement("a");
				newPrevPage.innerHTML = "Previously: " + text;
				newPrevPage.href = url[0].href;
				newPrevPage.target = "_parent";
				newPrevPage.classList.add("lessonLink");
				newPrevPage.classList.add("sameWin");
				newPrevPage.classList.add("previousLesson");
				divTop.insertBefore(newPrevPage, homePage);
				prevPage[0].parentNode.removeChild(prevPage[0]);
			}
					
			// add next link
			nextPage = encapObject.querySelectorAll(".nextLesson, .nl");
			if(nextPage[0])  // a nextPage object exists
			{
				text = nextPage[0].innerText;
				url = window.parent.document.getElementsByClassName("d2l-iterator-button-next");
				newNextPage = document.createElement("a");
				newNextPage.innerHTML = "Up Next: " + text;
				newNextPage.href = url[0].href;
				newNextPage.target = "_parent";
				newNextPage.classList.add("lessonLink");
				newNextPage.classList.add("sameWin");
				newNextPage.classList.add("nextLesson");
				divTop.insertBefore(newNextPage, homePage);
				nextPage[0].parentNode.removeChild(nextPage[0]);
			}	
		}
		else
		{
			lessonLinks = encapObject.querySelectorAll(".previousLesson, .nextLesson, .nl, .pl");
			for(i=0; i<lessonLinks.length; i++)
			{
				lessonLinks[i].style.display = "none";
			}
		}
	}
		
	// add class names
	p = encapObject.getElementsByClassName("p");
	for(i=0; i<p.length; i++)
	{
		p[i].classList.add("partial");
	}

	nn = encapObject.getElementsByClassName("nn");
	for(i=0; i<nn.length; i++)
	{
		nn[i].classList.add("nonum");
		nn[i].classList.add("partial");
	}

	// set title on webpage -- the first H1 on the page
	titleObj = encapObject.querySelector("h1");
	
	if(titleObj)  // there is a title 
	{
		window.document.title = titleObj.textContent;
		
		// create printer icon 
		printLink = document.createElement('a');
		printLink.classList.add("sameWin");
		printLink.href = "javascript:window.print()";
		printLink.style.paddingLeft = "9px";
		printLink.innerHTML = "&#9113"; //"&#x1F5B6;";
	
		// add printer icon to title
		titleObj.appendChild(printLink);
	}
	else
	{
		window.document.title = "No Title";
	}
	
	// allow users to resize images from small to full-size
	createFlexImages();
	
	// adds the caption class to all H5 elements
	addCaption("H5");
	
	createEmailLink();
	
	equationNumbering();
		
	// structure the page with DIVs based on the headers 
	addDivs("H1");
	addDivs("H2");
	addDivs("H3");
	
	// add outline to the divs
	addOutline();
	
	// Create a right-click menu
	makeContextMenu("create");  // needs to happen after divs are created

	addReferences();
	// set up onclick functionality for "anchor" links (needed because page exists in an iframe)
	//createInPageLinks();
	
	// adds code tags to all content within an [h6] tag
	// need to add the divs before doing the code tags becuase this includes the div codeblocks
	addCodeTags("H6");
	
	overflowCodeLines();
	
	// convert "download" class to a download hyperlink (because D2L does not allow you to specify this trait)
	addDownloadLinks();	
	
	// check the URL to see if there is a request to go to a specific part of the page
	checkURLForPos();
	
	// target all hyperlinks to a new window
	linksToNewWindow();
}

/* removes all of the [div] elements in the page and move the content inside the [div]
   up one level */
function removeDivs()
{
	divElements = encapObject.getElementsByTagName("DIV");

	// the [div] length changes as [div] are removed -- we need to hold the initial number of [div]
	// initNumOfDivs = divElements.length;
	
	// Remove all the divs from the page but keep the content -- start with the last div
	//	to avoid recursion issues
	while(divElements.length > 0)  //for(i=0; i<initNumOfDivs; i++)   // could do while(divElement[0])
	{
		// divElements.length is decreased by one everytime a div is removed 
			
		// get information inside the div and save it to a temp variable
		divContent = divElements[divElements.length-1].innerHTML
		
		// copy the content of the [div] before the [div] 
		divElements[divElements.length-1].insertAdjacentHTML("beforebegin", divContent);
		
		// remove the [div]
		divElements[divElements.length-1].parentElement.removeChild(divElements[divElements.length-1]);
	}
}

/*
Find all images within the page that have the "flexSize" class
and add onclick events that give the user the ability to change 
the size of the image.  Called on page load.
*/
function createFlexImages()
{
	// find all images that have the class name "flexSize" or "fs"
	var flexImage = encapObject.querySelectorAll('img.flexSize, img.fs');

	// switch to while (there are flexImages)??
	for(i=0; i<flexImage.length; i++)	// for each flexSize element
	{
		// add an onclick event that calls changeSize() to each flexSize image
		flexImage[i].addEventListener("click", function()
												{ changeSize(this) }, false); 
		
		/*** the strange behavior of JS and for loops: final value of the loop  ****/
		
		flexImage[i].myIndex = i;  	// give every image a unique index value
		
		// store the values of the images natural width and height
		imageHeight[i] = flexImage[i].naturalHeight;
		imageWidth[i] = flexImage[i].naturalWidth;
		
		// initalize the flex image to the small size
		changeSize(flexImage[i], "minimize");
	}
}

/*
function called when a flexSize image is clicked --
changes the size of images between small and large

possible instruction values: minimize and maximize
*/
function changeSize(element, instruction="none")
{
	// get unique index of image
	imageIndex = element.myIndex;				
	
	// get the images natural width and height unsing the index
	origHeight = imageHeight[imageIndex];
	origWidth = imageWidth[imageIndex];
	
	// If image is in small sized mode and insruction is not "minimize"
	// The reason I do not put instruction == "minimize" has to do with minimize/maximize all call
	if(element.style.height == smallImageHeight + "px" && instruction != "minimize")
	{
		// get the width of the images parent element, which is a [figure]
		screenWidth = element.parentElement.clientWidth;
		
		// if the width is less than the min width, increase the width to the min width
		if(screenWidth < minImageWidth)
		{
			screenWidth = minImageWidth;
		}
		
		// if the natural width of the image is smaller than the screen width...
		if(origWidth <= screenWidth)
		{
			// set the image to its natural size
			element.style.width = origWidth + "px";
			element.style.height = origHeight + "px";
		}
		else  // image's natural width is larger than screen width
		{
			// set the image width to the screen width and scale the height
			element.style.width = screenWidth + "px";
			element.style.height = (screenWidth/origWidth)*origHeight + "px";
		}
	}
	else if (instruction != "maximize")
	{
		// set the images height to the smallHeight value and scale the with to match
		element.style.height = smallImageHeight + "px";	
		element.style.width = (smallImageHeight/origHeight)*origWidth + "px";
	}
}

/* uses the header structure of the page to create a visual style with div elements --
	user passes in the elementType they want to structure (H1, H2, and H3 are currently supported */ 
function addDivs(elementType)
{
	// find all element of the type asked for (H1, H2, and H3 currently supported)
	elements = encapObject.getElementsByTagName(elementType);
	
	// for each element
	for(i=0; i<elements.length; i++)
	{
		// create a temporary element at the same location of the Header element
		currentElement = elements[i];
		nextSibling = null;
	
		newDiv = document.createElement("div");	// create a new div
					
		// get title from element -- transfer to new div
		// use data-title instead of title because title will create a tooltip popup (which I don't want)
		if(elements[i].title != "")
		{
			newDiv.dataTitle = elements[i].title
		}
		else  // no title -- use text from header
		{
			newDiv.dataTitle = elements[i].innerText;
		}
		
		// insert the new div right before the Header element
		elements[i].parentNode.insertBefore(newDiv, elements[i]);
		/*
			Go from 
			<h2> Header title </H2>
				<p>more content</p>
				<p>more content</p>
				<p>more content</p>
			<h3>
			
			to
			
			<div class="">
				<h2> Header title </H2>
				<p>more content</p>
				<p>more content</p>
				<p>more content</p>
			</div>
			<h3>  -- this last element could also be <h2>, <div>, or end-of-page
		*/
		while(currentElement.nextElementSibling != null &&
				currentElement.nextElementSibling.tagName != "H1" &&
				currentElement.nextElementSibling.tagName != "H2" &&
				currentElement.nextElementSibling.tagName != "H3" &&
				currentElement.nextElementSibling.tagName != "DIV")
		{
			nextSibling = currentElement.nextElementSibling;	// get the next element
			newDiv.appendChild(currentElement);						// add current element to div
			currentElement = nextSibling;								// set current element to next element
		}	

		// add the page title class to the div with H1
		if(elementType == "H1")
		{	
			newDiv.classList.add("h1Div");
			//newDiv.classList.add("contentDiv");			// add a class name to the div
		}
		else if(elementType == "H2")
		{	
			// add the class "h2Div" to div with H2
			newDiv.classList.add("h2Div");
			newDiv.classList.add("contentDiv");			// add a class name to the div
			
			// add "nonlinear" class for div that contain non-linear content
			if((elements[i].className != "" ) &&
				(elements[i].classList.contains("trap") ||
				elements[i].classList.contains("extension") ||
				elements[i].classList.contains("shortcut")) )
			{
				newDiv.classList.add("nonlinear");
			}
		}
		else if(elementType == "H3")
		{	
			// add the class "h3Div" to div with "H3"
			newDiv.classList.add("h3Div");
			newDiv.classList.add("contentDiv");			// add a class name to the div
			
			// Check to see if the previous sibling (div with H2 or H3) has class "nonlinear"
			// if so -- then this div should also be class "nonlinear"
			if(newDiv.previousElementSibling.className != "" &&
				(newDiv.previousElementSibling.classList.contains("nonlinear") ))
			{
				newDiv.classList.add("nonlinear");
			}
		}	

		if(currentElement.nextElementSibling == null) // there is no next
		{
			newDiv.classList.add("h2NextDiv");	// should change at some point -- probably indicates an error
		}
		else if(currentElement.nextElementSibling.tagName == "H2" ||
				currentElement.nextElementSibling.tagName == "DIV" )
		{
			newDiv.classList.add("h2NextDiv");	// it is the end of a section
		}
		else if(currentElement.nextElementSibling.tagName == "H3")
		{
			newDiv.classList.add("h3NextDiv");	// it is the middle of a section
		}
		newDiv.appendChild(currentElement);	// add content to the new div
	}
}

// add outline to H2 and H3 elements
function addOutline()
{
	level1 = 0;
	level2 = 0;
	divElement = encapObject.getElementsByTagName("div");
	
	for(i=0; i<divElement.length; i++)
	{
		// find what the first element in the div is
		if(divElement[i].firstChild && divElement[i].firstChild.tagName == "H2")
		{
			level1++;			
			level2=0;
			divElement[i].firstChild.innerHTML = level1+" - " + divElement[i].firstChild.innerHTML;
			divElement[i].dataTitle = divElement[i].firstChild.textContent;
		}
		else if(divElement[i].firstChild && divElement[i].firstChild.tagName == "H3")
		{
			level2++;
			divElement[i].firstChild.innerHTML = level1+"."+level2+" - " + divElement[i].firstChild.innerHTML;
			divElement[i].dataTitle = divElement[i].firstChild.textContent;
			
			// find H4 elements within H3
			h4Elements = divElement[i].getElementsByTagName("H4");
			
			level3 = 0;
			for(j=0; j<h4Elements.length; j++)
			{
				level3++;
				h4Elements[j].innerHTML = level1+"."+level2+"."+level3+" - " + h4Elements[j].innerHTML;
				h4Elements[j].dataTitle = h4Elements[j].textContent;
			}
		}
	}
}

/* onclick call from right-click menu in page to either minimize or maximize (param)
	all the flex-sized images in the page */
function changeAllPicSize(param)
{
	var flexImage = encapObject.querySelectorAll('.flexSize, .fs');
	for(i=0; i<flexImage.length; i++)
	{
		/* calll changeSize passing each flexSize object in an array */
		changeSize(flexImage[i], param)
	}
}

/* Linkback function */
function goBackToPrevLocation()
{
	leftPos = window.parent.scrollX; 	// get the left position of the scroll
	// returnLink.style.display = "none";	// make the return link disappear
	if (navigator.userAgent.indexOf("Firefox") != -1)
	{
		encapObject.querySelector("menuitem[id='previousLocMenuItem']").disabled = "disabled";
	}
	else
	{
		encapObject.querySelector("a[id='previousLocMenuItem']").style.display = "none";
	}
	
	// scroll the page vertically to the position the page was
	// at when the link was originally clicked (stored as a global variable)
	window.parent.scrollTo(leftPos, scrollTopPosition);
	return false;	// so the page does not reload (don't ask why!)
}


	
	/* link to external CSS file 
		This is in the javascript because D2L will rewrite links in the HTML file */
function addStyleSheet()
{
	var CSSFile = document.createElement("link");
	scripts = document.getElementsByTagName("script");
	for(i=0; i<scripts.length; i++)
	{
		jsIndex = scripts[i].src.indexOf("module.js");
		if(jsIndex != -1) //scripts[i].src.includes("module.js"))
		{
			//cssFile = scripts[i].src.slice(0,-2) + "css"; -- old system, when on Github
			cssFile = scripts[i].src.substring(0,jsIndex) + "module.css";
		}
	}
	CSSFile.href = cssFile;	// location depends on platform
	CSSFile.type = "text/css";
	CSSFile.rel = "stylesheet";
	CSSFile.media = "screen,print";
	document.getElementsByTagName("head")[0].appendChild(CSSFile);
}

/* adds the class "caption" to all H5 lines */
function equationNumbering()
{
	// find all elements of elementType (initially it is H5)
	var equations = encapObject.getElementsByClassName("eqNum");
	
	for(i=0; i<equations.length; i++)
	{
		if(equations[i].tagName == "H5")
		{
			equations[i].innerHTML = equations[i].innerHTML + " ( " + (i+1) + " )";
		}
		else if(equations[i].innerText.trim() != "")  // there is text in the caption
		{
			equations[i].innerHTML = " ( " + (i+1) + " )";
		}	
	}
}

/* adds the class "caption" to all H5 lines */
function addCaption(elementType)
{
	// find all elements of elementType (initially it is H5)
	var captionLines = encapObject.getElementsByTagName(elementType);

	// this is deprecated in DreamWeaver
	for(i=0; i<captionLines.length; i++)
	{
		if(!(captionLines[i].classList.contains("eqNum")))
		{
			captionLines[i].classList.add("caption");	
		}
	}
	
	// In D2L, H5 was used to signify a caption;
	// In DW: the class .caption is an option
	captionLines = encapObject.getElementsByClassName("caption");
	for(i=0; i<captionLines.length; i++)
	{
		if(captionLines[i].innerText.trim() != "")  // there is text in the caption
		{
			captionLines[i].innerHTML = "Fig " + (i+1) + ": " + captionLines[i].innerHTML;
		}	
	}
}

/* add the tag: [code] to each line inside a [pre] block --
  the real trick is that there are multiple ways in which D2L will code a set of lines*/
function addCodeTags(elementType)
{
	/* this part works if we are using <h6> with class="code" */
	var codeLines = encapObject.getElementsByTagName(elementType);  
	//var codeLines = document.querySelectorAll(elementType);

	/* count the number of H6 tags
	   note: if you use codeLines.length in the for loop, the length will change
		as you add [h6] tags -- creating an infinite loop */
	numCodeTags = codeLines.length;

	// first go through [H6] elements and check for [br] tag -- switch to [H6]
	for(i=0; i<numCodeTags; i++)
	{
		// need to be very careful in for loops where the counted element is changing
		codeElement = codeLines[i];
				
		/* fix the situation where code lines are broken up by [br] --
			usually happens when code was copied/pasted into editor */
		if(codeLines[i].getElementsByTagName("br").length > 0)
		{ 
			// count how many lines of code there are, which is the number of <br> + 1
			numLines = codeLines[i].getElementsByTagName("br").length +1; // no break on last line

			var codeText = new Array();
			for(j=0; j<numLines; j++)
			{
				// copy all the lines of code into an array
				codeText[j] = codeLines[i].innerHTML.split("<br>")[j];
			}
			for(j=0; j<numLines; j++)
			{
				newElement = document.createElement(elementType);	// create an [H6] 
				newElement.innerHTML = codeText[j];					// insert line of code into [H6]
				if(j == 0)
				{
					newElement.title = codeLines[i].title;			// transfer title information to only the first element
					newElement.classList =  codeLines[i].classList; // transfer the class list to the first element
				}
				// add the new code line to the script
				codeElement.parentElement.insertBefore(newElement, codeElement);  
			}
			// remove all the original code lines
			codeElement.parentElement.removeChild(codeElement);	
			
			/********
			the number of code tags increased -- so codeLines[] has been updated to match
			*********/
			numCodeTags = codeLines.length;  // increase numCodeTags to the current codeline length
			i = i + numLines -1; // increase i by the number of codelines just added (don't need to check those)
		}
	}

	firstLine = true;

	// now, go through all H6 including new ones generated from above
	for(i=0; i<codeLines.length; i++)
	{
		// add "code" class to line
		codeLines[i].classList.add("code");

		// add two spaces at the beginning of each code line (to fit the curly brackets in)
	//	codeLines[i].innerHTML = "  " + codeLines[i].innerHTML;  // innerText was stripping [span]
		
		/* D2L-only fix: when code is copied and pasted in D2L, the class names can also be copy/pasted --
			removes erroneous class names */
		if(codeLines[i].classList.contains("firstLine"))
		{
			codeLines[i].classList.remove("firstLine")
		}
		if(codeLines[i].classList.contains("lastLine"))
		{
			codeLines[i].classList.remove("lastLine")
		}			
		
		if(firstLine == true)  // this is the first line of the code-block
		{
			// create a [div] for the code-block and give it class "codeBlock"
			codeBlockDiv = document.createElement("div");
			
			// check if the codelines or any of its children (D2L issue) has the class "partial"
			if(codeLines[i].classList.contains("partial")  || codeLines[i].querySelectorAll(".partial").length != 0)
			{
				codeBlockDiv.classList.add("partial");
			}		
			// check if the codelines or any of its children (D2L issue) has the class "nonum"
			if(codeLines[i].classList.contains("nonum")  || codeLines[i].querySelectorAll(".nonum").length != 0)
			{
				codeBlockDiv.classList.add("nonum");
			}		
			// check if the codelines or any of its children (D2L issue) has the class "text"
			if(codeLines[i].classList.contains("text") || codeLines[i].querySelectorAll(".text").length != 0) 
			{
				codeBlockDiv.classList.add("text");
			}					
			codeBlockDiv.classList.add("codeBlock");
			
			// when clicked, call the selectText function and pass the element
			codeBlockDiv.ondblclick = function(){ selectText(this) };
			
			// add the codeBock div as a parent to the codeLine
			codeLines[i].parentElement.insertBefore(codeBlockDiv, codeLines[i]);
			
			// check if this is a partial codeblock or a full codeblock
			if(codeBlockDiv.classList.contains("brackets"))
			{
				/**** added formatting to put in {} ************/
				// create a line that just has a start curly bracket ( { )
				startCodeLine = document.createElement(elementType);
				startCodeLine.innerText = "{";
				startCodeLine.classList.add("code");
				startCodeLine.classList.add("firstLine");
				codeBlockDiv.appendChild(startCodeLine);
				i++;  // another element was added so we need to increment the index
				/*****************************************/
			}
			else  
			{
				// make this codeLine the first line (deprecated with addition of {  } )
				codeLines[i].classList.add("firstLine");	
			}
			firstLine = false;
		}

		// add a space to empty lines -- when copying/pasting it can treat an empty line as not a line (deprecated somewhat)
		if(codeLines[i].innerText == "")
		{
			codeLines[i].innerText = " ";
		}	
					
		// check if the codeLine has a line number associated with it -- set the line number to it
		if( codeLines[i].title != "" && !isNaN(codeLines[i].title) )
		{
			codeLines[i].style.counterReset = "codeLines " + (codeLines[i].title -1);
		}
		
		//check if the next element after this codeLine is an [H6] -- if not than this is the last line
		if(codeLines[i].nextElementSibling == null || codeLines[i].nextElementSibling.tagName != elementType)
		{
			// check if this is a codeblock that needs curly brackets
			if(codeBlockDiv.classList.contains("brackets"))
			{
				codeBlockDiv.appendChild(codeLines[i]);
				/**** added formatting to put in curly brackets {} **********/
				// create a line that just has a start curly bracket ( { )
				lastCodeLine = document.createElement(elementType);
				lastCodeLine.innerText = "}";
				lastCodeLine.classList.add("code");
				lastCodeLine.classList.add("lastLine");
				codeBlockDiv.appendChild(lastCodeLine);
				i++;  // another element was added so we need to increment the index
				/*****************************************/
			}
			else
			{
				codeLines[i].classList.add("lastLine");
				codeBlockDiv.appendChild(codeLines[i]);
			}
			firstLine = true;
		}		
		else // this is not the last line of the codeblock
		{
			// add the code line to the codeblock */
			codeBlockDiv.appendChild(codeLines[i]);
		}
	}
}

function overflowCodeLines()
{
	// find all code elements (<p> with class = "code")
	/*** Tried to use encapObject but the bounded rectangle function did
		not work the second time -- don't know why ***/
	codeLines = document.getElementsByClassName("code");	
//	codeLines = encapObject.querySelectorAll(".code");	

	if(codeLines.length > 0)
	{
		// get original height of codelines -- only need to do this once in code (maybe? what if page is magnified?)
		elem = encapObject.querySelector('.code');
		style = getComputedStyle(elem);
		lineHeight = parseInt(style.lineHeight);

		// for each line of code in the page
		for(i=0; i<codeLines.length; i++)
		{
			// get the actual height the codeline 
			actualHeight = codeLines[i].getBoundingClientRect().height;  
			// find how many times bigger the actual height is compared to the original height
			lineHeightMult = Math.round(actualHeight/lineHeight);	
			// get the number of arrows attched to the line (last resize's multiple)
			numArrows = codeLines[i].querySelectorAll("span.overflowArrow");
			
			
			if(lineHeightMult != (numArrows.length +1)) 
			{
				// remove all current overflow arrow (later -- compare to multiplier)
				for(j=0; j<numArrows.length; j++)
				{
					codeLines[i].removeChild(numArrows[j]);
				}
				if(lineHeightMult > 1)	// if the codeline has length >1 (there is overflow)
				{
					for(j=1; j<lineHeightMult; j++)	// for each overflow line, add an arrow
					{
						arrowObj = document.createElement("span");  // create a new arrow object
						arrowObj.classList.add("overflowArrow");	// add overflowArrow class
						arrowObj.innerHTML = "&#x2937;";			// add arrow character
						
						// top position of arrow is top position of line offset by number of lines
						arrowObj.style.top = (codeLines[i].offsetTop + (j * lineHeight) )+  "px";
						arrowObj.style.left = (codeLines[i].offsetLeft + 80) + "px";
						codeLines[i].appendChild(arrowObj);	
					}
				}
			}		
		}
	}
	overFlowTimer = false;
}

/* Selects all text within the HTML element */
function selectText(element)
{
	var range = document.createRange();
	range.selectNode(element);
	window.getSelection().addRange(range);
}

function makeContextMenu(funct, param = null)
{	
	// for Firefox 
	if (navigator.userAgent.indexOf("Firefox") != -1)
	{
		// when the user clicks the right button, the rightClickMenu (create in this function) appears
		encapObject.setAttribute("contextmenu", "rightClickMenu");

		// creating a right-click context menu
		contextMenu = document.createElement("menu");
		contextMenu.type = "context";
		contextMenu.id = "rightClickMenu";

		// add a Go to Top button
		menuItem = document.createElement("menuitem");
		menuItem.label = "Go to Top of Page";
		menuItem.id = "topMenuItem";
		menuItem.onclick = function()
		{	
			window.parent.scrollTo(window.parent.scrollX, 0);
		};
		contextMenu.appendChild(menuItem);
		
		// add a Return to Previous location button
		menuItem = document.createElement("menuitem");
		menuItem.label = "Go to Previous Location";
		menuItem.id = "previousLocMenuItem";
		menuItem.onclick = 	function()
		{	
			goBackToPrevLocation();
			return false; 
		};
		contextMenu.appendChild(menuItem);
		
		// add a Print lesson button to the context menu
		menuItem = document.createElement("menuitem");
		menuItem.label = "Print";
		menuItem.onclick = function()
		{ 
			window.print(); 
		};
		contextMenu.appendChild(menuItem);

		// add a Maximize All (flexSize) Pics button to the context menu
		menuItem = document.createElement("menuitem");
		menuItem.label = "Maximize All Pictures...";
		menuItem.onclick = function(){ changeAllPicSize('maximize') };
		contextMenu.appendChild(menuItem);

		// add a Minimize All (flexSize) Pics button to the context menu
		menuItem = document.createElement("menuitem");
		menuItem.label = "Minimize All Pictures...";
		menuItem.onclick = function(){ changeAllPicSize('minimize') };
		contextMenu.appendChild(menuItem);

		// Add an Edit Page option if we are within a CMS environment
		roles = parent.document.querySelector("#RoleContainer"); 
		if(editURL != "" && roles && roles.innerHTML.includes("Editor"))
		{
			menuItem = document.createElement("menuitem");
			menuItem.label = "Edit Page";
			menuItem.onclick = function() { window.open(editURL, "_blank") };
			contextMenu.appendChild(menuItem);
		}

		// add an map of the lesson to the context menu
		submenu = document.createElement("menu");
		submenu.label = "Page Map";

		sectionsInPage = encapObject.querySelectorAll("h2,h3");
		for(i=0; i<sectionsInPage.length; i++)
		{
			mapItem = document.createElement("menuitem");
			mapItem.label = sectionsInPage[i].innerText;
			if(sectionsInPage[i].id == "")
			{
				sectionsInPage[i].id = "_sect" + i;
			}
			mapItem.onclick = scrollToElementReturn(sectionsInPage[i].id);
			submenu.appendChild(mapItem);		
		}

		contextMenu.appendChild(submenu);
		encapObject.appendChild(contextMenu);
		encapObject.querySelector("menuitem[id='previousLocMenuItem']").disabled = "disabled";

	}
	else // for all other browsers -- eventually would like to combine with above code
	{
		if(funct == "create")
		{
			var elemDiv = document.createElement('div');
			elemDiv.id = "rightClickDiv";
			elemDiv.classList.add("rcMenu");

			var menuItem10 = document.createElement('a');	
			menuItem10.href = "javascript: window.parent.scrollTo(window.parent.scrollX, 0);";
			menuItem10.id = "topMenuItem";
			menuItem10.innerHTML = "Go to Top of Page";
			menuItem10.style.display = "block";
			elemDiv.appendChild(menuItem10);
			
			var menuItem9 = document.createElement('a');	
			menuItem9.href = "javascript: goBackToPrevLocation()";
			menuItem9.id = "previousLocMenuItem";
			menuItem9.innerHTML = "Return to previous location";
			menuItem9.style.display = "none";
			elemDiv.appendChild(menuItem9);
			
			var menuItem7 = document.createElement('a');	
			menuItem7.href = "javascript:copySelectedText()"
			menuItem7.innerHTML = "Copy Selected Text";
			menuItem7.style.display = "block";
			elemDiv.appendChild(menuItem7);
			
			var menuItem8 = document.createElement('a');	
			menuItem8.href = "javascript:window.print()"
			menuItem8.innerHTML = "Print/ Save as PDF";
			menuItem8.style.display = "block";
			elemDiv.appendChild(menuItem8);

			roles = parent.document.querySelector("#RoleContainer"); 
			if(editURL != "" && roles && roles.innerHTML.includes("Editor"))
			{
				var menuItem4 = document.createElement('a');	
				oldURL = String(window.parent.location);  // otherwise you will edit the URL
				newURL = oldURL.replace("viewContent", "contentFile"); 
				newURL = newURL.replace("View", "EditFile?fm=0"); 
				menuItem4.href = newURL; //newURL;
				menuItem4.target = "_parent";
				menuItem4.innerHTML = "Edit Page";
				menuItem4.style.display = "block";
				elemDiv.appendChild(menuItem4);
			}
			
			var menuItem5 = document.createElement('a');	
			menuItem5.href = "javascript:changeAllPicSize('maximize')"
			menuItem5.innerHTML = "Maximize all pictures"
			menuItem5.style.display = "block";
			elemDiv.appendChild(menuItem5);
			
			var menuItem6 = document.createElement('a');	
			menuItem6.href = "javascript:changeAllPicSize('minimize')"
			menuItem6.innerHTML = "Minimize all pictures"
			menuItem6.style.display = "block";
			elemDiv.appendChild(menuItem6);
			
			// add an map of the lesson to the context menu
			menuItem7 = document.createElement("a");
			menuItem7.href = "";
			menuItem7.innerHTML = "Page Map";
			menuItem7.style.display = "block";

			elemDiv.appendChild(menuItem7);
		
			encapObject.appendChild(elemDiv);
			
			encapObject.oncontextmenu=function(event)
			{
				makeContextMenu('show', event); return false;
			}
			encapObject.onclick=function()
			{
				makeContextMenu('hide');
			}
		}
		else if(funct == "show")
		{
			document.getElementById("rightClickDiv").style.display = "block"; 
			document.getElementById("rightClickDiv").style.top = param.pageY + "px"; 
			document.getElementById("rightClickDiv").style.left = param.pageX + "px";			
		}
		else if(funct == "color")
		{
			encapObject.style.backgroundColor = param;
			funct = "hide";
		}
		if(funct == "hide")
		{
			document.getElementById("rightClickDiv").style.display = "none"; 	
		}
	}
}

function scrollToElementReturn(elementID)
{
	// this resolves the fact that variables are function scoped in JavaScript
	//   -- not block scoped
	return function() 
	{
		scrollToElement(elementID);	
	}
}
function copySelectedText()
{
	var text = "";
	if (window.getSelection)   // if there is something selected on the page
	{
		// works in all browsers except Firefox (current bug as of version 51)
		text = window.getSelection().toString();	// convert selected stuff to a string
		a = document.execCommand("copy");			// copy stuff to clipboard
	} 
}

function addDownloadLinks()
{
	downloadLinks = encapObject.getElementsByClassName("download");

	for(i=0; i<downloadLinks.length; i++)
	{
		// add the download property to all objects with class="download"
		downloadLinks[i].download = "";
	}
}

/* finds all section references in the page and add the correct numerical reference */
function addReferences()
{
	var references = encapObject.querySelectorAll(".sectRef, .figureRef, .eqRef, .linkTo");

	for(i=0; i<references.length; i++)
	{
		fullRefID = references[i].id;
		refID = fullRefID.slice(2);
	
		// check if the reference has no ID
		if(fullRefID == "")  
		{
			// right now, this situation is handled in editor.CSS
		}
		// no text associated with the reference
		else if (references[i].innerText.trim() == "")
		{
			// right now, this situation is handled in editor.CSS			
		}
		// check if ID has any invalid characters
		else if(isValid(refID) == false)
		{
			references[i].innerText = "***Invalid characters in ID***";
		}
		// check if first character in ID is a number
		else if(isNaN(refID[0]) == false)
		{
			references[i].innerText = "***Cannot start ID with number***";
		}
		// reference link does not exist
		else if(!(encapObject.querySelector("#" + refID)))
		{
			references[i].innerText = "***Invalid Link***";				
		}
		// there is no content at the link (not sure this is neccessary...)
		else if (encapObject.querySelector("#" + refID).innerText.trim() == "")
		{
			references[i].innerText = "***No content at link***";					
		}
		// ref ID is a valid element with content 		
		// if this is a section ref
		else if(references[i].classList.contains("sectRef")) 
		{
			// get first number from section ID (div)
			sectNum = parseInt(encapObject.querySelector("#" + refID).innerText);
			
			if(references[i].classList.contains("label"))
			{
				// add section num to the link
				references[i].innerText = references[i].innerText + " (Sect " + sectNum + ")";	
			}
			
			// create a link that scrolls to the section
			divID = "div" + String(sectNum).replace(".", "-");
			references[i].onclick = scrollToElementReturn(divID);
		}
		// if this is a equation ref
		else if(references[i].classList.contains("eqRef")) 
		{
			caption = encapObject.querySelector("#" + refID).innerText;

			/* find the last "(" in the line -- represents ( EQ# )
			   split the line right after the "("
				grab the number */
			eqRef = parseInt(caption.slice( (caption.lastIndexOf("("))+1 ));
			references[i].innerText = "Eq. " + eqRef;	

			// create a link that scrolls to the equation
			references[i].onclick = scrollToElementReturn(refID);
		}
		// if this is a figure ref
		else if(references[i].classList.contains("figureRef")) 
		{
			caption = encapObject.querySelector("#" + refID).innerText;
			strIndex = caption.indexOf(":");  // find the location of the first semicolon
			
			figRef = caption.slice(0, strIndex); // get "Fig. #"
			
			references[i].innerText = figRef;	
			
			// create a link that scrolls to the figure
			references[i].onclick = scrollToElementReturn(refID);
		}
		// this is an extensioin or trap link
		else if(references[i].classList.contains("linkTo")) 
		{
			// go to scrollToElement() function when the anchor is clicked
			references[i].onclick = scrollToElementReturn(refID);
		}
	}

	// new system for references
	var references = encapObject.querySelectorAll(".ref, .reference");
	for(i=0; i<references.length; i++)
	{
		fullRefID = references[i].id; // Get the ID for the reference
		refID = fullRefID.slice(2);	// remove the "r-" at the beginning of the ID
	
		// check if the reference has no ID
		if(fullRefID == "")  
		{
			// right now, this situation is handled in editor.CSS
		}
		// no text associated with the reference
		else if (references[i].innerText.trim() == "")
		{
			// right now, this situation is handled in editor.CSS			
		}
		// check if ID has any invalid characters
		else if(isValid(refID) == false)
		{
			references[i].classList.add("error");
			references[i].innerText = "**Invalid characters in ID: " + references[i].innerText + "** ";
		}
		// check if the ID starts with a number
		else if(isNaN(refID[0]) == false)
		{
			references[i].classList.add("error");
			references[i].innerText = "**Cannot start ID with number: " + references[i].innerText + "** ";
		}
		// this is a link to a different page
		else if(references[i].hasAttribute("href"))
		{
			// check to see if the href already has a "?" in it
			if(references[i].href.includes("?"))
			{
				references[i].href = references[i].href + "&ref=" + refID;
			}
			else
			{
				references[i].href = references[i].href + "?ref=" + refID;		
			}
		}
		// reference link does not exist
		else if(!(encapObject.querySelector("#" + refID)))
		{
			references[i].classList.add("error");
			references[i].innerText = "**Invalid Link: " + references[i].innerText + "** ";				
		}
		// there is no content at the link (not sure this is neccessary...)
		else if (encapObject.querySelector("#" + refID).innerText.trim() == "")
		{
			references[i].classList.add("error");
			references[i].innerText = "**No content at link: "  + references[i].innerText + "** ";					
		}
		// if this is a reference to an equation -- this handles the situation where H5 is used and not
		else if(encapObject.querySelector("#" + refID).classList.contains("eqNum")) 
		{
			caption = encapObject.querySelector("#" + refID).innerText;

			/* find the last "(" in the line -- represents ( EQ# )
			   split the line right after the "(" -- so you have EQ#) left
				grab the number from the split of section */
			eqRef = parseInt(caption.slice( (caption.lastIndexOf("("))+1 ));
			
			refIndex = references[i].innerText.indexOf("##");
			if(refIndex != -1)
			{
				str = references[i].innerText;
				var pos = str.lastIndexOf('##');
				references[i].innerText = str.substring(0,pos) + eqRef + str.substring(pos+2);
			}

			// make the reference linkable as long as the nolink class is not specified (not working yet...)
			if( !(references[i].classList.contains("nolink")) )
			{
				references[i].onclick = scrollToElementReturn(refID);
			}
		}
		// if this is a figure ref (has h5 tag and does not have eqNum class)
		else if(encapObject.querySelector("#" + refID).nodeName.toLowerCase() == "h5") 
		{
			caption = encapObject.querySelector("#" + refID).innerText;
			
			//figNum = parseInt(caption); // get the firsat number from the caption -- it is the figure number
			strIndex = caption.indexOf(":");  // find the location of the first semicolon
			
			figNum = caption.slice(4, strIndex); // get the # in "Fig #"
			
			refIndex = references[i].innerText.indexOf("##");
			if(refIndex != -1)
			{
				str = references[i].innerText;
				var pos = str.lastIndexOf('##');
				references[i].innerText = str.substring(0,pos) + figNum + str.substring(pos+2);
			}
			
			// make the reference linkable as long as the nolink class is not specified (not working yet...)
			if( !(references[i].classList.contains("nolink")) )
			{
				references[i].onclick = scrollToElementReturn(refID);
			}
		}
		// this links to a section header (h2-h4)
		else if(encapObject.querySelector("#" + refID).nodeName.toLowerCase() == "h2" ||
				  encapObject.querySelector("#" + refID).nodeName.toLowerCase() == "h3" ||
				  encapObject.querySelector("#" + refID).nodeName.toLowerCase() == "h4") 
		{
			// get first number from section ID (div)
		//	strIndex = encapObject.querySelector("#" + refID).innerText.indexOf("-");  // find the location of the first dash
		//	sectNum = encapObject.querySelector("#" + refID).innerText.slice(0, (strIndex-2));
			sectNum = parseFloat(encapObject.querySelector("#" + refID).innerText);
			
			refIndex = references[i].innerText.indexOf("##");
			if(refIndex != -1)
			{
				str = references[i].innerText;
				var pos = str.lastIndexOf('##');
				references[i].innerText = str.substring(0,pos) + sectNum + str.substring(pos+2);
			}
			
			// make the reference linkable as long as the nolink class is not specified (not working yet...)
			if( !(references[i].classList.contains("nolink")) )
			{
				references[i].onclick = scrollToElementReturn(refID);
			}
		}
		// for all other elements in the page
		else 
		{
			refObject = encapObject.querySelector("#" + refID);
			parentObj = refObject.parentNode.nodeName.toLowerCase();
			refNum = -1;
			
			/* make sure to check for parent */
			if(parentObj && parentObj == "h5")
			{
				strIndex = caption.indexOf(":");  // find the location of the first semicolon
				refNum = parentObj.innerText.slice(0, strIndex);
			}
			else if(parentObj && parentObj.firstElementChild &&
					  parentObj == "div" && (parentObj.firstElementChild.nodeName.toLowerCase() == "h2" ||
													 parentObj.firstElementChild.nodeName.toLowerCase() == "h3" ||
													 parentObj.firstElementChild.nodeName.toLowerCase() == "h4"))
			{
				strIndex = caption.indexOf("-");  // find the location of the first dash
				refNum = parentObj.firstElementChild.innerText.slice(0, (strIndex-2));
				// refNum = parseFloat(parentObj.firstElementChild.innerText);
			}
			else if(parentObj.parentNode)
			{
				grandParent = parentObj.parentNode.nodeName.toLowerCase();
				if(grandParent == "div" && (grandParent.firstElementChild.nodeName.toLowerCase() == "h2" ||
													 grandParent.firstElementChild.nodeName.toLowerCase() == "h3" ||
													 grandParent.firstElementChild.nodeName.toLowerCase() == "h4"))
				{
					strIndex = caption.indexOf("-");  // find the location of the first dash
					refNum = parentObj.firstElementChild.innerText.slice(0, (strIndex-2));
				}
			}

			if(refNum != -1)
			{
				str = references[i].innerText;
				var pos = str.lastIndexOf('##');
				references[i].innerText = str.substring(0,pos) + eqRef + str.substring(pos+2);
			}
			
			// make the reference linkable as long as the nolink class is not specified (not working yet...)
			if( !(references[i].classList.contains("nolink")) )
			{
				references[i].onclick = scrollToElementReturn(refID);
			}
		}
	}
}

function checkURLForPos()
{
	// In D2L, the page is inside an iframe -- so need to check the parent
	var urlString = parent.window.location.href;
	var url = new URL(urlString);
	var ref = url.searchParams.get("ref");
	
	if(ref != null)
	{
		scrollToElement(ref);
	}
}

function scrollToElement(elementID)
{		
	var element = encapObject.querySelector("#" + elementID);  
	var bounding = element.getBoundingClientRect();	// gives the square location of the element
	var elementTop = bounding.top;			// top position of element in pixels
	var elementBottom = bounding.bottom;	// bottom position of the element in pixels
	var iframeOffset = 0; 						// default value if the iframe is not found 
	var scrollTop = 0;							// default value if the page is not scrolled
	var windowHeight = window.parent.innerHeight;	// height of the webpage with the lesson
	var windowScroll = window.parent.scrollY; 	// amount window has been scrolled
	
	// check if the lesson is in an iframe
	if (window.self !== window.top)  // we are in an iframe
	{
		// get iframes from the parent windows:
		parentIFrames = window.parent.document.getElementsByTagName("iframe");
			
		// go through iframe to find which has the same source as this lesson  
		// (i.e., the iframe that contains this page)
		for(i=0; i<parentIFrames.length; i++)	// most likely there is only one iframe!
		{
			if (window.location.href == parentIFrames[i].src) // this is the iframe that conatins the lesson
			{
				// get the distance between the top of this iFrame at the top of the parent window
				iframeOffset = parentIFrames[i].offsetTop; 
				break;  // don't need to check any more iframes
			}
		}
	}
	
	// calc the vertical position of the linkTo element in the parent page
	elementYPos = element.offsetParent.offsetTop + element.offsetTop + iframeOffset;
	
	// if the element is already in the screen, don't bother scrolling
	if(elementYPos < windowScroll || elementYPos >  (windowScroll+windowHeight) )
	{
		// add some padding so the object does not appear right at the top of the page
		if(element.classList.contains("caption"))
		{
			offsetPadding = 200;	// add more padding if this is an image
		}
		else
		{
			offsetPadding = 50;
		}
		
		// save the current value of the scroll position so we can return to this spot
		scrollTopPosition = windowScroll;  

		// scroll the parent to the vertical position of the linkTo element
		window.parent.scrollTo(element.offsetLeft, (elementYPos -offsetPadding) );	
	}
	
	// highlight the linked object for 2 seconds (2000 milliseconds)
	currentStyle = element.style.backgroundColor;
	element.style.backgroundColor = "yellow";
	setTimeout(function(){element.style.backgroundColor = currentStyle;}, 2000);
		
	// change the right-click menu to show the return link
	if (navigator.userAgent.indexOf("Firefox") != -1)
	{
		encapObject.querySelector("menuitem[id='previousLocMenuItem']").disabled = false;
	}
	else
	{
		encapObject.querySelector("a[id='previousLocMenuItem']").style.display = "block";
	}
}

function linksToNewWindow()
{
	links = encapObject.querySelectorAll('a[href]');
	
	for(i=0; i<links.length; i++)
	{
		if(links[i].href.trim() != "" && !(links[i].classList.contains("sameWin")) &&
			!(links[i].classList.contains("download")) && 
			(links[i].target == "_self" || !(links[i].target)))
		{
			links[i].target = "_blank";
		}
	}
}

function fixMathJaxEQs()
{
	// change the display type of all math objects so they all display in the same way (this is a D2L issue)
	// this works if it happens before mathjax javascript is executed 
	var m = document.querySelectorAll('math[display="block"]');
	
	for(i=0; i<m.length; i++)
	{
		m[i].setAttribute("display", "inline");
	}
	
	// this works if it happens after mathjax javascript is executed 
	mathSpan = document.querySelectorAll("span.MathJax_Preview");
	//mathDis = document.querySelectorAll(".MathJax_Display");
	//mathPro = document.querySelectorAll(".MathJax_Processing");
	//mathPro2 = document.querySelectorAll(".MathJax_Processed");
	
	for(i=0; i<mathSpan.length; i++)
	{
		if (mathSpan[i].nextElementSibling.nodeName == "DIV")
		{
			mathSpan[i].nextElementSibling.removeAttribute("style");				
			mathSpan[i].nextElementSibling.removeAttribute("class");
			mathSpan[i].nextElementSibling.style.display = "inline";
		}
	}
	// MathJax/IE bug where annotation take up space but are not displayed
	if(window.navigator.userAgent.indexOf("Edge ") > -1 || 
		window.navigator.userAgent.indexOf("MSIE "))
	{
		mathObj = document.getElementsByClassName("MJX_Assistive_MathML");
		for(i=0; i<mathObj.length; i++)
		{
			mathObj[i].style.cssText += ";display: none !important;";
		}
	}
	
	// fix equations so that limits to summations are put above and below the summation (as opposed to on the side)
	// find all mstyle elements that have an munderover element as a direct child
	// this will give you the munder and munderover objects -- we want to modify the mstyle parent
	var m1 =  document.querySelectorAll("mstyle>munder, mstyle>munderover");
	
	// go through each munder and munderover element
	for(i=0; i<m1.length; i++)
	{
		// parent is mstyle -- checking if it has the attricute "displaystyle"
		if(!(m1[i].parentNode.hasAttribute("displaystyle")))
		{	
			m1[i].setAttribute("displaystyle", "true");
		}
	}
}

function createEmailLink()
{
	emailLink = encapObject.getElementsByClassName("email");
	
	for(i=0; i<emailLink.length; i++)
	{
		emailLink[i].style.textDecoration = "none";
		emailLink[i].onclick = function() {openEmailWindow();};
		emailLink[i].onmouseover = function() {this.style.textDecoration = "underline";};
		emailLink[i].onmouseout = function() {this.style.textDecoration = "none";};
	}
}
function openEmailWindow()
{
	emailWindow = window.open("https://d2l.msu.edu/d2l/le/email/" + redNum + "/ComposePopup");
	  
  emailWindow.onload = function() 
					{		
						header = emailWindow.document.body.querySelector(".vui-heading-1");
						header.innerText = "Send Message to Instructor";
							
						addressControl = emailWindow.document.getElementById("ToAddresses$control");
						addressControl.click();
						address = emailWindow.document.getElementById("ToAddresses");
						address.focus(); 
						address.value = instructorEmail;
						subject = emailWindow.document.getElementById("Subject");
						subject.value = window.document.title;
					};
}
function fixIframeSize()
{
	iFrame = window.parent.document.getElementsByClassName("d2l-iframe");
	if (iFrame[0])
	{
		iFrame[0].style.height = document.documentElement.scrollHeight + "px";
		setTimeout( function(){iFrame[0].style.height = document.documentElement.scrollHeight + "px";}, 9000);
	}
}

function isValid(str)
{
	return !/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/g.test(str);
}

function addEqNumbering()
{
	mathEqs = document.querySelectorAll(".equation[id]");
}
	
/* takes
<p><img src="ImgSrc"></p>
<p class="caption">Caption text </p>

and converts it to

<figure>
	<img src="ImgSrc">
	<figCaption">Caption text </figCaption>
</figure>
UNUSED function -- too many complications in implementation!
function captionImages()
{
	// get all the images in the page (can later expand to tables, code-blocks...)
	var imagesInPage = encapObject.getElementsByTagName("img");
	
	/* should have this in D2L:
		[p]      <-- parent of image
		  [img]  <-- looking at images
		[/p]
		[p class="caption]	   <-- nextElementSibling of parent with caption
		[/p]
		
		and converting it to this:
		[p]
		   [figure]
		     [img]
			  [figcaption]  <-- old caption with "Fig. #:" appended
		   [/figure]
		[/p]
	
	for(i=0; i<imagesInPage.length; i++)
	{	
		// trying to find the paragraph [p] parent of the image --
		// the problem is that there might be [b], [i], or [span] ancestors in the way
		parElement = imagesInPage[i].parentElement;

		while(parElement && parElement.tagName != "P")
		{
			parElement = parElement.parentElement;
		}
		
		/*** Add error onscreen if parent [p] not found?? ***
		// first make sure that we actally got an element and not end-of-page
		if(parElement)  
		{
			/* need to find a class="caption" element in the next element sibling's descendants
			   again, same issue as before where you should have
			      [p class="caption"] 
					but could have
					[p][span][b][i][span class="caption"]    
					
			if(parElement.nextElementSibling)  // if there is a next sibling
			{
				capElement = parElement.nextElementSibling;  // go to the next sibling (likely a [p])
			
				while(capElement.childElementCount != 0 && !(capElement.classList.contains("caption")))
				{
					capElement = capElement.childNodes[0];
				}

				/*** Add error onscreen if caption not found?? **
				// make sure we found an element with class = "caption"
				if(capElement.classList.contains("caption"))
				{
					figure = document.createElement("figure");			// create a [figure] element
					figCaption = document.createElement("figCaption");	// create a [figcaption] element
					
					// copy caption in [figcaption] element and preprend with the figure number
					figCaption.innerHTML = capElement.innerText;	
					figCaption.classList.add("caption");					// add caption class to [figCaption]
					figure.appendChild(imagesInPage[i]);					// add image to [figure]
					figure.appendChild(figCaption);							// add [figcaption] to [figure]
					
					// remove the original caption
					capElement.parentElement.removeChild(capElement);
					
					// add figure to parent of image
					parElement.appendChild(figure);
				}
			}
		}
	}
}
*/
	