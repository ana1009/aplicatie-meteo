
export class HtmlLoader {

    // Method to load HTML content from a specified URL to a designated element.
    loadHtml(fetchFrom, loadTo) {

        // Creating a new XMLHttpRequest object to perform HTTP requests asynchronously.
        //  request ===  a cere date
        let xhr = new XMLHttpRequest();
           // Astea erau verbele principale
        // get -> ceri date (pentru citire)
        // post -> dai date (pentru scriere)

        // put  -> dai date (pewntru modificare totala)
        // patch -> dai date (pentru modificare partiala)
        // delete     -> dai niste date (pentru stergeere)

        // lab7 == root == /


        // Opening a connection to the specified URL using the HTTP GET method.
        xhr.open("GET", fetchFrom, true);

        // Setting up a callback function to be executed when the state of the XMLHttpRequest changes.
        // readystate -> daca sa terminat requestu
        // 0-5
        // noi verificam daca sa terminat reques  ( == 4 )
        //  200 -> success
        xhr.onreadystatechange = function () {
            // Checking if the request has been completed and the response has been received.
            if (xhr.readyState === 4 && xhr.status === 200) {
                // If the request is successful (status code 200), set the innerHTML of the specified element to the response text.
                document.getElementById(loadTo).innerHTML = xhr.responseText;
            }
        };

        // Sending the HTTP request.
        xhr.send();
        // 4 =="4"  -> true
        // 4 === "4"  -> false 
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    }
}
