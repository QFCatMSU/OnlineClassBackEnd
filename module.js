/* New Issues (May 2017) 
- replacing images in D2L causes D2L to get stuck in a loop
  -- need to delte image first and then add new image (replace does not work)
- make sure module.css is completely independent of editor.css (rename to D2L editor.css?)

/* Recent Fixes (April 2017)
- made H5 the caption style (still can add "caption" as a class))
- switch code block from <addr> to <h6>
  - D2L allows <addr> to be embedded within <addr> (which is a problem!) but does not allow this with <h6>
- switch div titles to data-titles to stop tooltip pop-ups
- Use titles in codeLines to allow for cutomized line numbers (can start with a value other than 1)
- MAC color scheme direction added
- iframe can access parent window (and control it)
- href="#" switched to onclick="scrollTo..."
- iframe in D2L resizes vertically when material changes vertical size
- figure references that are blank are ignored
- when you copy/paste a block of code from the website, D2L will include the generated <div id="codeBlock">
  causing lots of formatting issues
  Solution: remove all div from the webpage initially and copy the content of the div to the same location
- when you copy/paste a block of code from the website, D2L will include the generated class <h6 class="codeBlock firstLine">

Still needed :
- formula do not work in sandbox in Chrome (work in FireFox)
- pagemap for all browsers
- right-click not working -- working (changed function name)
- click-out issue -- gone away??
- print full sized picture (Firefox only) -- seems to only be a Firefox/our HP printer issue
- changing links to pics/files that get renamed
- switch all figure links to titles instead on fig-[id] -- working, not fully switched
- create a console log ***
- have jumplinks use title instead of link-[id] -- working, not fully switched

*/

/* Issues:
- An image without a caption will not be put inside a [figure]
  -- not sure this is the way it should be...
  
- some pages in D2L end with: ?ou=457124 (where 457124 is the class number)-- this is redundant info and 
  causes problem when clicking to edit to page.  
  - have right-click split the url at the "?"
  
- page now looks for itself in an iframe to find its offset in the parent page

- can now handle if we are in an iframe (D2L) or not 
  - MUCH better for sandboxing code

- code was only fixing the first script set that used [br] 
  - issue: number of codelines changes when the first was fixed -- needed to update for loop to reflect that.
  
- you can make a relative link to the file for a class but not the content.  
	The difference is that, when you link the file, the file will load in the 
	iframe but the rest of the page will still reflect the original content.  
	So, hyperlinks to the content will break if taken out of context.

- hideEmptyTables needs to check both the primary and secondary pages for content -- 
	right now it is just checking primary (I think - not tested)

- change [pre] in code only if it does not have its own class already

- copy/paste puts [br] in text -- make that into code?

- instructors still have to put in hash tag hyperlinks in HTML
  -- set an ID and do in JS
  
- change absolute links in D2L back to relative links

- D2L autogenerates figcaptions
  -- set a class called caption and change in JavaScript
  
- Copying code within code causes nested [address]
  -- color it red in editor to give warning
  -- later: switched to H6 (does not have nesting issue)
 
- Nothing asking if user should save changes when exiting page

- Cannot set style to multiple block objects -- will set to parent object 

- blank address lines are not counted in editor or browsers
  -- browser: Javascript add space
  -- editor: add min-height

- copy code from outside source puts in <br>

- If you try to include this JavaScript file in D2L using the correct relative link: 
   ../../Programming/module.js
	D2L will modify the link to the incorrect absolute link:
	https://d2l.msu.edu/content/DEVELOPMENT/2016/courses/DEV-belinsky-2016-TestRClass/R/Lessons/../../../../Programming/module.js
	
	To make it work in D2L with sa relative link you would need to use: Programming/module.js
	but, this is an incorrect relative link and would not work outside of D2L
	
	To fix the issue, I put JavaScript code that adds a JavaScript file in the <head> of all lessons
	<script>
		var scriptFile = document.createElement('script');
		scriptFile.src = "../../Programming/module.js";
		document.getElementsByTagName('head')[0].appendChild(scriptFile);
	</script>
*/
// remove display="block" from <math> objects -- only Latex equations
if(document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)) 
{
  callback();
} 
else 
{
  document.addEventListener("DOMContentLoaded", callback);
}

