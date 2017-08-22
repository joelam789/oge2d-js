// for now, we are using jquery (coz jquery has been included for bootstrap already) to send http requests...
// we might change to use "axios" or "whatwg-fetch(github/fetch)" or aurelia-fetch-client" if do not need jquery anymore

export class HttpClient {
    
    static getJSON(url: string, data?: any, callback?: (json: any)=>void, onerror?: (errmsg: string)=>void) {
        $.getJSON(url, data, (ret) => {
            if (callback != null) callback(ret);
        })
        .fail((jqxhr, textStatus, error) => {
            console.log(jqxhr);
            console.log(textStatus);
            console.log(error);
            if (onerror != null) onerror(textStatus);
        });
    }
    
}
