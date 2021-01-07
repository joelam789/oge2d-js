
export class Loader {

    private static _cache: Map<string, Block> = new Map<string, Block>();
    private static _loadingPacks: Map<string, Array<zip.Entry>> = new  Map<string, Array<zip.Entry>>();

    static loadText(url: string, callback: (text: string)=>void) {
        let block = Loader._cache.get(url);
        if (block && block.text) {
            //console.log("load from cache: " + url);
            callback(block.text);
            return;
        }
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = (e) => {
            let code = (xhr.status + '')[0]; // make sure we get a successful response back.
            if (code !== '0' && code !== '2' && code !== '3') {
                callback("");
            } else {
                let text = xhr.responseText;
                if (text != undefined && text != null) {
                    callback(text);
                } else callback("");
            }
            
        };
        xhr.onerror = function() {
            callback("");
        }
        xhr.send();
    }
    static loadBuffer(url: string, callback: (buffer: ArrayBuffer)=>void) {
        let block = Loader._cache.get(url);
        if (block && block.buffer) {
            //console.log("load from cache: " + url);
            callback(block.buffer);
            return;
        }
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = (e) => {
            let code = (xhr.status + '')[0]; // make sure we get a successful response back.
            if (code !== '0' && code !== '2' && code !== '3') {
                callback(null);
            } else {
                callback(xhr.response);
            }
        };
        xhr.onerror = function() {
            callback(null);
        }
        xhr.send();
    }
    static loadBytes(url: string, callback: (bytes: Uint8Array)=>void) {
        let block = Loader._cache.get(url);
        if (block && block.u8array) {
            //console.log("load from cache: " + url);
            callback(block.u8array);
            return;
        }
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = (e) => {
            let code = (xhr.status + '')[0]; // make sure we get a successful response back.
            if (code !== '0' && code !== '2' && code !== '3') {
                callback(null);
            } else {
                callback(new Uint8Array(xhr.response));
            }
        };
        xhr.onerror = function() {
            callback(null);
        }
        xhr.send();
    }