function callback()
{
	m = document.getElementsByTagName("math");
	for(i=0; i<m.length; i++)
	{
		m[i].setAttribute("display", "inline");
	}
}

smallImageHeight = 100;			// set the height of flex-sized images when small 
imageHeight = new Array();		// the heights of all flex-sized images in a page
imageWidth = new Array();		// the widths of all flex-sized images in a page
minImageWidth = 700;				// minimum width for a flexSize image in expanded mode
scrollTopPosition = 0; 			// value saved for links-return-links within a page
returnLink = null;				// element on page that contains the return link
overflowCalled = false;   		// check to see if there is a current check of code lines


addStyleSheet();  // can be done before page load since this is called in the [head]
	
// resize the iframe in the parent window when the page gets resized
window.parent.addEventListener("resize", function()
{
	/* When the parent page gets resized, it causes the content in the iframe to get resized.
		But, the iframe itself only resizes when the content inside the iframe changes (D2L bug).*/
	
	// the iframe's height is set to "auto" so we don't need to directly change its size.
	
	// get iframes from the parent windows:
	parentIFrames = window.parent.document.getElementsByTagName("iframe");
	if (parentIFrames[0])
	{
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
	editURL = "";

	
		// check if we are in Joomla or D2L
	
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
		editURL = editURL.replace("View", "EditFile?fm=0"); 	// replace View with EditFile?fm=0
					
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
			
			titleObj = encapObject.querySelector("#title");
			
			if(titleObj)
			{
				encapObject.insertBefore(homePage, titleObj);
			}
			
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
				encapObject.insertBefore(newPrevPage, homePage);
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
				encapObject.insertBefore(newNextPage, homePage);
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

	// add class name
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
	
	// set title on webpage
	titleObj = encapObject.querySelector("#title");
	window.document.title = titleObj.textContent;
	
	// add printer icon to title
	printLink = document.createElement('a');
	printLink.classList.add("sameWin");
	printLink.href = "javascript:window.print()";
	printLink.style.paddingLeft = "9px";
	printLink.innerHTML = "&#x1F5B6;";
	titleObj.appendChild(printLink);
	
	// there should be no [div] elements in the page -- [div] can be copied/pasted in
	removeDivs();
	
	// a link used everytime the person jumps in the page to return them to the original spot
	createReturnLink(); 
	
	// allow users to resize images from small to full-size
	createFlexImages();
	
	/* editModeStyles(); -- was trying to hide objects in editor but D2L editor does not look at JavaScript */
	
	// adds the caption class to all H5 elements
	addCaption("H5");
	
	equationNumbering();
	
	// find all references to figures in the webpage and add correct figure number
	figureReferences();	
	eqReferences();
	// associate captions and images using accessibility standards (took out because too many issues with D2L's editor)
	// captionImages();
	
	// structure the page with DIVs based on the headers 
	addDivs("H1");
	addDivs("H2");
	addDivs("H3");
	
	// add outline to the divs
	addOutline()
	
	// Create a right-click menu
	makeContextMenu("create");  // needs to happen after divs are created
	
	// convert class="linkTo" to an anchor link -- D2L does not allow you to make links using a hash tag (#)
	/*addAnchorLink(); --deprecated -- all functionality is now in createInPageLinks() */
	
	// set up onclick functionality for "anchor" links (needed because page exists in an iframe)
	createInPageLinks();
	
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
	initNumOfDivs = divElements.length;
	
	for(i=0; i<initNumOfDivs; i++)   // could do while(divElement[0])
	{
		/* Since we are always removing the previous [div], we are always dealing with the first [div]
			of the remaining [div], hence [0] is always used (unintuitive, I know -- its JavaScript) */
			
		// get information inside the div and save it to a temp variable
		divContent = divElements[0].innerHTML
		
		// copy the content of the [div] before the [div] 
		divElements[0].insertAdjacentHTML("beforebegin", divContent);
		
		// remove the [div]
		divElements[0].parentElement.removeChild(divElements[0]);
	}
}

/* Whenever an in-page jump is made, a return link will appear in the
	element that returns you to the previous positioin */
function createReturnLink()
{
	// create a return link to the position in page the user was at before making the jump
	returnLink = document.createElement("a");
	returnLink.innerHTML += "Go back to previous location";
	returnLink.href = "";
	returnLink.id = "returnLink";
	returnLink.className = "linkback";
	returnLink.style.display = "none";
	returnLink.onclick = function()
	{
		goBackToPrevLocation();
		return false;		// stops the page from reloading -- unsure why!
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
		changeSize(flexImage[i], "minimize")
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
		newDiv.classList.add("contentDiv");			// add a class name to the div
					
		// get title from element -- tranfer to new div
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
			newDiv.classList.add("title");
		}
		else if(elementType == "H2")
		{	
			// add the class "h2Div" to div with H2
			newDiv.classList.add("h2Div");
			
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
			
			// Check to see if the previous sibling (div with H2 or H3) has class "nonlinear"
			// if so -- then this div should also be class "nonlinear"
			if(newDiv.previousElementSibling.className != "" &&
				(newDiv.previousElementSibling.classList.contains("nonlinear") ))
			{
				newDiv.classList.add("nonlinear");
			}
		}	

		// figure out what the next div is -- basically this determines
		// if this content is the middle or end of a section 
		if(elementType != "H1" && 
				(currentElement.nextElementSibling == null ||
				 currentElement.nextElementSibling.tagName == "H2" ||
				 currentElement.nextElementSibling.tagName == "DIV" ))
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
	returnLink.style.display = "none";	// make the return link disappear

	// scroll the page vertically to the position the page was
	// at when the link was originally clicked (stored as a global variable)
	window.parent.scrollTo(leftPos, scrollTopPosition);
	return false;	// so the page does not reload (don't ask why!)
}

/* Finds all elements with class "linkTo" and adds a pseudo-anchor link--
Two issues here
1) D2L does not allow the user to use an anchor link as a hyperlink hence the workaround
using classes 
2) page exists in an iframe -- hence we need to scroll to the anchor as opposed to linking to it
*/ 
function createInPageLinks()
{
	linkElements = encapObject.getElementsByClassName("linkTo");
	
	/*
		Essentially we are going 
			from		
		<p class="linkTo" id="link-to-here"> I am the content </p>
			to
		<p class="linkTo" id="link-to-here"> <a href="#to-here"> I am the content </a> </p>
		
		actually want
		<p class="linkTo" id="link-to-here" onclick="scrollHere()"> I am the content </p>
		
	}*/
	for(i=0; i<linkElements.length; i++)	
	{
		// get id of figure you are refering to (this.id - "fig-")
		if(linkElements[i].title == "") // old way of doing things -- deprecated
		{	
			linkToId = linkElements[i].id.slice(2);  // this line remove the "l-" part of the id (which is 5 characters)
		}
		else
		{
			linkToId = linkElements[i].title;
		}
		
		// find the element to link to (assumming linkToId is valid)
		if(linkToId)  // make sure the value exists
		{
			linkToElement = encapObject.querySelector("#" + linkToId); // getElementById(linkToId);
		}
		
		if(linkToElement) // if there is an element to link to
		{
			// go to scrollToElement() function when the anchor is clicked
			linkElements[i].onclick = scrollToElementReturn(linkToElement.id);
		}
		else if(linkElements[i].innerText.trim() != "") // there is content but an invalid link -- add warning to text
		{
			linkElements[i].innerText += " ***Link does not exist***"
		}
		else // no content and no link element -- likely a editor issue -- do nothing right now
		{
			
		}
	}
}
	
	/* link to external CSS file 
		This is in the javascript because D2L will rewrite links in the HTML file */
function addStyleSheet()
{
	var CSSFile = document.createElement("link");
	scripts = document.getElementsByTagName("script");
	for(i=0; i<scripts.length; i++)
	{
		if(scripts[i].src.includes("module.js"))
		{
			cssFile = scripts[i].src.slice(0,-2) + "css";
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
		if(equations[i].innerText.trim() != "")  // there is text in the caption
		{
			equations[i].innerHTML = "( " + (i+1) + " )";
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
		captionLines[i].classList.add("caption");	
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
		codeLines[i].innerHTML = "  " + codeLines[i].innerHTML;  // innerText was stripping [span]
			
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
			if(!codeBlockDiv.classList.contains("partial") &&
				!codeBlockDiv.classList.contains("text"))
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
			// check if this is a partial codeblock or a full codeblock
			if(!codeBlockDiv.classList.contains("partial") &&
				!codeBlockDiv.classList.contains("text"))
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

/* takes
<p><img src="ImgSrc"></p>
<p class="caption">Caption text </p>

and converts it to

<figure>
	<img src="ImgSrc">
	<figCaption">Caption text </figCaption>
</figure>
*/
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
	*/
	for(i=0; i<imagesInPage.length; i++)
	{	
		// trying to find the paragraph [p] parent of the image --
		// the problem is that there might be [b], [i], or [span] ancestors in the way
		parElement = imagesInPage[i].parentElement;

		while(parElement && parElement.tagName != "P")
		{
			parElement = parElement.parentElement;
		}
		
		/*** Add error onscreen if parent [p] not found?? ***/
		// first make sure that we actally got an element and not end-of-page
		if(parElement)  
		{
			/* need to find a class="caption" element in the next element sibling's descendants
			   again, same issue as before where you should have
			      [p class="caption"] 
					but could have
					[p][span][b][i][span class="caption"]    */
					
			if(parElement.nextElementSibling)  // if there is a next sibling
			{
				capElement = parElement.nextElementSibling;  // go to the next sibling (likely a [p])
			
				while(capElement.childElementCount != 0 && !(capElement.classList.contains("caption")))
				{
					capElement = capElement.childNodes[0];
				}

				/*** Add error onscreen if caption not found?? ***/
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
		if(editURL != "")
		{
			menuItem = document.createElement("menuitem");
			menuItem.label = "Edit Page";
			menuItem.onclick = function() { window.open(editURL, "_blank") };
			contextMenu.appendChild(menuItem);
		}

		// add an map of the lesson to the context menu
		submenu = document.createElement("menu");
		submenu.label = "Page Map";

			divsInPage = encapObject.getElementsByClassName("contentDiv");
			divID = new Array();
			for(i=1; i<divsInPage.length; i++)  // skip the title
			{
				if(divsInPage[i].id == "")
				{
					// the id of the div is "div#.#" with the #'s matching the ouline.
					divsInPage[i].id = "div" + parseFloat(divsInPage[i].textContent);
				}
				divID = divsInPage[i].id;		

				mapItem = document.createElement("menuitem");
				mapItem.label = divsInPage[i].dataTitle;
				mapItem.onclick = scrollToElementReturn(divID);
				submenu.appendChild(mapItem);								
			}

		contextMenu.appendChild(submenu);

		encapObject.appendChild(contextMenu);
	}
	else // for all other browsers -- eventually would like to combine with above code
	{
		if(funct == "create")
		{
			var elemDiv = document.createElement('div');
			elemDiv.id = "rightClickDiv";
			elemDiv.classList.add("rcMenu");

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
			
			var menuItem4 = document.createElement('a');	
			oldURL = String(window.parent.location);  // otherwise you will edit the URL
			newURL = oldURL.replace("viewContent", "contentFile"); 
			newURL = newURL.replace("View", "EditFile?fm=0"); 
			menuItem4.href = newURL; //newURL;
			menuItem4.target = "_parent";
			menuItem4.innerHTML = "Edit Page";
			menuItem4.style.display = "block";
			elemDiv.appendChild(menuItem4);
			
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

/* finds all figure references in the page and add the correct numerical reference */
function figureReferences()
{
	var figRefInPage = encapObject.getElementsByClassName("figureRef");

	for(i=0; i<figRefInPage.length; i++)
	{
		// uses id with extra characters (c-) at beginning
		figureID = figRefInPage[i].id.slice(2);

		// check if the title refers to a legitimate ID for a caption in the page
		/*if(figRefInPage[i].innerText.trim() != "" &&
			document.getElementById(figureID) && 
			document.getElementById(figureID).nextElementSibling && 
			document.getElementById(figureID).nextElementSibling.tagName == "FIGCAPTION")	
			
		Check if:
		1) there is text in the figureRef (e.g., it is not an accidental figureRef)
		2) the id of figureRef (minus first two characters) is an id of a caption 
		3) the id is of class caption (or a parent -- this is the D2L issue where [span] can turn up where not wanted --
			-- not going to implement this yet.
		4) the caption has non-white space text 		
		*/
		if(figRefInPage[i].innerText.trim() != "" &&
			encapObject.querySelector("#" + figureID) &&   // getElementById(figureID) && 
			encapObject.querySelector("#" + figureID).innerText.trim() != "")
		{
			caption = encapObject.querySelector("#" + figureID).innerText;
			strIndex = caption.indexOf(":");  // find the location of the first semicolon
			
			figRef = caption.slice(0, strIndex); // get "Fig. #"
			
			figRefInPage[i].innerText = figRef;	
		}
		else
		{
			figRefInPage[i].innerText = "Missing Fig.";
		}
	}
}

/* finds all figure references in the page and add the correct numerical reference */
function eqReferences()
{
	var eqRefInPage = encapObject.getElementsByClassName("eqRef");

	for(i=0; i<eqRefInPage.length; i++)
	{
		// Outside of D2L: uses id with extra characters (c-) at beginning
		eqID = eqRefInPage[i].id.slice(2);

		if(eqRefInPage[i].innerText.trim() != "" &&
			encapObject.querySelector("#" + eqID) &&   // getElementById(figureID) && 
			encapObject.querySelector("#" + eqID).innerText.trim() != "")
		{
			caption = encapObject.querySelector("#" + eqID).innerText;
			
			eqRef = caption.slice(1,-1); 
			
			eqRefInPage[i].innerText = "Eq. " + eqRef;	
		}
		else
		{
			eqRefInPage[i].innerText = "Missing Eq.";
		}
	}
}

function checkURLForPos()
{
	// In D2L, the page is inside an iframe -- so need to check the parent
	var urlString = parent.window.location.href;
	var url = new URL(urlString);
	var l1 = url.searchParams.get("l1");
	var l2 = url.searchParams.get("l2");

	// if no information came from the parent, check self
	if(l1 == null)
	{
		urlString = window.location.href;
		url = new URL(urlString);
		l1 = url.searchParams.get("l1");
		l2 = url.searchParams.get("l2");
	}
	
	if(l1 != null)
	{
		divID = "div" + l1;
		if(l2 != null && l2 != 0)
		{
			divID += "." + l2;
		}
		scrollToElement(divID);
	}
}

function scrollToElement(elementID)
{		
	var element = encapObject.querySelector("#" + elementID);  
	scrollTopPosition = window.parent.scrollY;  // save the value of the scroll position

	if (window.self !== window.top)  // we are in an iframe
	{
		// get iframes from the parent windows:
		parentIFrames = window.parent.document.getElementsByTagName("iframe");
		
		iframeOffset = 0; // default value if the iframe is not found (should be a debug value)
		
		// go through iframe to find which has the same source as this page (i.e., it holds this page)
		for(i=0; i<parentIFrames.length; i++)
		{
			if (window.location.href == parentIFrames[i].src) // this is the iframe that conatins the page
			{
				// get the offset of this iFrame in the parent window
				iframeOffset = parentIFrames[i].offsetTop; 
				break;  // don't need to check anymore iframes
			}
		}

		// get the amount of vertical space the header take -- this is D2L only
		if(window.parent.document.getElementById("d2l_minibar"))
		{
			headerHeight = window.parent.document.getElementById("d2l_minibar").offsetHeight;
		}
		else
		{
			headerHeight = 0;
		}
		
		// calc the vertical position of the linkTo element in the parent page
		totalScrollY = element.offsetTop + iframeOffset - headerHeight;

		// scroll the parent to the vertical position of the linkTo element
		window.parent.scrollTo(element.offsetLeft, totalScrollY);	
	}
	else
	{
		// no parent frame - scroll to location of linkTo element
		window.parent.scrollTo(element.offsetLeft, element.offsetTop);
	}

	// check if element is a div, if not, go to it's parent element (which should be a div)
	if(element.tagName != "DIV")
	{
		element = element.parentElement;
	}
	
	/** Don't need the return link! (huh??) ****/
	element.appendChild(returnLink);
	returnLink.style.display = "block";
}

function linksToNewWindow()
{
	links = encapObject.querySelectorAll('a');
	
	for(i=0; i<links.length; i++)
	{
		if(links[i].href.trim() != "" && !(links[i].classList.contains("sameWin")))
		{
			links[i].target = "_blank";
		}
		else
		{
			links[i].target = "_self";
		}
	}
}
/* Things to do
- check if there is content in the source file <done>
- create the divs in destination <done>
- check if div already exists in destination <done>
- allow user to control which sections get copied 
  - ALL, ALL_BUT_LINKS, CONTENT_ONLY, 
- create a mapping of section types to numbers (instead of using div1, div2...)
*/