    private static loadPackContent(url: string, cache: Map<string, Block>, callback: (loaded: Map<string, Block>)=>void) {
        let list = Loader._loadingPacks.get(url);
        let entry = list && list.length > 0 ? list.shift() : null;
        if (entry) {

            //console.log("unpacking " + url + " - " + (cache.size + 1) + "/" + (list.length + 1 + cache.size));

            entry.getData(new zip.BlobWriter('application/octet-binary'), (data) => {

                let block = new Block();
                block.blob = data;
                Loader._cache.set(entry.filename, block);
                cache.set(entry.filename, block);

                let ext = "";
                let pos = entry.filename.indexOf('.');
                if (pos > 0) ext = entry.filename.substr(pos).toLowerCase();
                if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".bmp") {
                    Loader.blobToBytes(block.blob, (bytes) => {
                        block.blob = null;
                        block.u8array = bytes;
                        Loader.loadPackContent(url, cache, callback);
                    });
                } else if (ext == ".mp3" || ext == ".m4a" || ext == ".ogg" || ext == ".aac" || ext == ".wav") {
                    Loader.blobToBuffer(block.blob, (buffer) => {
                        block.blob = null;
                        block.buffer = buffer;
                        Loader.loadPackContent(url, cache, callback);
                    });
                } else if (ext == ".atlas" || ext == ".json" || ext == ".js" 
                            || ext == ".html" || ext == ".css" || ext == ".txt") {
                    Loader.blobToText(block.blob, (text) => {
                        block.blob = null;
                        block.text = text;
                        Loader.loadPackContent(url, cache, callback);
                    });
                } else {
                    Loader.loadPackContent(url, cache, callback);
                }

            }, (current, total) => { // onprogress callback
                //console.log("processing: " + url + " - " + current + "/" + total);
            });
        } else {
            callback(cache);
        }
    }

    static loadPack(url: string, callback: (loaded: Map<string, Block>)=>void) {
        let cache: Map<string, Block> = new Map<string, Block>();
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = (e) => {
            let code = (xhr.status + '')[0]; // make sure we get a successful response back.
            if (code !== '0' && code !== '2' && code !== '3') {
                callback(null);
            } else {

                //console.log("unpacking " + url + " ... ");
                
                let bytes = new Uint8Array(xhr.response);

                // may do some custom operations on "bytes" here, e.g. simple decryption
                if (url.indexOf(".data") > 0) { // we assume the pack file is encrypted if it ends with ".data"
                    let keys = [111, 103, 101, 50, 100];
                    for (let k=0; k<bytes.length; k++) bytes[k] = bytes[k] ^ keys[k % keys.length];
                }
                
                // use a BlobReader to read the zip from a Blob object
                zip.createReader(new zip.BlobReader(new Blob([bytes])), (reader) => {
                    reader.getEntries((entries) => { // get all entries from the zip
                        if (entries == undefined || entries == null || entries.length <= 0) {
                            reader.close();
                            callback(null);
                            return;
                        }
                        //console.log(entries);
                        Loader._loadingPacks.set(url, []);
                        for (let entry of entries) Loader._loadingPacks.get(url).push(entry);
                        Loader.loadPackContent(url, cache, (loadedBlocks: Map<string, Block>)=> {
                            reader.close();
                            callback(loadedBlocks);
                        });
                    });
                }, (error) => { // onerror callback
                    //console.error("error found in processing: " + url);
                    console.error(error);
                    callback(null);
                    return;
                });
            }
        };
        xhr.onerror = function() {
            callback(null);
        }
        xhr.send();
    }

    // from https://github.com/google/closure-library  (Apache License v2)
    /**
     * Converts a JS string to a UTF-8 "byte" array.
     * @param {string} str 16-bit unicode string.
     * @return {!Array<number>} UTF-8 byte array.
     */
    static stringToUtf8ByteArray(str) {
        // TODO(user): Use native implementations if/when available
        let out = [], p = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 128) {
                out[p++] = c;
            } else if (c < 2048) {
                out[p++] = (c >> 6) | 192;
                out[p++] = (c & 63) | 128;
            } else if (
                ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
                ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
                // Surrogate Pair
                c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
                out[p++] = (c >> 18) | 240;
                out[p++] = ((c >> 12) & 63) | 128;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            } else {
                out[p++] = (c >> 12) | 224;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
        }
        return out;
    }

    // from https://github.com/google/closure-library  (Apache License v2)
    /**
     * Converts a UTF-8 byte array to JavaScript's 16-bit Unicode.
     * @param {Uint8Array|Array<number>} bytes UTF-8 byte array.
     * @return {string} 16-bit Unicode string.
     */
    static utf8ByteArrayToString(bytes: Uint8Array|Array<number>): string {
        // TODO(user): Use native implementations if/when available
        let out = [], pos = 0, c = 0;
        while (pos < bytes.length) {
            let c1 = bytes[pos++];
            if (c1 < 128) {
                out[c++] = String.fromCharCode(c1);
            } else if (c1 > 191 && c1 < 224) {
                let c2 = bytes[pos++];
                out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
            } else if (c1 > 239 && c1 < 365) {
                // Surrogate Pair
                let c2 = bytes[pos++];
                let c3 = bytes[pos++];
                let c4 = bytes[pos++];
                let u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 0x10000;
                out[c++] = String.fromCharCode(0xD800 + (u >> 10));
                out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
            } else {
                let c2 = bytes[pos++];
                let c3 = bytes[pos++];
                out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
            }
        }
        return out.join('');
    }

    static blobToBuffer(blob: Blob, callback: (result: ArrayBuffer)=>void) {
        let fileReader = new FileReader();
        fileReader.onload = () => callback(fileReader.result as ArrayBuffer);
        fileReader.readAsArrayBuffer(blob);
    }

    static blobToBytes(blob: Blob, callback: (result: Uint8Array)=>void) {
        return Loader.blobToBuffer(blob, (buffer) => callback(new Uint8Array(buffer)));
    }

    static blobToText(blob: Blob, callback: (result: string)=>void) {
        return Loader.blobToBytes(blob, (bytes) => callback(Loader.utf8ByteArrayToString(bytes)));
    }
}

export class Block {
    blob: Blob = null;
    text: string = null;
    u8array: Uint8Array = null;
    buffer: ArrayBuffer = null;
}
